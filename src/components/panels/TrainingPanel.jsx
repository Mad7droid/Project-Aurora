import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { Activity, Download, StopCircle, PlayCircle, Trash2 } from 'lucide-react';

export default function TrainingPanel() {
  const { isRecording, telemetryLogs: logs, startRecording, stopRecording, clearTelemetryLogs } = useStore();

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearLogs = () => {
    clearTelemetryLogs();
  };

  const exportJSON = () => {
    if (logs.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `kbot_telemetry_${Date.now()}.json`;
    a.click();
  };

  const exportCSV = () => {
    if (logs.length === 0) return;
    
    // We'll flatten the structure for CSV. 
    // Format: timestamp, targetX, targetY, targetZ, targetType, left_base, left_shoulder... right_base...
    let csv = "timestamp,targetX,targetY,targetZ,targetType,left_baseAngle,left_shoulderAngle,left_elbowAngle,left_pincerOpen,right_baseAngle,right_shoulderAngle,right_elbowAngle,right_pincerOpen\n";
    
    logs.forEach(log => {
      const row = [
        log.timestamp,
        log.targetPosition[0].toFixed(4),
        log.targetPosition[1].toFixed(4),
        log.targetPosition[2].toFixed(4),
        log.targetType,
        log.arms.left?.baseAngle?.toFixed(4) || '',
        log.arms.left?.shoulderAngle?.toFixed(4) || '',
        log.arms.left?.elbowAngle?.toFixed(4) || '',
        log.arms.left?.pincerOpen?.toFixed(4) || '',
        log.arms.right?.baseAngle?.toFixed(4) || '',
        log.arms.right?.shoulderAngle?.toFixed(4) || '',
        log.arms.right?.elbowAngle?.toFixed(4) || '',
        log.arms.right?.pincerOpen?.toFixed(4) || ''
      ];
      csv += row.join(',') + "\n";
    });

    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `kbot_telemetry_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Activity size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Training Data Collection</span>
      </div>

      <div style={{ marginBottom: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Record 3D transform movements and kinematics in real-time (10Hz sampling) for ML teleoperation training.
      </div>

      {/* Recording Controls */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button 
          onClick={toggleRecording} 
          className="btn" 
          style={{ 
            flex: 1, 
            background: isRecording ? 'rgba(230, 60, 60, 0.15)' : 'rgba(232,164,90,0.1)',
            borderColor: isRecording ? 'rgba(230, 60, 60, 0.4)' : 'rgba(232,164,90,0.3)',
            color: isRecording ? '#ff6b6b' : 'var(--accent)'
          }}
        >
          {isRecording ? <><StopCircle size={14} /> Stop Recording</> : <><PlayCircle size={14} /> Start Recording</>}
        </button>
        <button onClick={clearLogs} className="btn btn-danger" style={{ padding: '8px 12px' }} disabled={logs.length === 0} title="Clear Data">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Live Status */}
      <div style={{ 
        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', 
        padding: '16px', borderRadius: '8px', marginBottom: '20px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isRecording ? '#ff6b6b' : 'var(--text-tertiary)' }}>
            {isRecording ? '● RECORDING' : 'IDLE'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Frames Logged</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {logs.length}
          </span>
        </div>
      </div>

      {/* Export Section */}
      <div style={{ marginTop: 'auto' }}>
        <div className="label" style={{ marginBottom: '10px' }}>Export Dataset</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportJSON} className="btn" style={{ flex: 1 }} disabled={logs.length === 0 || isRecording}>
            <Download size={14} /> JSON
          </button>
          <button onClick={exportCSV} className="btn" style={{ flex: 1 }} disabled={logs.length === 0 || isRecording}>
            <Download size={14} /> CSV
          </button>
        </div>
        {(isRecording && logs.length > 0) && (
          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '8px' }}>
            Stop recording to enable exports.
          </div>
        )}
      </div>

      {/* Preview Section */}
      {(!isRecording && logs.length > 0) && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', flex: 1, maxHeight: '200px' }}>
          <div className="label" style={{ marginBottom: '8px' }}>Data Preview (JSON Snapshot)</div>
          <pre style={{ 
            flex: 1, overflow: 'auto', background: 'rgba(0,0,0,0.4)', padding: '10px', 
            borderRadius: '6px', border: '1px inset rgba(255,255,255,0.05)', 
            fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' 
          }}>
            {JSON.stringify(logs.slice(0, 2), null, 2)}
            {logs.length > 2 && `\n\n... and ${logs.length - 2} more frames ...`}
          </pre>
        </div>
      )}
    </div>
  );
}
