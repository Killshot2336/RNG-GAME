import { gameStore, getActiveProfile } from './store/gameStore';
import { CombatEngine, startOutpostLoop } from './engine/combatEngine';
import type { ProfileId, Rarity, TabId } from './types/game';

const PROFILES: ProfileId[] = ['aden', 'jamie', 'edward'];

let combat: CombatEngine | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function $(sel: string) {
  const el = document.querySelector(sel);
  if (!el) throw new Error('missing ' + sel);
  return el as HTMLElement;
}

function toast(msg: string) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
}

function profileIndex() {
  return PROFILES.indexOf(gameStore.getState().activeProfileId);
}

function renderHeader() {
  const p = getActiveProfile();
  $('#hdr-title').textContent = 'SYNDICATE SWARM';
  $('#hdr-profile').textContent = `${p.name} · Lv ${p.level}`;
  $('#hdr-credits').textContent = `${p.credits}¤`;
  document.querySelectorAll('.nav-flip [data-profile]').forEach((btn) => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.profile === p.id);
  });
}

function renderOutpost() {
  const s = gameStore.getState();
  const root = $('#outpost-panel');
  const elapsedMin = Math.floor((Date.now() - s.outpost.lastHarvest) / 60000);
  root.innerHTML = `
    <h2>Outpost Farm</h2>
    <p class="lead">Slow-life portal. Seeds cook while you fight.</p>
    <div class="stat-row"><span>Portal</span><span>Lv ${s.outpost.portalLevel}</span></div>
    <div class="stat-row"><span>Seeds</span><span>${s.outpost.activeSeeds.length}/12</span></div>
    <div class="stat-row"><span>Idle</span><span>${elapsedMin}m</span></div>
    <div class="btn-row">
      <button class="cta copper" data-act="harvest">Harvest</button>
      <button class="cta" data-act="portal">Upgrade Portal</button>
      <button class="cta" data-act="plant">Plant Seed</button>
    </div>
    <div class="loot-grid">
      ${s.outpost.activeSeeds
        .map((seed) => `<div class="loot-card Common"><div class="name">${seed}</div><div class="meta">Growing</div></div>`)
        .join('')}
    </div>
  `;
}

function renderVault() {
  const s = gameStore.getState();
  const root = $('#vault-panel');
  root.innerHTML = `
    <h2>Shared Vault</h2>
    <p class="lead">Syndicate chest. Claim into the active operative.</p>
    <div class="btn-row">
      <button class="cta" data-chest="Common">Common 25¤</button>
      <button class="cta" data-chest="Rare">Rare 80¤</button>
      <button class="cta copper" data-chest="Epic">Epic 220¤</button>
      <button class="cta" data-chest="Divine">Divine 900¤</button>
    </div>
    <div class="loot-grid">
      ${s.sharedVault
        .map(
          (item) => `
        <div class="loot-card ${item.rarity}">
          <div class="name">${item.name}</div>
          <div class="meta">${item.rarity} · ${item.type} · ×${item.statModifier}</div>
          <div class="btn-row">
            <button class="cta" data-claim="${item.id}">Claim</button>
          </div>
        </div>`
        )
        .join('') || '<p class="lead">Vault empty. Open a chest.</p>'}
    </div>
  `;
}

function renderProfiles() {
  const s = gameStore.getState();
  const root = $('#profiles-panel');
  root.innerHTML = `
    <h2>Operatives</h2>
    <p class="lead">Three seats. One swarm. Switch without contaminating loads.</p>
    <div class="loot-grid">
      ${PROFILES.map((id) => {
        const p = s.profiles[id];
        const on = s.activeProfileId === id;
        return `
          <div class="loot-card ${on ? 'Divine' : 'Rare'}">
            <div class="name">${p.name}${on ? ' · ACTIVE' : ''}</div>
            <div class="meta">Lv ${p.level} · ${p.xp} XP · ${p.credits}¤</div>
            <div class="meta">Weapon: ${p.activeWeapon}</div>
            <div class="meta">Badges: ${p.badges.join(', ') || '—'}</div>
            <div class="btn-row">
              <button class="cta" data-switch="${id}">Deploy</button>
            </div>
          </div>`;
      }).join('')}
    </div>
  `;
}

function setTab(tab: TabId) {
  const prev = gameStore.getState().activeTab;
  gameStore.getState().setTab(tab);
  $('#viewport-track').dataset.tab = tab;
  document.querySelectorAll('.tabbar button').forEach((b) => {
    b.classList.toggle('active', (b as HTMLElement).dataset.tab === tab);
  });
  if (tab === 'combat' && prev !== 'combat') {
    ensureCombat(true);
  } else if (tab !== 'combat' && combat) {
    combat.unmount();
    combat = null;
  }
  if (tab === 'outpost') renderOutpost();
  if (tab === 'vault') renderVault();
  if (tab === 'profiles') renderProfiles();
  renderHeader();
}

