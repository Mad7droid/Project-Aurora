import React from 'react';
import { useStore } from '../store';
import { Layers, Settings2, Wrench, BotMessageSquare, AlertTriangle, Activity, Scan } from 'lucide-react';

const NAV = [
  { id: 'llm',           icon: BotMessageSquare, label: 'AI Commands'    },
  { id: 'vision',        icon: Scan,             label: 'Vision Control' },
  { id: 'simulation',    icon: Layers,           label: 'Simulation'     },
  { id: 'configuration', icon: Settings2,        label: 'Configuration'  },
  { id: 'calibration',   icon: Wrench,           label: 'Calibration'    },
  { id: 'training',      icon: Activity,         label: 'Training'       },
];

export default function Sidebar() {
  const { currentView, setCurrentView, mode, setIsRightPanelOpen, setIsSidebarOpen } = useStore();

  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  React.useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const handleNav = (id) => {
    setCurrentView(id);
    if (isMobile) {
      setIsSidebarOpen(false);
      setIsRightPanelOpen(id !== 'simulation');
    } else {
      setIsRightPanelOpen(true);
    }
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'rgba(10,10,10,0.95)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(20px)',
    }}>

      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '7px',
            background: 'rgba(232,164,90,0.15)', border: '1px solid rgba(232,164,90,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ color: 'var(--accent)', fontSize: '1rem' }}>⬡</span>
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>KBot Control</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>3DOF · v2.6</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map(({ id, icon: Icon, label }) => {
          const active = currentView === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '9px 12px',
                borderRadius: '6px',
                background: active ? 'rgba(232,164,90,0.1)' : 'transparent',
                border: `1px solid ${active ? 'rgba(232,164,90,0.2)' : 'transparent'}`,
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '0.85rem', fontWeight: active ? 500 : 400,
                transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Status & E-Stop */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', marginBottom: '10px' }}>
          <div className="status-dot" style={{ background: mode === 'PHYSICAL' ? 'var(--accent)' : 'var(--text-tertiary)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {mode === 'PHYSICAL' ? 'Physical · ws:8765' : 'Simulation mode'}
          </span>
        </div>

        <button
          style={{
            width: '100%', padding: '10px',
            background: 'var(--danger-dim)', border: '1px solid rgba(224,82,82,0.3)',
            color: 'var(--danger)', borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.06em',
          }}
        >
          <AlertTriangle size={14} />
          EMERGENCY STOP
        </button>
      </div>

    </div>
  );
}
