import React, { useState } from 'react';
import { useStore } from '../../store';
import { Wifi, RotateCcw } from 'lucide-react';

const PRESETS = [
  { id: 'pickBall', label: 'Pick Up Ball' },
  { id: 'dropBall', label: 'Drop Ball'    },
  { id: 'wave',     label: 'Wave'         },
  { id: 'dance',    label: 'Dance'        },
  { id: 'highFive', label: 'High Five', dualOnly: true },
];

function ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '28px', height: '28px', padding: '2px',
            border: '1px solid var(--border-subtle)', borderRadius: '4px',
            background: 'transparent', cursor: 'pointer'
          }}
        />
        <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', width: '56px' }}>{value}</span>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, unit = '' }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span className="mono" style={{ fontSize: '0.72rem' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

const SECTIONS = ['Presets', 'Visuals', 'Hardware', 'Connection'];

export default function ConfigPanel() {
  const {
    dimensions, setDimensions,
    activeArms, setActiveArms, runPreset,
    sceneConfig, setSceneConfig,
    armVisuals, setArmVisual,
    armModel, setArmModel,
    targetType, setTargetType,
    resetSceneDefaults, triggerCameraReset,
  } = useStore();

  const [localDims, setLocalDims] = useState({ ...dimensions });
  const [section, setSection] = useState('Presets');
  const isDual = activeArms.length > 1;

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Configuration</span>
        <button
          onClick={triggerCameraReset}
          className="btn"
          style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '5px' }}
          title="Reset camera to default view"
        >
          <RotateCcw size={12} /> Reset View
        </button>
      </div>

      {/* Arm mode */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
        {[{ label: 'Single Arm', dual: false }, { label: 'Dual Arms', dual: true }].map(({ label, dual }) => (
          <button key={label} onClick={() => setActiveArms(dual ? ['left', 'right'] : ['left'])}
            className={`btn ${isDual === dual ? 'btn-active' : ''}`} style={{ width: '100%' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setSection(s)}
            style={{
              flex: 1, padding: '5px 4px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 500,
              background: section === s ? 'rgba(232,164,90,0.12)' : 'transparent',
              color: section === s ? 'var(--accent)' : 'var(--text-secondary)',
              border: `1px solid ${section === s ? 'rgba(232,164,90,0.2)' : 'transparent'}`,
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Scrollable section content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>

        {/* ── PRESETS ── */}
        {section === 'Presets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {PRESETS.map(({ id, label, dualOnly }) => {
              if (dualOnly && !isDual) return null;
              return (
                <button key={id} onClick={() => runPreset(id)} className="btn"
                  style={{ width: '100%', justifyContent: 'flex-start', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>▶</span>{label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── VISUALS ── */}
        {section === 'Visuals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Scene */}
            <div>
              <div className="label" style={{ marginBottom: '12px' }}>Environment & Scene</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Arm Model</span>
                  <select className="btn" style={{ padding: '4px 8px' }} value={armModel} onChange={e => setArmModel(e.target.value)}>
                    <option value="v0">V0 (Sleek Concept — 3 DOF)</option>
                    <option value="v1">V1 (Physical Kit — 3 DOF)</option>
                    <option value="v2">V2 (Compact — 2 DOF)</option>
                    <option value="v3">V3 (Industrial — 6 DOF)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target Object</span>
                  <select className="btn" style={{ padding: '4px 8px' }} value={targetType} onChange={e => setTargetType(e.target.value)}>
                    <option value="ball">Ball</option>
                    <option value="cube">Cube</option>
                    <option value="can">Soda Can</option>
                  </select>
                </div>
                <div className="divider" style={{ margin: '4px 0' }} />
                <ColorRow label="Background"   value={sceneConfig.bgColor}          onChange={v => setSceneConfig({ bgColor: v })} />
                <ColorRow label="Grid Lines"   value={sceneConfig.gridColor}        onChange={v => setSceneConfig({ gridColor: v })} />
                <ColorRow label="Grid Sections" value={sceneConfig.gridSectionColor} onChange={v => setSceneConfig({ gridSectionColor: v })} />
                <div className="divider" style={{ margin: '4px 0' }} />
                <SliderRow label="Ambient Light" value={sceneConfig.ambientIntensity} min={0} max={2} step={0.05}
                  onChange={v => setSceneConfig({ ambientIntensity: v })} />
                <SliderRow label="Dir Light (Sun)" value={sceneConfig.dirLightIntensity} min={0} max={3} step={0.1}
                  onChange={v => setSceneConfig({ dirLightIntensity: v })} />
                <ColorRow label="Dir Light Color" value={sceneConfig.dirLightColor} onChange={v => setSceneConfig({ dirLightColor: v })} />
                <SliderRow label="Warm Point Light" value={sceneConfig.pointLight1Intensity} min={0} max={2} step={0.05}
                  onChange={v => setSceneConfig({ pointLight1Intensity: v })} />
                <ColorRow label="Warm Color" value={sceneConfig.pointLight1Color} onChange={v => setSceneConfig({ pointLight1Color: v })} />
                <SliderRow label="Cool Point Light" value={sceneConfig.pointLight2Intensity} min={0} max={2} step={0.05}
                  onChange={v => setSceneConfig({ pointLight2Intensity: v })} />
                <ColorRow label="Cool Color" value={sceneConfig.pointLight2Color} onChange={v => setSceneConfig({ pointLight2Color: v })} />
              </div>
            </div>

            <div className="divider" />

            {/* Left Arm */}
            <div>
              <div className="label" style={{ marginBottom: '12px' }}>Left Arm</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <ColorRow label="Body"   value={armVisuals.left.bodyColor}   onChange={v => setArmVisual('left', { bodyColor: v })} />
                <ColorRow label="Accent" value={armVisuals.left.accentColor} onChange={v => setArmVisual('left', { accentColor: v })} />
                {isDual && (
                  <SliderRow label="X Position" value={armVisuals.left.posX} min={-4} max={4} step={0.1} unit=" u"
                    onChange={v => setArmVisual('left', { posX: v })} />
                )}
              </div>
            </div>

            {isDual && (
              <>
                <div className="divider" />
                <div>
                  <div className="label" style={{ marginBottom: '12px' }}>Right Arm</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <ColorRow label="Body"   value={armVisuals.right.bodyColor}   onChange={v => setArmVisual('right', { bodyColor: v })} />
                    <ColorRow label="Accent" value={armVisuals.right.accentColor} onChange={v => setArmVisual('right', { accentColor: v })} />
                    <SliderRow label="X Position" value={armVisuals.right.posX} min={-4} max={4} step={0.1} unit=" u"
                      onChange={v => setArmVisual('right', { posX: v })} />
                  </div>
                </div>
              </>
            )}

            <button onClick={resetSceneDefaults} className="btn" style={{ width: '100%', marginTop: '4px' }}>
              <RotateCcw size={12} /> Reset Visual Defaults
            </button>
          </div>
        )}

        {/* ── HARDWARE ── */}
        {section === 'Hardware' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'baseHeight', label: 'Base Height' },
              { key: 'link1',      label: 'Upper Arm (Link 1)' },
              { key: 'link2',      label: 'Forearm (Link 2)'   },
            ].map(({ key, label }) => (
              <div key={key}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>{label}</div>
                <input type="number" step="0.1" value={localDims[key]}
                  onChange={e => setLocalDims({ ...localDims, [key]: parseFloat(e.target.value) })} />
              </div>
            ))}
            <button onClick={() => setDimensions(localDims)} className="btn btn-active" style={{ width: '100%' }}>
              Apply Dimensions
            </button>
          </div>
        )}

        {/* ── CONNECTION ── */}
        {section === 'Connection' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Wifi size={14} style={{ color: 'var(--text-secondary)' }} />
              <span className="label">WebSocket · localhost:8765</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" defaultValue="127.0.0.1" readOnly style={{ flex: 2 }} />
              <input type="text" defaultValue="8765"      readOnly style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn" style={{ flex: 1 }}>Ping</button>
              <button className="btn btn-danger" style={{ flex: 1 }}>Disconnect</button>
            </div>
            <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '5px', border: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Start the Python server before switching to PHYSICAL mode:<br />
              <code style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>python server.py</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
