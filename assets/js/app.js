window.TRADINGTRIO_BUILD='2.6.0';
window.__ttImageUrls = window.__ttImageUrls || new Map();
let trades=[],selectedTrader='all',previewFile=null,currentPayload=null;
let currentGithubUser=null,currentTrader=null,membersConfig={members:[]};
window.__ttImageUrls = window.__ttImageUrls || new Map();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const num=v=>Number(v||0), fmtR=v=>`${num(v)>0?'+':''}${num(v).toFixed(2)}R`, cls=v=>num(v)>0?'positive':num(v)<0?'negative':'neutral';





const TT_NEWS_FEEDS=[
 {source:'FXStreet',market:'macro',url:'https://www.fxstreet.com/rss/news'},
 {source:'Google News · Forex',market:'forex',url:'https://news.google.com/rss/search?q=(forex%20OR%20currency%20OR%20dollar%20OR%20euro%20OR%20yen%20OR%20sterling)%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen'},
 {source:'Google News · Indices',market:'indices',url:'https://news.google.com/rss/search?q=(Nasdaq%20OR%20%22S%26P%20500%22%20OR%20Dow%20OR%20DAX%20OR%20FTSE%20OR%20Nikkei)%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen'},
 {source:'Google News · Gold',market:'gold',url:'https://news.google.com/rss/search?q=(gold%20OR%20XAUUSD%20OR%20bullion)%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen'},
 {source:'Google News · Macro',market:'macro',url:'https://news.google.com/rss/search?q=(Fed%20OR%20FOMC%20OR%20ECB%20OR%20BOE%20OR%20BOJ%20OR%20CPI%20OR%20inflation%20OR%20NFP%20OR%20payrolls%20OR%20GDP%20OR%20PMI)%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen'}
];
const FF_CALENDAR_URL='https://nfs.faireconomy.media/ff_calendar_thisweek.json';
const FF_CAL_CACHE='tt_ff_v260_cache';
const FF_CAL_CACHE_TIME='tt_ff_v260_cache_time';
let ttNewsItems=[],ttNewsMarket='all',ttNewsImpact='all',ttNewsTimer=null,ttNewsLoading=false;
let ffCalendar=[],ffCalendarTimer=null,ffLastFetch=0;

