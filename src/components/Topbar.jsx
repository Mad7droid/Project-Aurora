import React from 'react';
import { useStore } from '../store';
import { RotateCcw, PlayCircle, StopCircle, PanelRightClose, PanelRightOpen, Menu } from 'lucide-react';

export default function Topbar() {
  const { mode, setMode, activeArms, setActiveArms, triggerCameraReset, isRecording, startRecording, stopRecording, isRightPanelOpen, setIsRightPanelOpen, isSidebarOpen, setIsSidebarOpen } = useStore();
  const isDual = activeArms.length > 1;

  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const segStyle = (active) => ({
    padding: '5px 14px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600,
    letterSpacing: '0.05em', transition: 'all 0.15s',
    background: active ? 'rgba(232,164,90,0.15)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    border: `1px solid ${active ? 'rgba(232,164,90,0.25)' : 'transparent'}`,
  });

  const segWrap = {
    display: 'flex', gap: '4px',
    background: 'rgba(255,255,255,0.04)',
    padding: '3px', borderRadius: '6px',
    border: '1px solid var(--border-subtle)',
  };

  return (
    <div style={{
      height: '52px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(10,10,10,0.92)',
      backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: '12px',
    }}>
      {/* Mobile Hamburger Menu */}
      {isMobile && (
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Menu size={20} />
        </button>
      )}

      {/* System label */}
      <div style={{ flex: 1 }} className="hide-mobile">
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          ROBOTIC_OS <span style={{ color: 'var(--text-tertiary)' }}>·</span> ARM_3DOF
        </span>
      </div>

      {/* Mode toggle */}
      <div style={segWrap}>
        {['SIMULATION', 'PHYSICAL'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={segStyle(mode === m)}>
            {isMobile ? (m === 'SIMULATION' ? 'SIM' : 'HW') : m}
          </button>
        ))}
      </div>

      {/* Arm count */}
      <div style={segWrap} className="hide-mobile">
        {[{ label: '1 ARM', dual: false }, { label: '2 ARMS', dual: true }].map(({ label, dual }) => (
          <button key={label} onClick={() => setActiveArms(dual ? ['left', 'right'] : ['left'])}
            style={segStyle(isDual === dual)}>{label}</button>
        ))}
      </div>

      {/* Recording Toggle */}
      <button 
        onClick={() => isRecording ? stopRecording() : startRecording()} 
        className="btn"
        style={{ 
          padding: '5px 12px', fontSize: '0.72rem', gap: '5px',
          background: isRecording ? 'rgba(230, 60, 60, 0.15)' : 'transparent',
          borderColor: isRecording ? 'rgba(230, 60, 60, 0.4)' : 'var(--border-subtle)',
          color: isRecording ? '#ff6b6b' : 'var(--text-secondary)'
        }} 
        title={isRecording ? "Stop Recording" : "Start Recording"}
      >
        {isRecording ? <StopCircle size={12} /> : <PlayCircle size={12} />} 
        {!isMobile && "REC"}
      </button>

      {/* Reset camera & sim */}
      <div style={{ display: 'flex', gap: '6px' }} className="hide-mobile">
        <button onClick={triggerCameraReset} className="btn"
          style={{ padding: '5px 12px', fontSize: '0.72rem', gap: '5px' }} title="Reset camera view">
          <RotateCcw size={12} /> {!isMobile && "View"}
        </button>
        <button onClick={() => useStore.getState().resetSimulation()} className="btn"
          style={{ padding: '5px 12px', fontSize: '0.72rem', gap: '5px' }} title="Reset simulation state">
          <RotateCcw size={12} /> {!isMobile && "Sim"}
        </button>
      </div>

      {/* Status & Panel Toggle */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }} className="hide-mobile">
          {mode === 'PHYSICAL' ? '⬤ CONNECTED' : '○ SIM'}
        </span>
        {/* Desktop: always show toggle. Mobile: only show close when a drawer is open */}
        {!isMobile && (
          <button 
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Toggle Right Panel"
          >
            {isRightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
