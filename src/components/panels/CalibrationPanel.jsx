import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { Play } from 'lucide-react';

const STAGES = ['Zeroing', 'Limit Testing', 'Sync'];

export default function CalibrationPanel() {
  const { isCalibrating, startCalibration, arms, activeArms } = useStore();
  const [stage, setStage] = useState(0);
  const [stream, setStream] = useState([]);
  const streamRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isCalibrating) {
      setStage(1);
      interval = setInterval(() => {
        const arm = arms[activeArms[0]];
        if (arm) {
          const ts = new Date().toISOString().split('T')[1].slice(0, 8);
          setStream(prev => [
            ...prev.slice(-18),
            `${ts}  B:${(arm.baseAngle * 180 / Math.PI).toFixed(1)}°  S:${(arm.shoulderAngle * 180 / Math.PI).toFixed(1)}°  E:${(arm.elbowAngle * 180 / Math.PI).toFixed(1)}°`
          ]);
        }
      }, 80);
    } else if (stream.length > 0) {
      setStage(2);
      setStream(prev => [...prev, '── SYNC COMPLETE ──']);
    }
    return () => clearInterval(interval);
  }, [isCalibrating]);

  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [stream]);

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Calibration</span>
      </div>

      {/* Stage progress */}
      <div style={{ marginBottom: '24px' }}>
        <div className="label" style={{ marginBottom: '12px' }}>Sequence Progress</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {STAGES.map((s, i) => {
            const done    = i < stage;
            const current = i === stage && isCalibrating;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700,
                  background: done ? 'var(--success)' : current ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${done ? 'var(--success)' : current ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  color: done || current ? '#000' : 'var(--text-secondary)',
                  transition: 'all 0.3s',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '0.82rem', color: current ? 'var(--accent)' : done ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.3s' }}>
                  {s}
                </span>
                {current && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite', marginLeft: 'auto' }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Begin button */}
      <button
        onClick={startCalibration}
        disabled={isCalibrating}
        className={`btn ${isCalibrating ? '' : 'btn-active'}`}
        style={{ width: '100%', padding: '11px', marginBottom: '20px', gap: '8px' }}
      >
        <Play size={14} />
        {isCalibrating ? 'Running sequence...' : 'Begin Calibration'}
      </button>

      <div className="divider" />

      {/* Telemetry stream */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="label">Telemetry Stream</span>
          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--accent)' }}>{isCalibrating ? '144 Hz' : '─'}</span>
        </div>
        <div
          ref={streamRef}
          style={{
            flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-subtle)',
            borderRadius: '5px', padding: '10px 12px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '3px',
          }}
        >
          {stream.length === 0 ? (
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '24px' }}>
              Awaiting sequence...
            </span>
          ) : stream.map((line, i) => (
            <span key={i} className="mono" style={{ fontSize: '0.72rem', color: i === stream.length - 1 && !isCalibrating ? 'var(--success)' : '#6c9', opacity: 0.65 + 0.35 * (i / stream.length) }}>
              {line}
            </span>
          ))}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
