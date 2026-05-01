import React, { useState } from 'react';
import { useStore } from '../store';
import { useArmConnection } from '../hooks/useArmConnection';
import { Activity, Cpu, Keyboard, Zap, Terminal, Wrench, Play } from 'lucide-react';
import ConfigPanel from './ConfigPanel';

export default function HUD() {
  const { arms, activeArms, mode, setMode, setActiveArms, isCalibrating, startCalibration, runPreset } = useStore();
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

  const isDual = activeArms.length > 1;

  const TelemetryCol = ({ armId, label, color }) => {
    const data = arms[armId];
    if (!data) return null;
    return (
      <div style={{ flex: 1, padding: '0 8px', borderLeft: armId === 'right' ? '1px solid var(--panel-border)' : 'none' }}>
        <h3 className="text-display" style={{ color, fontSize: '0.9rem', marginBottom: '8px' }}>{label}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Base</span>
          <span className="text-display">{toDeg(data.baseAngle)}°</span>
          <span style={{ color: 'var(--text-muted)' }}>Shoulder</span>
          <span className="text-display">{toDeg(data.shoulderAngle)}°</span>
          <span style={{ color: 'var(--text-muted)' }}>Elbow</span>
          <span className="text-display">{toDeg(data.elbowAngle)}°</span>
          <span style={{ color: 'var(--text-muted)' }}>Pincer</span>
          <span className="text-display">{data.pincerOpen ? 'OPEN' : 'CLOSED'}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <ConfigPanel />
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', pointerEvents: 'none' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Cpu className="text-accent" size={28} />
            <div>
              <h1 className="text-display" style={{ fontSize: '1.5rem', margin: 0 }}>KBOT<span className="text-accent">1</span></h1>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Multi-Arm GUI
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginRight: '60px' }}>
            {/* Mode Toggle */}
            <div className="glass-panel" style={{ padding: '8px', display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
              <button 
                onClick={() => setMode('SIMULATION')}
                style={{ 
                  background: mode === 'SIMULATION' ? 'var(--accent-glow)' : 'transparent',
                  border: `1px solid ${mode === 'SIMULATION' ? 'var(--accent-color)' : 'transparent'}`,
                  color: mode === 'SIMULATION' ? 'var(--accent-color)' : 'var(--text-muted)',
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600
                }}
              >
                SIM
              </button>
              <button 
                onClick={() => setMode('PHYSICAL')}
                style={{ 
                  background: mode === 'PHYSICAL' ? 'var(--accent-glow)' : 'transparent',
                  border: `1px solid ${mode === 'PHYSICAL' ? 'var(--accent-color)' : 'transparent'}`,
                  color: mode === 'PHYSICAL' ? 'var(--accent-color)' : 'var(--text-muted)',
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600
                }}
              >
                PHYSICAL
              </button>
            </div>

            {/* Arms Toggle */}
            <div className="glass-panel" style={{ padding: '8px', display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
              <button 
                onClick={() => setActiveArms(['left'])}
                style={{ 
                  background: !isDual ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
                  border: `1px solid ${!isDual ? 'var(--accent-color)' : 'transparent'}`,
                  color: !isDual ? 'var(--accent-color)' : 'var(--text-muted)',
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600
                }}
              >
                1 ARM
              </button>
              <button 
                onClick={() => setActiveArms(['left', 'right'])}
                style={{ 
                  background: isDual ? 'rgba(255, 0, 255, 0.2)' : 'transparent',
                  border: `1px solid ${isDual ? '#ff00ff' : 'transparent'}`,
                  color: isDual ? '#ff00ff' : 'var(--text-muted)',
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600
                }}
              >
                2 ARMS
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Layout */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px' }}>
          
          {/* Controls & Presets */}
          <div className="glass-panel" style={{ padding: '20px', minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
              <Keyboard size={20} className="text-accent" />
              <h2 className="text-display" style={{ fontSize: '1rem', margin: 0 }}>CONTROLS</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', fontSize: '0.8rem', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Left Arm (Yaw, Ptch)</span>
              <span className="text-display text-accent">W A S D Q E</span>
              {isDual && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>Right Arm (Yaw, Ptch)</span>
                  <span className="text-display" style={{ color: '#ff00ff' }}>I J K L U O</span>
                </>
              )}
              <span style={{ color: 'var(--text-muted)' }}>Pincers</span>
              <span className="text-display text-accent">SPC {isDual && '/ ENT'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px' }}>
              <Play size={16} className="text-accent" />
              <h2 className="text-display" style={{ fontSize: '0.9rem', margin: 0 }}>PRESETS</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', pointerEvents: 'auto' }}>
              <button onClick={() => runPreset('pickBall')} style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Pick Up</button>
              <button onClick={() => runPreset('dropBall')} style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Drop</button>
              <button onClick={() => runPreset('wave')} style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Wave</button>
              {isDual && <button onClick={() => runPreset('highFive')} style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>High Five</button>}
              <button onClick={() => runPreset('dance')} style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Dance</button>
            </div>

            <button 
              onClick={startCalibration}
              disabled={isCalibrating}
              style={{ 
                marginTop: '16px', width: '100%', pointerEvents: 'auto',
                background: isCalibrating ? 'var(--bg-color)' : 'rgba(255, 100, 100, 0.2)', 
                border: `1px solid ${isCalibrating ? 'var(--text-muted)' : '#ff6464'}`,
                color: isCalibrating ? 'var(--text-muted)' : '#ff6464',
                padding: '10px', borderRadius: '6px', cursor: isCalibrating ? 'default' : 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600,
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
              }}
            >
              <Wrench size={16} /> {isCalibrating ? 'CALIBRATING...' : 'CALIBRATE'}
            </button>
          </div>

          {/* LLM Input Box */}
          <div className="glass-panel" style={{ flexGrow: 1, padding: '20px', maxWidth: '500px', pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Terminal size={20} className="text-accent" />
              <h2 className="text-display" style={{ fontSize: '1rem', margin: 0 }}>LLM COMMAND</h2>
            </div>
            <form onSubmit={handleLLMSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={llmInput}
                onChange={(e) => setLlmInput(e.target.value)}
                placeholder="e.g. 'Pick up the ball' or 'Wave'" 
                style={{ 
                  flexGrow: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', 
                  color: 'white', padding: '12px', borderRadius: '6px', fontFamily: 'var(--font-body)' 
                }}
              />
              <button 
                type="submit"
                style={{ 
                  background: 'var(--accent-glow)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', 
                  padding: '0 20px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 
                }}
              >
                SEND
              </button>
            </form>
          </div>

          {/* Telemetry Info */}
          <div className="glass-panel" style={{ padding: '20px', minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
              <Activity size={20} className="text-accent" />
              <h2 className="text-display" style={{ fontSize: '1rem', margin: 0 }}>TELEMETRY</h2>
            </div>

            <div style={{ display: 'flex' }}>
              <TelemetryCol armId="left" label="LEFT ARM" color="var(--accent-color)" />
              {isDual && <TelemetryCol armId="right" label="RIGHT ARM" color="#ff00ff" />}
            </div>
            
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color={mode === 'PHYSICAL' ? '#ff3366' : 'var(--accent-color)'} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Status: <span style={{ color: '#fff' }}>{mode === 'PHYSICAL' ? 'DISCONNECTED' : 'NOMINAL'}</span>
              </span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
