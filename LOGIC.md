# KBot OS - In-Depth Logic & Algorithms Explained

This document breaks down the specific mathematical algorithms, exact formulas, and logical heuristics driving KBot OS. 

## 1. Kinematics (FK and IK)

Robotic arms in KBot OS operate on a standard kinematic chain: Base -> Link1 (Upper Arm) -> Link2 (Forearm) -> End Effector.

### 1.1 Forward Kinematics (FK) - Finding the End Effector
Used extensively in the `toggleGrip` action to determine exactly where the pincer is in 3D space to detect collisions with the ball.

The lengths of the physical arm segments are pulled dynamically from `store.dimensions`:
- `L1` (Upper arm length)
- `L2` (Forearm length + wrist offset)
- `bh` (Base height offset)

To find the radial distance `r` (distance forward from the turret center) and height `h` (distance up from the turret center), we use right-angle trigonometry on the `shoulderAngle` and `elbowAngle`:
```javascript
// Calculate radial extension on the X/Z plane
const r = Math.sin(shoulderAngle) * L1 + Math.sin(shoulderAngle + elbowAngle) * L2;

// Calculate vertical height on the Y axis
const h = Math.cos(shoulderAngle) * L1 + Math.cos(shoulderAngle + elbowAngle) * L2;
```

Once we have `r` and `h` in 2D planar space, we project them into 3D world space using the `baseAngle` (Yaw):
```javascript
const endX = armBaseX + Math.sin(baseAngle) * r;
const endZ = Math.cos(baseAngle) * r;
const endY = baseHeight + h;
```
If the Cartesian distance `Math.sqrt((endX - bx)**2 + (endY - by)**2 + (endZ - bz)**2)` is `< 0.8`, the collision is successful.

### 1.2 Inverse Kinematics (IK) - The "pickBall" Preset
When the LLM issues a "pick up the ball" command, the robot must calculate the joint angles required to reach the target `[dx, dy, dz]`. KBot uses a geometric planar IK solver.

1. **Calculate Base Yaw (`baseAngle`):**
   ```javascript
   const baseAngle = Math.atan2(dx, dz);
   ```

2. **Project to 2D Plane:**
   We calculate the straight-line distance `d` from the shoulder joint to the ball:
   ```javascript
   const r = Math.sqrt(dx*dx + dz*dz); // radial distance
   const h = dy - baseHeight;          // vertical height relative to shoulder
   const d = Math.sqrt(r*r + h*h);     // hypotenuse
   ```

3. **Solve for Joints using Law of Cosines:**
   The arm forms a triangle with sides `L1`, `L2`, and `d`.
   - The angle `gamma` (inside the shoulder) is solved via:
     `cos(gamma) = (L1² + d² - L2²) / (2 * L1 * d)`
   - The angle `beta` (inside the elbow) is solved via:
     `cos(beta) = (L1² + L2² - d²) / (2 * L1 * L2)`

4. **Convert to KBot Angle Conventions:**
   KBot assumes `0` radians is pointing straight up. We must subtract our interior angles from the absolute angle `alpha` (the angle of `d` from vertical):
   ```javascript
   const alpha = Math.atan2(r, h);
   const shoulderAngle = alpha - gamma;
   const elbowAngle = Math.PI - beta; // positive elbowAngle bends forward in KBot
   ```

---

## 2. Vision Mapping Logic (`mapHandToArm`)

MediaPipe provides 21 landmarks. The coordinates `[x, y, z]` are normalized to the camera frame `[0.0, 1.0]`. KBot applies a set of heuristics to extract robot DOF.

### 2.1 Pincer (Pinch Detection)
To ensure the pinch works at any distance from the camera, we do not use an absolute pixel distance. We calculate the pinch distance *relative* to the overall size of the user's hand on screen.
```javascript
// Find hand scale (wrist to index knuckle)
const handSize = Math.hypot(indexMCP.x - wrist.x, indexMCP.y - wrist.y) + 0.001;

// Find pinch distance (thumb tip to index tip)
const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

// Ratio > 0.40 = Open (1), Ratio <= 0.40 = Closed (0)
const pincerOpen = (pinchDist / handSize) > 0.40 ? 1 : 0;
```

### 2.2 Core Posture (Coupled Kinematics)
- **Base Yaw:** Mapped linearly across the X-axis of the camera frame. `(0.5 - wrist.x) * Math.PI * 2.0`.
- **Shoulder Pitch:** Mapped linearly across the Y-axis. `lerp(-PI/2, +0.55*PI, wrist.y)`.
- **Elbow Pitch (Coupled + Tilt):**
  Instead of mapping elbow to an independent hand joint, we couple it to the shoulder to simulate a reaching motion. The lower the wrist `y`, the more the elbow bends forward.
  ```javascript
  const autoElbow = lerp(-Math.PI/4, Math.PI * 0.6, wrist.y);
  ```
  We then extract fine "tilt" control by measuring the vector from the wrist to the index knuckle. Pointing fingers downward adds up to `+0.5 * PI` to the elbow angle.

### 2.3 V3 Wrist Extraction (6-DOF)
For the 6-DOF Industrial arm, we must extract 3 extra angles purely from 2D palm geometry.
- **Wrist Roll (Twist):** Compares the vertical position of the pinky knuckle (`pinkyMCP.y`) to the index knuckle (`indexMCP.y`). If the pinky is higher than the index, the palm is facing upward.
  ```javascript
  const rollRaw = (pinkyMCP.y - indexMCP.y) / indexToPinkyDistance;
  ```
- **Wrist Pitch (Nod):** Calculates the vertical direction vector from the wrist to the middle finger knuckle (`middleMCP`).
- **Wrist Yaw (Sweep):** Measures the horizontal offset of the thumb tip relative to the index tip. `(thumbTip.x - indexTip.x)`. If the thumb sweeps right, the wrist yaws right.

---

## 3. The `toggleGrip` Event Bus

The vision system runs at 60 FPS but `toggleGrip` is an event. To bridge this, `VisionPanel.jsx` employs a transition detector:

1. In the `requestAnimationFrame` loop, it reads the target `pincerOpen` (0 or 1).
2. It compares it to `smooth.current.pincerOpen` (the state from the *last* frame).
3. If they differ (e.g., the user just pinched their fingers), it bypasses the standard `setArmState` pipeline and actively triggers `store.toggleGrip(armId)`.
4. `toggleGrip` executes the Forward Kinematics (FK) logic outlined in Section 1.1. If the collision succeeds, `store.setBallState` is fired, changing the rendering parent of the ball to the arm's `pincerTargetRef`.
