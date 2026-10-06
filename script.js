// ====== CONFIGURATION ======
// URL of your deployed backend (no trailing slash), e.g. 'https://plantcare-ai.onrender.com'
// Leave '' only if the backend itself serves this site (same origin).
const API_BASE = '';
// ===========================
let TOKEN=''; try{TOKEN=localStorage.getItem('pc_token')||''}catch(e){}
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TYPES={Tomato:['🍅',2],Mint:['🌿',1],Chilli:['🌶️',3],Basil:['🌱',2],Spinach:['🥬',2],Rose:['🌹',3],'Aloe Vera':['🪴',10],Other:['🌱',3]};
const ST={healthy:'✅ Healthy',warning:'🟡 Warning',attention:'⚠️ Needs Care',recovering:'🔄 Recovering',critical:'🔴 Critical'};
const STG=['Healthy','Warning','Needs Care','Recovering','Healthy'],MOB=['dash','doc','weather','water','chat'];
const TIPS={Tomato:['Keep soil evenly moist, water at the base','Give 6–8 hours of sunlight','Prune lower leaves for airflow','Check leaves weekly'],Mint:['Keep soil moist, never soggy','Partial sun is ideal','Trim often to encourage growth','Repot when roots crowd'],Chilli:['Let top soil dry between watering','Needs full sun','Feed every 2–3 weeks while fruiting','Watch for aphids under leaves'],Basil:['Water when top inch is dry','6+ hours of sun','Pinch flower buds','Protect from cold'],Other:['Keep soil slightly moist','Give enough sunlight','Remove unhealthy leaves','Check leaves regularly']};
const day=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})};
let S={plants:[
 {id:1,name:'Tomato',type:'Tomato',loc:'Balcony',lw:1,st:'healthy',dis:'',h:[{d:day(6),s:'healthy',sc:95}]},
 {id:2,name:'Mint',type:'Mint',loc:'Kitchen',lw:1,st:'healthy',dis:'',h:[{d:day(6),s:'healthy',sc:92}]},
 {id:3,name:'Chilli',type:'Chilli',loc:'Terrace',lw:1,st:'healthy',dis:'',h:[{d:day(6),s:'healthy',sc:90}]},
 {id:4,name:'Basil',type:'Basil',loc:'Window',lw:0,st:'healthy',dis:'',h:[{d:day(6),s:'healthy',sc:94}]}],
 wx:{k:'Sunny',t:28,h:62,rain:0,pp:0,src:'manual'},v:'home',pid:1,img:null,res:null,busy:false};
