import { create } from 'zustand'

const kinematicsWorker = new Worker(new URL('./workers/kinematics.worker.js', import.meta.url));

const calculateIK = (data) => new Promise((resolve, reject) => {
  const handler = (e) => {
    if (e.data.type === 'IK_RESULT' && e.data.target === data.target) {
      kinematicsWorker.removeEventListener('message', handler);
      if (e.data.success) resolve(e.data.data);
      else reject(new Error(e.data.error));
    }
  };
  kinematicsWorker.addEventListener('message', handler);
  kinematicsWorker.postMessage({ type: 'CALCULATE_IK', data });
});

const getSaved = (key, fallback) => {
  try { const v = localStorage.getItem(key); if (v) return JSON.parse(v); } catch {}
  return fallback;
};

const initialArmState = {
  baseAngle: 0,
  shoulderAngle: Math.PI / 4,
  elbowAngle: -Math.PI / 4,
  pincerOpen: 0,
  // V3 wrist DOF — ignored by V0/V1/V2
  wristPitch: 0,
  wristRoll: 0,
  wristYaw: 0,
};

const DEFAULT_SCENE = {
  bgColor: '#121212',
  gridColor: '#FFFFFF',
  gridSectionColor: '#333333',
  ambientIntensity: 0.3,
  dirLightIntensity: 1.2,
  dirLightColor: '#ffffff',
  pointLight1Intensity: 0.35,
  pointLight1Color: '#c09060',
  pointLight2Intensity: 0.2,
  pointLight2Color: '#ffffff',
};

const DEFAULT_ARM_VISUALS = {
  left:  { accentColor: '#c07830', bodyColor: '#333333', posX: -1.8 },
  right: { accentColor: '#5a7aaa', bodyColor: '#333333', posX:  1.8 },
};

