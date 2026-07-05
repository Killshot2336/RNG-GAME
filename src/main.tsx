import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { GameProvider } from '@/context/GameContext'
import { initPersistence } from '@/utils/persistence'
import './index.css'

function PersistenceInit({ children }: { children: React.ReactNode }) {
  useEffect(() => initPersistence(), [])
  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider>
      <PersistenceInit>
        <App />
      </PersistenceInit>
    </GameProvider>
  </StrictMode>,
)
