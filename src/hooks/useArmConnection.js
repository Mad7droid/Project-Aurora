import { useEffect, useRef } from 'react';
import { useStore } from '../store';

// Global WS ref — shared across callers
let globalWs = null;

export function useArmConnection() {
  const ws = useRef(null);

  // Keep arms in a ref for the effect closure
  const stateRef = useRef(null);
  
  useEffect(() => {
    const unsub = useStore.subscribe(state => { stateRef.current = state; });
    return () => unsub();
  }, []);

  useEffect(() => {
    const tryConnect = () => {
      const { mode } = useStore.getState();
      if (mode !== 'PHYSICAL') return;

      const socket = new WebSocket('ws://localhost:8765');
      globalWs = socket;
      ws.current = socket;

      socket.onopen  = () => console.log('[WS] Connected to physical arm server');
      socket.onclose = () => { console.log('[WS] Disconnected'); globalWs = null; };
      socket.onerror = () => console.warn('[WS] Could not connect to ws://localhost:8765');
    };

    // Subscribe to mode changes
    const unsub = useStore.subscribe(
      state => state.mode,
      (mode) => {
        if (mode === 'PHYSICAL') tryConnect();
        else if (ws.current) { ws.current.close(); ws.current = null; globalWs = null; }
      }
    );

    // Also try immediately if already in physical mode
    tryConnect();

    return () => {
      unsub();
      if (ws.current) ws.current.close();
    };
  }, []);

  // Emit telemetry on arm state changes (only in PHYSICAL mode)
  useEffect(() => {
    const unsub = useStore.subscribe(
      state => state.arms,
      (arms) => {
        const { mode, activeArms } = useStore.getState();
        if (mode !== 'PHYSICAL' || !globalWs || globalWs.readyState !== WebSocket.OPEN) return;

        const payload = {};
        activeArms.forEach(id => {
          const a = arms[id];
          payload[id] = {
            base:     parseFloat((a.baseAngle     * 180 / Math.PI).toFixed(2)),
            shoulder: parseFloat((a.shoulderAngle * 180 / Math.PI).toFixed(2)),
            elbow:    parseFloat((a.elbowAngle    * 180 / Math.PI).toFixed(2)),
            pincer:   a.pincerOpen,
          };
        });
        globalWs.send(JSON.stringify({ type: 'telemetry', data: payload }));
      }
    );
    return () => unsub();
  }, []);

  const sendLLMCommand = (text) => {
    const { mode } = useStore.getState();
    if (mode === 'PHYSICAL' && globalWs && globalWs.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify({ type: 'llm_command', text }));
    } else {
      console.log('[LLM SIM]', text);
    }
  };

  return { sendLLMCommand };
}
