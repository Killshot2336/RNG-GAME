import './style.css'
import { useGameStore } from './store.js'
import { firebaseReady } from './firebase.js'

const app = document.querySelector('#app')

function render() {
  const state = useGameStore.getState()
  const profile = state.profiles[state.activeProfileId]

  app.innerHTML = `
    <main class="min-h-full flex flex-col items-center justify-center p-6 gap-6">
      <div class="glass-panel w-full max-w-lg p-8 text-center shadow-glow">
        <p class="text-[10px] tracking-[0.25em] uppercase text-neon font-black mb-3">Syndicate Swarm</p>
        <h1 class="text-3xl font-black text-white tracking-tight mb-2">Fresh Vite Core</h1>
        <p class="text-sm text-slate-400 mb-6">
          Vite + Tailwind + Zustand + Firebase scaffold. Combat engine comes next.
        </p>
        <div class="flex items-center justify-center gap-3 mb-6">
          <span class="text-amber-400 text-2xl font-black">¤</span>
          <span id="credits" class="text-2xl font-black text-amber-300">${state.credits}</span>
        </div>
        <p class="text-xs text-slate-500 mb-2">Active pilot: <span class="text-cyan-300 font-bold">${profile.name}</span></p>
        <p class="text-[10px] uppercase tracking-widest ${firebaseReady ? 'text-emerald-400' : 'text-slate-500'}">
          Firebase: ${firebaseReady ? 'configured' : 'awaiting env keys'}
        </p>
        <div class="mt-6 flex justify-center gap-2">
          ${Object.keys(state.profiles)
            .map(
              (id) => `
            <button type="button" data-profile="${id}"
              class="px-3 py-2 text-[10px] font-black uppercase rounded-lg border
              ${id === state.activeProfileId
                ? 'border-cyan-400 bg-cyan-500 text-black'
                : 'border-slate-700 bg-slate-900 text-slate-400'}">
              ${state.profiles[id].name}
            </button>`
            )
            .join('')}
        </div>
        <button type="button" id="add-credits"
          class="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-400 text-black text-xs font-black uppercase tracking-widest hover:brightness-110 transition">
          Test Zustand +10¤
        </button>
      </div>
    </main>
  `

  app.querySelectorAll('[data-profile]').forEach((btn) => {
    btn.addEventListener('click', () => {
      useGameStore.getState().switchProfile(btn.getAttribute('data-profile'))
    })
  })

  app.querySelector('#add-credits')?.addEventListener('click', () => {
    const s = useGameStore.getState()
    s.setCredits(s.credits + 10)
  })
}

render()
useGameStore.subscribe(render)
