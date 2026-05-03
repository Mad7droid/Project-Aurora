import React, { lazy, Suspense } from 'react'
import Topbar from './components/Topbar'
import ArmSimulation from './components/ArmSimulation'
import { useStore } from './store'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import { useArmConnection } from './hooks/useArmConnection'
import BottomNav from './components/BottomNav';
import VirtualJoystick from './components/VirtualJoystick';

// Lazy-load panels so they don't block initial 3D scene render
const Sidebar          = lazy(() => import('./components/Sidebar'))
const TelemetryPanel   = lazy(() => import('./components/panels/TelemetryPanel'))
const ConfigPanel      = lazy(() => import('./components/panels/ConfigPanel'))
const CalibrationPanel = lazy(() => import('./components/panels/CalibrationPanel'))
const LLMPanel         = lazy(() => import('./components/panels/LLMPanel'))
const TrainingPanel    = lazy(() => import('./components/panels/TrainingPanel'))
const VisionPanel      = lazy(() => import('./components/VisionPanel'))

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
  const activeArms = useStore(s => s.activeArms)
  const isSidebarOpen = useStore(s => s.isSidebarOpen)
  const armModel = useStore(s => s.armModel)

  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const BOTTOM_HUB_H = 116; // Topbar 52px + BottomNav 64px

  const renderView = () => {
    switch(currentView) {
      case 'simulation': return <TelemetryPanel />
      case 'configuration': return <ConfigPanel />
      case 'calibration': return <CalibrationPanel />
      case 'llm': return <LLMPanel />
      case 'training': return <TrainingPanel />
      // vision is rendered inline in the layout, not via the right panel
      default: return null
    }
  }

  const isVision = currentView === 'vision';

  return (
    <div style={{ position: 'relative', display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
      
      {/* DESKTOP LAYOUT */}
      {!isMobile && (
        <>
          <Suspense fallback={<div style={{ width: 220, background: '#000' }} />}>
            <div style={{ width: 220, height: '100vh', flexShrink: 0 }}>
              <Sidebar />
            </div>
          </Suspense>

          {/* Vision tab: camera + sim side by side */}
          {isVision ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
              <Suspense fallback={<PanelFallback />}>
                <div style={{ width: '42%', borderRight: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                  <VisionPanel />
                </div>
              </Suspense>
              <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Topbar />
                <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  <ArmSimulation />
                </main>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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

              <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <ArmSimulation />
              </main>

              {/* Right panel */}
              <div className="right-panel-wrapper" style={{
                position: 'absolute', top: 52, right: 0, bottom: 0,
                width: '360px',
                padding: '16px',
                zIndex: 10, pointerEvents: 'none',
                transform: isRightPanelOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
                <Suspense fallback={<PanelFallback />}>
                  <div style={{ pointerEvents: 'auto', height: '100%', borderRadius: 'var(--radius-lg)' }}>
                    {renderView()}
                  </div>
                </Suspense>
              </div>
            </div>
          )}
        </>
      )}

      {/* MOBILE LAYOUT */}
      {isMobile && (
        <>
          {/* Mobile Sidebar Drawer — slides up from bottom */}
          <div style={{
            position: 'absolute', left: 0, bottom: BOTTOM_HUB_H, right: 0,
            height: '50vh', zIndex: 90,
            transform: isSidebarOpen ? 'translateY(0)' : `translateY(calc(100% + ${BOTTOM_HUB_H}px))`,
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            background: 'var(--bg-panel-solid)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            pointerEvents: isSidebarOpen ? 'auto' : 'none',
            overflow: 'hidden'
          }}>
            <Suspense fallback={<div />}>
              <Sidebar />
            </Suspense>
          </div>

          {/* Global Notification Toast */}
          {notification && (
            <div style={{
              position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(230, 60, 60, 0.9)', color: '#fff',
              padding: '10px 20px', borderRadius: '8px', zIndex: 100,
              fontSize: '0.8rem', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}>
              {notification}
            </div>
          )}

          {/* Vision camera panel — in-flow above 3D sim, not an overlay */}
          {isVision && (
            <div style={{
              height: '40vh', flexShrink: 0,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>
              <Suspense fallback={<PanelFallback />}>
                <VisionPanel />
              </Suspense>
            </div>
          )}

          {/* 3D Scene Area */}
          <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <ArmSimulation />
          </main>

          {/* Virtual Joysticks — adapts to arm model */}
          {currentView === 'simulation' && (
            <div
              className="joystick-container"
              style={{
                bottom: BOTTOM_HUB_H + 16,
                position: 'absolute', left: 0, right: 0,
                zIndex: 30, pointerEvents: 'none',
              }}
            >
              {/* Left joystick: BASE + SHOULDER (all models) */}
              <div style={{ pointerEvents: 'auto' }}>
                <VirtualJoystick
                  label="BASE / SHLD"
                  armId={activeArms[0] || 'left'}
                  xAxis="baseAngle"
                  yAxis="shoulderAngle"
                />
              </div>

              {/* Centre column: GRIP + optional elbow/wrist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', pointerEvents: 'auto' }}>
                {/* GRIP button — always visible */}
                <button
                  className="btn"
                  style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)', borderColor: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, touchAction: 'manipulation',
                  }}
                  onClick={() => useStore.getState().toggleGrip(activeArms[0] || 'left')}
                >
                  <span className="label" style={{ fontSize: '0.55rem', color: 'var(--accent)' }}>GRIP</span>
                </button>

                {/* V3 wrist buttons — 3 pairs of +/- for pitch, roll, yaw */}
                {armModel === 'v3' && (['wristPitch', 'wristRoll', 'wristYaw'].map(key => {
                  const labels = { wristPitch: 'PTCH', wristRoll: 'ROLL', wristYaw: 'YAW' };
                  const lims   = { wristPitch: Math.PI/2, wristRoll: Math.PI/2, wristYaw: Math.PI/4 };
                  return (
                    <div key={key} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button className="btn" style={{ padding: '4px 8px', fontSize: '0.55rem', touchAction: 'manipulation' }}
                        onClick={() => { const s = useStore.getState(); const id = activeArms[0]||'left'; s.setArmState(id, { [key]: Math.max(-lims[key], (s.arms[id][key]||0) - 0.12) }); }}>
                        −
                      </button>
                      <span style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', width: '28px', textAlign: 'center' }}>{labels[key]}</span>
                      <button className="btn" style={{ padding: '4px 8px', fontSize: '0.55rem', touchAction: 'manipulation' }}
                        onClick={() => { const s = useStore.getState(); const id = activeArms[0]||'left'; s.setArmState(id, { [key]: Math.min(lims[key], (s.arms[id][key]||0) + 0.12) }); }}>
                        +
                      </button>
                    </div>
                  );
                }))}
              </div>

              {/* Right joystick: ELBOW for V0/V1/V3 — hidden for V2 (no elbow joint) */}
              {armModel !== 'v2' && (
                <div style={{ pointerEvents: 'auto' }}>
                  <VirtualJoystick
                    label={armModel === 'v3' ? 'ELBOW' : 'ELBOW'}
                    armId={activeArms[0] || 'left'}
                    xAxis={null}
                    yAxis="elbowAngle"
                  />
                </div>
              )}
            </div>
          )}

          {/* Mobile Bottom Drawer for Panels — not shown on vision tab */}
          {isRightPanelOpen && currentView !== 'simulation' && !isVision && (
            <div className="right-panel-wrapper" style={{
              height: '50vh',
              background: 'var(--bg-panel-solid)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              pointerEvents: 'auto',
              overflow: 'hidden',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Drawer handle + close */}
              <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px 0', flexShrink: 0
              }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto' }} />
              </div>
              <Suspense fallback={<PanelFallback />}>
                <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                  {renderView()}
                </div>
              </Suspense>
            </div>
          )}

          {/* Unified Bottom Hub */}
          <div style={{ display: 'flex', flexDirection: 'column', zIndex: 50 }}>
            <Topbar />
            <BottomNav />
          </div>
        </>
      )}
    </div>
  )
}

export default App
