import React, { useState } from 'react';
import { useStore } from '../store';
import { Settings2, UploadCloud, Save, Plus, Wifi, Eye } from 'lucide-react';

export default function ConfigurationView() {
  const { dimensions, setDimensions, activeArms, setActiveArms, runPreset } = useStore();
  const [localDims, setLocalDims] = useState(dimensions);

  const handleSaveDims = () => {
    setDimensions(localDims);
  };

  const isDual = activeArms.length > 1;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '8px' }}>Configuration</h2>
          <div style={{ color: 'var(--text-secondary)' }}>Adjust kinematic parameters and establish telemetry connection.</div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadCloud size={16} /> Import Profile
          </button>
          <button className="btn-outline" style={{ background: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} /> Save Config
          </button>
        </div>
      </div>

      {/* Hardware Configuration Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Left Col: Specs */}
        <div className="os-panel" style={{ padding: '32px' }}>
          <h3 className="section-title">Hardware Specs</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px', lineHeight: 1.5 }}>
            Define the physical segment lengths in millimeters. These values are critical for inverse kinematics calculations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>BASE HEIGHT</span>
                <span>mm</span>
              </div>
              <input 
                type="number" 
                value={localDims.baseHeight} 
                onChange={(e) => setLocalDims({...localDims, baseHeight: parseFloat(e.target.value)})}
                className="input-field"
                style={{ fontSize: '1.1rem', padding: '12px', background: 'var(--bg-panel-hover)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>UPPER ARM (LINK 1)</span>
                <span>mm</span>
              </div>
              <input 
                type="number" 
                value={localDims.link1} 
                onChange={(e) => setLocalDims({...localDims, link1: parseFloat(e.target.value)})}
                className="input-field"
                style={{ fontSize: '1.1rem', padding: '12px', background: 'var(--bg-panel-hover)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>FOREARM (LINK 2)</span>
                <span>mm</span>
              </div>
              <input 
                type="number" 
                value={localDims.link2} 
                onChange={(e) => setLocalDims({...localDims, link2: parseFloat(e.target.value)})}
                className="input-field"
                style={{ fontSize: '1.1rem', padding: '12px', background: 'var(--bg-panel-hover)' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-focus)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono-text" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Max Reach: {(localDims.link1 + localDims.link2).toFixed(2)} units</span>
            <button onClick={handleSaveDims} className="btn-outline" style={{ color: 'var(--accent-orange)', borderColor: 'var(--accent-orange)' }}>Update Hardware Profile</button>
          </div>
        </div>

        {/* Right Col: Connectivity & Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Connectivity */}
          <div className="os-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="section-title" style={{ margin: 0 }}><Wifi size={20} /> Connectivity</h3>
              <div className="mono-text" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', border: '1px solid var(--border-focus)', padding: '4px 8px', borderRadius: '4px' }}>
                <span style={{ color: '#10b981', marginRight: '6px' }}>●</span> CONNECTED
              </div>
            </div>

            <div style={{ background: 'var(--bg-panel-hover)', border: '1px solid var(--border-focus)', padding: '16px', borderRadius: '4px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ background: 'var(--bg-panel)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}><Wifi size={16} /></div>
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '4px' }}>WebSocket Protocol</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Low-latency bi-directional stream for real-time joint control and telemetry data.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px' }}>TARGET_IP_ADDR</div>
                <input type="text" className="input-field" defaultValue="127.0.0.1" readOnly />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px' }}>PORT</div>
                <input type="text" className="input-field" defaultValue="8765" readOnly />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button className="btn-outline" style={{ flex: 1 }}>Ping Device</button>
              <button className="btn-outline" style={{ flex: 1, borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>Disconnect</button>
            </div>
          </div>

          {/* Logic/Presets Config */}
          <div className="os-panel" style={{ padding: '32px', flex: 1 }}>
            <h3 className="section-title">Arm Configuration</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border-focus)', borderRadius: '4px', marginBottom: '24px' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '4px' }}>Dual Arm Mode</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enable simultaneous control of two physical effectors.</div>
              </div>
              <button 
                onClick={() => setActiveArms(isDual ? ['left'] : ['left', 'right'])}
                className={`btn-outline ${isDual ? 'btn-orange' : ''}`}
              >
                {isDual ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>Quick Macros</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => runPreset('pickBall')} className="btn-outline">Pick Up Sequence</button>
              <button onClick={() => runPreset('dropBall')} className="btn-outline">Drop Sequence</button>
              <button onClick={() => runPreset('wave')} className="btn-outline">Wave Animation</button>
              <button onClick={() => runPreset('dance')} className="btn-outline">Dance Sequence</button>
              {isDual && <button onClick={() => runPreset('highFive')} className="btn-outline" style={{ color: '#ff00ff', borderColor: '#ff00ff' }}>High Five</button>}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