export const useStore = create((set, get) => ({
  // App mode & View
  mode: 'SIMULATION',
  currentView: 'llm',
  isRightPanelOpen: true,
  isSidebarOpen: false,

  // Arms
  activeArms: ['left'],
  arms: {
    left:  { ...initialArmState },
    right: { ...initialArmState },
  },

  // Dimensions
  dimensions: getSaved('kbot_dims', { baseHeight: 0.8, link1: 1.5, link2: 1.2 }),

  // Ball State -> Target Object State
  targetType: 'ball', // 'ball' | 'cube' | 'can'
  isTargetSelected: false,
  ballPosition: [0, 0.2, 1.5],
  attachedTo: null,

  // Global Notification
  notification: null,

  // Calibration
  isCalibrating: false,

  // Scene & visual config (persisted)
  armModel:       getSaved('kbot_armmodel', 'v0'), // 'v0' = sleek, 'v1' = physical
  sceneConfig:    getSaved('kbot_scene',    DEFAULT_SCENE),
  armVisuals:     getSaved('kbot_armvis',   DEFAULT_ARM_VISUALS),

  // Telemetry Recording
  isRecording: false,
  telemetryLogs: [],
  recordingIntervalId: null,

  // Camera reset signal (incrementing triggers reset in ArmSimulation)
  cameraResetTick: 0,

  // AI & Connection Settings (persisted)
  claudeApiKey:   getSaved('kbot_claude_key', ''),
  customWsUrl:    getSaved('kbot_ws_url', 'ws://localhost:8765'),

  // ── Actions ──────────────────────────────────────────────────────────
  setMode:        (mode)   => set({ mode }),
  setCurrentView: (view)   => set({ currentView: view }),
  setIsRightPanelOpen: (isOpen) => set({ isRightPanelOpen: isOpen }),
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setActiveArms:  (arms)   => set({ activeArms: arms }),

  setArmState: (id, updates) => set(state => ({
    arms: { ...state.arms, [id]: { ...state.arms[id], ...updates } }
  })),

  toggleGrip: (armId) => {
    const state = get();
    const arm = state.arms[armId];
    const isOpening = arm.pincerOpen !== 1;

    if (isOpening) {
      if (state.attachedTo === armId) {
        // Drop: InteractableObject.jsx captures the actual 3D world position when attachedTo becomes null.
        state.setIsTargetSelected(false);
        state.setBallState(null, state.ballPosition);
      }
      state.setArmState(armId, { pincerOpen: 1 });
    } else {
      if (state.attachedTo === null) {
        // Grab: check proximity using FK end-effector position
        const dims = state.dimensions;
        const armX = state.armVisuals[armId]?.posX || 0;
        const r = Math.sin(arm.shoulderAngle) * dims.link1
                + Math.sin(arm.shoulderAngle + arm.elbowAngle) * (dims.link2 + 0.36);
        const h = Math.cos(arm.shoulderAngle) * dims.link1
                + Math.cos(arm.shoulderAngle + arm.elbowAngle) * (dims.link2 + 0.36);
        const endX = armX + Math.sin(arm.baseAngle) * r;
        const endZ = Math.cos(arm.baseAngle) * r;
        const endY = dims.baseHeight + h - 0.15;
        const [bx, by, bz] = state.ballPosition;
        
        // Fast-math squared distance check (0.8 * 0.8 = 0.64)
        const distSq = (endX - bx) ** 2 + (endY - by) ** 2 + (endZ - bz) ** 2;
        if (distSq < 0.64) {
          state.setIsTargetSelected(false);
          state.setBallState(armId, state.ballPosition);
        }
      }
      state.setArmState(armId, { pincerOpen: 0 });
    }
  },

  setDimensions: (dims) => {
    set({ dimensions: dims });
    localStorage.setItem('kbot_dims', JSON.stringify(dims));
  },

  setTargetType: (type) => set({ targetType: type }),
  setIsTargetSelected: (selected) => set({ isTargetSelected: selected }),
  setBallState: (attachedTo, pos) => set({ attachedTo, ballPosition: pos }),

  showNotification: (msg) => {
    set({ notification: msg });
    setTimeout(() => set(s => s.notification === msg ? { notification: null } : s), 3000);
  },

  setSceneConfig: (updates) => {
    const next = { ...get().sceneConfig, ...updates };
    set({ sceneConfig: next });
    localStorage.setItem('kbot_scene', JSON.stringify(next));
  },

  setArmVisual: (armId, updates) => {
    const next = { ...get().armVisuals, [armId]: { ...get().armVisuals[armId], ...updates } };
    set({ armVisuals: next });
    localStorage.setItem('kbot_armvis', JSON.stringify(next));
  },

  setArmModel: (model) => {
    set({ armModel: model });
    localStorage.setItem('kbot_armmodel', JSON.stringify(model));
    // Reposition ball based on arm reach:
    // V2 has no elbow so arm reach is shorter — move ball closer
    const ballPos = model === 'v2' ? [0, 0.15, 0.9] : [0, 0.15, 1.5];
    get().setBallState(null, ballPos);
  },

  resetSceneDefaults: () => {
    set({ sceneConfig: { ...DEFAULT_SCENE }, armVisuals: { ...DEFAULT_ARM_VISUALS } });
    localStorage.removeItem('kbot_scene');
    localStorage.removeItem('kbot_armvis');
  },

  setClaudeApiKey: (key) => {
    set({ claudeApiKey: key });
    localStorage.setItem('kbot_claude_key', JSON.stringify(key));
  },

  setCustomWsUrl: (url) => {
    set({ customWsUrl: url });
    localStorage.setItem('kbot_ws_url', JSON.stringify(url));
  },

  resetSimulation: () => {
    const s = get();
    s.activeArms.forEach(id => s.setArmState(id, initialArmState));
    s.setBallState(null, [0, 0.2, 1.5]);
    s.setIsTargetSelected(false);
  },

  // ── Telemetry ────────────────────────────────────────────────────────
  startRecording: () => {
    if (get().isRecording) return;
    const id = setInterval(() => {
      const state = get();
      const snapshot = {
        timestamp: Date.now(),
        targetPosition: [...state.ballPosition],
        targetType: state.targetType,
        arms: {},
      };
      state.activeArms.forEach(armId => {
        snapshot.arms[armId] = { ...state.arms[armId] };
      });
      set(s => ({ telemetryLogs: [...s.telemetryLogs, snapshot] }));
    }, 100);
    set({ isRecording: true, recordingIntervalId: id });
  },

  stopRecording: () => {
    const { recordingIntervalId } = get();
    if (recordingIntervalId) clearInterval(recordingIntervalId);
    set({ isRecording: false, recordingIntervalId: null });
  },

  clearTelemetryLogs: () => {
    get().stopRecording();
    set({ telemetryLogs: [] });
  },

  triggerCameraReset: () => set(s => ({ cameraResetTick: s.cameraResetTick + 1 })),

  // ── Calibration ────────────────────────────────────────────────────
  startCalibration: async () => {
    if (get().isCalibrating) return;
    set({ isCalibrating: true });
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const active = get().activeArms;
    for (const id of active) get().setArmState(id, { baseAngle: -Math.PI/2, shoulderAngle: 0, elbowAngle: 0 });
    await delay(1000);
    for (const id of active) get().setArmState(id, { baseAngle: Math.PI/2, shoulderAngle: Math.PI/4, elbowAngle: -Math.PI/4 });
    await delay(1000);
    for (const id of active) get().setArmState(id, { baseAngle: 0, shoulderAngle: Math.PI/4, elbowAngle: -Math.PI/4, pincerOpen: 1 });
    await delay(500);
    for (const id of active) get().setArmState(id, { pincerOpen: 0 });
    await delay(500);
    set({ isCalibrating: false });
  },

  // ── Presets ────────────────────────────────────────────────────────
  runPreset: async (action) => {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const active = get().activeArms;

    if (action === 'wave') {
      const id = active[0];
      const s = u => get().setArmState(id, u);
      s({ baseAngle: 0, shoulderAngle: Math.PI/3, elbowAngle: Math.PI/2 }); await delay(500);
      s({ baseAngle: -Math.PI/4 }); await delay(350);
      s({ baseAngle:  Math.PI/4 }); await delay(350);
      s({ baseAngle:  Math.PI/4 }); await delay(350);
      s({ baseAngle: 0, shoulderAngle: Math.PI/4, elbowAngle: -Math.PI/4 });
    }

    if (action === 'pickBall') {
      const { ballPosition, dimensions, armVisuals } = get();
      let target = active[0];
      if (active.length > 1) {
        const lv = armVisuals.left.posX;
        const rv = armVisuals.right.posX;
        target = Math.abs(ballPosition[0] - lv) <= Math.abs(ballPosition[0] - rv) ? 'left' : 'right';
      }
      
      // Offload IK math to WebWorker
      let result;
      try {
        result = await calculateIK({ ballPosition, dimensions, armVisuals, target });
      } catch (err) {
        get().showNotification(err.message);
        return;
      }
      const { baseAngle, shoulderAngle, elbowAngle } = result;

      const s = u => get().setArmState(target, u);

      // Execute IK Sequence
      s({ pincerOpen: 1 }); 
      await delay(200);
      s({ baseAngle }); 
      await delay(800); // give base more time to turn
      s({ shoulderAngle, elbowAngle }); 
      await delay(1200); // give arm more time to reach the floor
      s({ pincerOpen: 0 }); // Grab
      await delay(600);
      
      // Officially attach the ball to the arm's pincer target
      get().setBallState(target, ballPosition);
      
      // Lift the arm
      s({ shoulderAngle: shoulderAngle - 0.3, elbowAngle: elbowAngle - 0.2 });
      await delay(500);
    }

    if (action === 'dropBall') {
      for (const id of active) get().setArmState(id, { pincerOpen: 1 });
      await delay(400);

      // Detach the ball. InteractableObject.jsx will automatically handle the gravity drop.
      get().setIsTargetSelected(false);
      get().setBallState(null, get().ballPosition);

      for (const id of active) get().setArmState(id, { baseAngle: 0, shoulderAngle: Math.PI/4, elbowAngle: -Math.PI/4 });
      await delay(300);
      for (const id of active) get().setArmState(id, { pincerOpen: 0 });
    }

    if (action === 'highFive') {
      if (active.includes('left'))  get().setArmState('left',  { baseAngle: -Math.PI/5, shoulderAngle: Math.PI/3, elbowAngle: 0, pincerOpen: 1 });
      if (active.includes('right')) get().setArmState('right', { baseAngle:  Math.PI/5, shoulderAngle: Math.PI/3, elbowAngle: 0, pincerOpen: 1 });
      await delay(1000);
      if (active.includes('left'))  get().setArmState('left',  { baseAngle: 0, shoulderAngle: Math.PI/4, elbowAngle: -Math.PI/4, pincerOpen: 0 });
      if (active.includes('right')) get().setArmState('right', { baseAngle: 0, shoulderAngle: Math.PI/4, elbowAngle: -Math.PI/4, pincerOpen: 0 });
    }

    if (action === 'dance') {
      for (let i = 0; i < 3; i++) {
        if (active.includes('left'))  get().setArmState('left',  { baseAngle: -Math.PI/4, shoulderAngle: Math.PI/6 });
        if (active.includes('right')) get().setArmState('right', { baseAngle:  Math.PI/4, shoulderAngle: Math.PI/2 });
        await delay(380);
        if (active.includes('left'))  get().setArmState('left',  { baseAngle:  Math.PI/4, shoulderAngle: Math.PI/2 });
        if (active.includes('right')) get().setArmState('right', { baseAngle: -Math.PI/4, shoulderAngle: Math.PI/6 });
        await delay(380);
      }
      if (active.includes('left'))  get().setArmState('left',  { baseAngle: 0, shoulderAngle: Math.PI/4, elbowAngle: -Math.PI/4 });
      if (active.includes('right')) get().setArmState('right', { baseAngle: 0, shoulderAngle: Math.PI/4, elbowAngle: -Math.PI/4 });
    }

    if (action === 'sweep') {
      const id = active[0];
      const s = u => get().setArmState(id, u);
      s({ pincerOpen: 0 }); // close pincer
      await delay(200);
      s({ baseAngle: -Math.PI/3, shoulderAngle: Math.PI/3 }); // reach left and down
      await delay(600);
      s({ baseAngle: Math.PI/3 }); // sweep to right
      await delay(1000);
      s({ baseAngle: 0, shoulderAngle: Math.PI/4 }); // back
    }

    if (action === 'serve') {
      const id = active[0];
      const s = u => get().setArmState(id, u);
      // V3 specific (uses wrist), works gracefully on others by ignoring wrist
      s({ baseAngle: 0, shoulderAngle: 0, elbowAngle: Math.PI/2, wristPitch: Math.PI/2, wristRoll: 0, pincerOpen: 1 });
      await delay(600);
      s({ wristRoll: Math.PI/2 });
      await delay(400);
      s({ wristRoll: -Math.PI/2 });
      await delay(400);
      s({ wristRoll: 0, wristPitch: 0, shoulderAngle: Math.PI/4, elbowAngle: -Math.PI/4 });
    }
  },
}))
