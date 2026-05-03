# Project Aurora: Autonomous Teleoperation & VLA Training Environment

Next-Gen Robotic Teleoperation and VLA Training Simulation Tool.
Currently optimized for the KBot robotic system.

## Overview
Project Aurora is a simulation platform designed for the development and validation of Vision-Language-Action (VLA) models and high-fidelity robotic teleoperation. The tool provides a unified environment for mapping natural language instructions and visual inputs to precise robotic actions.

## Tech Stack
*   **3D Engine**: Three.js / React Three Fiber / React Three Drei
*   **Physics Engine**: Lightweight Next-Gen Physics (Custom Deterministic Damping & Parabolic Gravity)
*   **Concurrency**: WebWorker-Offloaded Inverse Kinematics (IK)
*   **Computer Vision**: Google MediaPipe (Hand Landmarker)
*   **State Management**: Zustand
*   **Styling**: Vanilla CSS (Custom Glassmorphism Design System)
*   **Frontend**: React.js (Vite)

## Core Capabilities

### Lightweight High-Performance Rendering
*   **WebWorker Offloading**: All heavy Inverse Kinematics (IK) calculations are offloaded to a background thread, ensuring a locked 60FPS UI even during complex maneuvers.
*   **Deterministic Kinematics**: Hardware-agnostic damping ensures the simulation behaves identically on any refresh rate (30Hz to 144Hz+), providing reliable data for VLA training.
*   **Real-World Gravity**: Velocity-based parabolic fall logic for realistic object interactions without the overhead of heavy WASM engines.

### VLA Training & Data Collection
*   **Vision-Language-Action Pipeline**: Framework for generating datasets that pair natural language commands with visual states and motor actions.
*   **Action Mapping**: High-precision joint state and end-effector coordinate calculation for training kinematic control models.

### Teleoperation & Control
*   **Multi-Model Support**: Native simulation for KBot V0, V1, V2, and V3 robotic arm variants.
*   **Hand Tracking Control**: Gesture-to-action mapping using MediaPipe for zero-latency end-effector control.
*   **Telemetry Feedback**: Real-time joint velocity, torque estimation, and positional telemetry.

## Technical Specifications
*   **Graphics Engine**: React Three Fiber (Three.js)
*   **Input Processing**: MediaPipe (Computer Vision) and Natural Language parsing
*   **State Management**: Zustand
*   **UI System**: Vanilla CSS / Glassmorphism Architecture

## Documentation
*   [Architecture Overview](./ARCHITECTURE.md): Technical breakdown of state synchronization and rendering pipelines.
*   [Logic & Physics](./LOGIC.md): Kinematic heuristics, VLA integration, and interaction logic.

---
© 2024 Project Aurora. Developed by Mad7droid.
