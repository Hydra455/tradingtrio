window.TRADINGTRIO_BUILD='2.5.3';
window.__ttImageUrls = window.__ttImageUrls || new Map();
let trades=[],selectedTrader='all',previewFile=null,currentPayload=null;
let currentGithubUser=null,currentTrader=null,membersConfig={members:[]};
window.__ttImageUrls = window.__ttImageUrls || new Map();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const num=v=>Number(v||0), fmtR=v=>`${num(v)>0?'+':''}${num(v).toFixed(2)}R`, cls=v=>num(v)>0?'positive':num(v)<0?'negative':'neutral';


let ttMarketTab='calendar';
function ttSetMarketTab(tab){
  ttMarketTab=tab;
  $$('.market-tab').forEach(x=>x.classList.toggle('active',x.dataset.marketTab===tab));
  $('#marketCalendarPanel').hidden=tab!=='calendar';
  $('#marketNewsPanel').hidden=tab!=='news';
  $('#marketSourceNote').textContent=tab==='calendar'?'TradingView Economic Calendar':'TradingView Top Stories';
}

async function boot(){
  loadTheme();loadGitHubSettings();
  try{
    const [tradeRes,memberRes]=await Promise.all([
      fetch(`data/trades.json?v=${Date.now()}`),
      fetch(`data/members.json?v=${Date.now()}`)
    ]);
    if(!tradeRes.ok)throw new Error('Could not load trades.json');
    trades=await tradeRes.json();
    membersConfig=memberRes.ok?await memberRes.json():{members:[{trader:'Denis',github:''},{trader:'Nel',github:''},{trader:'Alex',github:''}]};
    initFilters();initAddForm();renderAll();
    if(getGitHubSettings().token) await detectGithubIdentity(false);
  }catch(e){console.error(e);$('#recentTrades').innerHTML=`<div class="empty-state">${esc(e.message)}</div>`}
}

function loadTheme(){setTheme(localStorage.getItem('tt_theme')||'vice')}
function setTheme(theme){document.body.dataset.theme=theme;localStorage.setItem('tt_theme',theme);$$('.theme-btn').forEach(b=>b.classList.toggle('active',b.dataset.themeChoice===theme));requestAnimationFrame(()=>drawEquity(activeTrades()))}
$$('.theme-btn').forEach(b=>b.onclick=()=>setTheme(b.dataset.themeChoice));

