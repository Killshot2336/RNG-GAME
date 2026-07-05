import { create } from 'zustand'

export type NavTab = 'shop' | 'farm' | 'index' | 'clan'

interface UIState {
  activeTab: NavTab
  profileOpen: boolean
  settingsOpen: boolean
  realityWarp: boolean
  liftedCardId: string | null
  backdropDimmed: boolean
  setActiveTab: (tab: NavTab) => void
  openProfile: () => void
  closeProfile: () => void
  toggleSettings: () => void
  setRealityWarp: (enabled: boolean) => void
  liftCard: (id: string) => void
  dismissCard: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'farm',
  profileOpen: false,
  settingsOpen: false,
  realityWarp: false,
  liftedCardId: null,
  backdropDimmed: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  openProfile: () => set({ profileOpen: true }),
  closeProfile: () => set({ profileOpen: false }),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  setRealityWarp: (enabled) => set({ realityWarp: enabled }),
  liftCard: (id) => set({ liftedCardId: id, backdropDimmed: true }),
  dismissCard: () => set({ liftedCardId: null, backdropDimmed: false }),
}))
