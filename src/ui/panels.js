import { getState } from '../store/gameStore.js'
import { CHEST_OFFERS, rollGear } from '../data/gearCatalog.js'
import { CLAN_MEMBERS } from '../data/clanRoster.js'
import { eraEngine } from '../engines/eraEngine.js'
import { multiplayerEngine } from '../engines/multiplayerEngine.js'
import { MARKET_REFRESH_MS } from '../data/gearCatalog.js'

function rarityClass(r) {
  return ({
    common: 'text-slate-300 border-slate-600',
    rare: 'text-sky-300 border-sky-500',
    epic: 'text-fuchsia-300 border-fuchsia-500',
    legendary: 'text-amber-300 border-amber-400',
  })[r] || 'text-slate-300 border-slate-600'
}

export function renderMarket(root) {
  const s = getState()
  s.refreshMarketIfNeeded()
  const m = s.market
  const remain = Math.max(0, m.nextRefreshAt - Date.now())
  const mm = Math.floor(remain / 60000)
  const ss = Math.floor((remain % 60000) / 1000)

  root.innerHTML = `
    <div class="h-full overflow-y-auto p-4 sm:p-5 space-y-5">
      <header class="flex items-end justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p class="text-[10px] tracking-[0.25em] uppercase text-amber-300/80 font-black">Timed Gacha Market</p>
          <h2 class="text-xl font-black text-white">Merchant Row</h2>
        </div>
        <div class="text-right">
          <p class="text-[10px] uppercase tracking-widest text-slate-500">Refresh</p>
          <p class="font-mono text-amber-300 font-bold" data-market-timer>${mm}:${String(ss).padStart(2, '0')}</p>
        </div>
      </header>

      <section>
        <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">4-Slot Rotating Stock</h3>
        <div class="grid grid-cols-2 gap-3">
          ${m.slots
            .map(
              (slot, i) => `
            <button type="button" data-buy-slot="${i}"
              class="rounded-2xl border bg-black/40 p-3 text-left transition hover:border-amber-400/60 ${
                slot.purchased ? 'opacity-40 pointer-events-none border-slate-800' : rarityClass(slot.item.rarity)
              }">
              <p class="text-[9px] uppercase tracking-widest opacity-70">${slot.item.rarity} · ${slot.item.slot}</p>
              <p class="font-black text-sm text-white mt-1 leading-snug">${slot.purchased ? 'SOLD' : slot.item.name}</p>
              <p class="text-[11px] text-emerald-400 mt-2 font-mono">+${slot.item.bonus}% ${slot.item.stat}</p>
              <p class="mt-3 text-amber-300 font-black text-sm">${slot.price}¤</p>
            </button>`
            )
            .join('')}
        </div>
      </section>

      <section>
        <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Permanent Chests</h3>
        <div class="grid grid-cols-1 gap-2">
          ${CHEST_OFFERS.map(
            (c) => `
            <button type="button" data-buy-chest="${c.id}"
              class="flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-r from-black/50 to-black/20 px-4 py-3 hover:border-white/30">
              <span class="font-black text-sm" style="color:${c.color}">${c.name}</span>
              <span class="font-mono text-amber-300 font-bold">${c.cost}¤</span>
            </button>`
          ).join('')}
        </div>
      </section>

      <section>
        <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Inventory</h3>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          ${
            s.inventory.length
              ? s.inventory
                  .map(
                    (item) => `
              <div class="flex items-center justify-between gap-2 rounded-lg border ${rarityClass(item.rarity)} bg-black/30 px-3 py-2">
                <div>
                  <p class="text-xs font-bold text-white">${item.name}</p>
                  <p class="text-[10px] opacity-70">+${item.bonus}% ${item.stat}</p>
                </div>
                <button type="button" data-equip="${item.id}" class="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">Equip</button>
              </div>`
                  )
                  .join('')
              : '<p class="text-xs text-slate-500 italic">Empty vault — roll the market.</p>'
          }
        </div>
      </section>
    </div>
  `

  root.querySelectorAll('[data-buy-slot]').forEach((btn) => {
    btn.addEventListener('click', () => {
      getState().buyMarketSlot(Number(btn.getAttribute('data-buy-slot')))
    })
  })
  root.querySelectorAll('[data-buy-chest]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const offer = CHEST_OFFERS.find((c) => c.id === btn.getAttribute('data-buy-chest'))
      if (offer) getState().buyChest(offer, rollGear)
    })
  })
  root.querySelectorAll('[data-equip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      getState().equipItem(getState().activeSeat, btn.getAttribute('data-equip'))
    })
  })
}