function initFilters(){const people=['Denis','Nel','Alex'],sessions=[...new Set(trades.map(t=>t.session).filter(Boolean))].sort(),setups=[...new Set(trades.map(t=>t.setup).filter(Boolean))].sort();$('#globalTraderFilter').innerHTML='<option value="all">All traders</option>'+people.map(x=>`<option>${x}</option>`).join('');$('#filterSession').innerHTML='<option value="all">All sessions</option>'+sessions.map(x=>`<option>${esc(x)}</option>`).join('');$('#filterSetup').innerHTML='<option value="all">All setups</option>'+setups.map(x=>`<option>${esc(x)}</option>`).join('')}
function initAddForm(){if(!$('#fDate').value)$('#fDate').value=new Date().toISOString().slice(0,10);const dz=$('#dropZone'),inp=$('#imageInput');dz.onclick=()=>inp.click();dz.ondragover=e=>{e.preventDefault();dz.style.transform='scale(1.005)'};dz.ondragleave=()=>dz.style.transform='';dz.ondrop=e=>{e.preventDefault();dz.style.transform='';if(e.dataTransfer.files[0])loadPreview(e.dataTransfer.files[0])};inp.onchange=()=>inp.files[0]&&loadPreview(inp.files[0])}
function loadPreview(file){if(!file.type.startsWith('image/'))return;previewFile=file;$('#imagePreview').src=URL.createObjectURL(file);$('#imagePreview').hidden=false;$('#dropEmpty').hidden=true;buildPayload()}
function activeTrades(){return selectedTrader==='all'?trades:trades.filter(t=>t.trader===selectedTrader)}
function stats(rows){const wins=rows.filter(t=>num(t.r)>0),losses=rows.filter(t=>num(t.r)<0),totalR=rows.reduce((a,t)=>a+num(t.r),0),grossWin=wins.reduce((a,t)=>a+num(t.r),0),grossLoss=Math.abs(losses.reduce((a,t)=>a+num(t.r),0)),riskVolume=grossWin+grossLoss,rWeightedWinRate=riskVolume?grossWin/riskVolume*100:0;return{trades:rows.length,wins:wins.length,losses:losses.length,totalR,winRate:rWeightedWinRate,avgR:rows.length?totalR/rows.length:0,pf:grossLoss?grossWin/grossLoss:(grossWin?Infinity:0),grossWin,grossLoss}}
function renderAll(){renderDashboard();renderJournal();renderAnalytics();renderTeam()}
function renderDashboard(){const rows=activeTrades(),s=stats(rows),now=new Date(),thisMonth=rows.filter(t=>{const d=new Date(t.date+'T00:00:00');return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()}).length;$('#kpiTrades').textContent=s.trades;$('#kpiTradesSub').textContent=`${thisMonth} this month`;$('#kpiWinRate').textContent=`${s.winRate.toFixed(1)}%`;$('#kpiWinSub').textContent=`${fmtR(s.grossWin)} won / ${fmtR(-s.grossLoss)} lost · ${s.wins}W/${s.losses}L`;$('#kpiTotalR').textContent=fmtR(s.totalR);$('#kpiTotalR').className=cls(s.totalR);$('#kpiAvgR').textContent=`Avg ${fmtR(s.avgR)}`;$('#kpiPF').textContent=s.pf===Infinity?'∞':s.pf.toFixed(2);const setups=aggregate(rows,'setup').sort((a,b)=>b.totalR-a.totalR).slice(0,5);$('#topSetups').innerHTML=setups.length?setups.map((x,i)=>`<div class="rank-row"><strong>${i+1}. ${esc(x.key)}</strong><span class="muted">${x.count} trades</span><strong class="${cls(x.totalR)}">${fmtR(x.totalR)}</strong></div>`).join(''):'<div class="empty-state">No data yet.</div>';const recent=[...rows].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6);$('#recentTrades').innerHTML=recent.map(card).join('')||'<div class="empty-state">No trades yet.</div>';bindCards();drawEquity(rows)}
function renderJournal(){const q=$('#searchTrades').value.toLowerCase().trim(),rf=$('#filterResult').value,sf=$('#filterSession').value,stf=$('#filterSetup').value;let rows=activeTrades().filter(t=>{const hay=[t.symbol,t.setup,t.notes,t.mistakes,t.trader,...(t.tags||[])].join(' ').toLowerCase(),rv=num(t.r);return(!q||hay.includes(q))&&(rf==='all'||(rf==='win'&&rv>0)||(rf==='loss'&&rv<0)||(rf==='be'&&rv===0))&&(sf==='all'||t.session===sf)&&(stf==='all'||t.setup===stf)});rows.sort((a,b)=>new Date(b.date)-new Date(a.date));$('#journalGrid').innerHTML=rows.map(card).join('')||'<div class="empty-state">No matching trades.</div>';bindCards()}
function aggregate(rows,field){return aggregateComputed(rows,t=>t[field]||'Unspecified')}
function aggregateComputed(rows,getKey){const m=new Map();rows.forEach(t=>{const key=getKey(t)||'Unspecified';if(!m.has(key))m.set(key,{key,count:0,wins:0,totalR:0,grossWin:0,grossLoss:0});const x=m.get(key),r=num(t.r);x.count++;x.totalR+=r;if(r>0){x.wins++;x.grossWin+=r}else if(r<0){x.grossLoss+=Math.abs(r)}});return[...m.values()].map(x=>{const volume=x.grossWin+x.grossLoss;return{...x,wr:volume?x.grossWin/volume*100:0}})}
function renderMetric(sel,rows){rows.sort((a,b)=>b.totalR-a.totalR);$(sel).innerHTML=rows.map(x=>`<div class="metric-row"><strong>${esc(x.key)}</strong><span class="muted">${x.count} trades · ${x.wr.toFixed(0)}% WR</span><strong class="${cls(x.totalR)}">${fmtR(x.totalR)}</strong></div>`).join('')||'<div class="empty-state">No data yet.</div>'}
function weekday(date){return['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(date+'T00:00:00').getDay()]}
function renderAnalytics(){const rows=activeTrades();renderMetric('#analyticsSetup',aggregate(rows,'setup'));renderMetric('#analyticsSession',aggregate(rows,'session'));renderMetric('#analyticsSymbol',aggregate(rows,'symbol'));renderMetric('#analyticsWeekday',aggregateComputed(rows,t=>weekday(t.date)));renderMetric('#analyticsGrade',aggregate(rows,'grade'));renderMetric('#analyticsPlan',aggregateComputed(rows,t=>t.followedPlan?'Followed plan':'Broke plan'))}
function renderTeam(){const names=['Denis','Nel','Alex'];$('#teamCards').innerHTML=names.map(name=>{const s=stats(trades.filter(t=>t.trader===name));return `<article class="team-card"><h3>${name}</h3><div class="team-stats"><div class="team-stat"><span>Trades</span><strong>${s.trades}</strong></div><div class="team-stat"><span>R Win Rate</span><strong>${s.winRate.toFixed(1)}%</strong></div><div class="team-stat"><span>Total R</span><strong class="${cls(s.totalR)}">${fmtR(s.totalR)}</strong></div><div class="team-stat"><span>Avg R</span><strong class="${cls(s.avgR)}">${fmtR(s.avgR)}</strong></div></div></article>`}).join('');const board=names.map(name=>({name,...stats(trades.filter(t=>t.trader===name))})).sort((a,b)=>b.totalR-a.totalR);$('#leaderboard').innerHTML=board.map((x,i)=>`<div class="leader-row"><strong>#${i+1} ${x.name}</strong><span class="muted">${x.winRate.toFixed(1)}% WR · ${x.trades} trades</span><strong class="${cls(x.totalR)}">${fmtR(x.totalR)}</strong></div>`).join('')}
function card(t){const tags=(t.tags||[]).slice(0,3).map(x=>`<span class="tag">${esc(x)}</span>`).join('');const imageSrc=window.__ttImageUrls.get(t.id)||t.image;
  return `<article class="trade-card" data-id="${esc(t.id)}"><img src="${esc(imageSrc)}" alt="${esc(t.symbol)} trade screenshot" onerror="this.src='assets/img/placeholder.svg'"><div class="trade-body"><div class="trade-head"><h3>${esc(t.symbol)} · ${esc(String(t.direction).toUpperCase())}</h3><span class="result ${cls(t.r)}">${fmtR(t.r)}</span></div><div class="trade-meta">${esc(t.trader)} · ${esc(t.date)} · ${esc(t.session||'')}</div><div class="tags"><span class="tag">${esc(t.setup)}</span>${tags}</div></div></article>`}
function bindCards(){
  $$(".trade-card").forEach(c=>c.onclick=()=>{
    const t=trades.find(x=>String(x.id)===c.dataset.id);if(!t)return;
    $("#modalImage").src=(window.__ttImageUrls?.get(t.id)||t.image);
    $("#modalImage").onerror=function(){this.src="assets/img/placeholder.svg"};
    const canManage=!!currentTrader && t.trader===currentTrader;
    $("#modalBody").innerHTML=`
      <div class="trade-head"><h2>${esc(t.symbol)} · ${esc(String(t.direction).toUpperCase())}</h2><span class="result ${cls(t.r)}">${fmtR(t.r)}</span></div>
      <div class="trade-meta">${esc(t.trader)} · ${esc(t.date)} · ${esc(t.session||"")} · Grade ${esc(t.grade||"—")}</div>
      <div class="tags"><span class="tag">${esc(t.setup)}</span>${(t.tags||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>
      <span class="discipline ${t.followedPlan?"positive":"negative"}">${t.followedPlan?"✓ Followed plan":"✕ Broke plan"}</span>
      <p class="modal-notes"><strong>Notes:</strong><br>${esc(t.notes||"No notes.")}</p>
      ${t.mistakes?`<p class="modal-notes"><strong>Mistakes:</strong><br>${esc(t.mistakes)}</p>`:""}
      ${canManage?`<div class="trade-actions"><button class="manage-btn" id="editThisTrade">Edit Trade</button><button class="manage-btn danger-btn" id="deleteThisTrade">Delete Trade</button></div>`:""}
    `;
    $("#tradeModal").classList.remove("hidden");
    if(canManage){
      $("#editThisTrade").onclick=()=>openEditTrade(t.id);
      $("#deleteThisTrade").onclick=()=>deleteTradeById(t.id,true);
    }
  })
}
function drawEquity(rows){const canvas=$('#equityChart');if(!canvas)return;const ctx=canvas.getContext('2d'),ratio=window.devicePixelRatio||1,w=canvas.clientWidth||700,h=220;canvas.width=w*ratio;canvas.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);const sorted=[...rows].sort((a,b)=>new Date(a.date)-new Date(b.date));let run=0;const pts=[0,...sorted.map(t=>(run+=num(t.r)))];if(pts.length<2){ctx.fillStyle='#9f95ad';ctx.font='13px sans-serif';ctx.fillText('Add trades to build your equity curve.',14,26);return}const min=Math.min(...pts,0),max=Math.max(...pts,0),range=Math.max(max-min,1),pad=18,X=i=>pad+i*((w-pad*2)/(pts.length-1)),Y=v=>h-pad-((v-min)/range)*(h-pad*2),styles=getComputedStyle(document.body),accent=styles.getPropertyValue('--accent').trim(),accent2=styles.getPropertyValue('--accent2').trim();ctx.strokeStyle='rgba(255,255,255,.10)';ctx.beginPath();ctx.moveTo(pad,Y(0));ctx.lineTo(w-pad,Y(0));ctx.stroke();const grad=ctx.createLinearGradient(0,0,w,0);grad.addColorStop(0,accent);grad.addColorStop(1,accent2);ctx.strokeStyle=grad;ctx.lineWidth=2.8;ctx.shadowColor=accent;ctx.shadowBlur=14;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(X(i),Y(p)):ctx.moveTo(X(i),Y(p)));ctx.stroke();ctx.shadowBlur=0}

