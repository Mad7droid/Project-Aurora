# KBot OS

A mobile-first robotic arm teleoperation dashboard built with React, Three.js, and MediaPipe.

## Features
- **3D Simulation:** Real-time 3D workspace with multiple robot variants (V0, V1, V2, V3).
- **Computer Vision:** Control the arm using hand gestures via webcam (Hand Tracking).
- **AI Commands:** Natural language interface for executing complex robot sequences.
- **Responsive Design:** Adaptive UI for Desktop and Mobile (iOS/Android).

## Documentation
- **[Architecture Overview](./ARCHITECTURE.md)**: Technical breakdown of the component structure, state management (Zustand), and rendering pipeline.
- **[Logic & Algorithms](./LOGIC.md)**: Deep dive into the Kinematics (IK/FK), Vision mapping heuristics, and object interaction logic.

## Development
```bash
npm install
npm run dev
```

## Production
Deploy via Vercel or any static hosting provider.
