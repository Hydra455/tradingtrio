let trades=[],selectedTrader="all",previewFile=null;

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const num=v=>Number(v||0);
const fmtR=v=>`${num(v)>0?"+":""}${num(v).toFixed(2)}R`;
const cls=v=>num(v)>0?"positive":num(v)<0?"negative":"neutral";

async function boot(){
  try{
    const r=await fetch(`data/trades.json?v=${Date.now()}`);
    if(!r.ok) throw new Error("Could not load trades.json");
    trades=await r.json();
    initFilters();
    initAddForm();
    renderAll();
  }catch(e){
    console.error(e);
    $("#recentTrades").innerHTML=`<div class="empty-state">${esc(e.message)}</div>`;
  }
}

function initFilters(){
  const traders=[...new Set(trades.map(t=>t.trader))].sort();
  const sessions=[...new Set(trades.map(t=>t.session).filter(Boolean))].sort();
  const setups=[...new Set(trades.map(t=>t.setup).filter(Boolean))].sort();

  $("#globalTraderFilter").innerHTML=`<option value="all">All traders</option>`+traders.map(x=>`<option>${esc(x)}</option>`).join("");
  $("#fTrader").innerHTML=traders.map(x=>`<option>${esc(x)}</option>`).join("");

  $("#filterSession").innerHTML=`<option value="all">All sessions</option>`+sessions.map(x=>`<option>${esc(x)}</option>`).join("");
  $("#filterSetup").innerHTML=`<option value="all">All setups</option>`+setups.map(x=>`<option>${esc(x)}</option>`).join("");
}

function initAddForm(){
  $("#fDate").value=new Date().toISOString().slice(0,10);
  const dz=$("#dropZone"),inp=$("#imageInput");
  dz.onclick=()=>inp.click();
  dz.ondragover=e=>{e.preventDefault();};
  dz.ondrop=e=>{e.preventDefault(); if(e.dataTransfer.files[0]) loadPreview(e.dataTransfer.files[0]);};
  inp.onchange=()=>inp.files[0]&&loadPreview(inp.files[0]);
}

function loadPreview(file){
  if(!file.type.startsWith("image/")) return;
  previewFile=file;
  const url=URL.createObjectURL(file);
  $("#imagePreview").src=url;
  $("#imagePreview").hidden=false;
  $("#dropEmpty").hidden=true;
}

function activeTrades(){
  return selectedTrader==="all"?trades:trades.filter(t=>t.trader===selectedTrader);
}

function renderAll(){
  renderDashboard();
  renderJournal();
  renderAnalytics();
  renderTeam();
}

function stats(rows){
  const wins=rows.filter(t=>num(t.r)>0);
  const losses=rows.filter(t=>num(t.r)<0);
  const totalR=rows.reduce((a,t)=>a+num(t.r),0);
  const grossWin=wins.reduce((a,t)=>a+num(t.r),0);
  const grossLoss=Math.abs(losses.reduce((a,t)=>a+num(t.r),0));
  return{
    trades:rows.length,wins:wins.length,losses:losses.length,totalR,
    winRate:rows.length?wins.length/rows.length*100:0,
    avgR:rows.length?totalR/rows.length:0,
    pf:grossLoss?grossWin/grossLoss:(grossWin?Infinity:0)
  };
}

function renderDashboard(){
  const rows=activeTrades(),s=stats(rows);
  const now=new Date(),thisMonth=rows.filter(t=>{const d=new Date(t.date+"T00:00:00");return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()}).length;

  $("#kpiTrades").textContent=s.trades;
  $("#kpiTradesSub").textContent=`${thisMonth} this month`;
  $("#kpiWinRate").textContent=`${s.winRate.toFixed(1)}%`;
  $("#kpiWinSub").textContent=`${s.wins}W / ${s.losses}L`;
  $("#kpiTotalR").textContent=fmtR(s.totalR);
  $("#kpiTotalR").className=cls(s.totalR);
  $("#kpiAvgR").textContent=`Avg ${fmtR(s.avgR)}`;
  $("#kpiPF").textContent=s.pf===Infinity?"∞":s.pf.toFixed(2);

  const setups=aggregate(rows,"setup").sort((a,b)=>b.totalR-a.totalR).slice(0,5);
  $("#topSetups").innerHTML=setups.length?setups.map((x,i)=>`<div class="rank-row"><strong>${i+1}. ${esc(x.key)}</strong><span class="muted">${x.count} trades</span><strong class="${cls(x.totalR)}">${fmtR(x.totalR)}</strong></div>`).join(""):`<div class="empty-state">No data yet.</div>`;

  const recent=[...rows].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6);
  $("#recentTrades").innerHTML=recent.map(card).join("")||`<div class="empty-state">No trades yet.</div>`;
  bindCards();
  drawEquity(rows);
}

