import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { useArmConnection } from '../../hooks/useArmConnection';
import { Send, BotMessageSquare } from 'lucide-react';

// Simple command parser that maps natural language to preset actions
function parseCommand(text) {
  const t = text.toLowerCase();
  if (t.includes('pick') || t.includes('grab') || t.includes('lift')) return { action: 'pickBall', label: 'Executing: Pick Up Ball sequence' };
  if (t.includes('drop') || t.includes('release') || t.includes('let go')) return { action: 'dropBall', label: 'Executing: Drop sequence' };
  if (t.includes('wave')) return { action: 'wave', label: 'Executing: Wave sequence' };
  if (t.includes('dance')) return { action: 'dance', label: 'Executing: Dance sequence' };
  if (t.includes('high five') || t.includes('highfive')) return { action: 'highFive', label: 'Executing: High Five sequence' };
  if (t.includes('home') || t.includes('reset') || t.includes('neutral')) return { action: 'home', label: 'Returning to home position' };
  return null;
}

const SUGGESTIONS = ['Pick up the ball', 'Wave hello', 'Do a dance', 'Drop the ball', 'High five'];

export default function LLMPanel() {
  const { runPreset, setArmState, activeArms } = useStore();
  const { sendLLMCommand } = useArmConnection();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    { role: 'system', text: 'AI command interface ready. Type a natural language instruction.' }
  ]);
  const [loading, setLoading] = useState(false);
  const historyRef = useRef(null);

  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [history]);

  const handleSubmit = async (e, manualCmd = null) => {
    e?.preventDefault();
    const cmd = (manualCmd || input).trim();
    if (!cmd) return;

    setInput('');
    setHistory(h => [...h, { role: 'user', text: cmd }]);
    setLoading(true);

    // Send to WS if in physical mode
    sendLLMCommand(cmd);

    // Simulate short processing delay, then parse and execute
    await new Promise(r => setTimeout(r, 600));

    const parsed = parseCommand(cmd);
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
        text: `Command not recognised: "${cmd}". Try: pick up, drop, wave, dance, high five, or home.`,
        error: true,
      }]);
    }

    setLoading(false);
  };

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <BotMessageSquare size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>AI Commands</span>
        <div style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>LOCAL</div>
      </div>

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
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(232,164,90,0.15)', border: '1px solid rgba(232,164,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.65rem' }}>⬡</span>
              </div>
            )}
            <div style={{
              maxWidth: '85%',
              padding: '9px 12px', borderRadius: '8px',
              fontSize: '0.82rem', lineHeight: 1.5,
              background: msg.role === 'user' ? 'rgba(232,164,90,0.1)' : msg.role === 'system' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(232,164,90,0.2)' : 'var(--border-subtle)'}`,
              color: msg.error ? 'var(--danger)' : msg.role === 'system' ? 'var(--text-secondary)' : 'var(--text-primary)',
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
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {SUGGESTIONS.map(s => (
          <button key={s} className="btn" onClick={() => handleSubmit(null, s)} style={{ fontSize: '0.72rem', padding: '4px 10px' }}>{s}</button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder='e.g. "Pick up the ball"'
          style={{ flex: 1 }}
          disabled={loading}
        />
        <button type="submit" className="btn btn-active" style={{ flexShrink: 0, padding: '8px 14px' }} disabled={loading}>
          <Send size={14} />
        </button>
      </form>

      <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}
