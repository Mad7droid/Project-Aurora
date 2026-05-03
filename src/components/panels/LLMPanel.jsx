import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { useArmConnection } from '../../hooks/useArmConnection';
import { Send, BotMessageSquare, Settings2, X, Globe, Key, CheckCircle2 } from 'lucide-react';

// Simple fallback command parser
function parseCommandLocal(text) {
  const t = text.toLowerCase();
  if (t.includes('pick') || t.includes('grab') || t.includes('lift')) return { action: 'pickBall', label: 'Executing: Pick Up Ball sequence' };
  if (t.includes('drop') || t.includes('release') || t.includes('let go')) return { action: 'dropBall', label: 'Executing: Drop sequence' };
  if (t.includes('wave')) return { action: 'wave', label: 'Executing: Wave sequence' };
  if (t.includes('dance')) return { action: 'dance', label: 'Executing: Dance sequence' };
  if (t.includes('high five') || t.includes('highfive')) return { action: 'highFive', label: 'Executing: High Five sequence' };
  if (t.includes('sweep') || t.includes('clear')) return { action: 'sweep', label: 'Executing: Sweep sequence' };
  if (t.includes('serve') || t.includes('present') || t.includes('inspect')) return { action: 'serve', label: 'Executing: Serve/Inspect sequence' };
  if (t.includes('home') || t.includes('reset') || t.includes('neutral')) return { action: 'home', label: 'Returning to home position' };
  return null;
}

const SUGGESTIONS = ['Pick up the ball', 'Wave hello', 'Run 3 reps of pick and drop', 'Dance routine', 'Sweep the floor'];

