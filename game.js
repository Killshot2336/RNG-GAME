/* Voidline Galaxy Farm — monolith engine */
(function () {
  'use strict';
  var BLITZ_MS = 1800000, CLONE_MS = 60000, XP_LVL = 500;
  var SAVE_PREFIX = 'voidline_galaxy_farm_v2_';
  var LEGACY_SAVE = 'voidline_galaxy_farm_v1';
  var SESSION_KEY = 'voidline_active_player';
  var APP_VERSION = '3';
  var VERSION_KEY = 'voidline_app_version';
  var SAVE_VERSION = 3;
  var PORTAL_BASE_COST = 25000;
  var PLAYERS = [
    { id: 'aden', label: 'Aden', avatar: '🌌', defaultName: 'Aden' },
    { id: 'dad', label: 'Dad', avatar: '🛸', defaultName: 'Dad' },
    { id: 'jamie', label: 'Jamie', avatar: '👾', defaultName: 'Jamie' },
  ];
  var RARITY_COLORS = { Common:'#A78BFA', Rare:'#00F0FF', Epic:'#A855F7', Legendary:'#39FF14', Mythic:'#FFD700' };
  var PREFIXES = ['Void','Nebula','Cosmic','Quantum','Dark','Plasma','Stellar','Rift','Hyper','Null','Astral','Chrono','Solar','Lunar','Nova','Echo','Phantom','Radiant','Obsidian','Cryo','Ember','Prism','Vortex','Zenith'];
  var SUFFIXES = ['Kush','Haze','Dream','Mist','Bloom','Leaf','Root','Spore','Crystal','Nectar','Pulse','Wave','Shard','Orb','Veil','Drift','Surge','Glow','Frost','Flare','Whisper','Storm','Seed','Essence'];
  var RORDER = ['Common','Rare','Epic','Legendary','Mythic'];
  var PACKS = [
    { type:'basic', name:'Basic Void Pack', price:5000, emoji:'📦', desc:'Random procedural strain' },
    { type:'guaranteed', name:'Guaranteed Rift Pack', price:25000, emoji:'🎁', desc:'Rare+ guaranteed' },
    { type:'omega', name:'Omega Rift Pack', price:100000, spCost:50, emoji:'🌌', desc:'Epic+ cosmic anomaly (cash or SP)' },
  ];
  var STORE = [
    { id:'nutrient-a', name:'Nebula Nutrients', type:'nutrient', price:1200, emoji:'🧪' },
    { id:'nutrient-b', name:'Void Bloom Mix', type:'nutrient', price:3500, emoji:'💧' },
    { id:'pipe-a', name:'Quantum Pipe Mk.I', type:'pipe', price:8000, emoji:'🔧' },
    { id:'pipe-b', name:'Hyperflow Conduit', type:'pipe', price:18000, emoji:'⚙️' },
  ];
  var AVATARS = ['🌌','🛸','👾','🌿','💫','🔮','🪐','⚡'];
  var BADGES = [{id:'harvester',emoji:'🌾',label:'Harvester'},{id:'rift',emoji:'🌀',label:'Rift Walker'},{id:'omega',emoji:'💎',label:'Omega Tier'},{id:'cloner',emoji:'🧬',label:'Clone Master'},{id:'trader',emoji:'🤝',label:'Void Trader'},{id:'blitz',emoji:'⚡',label:'Blitz King'}];
  var BLITZ = [
    {id:'blitz-1',name:'Hyperdrive Yield',description:'+15% passive revenue',modifier:0.15,modifierType:'revenue',price:50000,purchased:false},
    {id:'blitz-2',name:'Rift Amplifier',description:'+20% strain yield',modifier:0.2,modifierType:'yield',price:75000,purchased:false},
    {id:'blitz-3',name:'Scan Burst',description:'+25% sector scan rate',modifier:0.25,modifierType:'scan',price:60000,purchased:false},
    {id:'blitz-4',name:'Clone Accelerator',description:'-30% clone time',modifier:0.3,modifierType:'clone',price:90000,purchased:false},
    {id:'blitz-5',name:'Pack Resonance',description:'+10% pack rarity luck',modifier:0.1,modifierType:'packLuck',price:120000,purchased:false},
  ];
  var SECTORS = [
    {id:'thrusters',name:'Frictionless Thrusters',level:0,maxLevel:10,baseCost:15000,scanRateBonus:0.08},
    {id:'radar',name:'Cosmic Radar',level:0,maxLevel:10,baseCost:22000,scanRateBonus:0.12},
    {id:'shield',name:'Shield Insulation',level:0,maxLevel:10,baseCost:18000,scanRateBonus:0.06},
  ];
  var PERSIST = ['saveVersion','cash','sp','empireLevel','empireXp','name','avatar','badgeIds','storefrontSlots','strains','inventory','factoryFloors','sectorUpgrades','blitzUpgrades','blitzEndsAt','purchasedBlitzIds','counterPrices','cloneJob','focusedStrainId','farmSubTab','nextPortalNum'];

  // #region agent log
  function dbg(loc, msg, data, hyp) {
    var entry = {sessionId:'2fa0f7',location:loc,message:msg,data:data||{},hypothesisId:hyp||'',timestamp:Date.now()};
    fetch('http://127.0.0.1:7825/ingest/8c9ecf9b-388a-4677-b541-9cbe65b40bf1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2fa0f7'},body:JSON.stringify(entry)}).catch(function(){});
    try {
      var ring = JSON.parse(localStorage.getItem('vl_debug_ring') || '[]');
      ring.push(entry);
      if (ring.length > 40) ring = ring.slice(-40);
      localStorage.setItem('vl_debug_ring', JSON.stringify(ring));
    } catch (e) {}
  }
  // #endregion

  function esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function fmtCash(v){if(v>=1e12)return'$'+(v/1e12).toFixed(2)+'T';if(v>=1e9)return'$'+(v/1e9).toFixed(2)+'B';if(v>=1e6)return'$'+(v/1e6).toFixed(2)+'M';if(v>=1e3)return'$'+(v/1e3).toFixed(1)+'K';return'$'+v.toFixed(2);}
  function fmtRev(v){return fmtCash(v)+'/sec';}
  function fmtCd(ms){var t=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
  function fmtSp(v){return v.toLocaleString()+' SP';}
  function rngSeed(seed){var s=seed>>>0;return function(){s=(s+0x6d2b79f5)>>>0;var t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function pickRarity(rng,minR,luck){luck=luck||0;var roll=rng()-luck*0.05,r;if(roll>0.97)r='Mythic';else if(roll>0.92)r='Legendary';else if(roll>0.82)r='Epic';else if(roll>0.55)r='Rare';else r='Common';if(minR&&RORDER.indexOf(r)<RORDER.indexOf(minR))r=minR;return r;}
  function rMult(r){return({Mythic:2.8,Legendary:2.2,Epic:1.7,Rare:1.3})[r]||1;}
  function genStrain(seed,minR,luck){var rng=rngSeed(seed),p=PREFIXES[Math.floor(rng()*PREFIXES.length)],su=SUFFIXES[Math.floor(rng()*SUFFIXES.length)],v=Math.floor(rng()*999),rar=pickRarity(rng,minR,luck),m=rMult(rar);return{id:'strain_'+seed+'_'+Date.now(),name:p+' '+su+' #'+v,seed:seed,thcPercent:parseFloat((12+rng()*18*m).toFixed(1)),yield:Math.round((30+rng()*70)*m),quantity:1,hue:Math.floor(rng()*360),rarity:rar,potency:Math.round((40+rng()*60)*m),flavor:Math.round((35+rng()*55)*m),resilience:Math.round((25+rng()*50)*m),discoveredAt:Date.now()};}
  function genPack(type,seed,opts){opts=opts||{};var s=seed!=null?seed:Math.floor(Math.random()*0xffffffff),luck=(opts.packLuckBonus||0)+(opts.scanBonus||0)*0.1;if(type==='guaranteed')return genStrain(s,'Rare',luck);if(type==='omega')return genStrain(s,'Epic',luck);return genStrain(s,undefined,luck);}
  function revSec(s){return(s.yield*s.quantity*s.thcPercent)/100;}
  function gridLayout(strains,seed){var rng=rngSeed(seed);return strains.map(function(s){return{strainId:s.id,x:rng()*80+10,y:rng()*70+15,scale:0.85+rng()*0.3,rot:(rng()-0.5)*12};});}
  function emptySF(){return[{strainId:null,price:0},{strainId:null,price:0},{strainId:null,price:0}];}
  function mergeStrains(arr,incoming){var i=arr.findIndex(function(s){return s.seed===incoming.seed||s.name===incoming.name;});if(i>=0){var u=arr.slice();u[i]=Object.assign({},u[i],{quantity:u[i].quantity+1});return u;}return arr.concat([incoming]);}
  function upCost(s){var m={Common:1,Rare:2,Epic:4,Legendary:8,Mythic:15};return Math.floor(8000*(m[s.rarity]||1)*(1+s.potency/100));}
  function clone(o){return JSON.parse(JSON.stringify(o));}
  function playerDef(id){return PLAYERS.find(function(p){return p.id===id;})||PLAYERS[0];}
  function saveKey(pid){return SAVE_PREFIX+pid;}

  var UI={activeTab:'farm',profileOpen:false,settingsOpen:false,realityWarp:false,liftedCardId:null,liftOnUpgrade:null,playerSelectOpen:false};
  var G=null;
  var activePlayerId=null;
  var dialogueState={lastKey:'',lastAt:0,count:0};
  var portalNames=['Portal Alpha','Portal Beta','Portal Gamma','Portal Delta','Portal Epsilon','Portal Zeta'];

  function freshState(pid){var p=playerDef(pid);return{
    playerId:pid,saveVersion:SAVE_VERSION,cash:250000,sp:100,empireLevel:1,empireXp:0,name:p.defaultName,avatar:p.avatar,badgeIds:[null,null,null],
    storefrontSlots:emptySF(),strains:[],inventory:STORE.map(function(i){return Object.assign({},i,{owned:0});}),
    factoryFloors:[],sectorUpgrades:clone(SECTORS),blitzUpgrades:clone(BLITZ),
    blitzEndsAt:Date.now()+BLITZ_MS,purchasedBlitzIds:[],counterPrices:{},
    cloneJob:null,focusedStrainId:null,packReveal:{open:false,packType:null,strain:null},
    farmSubTab:'portal',transactionBeam:null,lastTickAt:Date.now(),nextPortalNum:1,
  };}

  function readPlayerSave(pid){try{var r=localStorage.getItem(saveKey(pid));if(!r)return null;return JSON.parse(r);}catch(e){return null;}}
  function saveGame(){if(!G||!activePlayerId)return;try{G.saveVersion=SAVE_VERSION;var p={playerId:activePlayerId,saveVersion:SAVE_VERSION};PERSIST.forEach(function(k){p[k]=G[k];});localStorage.setItem(saveKey(activePlayerId),JSON.stringify(p));}catch(e){}}
  function sanitizeSave(pid){
    delete G.planetOffers;
    delete G.profileViewIndex;
    var p=playerDef(pid);
    if(G.name==='VoidPilot_Aden'||G.name==='VoidPilot')G.name=p.defaultName;
    if(!G.saveVersion||G.saveVersion<SAVE_VERSION){
      var hadLegacyFloors=(G.factoryFloors||[]).length>=3&&!G.nextPortalNum;
      if(!G.saveVersion||hadLegacyFloors||G.saveVersion<2){
        G.factoryFloors=[];
        G.nextPortalNum=1;
      }
      G.saveVersion=SAVE_VERSION;
      // #region agent log
      dbg('game.js:sanitizeSave','migrated save',{playerId:pid,hadLegacyFloors:hadLegacyFloors,floors:(G.factoryFloors||[]).length,empireLevel:G.empireLevel},'H2');
      // #endregion
    }
  }
  function loadGame(pid){
    var d=readPlayerSave(pid);
    var fromLegacy=false;
    if(!d&&pid==='aden'){try{var leg=localStorage.getItem(LEGACY_SAVE);if(leg){d=JSON.parse(leg);fromLegacy=true;}}catch(e){}}
    G=d?Object.assign(freshState(pid),d,{playerId:pid}):freshState(pid);
    if(!G.factoryFloors)G.factoryFloors=[];
    if(!G.nextPortalNum)G.nextPortalNum=(G.factoryFloors.length||0)+1;
    sanitizeSave(pid);
    // #region agent log
    dbg('game.js:loadGame','loaded player save',{playerId:pid,empireLevel:G.empireLevel,name:G.name,fromLegacy:fromLegacy,floorCount:G.factoryFloors.length,saveVersion:G.saveVersion},'H1');
    // #endregion
  }

  function getSharedOffers(){
    var offers=[];
    PLAYERS.forEach(function(pl){
      if(pl.id===activePlayerId)return;
      var save=readPlayerSave(pl.id);
      if(!save||!save.storefrontSlots)return;
      save.storefrontSlots.forEach(function(slot,si){
        if(!slot.strainId||!slot.price)return;
        var strain=(save.strains||[]).find(function(s){return s.id===slot.strainId;});
        if(!strain)return;
        offers.push({id:pl.id+'-slot-'+si,strainName:strain.name,thcPercent:strain.thcPercent,yield:strain.yield,offerPrice:slot.price,sellerName:save.name||pl.label,sellerId:pl.id});
      });
    });
    // #region agent log
    dbg('game.js:getSharedOffers','shared board offers',{count:offers.length,sellers:offers.map(function(o){return o.sellerName;})},'H3');
    // #endregion
    return offers;
  }

  function topStrain(){
    if(G.focusedStrainId){var f=G.strains.find(function(s){return s.id===G.focusedStrainId;});if(f)return f;}
    if(!G.strains.length)return null;
    return G.strains.slice().sort(function(a,b){return revSec(b)-revSec(a);})[0];
  }

  function plantLine(reason){
    var s=topStrain(),pl=playerDef(activePlayerId);
    if(!s)return pl.label+', the Index is empty. Hit Shop and wake me up with a fresh pack.';
    var lines={
      welcome:'Yo '+pl.label+'. It\'s me, '+s.name+'. I run this farm now.',
      pack:'*rustle* '+s.name+' just joined the crew. Smells loud.',
      portal:'New portal online. Stick a strain in me and watch me print.',
      clone:'Cloning '+s.name+'… my roots are tingling.',
      equip:s.name+' locked into the portal. We\'re growing.',
      upgrade:s.name+' got stronger. I feel that in my leaves.',
      lowcash:'Wallet\'s dry, '+pl.label+'. Equip a portal strain or open a pack.',
      revenue:s.name+' here — pulling '+fmtRev(revSecTotal())+' for the empire.',
      empty_board:'Share board\'s quiet. List a strain in your Profile storefront.',
      tab_shop:'Shop time. I need siblings in the Index.',
      tab_farm:'Farm deck open. Portals need strains to breathe.',
      tab_index:'Index online. Tap me — I\'m the top plant.',
    };
    return lines[reason]||s.name+' watching the void… keep farming.';
  }

  function plantSay(reason,force){
    var key=reason+'|'+(topStrain()?topStrain().id:'none');
    var now=Date.now();
    if(!force&&key===dialogueState.lastKey&&now-dialogueState.lastAt<45000)return;
    dialogueState.lastKey=key;dialogueState.lastAt=now;dialogueState.count++;
    var el=document.getElementById('overlay-dialogue');
    var mascot=document.getElementById('plant-mascot');
    var s=topStrain();
    if(el){el.textContent=plantLine(reason);el.classList.add('visible');}
    if(mascot){
      mascot.textContent=s?'🌿':'🌱';
      mascot.style.filter=s?'hue-rotate('+(s.hue)+'deg)':'none';
      mascot.title=s?s.name:'No strain yet';
    }
    // #region agent log
    dbg('game.js:plantSay','dialogue fired',{reason:reason,count:dialogueState.count,strain:s?s.name:null,force:!!force},'H4');
    // #endregion
  }

  function selectPlayer(pid){
    if(activePlayerId&&G)saveGame();
    activePlayerId=pid;
    try{sessionStorage.setItem(SESSION_KEY,pid);}catch(e){}
    loadGame(pid);
    UI.playerSelectOpen=false;
    UI.activeTab='farm';
    // #region agent log
    dbg('game.js:selectPlayer','player selected',{playerId:pid,empireLevel:G.empireLevel,name:G.name},'H1');
    // #endregion
    plantSay('welcome',true);
    render();
  }

  function switchPlayerPrompt(){saveGame();UI.playerSelectOpen=true;UI.profileOpen=false;render();}

  function blitzMod(t){return G.blitzUpgrades.filter(function(b){return b.purchased&&b.modifierType===t;}).reduce(function(s,b){return s+b.modifier;},0);}
  function scanMult(){return G.sectorUpgrades.reduce(function(s,x){return s+x.level*x.scanRateBonus;},0)+blitzMod('scan');}
  function revMs(){var rm=1+blitzMod('revenue'),ym=1+blitzMod('yield'),t=0;G.factoryFloors.forEach(function(f){if(!f.equippedStrainId)return;var s=G.strains.find(function(x){return x.id===f.equippedStrainId;});if(s)t+=revSec(s)*f.level*rm*ym;});G.inventory.forEach(function(i){if(i.type==='nutrient'&&i.owned>0)t+=i.owned*0.5;});return t/1000;}
  function revSecTotal(){return revMs()*1000;}
  function blitzRem(){return Math.max(0,G.blitzEndsAt-Date.now());}
  function cloneRem(){return G.cloneJob?Math.max(0,G.cloneJob.startedAt+G.cloneJob.durationMs-Date.now()):0;}
  function portalCost(){return PORTAL_BASE_COST*G.nextPortalNum;}
  function addXp(amt){var xp=G.empireXp+amt,lvl=G.empireLevel;while(xp>=lvl*XP_LVL){xp-=lvl*XP_LVL;lvl++;}G.empireXp=xp;G.empireLevel=lvl;}

  function tick(now){var d=now-G.lastTickAt;if(d<=0)return;G.cash+=revMs()*d;if(G.cloneJob&&now>=G.cloneJob.startedAt+G.cloneJob.durationMs)completeClone();G.lastTickAt=now;}
  function completeClone(){if(!G.cloneJob)return;var sid=G.cloneJob.strainId;G.cloneJob=null;var i=G.strains.findIndex(function(s){return s.id===sid;});if(i<0)return;G.strains=G.strains.slice();G.strains[i]=Object.assign({},G.strains[i],{quantity:G.strains[i].quantity+1});plantSay('clone');}
  function buyPack(type){var p=PACKS.find(function(x){return x.type===type;});if(!p)return false;var nc=G.cash,ns=G.sp;if(type==='omega'&&G.cash<p.price&&p.spCost&&G.sp>=p.spCost)ns-=p.spCost;else if(G.cash<p.price)return false;else{nc-=p.price;ns+=Math.floor(p.price/500);}var strain=genPack(type,Date.now()+Math.floor(Math.random()*99999),{scanBonus:scanMult(),packLuckBonus:blitzMod('packLuck')});G.cash=nc;G.sp=ns;G.packReveal={open:true,packType:type,strain:strain};return true;}
  function closePack(){if(G.packReveal.strain){G.strains=mergeStrains(G.strains,G.packReveal.strain);if(!G.focusedStrainId)G.focusedStrainId=G.packReveal.strain.id;addXp(25);plantSay('pack',true);}G.packReveal={open:false,packType:null,strain:null};}
  function buyBlitz(id){var u=G.blitzUpgrades.find(function(b){return b.id===id;});if(!u||u.purchased||G.cash<u.price)return false;var first=!G.purchasedBlitzIds.length;G.cash-=u.price;G.blitzUpgrades=G.blitzUpgrades.map(function(b){return b.id===id?Object.assign({},b,{purchased:true}):b;});G.purchasedBlitzIds=G.purchasedBlitzIds.concat([id]);if(first)G.blitzEndsAt=Date.now()+BLITZ_MS;return true;}
  function buyItem(id){var it=G.inventory.find(function(i){return i.id===id;});if(!it||G.cash<it.price)return false;G.cash-=it.price;G.inventory=G.inventory.map(function(i){return i.id===id?Object.assign({},i,{owned:i.owned+1}):i;});return true;}
  function upSector(id){var s=G.sectorUpgrades.find(function(x){return x.id===id;});if(!s||s.level>=s.maxLevel)return false;var c=s.baseCost*(s.level+1);if(G.cash<c)return false;G.cash-=c;G.sectorUpgrades=G.sectorUpgrades.map(function(x){return x.id===id?Object.assign({},x,{level:x.level+1}):x;});return true;}
  function acceptOffer(oid){var offers=getSharedOffers(),o=offers.find(function(x){return x.id===oid;});if(!o||G.cash<o.offerPrice)return false;var s=genPack('guaranteed',oid.split('').reduce(function(a,c){return a+c.charCodeAt(0);},0));s.name=o.strainName;s.thcPercent=o.thcPercent;s.yield=o.yield;G.cash-=o.offerPrice;G.strains=mergeStrains(G.strains,s);return true;}
  function counterOffer(oid){var offers=getSharedOffers(),o=offers.find(function(x){return x.id===oid;}),c=G.counterPrices[oid];if(!o||!c||c<=0||G.cash<c||c<o.offerPrice*0.85)return false;var s=genPack('basic',c);s.name=o.strainName;s.thcPercent=o.thcPercent;s.yield=o.yield;G.cash-=c;G.strains=mergeStrains(G.strains,s);return true;}
  function buyPortal(){var cost=portalCost();if(G.cash<cost)return false;G.cash-=cost;var n=G.nextPortalNum,name=portalNames[(n-1)%portalNames.length]||('Portal #'+n);G.factoryFloors=G.factoryFloors.concat([{id:'floor-'+n,name:name,equippedStrainId:null,level:1}]);G.nextPortalNum=n+1;plantSay('portal',true);return true;}
  function equipFloor(fid,sid){G.factoryFloors=G.factoryFloors.map(function(f){return f.id===fid?Object.assign({},f,{equippedStrainId:sid||null}):f;});if(sid)plantSay('equip');}
  function startClone(sid){if(G.cloneJob)return false;if(!G.strains.find(function(s){return s.id===sid;}))return false;G.cloneJob={strainId:sid,startedAt:Date.now(),durationMs:CLONE_MS*(1-blitzMod('clone'))};return true;}
  function upStrain(sid){var i=G.strains.findIndex(function(s){return s.id===sid;});if(i<0)return false;var s=G.strains[i],c=upCost(s);if(G.cash<c)return false;G.cash-=c;var u=G.strains.slice();u[i]=Object.assign({},s,{yield:Math.round(s.yield*1.12),potency:Math.min(100,s.potency+5),thcPercent:parseFloat(Math.min(35,s.thcPercent+0.8).toFixed(1))});G.strains=u;addXp(10);plantSay('upgrade');return true;}

  function strainCardHtml(s,opts){opts=opts||{};var c=RARITY_COLORS[s.rarity]||'#A855F7',sel=opts.selected?' selected':'',comp=opts.compact,p='padding:'+(comp?'0.5rem':'0.75rem');return '<button type="button" class="strain-card'+sel+'" data-strain-focus="'+esc(s.id)+'" style="background:linear-gradient(135deg,hsl('+s.hue+',50%,12%),rgba(31,0,51,0.8));border:1px solid '+c+'55"><div style="'+p+'"><div class="flex-between"><div style="min-width:0;flex:1"><div class="font-mono" style="font-size:0.5rem;color:'+c+'">'+esc(s.rarity.toUpperCase())+'</div><div style="font-weight:600;font-size:'+(comp?'0.75rem':'0.875rem')+';overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(s.name)+'</div></div>'+(comp?'':'<div style="font-size:1.5rem;filter:hue-rotate('+s.hue+'deg)">🌿</div>')+'</div><div class="font-mono" style="font-size:0.55rem;margin-top:'+(comp?'0.25rem':'0.5rem')+'"><span class="text-green">TH-C '+s.thcPercent+'%</span> <span class="text-muted">YLD '+s.yield+'</span> <span style="color:#00F0FF">x'+s.quantity+'</span></div></div></button>';}
  function liftWrap(id,inner,onUp){return '<div class="liftable-wrap" data-lift="'+esc(id)+'" data-lift-up="'+(onUp||'')+'"><div class="neon-card p-4">'+inner+'</div></div>';}

  function renderHUD(){
    document.getElementById('hud-avatar').textContent=G.avatar;
    document.getElementById('hud-name').textContent=G.name;
    document.getElementById('hud-level').textContent='LV.'+G.empireLevel;
    document.getElementById('hud-cash').textContent=fmtCash(G.cash);
    document.getElementById('phone-shell').classList.toggle('dimmed',!!UI.liftedCardId);
    document.getElementById('voidline-app').classList.toggle('reality-warp-active',UI.realityWarp);
    document.getElementById('overlay-reality-warp').classList.toggle('active',UI.realityWarp);
    document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===UI.activeTab);});
    var s=topStrain(),mascot=document.getElementById('plant-mascot'),label=document.getElementById('plant-label');
    if(mascot){mascot.textContent=s?'🌿':'🌱';mascot.style.filter=s?'hue-rotate('+(s.hue)+'deg)':'none';}
    if(label)label.textContent=s?esc(s.name):'No strain';
  }

  function renderPlayerSelect(){
    var el=document.getElementById('overlay-player-select');
    if(!el)return;
    if(!UI.playerSelectOpen){el.classList.remove('open');return;}
    el.classList.add('open');
    var h='<div class="overlay-panel p-5 text-center"><h2 class="font-display chromatic-text mb-2" style="font-size:1rem;letter-spacing:0.15em">WHO ARE YOU?</h2><p class="text-muted text-xs mb-4">Each person gets their own save on this device.</p><div class="player-pick-grid">';
    PLAYERS.forEach(function(pl){
      var save=readPlayerSave(pl.id);
      var lvl=save?save.empireLevel:1;
      h+='<button type="button" class="player-pick-card" data-action="pick-player" data-pid="'+pl.id+'"><div style="font-size:2rem">'+pl.avatar+'</div><div style="font-weight:700">'+esc(pl.label)+'</div><div class="font-mono text-muted" style="font-size:0.55rem">'+esc(save?(save.name||pl.label):'New game')+' · Lv.'+lvl+'</div></button>';
    });
    h+='</div></div>';
    el.innerHTML=h;
  }

  function renderShop(){var h='<div class="screen-section"><div class="text-center mb-2"><h2 class="font-display chromatic-text" style="font-size:1.125rem;letter-spacing:0.2em">NEBULA MARKET</h2><p class="font-mono text-muted" style="font-size:0.65rem;margin-top:0.25rem">Balance: '+fmtCash(G.cash)+'</p></div><div class="section-label section-label-green mb-2">MYSTERY PACKS</div>';PACKS.forEach(function(p){var dis=G.cash<p.price&&!(p.type==='omega'&&p.spCost&&G.sp>=p.spCost);h+=liftWrap('pack-'+p.type,'<div class="flex-row"><div style="font-size:1.875rem">'+p.emoji+'</div><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:0.875rem">'+esc(p.name)+'</div><div class="text-muted text-xs">'+esc(p.desc)+'</div><div class="text-green font-mono text-xs" style="font-weight:700;margin-top:0.25rem">'+fmtCash(p.price)+(p.spCost?' or '+p.spCost+' SP':'')+'</div></div><button type="button" class="game-btn game-btn-green game-btn-sm" data-action="buy-pack" data-pack="'+p.type+'"'+(dis?' disabled':'')+'>OPEN</button></div>','buy-pack:'+p.type);});h+='<div class="neon-card neon-card-green p-4 mb-3"><div class="flex-between mb-3"><div><div class="font-mono text-green" style="font-size:0.55rem;letter-spacing:0.15em">30-MIN BLITZ FEED</div><div style="font-weight:700;font-size:0.875rem">Permanent Modifiers</div></div><div class="font-mono text-green" style="font-size:1.125rem;font-weight:700">'+fmtCd(blitzRem())+'</div></div>';G.blitzUpgrades.forEach(function(u){h+='<div class="flex-between p-3 mb-2" style="background:rgba(0,0,0,0.35);border-radius:0.75rem;border:1px solid '+(u.purchased?'rgba(100,100,100,0.3)':'rgba(57,255,20,0.25)')+'"><div style="flex:1;margin-right:0.5rem"><div style="font-size:0.75rem;font-weight:600">'+esc(u.name)+'</div><div class="text-muted" style="font-size:0.55rem">'+esc(u.description)+'</div></div><button type="button" class="game-btn game-btn-sm'+(u.purchased?'':' game-btn-green')+'" data-action="buy-blitz" data-id="'+u.id+'"'+(u.purchased||G.cash<u.price?' disabled':'')+'>'+(u.purchased?'PURCHASED':fmtCash(u.price))+'</button></div>';});h+='</div><div class="section-label mb-2">GENERAL STORE</div>';G.inventory.forEach(function(it){h+='<div class="neon-card p-3 mb-2"><div class="flex-row"><div style="font-size:1.5rem">'+it.emoji+'</div><div style="flex:1"><div style="font-weight:600;font-size:0.875rem">'+esc(it.name)+'</div><div class="text-muted" style="font-size:0.55rem">'+it.type+' · Owned: '+it.owned+'</div></div><button type="button" class="game-btn game-btn-green game-btn-sm" data-action="buy-item" data-id="'+it.id+'"'+(G.cash<it.price?' disabled':'')+'>'+fmtCash(it.price)+'</button></div></div>';});h+='</div>';return h;}

  function renderFarm(){var h='<div class="screen-section"><div class="neon-card neon-card-green p-3 text-center mb-2"><div class="font-mono text-green" style="font-size:0.55rem;letter-spacing:0.15em">PASSIVE REVENUE · SCAN +'+((scanMult()*100).toFixed(0))+'%</div><div class="font-display chromatic-text" style="font-size:1.125rem;font-weight:700">'+fmtRev(revSecTotal())+'</div></div><div class="farm-tabs mb-3">';['upgrade','control','portal'].forEach(function(t){var lbl={upgrade:'UPGRADE DECK',control:'CONTROL DECK',portal:'PORTAL FARM'}[t];h+='<button type="button" class="farm-tab'+(G.farmSubTab===t?' active':'')+'" data-action="farm-tab" data-tab="'+t+'">'+lbl+'</button>';});h+='</div>';if(G.farmSubTab==='upgrade'){h+='<div class="section-label mb-2">SECTOR SCAN RATE UPGRADES</div>';G.sectorUpgrades.forEach(function(s){var c=s.baseCost*(s.level+1);h+='<div class="neon-card p-4 mb-3"><div class="flex-between mb-2"><div><div style="font-weight:600;font-size:0.875rem">'+esc(s.name)+'</div><div class="text-muted" style="font-size:0.55rem">Lv.'+s.level+'/'+s.maxLevel+' · +'+((s.level*s.scanRateBonus*100).toFixed(0))+'% scan</div></div><button type="button" class="game-btn game-btn-green game-btn-sm" data-action="up-sector" data-id="'+s.id+'"'+(s.level>=s.maxLevel||G.cash<c?' disabled':'')+'>'+(s.level>=s.maxLevel?'MAX':fmtCash(c))+'</button></div><div class="progress-bar"><div class="progress-fill" style="width:'+(s.level/s.maxLevel*100)+'%"></div></div></div>';});}else if(G.farmSubTab==='control'){var offers=getSharedOffers();h+='<div class="section-label mb-2">PLANET SHARE BOARD</div><p class="text-muted text-xs text-center mb-3">Real listings from Aden, Dad, or Jamie — set slots in Profile.</p>';if(!offers.length){h+='<div class="neon-card p-4 text-center text-muted text-sm">No listings yet.</div>';}offers.forEach(function(o){h+='<div class="neon-card p-4 mb-3"><div class="font-mono text-muted" style="font-size:0.55rem">'+esc(o.sellerName)+'</div><div style="font-weight:600;font-size:0.875rem">'+esc(o.strainName)+'</div><div class="text-green" style="font-size:0.55rem">TH-C '+o.thcPercent+'% · Yield '+o.yield+'</div><div class="font-mono text-cyan mb-3" style="font-weight:700;font-size:0.875rem">Ask: '+fmtCash(o.offerPrice)+'</div><input type="number" class="input-field mb-2" placeholder="Counter price" data-action="counter-input" data-id="'+o.id+'" value="'+(G.counterPrices[o.id]||'')+'"><div class="flex-row gap-2"><button type="button" class="game-btn game-btn-green game-btn-sm" style="flex:1" data-action="accept-offer" data-id="'+o.id+'"'+(G.cash<o.offerPrice?' disabled':'')+'>ACCEPT</button><button type="button" class="game-btn game-btn-sm" style="flex:1" data-action="counter-offer" data-id="'+o.id+'">COUNTER</button></div></div>';});}else{h+='<div class="section-label mb-2">PORTAL FARM</div>';if(!G.factoryFloors.length){h+='<div class="neon-card p-5 text-center mb-3"><div style="font-size:2.5rem;margin-bottom:0.5rem">🌀</div><div class="text-muted text-sm mb-3">No portals yet. Buy your first portal to start growing.</div><button type="button" class="game-btn game-btn-green w-full" data-action="buy-portal"'+(G.cash<portalCost()?' disabled':'')+'>BUY PORTAL · '+fmtCash(portalCost())+'</button></div>';}G.factoryFloors.forEach(function(f){var eq=G.strains.find(function(s){return s.id===f.equippedStrainId;});h+='<div class="neon-card p-4 mb-3"><div class="flex-between mb-3"><div><div style="font-weight:600">'+esc(f.name)+'</div><div class="text-muted" style="font-size:0.55rem">Floor Lv.'+f.level+'</div></div>'+(eq?'<div class="font-mono text-green" style="font-size:0.55rem">'+esc(eq.name)+'</div>':'')+'</div><div class="conveyor-belt"><div class="conveyor-track"></div>'+(eq?'<div class="conveyor-item" style="filter:hue-rotate('+eq.hue+'deg)">🌿</div>':'')+'</div><select class="input-field" data-action="equip-floor" data-id="'+f.id+'"><option value="">— Select strain from Index —</option>';G.strains.forEach(function(s){h+='<option value="'+esc(s.id)+'"'+(f.equippedStrainId===s.id?' selected':'')+'>'+esc(s.name)+' (x'+s.quantity+')</option>';});h+='</select></div>';});if(G.factoryFloors.length){h+='<button type="button" class="game-btn game-btn-green w-full mb-3" data-action="buy-portal"'+(G.cash<portalCost()?' disabled':'')+'>+ BUY ANOTHER PORTAL · '+fmtCash(portalCost())+'</button>';}var cr=cloneRem();h+='<div class="neon-card capsule-cloner p-4 mb-3"><div class="clone-bubbles"></div><div class="font-mono text-muted mb-2" style="font-size:0.55rem;letter-spacing:0.15em">CAPSULE CLONER</div>';if(G.cloneJob){var cs=G.strains.find(function(s){return s.id===G.cloneJob.strainId;});h+='<div class="text-center py-4 clone-active"><div style="font-size:2.5rem">🧬</div><div class="font-mono text-green" style="font-size:1.125rem;font-weight:700">'+fmtCd(cr)+'</div><div class="text-muted text-xs">Cloning '+(cs?esc(cs.name):'strain')+'...</div></div>';}else{h+='<select class="input-field mb-3" id="clone-select"><option value="">— Select strain —</option>';G.strains.forEach(function(s){h+='<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>';});h+='</select><button type="button" class="game-btn game-btn-green w-full" data-action="start-clone">START CLONE (+1)</button>';}}h+='</div>';return h;}

  function renderIndex(){var h='<div class="screen-section"><div class="neon-card neon-card-green p-4 text-center mb-2"><div class="font-mono text-green" style="font-size:0.55rem;letter-spacing:0.3em">STRAIN INDEX</div><div class="font-display chromatic-text" style="font-size:1.875rem;font-weight:700">'+G.strains.length+'</div><div class="text-muted text-xs">Tap any card to lift · zero bag limit</div></div>';if(!G.strains.length){h+='<div class="neon-card p-5 text-center"><div style="font-size:1.875rem;opacity:0.5">🌿</div><div class="text-muted text-sm">No strains yet.</div></div>';}else{var layout=gridLayout(G.strains,G.strains.length*1337+42);h+='<div class="holo-grid mb-3"><div class="holo-grid-lines"></div>';layout.forEach(function(pos){var s=G.strains.find(function(x){return x.id===pos.strainId;});if(!s)return;var foc=G.focusedStrainId===s.id;h+='<button type="button" class="holo-node'+(foc?' focused':'')+'" data-strain-focus="'+esc(s.id)+'" style="left:'+pos.x+'%;top:'+pos.y+'%;transform:translate(-50%,-50%) rotate('+pos.rot+'deg) scale('+pos.scale+')"><div class="holo-node-inner" style="background:linear-gradient(135deg,hsl('+s.hue+',50%,18%),rgba(31,0,51,0.9))"><span style="font-size:1.125rem;filter:hue-rotate('+s.hue+'deg)">🌿</span><span class="font-mono text-green" style="font-size:0.4rem;font-weight:700">x'+s.quantity+'</span></div></button>';});h+='</div>';G.strains.forEach(function(s){h+=liftWrap('index-'+s.id,strainCardHtml(s,{selected:G.focusedStrainId===s.id}),'up-strain:'+s.id);});var foc=G.strains.find(function(s){return s.id===G.focusedStrainId;});if(foc)h+='<div class="font-mono text-cyan text-center p-3" style="font-size:0.6rem;border-radius:1rem;border:1px solid rgba(6,182,212,0.3);background:rgba(31,0,51,0.5)">FOCUSED: '+esc(foc.name)+' · TH-C '+foc.thcPercent+'% · x'+foc.quantity+'</div>';}h+='</div>';return h;}

  function renderProfile(){var pl=playerDef(activePlayerId),h='<div class="profile-banner"><button type="button" class="profile-close" data-close="profile">✕</button><div class="profile-avatar-lg"><div class="avatar-ring"></div><div class="avatar-inner" style="inset:4px;font-size:1.5rem;border-width:3px">'+G.avatar+'</div></div></div><div class="profile-body"><div class="font-mono text-green text-center mb-2" style="font-size:0.6rem;letter-spacing:0.2em">'+esc(pl.label.toUpperCase())+'</div><input type="text" class="input-field text-center font-display chromatic-text mb-3" id="edit-name" value="'+esc(G.name)+'" maxlength="24"><div class="stat-grid"><div class="neon-card stat-box"><div class="stat-label">CASH</div><div class="stat-value">'+fmtCash(G.cash)+'</div></div><div class="neon-card stat-box"><div class="stat-label">SP</div><div class="stat-value">'+fmtSp(G.sp)+'</div></div><div class="neon-card stat-box"><div class="stat-label">REV/SEC</div><div class="stat-value">'+fmtRev(revSecTotal())+'</div></div></div><div class="font-mono text-muted text-center mb-3" style="font-size:0.55rem">LV.'+G.empireLevel+' EMPIRE</div><div class="font-mono text-muted mb-2" style="font-size:0.5rem">AVATAR</div><div class="avatar-picker">';AVATARS.forEach(function(a){h+='<button type="button" class="avatar-opt'+(G.avatar===a?' selected':'')+'" data-action="set-avatar" data-av="'+a+'">'+a+'</button>';});h+='</div><div class="font-mono text-muted mb-2" style="font-size:0.5rem">BADGES</div><div class="grid-3 mb-3">';[0,1,2].forEach(function(slot){h+='<select class="input-field" data-action="set-badge" data-slot="'+slot+'"><option value="">—</option>';BADGES.forEach(function(b){h+='<option value="'+b.id+'"'+(G.badgeIds[slot]===b.id?' selected':'')+'>'+b.emoji+' '+b.label+'</option>';});h+='</select>';});h+='</div><div class="font-mono text-muted mb-2" style="font-size:0.5rem">STOREFRONT (3 SLOTS) — SHARE BOARD</div>';[0,1,2].forEach(function(slot){var sf=G.storefrontSlots[slot];h+='<div class="flex-row mb-2"><select class="input-field" style="flex:1" data-action="sf-strain" data-slot="'+slot+'"><option value="">Empty</option>';G.strains.forEach(function(s){h+='<option value="'+esc(s.id)+'"'+(sf.strainId===s.id?' selected':'')+'>'+esc(s.name)+'</option>';});h+='</select><input type="number" class="input-field" style="width:5rem" placeholder="Price" data-action="sf-price" data-slot="'+slot+'" value="'+(sf.price||'')+'"></div>';});h+='<div class="flex-row gap-2 mb-3"><button type="button" class="game-btn" style="flex:1" data-action="switch-player">⇄ SWITCH PLAYER</button><button type="button" class="game-btn" style="flex:1" data-action="open-settings">⚙ SETTINGS</button></div><button type="button" class="game-btn game-btn-green w-full" data-close="profile">RESUME</button></div>';document.getElementById('profile-panel').innerHTML=h;}

  function renderSettings(){document.getElementById('settings-panel').innerHTML='<div class="flex-between mb-3"><h3 class="font-display" style="font-size:0.875rem;letter-spacing:0.2em">SYSTEM CONFIG</h3><button type="button" data-close="settings" style="background:none;border:none;color:var(--muted);font-size:1.125rem;cursor:pointer">✕</button></div><div class="flex-between p-4 mb-3" style="border-radius:0.75rem;background:'+(UI.realityWarp?'rgba(57,255,20,0.08)':'rgba(31,0,51,0.5)')+';border:1px solid '+(UI.realityWarp?'rgba(57,255,20,0.4)':'rgba(61,0,102,0.6)')+'"><div><div class="chromatic-text" style="font-weight:600;font-size:0.875rem">Reality Warp Mode</div><div class="text-muted" style="font-size:0.65rem">Hyper-focus shader overlay</div></div><button type="button" class="toggle-switch" data-action="toggle-warp" style="background:'+(UI.realityWarp?'linear-gradient(90deg,#39FF14,#A855F7)':'rgba(61,0,102,0.8)')+'"><span class="toggle-knob" style="left:'+(UI.realityWarp?'calc(100% - 1.625rem)':'0.125rem')+'"></span></button></div><button type="button" class="game-btn w-full mb-2" data-action="switch-player">⇄ SWITCH PLAYER</button><p class="font-mono text-muted" style="font-size:0.6rem;line-height:1.5">Applies vignette, chromatic aberration, and rhythmic contrast breathing.</p>';}

  function renderPack(){var pr=G.packReveal;if(!pr.open||!pr.strain){document.getElementById('overlay-pack-reveal').classList.remove('open');return;}var s=pr.strain,c=RARITY_COLORS[s.rarity]||'#A855F7';document.getElementById('pack-panel').innerHTML='<div class="overlay-panel pack-reveal-card" style="background:linear-gradient(160deg,hsl('+s.hue+',60%,15%),#0C011A 50%,#1a0040);border:2px solid '+c+';box-shadow:0 0 60px '+c+'66"><div class="pack-shimmer"></div><div class="p-5 text-center" style="position:relative"><div class="font-mono text-muted mb-2" style="font-size:0.6rem;letter-spacing:0.4em">'+(pr.packType||'').toUpperCase()+' PACK OPENED</div><div style="font-size:3.75rem;margin-bottom:1rem;filter:hue-rotate('+s.hue+'deg)">🌿</div><h2 class="font-display chromatic-text mb-1">'+esc(s.name)+'</h2><div class="font-mono mb-4" style="color:'+c+';font-size:0.65rem;font-weight:700">'+esc(s.rarity.toUpperCase())+'</div><div class="grid-3 mb-4"><div class="neon-card stat-box"><div class="stat-label">TH-C</div><div class="stat-value">'+s.thcPercent+'%</div></div><div class="neon-card stat-box"><div class="stat-label">YIELD</div><div class="stat-value">'+s.yield+'</div></div><div class="neon-card stat-box"><div class="stat-label">POTENCY</div><div class="stat-value">'+s.potency+'</div></div></div><button type="button" class="game-btn game-btn-green w-full" data-close="pack">ADD TO INDEX</button></div></div>';document.getElementById('overlay-pack-reveal').classList.add('open');}

  function renderLift(){var el=document.getElementById('overlay-card-lift');if(!UI.liftedCardId){el.innerHTML='';return;}var wrap=document.querySelector('[data-lift="'+UI.liftedCardId+'"]');if(!wrap){el.innerHTML='';return;}el.innerHTML='<button type="button" class="card-lift-backdrop" data-action="dismiss-lift"></button><div class="lifted-card"><div class="neon-card">'+wrap.querySelector('.neon-card').innerHTML+'<div class="lift-actions"><button type="button" class="game-btn game-btn-green" data-action="lift-upgrade">🔋 UPGRADE CARD</button></div></div></div>';}

  function renderBeam(){var b=document.getElementById('overlay-transaction-beam');if(G.transactionBeam&&G.transactionBeam.active){b.classList.add('active');document.getElementById('beam-label').textContent=G.transactionBeam.from+' → '+G.transactionBeam.to;}else b.classList.remove('active');}

  function render(){if(!G)return;var root=document.getElementById('screen-root');var scrollTop=root?root.scrollTop:0;renderHUD();renderPlayerSelect();if(!UI.playerSelectOpen&&root){var screens={shop:renderShop,farm:renderFarm,index:renderIndex};root.innerHTML=(screens[UI.activeTab]||renderFarm)();root.scrollTop=scrollTop;}document.getElementById('overlay-profile').classList.toggle('open',UI.profileOpen);document.getElementById('overlay-settings').classList.toggle('open',UI.settingsOpen);if(UI.profileOpen)renderProfile();if(UI.settingsOpen)renderSettings();renderPack();renderLift();renderBeam();}

  var saveTimer=null;function scheduleSave(){if(saveTimer)clearTimeout(saveTimer);saveTimer=setTimeout(saveGame,800);}

  function runAction(act,val){
    if(act==='pick-player'){selectPlayer(val);return;}
    if(act==='switch-player'){switchPlayerPrompt();scheduleSave();render();return;}
    if(act==='buy-pack')buyPack(val);
    else if(act==='buy-blitz')buyBlitz(val);
    else if(act==='buy-item')buyItem(val);
    else if(act==='buy-portal')buyPortal();
    else if(act==='farm-tab')G.farmSubTab=val;
    else if(act==='up-sector')upSector(val);
    else if(act==='accept-offer')acceptOffer(val);
    else if(act==='counter-offer')counterOffer(val);
    else if(act==='equip-floor')equipFloor(val.split(':')[0],val.split(':')[1]||null);
    else if(act==='start-clone'){var sel=document.getElementById('clone-select');if(sel&&sel.value)startClone(sel.value);}
    else if(act==='up-strain')upStrain(val);
    else if(act==='set-avatar')G.avatar=val;
    else if(act==='set-badge'){var p=val.split(':');G.badgeIds=G.badgeIds.slice();G.badgeIds[parseInt(p[0],10)]=p[1]||null;}
    else if(act==='sf-strain'){var p=val.split(':');var slot=parseInt(p[0],10);G.storefrontSlots=G.storefrontSlots.slice();G.storefrontSlots[slot]=Object.assign({},G.storefrontSlots[slot],{strainId:p[1]||null});}
    else if(act==='sf-price'){var p=val.split(':');var slot=parseInt(p[0],10);G.storefrontSlots=G.storefrontSlots.slice();G.storefrontSlots[slot]=Object.assign({},G.storefrontSlots[slot],{price:parseFloat(p[1])||0});}
    else if(act==='toggle-warp')UI.realityWarp=!UI.realityWarp;
    else if(act==='open-settings'){UI.settingsOpen=true;UI.profileOpen=false;}
    else if(act==='dismiss-lift'){UI.liftedCardId=null;UI.liftOnUpgrade=null;}
    else if(act==='lift-upgrade'&&UI.liftOnUpgrade){runAction(UI.liftOnUpgrade.split(':')[0],UI.liftOnUpgrade.split(':').slice(1).join(':'));UI.liftedCardId=null;UI.liftOnUpgrade=null;}
    scheduleSave();render();
  }

  document.getElementById('voidline-app').addEventListener('click',function(e){
    var t=e.target.closest('[data-tab],[data-action],[data-close],[data-lift],[data-strain-focus]');
    if(!t)return;
    if(t.dataset.action==='pick-player'){runAction('pick-player',t.dataset.pid);return;}
    if(t.dataset.tab){var tab=t.dataset.tab;if(tab!==UI.activeTab)plantSay('tab_'+tab);UI.activeTab=tab;render();return;}
    if(t.dataset.close==='profile'){UI.profileOpen=false;render();return;}
    if(t.dataset.close==='settings'){UI.settingsOpen=false;render();return;}
    if(t.dataset.close==='pack'){closePack();render();return;}
    if(t.dataset.strainFocus){G.focusedStrainId=G.focusedStrainId===t.dataset.strainFocus?null:t.dataset.strainFocus;plantSay('tab_index');scheduleSave();render();return;}
    if(t.dataset.lift&&!UI.liftedCardId){UI.liftedCardId=t.dataset.lift;UI.liftOnUpgrade=t.dataset.liftUp||null;render();return;}
    if(t.dataset.action){e.stopPropagation();var a=t.dataset.action,v=t.dataset.id||t.dataset.pack||t.dataset.pid||t.dataset.av||t.dataset.tab;if(a==='equip-floor')runAction(a,t.dataset.id+':'+(t.value!==undefined?t.value:''));else if(a==='set-badge')runAction(a,t.dataset.slot+':'+t.value);else if(a==='sf-strain')runAction(a,t.dataset.slot+':'+t.value);else if(a==='sf-price')runAction(a,t.dataset.slot+':'+t.value);else if(a==='set-avatar')runAction(a,t.dataset.av);else if(a==='pick-player')runAction(a,t.dataset.pid);else runAction(a,v);return;}
    if(t.id==='btn-open-profile'){UI.profileOpen=true;render();}
  });
  document.getElementById('voidline-app').addEventListener('change',function(e){var t=e.target;if(t.dataset.action==='equip-floor')runAction('equip-floor',t.dataset.id+':'+t.value);if(t.dataset.action==='counter-input'){G.counterPrices=Object.assign({},G.counterPrices,{[t.dataset.id]:Number(t.value)});scheduleSave();}if(t.id==='edit-name'){G.name=t.value.trim()||playerDef(activePlayerId).defaultName;scheduleSave();}if(t.dataset.action==='set-badge')runAction('set-badge',t.dataset.slot+':'+t.value);if(t.dataset.action==='sf-strain')runAction('sf-strain',t.dataset.slot+':'+t.value);if(t.dataset.action==='sf-price')runAction('sf-price',t.dataset.slot+':'+t.value);});
  document.getElementById('voidline-app').addEventListener('input',function(e){if(e.target.id==='edit-name')G.name=e.target.value.trim()||playerDef(activePlayerId).defaultName;if(e.target.dataset.action==='counter-input')G.counterPrices=Object.assign({},G.counterPrices,{[e.target.dataset.id]:Number(e.target.value)});});

  try{
    var storedVer=localStorage.getItem(VERSION_KEY);
    if(storedVer!==APP_VERSION){
      localStorage.setItem(VERSION_KEY,APP_VERSION);
      try{sessionStorage.removeItem(SESSION_KEY);}catch(e2){}
      UI.playerSelectOpen=true;
      G=freshState('aden');
      // #region agent log
      dbg('game.js:boot','app version bump — force player picker',{appVersion:APP_VERSION,prevVersion:storedVer},'H5');
      // #endregion
      render();
    }else{
      var sess=sessionStorage.getItem(SESSION_KEY);
      if(sess&&PLAYERS.some(function(p){return p.id===sess;})){selectPlayer(sess);}
      else{UI.playerSelectOpen=true;G=freshState('aden');render();}
    }
  }catch(e){UI.playerSelectOpen=true;G=freshState('aden');render();}

  setInterval(function(){if(!G||UI.playerSelectOpen)return;tick(Date.now());renderHUD();if(UI.activeTab==='shop'){var cd=document.querySelector('.neon-card-green .font-mono.text-green[style*="1.125rem"]');if(cd)cd.textContent=fmtCd(blitzRem());}if(G.farmSubTab==='portal'&&G.cloneJob){var cr=document.querySelector('.clone-active .font-mono.text-green');if(cr)cr.textContent=fmtCd(cloneRem());}document.getElementById('hud-cash').textContent=fmtCash(G.cash);if(G.cash<10000&&Date.now()-dialogueState.lastAt>60000)plantSay('lowcash');scheduleSave();},50);
})();
