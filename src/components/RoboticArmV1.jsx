import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useStore } from '../store';
import * as THREE from 'three';

// Materials mimicking the physical kit
const aluminumMat = new THREE.MeshStandardMaterial({
  color: '#d0d0d0', // Silver
  roughness: 0.4,
  metalness: 0.8,
});

const servoMat = new THREE.MeshStandardMaterial({
  color: '#1a1a1a', // Black plastic
  roughness: 0.7,
  metalness: 0.1,
});

// A helper for a generic MG995 servo block (approx. 40x20x36mm proportion)
const ServoBody = ({ position, rotation }) => (
  <mesh position={position} rotation={rotation} material={servoMat} castShadow receiveShadow>
    <boxGeometry args={[0.2, 0.4, 0.36]} />
  </mesh>
);

// A helper for a generic U-Bracket (approximated as a hollow-ish box or just 3 thin boxes)
const UBracket = ({ length, position, rotation }) => {
  const w = 0.25;
  const t = 0.02; // thickness
  return (
    <group position={position} rotation={rotation}>
      {/* Base of U */}
      <mesh position={[0, length / 2, -w/2 + t/2]} material={aluminumMat} castShadow>
        <boxGeometry args={[w, length, t]} />
      </mesh>
      {/* Sides of U */}
      <mesh position={[-w/2 + t/2, length / 2, 0]} material={aluminumMat} castShadow>
        <boxGeometry args={[t, length, w]} />
      </mesh>
      <mesh position={[w/2 - t/2, length / 2, 0]} material={aluminumMat} castShadow>
        <boxGeometry args={[t, length, w]} />
      </mesh>
    </group>
  );
};

export default function RoboticArmV1({ armId, position, pincerTargetRef }) {
  const armState = useStore(s => s.arms[armId]);
  const dimensions = useStore(s => s.dimensions);

  const baseRef = useRef();
  const shoulderRef = useRef();
  const elbowRef = useRef();
  const leftPincerRef = useRef();
  const rightPincerRef = useRef();

  if (!armState) return null;

  const { baseAngle, shoulderAngle, elbowAngle, pincerOpen } = armState;
  const { baseHeight: bh, link1: l1, link2: l2 } = dimensions;

  useFrame(() => {
    if (baseRef.current)      baseRef.current.rotation.y     = THREE.MathUtils.lerp(baseRef.current.rotation.y,      baseAngle,     0.15);
    if (shoulderRef.current)  shoulderRef.current.rotation.x = THREE.MathUtils.lerp(shoulderRef.current.rotation.x,  shoulderAngle, 0.15);
    if (elbowRef.current)     elbowRef.current.rotation.x    = THREE.MathUtils.lerp(elbowRef.current.rotation.x,     elbowAngle,    0.15);

    // Mechanical parallel gripper simulation
    const po = 0.02 + pincerOpen * 0.1;
    if (leftPincerRef.current)  leftPincerRef.current.position.x  = THREE.MathUtils.lerp(leftPincerRef.current.position.x,   po, 0.2);
    if (rightPincerRef.current) rightPincerRef.current.position.x = THREE.MathUtils.lerp(rightPincerRef.current.position.x, -po, 0.2);
  });

  return (
    <group position={position}>
      {/* Flat base plate */}
      <mesh position={[0, 0.05, 0]} material={aluminumMat} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.1, 0.8]} />
      </mesh>

      {/* Base Servo (Upright) */}
      <ServoBody position={[0, 0.3, 0]} rotation={[0, 0, 0]} />

      <group ref={baseRef}>
        {/* Turret Bracket (connecting base servo to shoulder) */}
        <mesh position={[0, 0.55, 0]} material={aluminumMat} castShadow>
          <boxGeometry args={[0.3, 0.05, 0.3]} />
        </mesh>
        
        {/* Shoulder Servo (Horizontal) */}
        <group position={[0, bh, 0]}>
          <ServoBody position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
          
          <group ref={shoulderRef}>
            {/* Upper Arm Bracket */}
            <UBracket length={l1} position={[0, 0, 0]} rotation={[0, 0, 0]} />
            
            {/* Elbow Servo (Horizontal, mounted at top of L1) */}
            <group position={[0, l1, 0]}>
              <ServoBody position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
              
              <group ref={elbowRef}>
                {/* Forearm Bracket */}
                <UBracket length={l2} position={[0, 0, 0]} rotation={[0, 0, 0]} />
                
                {/* Wrist & Gripper Assembly */}
                <group position={[0, l2, 0]}>
                  {/* Wrist Bracket */}
                  <mesh position={[0, 0.05, 0]} material={aluminumMat} castShadow>
                    <boxGeometry args={[0.4, 0.1, 0.2]} />
                  </mesh>
                  
                  {/* Pincer Target (for ball attachment) */}
                  <group ref={pincerTargetRef} position={[0, 0.25, 0]} />

                  {/* Left Gripper Finger */}
                  <group ref={leftPincerRef} position={[0.05, 0.2, 0]}>
                    <mesh material={aluminumMat} castShadow>
                      <boxGeometry args={[0.05, 0.3, 0.1]} />
                    </mesh>
                  </group>
                  
                  {/* Right Gripper Finger */}
                  <group ref={rightPincerRef} position={[-0.05, 0.2, 0]}>
                    <mesh material={aluminumMat} castShadow>
                      <boxGeometry args={[0.05, 0.3, 0.1]} />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
