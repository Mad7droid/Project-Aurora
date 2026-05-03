# Project Aurora: Autonomous Teleoperation & VLA Training Environment

**The core simulation platform for Autonomous Robotic Teleoperation and VLA (Vision-Language-Action) dataset generation.**
Currently optimized for the KBot ecosystem.

## Overview
Project Aurora is a simulation platform designed for the development and validation of Vision-Language-Action (VLA) models and high-fidelity robotic teleoperation. The tool provides a unified environment for mapping natural language instructions and visual inputs to precise robotic actions.

## Tech Stack
*   **Frontend**: React.js (Vite)
*   **3D Engine**: Three.js / React Three Fiber / React Three Drei
*   **Computer Vision**: Google MediaPipe (Hand Landmarker)
*   **State Management**: Zustand
*   **Styling**: Vanilla CSS (Custom Glassmorphism Design System)
*   **Physics/Math**: Custom Kinematic Solvers (IK/FK)

## Core Capabilities

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