function slug(s){return String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function buildPayload(){const trader=currentTrader||'',date=$('#fDate').value||new Date().toISOString().slice(0,10),symbol=$('#fSymbol').value.trim().toUpperCase()||'NQ',ext=(previewFile?.name?.split('.').pop()?.toLowerCase()||'png').replace('jpeg','jpg'),stamp=Date.now().toString().slice(-6),filename=`${date}-${slug(symbol)}-${$('#fDirection').value.toLowerCase()}-${stamp}.${ext}`,imagePath=`images/${slug(trader)}/${filename}`;currentPayload={id:`${slug(trader)}-${date}-${slug(symbol)}-${stamp}`,trader,date,symbol,direction:$('#fDirection').value,r:Number($('#fR').value||0),setup:$('#fSetup').value.trim()||'Unspecified',session:$('#fSession').value,grade:$('#fGrade').value,followedPlan:$('#fPlan').value==='true',tags:$('#fTags').value.split(',').map(x=>x.trim()).filter(Boolean),notes:$('#fNotes').value.trim(),mistakes:$('#fMistakes').value.trim(),image:imagePath};$('#exportImagePath').textContent=imagePath;$('#exportJson').textContent=JSON.stringify(currentPayload,null,2);$('#exportEmpty').hidden=true;$('#exportReady').hidden=false;return currentPayload}
['#fDate','#fSymbol','#fDirection','#fSession','#fR','#fSetup','#fGrade','#fPlan','#fTags','#fNotes','#fMistakes'].forEach(sel=>$(sel).addEventListener(['#fSymbol','#fR','#fSetup','#fTags','#fNotes','#fMistakes'].includes(sel)?'input':'change',()=>{if($('#fDate').value)buildPayload()}));
$('#previewJsonBtn').onclick=buildPayload;$('#clearForm').onclick=()=>{$('#tradeForm').reset();$('#fDate').value=new Date().toISOString().slice(0,10);previewFile=null;currentPayload=null;$('#imagePreview').hidden=true;$('#imagePreview').src='';$('#dropEmpty').hidden=false;$('#exportReady').hidden=true;$('#exportEmpty').hidden=false;$('#tradeSaveStatus').textContent=''};

function getGitHubSettings(){return{owner:localStorage.getItem('tt_gh_owner')||'',repo:localStorage.getItem('tt_gh_repo')||'',branch:localStorage.getItem('tt_gh_branch')||'main',token:sessionStorage.getItem('tt_gh_token')||''}}
function loadGitHubSettings(){const s=getGitHubSettings();$('#ghOwner').value=s.owner;$('#ghRepo').value=s.repo;$('#ghBranch').value=s.branch;$('#ghToken').value=s.token;if(s.owner&&s.repo)$('#saveIndicator').textContent=`${s.owner}/${s.repo}`}
function status(sel,msg,type=''){const el=$(sel);el.textContent=msg;el.className=`save-status ${type}`}
function saveGitHubSettings(){const owner=$('#ghOwner').value.trim(),repo=$('#ghRepo').value.trim(),branch=$('#ghBranch').value.trim()||'main',token=$('#ghToken').value.trim();if($('#rememberRepo').checked){localStorage.setItem('tt_gh_owner',owner);localStorage.setItem('tt_gh_repo',repo);localStorage.setItem('tt_gh_branch',branch)}else{localStorage.removeItem('tt_gh_owner');localStorage.removeItem('tt_gh_repo');localStorage.removeItem('tt_gh_branch')}if(token)sessionStorage.setItem('tt_gh_token',token);else sessionStorage.removeItem('tt_gh_token');$('#saveIndicator').textContent=owner&&repo?`${owner}/${repo}`:'Local view';status('#settingsStatus','Settings saved in this browser session.','ok')}
$('#saveSettingsBtn').onclick=saveGitHubSettings;$('#forgetTokenBtn').onclick=()=>{sessionStorage.removeItem('tt_gh_token');$('#ghToken').value='';currentGithubUser=null;currentTrader=null;updateIdentityUI();status('#settingsStatus','Token removed from this browser session.','ok')};
async function ghRequest(path,options={}){const s=getGitHubSettings();if(!s.owner||!s.repo)throw new Error('Repository owner/name missing.');if(!s.token)throw new Error('No GitHub token saved. Open Settings first.');const res=await fetch(`https://api.github.com/repos/${encodeURIComponent(s.owner)}/${encodeURIComponent(s.repo)}${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${s.token}`,'X-GitHub-Api-Version':'2022-11-28',...(options.headers||{})}});if(!res.ok){let msg=`GitHub API ${res.status}`;try{const j=await res.json();msg=j.message||msg}catch{}throw new Error(`${res.status}: ${msg}`)}return res.status===204?null:res.json()}

