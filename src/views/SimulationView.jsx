import React, { useState } from 'react';
import ArmSimulation from '../components/ArmSimulation';
import { useStore } from '../store';
import { useArmConnection } from '../hooks/useArmConnection';
import { Settings2, Send } from 'lucide-react';

export default function SimulationView() {
  const { arms, activeArms, mode, setMode } = useStore();
  const { sendLLMCommand } = useArmConnection();
  const [llmInput, setLlmInput] = useState('');

  const toDeg = (rad) => (rad * 180 / Math.PI).toFixed(1);

  const handleLLMSubmit = (e) => {
    e.preventDefault();
    if (llmInput.trim()) {
      sendLLMCommand(llmInput);
      setLlmInput('');
    }
  };

  const TelemetryCol = ({ armId, label }) => {
    const data = arms[armId];
    if (!data) return null;
    return (
      <div style={{ marginBottom: '24px' }}>
        <h4 className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px', letterSpacing: '1px' }}>{label}</h4>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>BASE (YAW)</span>
            <span className="mono-text" style={{ fontSize: '0.85rem' }}>{toDeg(data.baseAngle)}&deg;</span>
          </div>
          <input type="range" min="-180" max="180" value={toDeg(data.baseAngle)} readOnly disabled />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span className="mono-text" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>-180&deg;</span>
            <span className="mono-text" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>180&deg;</span>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>SHOULDER (PITCH)</span>
            <span className="mono-text" style={{ fontSize: '0.85rem' }}>{toDeg(data.shoulderAngle)}&deg;</span>
          </div>
          <input type="range" min="-90" max="90" value={toDeg(data.shoulderAngle)} readOnly disabled />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span className="mono-text" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>-90&deg;</span>
            <span className="mono-text" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>90&deg;</span>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>ELBOW (PITCH)</span>
            <span className="mono-text" style={{ fontSize: '0.85rem' }}>{toDeg(data.elbowAngle)}&deg;</span>
          </div>
          <input type="range" min="0" max="180" value={toDeg(data.elbowAngle) + 90} readOnly disabled />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span className="mono-text" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>0&deg;</span>
            <span className="mono-text" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>180&deg;</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
      
      {/* 3D Canvas Panel */}
      <div className="os-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Overlay info */}
        <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 10 }}>
          <div className="os-panel" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-orange)' }}>●</span> SYS_TICK: 14892.00ms
            </div>
            <div className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-orange)' }}>●</span> LATENCY: {mode === 'PHYSICAL' ? '12.4ms' : '0.8ms'}
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 10, display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setMode('SIMULATION')}
            className={`btn-outline ${mode === 'SIMULATION' ? 'btn-orange' : ''}`}
          >
            SIMULATION
          </button>
          <button 
            onClick={() => setMode('PHYSICAL')}
            className={`btn-outline ${mode === 'PHYSICAL' ? 'btn-orange' : ''}`}
          >
            PHYSICAL
          </button>
        </div>

        {/* The 3D Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
           <ArmSimulation />
        </div>

        {/* LLM Input Bar at bottom of Canvas panel */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-app)' }}>
          <form onSubmit={handleLLMSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ border: '1px solid var(--border-focus)', padding: '6px', borderRadius: '4px' }}>
              <Terminal size={18} className="text-secondary" />
            </div>
            <input 
              type="text" 
              value={llmInput}
              onChange={(e) => setLlmInput(e.target.value)}
              className="input-field"
              placeholder="Instruct the arm via natural language (e.g. 'Move to home position and capture data')" 
              style={{ flex: 1, border: 'none', background: 'transparent' }}
            />
            <button type="submit" style={{ padding: '8px 12px', border: '1px solid var(--border-focus)', borderRadius: '4px', background: 'var(--bg-panel)' }}>
              <Send size={18} className="text-secondary" />
            </button>
          </form>
        </div>
      </div>

      {/* Telemetry Right Panel */}
      <div className="os-panel" style={{ width: '340px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div className="section-title" style={{ margin: 0 }}>
            <Settings2 size={20} /> Telemetry
          </div>
          <div className="mono-text" style={{ fontSize: '0.7rem', color: 'var(--accent-orange)', border: '1px solid var(--accent-orange)', padding: '2px 6px', borderRadius: '4px' }}>
            LIVE
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
          {activeArms.includes('left') && <TelemetryCol armId="left" label="ARM 01 (LEFT)" />}
          {activeArms.includes('right') && <TelemetryCol armId="right" label="ARM 02 (RIGHT)" />}
        </div>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-focus)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>END EFFECTOR STATUS</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ border: '1px solid var(--border-focus)', padding: '12px', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Torque (Nm)</div>
              <div className="mono-text">2.41</div>
            </div>
            <div style={{ border: '1px solid var(--border-focus)', padding: '12px', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Grip State</div>
              <div className="mono-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: arms[activeArms[0]].pincerOpen ? 'var(--accent-orange)' : '#10b981' }}>●</span> 
                {arms[activeArms[0]].pincerOpen ? 'OPEN' : 'CLOSED'}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// Needed for Terminal icon
import { Terminal } from 'lucide-react';