function renderJournal(){
  const q=$("#searchTrades").value.toLowerCase().trim();
  const rf=$("#filterResult").value,sf=$("#filterSession").value,stf=$("#filterSetup").value;
  let rows=activeTrades().filter(t=>{
    const hay=[t.symbol,t.setup,t.notes,t.mistakes,t.trader,...(t.tags||[])].join(" ").toLowerCase();
    const rv=num(t.r);
    return(!q||hay.includes(q)) &&
      (rf==="all"||(rf==="win"&&rv>0)||(rf==="loss"&&rv<0)||(rf==="be"&&rv===0)) &&
      (sf==="all"||t.session===sf) &&
      (stf==="all"||t.setup===stf);
  });
  rows.sort((a,b)=>new Date(b.date)-new Date(a.date));
  $("#journalGrid").innerHTML=rows.map(card).join("")||`<div class="empty-state">No matching trades.</div>`;
  bindCards();
}

function renderAnalytics(){
  const rows=activeTrades();
  renderMetric("#analyticsSetup",aggregate(rows,"setup"));
  renderMetric("#analyticsSession",aggregate(rows,"session"));
  renderMetric("#analyticsSymbol",aggregate(rows,"symbol"));
  renderMetric("#analyticsWeekday",aggregateComputed(rows,t=>weekday(t.date)));
  renderMetric("#analyticsGrade",aggregate(rows,"grade"));
  renderMetric("#analyticsPlan",aggregateComputed(rows,t=>t.followedPlan?"Followed plan":"Broke plan"));
}

function aggregate(rows,field){return aggregateComputed(rows,t=>t[field]||"Unspecified")}
function aggregateComputed(rows,getKey){
  const m=new Map();
  rows.forEach(t=>{
    const key=getKey(t)||"Unspecified";
    if(!m.has(key))m.set(key,{key,count:0,wins:0,totalR:0});
    const x=m.get(key);x.count++;x.totalR+=num(t.r);if(num(t.r)>0)x.wins++;
  });
  return[...m.values()].map(x=>({...x,wr:x.count?x.wins/x.count*100:0}));
}
function renderMetric(sel,rows){
  rows.sort((a,b)=>b.totalR-a.totalR);
  $(sel).innerHTML=rows.map(x=>`<div class="metric-row"><strong>${esc(x.key)}</strong><span class="muted">${x.count} trades · ${x.wr.toFixed(0)}% WR</span><strong class="${cls(x.totalR)}">${fmtR(x.totalR)}</strong></div>`).join("")||`<div class="empty-state">No data yet.</div>`;
}

function renderTeam(){
  const names=[...new Set(trades.map(t=>t.trader))].sort();
  $("#teamCards").innerHTML=names.map(name=>{
    const s=stats(trades.filter(t=>t.trader===name));
    return `<article class="team-card"><h3>${esc(name)}</h3><div class="team-stats">
      <div class="team-stat"><span>Trades</span><strong>${s.trades}</strong></div>
      <div class="team-stat"><span>Win Rate</span><strong>${s.winRate.toFixed(1)}%</strong></div>
      <div class="team-stat"><span>Total R</span><strong class="${cls(s.totalR)}">${fmtR(s.totalR)}</strong></div>
      <div class="team-stat"><span>Avg R</span><strong class="${cls(s.avgR)}">${fmtR(s.avgR)}</strong></div>
    </div></article>`;
  }).join("");

  const board=names.map(name=>({name,...stats(trades.filter(t=>t.trader===name))})).sort((a,b)=>b.totalR-a.totalR);
  $("#leaderboard").innerHTML=board.map((x,i)=>`<div class="leader-row"><strong>#${i+1} ${esc(x.name)}</strong><span class="muted">${x.winRate.toFixed(1)}% WR · ${x.trades} trades</span><strong class="${cls(x.totalR)}">${fmtR(x.totalR)}</strong></div>`).join("");
}

function card(t){
  const tags=(t.tags||[]).slice(0,3).map(x=>`<span class="tag">${esc(x)}</span>`).join("");
  return `<article class="trade-card" data-id="${esc(t.id)}">
    <img src="${esc(t.image)}" alt="${esc(t.symbol)} trade" onerror="this.src='assets/img/placeholder.svg'">
    <div class="trade-body">
      <div class="trade-head"><h3>${esc(t.symbol)} · ${esc(String(t.direction).toUpperCase())}</h3><span class="result ${cls(t.r)}">${fmtR(t.r)}</span></div>
      <div class="trade-meta">${esc(t.trader)} · ${esc(t.date)} · ${esc(t.session||"")}</div>
      <div class="tags"><span class="tag">${esc(t.setup)}</span>${tags}</div>
    </div></article>`;
}

function bindCards(){
  $$(".trade-card").forEach(c=>c.onclick=()=>{
    const t=trades.find(x=>String(x.id)===c.dataset.id); if(!t)return;
    $("#modalImage").src=t.image;
    $("#modalImage").onerror=function(){this.src="assets/img/placeholder.svg"};
    $("#modalBody").innerHTML=`
      <div class="trade-head"><h2>${esc(t.symbol)} · ${esc(String(t.direction).toUpperCase())}</h2><span class="result ${cls(t.r)}">${fmtR(t.r)}</span></div>
      <div class="trade-meta">${esc(t.trader)} · ${esc(t.date)} · ${esc(t.session||"")} · Grade ${esc(t.grade||"—")}</div>
      <div class="tags"><span class="tag">${esc(t.setup)}</span>${(t.tags||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>
      <span class="discipline ${t.followedPlan?"positive":"negative"}">${t.followedPlan?"✓ Followed plan":"✕ Broke plan"}</span>
      <p class="modal-notes"><strong>Notes:</strong><br>${esc(t.notes||"No notes.")}</p>
      ${t.mistakes?`<p class="modal-notes"><strong>Mistakes:</strong><br>${esc(t.mistakes)}</p>`:""}`;
    $("#tradeModal").classList.remove("hidden");
  })
}

