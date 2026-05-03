# KBot OS - In-Depth Technical Architecture

This document provides a highly detailed, component-by-component breakdown of the KBot OS web application architecture, tech stack, and state management lifecycle.

## Core Technology Stack
- **Framework:** React 18, bootstrapped via Vite.
- **3D Rendering Pipeline:** React Three Fiber (R3F) wrapping Three.js.
- **Global State Management:** Zustand (v4+).
- **Computer Vision:** Google MediaPipe `@mediapipe/tasks-vision` (WebAssembly-backed).
- **Styling:** Vanilla CSS (`index.css`) with custom CSS Variables for theming (e.g., `--accent`, `--bg-panel-solid`).
- **Icons:** `lucide-react`.
- **Deployment:** Vercel (CI/CD connected to the GitHub repository).

---

## 1. Global State Architecture (`src/store.js`)

KBot OS relies on a single, global Zustand store. This eliminates prop-drilling entirely. The 3D render loop (`useFrame` in R3F) reads directly from this store, bypassing the React component render cycle to maintain 60 FPS performance.

### State Slices:
1. **App Mode & View State:**
   - `mode`: `'SIMULATION'` or `'PHYSICAL'` (future hardware integration).
   - `currentView`: `'simulation'` (full 3D), `'llm'` (AI Commands), `'vision'` (Camera teleoperation), `'calibration'`, etc.
   - `isRightPanelOpen`, `isSidebarOpen`: Boolean toggles for the responsive UI wrappers.

2. **Telemetry State (The "Brain"):**
   - `activeArms`: Array determining which arms render (`['left']`, `['right']`, or `['left', 'right']`).
   - `arms`: A dictionary containing telemetry for each arm instance.
     ```javascript
     {
       left: {
         baseAngle: Number,      // Yaw rotation (Y-axis)
         shoulderAngle: Number,  // Pitch rotation (X-axis)
         elbowAngle: Number,     // Pitch rotation (X-axis)
         wristPitch: Number,     // V3 specific: Nod (X-axis)
         wristRoll: Number,      // V3 specific: Twist (Y-axis)
         wristYaw: Number,       // V3 specific: Sweep (Z-axis)
         pincerOpen: Number      // 0 (closed) to 1 (open)
       }
     }
     ```

3. **Physics & Scene State:**
   - `dimensions`: Physical metrics (`baseHeight`, `link1`, `link2`).
   - `armModel`: The hardware variant string (`'v0'`, `'v1'`, `'v2'`, `'v3'`).
   - `targetType`: The interactable object geometry (`'ball'`, `'cube'`, `'can'`).
   - `ballPosition`: `[x, y, z]` world coordinate array.
   - `attachedTo`: `null` (on the floor) or the ID of the arm holding it (`'left'` or `'right'`).

### Core Actions:
- `setArmState(id, updates)`: Deep-merges new telemetry into the target arm.
- `toggleGrip(armId)`: A complex action that reads the current `pincerOpen` state. If transitioning to closed (0), it computes Forward Kinematics to check proximity to the ball and sets `attachedTo` if within `0.8` units. If transitioning to open (1), it computes FK to place the ball at the exact drop X/Z coordinate and `y=0.15` (floor).
- `runPreset(action)`: Async functions (`wave`, `pickBall`, `dance`, `sweep`, `serve`) that sequence multiple `setArmState` calls using a `delay` Promise.

---

## 2. Component Hierarchy & Render Cycle

### 2.1 The Orchestrator (`src/App.jsx`)
The root component mounts the `<ArmSimulation>` canvas absolutely in the background and overlays HTML/CSS panels using flexbox/grid. 
- **Responsive Routing:** Reads `window.innerWidth`. On mobile (`isMobile`), panels like `VisionPanel` and `LLMPanel` are injected into a bottom-anchored CSS drawer. On desktop, they float.
- **Joysticks:** `<VirtualJoystick>` components are conditionally rendered based on `currentView === 'simulation'`. They inject input directly into `store.js` via `setArmState`.

### 2.2 The 3D Engine (`src/components/ArmSimulation.jsx`)
Mounts the R3F `<Canvas>`.
- **Environment:** Renders `<Grid>`, `<ambientLight>`, `<directionalLight>`, and `<pointLight>` based on `sceneConfig` from the store.
- **Arm Dispatcher:** The `renderArm(id, posX)` function checks `store.armModel` and mounts `<RoboticArm>` (V0), `<RoboticArmV1>`, `<RoboticArmV2>`, or `<RoboticArmV3>`.
- **Object Manager:** Mounts `<InteractableObject>`.

### 2.3 The Arm Meshes (`RoboticArmVX.jsx`)
All arms use a hierarchical `<group>` structure. 
- **Hierarchy:** `Base -> Turret -> Shoulder -> Upper Arm (Link 1) -> Elbow -> Forearm (Link 2) -> Pincer/Wrist`. Rotating a parent group automatically moves all children, fulfilling the kinematic chain inherently.
- **Materials:** We use `THREE.MeshPhysicalMaterial`. The `bodyMat` uses high `metalness` (0.90) and `roughness` (0.78) for anodized aluminum. The `accentMat` utilizes the `iridescence` extension (thickness `[80, 420]`, IOR `1.6`) to simulate titanium heat-treating.
- **The Lerp Loop:** Every frame (`useFrame`), the arm reads its state from the store and lerps its current rotation towards the target.
  ```javascript
  useFrame(() => {
    baseRef.current.rotation.y = THREE.MathUtils.lerp(baseRef.current.rotation.y, baseAngle, 0.12);
  });
  ```
  This `0.12` alpha value acts as a low-pass filter, making abrupt telemetry (like keyboard presses) perfectly smooth visually.

### 2.4 Physics Interaction (`src/components/InteractableObject.jsx`)
Maintains its own internal R3F `useFrame` loop.
- **Attachment Logic:** If `store.attachedTo` is active, it reads the absolute world position of the `pincerTargetRef` via `THREE.Vector3.getWorldPosition()`. It subtracts `0.15` from the Y-axis so the ball sits visually between the jaws, and lerps its own mesh to that coordinate.
- **Drop Logic:** Detects when `attachedTo` transitions from a string to `null`. It captures its *current* world position, forces the `store.ballPosition` to that `[X, 0.15, Z]`, and lerps downwards. This mathematically ensures the object falls straight down from wherever the pincer released it.

### 2.5 Computer Vision (`src/components/VisionPanel.jsx`)
- Loads MediaPipe `HandLandmarker` asynchronously.
- Reads `requestAnimationFrame` from the hidden `<video>` element.
- Processes 21 3D landmarks (`x, y, z` normalized from `0.0` to `1.0`).
- Executes the `mapHandToArm` transformer block (see *Logic Documentation* for math).
- Pushes target telemetry to a `smooth.current` ref object, applying an additional temporal smoothing layer (`T=0.13`) *before* pushing to Zustand to prevent jitter.

### 2.6 LLM Parser (`src/components/panels/LLMPanel.jsx`)
A natural language parser. It currently operates purely on client-side regex/includes logic (e.g., `t.includes('pick') -> runPreset('pickBall')`). In `PHYSICAL` mode, it also forwards raw text to `useArmConnection()` to hit an external Python WebSocket server for genuine LLM inference.
