/* HamMasir features.js — loaded right after the inline script.
   Overrides + new modules: triggers, multi check-in, sleep/nap,
   yesterday catch-up, service-worker notifications, Android PWA bits. */

L.tabs.sleep=['خواب','Sleep'];
/* ---- 4) more triggers (override) ---- */
function trigList(){return lang==='fa'?['استرس','گرمای زیاد','خواب بد','عفونت','قاعدگی','سرما','مسافرت','خستگی مفرط','تغییر آب‌وهوا','کم‌آبی','هورمون','داروی جدید','مشکل کاری','تنهایی','رژیم غذایی','ورزش سنگین','فراموشی دارو']:['Stress','Heat','Bad sleep','Infection','Period','Cold','Travel','Over-fatigue','Weather change','Dehydration','Hormonal','New med','Work stress','Loneliness','Diet','Heavy exercise','Missed med'];}

/* ---- 3) multiple check-ins per day (override saveCheckin) ---- */
function saveCheckin(){const v={};activeSyms().forEach(s=>{const sev=chkSel[s.id]*2.5;v[s.id]=s.good?(10-sev):sev;});
const note=$('noteTxt').value.trim();const trig=[...chkTrig];
S.checkins[dkey(new Date())]={v,note,trig};
S.checkinHistory=S.checkinHistory||[];S.checkinHistory.push({dk:dkey(new Date()),t:new Date().toTimeString().slice(0,5),v:{...v},note,trig});
if(S.checkinHistory.length>500)S.checkinHistory=S.checkinHistory.slice(-500);
persist();renderAll();toast('🎉');showTab('dash');}
function afterCheckRender(){const el=$('entryCount');if(!el)return;
const today=(S.checkinHistory||[]).filter(e=>e.dk===dkey(new Date()));
if(today.length>0){el.classList.remove('hidden');el.textContent=lang==='fa'?('✅ '+num(today.length)+' چک‌این امروز ثبت شده — برای ثبت دوباره، دوباره پر کن و بزن «ثبت»'):('✅ '+num(today.length)+' check-in(s) today — fill again and save to add another');}
else el.classList.add('hidden');}