const lw=p=>Math.floor((Date.now()-p.lwAt)/864e5);
function migrate(){S.plants.forEach(p=>{if(p.lwAt===undefined){p.lwAt=Date.now()-(p.lw||0)*864e5;delete p.lw}if(p.st==='critical')p.st='attention'});S.wx={rain:0,pp:0,src:'manual',...S.wx}}
let lastTs=0,wt=null,writing=false,SYNC='local',AI={ok:null};
const AUTH={user:null,mode:'login'};
const payload=()=>({plants:S.plants,wx:S.wx});
const setTok=t=>{TOKEN=t||'';try{t?localStorage.setItem('pc_token',t):localStorage.removeItem('pc_token')}catch(e){}};
async function api(u,b,m){const h=b?{'Content-Type':'application/json'}:{};if(TOKEN)h.Authorization='Bearer '+TOKEN;const r=await fetch(API_BASE+u,{method:m||(b?'POST':'GET'),headers:h,body:b?JSON.stringify(b):undefined});const j=await r.json().catch(()=>({}));if(!r.ok)throw {code:j.error||('http_'+r.status),status:r.status};return j}
const save=()=>{if(AUTH.user){clearTimeout(wt);wt=setTimeout(push,700)}};
async function push(){wt=null;if(writing)return setTimeout(push,500);writing=true;try{const j=await api('/api/garden',{data:payload()},'PUT');lastTs=j.ts;SYNC='cloud'}catch(e){SYNC='err';if(e.status===401){AUTH.user=null;render()}}writing=false;badge()}
function badge(){const e=$('#sync');if(e)e.textContent={cloud:'☁️ Saved to your account',local:'Not signed in',err:'⚠️ Sync error — retrying on next change'}[SYNC]}
async function loadGarden(){const g=await api('/api/garden');if(g.data&&g.data.plants){S.plants=g.data.plants;S.wx=g.data.wx||S.wx;lastTs=g.ts;migrate()}else{migrate();await push()}SYNC='cloud'}
setInterval(async()=>{if(!AUTH.user||writing||wt||['INPUT','SELECT'].includes(document.activeElement.tagName))return;try{const g=await api('/api/garden');if(g.data&&g.ts>lastTs){lastTs=g.ts;S.plants=g.data.plants;S.wx=g.data.wx||S.wx;migrate();render()}}catch(e){if(e.status===401){AUTH.user=null;render()}}},15000);
function authView(){const l=AUTH.mode==='login';return `<div class="card" style="max-width:420px;margin:8vh auto"><div style="text-align:center"><div style="font-size:42px">🌿</div><h2>PlantCare AI</h2><p style="color:var(--mut)">Smart care for every plant</p></div><label>Email</label><input id="em" type="email" autocomplete="email"><label>Password (8+ characters)</label><input id="pw" type="password" autocomplete="${l?'current-password':'new-password'}" onkeydown="if(event.key==='Enter')doAuth()"><div id="aerr" class="note" style="display:none"></div><button class="btn" style="width:100%;margin-top:16px" onclick="doAuth()">${l?'Log in':'Create account'}</button><p style="text-align:center;color:var(--mut)">${l?'New here?':'Have an account?'} <a href="#" onclick="AUTH.mode='${l?'reg':'login'}';render();return false" style="color:var(--g2)">${l?'Create account':'Log in'}</a></p></div>`}
async function doAuth(){try{const j=await api(AUTH.mode==='login'?'/api/login':'/api/register',{email:$('#em').value,password:$('#pw').value});setTok(j.token);AUTH.user=j.email;AI={ok:j.ai};await loadGarden();render();afterLogin()}catch(e){const x=$('#aerr');x.style.display='block';x.textContent=e.code}}
async function logout(){try{await api('/api/logout',{})}catch(e){}setTok('');location.reload()}
function afterLogin(){if(S.wx.lat&&(S.wx.city!=='My location'||S.wx.consent==='granted')&&Date.now()-(S.wx.at||0)>18e5)getWx(S.wx.lat,S.wx.lon,S.wx.city)}
function aiBadge(){const e=$('#ai');if(e)e.textContent=AI.ok===null?'⏳ Checking AI…':AI.ok?'🟢 Real AI vision ready':'🟠 AI unavailable — demo mode only'}
function toJpeg(u){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>{const m=Math.min(1,1280/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*m);c.height=Math.round(i.height*m);c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.85).split(',')[1])};i.onerror=()=>rej({code:'bad_image'});i.src=u})}
function delPlant(id){if(!confirm('Remove this plant and its history?'))return;S.plants=S.plants.filter(x=>x.id!=id);save();go('dash')}
const FX={Sunny:.8,Hot:.6,Cloudy:1,Rainy:1.8},WI={Sunny:'☀️',Hot:'🔥',Cloudy:'☁️',Rainy:'🌧️'};
const wxAdvice={Sunny:'Warm and sunny — soil dries faster, so water slightly more often.',Hot:'Very hot — water more often, preferably early morning or evening.',Cloudy:'Cloudy — normal watering routine.',Rainy:'Rain expected — water less and make sure pots drain well.'};
const ico=p=>(TYPES[p.type]||TYPES.Other)[0];
function wAdv(p){const base=(TYPES[p.type]||TYPES.Other)[1],iv=Math.max(1,Math.round(base*FX[S.wx.k])),hrs=Math.ceil((p.lwAt+iv*864e5-Date.now())/36e5),so=p.soil||'moist';let t,why,h;
 if(S.wx.k==='Rainy'){t="Don't water";why='Rain expected ('+(S.wx.rain||0)+' mm, '+(S.wx.pp||0)+'% chance) — let it do the work.';h=24}
 else if(so==='wet'){t="Don't water";why='Soil is already wet — overwatering causes root rot. Re-check tomorrow.';h=24}
 else if(so==='dry'){t='Water today';why=S.wx.k==='Hot'?'Soil is dry and it is hot — water early morning or evening.':'Soil is dry.';h=0}
 else if(hrs<=0){t='Water today';why='Schedule is due for '+p.type+' in '+S.wx.k.toLowerCase()+' weather.';h=0}
 else if(hrs<=72){t='Water after '+hrs+' hours';why='Soil is moist; next watering is due then.';h=hrs}
 else{t="Don't water";why='Soil is moist; next watering in about '+Math.ceil(hrs/24)+' days.';h=hrs}
 return{t,why,h,d:Math.ceil(h/24)}}
