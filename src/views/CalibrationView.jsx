import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Activity, PlayCircle, AlertCircle } from 'lucide-react';

export default function CalibrationView() {
  const { isCalibrating, startCalibration, arms, activeArms } = useStore();
  const [streamData, setStreamData] = useState([]);

  // Mock telemetry stream visual
  useEffect(() => {
    let interval;
    if (isCalibrating) {
      interval = setInterval(() => {
        const id = activeArms[0];
        const arm = arms[id];
        if (arm) {
          const newPoint = `[${new Date().toISOString().split('T')[1].slice(0, 8)}] X:${arm.baseAngle.toFixed(2)} Y:${arm.shoulderAngle.toFixed(2)} Z:${arm.elbowAngle.toFixed(2)} GRIP:${arm.pincerOpen}`;
          setStreamData(prev => [...prev.slice(-14), newPoint]);
        }
      }, 100);
    } else if (streamData.length > 0) {
      setStreamData(prev => [...prev, '--- CALIBRATION SEQUENCE COMPLETE ---']);
    }
    return () => clearInterval(interval);
  }, [isCalibrating, arms, activeArms]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '8px' }}>Calibration Routine</h2>
          <div className="mono-text" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Executing Sequence: AXIS_ALIGN_0x9A</div>
        </div>
        
        <div className="mono-text" style={{ color: 'var(--accent-orange)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>●</span> SYSTEM LIVE
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active Stage Panel */}
          <div className="os-panel" style={{ padding: '32px' }}>
            <h3 className="section-title" style={{ color: 'var(--accent-orange)' }}><Activity size={20} /> Active Stage</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '40px', padding: '0 20px', position: 'relative' }}>
              
              {/* Progress Line */}
              <div style={{ position: 'absolute', top: '12px', left: '40px', right: '40px', height: '2px', background: 'var(--border-focus)', zIndex: 0 }}>
                {isCalibrating && <div style={{ height: '100%', width: '50%', background: 'var(--accent-orange)', transition: 'width 2s' }} />}
              </div>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-panel)', border: '1px solid var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>✓</div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-secondary)' }}>ZEROING</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isCalibrating ? 'var(--accent-orange)' : 'var(--bg-panel)', border: `1px solid ${isCalibrating ? 'var(--accent-orange)' : 'var(--border-focus)'}`, color: isCalibrating ? 'black' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>2</div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', color: isCalibrating ? 'var(--accent-orange)' : 'var(--text-secondary)' }}>LIMIT TESTING</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-panel)', border: '1px solid var(--border-focus)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>3</div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-secondary)' }}>SYNC</span>
              </div>

            </div>
          </div>

          {/* Telemetry Stream */}
          <div className="os-panel" style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-secondary)' }}>TELEMETRY STREAM</div>
              <div className="mono-text" style={{ fontSize: '0.7rem', color: 'var(--accent-orange)', border: '1px solid rgba(249, 115, 22, 0.2)', background: 'rgba(249, 115, 22, 0.05)', padding: '2px 6px', borderRadius: '4px' }}>FREQ: 144Hz</div>
            </div>

            <div style={{ flex: 1, background: '#0a0a0a', border: '1px solid var(--border-focus)', borderRadius: '4px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: streamData.length === 0 ? 'center' : 'flex-end', minHeight: '250px' }}>
              {streamData.length === 0 ? (
                <div className="mono-text" style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.8rem' }}>----------- AWAITING_INPUT -----------</div>
              ) : (
                <div className="mono-text" style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#10b981' }}>
                  {streamData.map((line, i) => (
                    <div key={i} style={{ opacity: (i + 1) / streamData.length }}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="os-panel" style={{ padding: '32px' }}>
            <h3 className="section-title"><PlayCircle size={20} /> Motor Controls</h3>
            
            <button 
              onClick={startCalibration}
              disabled={isCalibrating}
              className={`btn-outline ${isCalibrating ? '' : 'btn-orange'}`}
              style={{ width: '100%', padding: '16px', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <div style={{ fontWeight: 600, letterSpacing: '1px' }}>{isCalibrating ? 'CALIBRATING...' : 'BEGIN SEQUENCE'}</div>
              <div className="mono-text" style={{ fontSize: '0.7rem', color: isCalibrating ? 'var(--text-secondary)' : 'var(--accent-orange)' }}>Locks current coordinates to memory</div>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px' }}>
                  <span>AXIS X (YAW)</span>
                  <span className="mono-text">{arms[activeArms[0]]?.baseAngle.toFixed(2)}&deg;</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="btn-outline" style={{ padding: '4px 12px' }}>-</button>
                  <input type="range" disabled value="50" style={{ flex: 1 }} />
                  <button className="btn-outline" style={{ padding: '4px 12px' }}>+</button>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px' }}>
                  <span>AXIS Y (PITCH)</span>
                  <span className="mono-text">{arms[activeArms[0]]?.shoulderAngle.toFixed(2)}&deg;</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="btn-outline" style={{ padding: '4px 12px' }}>-</button>
                  <input type="range" disabled value="30" style={{ flex: 1 }} />
                  <button className="btn-outline" style={{ padding: '4px 12px' }}>+</button>
                </div>
              </div>
            </div>
          </div>

          <div className="os-panel" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <AlertCircle size={20} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', marginBottom: '8px' }}>CALIBRATION NOTE</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Ensure the effector is clear of all physical obstructions before committing positional data. Deviation > 0.05&deg; will trigger a fault.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
