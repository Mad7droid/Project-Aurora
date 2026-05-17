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
      const { mode, customWsUrl } = useStore.getState();
      if (mode !== 'PHYSICAL') return;

      const socket = new WebSocket(customWsUrl);
      globalWs = socket;
      ws.current = socket;

      socket.onopen  = () => console.log(`[WS] Connected to ${customWsUrl}`);
      socket.onclose = () => { console.log('[WS] Disconnected'); globalWs = null; };
      socket.onerror = () => console.warn(`[WS] Could not connect to ${customWsUrl}`);
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
    const { mode, customWsUrl } = useStore.getState();
    if (mode === 'PHYSICAL' && globalWs && globalWs.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify({ type: 'llm_command', text }));
    } else {
      console.log('[LLM SIM]', text);
    }
  };

  const sendClaudeCommand = async (prompt, history = []) => {
    const { claudeApiKey } = useStore.getState();
    if (!claudeApiKey) throw new Error('Claude API Key not configured');

    const systemPrompt = `
      You are the AI controller for KBot, a robotic arm simulation.
      You can control 1 or 2 arms (left and right).
      
      Available Presets: 'wave', 'pickBall', 'dropBall', 'dance', 'sweep', 'serve', 'highFive', 'home'.
      
      Output your response as a JSON object with two fields:
      1. "thought": A brief explanation of what you are doing.
      2. "commands": An array of command objects.
      
      Each command object must be:
      - { "type": "preset", "action": "preset_name" }
      - { "type": "wait", "ms": 1000 }
      - { "type": "notify", "text": "message" }
      - { "type": "reset" }
      - { "type": "randomizeBall" }
      - { "type": "setArmState", "id": "left"|"right", "state": { "baseAngle": number, ... } }
      - { "type": "loop", "count": number, "commands": [...] }
      
      Example for "run 100 reps of picking ball from random spots":
      {
        "thought": "I will create a loop to perform the pick-and-drop sequence 100 times with randomized ball positions.",
        "commands": [
          { 
            "type": "loop", 
            "count": 100, 
            "commands": [
              { "type": "randomizeBall" },
              { "type": "preset", "action": "pickBall" },
              { "type": "preset", "action": "dropBall" }
            ] 
          }
        ]
      }
      
      Keep thoughts concise. Only output valid JSON.
    `;

    const messages = [
      ...history.filter(h => h.role !== 'system').map(h => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.text
      })),
      { role: 'user', content: prompt }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'dangerously-allow-browser': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to connect to Claude');
    }

    const data = await response.json();
    const text = data.content[0].text;
    
    try {
      return JSON.parse(text);
    } catch (e) {
      // Fallback if Claude didn't return perfect JSON
      return { thought: text, commands: [] };
    }
  };

  return { sendLLMCommand, sendClaudeCommand };
}