function nextIn(p){return wAdv(p).d}
function setSoil(id,v){S.plants.find(x=>x.id==id).soil=v;save();render()}
const wlabel=n=>n==0?'Today':n==1?'Tomorrow':'In '+n+' days';
const NAV=[['home','🏠','Home'],['dash','📊','Dashboard'],['doc','🔬','AI Doctor'],['weather','🌦️','Weather'],['water','💧','Watering'],['chat','🤖','Assistant'],['hist','📈','History']];
function go(v,id){S.v=v;if(id)S.pid=id;render();scrollTo(0,0)}
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.append(e);setTimeout(()=>e.remove(),2600)}
function render(){
 document.body.classList.toggle('anon',!AUTH.user);if(!AUTH.user){$('#v').innerHTML='<div class="fade">'+authView()+'</div>';return}
 const act=S.v==='plant'?'dash':S.v;
 $('#nav').innerHTML=NAV.map(n=>`<button class="${act===n[0]?'on':''}" onclick="go('${n[0]}')">${n[1]} ${n[2]}</button>`).join('');
 $('#tabs').innerHTML=MOB.map(i=>NAV.find(n=>n[0]==i)).map(n=>`<button class="${act===n[0]?'on':''}" onclick="go('${n[0]}')"><span>${n[1]}</span>${n[2]}</button>`).join('');
 $('#v').innerHTML='<div class="fade">'+({home,dash,doc,weather,water:water_page,chat,hist,plant}[S.v])()+'</div>';
 if(S.v==='doc')bindDoc();badge();
}
function home(){return `<div class="hero"><h1>Grow smarter with AI</h1><p>Identify plant diseases, get care advice and keep every plant in your urban garden healthy.</p><button class="btn w" onclick="go('doc')">🔍 Check My Plant</button> <button class="btn w" style="background:transparent;color:#fff;border:1.5px solid #ffffff88" onclick="go('dash')">My Plants</button><div class="em">🍅</div></div>
<div class="grid">${[['🔬','1 · AI Image Diagnosis','Upload a leaf photo for a real AI diagnosis with severity and treatment.'],['🌦️','2 · Live Weather','Temperature, humidity and rainfall for your location.'],['💧','3 · Smart Watering','Schedules adapt to plant type and live weather.'],['🤖','4 · AI Assistant','Ask a plant expert chatbot that knows your garden.'],['📈','5 · Health History','Healthy → Warning → Needs Care → Recovering → Healthy.']].map(f=>`<div class="card"><div style="font-size:30px">${f[0]}</div><h3 style="margin:8px 0 4px">${f[1]}</h3><span style="color:var(--mut)">${f[2]}</span></div>`).join('')}</div>`}
function dash(){const P=S.plants,hl=P.filter(p=>p.st=='healthy').length,w=P.filter(p=>nextIn(p)==0).length;
 const hr=new Date().getHours(),g=hr<12?'Good Morning':hr<18?'Good Afternoon':'Good Evening';
 const rem=alerts();
 return `<div class="top"><div><h2>${g}! 🌱</h2><p>Here's how your garden is doing today.</p></div><span><button class="btn o" onclick="logout()">Log out</button> <button class="btn o" onclick="go('hist')">📈 History</button> <button class="btn" onclick="addModal()">＋ Add Plant</button></span></div>
<div class="stats">${[['🌱','Plants',P.length],['✅','Healthy',hl],['⚠️','Needs Attention',P.length-hl],['💧','Water Today',w]].map(s=>`<div class="stat">${s[0]} <span>${s[1]}</span><b>${s[2]}</b></div>`).join('')}</div>
<h3 class="sec" style="margin-top:0">My Plants</h3><div class="grid">${P.map(p=>`<div class="card plant"><div class="ic">${ico(p)}</div><h3>${esc(p.name)}</h3><small>${esc(p.loc)}</small><br><span class="pill ${p.st}">${ST[p.st]}${p.dis?' · '+esc(p.dis):''}</span><div style="color:var(--mut);font-size:13px;margin-bottom:12px">💧 Water: ${wlabel(nextIn(p))}</div><button class="btn o" onclick="go('plant',${p.id})">View Details</button></div>`).join('')}</div>
<h3 class="sec">🔔 Today's Reminders</h3><div class="card">${rem.length?rem.map(r=>`<div class="row"><span style="font-size:22px">${r[0]}</span><b style="flex:1">${esc(r[1])}</b><span style="color:var(--mut)">${r[2]}</span></div>`).join(''):'All caught up 🎉'}</div>`}
function addModal(){$('#ov').innerHTML=`<div class="modal" onclick="if(event.target==this)this.remove()"><div class="card"><h2>🌱 Add New Plant</h2>
<label>Plant Name</label><input id="an" placeholder="e.g. Balcony Tomato"><label>Plant Type</label><select id="at">${Object.keys(TYPES).map(t=>`<option>${t}</option>`).join('')}</select>
<label>Date Added</label><input id="ad" type="date" value="${new Date().toISOString().slice(0,10)}"><label>Location</label><select id="al"><option>Balcony</option><option>Terrace</option><option>Kitchen</option><option>Window</option><option>Garden</option></select>
<div style="display:flex;gap:10px;margin-top:20px"><button class="btn" style="flex:1" onclick="addPlant()">Add Plant</button><button class="btn o" onclick="$('#ov').innerHTML=''">Cancel</button></div></div></div>`}
function addPlant(){const t=$('#at').value,n=$('#an').value.trim()||t;const id=Date.now();S.plants.push({id,name:n,type:t,loc:$('#al').value,lwAt:Date.now(),st:'healthy',dis:'',h:[{d:day(0),s:'healthy',sc:95}]});save();$('#ov').innerHTML='';S.pid=id;toast('✅ '+n+' has been added successfully!');render()}
function plant(){const p=S.plants.find(x=>x.id==S.pid)||S.plants[0];if(!p)return go('dash');const tips=TIPS[p.type]||TIPS.Other;
 return `<div class="top"><div><h2>${ico(p)} ${esc(p.name)}</h2><p>${esc(p.type)} · ${esc(p.loc)}</p></div><button class="btn o" onclick="go('dash')">← Back</button></div>
${stages(p)}<div class="two" style="margin-top:18px"><div class="card"><small style="color:var(--mut)">Health Status</small><br><span class="pill ${p.st}">${ST[p.st]}</span>
<p><b>Disease</b><br>${p.dis?esc(p.dis):'None detected'}</p><p><b>💧 Watering</b><br>${wAdv(p).t}<br><small style="color:var(--mut)">${esc(wAdv(p).why)}</small></p><p><b>🌤️ Weather</b><br>${WI[S.wx.k]} ${S.wx.t}°C · ${S.wx.k}</p>
<button class="btn" onclick="S.sel=${p.id};go('doc')">🔬 Scan Leaf</button> <button class="btn o" onclick="water(${p.id})">💧 Mark Watered</button> <button class="btn o" onclick="delPlant(${p.id})">🗑 Remove</button></div>
<div class="card"><h3>🌱 Care Tips</h3><ul class="chk">${tips.map(t=>`<li>${t}</li>`).join('')}</ul></div></div>
<h3 class="sec">Health History</h3><div class="card">${chart(p)}</div>`}
function water(id){const p=S.plants.find(x=>x.id==id);p.lwAt=Date.now();p.soil='moist';save();toast('💧 '+p.name+' marked as watered');render()}
function chart(p){const h=p.h.slice(-8);const W=520,H=150,x=i=>30+i*(W-60)/Math.max(1,h.length-1),y=v=>H-20-(v/100)*(H-40);
 const pts=h.map((e,i)=>x(i)+','+y(e.sc)).join(' ');
 return `${prog(p)}<svg viewBox="0 0 ${W} ${H+30}" style="width:100%;overflow:visible"><g stroke="var(--line)">${[0,50,100].map(v=>`<line x1="30" x2="${W-30}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g><g fill="var(--mut)" font-size="10"><text x="0" y="${y(100)+3}">100%</text><text x="4" y="${y(50)+3}">50%</text></g>
 <polyline points="${pts}" fill="none" stroke="var(--g2)" stroke-width="3" stroke-linecap="round"/>${h.map((e,i)=>`<circle cx="${x(i)}" cy="${y(e.sc)}" r="5" fill="${e.s=='healthy'?'var(--g2)':e.s=='attention'?'var(--warn)':'var(--bad)'}"/><text x="${x(i)}" y="${H+8}" font-size="10" text-anchor="middle" fill="var(--mut)">${esc(e.d)}</text>`).join('')}</svg>
 <div style="margin-top:8px">${p.h.slice(-20).reverse().map(e=>`<div class="row">${e.th?`<img src="${e.th}" style="width:44px;height:44px;border-radius:10px;object-fit:cover">`:''}<div style="flex:1"><b>${esc(e.d)}</b> · ${esc(e.n||'')}${e.conf!=null?' · '+e.conf+'% conf':''}${e.sev&&e.sev!=='none'?' · '+esc(e.sev):''}</div><span class="pill ${e.s}" style="margin:0">${ST[e.s]}</span></div>`).join('')}</div>`}
function hist(){return `<div class="top"><div><h2>📈 Health History</h2><p>Every scan, tracked per plant.</p></div></div>`+S.plants.map(p=>`<h3 class="sec" style="margin-top:18px">${ico(p)} ${esc(p.name)}</h3><div class="card">${chart(p)}</div>`).join('')}
function water_page(){const w=S.wx;return `<div class="top"><div><h2>💧 Smart Watering</h2><p>Schedules adjust to plant type and weather.</p></div></div>
<div class="card" style="margin-bottom:14px;display:flex;gap:14px;flex-wrap:wrap;align-items:center"><b style="font-size:20px">${WI[w.k]} ${w.t}°C · ${w.k}</b><span style="color:var(--mut)">💧 ${w.h}% · 🌧️ ${w.rain||0} mm · ☔ ${w.pp||0}%</span><span class="pill ${w.src==='live'?'healthy':'attention'}" style="margin:0">${w.src==='live'?'🟢 Live':'✋ Manual'}</span><button class="btn o" style="margin-left:auto" onclick="go('weather')">Update weather</button></div><div class="note" style="background:var(--g3);color:var(--g1);margin:0 0 20px">💡 ${wxAdvice[w.k]}</div>
<div class="grid">${S.plants.map(p=>{const a=wAdv(p),c=a.h==0?'healthy':a.t.startsWith("Don")?'warning':'recovering',lwd=lw(p);return `<div class="card"><h3>${ico(p)} ${esc(p.name)}</h3><div class="pill ${c}" style="font-size:14px">${a.h==0?'💧':a.t.startsWith("Don")?'🚫':'⏳'} ${a.t}</div><p style="color:var(--mut);margin:4px 0">${esc(a.why)}</p><small style="color:var(--mut)">Last watered: ${lwd==0?'Today':lwd==1?'Yesterday':lwd+' days ago'}</small><label>Soil condition (check with your finger)</label><select onchange="setSoil(${p.id},this.value)">${[['dry','🏜️ Dry'],['moist','💧 Moist'],['wet','🌊 Wet / soggy']].map(x=>`<option value="${x[0]}" ${(p.soil||'moist')==x[0]?'selected':''}>${x[1]}</option>`).join('')}</select><br><br><button class="btn o" onclick="water(${p.id})">Mark watered</button></div>`}).join('')}</div></div>`}
function setWx(k){S.wx={...S.wx,k,src:'manual',t:{Hot:36,Sunny:28,Cloudy:23,Rainy:20}[k],h:{Hot:40,Sunny:62,Cloudy:70,Rainy:90}[k],rain:k=='Rainy'?5:0,pp:k=='Rainy'?80:10};save();render()}
// ---------- AI Doctor ----------
const DEMO={Tomato:{plant:'Tomato',disease:'Early Blight',conf:92,sev:'moderate',sym:['Dark brown spots with concentric rings','Yellowing around lesions','Lower leaves affected first'],act:['Remove affected leaves and bin them','Keep the plant area clean','Improve air circulation','Avoid excess moisture on leaves'],prev:'Water at the base, rotate crops yearly.'}};
function doc(){const opts=S.plants.map(p=>`<option value="${p.id}" ${p.id==(S.sel||S.plants[0]?.id)?'selected':''}>${ico(p)} ${esc(p.name)}</option>`).join('');
 return `<div class="top"><div><h2>🔬 AI Plant Doctor</h2><p>Upload a clear picture of your plant leaf.</p></div></div>
<div class="two"><div><div class="card"><div id="ai" class="badge"></div><label style="margin-top:0">Which plant is this?</label><select id="sp">${opts}</select>
<div class="drop" id="dz" style="margin-top:16px">${S.img?`<img src="${S.img.url}">`:'<div style="font-size:48px">📷</div><b>Upload Leaf Image</b><div style="color:var(--mut);font-size:13px">Tap or drop a photo · JPG / PNG</div>'}${S.busy?'<div class="scanline"></div>':''}</div>
<input type="file" id="fi" accept="image/*" hidden>
<div style="margin-top:16px"><button class="btn" id="go" style="width:100%" ${S.img&&!S.busy?'':'disabled'} onclick="analyze()">${S.busy?'Analyzing…':'Analyze Plant'}</button></div>
<div id="prog" style="margin-top:14px"></div></div></div><div id="out">${S.res?result(S.res):`<div class="card" style="text-align:center;color:var(--mut)"><div style="font-size:46px">🌿</div>Your diagnosis will appear here.</div>`}</div></div>`}
function bindDoc(){aiBadge();const dz=$('#dz'),fi=$('#fi');dz.onclick=()=>!S.busy&&fi.click();
 dz.ondragover=e=>e.preventDefault();dz.ondrop=e=>{e.preventDefault();pick(e.dataTransfer.files[0])};fi.onchange=()=>pick(fi.files[0])}
function pick(f){if(!f||!f.type.startsWith('image/'))return toast('Please choose an image file');S.img={f,url:URL.createObjectURL(f)};S.res=null;S.sel=+$('#sp')?.value||S.sel;render()}
async function analyze(){
 const sel=+$('#sp').value;S.sel=sel;const p=S.plants.find(x=>x.id==sel);S.busy=true;S.res=null;render();
 let pct=0;const tick=setInterval(()=>{pct=Math.min(92,pct+Math.random()*7);const e=$('#prog');if(e)e.innerHTML=`<div style="font-size:13px;color:var(--mut);margin-bottom:6px">Analyzing your plant… 🤖 ${Math.round(pct)}%</div><div class="bar"><i style="width:${pct}%"></i></div>`},300);
 let r,demo=false,why='';
 try{if(!AI.ok)throw {code:'unavailable'};r=await api('/api/analyze',{image:await toJpeg(S.img.url),plantType:p.type});
 }catch(e){demo=true;why=(e&&e.code)||'error';r=DEMO[p.type]||{plant:p.type,disease:'Leaf Spot',conf:84,sev:'mild',sym:['Small brown spots on leaf','Slight yellowing at edges'],act:['Remove affected leaves','Avoid wetting foliage','Improve air circulation','Re-check in 3 days'],prev:'Keep leaves dry and spaced apart.'}}
 clearInterval(tick);const e=$('#prog');if(e)e.innerHTML=`<div class="bar"><i style="width:100%"></i></div>`;
 await new Promise(r=>setTimeout(r,350));S.busy=false;S.res={...r,demo,why,pid:sel};mkThumb(S.img.url).then(t=>{if(S.res)S.res.th=t});render()}
const WHY={not_granted:'You declined AI access.',rate_limited:'The AI is rate-limited right now.',unavailable:'The server has no ANTHROPIC_API_KEY set.',ai_error:'The AI service returned an error.'};
function result(r){
 const bn=r.demo?`<div class="alert bad">🧪 <b>DEMO MODE — not a real AI diagnosis.</b> ${WHY[r.why]||'The AI request failed.'} This is a built-in sample and does not analyse your photo.</div>`:`<div class="alert ok">🟢 Real AI image analysis</div>`;
 if(r.is_plant===false)return `<div class="card res">${bn}<h2>🤔 Couldn't read this image</h2><p>${esc(r.disease)}</p><p style="color:var(--mut)">Try a close, well-lit photo of a single leaf.</p></div>`;
 const ok=/healthy/i.test(r.disease),c=Math.max(0,Math.min(100,Math.round(+r.conf||0))),sv=r.sev||'none',low=!r.demo&&(c<60||sv==='severe');
 return `<div class="card res ${r.demo?'dm':''}">${bn}<div style="color:var(--mut);font-size:13px">🌿 ${esc(r.plant)} leaf</div>
 <div style="color:var(--mut);font-size:12px;margin-top:10px">DISEASE DETECTED</div><h2>${ok?'✅ None — plant looks healthy':'⚠️ '+esc(r.disease)}</h2>
 <div style="margin:16px 0 4px;display:flex;justify-content:space-between"><b>Confidence</b><b>${c}%</b></div><div class="bar"><i style="width:${c}%"></i></div>
 <div style="margin:12px 0"><b>Severity:</b> <span class="pill ${sv=='severe'?'critical':sv=='moderate'?'attention':sv=='mild'?'warning':'healthy'}" style="margin:0 0 0 6px">${esc(sv)}</span></div>
 ${low?`<div class="alert warn">🩺 <b>Consult an expert.</b> ${c<60?'Confidence is low ('+c+'%).':'This looks severe.'} Please confirm with a local agricultural officer or nursery before treating.</div>`:''}
 ${(r.sym||[]).length?`<h3 style="font-size:17px">🔎 Symptoms detected</h3><ul class="chk">${r.sym.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
 <h3 style="margin-top:14px;font-size:17px">💊 Recommended treatment</h3><ul class="chk">${(r.act||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
 ${r.prev?`<p style="color:var(--mut)"><b>Prevention:</b> ${esc(r.prev)}</p>`:''}${r.water?`<p style="color:var(--mut)"><b>💧 Watering:</b> ${esc(r.water)}</p>`:''}
 <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><button class="btn" onclick="saveRes()">${r.demo?'Save demo result':'Save to my plant'}</button>${r.demo&&AI.ok?'<button class="btn o" onclick="analyze()">Retry with real AI</button>':''}<button class="btn o" onclick="S.img=null;S.res=null;render()">Scan Another Leaf</button></div></div>`}
const RK={none:0,mild:1,moderate:2,severe:3};
function saveRes(){const r=S.res,p=S.plants.find(x=>x.id==r.pid);if(!p||r.saved)return;
 const ok=/healthy/i.test(r.disease),c=+r.conf||0,rk=RK[r.sev]||0,prev=p.rk||0;let st;
 if(c<50)st=p.st==='healthy'?'warning':p.st;
 else if(ok)st=p.st==='healthy'?'healthy':p.st==='recovering'?'healthy':'recovering';
 else st=(prev>rk&&p.st!=='healthy')?'recovering':rk>=2?'attention':'warning';
 p.st=st;p.dis=st==='healthy'?'':(ok?p.dis:r.disease);p.rk=ok?0:rk;p.scanAt=Date.now();
 p.h.push({d:day(0),s:st,sc:{healthy:ok?Math.max(85,c):92,warning:70,attention:45,recovering:75}[st],n:(r.demo?'[Demo] ':'')+(ok?'Healthy scan':r.disease),conf:c,sev:r.sev||'none',th:r.th||''});p.h=p.h.slice(-25);
 r.saved=true;save();toast('✅ '+p.name+' → '+ST[st].replace(/^\S+ /,''));go('plant',p.id)}
function mkThumb(u){return new Promise(res=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas'),m=Math.min(1,72/Math.max(i.width,i.height));c.width=Math.round(i.width*m);c.height=Math.round(i.height*m);c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.6))};i.onerror=()=>res('');i.src=u})}
function prog(p){const sc=p.h.map(e=>e.sc),min=Math.min(...sc),last=sc[sc.length-1],pc=p.st==='healthy'?100:Math.round(Math.max(0,Math.min(100,(last-min)/Math.max(1,92-min)*100))),sick=p.h.filter(e=>e.s!=='healthy').length;
 return `<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between"><b>Recovery progress</b><b>${pc}%</b></div><div class="bar"><i style="width:${pc}%"></i></div><small style="color:var(--mut)">${p.h.length} scan${p.h.length>1?'s':''} saved · ${sick} with problems</small></div>`}
function stages(p){const done=p.h.some(e=>e.s=='recovering'),i=p.st=='healthy'?(done?4:0):({warning:1,attention:2,recovering:3}[p.st]??0);
 return `<div class="card"><h3 style="margin-bottom:12px;font-size:17px">Health timeline</h3><div class="stg">${STG.map((t,j)=>`<div class="${j<i?'done':j==i?'cur':''}">${['✅','🟡','⚠️','🔄','✅'][j]} ${t}</div>`).join('<span style="color:var(--mut)">→</span>')}</div></div>`}
function alerts(){const o=[],rainy=S.wx.k==='Rainy';
 S.plants.forEach(p=>{const n=nextIn(p),iv=(TYPES[p.type]||TYPES.Other)[1];
  if(n==0)o.push(['💧','Water '+p.name+(lw(p)>iv+1?' (overdue)':''),'Today']);
  else if(rainy&&n<=1)o.push(['🌧️','Rain expected — skip watering '+p.name,'Today']);
  else if(n==1)o.push(['🌱','Water '+p.name,'Tomorrow']);
  if(p.st!=='healthy'&&Date.now()-(p.scanAt||0)>2592e5)o.push(['🔍','Re-scan '+p.name+' to track recovery','Due'])});return o}
// ---------- weather ----------
async function getWx(lat,lon,city){S.wxMsg='Fetching live weather…';render();
 try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&daily=precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=2`);if(!r.ok)throw 0;
  const j=await r.json(),c=j.current,rain=Math.max(c.precipitation||0,j.daily.precipitation_sum[0]||0),pp=j.daily.precipitation_probability_max[0]||0,code=c.weather_code;
  let k=code>=51?'Rainy':code<=1?'Sunny':'Cloudy';if(rain>=2||pp>=70)k='Rainy';else if(c.temperature_2m>=35)k='Hot';
  S.wx={k,t:Math.round(c.temperature_2m),h:Math.round(c.relative_humidity_2m),rain:+rain.toFixed(1),pp,src:'live',city:city||S.wx.city,lat,lon,at:Date.now(),consent:S.wx.consent};S.wxMsg='';save()}
 catch(e){S.wxMsg='Live weather could not be reached from here (network blocked or offline) — using manual conditions.';S.wx.src='manual'}render()}
async function findCity(){const q=$('#city').value.trim();if(!q)return;S.wxMsg='Searching…';render();
 try{const r=await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&name='+encodeURIComponent(q)),j=await r.json(),x=j.results&&j.results[0];if(!x){S.wxMsg='City not found.';return render()}getWx(x.latitude,x.longitude,x.name)}
 catch(e){S.wxMsg='Live weather could not be reached from here — use manual conditions below.';render()}}
function locCard(w){const g=w.consent==='granted';return `<div class="card" style="margin-bottom:16px"><b>📍 Location access ${g?'· <span style="color:var(--g2)">allowed</span>':''}</b><p style="color:var(--mut);margin:6px 0 12px">${g?'Your device location is used only to fetch local weather and is saved with your garden. You can revoke it anytime.':'Optional. If you allow it, your device location is used only to fetch local weather. Or skip this and search a city below.'}</p>${g?'<button class="btn o" onclick="locate()">Refresh from my location</button> <button class="btn o" onclick="revokeLoc()">Revoke access</button>':'<button class="btn" onclick="allowLoc()">Allow location</button>'}</div>`}
function allowLoc(){S.wx.consent='granted';save();locate()}
function revokeLoc(){const mine=S.wx.city==='My location';S.wx={...S.wx,consent:'denied',src:'manual'};if(mine){delete S.wx.lat;delete S.wx.lon;delete S.wx.city}save();toast('Location access revoked');render()}
function locate(){if(S.wx.consent!=='granted')return toast('Tap “Allow location” first');if(!navigator.geolocation)return toast('Location not supported here');S.wxMsg='Getting your location…';render();navigator.geolocation.getCurrentPosition(p=>getWx(p.coords.latitude,p.coords.longitude,'My location'),()=>{S.wxMsg='Location permission denied or unavailable — search a city instead.';render()})}
function weather(){const w=S.wx,live=w.src==='live';
 return `<div class="top"><div><h2>🌦️ Live Weather</h2><p>${w.city?esc(w.city)+' · ':''}Drives your watering schedule.</p></div><span class="pill ${live?'healthy':'attention'}">${live?'🟢 Live · Open-Meteo':'✋ Manual conditions'}</span></div>
${locCard(w)}<div class="card"><div style="font:600 52px Fraunces,serif">${WI[w.k]} ${w.t}°C <span style="font-size:20px;color:var(--mut)">${w.k}</span></div>
<div class="stats" style="margin:16px 0"><div class="stat"><span>💧 Humidity</span><b>${w.h}%</b></div><div class="stat"><span>🌧️ Rain today</span><b>${w.rain||0} mm</b></div><div class="stat"><span>☔ Rain chance</span><b>${w.pp||0}%</b></div></div>
<div class="note" style="background:var(--g3);color:var(--g1)">💡 ${wxAdvice[w.k]}</div>
<label>Location</label><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="city" style="flex:1;min-width:160px" placeholder="Search a city" value="${esc(w.city&&w.city!='My location'?w.city:'')}" onkeydown="if(event.key==='Enter')findCity()"><button class="btn" onclick="findCity()">Get weather</button></div>
${S.wxMsg?`<div class="note">${esc(S.wxMsg)}</div>`:''}
<label>Manual override (used when offline)</label><div class="wx">${Object.keys(FX).map(k=>`<button class="${w.k==k&&!live?'on':''}" onclick="setWx('${k}')">${WI[k]} ${k}</button>`).join('')}</div></div>`}
// ---------- chat ----------
const bub=m=>`<div class="b ${m.role}">${esc(m.content||'…').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>')}</div>`;
function chat(){const m=S.chat||[];return `<div class="top"><div><h2>🤖 Plant Assistant</h2><p>Ask about diseases, watering or care — it knows your garden.</p></div></div><div class="card"><div id="msgs" class="msgs">${m.length?m.map(bub).join(''):'<div style="color:var(--mut)">Try a question below 👇</div>'}</div>
<div class="wx">${['Why are my tomato leaves yellow?','Should I water today?','How do I treat early blight?'].map(q=>`<button onclick="ask(this.textContent)">${q}</button>`).join('')}</div>
<div style="display:flex;gap:8px"><input id="ci" placeholder="Ask the AI…" onkeydown="if(event.key==='Enter')ask()"><button class="btn" onclick="ask()">Send</button></div>${AI.ok?'':'<div class="note">🟠 AI assistant unavailable — the server has no ANTHROPIC_API_KEY configured.</div>'}</div>`}
function upd(){const e=$('#msgs');if(e){e.innerHTML=S.chat.map(bub).join('');e.scrollTop=e.scrollHeight}}
async function ask(q){const i=$('#ci');q=(typeof q==='string'?q:i.value).trim();if(!q||S.busyChat)return;if(!AI.ok)return toast('AI unavailable here');
 S.chat=S.chat||[];S.chat.push({role:'user',content:q},{role:'assistant',content:''});S.busyChat=true;render();
 const ctx=S.plants.map(p=>`${p.name} (${p.type}): ${p.st}${p.dis?', '+p.dis:''}, soil ${p.soil||'moist'}, watering advice: ${wAdv(p).t}`).join('; ')+`. Weather: ${S.wx.t}°C, ${S.wx.k}, humidity ${S.wx.h}%, rain ${S.wx.rain||0}mm.`;
 const ins='You are the PlantCare AI assistant for urban gardeners. Be concise (under 120 words), practical, organic-first. Say when you are unsure, and advise consulting a local agricultural expert for severe or unclear problems. The user\'s garden: ';
 let t=S.chat.slice(0,-1).slice(-7);while(t.length&&t[0].role!=='user')t.shift();t=t.map((m,k)=>k==0?{role:'user',content:ins+ctx+'\n\nQuestion: '+m.content}:m);
 try{const j=await api('/api/chat',{messages:t});S.chat[S.chat.length-1].content=j.text}catch(e){S.chat[S.chat.length-1].content='Sorry, the assistant could not answer ('+((e&&e.code)||'error')+').'}
 S.busyChat=false;upd()}
(async()=>{try{const j=await api('/api/me');AUTH.user=j.email;AI={ok:j.ai};await loadGarden()}catch(e){AI={ok:false}}render();aiBadge();afterLogin()})();
