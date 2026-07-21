import { getState } from '../store/gameStore.js'
import { CHEST_OFFERS, rollGear, MARKET_REFRESH_MS } from '../data/gearCatalog.js'
import { CLAN_MEMBERS } from '../data/clanRoster.js'
import { eraEngine } from '../engines/eraEngine.js'
import { multiplayerEngine } from '../engines/multiplayerEngine.js'

/** Map data rarity → CSS frame tier (legendary displays as Divine). */
function rarityTier(r) {
  if (r === 'legendary') return 'divine'
  return r || 'common'
}

function rarityLabel(r) {
  if (r === 'legendary') return 'Divine'
  return (r || 'common').replace(/^./, (c) => c.toUpperCase())
}

/** Clash Royale tactile 3D button markup. */
export function tactileBtn({
  label,
  attrs = '',
  variant = '',
  size = 'md',
  block = false,
  active = false,
  disabled = false,
}) {
  const classes = [
    'tactile',
    `tactile--${size}`,
    variant ? `tactile--${variant}` : '',
    block ? 'tactile--block' : '',
    active ? 'tactile--active' : '',
    disabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return `
    <button type="button" class="${classes}" ${attrs} ${disabled ? 'disabled' : ''}>
      <span class="tactile__depth" aria-hidden="true"></span>
      <span class="tactile__face">
        <span class="tactile__sheen" aria-hidden="true"></span>
        <span class="tactile__label">${label}</span>
      </span>
    </button>
  `
}

function gachaCardMarkup({ tier, rarityText, name, statLine, priceLine, attrs, sold }) {
  return `
    <button type="button" class="gacha-card gacha-card--${tier} ${sold ? 'is-sold' : ''}" ${attrs}>
      <div>
        <p class="gacha-card__rarity">${rarityText}</p>
        <p class="gacha-card__name">${name}</p>
        <p class="gacha-card__stat">${statLine}</p>
      </div>
      <p class="gacha-card__price">${priceLine}</p>
    </button>
  `
}

export function renderMarket(root) {
  const s = getState()
  s.refreshMarketIfNeeded()
  const m = s.market
  const remain = Math.max(0, m.nextRefreshAt - Date.now())
  const mm = Math.floor(remain / 60000)
  const ss = Math.floor((remain % 60000) / 1000)

  root.innerHTML = `
    <div class="panel-scroll panel-slide--glass">
      <header class="glass-panel glass-panel--deep p-4 mb-4 flex items-end justify-between gap-3">
        <div>
          <p class="ui-page-kicker">Timed Gacha Market</p>
          <h2 class="ui-page-title">Merchant Row</h2>
        </div>
        <div class="float-bubble" style="animation-delay:0.2s;min-width:auto;padding:0.45rem 0.8rem">
          <span class="float-bubble__label">Refresh</span>
          <span class="float-bubble__value float-bubble__value--gold font-mono text-sm" data-market-timer>${mm}:${String(ss).padStart(2, '0')}</span>
        </div>
      </header>

      <section class="mb-5">
        <h3 class="ui-section-title">4-Slot Rotating Stock</h3>
        <div class="grid grid-cols-2 gap-3">
          ${m.slots
            .map((slot, i) => {
              const tier = rarityTier(slot.item.rarity)
              return gachaCardMarkup({
                tier,
                rarityText: `${rarityLabel(slot.item.rarity)} · ${slot.item.slot}`,
                name: slot.purchased ? 'SOLD OUT' : slot.item.name,
                statLine: `+${slot.item.bonus}% ${slot.item.stat}`,
                priceLine: `${slot.price}¤`,
                attrs: `data-buy-slot="${i}"`,
                sold: slot.purchased,
              })
            })
            .join('')}
        </div>
      </section>

      <section class="mb-5">
        <h3 class="ui-section-title">Permanent Chests</h3>
        <div class="flex flex-col gap-2.5">
          ${CHEST_OFFERS.map(
            (c) => `
            <div class="glass-card p-1">
              ${tactileBtn({
                label: `<span style="color:${c.color}">${c.name}</span>&nbsp;&nbsp;·&nbsp;&nbsp;${c.cost}¤`,
                attrs: `data-buy-chest="${c.id}"`,
                size: 'md',
                block: true,
                variant: c.id === 'legendary' ? 'gold' : c.id === 'gold' ? 'gold' : 'ghost',
              })}
            </div>`
          ).join('')}
        </div>
      </section>

      <section>
        <h3 class="ui-section-title">Inventory Vault</h3>
        <div class="space-y-2.5 max-h-52 overflow-y-auto pr-1">
          ${
            s.inventory.length
              ? s.inventory
                  .map((item) => {
                    const tier = rarityTier(item.rarity)
                    return `
              <div class="inv-row inv-row--${tier}">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest opacity-70">${rarityLabel(item.rarity)}</p>
                  <p class="text-sm font-black text-white leading-snug">${item.name}</p>
                  <p class="text-[11px] font-mono text-emerald-400 mt-0.5">+${item.bonus}% ${item.stat}</p>
                </div>
                ${tactileBtn({
                  label: 'Equip',
                  attrs: `data-equip="${item.id}"`,
                  size: 'sm',
                  variant: 'ghost',
                })}
              </div>`
                  })
                  .join('')
              : `<div class="glass-card p-8 text-center">
                  <p class="text-xs text-slate-400 font-bold tracking-wide uppercase">Empty vault — roll the market.</p>
                </div>`
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
  const equipped = s.equipped[member.id] || {}

  root.innerHTML = `
    <div class="panel-scroll panel-slide--glass">
      <header class="glass-panel glass-panel--deep p-4 mb-4">
        <p class="ui-page-kicker" style="color:rgba(52,211,153,0.9)">Clan Matrix</p>
        <h2 class="ui-page-title">Family Roster</h2>
        <p class="text-xs text-slate-400 mt-1">Live seats · inspect gear · roadside trade stands</p>
      </header>

      <div class="space-y-3 mb-4">
        ${CLAN_MEMBERS.map((m) => {
          const p = s.presence[m.id] || {}
          const active = m.id === inspectId
          return `
          <div class="glass-card p-3 ${active ? 'ring-1 ring-emerald-400/50 shadow-[0_0_24px_rgba(52,211,153,0.2)]' : ''}">
            <div class="flex items-center justify-between gap-2">
              <button type="button" data-inspect="${m.id}" class="text-left flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="presence-dot ${p.online ? 'presence-dot--on' : ''}"></span>
                  <span class="font-black text-base" style="color:${m.color}">${m.name}</span>
                  <span class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">${m.role}</span>
                </div>
                <p class="text-[10px] text-slate-500 mt-1 font-bold tracking-wider">${
                  p.inMatch ? 'IN DUNGEON' : p.online ? 'ONLINE' : 'OFFLINE'
                }</p>
              </button>
              ${tactileBtn({
                label: 'Trade',
                attrs: `data-trade="${m.id}"`,
                size: 'sm',
                variant: 'emerald',
              })}
            </div>
          </div>`
        }).join('')}
      </div>

      <section class="glass-panel p-4" data-inspect-panel>
        <h3 class="ui-section-title">Inspection · ${member.name}</h3>
        <div class="grid grid-cols-2 gap-3 text-xs mb-4">
          ${['weapon', 'armor', 'boots', 'trinket']
            .map(
              (slot) => `
            <div class="glass-card p-3">
              <p class="text-slate-500 uppercase text-[9px] tracking-wider font-bold">${slot}</p>
              <p class="font-black text-white mt-1 leading-snug">${
                equipped[slot]?.name || member.defaultGear[slot]
              }</p>
            </div>`
            )
            .join('')}
        </div>
        <div class="grid grid-cols-4 gap-2">
          ${['damage', 'hp', 'speed', 'magnet']
            .map((stat) => {
              const base = member.defaultStats[stat]
              const gearBonus = Object.values(equipped).reduce((acc, g) => {
                if (g && g.stat === stat) return acc + g.bonus
                return acc
              }, 0)
              return `<div class="stat-chip">
                <p class="text-[8px] uppercase text-slate-500 font-bold tracking-wider">${stat}</p>
                <p class="font-mono font-black text-cyan-300 text-sm mt-0.5">${base}${
                  gearBonus ? `+${gearBonus}%` : ''
                }</p>
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
      <div class="pointer-events-auto bubble-rail">
        <button type="button" data-bubble="credits" class="float-bubble">
          <span class="float-bubble__label">Credits</span>
          <span class="float-bubble__value float-bubble__value--gold">${Math.floor(s.credits)}¤</span>
        </button>
        <button type="button" data-bubble="skills" class="float-bubble float-bubble--hot">
          <span class="float-bubble__label">Skills</span>
          <span class="float-bubble__value float-bubble__value--cyan">${s.unlockedSkills.length}★</span>
        </button>
        <button type="button" data-bubble="era" class="float-bubble">
          <span class="float-bubble__label">Era</span>
          <span class="float-bubble__value float-bubble__value--violet">${era.name.replace(' Age', '')}</span>
        </button>
        <button type="button" data-bubble="wave" class="float-bubble">
          <span class="float-bubble__label">Wave</span>
          <span class="float-bubble__value">${s.wave}</span>
        </button>
        <button type="button" data-bubble="kills" class="float-bubble">
          <span class="float-bubble__label">Kills</span>
          <span class="float-bubble__value float-bubble__value--rose">${s.kills}</span>
        </button>
        <button type="button" data-bubble="research" class="float-bubble">
          <span class="float-bubble__label">Research</span>
          <span class="float-bubble__value float-bubble__value--emerald font-mono" data-research-chip>${
            research ? eraEngine.formatCountdown(remain) : 'IDLE'
          }</span>
        </button>
      </div>
    </div>

    <div class="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4 sm:p-6 flex flex-col items-center gap-3">
      <div class="pointer-events-auto flex flex-wrap justify-center gap-2">
        ${['aden', 'edward', 'jamie']
          .map((id) =>
            tactileBtn({
              label: id,
              attrs: `data-seat="${id}"`,
              size: 'sm',
              variant: s.activeSeat === id ? '' : 'ghost',
              active: s.activeSeat === id,
            })
          )
          .join('')}
      </div>
      <div class="pointer-events-auto">
        ${tactileBtn({
          label: 'With Team',
          attrs: 'id="btn-team-invite"',
          size: 'lg',
          variant: 'gold',
        })}
      </div>
      <p class="hub-hint pointer-events-none">Battle Hub · WASD · Auto-Fire Lock</p>
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
    <div class="modal-scrim">
      <div class="glass-panel glass-panel--deep w-full max-w-md p-5 border-emerald-400/40 shadow-[0_0_40px_rgba(52,211,153,0.2)]">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <p class="ui-page-kicker" style="color:rgba(52,211,153,0.95)">Hay Day Stand</p>
            <h3 class="ui-page-title text-lg">${seller?.name || 'Pilot'}'s Roadside Shop</h3>
          </div>
          ${tactileBtn({ label: '✕', attrs: 'data-close-trade', size: 'sm', variant: 'ghost' })}
        </div>
        <div class="space-y-2.5 max-h-72 overflow-y-auto">
          ${
            s.tradeStand.listings.length
              ? s.tradeStand.listings
                  .map((l, i) => {
                    const tier = rarityTier(l.item.rarity)
                    return `
              <div class="inv-row inv-row--${tier}">
                <div>
                  <p class="text-sm font-black text-white">${l.item.name}</p>
                  <p class="text-[10px] text-emerald-400 font-mono">+${l.item.bonus}% ${l.item.stat}</p>
                </div>
                ${tactileBtn({
                  label: `${l.price}¤`,
                  attrs: `data-buy-trade="${i}"`,
                  size: 'sm',
                  variant: 'emerald',
                })}
              </div>`
                  })
                  .join('')
              : '<p class="text-sm text-slate-500 text-center py-8 font-bold uppercase tracking-wider">Stand is empty.</p>'
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
    <div class="modal-scrim" style="z-index:60">
      <div class="glass-panel glass-panel--deep w-full max-w-sm p-6 text-center border-amber-400/60 shadow-[0_0_60px_rgba(245,197,66,0.35)] animate-invite">
        <p class="ui-page-kicker mb-2">Team Invite</p>
        <h3 class="text-2xl font-black text-white mb-1">${invite.fromName || invite.from}</h3>
        <p class="text-sm text-slate-300 mb-6">wants you in the dungeon — now.</p>
        <div class="flex gap-3">
          ${tactileBtn({ label: 'Decline', attrs: 'data-decline', size: 'md', variant: 'ghost', block: true })}
          ${tactileBtn({ label: 'Accept', attrs: 'data-accept', size: 'md', variant: 'gold', block: true })}
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

void MARKET_REFRESH_MS
