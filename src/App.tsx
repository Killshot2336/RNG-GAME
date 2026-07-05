import { useUIStore } from '@/store/uiStore'
import { AppShell } from '@/components/AppShell'
import { ShopScreen } from '@/screens/ShopScreen'
import { FarmScreen } from '@/screens/FarmScreen'
import { IndexScreen } from '@/screens/IndexScreen'
import { ClanScreen } from '@/screens/ClanScreen'

function ScreenRouter() {
  const tab = useUIStore((s) => s.activeTab)
  switch (tab) {
    case 'shop': return <ShopScreen />
    case 'farm': return <FarmScreen />
    case 'index': return <IndexScreen />
    case 'clan': return <ClanScreen />
  }
}

export default function App() {
  return (
    <AppShell>
      <ScreenRouter />
    </AppShell>
  )
}