function ttStripHtml(v){const d=document.createElement('div');d.innerHTML=String(v||'');return(d.textContent||d.innerText||'').replace(/\s+/g,' ').trim()}
function ttImpactForNews(t,d=''){const s=(t+' '+d).toLowerCase(),hi=[/\bfomc\b.*(?:decision|rate|cut|hike|statement)/,/federal reserve.*(?:decision|rate|cut|hike|emergency)/,/\bfed\b.*(?:decision|cuts?|hikes?|emergency|surprise)/,/\becb\b.*(?:decision|rate|cuts?|hikes?)/,/\bboe\b.*(?:decision|rate|cuts?|hikes?)/,/\bboj\b.*(?:decision|rate|cuts?|hikes?|intervention)/,/\bcpi\b.*(?:actual|rises?|falls?|jumps?|drops?|inflation)/,/\bnonfarm\b/,/\bnfp\b/,/\bunemployment rate\b/,/\brate decision\b/,/\binterest rate decision\b/,/\bcurrency intervention\b/,/\bwar\b/,/\bmissile\b/,/\bairstrike\b/,/\binvasion\b/,/\bceasefire\b/,/\bsanctions?\b/,/\bdefault\b/,/\bbank failure\b/],med=[/\bgdp\b/,/\bpmi\b/,/\bism\b/,/retail sales/,/jobless claims/,/\bpce\b/,/\bppi\b/,/consumer confidence/,/central bank/,/\bfed\b/,/\bfomc\b/,/\becb\b/,/\bboe\b/,/\bboj\b/,/\btreasury yields?\b/,/\bbond yields?\b/,/\bdollar index\b/,/\bdxy\b/,/\bgold\b/,/\bxau/,/\boil\b/,/\bcrude\b/,/inflation/,/geopolitical/,/tariffs?/,/jolts/,/employment/];if(hi.some(r=>r.test(s)))return'high';if(med.some(r=>r.test(s)))return'medium';return'low'}
function ttMarketForNews(x){const s=(x.title+' '+x.description).toLowerCase();if(/\bgold\b|\bxau(?:usd|\/usd)?\b|bullion|precious metal/.test(s))return'gold';if(/nasdaq|s&p|sp500|dow(?: jones)?|dax|ftse|nikkei|eurostoxx|stocks?|equities|stock market|indices/.test(s))return'indices';if(/forex|foreign exchange|currency|eur\/?usd|gbp\/?usd|usd\/?jpy|dollar|euro|sterling|yen|swiss franc|\bfx\b/.test(s))return'forex';return x.market||'macro'}
function ttNewsDate(v){const d=new Date(v||0);return Number.isNaN(d.getTime())?new Date():d}
function ttTimeAgo(d){const s=Math.max(0,Math.floor((Date.now()-d)/1000));if(s<60)return s+'s';const m=Math.floor(s/60);if(m<60)return m+'m';const h=Math.floor(m/60);if(h<24)return h+'h';return Math.floor(h/24)+'d'}
function ttRelevantNews(x){return /forex|foreign exchange|currency|dollar|euro|sterling|yen|franc|gold|xau|bullion|nasdaq|s&p|sp500|dow|dax|ftse|nikkei|stock market|indices|fed|fomc|ecb|boe|boj|central bank|inflation|cpi|pce|ppi|payroll|nfp|unemployment|gdp|pmi|ism|rate|yield|tariff|sanction|geopolit|oil|crude|jolts/.test((x.title+' '+x.description).toLowerCase())}
function ttParseRSS(txt,f){const doc=new DOMParser().parseFromString(txt,'text/xml');if(doc.querySelector('parsererror'))throw Error('Invalid RSS');return[...doc.querySelectorAll('item')].map(n=>{const g=k=>n.querySelector(k)?.textContent?.trim()||'';const x={title:ttStripHtml(g('title')),description:ttStripHtml(g('description')).slice(0,280),link:g('link')||'#',pubDate:g('pubDate')||g('published')||g('updated'),source:f.source,market:f.market};x.market=ttMarketForNews(x);x.impact=ttImpactForNews(x.title,x.description);return x}).filter(x=>x.title&&ttRelevantNews(x))}
async function ttText(url,timeout=12000){const c=new AbortController(),tm=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{cache:'no-store',signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.text()}finally{clearTimeout(tm)}}
async function ttFetchFeed(f){const tries=[()=>ttText(f.url),()=>ttText('https://api.allorigins.win/raw?url='+encodeURIComponent(f.url)),()=>ttText('https://corsproxy.io/?url='+encodeURIComponent(f.url))];let last;for(const fn of tries){try{const a=ttParseRSS(await fn(),f);if(a.length)return a;last=Error('No items')}catch(e){last=e}}throw last||Error('Unavailable')}

function ttHeadlineTerms(s){return String(s).toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>3&&!['with','from','that','this','after','amid','into','over','says','market','markets','news','latest','forex'].includes(w))}
function ttSimilarity(a,b){const A=new Set(ttHeadlineTerms(a)),B=new Set(ttHeadlineTerms(b));if(!A.size||!B.size)return 0;let inter=0;A.forEach(x=>{if(B.has(x))inter++});return inter/Math.min(A.size,B.size)}
function ttBuildClusters(items){const clusters=[];for(const item of items.slice(0,80)){let best=null,score=0;for(const c of clusters){const s=ttSimilarity(item.title,c.items[0].title);if(s>score){score=s;best=c}}if(best&&score>=.38)best.items.push(item);else clusters.push({items:[item]})}return clusters.map(c=>{const maxImpact=c.items.some(x=>x.impact==='high')?'high':c.items.some(x=>x.impact==='medium')?'medium':'low';const sources=new Set(c.items.map(x=>x.source));const latest=Math.max(...c.items.map(x=>ttNewsDate(x.pubDate).getTime()));const ageMin=Math.max(0,(Date.now()-latest)/60000);c.impact=maxImpact;c.sources=[...sources];c.score=c.items.length*4+c.sources.length*3+(maxImpact==='high'?8:maxImpact==='medium'?4:1)+Math.max(0,8-ageMin/10);return c}).sort((a,b)=>b.score-a.score)}