async function ghUserRequest(){
  const s=getGitHubSettings();
  if(!s.token)throw new Error('No GitHub token saved. Open Settings first.');
  const res=await fetch('https://api.github.com/user',{
    headers:{
      Accept:'application/vnd.github+json',
      Authorization:`Bearer ${s.token}`,
      'X-GitHub-Api-Version':'2022-11-28'
    }
  });
  if(!res.ok){
    let msg=`GitHub API ${res.status}`;
    try{const j=await res.json();msg=j.message||msg}catch{}
    throw new Error(`${res.status}: ${msg}`)
  }
  return res.json()
}

function memberForGithub(login){
  return (membersConfig.members||[]).find(m=>String(m.github||'').toLowerCase()===String(login||'').toLowerCase())||null
}
function memberForTrader(trader){
  return (membersConfig.members||[]).find(m=>m.trader===trader)||null
}
function updateIdentityUI(){
  const name=currentGithubUser?.login||'Not connected';
  $('#githubIdentity').textContent=name;
  if(currentGithubUser){
    const mapped=memberForGithub(currentGithubUser.login);
    currentTrader=mapped?.trader||null;
    $('#githubIdentityStatus').textContent=currentTrader?`Recognized as ${currentTrader}.`:'This GitHub account is not paired yet.';
    $('#pairingBox').hidden=!!currentTrader;
  }else{
    currentTrader=null;
    $('#githubIdentityStatus').textContent='Test the connection to identify this browser.';
    $('#pairingBox').hidden=true;
  }
  $('#postingAsName').textContent=currentTrader||'Not paired';
  $('#postingAsGithub').textContent=currentGithubUser?`GitHub: @${currentGithubUser.login}`:'Connect your GitHub account in Settings';
}
async function detectGithubIdentity(showStatus=true){
  try{
    currentGithubUser=await ghUserRequest();
    updateIdentityUI();
    if(showStatus)status('#settingsStatus',currentTrader?`Connected as @${currentGithubUser.login} → ${currentTrader}.`:`Connected as @${currentGithubUser.login}. Pair this account to a trader below.`,'ok');
    return currentGithubUser;
  }catch(e){
    currentGithubUser=null;currentTrader=null;updateIdentityUI();
    if(showStatus)status('#settingsStatus',e.message,'err');
    throw e
  }
}
async function saveMembersConfig(){
  const file=await getRepoFile('data/members.json');
  await putRepoFile('data/members.json',utf8ToBase64(JSON.stringify(membersConfig,null,2)),'Update TradingTrio member mapping',file.sha);
}
$('#pairTraderBtn').onclick=async()=>{
  const trader=$('#pairTrader').value;
  if(!currentGithubUser){status('#settingsStatus','Test the GitHub connection first.','err');return}
  if(!trader){status('#settingsStatus','Choose Denis, Nel or Alex.','err');return}
  const existingTrader=memberForTrader(trader);
  if(existingTrader?.github && existingTrader.github.toLowerCase()!==currentGithubUser.login.toLowerCase()){
    status('#settingsStatus',`${trader} is already paired to @${existingTrader.github}.`,'err');return
  }
  const existingUser=memberForGithub(currentGithubUser.login);
  if(existingUser && existingUser.trader!==trader){
    status('#settingsStatus',`@${currentGithubUser.login} is already paired to ${existingUser.trader}.`,'err');return
  }
  status('#settingsStatus',`Pairing @${currentGithubUser.login} to ${trader}...`,'busy');
  try{
    const target=memberForTrader(trader);
    if(target)target.github=currentGithubUser.login;
    else membersConfig.members.push({trader,github:currentGithubUser.login});
    await saveMembersConfig();
    updateIdentityUI();
    status('#settingsStatus',`Paired successfully: @${currentGithubUser.login} → ${trader}. Future trades are locked to ${trader}.`,'ok')
  }catch(e){status('#settingsStatus',e.message,'err')}
};

