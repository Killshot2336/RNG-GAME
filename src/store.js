import { create } from 'zustand'

/** Local game state — Firebase sync wires in later. */
export const useGameStore = create((set, get) => ({
  activeProfileId: 'aden',
  credits: 120,
  profiles: {
    aden: { name: 'Aden', level: 1 },
    edward: { name: 'Edward', level: 1 },
    jamie: { name: 'Jamie', level: 1 },
  },
  setCredits: (credits) => set({ credits }),
  switchProfile: (id) => {
    if (!get().profiles[id]) return
    set({ activeProfileId: id })
  },
}))