function ttFilteredNews(){return ttNewsItems.filter(x=>(ttNewsImpact==='all'||x.impact===ttNewsImpact)&&(ttNewsMarket==='all'||x.market===ttNewsMarket||x.market==='macro'))}
function ttRenderMarketNews(){const list=$('#marketNewsList');if(!list)return;const rows=ttFilteredNews();$('#latestStoryCount').textContent=`${rows.length} stor${rows.length===1?'y':'ies'}`;if(!rows.length){list.innerHTML='<div class="empty-state">No matching stories right now.</div>';ttRenderHotTopics([]);return}list.innerHTML=rows.slice(0,35).map(x=>{const d=ttNewsDate(x.pubDate);return`<article class="ff-story"><div class="ff-story-meta"><time>${esc(ttTimeAgo(d))} ago</time><span class="story-market">${esc(x.market==='macro'?'MACRO':x.market)}</span></div><div class="ff-story-main"><a href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a>${x.description?`<small>${esc(x.description.slice(0,155))}</small>`:''}</div><div class="ff-story-side"><span class="impact-pill ${esc(x.impact)}">${esc(x.impact.toUpperCase())}</span><span class="story-source">${esc(x.source)}</span></div></article>`}).join('');ttRenderHotTopics(rows)}
function ttRenderHotTopics(rows){const hot=$('#hotStoryPanel'),list=$('#hotTopicsList');if(!hot||!list)return;const clusters=ttBuildClusters(rows);if(!clusters.length){hot.innerHTML='<div class="empty-state">No hot story yet.</div>';list.innerHTML='';return}const c=clusters[0],lead=c.items[0];hot.innerHTML=`<div class="hot-story-topline"><span class="impact-pill ${esc(c.impact)}">${esc(c.impact.toUpperCase())}</span><span class="hot-cluster-count">${c.items.length} related · ${c.sources.length} source${c.sources.length===1?'':'s'}</span></div><h3>${esc(lead.title)}</h3>${lead.description?`<p>${esc(lead.description.slice(0,230))}</p>`:''}<div class="hot-story-sources">${c.sources.map(s=>`<span class="hot-source-chip">${esc(s)}</span>`).join('')}</div>`;list.innerHTML=clusters.slice(1,5).map(c=>`<div class="hot-topic-row"><strong>${esc(c.items[0].title)}</strong><div><span class="impact-pill ${esc(c.impact)}">${esc(c.impact.toUpperCase())}</span><small>${c.items.length} related</small></div></div>`).join('')}