/* ---- 2) sleep + nap monitor (duration-based, fast UX) ---- */
let slHours=7, slQ=2;
const SLEEP_HOURS=[4,5,6,7,8,9,10];
const NAP_MINS=[15,30,45,60,90];
function sleepTxt(){const fa=lang==='fa';return{title:fa?'مانیتور خواب و چرت':'Sleep & nap monitor',sub:fa?'ثبت سریع: چند ساعت خوابیدی؟':'Quick log: how long did you sleep?',last:fa?'خواب دیشب':'Last night',dur:fa?'چند ساعت خوابیدی؟':'How many hours?',sq:fa?'کیفیت خواب':'Sleep quality',wu:fa?'بیداری‌های مکرر داشتم':'I woke up multiple times',saveN:fa?'ثبت خواب دیشب':'Save last night',nap:fa?'چرت امروز':'Nap today',napHint:fa?'روی مدت بزن تا همین الان ثبت بشه':'Tap a duration to log it now',hist:fa?'چرت‌های اخیر':'Recent naps',stats:fa?'آمار خواب (۷ روز)':'Sleep stats (7d)',hour:fa?'ساعت':'h',min:fa?'دقیقه':'min'};}
function buildSleepView(){const el=$('view-sleep');if(!el)return;el.innerHTML=`<div><h2 class="font-display text-3xl text-teal-900 dark:text-teal-300">😴 <span id="sleepTitle"></span></h2><p class="text-sm text-slate-500 dark:text-slate-400 mt-1" id="sleepSub"></p></div>
<div class="rounded-xl border border-teal-900/10 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-5 mt-6 relative"><div class="flex items-center justify-between mb-2 flex-wrap gap-2"><h3 class="font-bold">📈 <span id="sleepChartTitle"></span></h3><span class="text-[11px] text-slate-400" id="sleepChartLegend"></span></div><canvas id="sleepChart" style="width:100%;height:220px"></canvas></div>
<div class="rounded-xl border border-teal-900/10 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6 mt-6"><h3 class="font-bold mb-4">🌙 <span id="lastNightTitle"></span></h3><p class="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2" id="durLbl"></p><div class="flex flex-wrap gap-2" id="durChips"></div><p class="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 mt-4" id="sqLbl"></p><div class="flex gap-1.5" id="sl-faces"></div><label class="flex items-center gap-2 text-sm mt-4"><input type="checkbox" id="sl-wakeups" class="w-5 h-5 accent-teal-600"><span id="wakeupsLbl"></span></label><button onclick="saveNight()" class="mt-4 w-full bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl py-3" id="saveNightBtn"></button></div>
<div class="rounded-xl border border-teal-900/10 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6 mt-6"><h3 class="font-bold mb-4">💤 <span id="napTitle"></span></h3><p class="text-xs text-slate-500 dark:text-slate-400 mb-2" id="napHint"></p><div class="flex flex-wrap gap-2" id="napChips"></div><div class="mt-4"><h4 class="text-sm font-bold mb-2" id="napHistLbl"></h4><div id="napHist" class="space-y-2 text-sm"></div></div></div>
<div class="rounded-xl border border-teal-900/10 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6 mt-6"><h3 class="font-bold mb-4">📊 <span id="sleepStatsTitle"></span></h3><div id="sleepStats" class="grid grid-cols-2 sm:grid-cols-4 gap-3"></div></div>`;}
function renderDurChips(){const x=sleepTxt();$('durChips').innerHTML=SLEEP_HOURS.map(h=>`<button type="button" onclick="slHours=${h};renderDurChips()" class="rounded-full px-4 py-2 border-2 font-bold text-sm transition-all ${slHours===h?'border-teal-600 bg-teal-600 text-white scale-105':'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-teal-400'}">${num(h)} ${x.hour}</button>`).join('');}
function renderNapChips(){const x=sleepTxt();$('napChips').innerHTML=NAP_MINS.map(m=>`<button type="button" onclick="saveNap(${m})" class="rounded-full px-4 py-2 border-2 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 font-bold text-sm hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all">💤 ${num(m)} ${x.min}</button>`).join('');}
function renderSleepFaces(){$('sl-faces').innerHTML=FACES.map((f,i)=>`<button type="button" onclick="slQ=${4-i};renderSleepFaces()" class="face w-11 h-11 rounded-xl text-2xl flex items-center justify-center border-2 ${slQ===(4-i)?'border-teal-600 bg-teal-50 scale-110':'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 opacity-60'} transition-all hover:scale-110">${f}</button>`).join('');}
function applySleepTxt(){if(!$('sleepTitle'))return;const x=sleepTxt();$('sleepTitle').textContent=x.title;$('sleepSub').textContent=x.sub;$('lastNightTitle').textContent=x.last;$('durLbl').textContent=x.dur;$('sqLbl').textContent=x.sq;$('wakeupsLbl').textContent=x.wu;$('saveNightBtn').textContent=x.saveN;$('napTitle').textContent=x.nap;$('napHint').textContent=x.napHint;$('napHistLbl').textContent=x.hist;$('sleepStatsTitle').textContent=x.stats;renderDurChips();renderNapChips();renderSleepFaces();renderSleep();const _ct=$('sleepChartTitle');if(_ct)_ct.textContent=lang==='fa'?'روند خواب و کیفیت':'Sleep & quality trend';const _cl=$('sleepChartLegend');if(_cl)_cl.innerHTML='<span style="color:#2dd4bf">▮</span> '+(lang==='fa'?'ساعت خواب':'hours')+' · <span style="color:#f59e0b">●</span> '+(lang==='fa'?'کیفیت (از ۵)':'quality (/5)');animateSleepChart('sleepChart');}
function saveNight(){S.sleep=S.sleep||{nights:[],naps:[]};S.sleep.nights=(S.sleep.nights||[]).filter(n=>n.dk!==dkey(new Date()));S.sleep.nights.push({dk:dkey(new Date()),hours:slHours,mins:slHours*60,q:slQ,wakeups:$('sl-wakeups').checked});persist();renderSleep();toast('🌙 '+(lang==='fa'?'ثبت شد':'Saved'));}
function saveNap(dur){S.sleep=S.sleep||{nights:[],naps:[]};S.sleep.naps=S.sleep.naps||[];S.sleep.naps.push({dk:dkey(new Date()),t:new Date().toTimeString().slice(0,5),dur});if(S.sleep.naps.length>100)S.sleep.naps=S.sleep.naps.slice(-100);persist();renderSleep();toast('💤 '+(lang==='fa'?'چرت ثبت شد':'Nap logged'));}
function renderSleep(){if(!$('sleepStats'))return;S.sleep=S.sleep||{nights:[],naps:[]};const nights=(S.sleep.nights||[]).slice(-7);const avgM=nights.length?Math.round(nights.reduce((a,n)=>a+(n.mins||n.hours*60),0)/nights.length):0;const avgQ=nights.length?(nights.reduce((a,n)=>a+n.q,0)/nights.length).toFixed(1):'—';const napsToday=(S.sleep.naps||[]).filter(n=>n.dk===dkey(new Date()));const napMin=napsToday.reduce((a,n)=>a+n.dur,0);const x=sleepTxt();
$('sleepStats').innerHTML=`<div class="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-center"><p class="text-[11px] text-slate-500 dark:text-slate-400">${lang==='fa'?'میانگین خواب':'Avg sleep'}</p><p class="font-display text-2xl text-teal-800 dark:text-teal-300">${avgM?Math.floor(avgM/60)+'h'+(avgM%60):'—'}</p></div><div class="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-center"><p class="text-[11px] text-slate-500 dark:text-slate-400">${lang==='fa'?'میانگین کیفیت':'Avg quality'}</p><p class="font-display text-2xl text-teal-800 dark:text-teal-300">${num(avgQ)}</p></div><div class="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-center"><p class="text-[11px] text-slate-500 dark:text-slate-400">${lang==='fa'?'چرت امروز':'Naps today'}</p><p class="font-display text-2xl text-sky-600 dark:text-sky-300">${num(napsToday.length)}</p></div><div class="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-center"><p class="text-[11px] text-slate-500 dark:text-slate-400">${lang==='fa'?'دقیقه چرت':'Nap minutes'}</p><p class="font-display text-2xl text-sky-600 dark:text-sky-300">${num(napMin)}</p></div>`;
$('napHist').innerHTML=napsToday.length?napsToday.map(n=>`<div class="flex justify-between bg-slate-50 dark:bg-slate-700 rounded-lg p-2"><span>💤 ${n.t}</span><span class="text-slate-500 dark:text-slate-400">${num(n.dur)} ${x.min}</span></div>`).join(''):`<p class="text-slate-400">—</p>`;drawSleepChart('sleepChart',1);}
/* ---- sleep chart (dashboard + sleep tab) ---- */
const SLEEP_CHART_DAYS=14;
let sleepLayouts={};
function sleepDataMap(){if(!S)return{};const m={};((S.sleep&&S.sleep.nights)||[]).forEach(n=>{m[n.dk]={hours:n.hours!=null?n.hours:(n.mins/60),q:n.q};});return m;}
function roundRect(ctx,x,y,w,h,r){if(h<=0)return;ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function drawSleepChart(id,prog){if(prog==null)prog=1;const cv=$(id);if(!cv)return;
const ctx=cv.getContext('2d'),dpr=window.devicePixelRatio||1;
const W=cv.clientWidth,H=cv.clientHeight;if(!W||!H)return;
cv.width=W*dpr;cv.height=H*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,W,H);
const dark=document.documentElement.classList.contains('dark');
const data=sleepDataMap();
const days=[];const _t=new Date();for(let i=SLEEP_CHART_DAYS-1;i>=0;i--){const d=new Date(_t);d.setDate(d.getDate()-i);days.push(d);}
const has=days.some(d=>data[dkey(d)]);
if(!has){ctx.fillStyle='#94a3b8';ctx.font='13px Vazirmatn';ctx.textAlign='center';ctx.fillText(lang==='fa'?'هنوز داده‌ی خواب ثبت نشده':'No sleep data yet',W/2,H/2);ctx.textAlign='start';sleepLayouts[id]=null;return;}
const mL=30,mR=26,mT=14,mB=24,pw=W-mL-mR,ph=H-mT-mB;
const X=i=>mL+(i+0.5)*(pw/days.length);
const bw=Math.min(26,(pw/days.length)*0.55);
const Yh=h=>mT+(1-h/12)*ph;
const Yq=q=>mT+(1-q/5)*ph;
ctx.font='10px Vazirmatn';
[0,4,8,12].forEach(h=>{ctx.strokeStyle=dark?'rgba(148,163,184,.15)':'rgba(148,163,184,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(mL,Yh(h));ctx.lineTo(W-mR,Yh(h));ctx.stroke();ctx.fillStyle='#94a3b8';ctx.fillText(num(h),6,Yh(h)+3);});
[1,3,5].forEach(q=>{ctx.fillStyle='#f59e0b';ctx.fillText(num(q),W-mR+6,Yq(q)+3);});
const step=Math.ceil(days.length/5);
days.forEach((d,i)=>{if(i%step===0||i===days.length-1){ctx.fillStyle='#94a3b8';ctx.fillText(fdate(d),X(i)-12,H-7);}});
days.forEach((d,i)=>{const e=data[dkey(d)];if(!e)return;const y=Yh(e.hours*prog);const bh=Yh(0)-y;
const g=ctx.createLinearGradient(0,y,0,Yh(0));g.addColorStop(0,'#2dd4bf');g.addColorStop(1,'#0f766e');ctx.fillStyle=g;roundRect(ctx,X(i)-bw/2,y,bw,bh,4);ctx.fill();});
const pts=days.map((d,i)=>{const e=data[dkey(d)];return e?{x:X(i),y:Yq(e.q)}:null;});
ctx.save();ctx.beginPath();ctx.rect(mL,0,pw*prog+2,H);ctx.clip();
ctx.beginPath();let started=false;
pts.forEach(p=>{if(!p){started=false;return;}if(!started){ctx.moveTo(p.x,p.y);started=true;}else ctx.lineTo(p.x,p.y);});
ctx.strokeStyle='#f59e0b';ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();
pts.forEach(p=>{if(!p)return;ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,7);ctx.fillStyle='#f59e0b';ctx.fill();ctx.strokeStyle=dark?'#0f172a':'#ffffff';ctx.lineWidth=1.5;ctx.stroke();});
ctx.restore();
sleepLayouts[id]={days,data,X,Yh,Yq,mL,pw,W,H};
if(!cv._sh){cv._sh=true;
cv.addEventListener('mousemove',ev=>{const L=sleepLayouts[id];if(!L)return;const r=cv.getBoundingClientRect(),x=ev.clientX-r.left;
const i=clamp(Math.floor((x-L.mL)/(L.pw/L.days.length)),0,L.days.length-1);
const d=L.days[i],en=L.data[dkey(d)];
let tip=cv.parentNode.querySelector('.sleepTip');
if(!tip){tip=document.createElement('div');tip.className='sleepTip';tip.style.cssText='position:absolute;pointer-events:none;background:#0d3b3a;color:#fff;font-size:11px;border-radius:8px;padding:6px 9px;z-index:10;box-shadow:0 4px 12px rgba(0,0,0,.35);line-height:1.7';cv.parentNode.appendChild(tip);}
if(!en){tip.style.display='none';drawSleepChart(id,1);return;}
tip.innerHTML='<b>'+fdate(d)+'</b><br><span style="color:#2dd4bf">▮</span> '+num(en.hours)+' '+(lang==='fa'?'ساعت':'h')+'<br><span style="color:#f59e0b">●</span> '+(lang==='fa'?'کیفیت':'Q')+': '+num(en.q)+'/5';
tip.style.display='block';tip.style.left=clamp(cv.offsetLeft+L.X(i)-45,4,cv.offsetLeft+L.W-100)+'px';tip.style.top=(cv.offsetTop+8)+'px';
drawSleepChart(id,1);
const c2=cv.getContext('2d');c2.save();c2.strokeStyle='#f59e0b';c2.setLineDash([3,3]);c2.beginPath();c2.moveTo(L.X(i),12);c2.lineTo(L.X(i),L.H-22);c2.stroke();c2.restore();});
cv.addEventListener('mouseleave',()=>{const tip=cv.parentNode.querySelector('.sleepTip');if(tip)tip.style.display='none';drawSleepChart(id,1);});}
}
function animateSleepChart(id){const t0=performance.now();(function f(tm){const p=Math.min(1,(tm-t0)/600);drawSleepChart(id,p);if(p<1)requestAnimationFrame(f);})(t0);}
window.addEventListener('resize',()=>{drawSleepChart('sleepChart',1);drawSleepChart('dashSleepChart',1);});
const _origRenderDash=renderDash;
renderDash=function(){_origRenderDash();
const existed=!!$('dashSleepChart');
if(!existed){const wrap=document.createElement('div');
wrap.className='rounded-xl border border-teal-900/10 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-5 mb-6 relative';
wrap.innerHTML='<div class="flex items-center justify-between mb-2 flex-wrap gap-2"><h3 class="font-bold">😴 <span id="dashSleepTitle"></span></h3><span class="text-[11px] text-slate-400" id="dashSleepLegend"></span></div><canvas id="dashSleepChart" style="width:100%;height:190px"></canvas>';
if($('statStrip'))$('statStrip').insertAdjacentElement('afterend',wrap);}
const _dt=$('dashSleepTitle');if(_dt)_dt.textContent=lang==='fa'?'روند خواب (۱۴ روز اخیر)':'Sleep trend (last 14 days)';
const _dl=$('dashSleepLegend');if(_dl)_dl.innerHTML='<span style="color:#2dd4bf">▮</span> '+(lang==='fa'?'ساعت خواب':'hours')+' · <span style="color:#f59e0b">●</span> '+(lang==='fa'?'کیفیت':'quality');
if(existed)drawSleepChart('dashSleepChart',1);else animateSleepChart('dashSleepChart');};
const _origShowTab=showTab;
showTab=function(id){_origShowTab(id);if(id==='dash')drawSleepChart('dashSleepChart',1);};
buildSleepView();

/* ---- 5) yesterday catch-up (past-midnight logging) ---- */
function renderCatchup(){const y=new Date();y.setDate(y.getDate()-1);const yk=dkey(y);
const ds=todayDoses(y).filter(d=>!getLog(yk,d.key));const box=$('catchupBox');if(!box)return;
if(!ds.length){box.classList.add('hidden');return;}box.classList.remove('hidden');
$('catchupList').innerHTML=ds.map(d=>`<div class="flex flex-wrap items-center gap-3 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3"><span class="text-xl">${d.med.emoji}</span><div class="flex-1 min-w-0"><b>${d.med.name}</b> <span class="text-xs text-slate-500">${d.med.dose} · ${fmtTime(d.time)}</span></div><button onclick="catchupAct('take','${d.key}')" class="bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg px-3 py-1.5 text-sm">${t('took')}</button><button onclick="catchupAct('skip','${d.key}')" class="bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg px-3 py-1.5 text-sm">${t('skipped')}</button></div>`).join('');}
function catchupAct(a,key){const y=new Date();y.setDate(y.getDate()-1);const yk=dkey(y);
const d=todayDoses(y).find(x=>x.key===key);if(!d)return;
if(a==='take'){const m=S.meds.find(x=>x.id===d.med.id);if(m&&m.remaining!=null)m.remaining=Math.max(0,m.remaining-1);setLog(yk,key,{s:'late',t:Date.now(),lateLog:true});}
else setLog(yk,key,{s:'skip',t:Date.now(),lateLog:true});
persist();renderCatchup();renderMeds();renderDash();if(curTab==='adh')renderAdh();toast(a==='take'?'⏱️ '+(lang==='fa'?'برای دیروز ثبت شد':'Logged for yesterday'):'⏭️');}

/* ---- 6) service-worker notifications WITH actions (override notify/alertDose) ---- */
function notify(title,body,dose){if(stealth()){title='🔔';body=lang==='fa'?'یادآوری':'Reminder';}
if(window.SWREG&&'Notification'in window&&Notification.permission==='granted'){try{window.SWREG.showNotification(title,{body,requireInteraction:true,tag:dose?dose.key:'rem',data:dose?{key:dose.key,name:dose.med.name,dose:dose.med.dose,time:dose.time}:null,actions:stealth()?[]:[{action:'take',title:(lang==='fa'?'خوردم ✅':'Taken ✅')},{action:'skip',title:(lang==='fa'?'نخوردم ❌':'Skipped ❌')}]});}catch(e){}}
else if('Notification'in window&&Notification.permission==='granted'){try{new Notification(title,{body});}catch(e){}}}
function alertDose(d){showBanner(d);notify('💊 '+d.med.name,d.med.dose,d);beep();if(navigator.vibrate)navigator.vibrate([120,60,120]);}
if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){navigator.serviceWorker.register('sw.js').then(r=>{window.SWREG=r;}).catch(()=>{});
navigator.serviceWorker.addEventListener('message',e=>{const m=e.data||{};if(m.type==='DOSE_ACTION'){const d=todayDoses(new Date()).find(x=>x.key===m.key);if(d){if(m.action==='take')takeDose(d);else if(m.action==='skip')skipDose(d);}}});}

/* ---- 1) Android PWA: app badge + deep-link tabs + state extras ---- */
function updateBadge(){try{const doses=todayDoses(new Date());const pending=doses.filter(d=>!getLog(d.date,d.key)).length;
if(navigator.setAppBadge){if(pending>0)navigator.setAppBadge(pending);else if(navigator.clearAppBadge)navigator.clearAppBadge();}}catch(e){}}
setInterval(updateBadge,30000);
const _origEnsure=ensureState;
ensureState=function(){_origEnsure();S.checkinHistory=S.checkinHistory||[];S.sleep=S.sleep||{nights:[],naps:[]};};
const _origEnter=enterApp;
enterApp=function(){_origEnter();updateBadge();try{const p=new URLSearchParams(location.search);const tab=p.get('tab');if(tab)showTab(tab);
const act=p.get('dose'),key=p.get('key');if(act&&key){const d=todayDoses(new Date()).find(x=>x.key===key);if(d){if(act==='take')takeDose(d);else if(act==='skip')skipDose(d);}}}catch(e){}};