function ensureCombat(remount: boolean) {
  const canvas = document.getElementById('combat-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  if (combat && !remount) {
    combat.resize();
    return;
  }
  if (combat) combat.unmount();
  combat = new CombatEngine(canvas);
  combat.mount();
}

function wire() {
  document.querySelector('.tabbar')!.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('button[data-tab]') as HTMLElement | null;
    if (!t?.dataset.tab) return;
    setTab(t.dataset.tab as TabId);
  });

  document.querySelector('.nav-flip')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button') as HTMLElement | null;
    if (!btn) return;
    const act = btn.dataset.nav;
    const state = gameStore.getState();
    const idx = profileIndex();
    if (act === 'prev') {
      const next = PROFILES[(idx - 1 + PROFILES.length) % PROFILES.length];
      state.switchProfile(next);
      toast('DEPLOY ' + state.profiles[next].name.toUpperCase());
    } else if (act === 'next') {
      const next = PROFILES[(idx + 1) % PROFILES.length];
      state.switchProfile(next);
      toast('DEPLOY ' + state.profiles[next].name.toUpperCase());
    } else if (act === 'back') {
      setTab('combat');
      toast('COMBAT');
    } else if (btn.dataset.profile) {
      const id = btn.dataset.profile as ProfileId;
      state.switchProfile(id);
      toast('DEPLOY ' + state.profiles[id].name.toUpperCase());
    }
    renderHeader();
    if (state.activeTab === 'profiles') renderProfiles();
    if (state.activeTab === 'vault') renderVault();
    if (state.activeTab === 'outpost') renderOutpost();
  });

  $('#outpost-panel').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button[data-act]') as HTMLElement | null;
    if (!btn) return;
    const act = btn.dataset.act;
    const api = gameStore.getState();
    if (act === 'harvest') {
      const r = api.harvestOutpost();
      toast('HARVEST +' + r.credits + '¤ · seeds ' + r.seedsGained);
      renderOutpost();
      renderHeader();
    }
    if (act === 'portal') {
      const before = api.outpost.portalLevel;
      api.bumpPortal();
      if (gameStore.getState().outpost.portalLevel > before) toast('PORTAL UPGRADED');
      else toast('NEED CREDITS');
      renderOutpost();
      renderHeader();
    }
    if (act === 'plant') {
      api.plantSeed('Iron Seed');
      toast('SEED PLANTED');
      renderOutpost();
    }
  });

  $('#vault-panel').addEventListener('click', (e) => {
    const chest = (e.target as HTMLElement).closest('button[data-chest]') as HTMLElement | null;
    if (chest?.dataset.chest) {
      const item = gameStore.getState().openLootChest(chest.dataset.chest as Rarity);
      if (!item) toast('NEED CREDITS');
      else toast(item.rarity.toUpperCase() + ' · ' + item.name);
      renderVault();
      renderHeader();
      return;
    }
    const claim = (e.target as HTMLElement).closest('button[data-claim]') as HTMLElement | null;
    if (claim?.dataset.claim) {
      gameStore.getState().claimFromVault(claim.dataset.claim);
      toast('CLAIMED');
      renderVault();
      renderHeader();
    }
  });

  $('#profiles-panel').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button[data-switch]') as HTMLElement | null;
    if (!btn?.dataset.switch) return;
    gameStore.getState().switchProfile(btn.dataset.switch as ProfileId);
    toast('DEPLOY ' + getActiveProfile().name.toUpperCase());
    renderProfiles();
    renderHeader();
  });

  window.addEventListener('resize', () => {
    if (combat && gameStore.getState().activeTab === 'combat') combat.resize();
  });
}

function boot() {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `
    <div class="shell">
      <header class="header glass">
        <div>
          <h1 id="hdr-title">SYNDICATE SWARM</h1>
          <div id="hdr-profile" style="font-size:12px;color:var(--dim)"></div>
        </div>
        <div id="hdr-credits" style="font-family:Cinzel,serif;color:var(--copper);font-size:18px"></div>
      </header>
      <div class="nav-flip" style="padding:0 12px">
        <button data-nav="prev">◀ PREV PLAYER</button>
        <button data-nav="back">BACK</button>
        <button data-nav="next">NEXT PLAYER ▶</button>
        <button data-profile="aden">Aden</button>
        <button data-profile="jamie">Jamie</button>
        <button data-profile="edward">Edward</button>
      </div>
      <main class="viewport glass">
        <div class="viewport-track" id="viewport-track" data-tab="combat">
          <section class="panel" id="combat-panel"><canvas id="combat-canvas"></canvas></section>
          <section class="panel" id="outpost-panel"></section>
          <section class="panel" id="vault-panel"></section>
          <section class="panel" id="profiles-panel"></section>
        </div>
      </main>
      <nav class="tabbar glass">
        <button data-tab="combat" class="active">Combat</button>
        <button data-tab="outpost">Outpost</button>
        <button data-tab="vault">Vault</button>
        <button data-tab="profiles">Profiles</button>
      </nav>
    </div>
    <div class="toast" id="toast"></div>
  `;
  wire();
  startOutpostLoop();
  setTab('combat');
}

boot();