export function marketTick(root) {
  const el = root.querySelector('[data-market-timer]')
  if (!el) return
  const s = getState()
  s.refreshMarketIfNeeded()
  const remain = Math.max(0, s.market.nextRefreshAt - Date.now())
  if (remain === 0) {
    renderMarket(root)
    return
  }
  const mm = Math.floor(remain / 60000)
  const ss = Math.floor((remain % 60000) / 1000)
  el.textContent = `${mm}:${String(ss).padStart(2, '0')}`
}

export function renderClan(root) {
  const s = getState()
  const inspectId = root.dataset.inspect || 'aden'
  const member = CLAN_MEMBERS.find((m) => m.id === inspectId) || CLAN_MEMBERS[0]
  const presence = s.presence[member.id] || { online: false, inMatch: false }
  const equipped = s.equipped[member.id] || {}

  root.innerHTML = `
    <div class="h-full overflow-y-auto p-4 sm:p-5 space-y-4">
      <header class="border-b border-white/10 pb-3">
        <p class="text-[10px] tracking-[0.25em] uppercase text-emerald-400/80 font-black">Clan Matrix</p>
        <h2 class="text-xl font-black text-white">Family Roster</h2>
        <p class="text-xs text-slate-400 mt-1">Live seats · inspect gear · Hay Day trade stands</p>
      </header>

      <div class="space-y-3">
        ${CLAN_MEMBERS.map((m) => {
          const p = s.presence[m.id] || {}
          const active = m.id === inspectId
          return `
          <div class="rounded-2xl border ${active ? 'border-emerald-400/50 bg-emerald-950/20' : 'border-white/10 bg-black/30'} p-3">
            <div class="flex items-center justify-between gap-2">
              <button type="button" data-inspect="${m.id}" class="text-left flex-1">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full ${p.online ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-slate-600'}"></span>
                  <span class="font-black text-white" style="color:${m.color}">${m.name}</span>
                  <span class="text-[10px] uppercase tracking-wider text-slate-500">${m.role}</span>
                </div>
                <p class="text-[10px] text-slate-500 mt-1">${p.inMatch ? 'IN DUNGEON' : p.online ? 'ONLINE' : 'OFFLINE'}</p>
              </button>
              <button type="button" data-trade="${m.id}"
                class="shrink-0 px-3 py-2 rounded-xl bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider shadow-[0_0_16px_rgba(46,204,113,0.35)] hover:brightness-110">
                Trade
              </button>
            </div>
          </div>`
        }).join('')}
      </div>

      <section class="rounded-2xl border border-white/10 bg-black/40 p-4" data-inspect-panel>
        <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Inspection · ${member.name}</h3>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p class="text-slate-500 uppercase text-[9px] tracking-wider">Weapon</p>
            <p class="font-bold text-white">${equipped.weapon?.name || member.defaultGear.weapon}</p>
          </div>
          <div>
            <p class="text-slate-500 uppercase text-[9px] tracking-wider">Armor</p>
            <p class="font-bold text-white">${equipped.armor?.name || member.defaultGear.armor}</p>
          </div>
          <div>
            <p class="text-slate-500 uppercase text-[9px] tracking-wider">Boots</p>
            <p class="font-bold text-white">${equipped.boots?.name || member.defaultGear.boots}</p>
          </div>
          <div>
            <p class="text-slate-500 uppercase text-[9px] tracking-wider">Trinket</p>
            <p class="font-bold text-white">${equipped.trinket?.name || member.defaultGear.trinket}</p>
          </div>
        </div>
        <div class="mt-4 grid grid-cols-4 gap-2 text-center">
          ${['damage', 'hp', 'speed', 'magnet']
            .map((stat) => {
              const base = member.defaultStats[stat]
              const gearBonus = Object.values(equipped).reduce((acc, g) => {
                if (g && g.stat === stat) return acc + g.bonus
                return acc
              }, 0)
              return `<div class="rounded-lg bg-white/5 py-2">
                <p class="text-[9px] uppercase text-slate-500">${stat}</p>
                <p class="font-mono font-bold text-cyan-300">${base}${gearBonus ? `+${gearBonus}%` : ''}</p>
              </div>`
            })
            .join('')}
        </div>
      </section>
    </div>
  `

  root.querySelectorAll('[data-inspect]').forEach((btn) => {
    btn.addEventListener('click', () => {
      root.dataset.inspect = btn.getAttribute('data-inspect')
      renderClan(root)
    })
  })
  root.querySelectorAll('[data-trade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      getState().openTradeStand(btn.getAttribute('data-trade'))
    })
  })
}