export default function LLMPanel() {
  const { 
    runPreset, setArmState, activeArms, setActiveArms, 
    claudeApiKey, setClaudeApiKey, customWsUrl, setCustomWsUrl,
    showNotification, resetSimulation
  } = useStore();
  
  const { sendLLMCommand, sendClaudeCommand } = useArmConnection();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    { role: 'system', text: 'AI command interface ready. Type a natural language instruction.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const historyRef = useRef(null);

  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [history]);

  const executeCommandQueue = async (commands) => {
    for (const cmd of commands) {
      if (cmd.type === 'preset') {
        await runPreset(cmd.action);
      } else if (cmd.type === 'wait') {
        await new Promise(r => setTimeout(r, cmd.ms || 500));
      } else if (cmd.type === 'notify') {
        showNotification(cmd.text);
      } else if (cmd.type === 'reset') {
        resetSimulation();
      } else if (cmd.type === 'randomizeBall') {
        // Random position within reach [x: -2 to 2, y: 0.15, z: 0.5 to 2.5]
        const rx = (Math.random() - 0.5) * 4;
        const rz = 0.5 + Math.random() * 2;
        useStore.getState().setBallState(null, [rx, 0.15, rz]);
      } else if (cmd.type === 'setArmState') {
        setArmState(cmd.id, cmd.state);
      }
    }
  };

  const handleSubmit = async (e, manualCmd = null) => {
    e?.preventDefault();
    const cmd = (manualCmd || input).trim();
    if (!cmd) return;

    setInput('');
    setHistory(h => [...h, { role: 'user', text: cmd }]);
    setLoading(true);

    try {
      // 1. If physical mode is on, send to custom WS anyway
      sendLLMCommand(cmd);

      // 2. If Claude API Key is present, use it for "Intelligence"
      if (claudeApiKey) {
        const result = await sendClaudeCommand(cmd, history);
        
        setHistory(h => [...h, { 
          role: 'assistant', 
          text: result.thought || 'Processing commands...' 
        }]);

        if (result.commands && result.commands.length > 0) {
          await executeCommandQueue(result.commands);
        }
      } else {
        // 3. Local Fallback (Regex)
        await new Promise(r => setTimeout(r, 600));
        const parsed = parseCommandLocal(cmd);
        if (parsed) {
          if (parsed.action === 'home') {
            activeArms.forEach(id => setArmState(id, { baseAngle: 0, shoulderAngle: Math.PI / 4, elbowAngle: -Math.PI / 4, pincerOpen: 0 }));
            setHistory(h => [...h, { role: 'assistant', text: 'Returning all arms to home position.' }]);
          } else {
            runPreset(parsed.action);
            setHistory(h => [...h, { role: 'assistant', text: parsed.label }]);
          }
        } else {
          setHistory(h => [...h, {
            role: 'assistant',
            text: `Local mode: Command not recognised. (Connect Claude API Key for smarter commands)`,
            error: true,
          }]);
        }
      }
    } catch (error) {
      setHistory(h => [...h, { role: 'assistant', text: `Error: ${error.message}`, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <BotMessageSquare size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>AI Commands</span>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px',
            background: claudeApiKey ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
            color: claudeApiKey ? '#4ade80' : 'var(--text-secondary)',
            border: `1px solid ${claudeApiKey ? 'rgba(34,197,94,0.2)' : 'var(--border-subtle)'}`,
            fontFamily: 'var(--font-mono)'
          }}>
            {claudeApiKey ? 'CLAUDE ACTIVE' : 'LOCAL ONLY'}
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: showSettings ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      {/* Settings Overlay */}
      {showSettings && (
        <div style={{
          position: 'absolute', top: '50px', left: '15px', right: '15px', bottom: '15px',
          background: 'var(--bg-panel-solid)', border: '1px solid var(--border-subtle)',
          borderRadius: '12px', zIndex: 10, padding: '20px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings2 size={14} /> AI & Connection Settings
            </h3>
            <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Claude Key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Key size={10} /> ANTHROPIC CLAUDE API KEY
              </label>
              <input 
                type="password" 
                value={claudeApiKey} 
                onChange={(e) => setClaudeApiKey(e.target.value)}
                placeholder="sk-ant-..."
                style={{ width: '100%', fontSize: '0.75rem' }}
              />
              <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', margin: 0 }}>
                Enables complex reasoning, multi-step tasks, and custom loops.
              </p>
            </div>

            {/* Custom WS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={10} /> CUSTOM WEBSOCKET URL
              </label>
              <input 
                type="text" 
                value={customWsUrl} 
                onChange={(e) => setCustomWsUrl(e.target.value)}
                placeholder="ws://localhost:8765"
                style={{ width: '100%', fontSize: '0.75rem' }}
              />
              <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', margin: 0 }}>
                Connect to your own VLM or LLM server for physical/sim control.
              </p>
            </div>
          </div>

          <button 
            className="btn btn-active" 
            onClick={() => setShowSettings(false)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <CheckCircle2 size={14} /> Save & Close
          </button>
        </div>
      )}

      {/* Arm count toggle */}
      {!showSettings && (
        <div style={{
          display: 'flex', gap: '4px',
          background: 'rgba(255,255,255,0.04)',
          padding: '3px', borderRadius: '6px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '16px', flexShrink: 0
        }}>
          {[{ label: '1 ARM', arms: ['left'] }, { label: '2 ARMS', arms: ['left', 'right'] }].map(({ label, arms }) => {
            const active = activeArms.length === arms.length;
            return (
              <button
                key={label}
                onClick={() => setActiveArms(arms)}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: '4px', fontSize: '0.72rem',
                  fontWeight: 600, letterSpacing: '0.05em', transition: 'all 0.15s',
                  background: active ? 'rgba(232,164,90,0.15)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  border: `1px solid ${active ? 'rgba(232,164,90,0.25)' : 'transparent'}`,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* History */}
      <div
        ref={historyRef}
        style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', marginBottom: '16px' }}
      >
        {history.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            gap: '8px', alignItems: 'flex-start',
          }}>
            {msg.role !== 'user' && (
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: msg.error ? 'rgba(239,68,68,0.15)' : 'rgba(232,164,90,0.15)', border: `1px solid ${msg.error ? 'rgba(239,68,68,0.2)' : 'rgba(232,164,90,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.65rem' }}>{msg.error ? '!' : '⬡'}</span>
              </div>
            )}
            <div style={{
              maxWidth: '85%',
              padding: '9px 12px', borderRadius: '8px',
              fontSize: '0.82rem', lineHeight: 1.5,
              background: msg.role === 'user' ? 'rgba(232,164,90,0.1)' : msg.role === 'system' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(232,164,90,0.2)' : 'var(--border-subtle)'}`,
              color: msg.error ? '#ef4444' : msg.role === 'system' ? 'var(--text-secondary)' : 'var(--text-primary)',
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(232,164,90,0.15)', border: '1px solid rgba(232,164,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.65rem' }}>⬡</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-secondary)', animation: `pulse 1s ease ${i*0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {!showSettings && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} className="btn" onClick={() => handleSubmit(null, s)} style={{ fontSize: '0.72rem', padding: '4px 10px' }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={claudeApiKey ? 'Ask Claude anything...' : 'Type a command...'}
          style={{ flex: 1 }}
          disabled={loading || showSettings}
        />
        <button type="submit" className="btn btn-active" style={{ flexShrink: 0, padding: '8px 14px' }} disabled={loading || showSettings}>
          <Send size={14} />
        </button>
      </form>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        .panel { transition: filter 0.3s ease; }
      `}</style>
    </div>
  );
}