function drawEquity(rows){
  const canvas=$("#equityChart"),ctx=canvas.getContext("2d"),ratio=window.devicePixelRatio||1,w=canvas.clientWidth||700,h=220;
  canvas.width=w*ratio;canvas.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
  const sorted=[...rows].sort((a,b)=>new Date(a.date)-new Date(b.date));let run=0;const pts=[0,...sorted.map(t=>(run+=num(t.r)))];
  if(pts.length<2){ctx.fillStyle="#91a0b3";ctx.font="13px sans-serif";ctx.fillText("Add trades to build your equity curve.",14,26);return}
  const min=Math.min(...pts,0),max=Math.max(...pts,0),range=Math.max(max-min,1),pad=18;
  const X=i=>pad+i*((w-pad*2)/(pts.length-1)),Y=v=>h-pad-((v-min)/range)*(h-pad*2);
  ctx.strokeStyle="#223041";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad,Y(0));ctx.lineTo(w-pad,Y(0));ctx.stroke();
  ctx.strokeStyle="#77f0b0";ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(X(i),Y(p)):ctx.moveTo(X(i),Y(p)));ctx.stroke();
}

function weekday(date){return["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date(date+"T00:00:00").getDay()]}

function slug(s){return String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
$("#tradeForm").onsubmit=e=>{
  e.preventDefault();
  const trader=$("#fTrader").value,date=$("#fDate").value,symbol=$("#fSymbol").value.trim().toUpperCase();
  const ext=previewFile?.name?.split(".").pop()?.toLowerCase()||"png";
  const traderFolder=slug(trader).replace("friend-1","friend1").replace("friend-2","friend2");
  const filename=`${date}-${slug(symbol)}-${$("#fDirection").value.toLowerCase()}.${ext}`;
  const imagePath=`images/${traderFolder}/${filename}`;
  const entry={
    id:`${slug(trader)}-${date}-${slug(symbol)}-${Date.now().toString().slice(-5)}`,
    trader,date,symbol,direction:$("#fDirection").value,
    r:Number($("#fR").value),
    setup:$("#fSetup").value.trim(),
    session:$("#fSession").value,
    grade:$("#fGrade").value,
    followedPlan:$("#fPlan").value==="true",
    tags:$("#fTags").value.split(",").map(x=>x.trim()).filter(Boolean),
    notes:$("#fNotes").value.trim(),
    mistakes:$("#fMistakes").value.trim(),
    image:imagePath
  };
  $("#exportImagePath").textContent=imagePath;
  $("#exportJson").textContent=JSON.stringify(entry,null,2);
  $("#exportEmpty").hidden=true;$("#exportReady").hidden=false;
};

$("#clearForm").onclick=()=>{
  $("#tradeForm").reset();$("#fDate").value=new Date().toISOString().slice(0,10);
  previewFile=null;$("#imagePreview").hidden=true;$("#imagePreview").src="";$("#dropEmpty").hidden=false;
  $("#exportReady").hidden=true;$("#exportEmpty").hidden=false;
};
$$("[data-copy]").forEach(b=>b.onclick=async()=>{await navigator.clipboard.writeText($("#"+b.dataset.copy).textContent);b.textContent="Copied";setTimeout(()=>b.textContent="Copy JSON",1200)});

function activate(view){
  $$(".view").forEach(v=>v.classList.remove("active"));$("#"+view+"View").classList.add("active");
  $$(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===view));
  $("#pageTitle").textContent={dashboard:"Dashboard",journal:"Journal",analytics:"Analytics",team:"Team",add:"Add Trade"}[view];
  if(view==="dashboard")requestAnimationFrame(()=>drawEquity(activeTrades()));
}
$$(".nav-item").forEach(n=>n.onclick=()=>activate(n.dataset.view));
$$("[data-view-jump]").forEach(n=>n.onclick=()=>activate(n.dataset.viewJump));
$("#globalTraderFilter").onchange=e=>{selectedTrader=e.target.value;renderAll()};
["#searchTrades","#filterResult","#filterSession","#filterSetup"].forEach(sel=>$(sel).addEventListener(sel==="#searchTrades"?"input":"change",renderJournal));
$$("[data-modal-close]").forEach(x=>x.onclick=()=>$("#tradeModal").classList.add("hidden"));
window.onkeydown=e=>{if(e.key==="Escape")$("#tradeModal").classList.add("hidden")};
window.onresize=()=>{$("#dashboardView").classList.contains("active")&&drawEquity(activeTrades())};
boot();
