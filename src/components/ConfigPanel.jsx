import React, { useState } from 'react';
import { useStore } from '../store';
import { Settings, Save } from 'lucide-react';

export default function ConfigPanel() {
  const { dimensions, setDimensions } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [localDims, setLocalDims] = useState(dimensions);

  const handleSave = () => {
    setDimensions(localDims);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{ position: 'absolute', top: 24, right: 24, pointerEvents: 'auto', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', padding: '12px', borderRadius: '50%', color: 'var(--text-main)', cursor: 'pointer' }}
      >
        <Settings size={24} />
      </button>
    );
  }

  return (
    <div className="glass-panel" style={{ position: 'absolute', top: 24, right: 24, width: '300px', padding: '20px', pointerEvents: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="text-display text-accent" style={{ fontSize: '1.2rem', margin: 0 }}>DIMENSIONS</h2>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Base Height
          <input 
            type="number" step="0.1" value={localDims.baseHeight} 
            onChange={(e) => setLocalDims({...localDims, baseHeight: parseFloat(e.target.value)})}
            style={{ width: '60px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: 'white', padding: '4px', borderRadius: '4px' }}
          />
        </label>
        
        <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Link 1 (Upper Arm)
          <input 
            type="number" step="0.1" value={localDims.link1} 
            onChange={(e) => setLocalDims({...localDims, link1: parseFloat(e.target.value)})}
            style={{ width: '60px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: 'white', padding: '4px', borderRadius: '4px' }}
          />
        </label>

        <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Link 2 (Forearm)
          <input 
            type="number" step="0.1" value={localDims.link2} 
            onChange={(e) => setLocalDims({...localDims, link2: parseFloat(e.target.value)})}
            style={{ width: '60px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: 'white', padding: '4px', borderRadius: '4px' }}
          />
        </label>

        <button 
          onClick={handleSave}
          style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'var(--accent-glow)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          <Save size={16} /> SAVE PRESET
        </button>
      </div>
    </div>
  );
}
