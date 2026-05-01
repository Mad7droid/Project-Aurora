import React from 'react';
import { useStore } from '../../store';

function JointRow({ label, deg, min, max }) {
  const pct = ((deg - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
        <span className="label">{label}</span>
        <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{deg.toFixed(1)}°</span>
      </div>
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, background: 'var(--accent)', borderRadius: '2px', transition: 'width 0.12s linear' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>{min}°</span>
        <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>{max}°</span>
      </div>
    </div>
  );
}

function ArmBlock({ armId, label }) {
  const data = useStore(s => s.arms[armId]);
  if (!data) return null;
  const toDeg = r => r * 180 / Math.PI;
  const accentColor = armId === 'right' ? '#5a7aaa' : 'var(--accent)';

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: accentColor }} />
        <span className="label" style={{ color: 'var(--text-primary)' }}>{label}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="status-dot" style={{ background: data.pincerOpen ? 'var(--accent)' : 'var(--success)' }} />
          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
            {data.pincerOpen ? 'OPEN' : 'GRIP'}
          </span>
        </div>
      </div>
      <JointRow label="Base · Yaw"       deg={toDeg(data.baseAngle)}     min={-180} max={180} />
      <JointRow label="Shoulder · Pitch"  deg={toDeg(data.shoulderAngle)} min={-90}  max={90} />
      <JointRow label="Elbow · Pitch"     deg={toDeg(data.elbowAngle)}    min={-135} max={135} />
    </div>
  );
}

export default function TelemetryPanel() {
  const { activeArms } = useStore();

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Telemetry</span>
        <span className="badge-live">LIVE</span>
      </div>

      {/* Joint data */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {activeArms.includes('left')  && <ArmBlock armId="left"  label="LEFT ARM" />}
        {activeArms.includes('right') && <ArmBlock armId="right" label="RIGHT ARM" />}
      </div>

      {/* Controls reference */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '8px' }}>
        <div className="label" style={{ marginBottom: '10px' }}>Keyboard Controls</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
          {[
            ['Left · Yaw',   'A / D'],
            ['Left · Pitch', 'W / S'],
            ['Left · Elbow', 'Q / E'],
            ['Left · Grip',  'Space'],
            ...(activeArms.includes('right') ? [
              ['Right · Yaw',   'J / L'],
              ['Right · Pitch', 'I / K'],
              ['Right · Elbow', 'U / O'],
              ['Right · Grip',  'Enter'],
            ] : []),
          ].map(([lbl, key]) => (
            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{lbl}</span>
              <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '3px' }}>{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
