import React, { lazy, Suspense } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ArmSimulation from './components/ArmSimulation'
import { useStore } from './store'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import { useArmConnection } from './hooks/useArmConnection'

// Lazy-load panels so they don't block initial 3D scene render
const TelemetryPanel  = lazy(() => import('./components/panels/TelemetryPanel'))
const ConfigPanel     = lazy(() => import('./components/panels/ConfigPanel'))
const CalibrationPanel = lazy(() => import('./components/panels/CalibrationPanel'))
const LLMPanel        = lazy(() => import('./components/panels/LLMPanel'))
const TrainingPanel   = lazy(() => import('./components/panels/TrainingPanel'))

const PanelFallback = () => (
  <div className="panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Loading…</span>
  </div>
);

function App() {
  useKeyboardControls()
  useArmConnection()
  const currentView = useStore(s => s.currentView)
  const notification = useStore(s => s.notification)
  const isRightPanelOpen = useStore(s => s.isRightPanelOpen)

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <Topbar />

        {/* Global Notification Toast */}
        {notification && (
          <div style={{
            position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(230, 60, 60, 0.9)', color: '#fff',
            padding: '10px 20px', borderRadius: '8px', zIndex: 100,
            fontSize: '0.8rem', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {notification}
          </div>
        )}

        {/* 3D scene — always full area below topbar */}
        <div style={{ position: 'absolute', top: 52, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          <ArmSimulation />
        </div>

        {/* Right panel */}
        <div style={{
          position: 'absolute', top: 52, right: 0, bottom: 0,
          width: '360px', padding: '16px',
          zIndex: 10, pointerEvents: 'none',
          transform: isRightPanelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <Suspense fallback={<PanelFallback />}>
            <div style={{ pointerEvents: 'auto', height: '100%' }}>
              {currentView === 'simulation'    && <TelemetryPanel />}
              {currentView === 'configuration' && <ConfigPanel />}
              {currentView === 'calibration'   && <CalibrationPanel />}
              {currentView === 'llm'           && <LLMPanel />}
              {currentView === 'training'      && <TrainingPanel />}
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default App