$('#testGitHubBtn').onclick=async()=>{
  saveGitHubSettings();status('#settingsStatus','Testing connection and identifying GitHub account...','busy');
  try{
    const repo=await ghRequest('');
    await detectGithubIdentity(false);
    status('#settingsStatus',currentTrader?`Connected to ${repo.full_name} as @${currentGithubUser.login} → ${currentTrader}.`:`Connected to ${repo.full_name} as @${currentGithubUser.login}. Pair this account below.`,'ok')
  }catch(e){status('#settingsStatus',e.message,'err')}
};
function fileToBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(file)})}
function utf8ToBase64(str){const bytes=new TextEncoder().encode(str);let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin)}
function base64ToUtf8(b64){const bin=atob(b64.replace(/\n/g,'')),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return new TextDecoder().decode(bytes)}
async function putRepoFile(path,contentBase64,message,sha){const s=getGitHubSettings(),body={message,content:contentBase64,branch:s.branch};if(sha)body.sha=sha;return ghRequest(`/contents/${path.split('/').map(encodeURIComponent).join('/')}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
async function getRepoFile(path){const s=getGitHubSettings();return ghRequest(`/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(s.branch)}`)}

async function deleteRepoFile(path,message){
  const s=getGitHubSettings();
  const file=await getRepoFile(path);
  return ghRequest(`/contents/${path.split('/').map(encodeURIComponent).join('/')}`,{
    method:'DELETE',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message,sha:file.sha,branch:s.branch})
  })
}

$('#tradeForm').onsubmit=async e=>{e.preventDefault();const payload=buildPayload();if(!payload)return;if(!previewFile){status('#tradeSaveStatus','Choose a screenshot first.','err');return}const s=getGitHubSettings();if(!s.owner||!s.repo||!s.token){status('#tradeSaveStatus','Open Settings and connect this browser to GitHub first.','err');return}if(!currentTrader){status('#tradeSaveStatus','This GitHub account is not paired to a TradingTrio member yet. Open Settings.','err');return}status('#tradeSaveStatus','Saving screenshot to GitHub...','busy');try{await putRepoFile(payload.image,await fileToBase64(previewFile),`Add ${payload.trader} ${payload.symbol} trade screenshot`);status('#tradeSaveStatus','Updating data/trades.json...','busy');const file=await getRepoFile('data/trades.json'),current=JSON.parse(base64ToUtf8(file.content));if(current.some(t=>t.id===payload.id))throw new Error('This trade ID already exists.');current.push(payload);await putRepoFile('data/trades.json',utf8ToBase64(JSON.stringify(current,null,2)),`Add ${payload.trader} ${payload.symbol} trade`,file.sha);trades=current;if(previewFile){window.__ttImageUrls.set(payload.id,URL.createObjectURL(previewFile));}initFilters();renderAll();status('#tradeSaveStatus','Saved. Your real screenshot and trades.json were committed to GitHub.','ok');$('#saveIndicator').textContent='Saved ✓'}catch(err){console.error(err);status('#tradeSaveStatus',`${err.message}. If the screenshot committed but JSON failed, check GitHub before retrying.`,'err')}};


function openEditTrade(id){
  const t=trades.find(x=>String(x.id)===String(id));if(!t)return;
  if(!currentTrader || t.trader!==currentTrader){alert("You can only edit your own trades.");return}
  $("#tradeModal").classList.add("hidden");
  $("#eTradeId").value=t.id;$("#eDate").value=t.date||"";$("#eSymbol").value=t.symbol||"";
  $("#eDirection").value=String(t.direction||"LONG").toUpperCase();$("#eSession").value=t.session||"Other";
  $("#eR").value=num(t.r);$("#eSetup").value=t.setup||"";$("#eGrade").value=t.grade||"A";
  $("#ePlan").value=t.followedPlan?"true":"false";$("#eTags").value=(t.tags||[]).join(", ");
  $("#eNotes").value=t.notes||"";$("#eMistakes").value=t.mistakes||"";$("#eImage").value="";
  $("#eImagePreview").src=(window.__ttImageUrls?.get(t.id)||t.image);$("#editTradeStatus").textContent="";
  $("#editTradeModal").classList.remove("hidden")
}

function isShaConflict(err){
  const msg=String(err?.message||err||"").toLowerCase();
  return msg.includes("does not match") ||
         msg.includes("sha") && msg.includes("match") ||
         msg.includes("conflict") ||
         msg.includes("409");
}

async function mutateTradesJson(mutator,message,maxAttempts=4){
  let lastError=null;

  for(let attempt=1;attempt<=maxAttempts;attempt++){
    try{
      // Always fetch the newest blob + SHA immediately before writing.
      const file=await getRepoFile("data/trades.json");
      const latest=JSON.parse(base64ToUtf8(file.content));
      const next=mutator(latest);

      await putRepoFile(
        "data/trades.json",
        utf8ToBase64(JSON.stringify(next,null,2)),
        message,
        file.sha
      );

      return next;
    }catch(err){
      lastError=err;
      if(!isShaConflict(err) || attempt===maxAttempts) throw err;

      // Small increasing delay before fetching the newest SHA again.
      await new Promise(resolve=>setTimeout(resolve,250*attempt));
    }
  }

  throw lastError||new Error("Unable to update trades.json");
}

async function updateTradeInGithub(updatedTrade,message){
  return mutateTradesJson(latest=>{
    const index=latest.findIndex(t=>String(t.id)===String(updatedTrade.id));
    if(index<0) throw new Error("This trade no longer exists. Refresh the journal.");
    if(latest[index].trader!==currentTrader) throw new Error("You can only edit your own trades.");

    const next=[...latest];
    next[index]={...latest[index],...updatedTrade};
    return next;
  },message);
}

async function deleteTradeFromGithub(tradeId,message){
  return mutateTradesJson(latest=>{
    const target=latest.find(t=>String(t.id)===String(tradeId));
    if(!target) return latest; // already deleted = success
    if(target.trader!==currentTrader) throw new Error("You can only delete your own trades.");
    return latest.filter(t=>String(t.id)!==String(tradeId));
  },message);
}

$("#editTradeForm").onsubmit=async e=>{
  e.preventDefault();
  const id=$("#eTradeId").value,index=trades.findIndex(t=>String(t.id)===String(id));
  if(index<0)return;
  const oldTrade=trades[index];
  if(!currentTrader || oldTrade.trader!==currentTrader){status("#editTradeStatus","You can only edit your own trades.","err");return}
  const replacement=$("#eImage").files[0]||null;
  const updated={...oldTrade,date:$("#eDate").value,symbol:$("#eSymbol").value.trim().toUpperCase(),direction:$("#eDirection").value,
    session:$("#eSession").value,r:Number($("#eR").value),setup:$("#eSetup").value.trim(),grade:$("#eGrade").value,
    followedPlan:$("#ePlan").value==="true",tags:$("#eTags").value.split(",").map(x=>x.trim()).filter(Boolean),
    notes:$("#eNotes").value.trim(),mistakes:$("#eMistakes").value.trim()};
  status("#editTradeStatus","Saving changes to GitHub...","busy");
  try{
    if(replacement){
      const ext=(replacement.name.split(".").pop()||"png").toLowerCase().replace("jpeg","jpg");
      const newPath=`images/${slug(currentTrader)}/${updated.date}-${slug(updated.symbol)}-${updated.direction.toLowerCase()}-${Date.now().toString().slice(-5)}.${ext}`;
      await putRepoFile(newPath,await fileToBase64(replacement),`Replace ${currentTrader} ${updated.symbol} trade screenshot`);
      updated.image=newPath;
    }
    const next=await updateTradeInGithub(updated,`Edit ${currentTrader} ${updated.symbol} trade`);
    if(replacement && oldTrade.image && oldTrade.image!==updated.image && oldTrade.image.startsWith("images/")){
      try{await deleteRepoFile(oldTrade.image,`Remove replaced ${currentTrader} trade screenshot`)}catch(err){console.warn("Old screenshot cleanup failed:",err)}
      try{window.__ttImageUrls.set(updated.id,URL.createObjectURL(replacement))}catch{}
    }
    trades=next;renderAll();$("#editTradeModal").classList.add("hidden");$("#saveIndicator").textContent="Edited ✓"
  }catch(err){console.error(err);status("#editTradeStatus",err.message,"err")}
};

async function deleteTradeById(id,fromDetail=false){
  const t=trades.find(x=>String(x.id)===String(id));if(!t)return;
  if(!currentTrader || t.trader!==currentTrader){alert("You can only delete your own trades.");return}
  if(!confirm(`Delete ${t.symbol} ${t.direction} trade from ${t.date}? This cannot be undone.`))return;
  if(fromDetail)$("#tradeModal").classList.add("hidden");
  status("#editTradeStatus","Deleting trade from GitHub...","busy");
  try{
    const next=await deleteTradeFromGithub(id,`Delete ${currentTrader} ${t.symbol} trade`);
    if(t.image && t.image.startsWith("images/")){
      try{await deleteRepoFile(t.image,`Delete ${currentTrader} ${t.symbol} trade screenshot`)}catch(err){console.warn("Screenshot deletion failed:",err)}
    }
    trades=next;renderAll();$("#editTradeModal").classList.add("hidden");$("#saveIndicator").textContent="Deleted ✓"
  }catch(err){console.error(err);if(fromDetail)alert(`Delete failed: ${err.message}`);else status("#editTradeStatus",err.message,"err")}
}

$("#deleteTradeBtn").onclick=()=>deleteTradeById($("#eTradeId").value,false);
$$("[data-edit-close]").forEach(x=>x.onclick=()=>$("#editTradeModal").classList.add("hidden"));

function activate(view){$$('.view').forEach(v=>v.classList.remove('active'));$('#'+view+'View').classList.add('active');$$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===view));$('#pageTitle').textContent={dashboard:'Dashboard',journal:'Journal',analytics:'Analytics',team:'Team',market:'Live Market',add:'Add Trade',settings:'Settings'}[view];if(view==='dashboard')requestAnimationFrame(()=>drawEquity(activeTrades()))}
$$('.nav-item').forEach(n=>n.onclick=()=>activate(n.dataset.view));$$('[data-view-jump]').forEach(n=>n.onclick=()=>activate(n.dataset.viewJump));$('#globalTraderFilter').onchange=e=>{selectedTrader=e.target.value;renderAll()};['#searchTrades','#filterResult','#filterSession','#filterSetup'].forEach(sel=>$(sel).addEventListener(sel==='#searchTrades'?'input':'change',renderJournal));$$('[data-modal-close]').forEach(x=>x.onclick=()=>$('#tradeModal').classList.add('hidden'));window.onkeydown=e=>{if(e.key==='Escape')$('#tradeModal').classList.add('hidden')};window.onresize=()=>{$('#dashboardView').classList.contains('active')&&drawEquity(activeTrades())};
$$('.market-tab').forEach(x=>x.onclick=()=>ttSetMarketTab(x.dataset.marketTab));
boot();