async function ttLoadMarketNews(){if(ttNewsLoading)return;ttNewsLoading=true;const state=$('#marketNewsState'),upd=$('#marketNewsUpdated'),orb=$('#marketNewsOrb');if(state)state.textContent='Updating…';if(upd)upd.textContent='Checking fast market sources';try{const rs=await Promise.allSettled(TT_NEWS_FEEDS.map(ttFetchFeed));let rows=[];rs.forEach(r=>{if(r.status==='fulfilled')rows.push(...r.value)});const failed=rs.filter(r=>r.status==='rejected').length,seen=new Set();rows=rows.filter(x=>{const k=(x.link!=='#'?x.link:x.title).toLowerCase();if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>ttNewsDate(b.pubDate)-ttNewsDate(a.pubDate));if(rows.length)ttNewsItems=rows;ttRenderMarketNews();if(orb)orb.classList.toggle('error',!ttNewsItems.length);if(state)state.textContent=ttNewsItems.length?'News live':'News unavailable';if(upd)upd.textContent=ttNewsItems.length?`Updated ${new Date().toLocaleTimeString()} · ${ttNewsItems.length} stories${failed?' · '+failed+' source retrying':''}`:'Retrying automatically'}finally{ttNewsLoading=false;clearTimeout(ttNewsTimer);ttNewsTimer=setTimeout(ttLoadMarketNews,20000)}}

function ffNormalize(x){return{id:`${x.date||''}|${x.country||''}|${x.title||''}`,title:String(x.title||'Economic event'),country:String(x.country||'All'),date:String(x.date||''),impact:String(x.impact||'Low'),forecast:String(x.forecast??''),previous:String(x.previous??''),actual:String(x.actual??'')}}
function ffDate(x){const d=new Date(x.date);return Number.isNaN(d.getTime())?null:d}
function ffImpactHtml(v){const c=String(v||'Low').toLowerCase();return`<span class="cal-impact ${esc(c)}"><i></i><i></i><i></i></span>`}
function ffReadCache(){try{const raw=localStorage.getItem(FF_CAL_CACHE);if(!raw)return false;const arr=JSON.parse(raw);if(!Array.isArray(arr))return false;ffCalendar=arr.map(ffNormalize);ffRenderCalendar();return true}catch{return false}}
function ffRenderCalendar(){const list=$('#ffCalendarList');if(!list)return;const cur=$('#calendarCurrencyFilter')?.value||'all',impact=$('#calendarImpactFilter')?.value||'all',day=$('#calendarDayFilter')?.value||'all';const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),end=start+86400000;let rows=ffCalendar.filter(x=>{const t=ffDate(x)?.getTime()||0;if(cur!=='all'&&x.country!==cur)return false;if(impact!=='all'&&x.impact!==impact)return false;if(day==='today'&&(t<start||t>=end))return false;if(day==='upcoming'&&t<Date.now()-60000)return false;return true});list.innerHTML=rows.length?rows.map(x=>{const d=ffDate(x),past=d&&d<Date.now();return`<div class="ff-calendar-row ${past?'past':''}"><div class="cal-time"><b>${esc(d?d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—')}</b><small>${esc(d?d.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'}):'')}</small></div><span class="cal-currency">${esc(x.country)}</span>${ffImpactHtml(x.impact)}<span class="cal-event">${esc(x.title)}</span><span class="cal-value actual">${esc(x.actual||'—')}</span><span class="cal-value">${esc(x.forecast||'—')}</span><span class="cal-value">${esc(x.previous||'—')}</span></div>`}).join(''):'<div class="empty-state">No calendar events match these filters.</div>'}
async function ffLoadCalendar(force=false){if(!force&&ffLastFetch&&Date.now()-ffLastFetch<150000)return;ffLastFetch=Date.now();const status=$('#calendarStatus');if(status)status.textContent='Updating Forex Factory schedule…';try{const tries=[()=>ttText(FF_CALENDAR_URL),()=>ttText('https://api.allorigins.win/raw?url='+encodeURIComponent(FF_CALENDAR_URL)),()=>ttText('https://corsproxy.io/?url='+encodeURIComponent(FF_CALENDAR_URL))];let raw,last;for(const fn of tries){try{raw=JSON.parse(await fn());if(Array.isArray(raw))break}catch(e){last=e;raw=null}}if(!Array.isArray(raw))throw last||Error('Calendar unavailable');ffCalendar=raw.map(ffNormalize).sort((a,b)=>(ffDate(a)?.getTime()||0)-(ffDate(b)?.getTime()||0));localStorage.setItem(FF_CAL_CACHE,JSON.stringify(raw));localStorage.setItem(FF_CAL_CACHE_TIME,String(Date.now()));ffRenderCalendar();if(status)status.textContent=`Updated ${new Date().toLocaleTimeString()}`}catch(e){const cached=ffReadCache();if(status)status.textContent=cached?'Using cached calendar':'Calendar temporarily unavailable'}finally{clearTimeout(ffCalendarTimer);ffCalendarTimer=setTimeout(ffLoadCalendar,300000)}}

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