export function renderHubChrome(root) {
  const s = getState()
  const era = eraEngine.current()
  const research = s.research
  const remain = eraEngine.researchRemainingMs()

  root.innerHTML = `
    <div class="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-4">
      <div class="pointer-events-auto flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button type="button" data-bubble="credits" class="stat-bubble shrink-0">
          <span class="label">Credits</span>
          <span class="value text-amber-300">${Math.floor(s.credits)}¤</span>
        </button>
        <button type="button" data-bubble="skills" class="stat-bubble shrink-0 ring-2 ring-amber-400/40 shadow-bubble">
          <span class="label">Skills</span>
          <span class="value text-cyan-300">${s.unlockedSkills.length}★</span>
        </button>
        <button type="button" data-bubble="era" class="stat-bubble shrink-0">
          <span class="label">Era</span>
          <span class="value text-violet-300">${era.name}</span>
        </button>
        <button type="button" data-bubble="wave" class="stat-bubble shrink-0">
          <span class="label">Wave</span>
          <span class="value">${s.wave}</span>
        </button>
        <button type="button" data-bubble="kills" class="stat-bubble shrink-0">
          <span class="label">Kills</span>
          <span class="value text-rose-300">${s.kills}</span>
        </button>
        <button type="button" data-bubble="research" class="stat-bubble shrink-0">
          <span class="label">Research</span>
          <span class="value font-mono text-emerald-300" data-research-chip>${
            research ? eraEngine.formatCountdown(remain) : 'IDLE'
          }</span>
        </button>
      </div>
    </div>

    <div class="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4 sm:p-6 flex flex-col items-center gap-3">
      <div class="pointer-events-auto flex flex-wrap justify-center gap-2">
        ${['aden', 'edward', 'jamie']
          .map(
            (id) => `
          <button type="button" data-seat="${id}"
            class="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              s.activeSeat === id
                ? 'bg-amber-400 text-black border-amber-200'
                : 'bg-black/50 text-slate-300 border-white/15'
            }">${id}</button>`
          )
          .join('')}
      </div>
      <button type="button" id="btn-team-invite"
        class="pointer-events-auto relative px-10 py-4 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 text-black font-black text-lg tracking-wide uppercase shadow-[0_8px_0_#92400e,0_12px_40px_rgba(245,197,66,0.45)] active:translate-y-1 active:shadow-[0_4px_0_#92400e] transition">
        With Team
      </button>
      <p class="pointer-events-none text-[10px] uppercase tracking-[0.2em] text-white/50">Battle Hub · WASD to move · auto-fire</p>
    </div>
  `

  root.querySelector('#btn-team-invite')?.addEventListener('click', () => {
    multiplayerEngine.sendTeamInvite()
    getState().setMatch({ inMatch: true })
  })

  root.querySelectorAll('[data-seat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      getState().setSeat(btn.getAttribute('data-seat'))
      multiplayerEngine.refreshSeatBindings()
    })
  })

  root.querySelector('[data-bubble="skills"]')?.addEventListener('click', () => {
    root.dispatchEvent(new CustomEvent('open-skills', { bubbles: true }))
  })

  root.querySelector('[data-bubble="research"]')?.addEventListener('click', () => {
    eraEngine.startResearch()
  })

  root.querySelector('[data-bubble="era"]')?.addEventListener('click', () => {
    const nxt = eraEngine.next()
    getState().toast(nxt ? `Next: ${nxt.name} (${nxt.researchCost}¤)` : 'Max era')
  })
}

export function renderTradeModal(root) {
  const s = getState()
  if (!s.tradeStand.open) {
    root.classList.add('hidden')
    root.innerHTML = ''
    return
  }
  root.classList.remove('hidden')
  const seller = CLAN_MEMBERS.find((m) => m.id === s.tradeStand.sellerId)
  root.innerHTML = `
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="w-full max-w-md rounded-3xl border border-emerald-500/40 bg-[#0b1a14] shadow-panel p-5">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <p class="text-[10px] uppercase tracking-[0.25em] text-emerald-400 font-black">Hay Day Stand</p>
            <h3 class="text-xl font-black text-white">${seller?.name || 'Pilot'}'s Roadside Shop</h3>
          </div>
          <button type="button" data-close-trade class="text-slate-400 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <div class="space-y-2 max-h-72 overflow-y-auto">
          ${
            s.tradeStand.listings.length
              ? s.tradeStand.listings
                  .map(
                    (l, i) => `
              <div class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3">
                <div>
                  <p class="text-sm font-bold text-white">${l.item.name}</p>
                  <p class="text-[10px] text-slate-500">+${l.item.bonus}% ${l.item.stat}</p>
                </div>
                <button type="button" data-buy-trade="${i}" class="px-3 py-2 rounded-lg bg-emerald-500 text-black text-xs font-black">${l.price}¤</button>
              </div>`
                  )
                  .join('')
              : '<p class="text-sm text-slate-500 text-center py-8">Stand is empty.</p>'
          }
        </div>
      </div>
    </div>
  `
  root.querySelector('[data-close-trade]')?.addEventListener('click', () => getState().closeTradeStand())
  root.querySelectorAll('[data-buy-trade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      getState().buyFromTrade(Number(btn.getAttribute('data-buy-trade')))
    })
  })
}

export function renderInviteOverlay(root) {
  const invite = getState().inviteOverlay
  if (!invite) {
    root.classList.add('hidden')
    root.innerHTML = ''
    return
  }
  root.classList.remove('hidden')
  root.innerHTML = `
    <div class="absolute inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div class="w-full max-w-sm rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-[#1a2744] to-[#0b1324] p-6 text-center shadow-[0_0_60px_rgba(245,197,66,0.35)] animate-invite">
        <p class="text-[10px] uppercase tracking-[0.3em] text-amber-300 font-black mb-2">Team Invite</p>
        <h3 class="text-2xl font-black text-white mb-1">${invite.fromName || invite.from}</h3>
        <p class="text-sm text-slate-300 mb-6">wants you in the dungeon — now.</p>
        <div class="flex gap-3">
          <button type="button" data-decline class="flex-1 py-3 rounded-xl border border-white/20 text-slate-200 font-bold uppercase text-xs tracking-wider">Decline</button>
          <button type="button" data-accept class="flex-1 py-3 rounded-xl bg-amber-400 text-black font-black uppercase text-xs tracking-wider shadow-lg">Accept</button>
        </div>
      </div>
    </div>
  `
  root.querySelector('[data-accept]')?.addEventListener('click', () => multiplayerEngine.acceptInvite())
  root.querySelector('[data-decline]')?.addEventListener('click', () => multiplayerEngine.declineInvite())
}

export function renderToast(root) {
  const t = getState().toast
  if (!t || Date.now() - t.at > 2200) {
    root.classList.remove('show')
    return
  }
  root.textContent = t.msg
  root.classList.add('show')
}

// silence unused import lint for MARKET_REFRESH_MS if tree-shaken differently
void MARKET_REFRESH_MS
