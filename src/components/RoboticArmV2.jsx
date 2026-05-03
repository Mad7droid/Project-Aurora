import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useStore } from '../store';
import * as THREE from 'three';

// Shared materials — identical to V0 for visual consistency
const baseDarkMat = new THREE.MeshPhysicalMaterial({
  color: '#0d0d0f', roughness: 0.88, metalness: 0.75, reflectivity: 0.1,
});

export default function RoboticArmV2({ armId, position, accentColor, bodyColor, pincerTargetRef }) {
  const armState   = useStore(s => s.arms[armId]);
  const dimensions = useStore(s => s.dimensions);

  const bodyMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: bodyColor ?? '#1e1e21', roughness: 0.78, metalness: 0.90,
    reflectivity: 0.2, clearcoat: 0.08, clearcoatRoughness: 0.7,
  }), [bodyColor]);

  const accentMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: accentColor ?? '#c07830', roughness: 0.38, metalness: 0.82,
    iridescence: 0.85, iridescenceIOR: 1.6,
    iridescenceThicknessRange: [80, 420],
    emissive: new THREE.Color(accentColor ?? '#c07830').multiplyScalar(0.18),
    emissiveIntensity: 1, toneMapped: false,
  }), [accentColor]);

  const baseRef        = useRef();
  const shoulderRef    = useRef();
  const leftPincerRef  = useRef();
  const rightPincerRef = useRef();

  if (!armState) return null;
  const { baseAngle, shoulderAngle, pincerOpen } = armState;
  const { baseHeight: bh, link1: l1 } = dimensions;
  // V2: fixed forearm length (shorter, compact look)
  const fw = 0.9;

  useFrame(() => {
    if (baseRef.current)
      baseRef.current.rotation.y = THREE.MathUtils.lerp(baseRef.current.rotation.y, baseAngle, 0.12);
    if (shoulderRef.current)
      shoulderRef.current.rotation.x = THREE.MathUtils.lerp(shoulderRef.current.rotation.x, shoulderAngle, 0.12);

    const po = 0.1 + pincerOpen * 0.18;
    if (leftPincerRef.current)
      leftPincerRef.current.position.x = THREE.MathUtils.lerp(leftPincerRef.current.position.x, po, 0.18);
    if (rightPincerRef.current)
      rightPincerRef.current.position.x = THREE.MathUtils.lerp(rightPincerRef.current.position.x, -po, 0.18);
  });

  return (
    <group position={position}>
      {/* Base plate */}
      <mesh position={[0, 0.1, 0]} material={baseDarkMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.75, 0.9, 0.2, 24]} />
      </mesh>

      <group ref={baseRef}>
        {/* Turret */}
        <mesh position={[0, bh / 2, 0]} material={bodyMat} castShadow>
          <cylinderGeometry args={[0.52, 0.58, bh, 24]} />
        </mesh>
        <mesh position={[0, bh * 0.72, 0]} material={accentMat}>
          <torusGeometry args={[0.54, 0.016, 12, 48]} />
        </mesh>

        <group position={[0, bh, 0]} ref={shoulderRef}>
          {/* Shoulder joint */}
          <mesh rotation={[0, 0, Math.PI / 2]} material={bodyMat} castShadow>
            <cylinderGeometry args={[0.26, 0.26, 0.52, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={accentMat} scale={[1, 1.05, 1]}>
            <cylinderGeometry args={[0.17, 0.17, 0.54, 24]} />
          </mesh>

          {/* Upper arm (l1) */}
          <RoundedBox position={[0, l1 / 2, 0]} args={[0.28, l1, 0.28]} radius={0.05} smoothness={4} material={bodyMat} castShadow />

          {/* Wrist block (fixed, at tip of upper arm) */}
          <group position={[0, l1, 0]}>
            {/* Compact wrist housing */}
            <RoundedBox args={[0.30, 0.18, 0.52]} radius={0.04} smoothness={4} material={baseDarkMat} castShadow />
            {/* Accent line on wrist */}
            <mesh position={[0, 0, 0.27]} material={accentMat}>
              <torusGeometry args={[0.22, 0.013, 8, 32]} />
            </mesh>

            {/* Fixed forearm — angled slightly forward for natural reach */}
            <group rotation={[Math.PI * 0.08, 0, 0]}>
              <RoundedBox position={[0, fw / 2, 0]} args={[0.20, fw, 0.20]} radius={0.04} smoothness={4} material={bodyMat} castShadow />

              {/* Pincer mount */}
              <group position={[0, fw, 0]}>
                <RoundedBox args={[0.30, 0.14, 0.50]} radius={0.04} smoothness={4} material={baseDarkMat} castShadow />
                {/* pincerTargetRef — attach point for InteractableObject */}
                <group ref={pincerTargetRef} position={[0, 0.38, 0]} />

                {/* Left jaw */}
                <group ref={leftPincerRef} position={[0.1, 0.28, 0]}>
                  <RoundedBox args={[0.055, 0.52, 0.10]} radius={0.02} smoothness={4} material={bodyMat} castShadow />
                  <RoundedBox position={[-0.045, 0.24, 0]} args={[0.02, 0.08, 0.08]} radius={0.01} smoothness={4} material={accentMat} />
                </group>

                {/* Right jaw */}
                <group ref={rightPincerRef} position={[-0.1, 0.28, 0]}>
                  <RoundedBox args={[0.055, 0.52, 0.10]} radius={0.02} smoothness={4} material={bodyMat} castShadow />
                  <RoundedBox position={[0.045, 0.24, 0]} args={[0.02, 0.08, 0.08]} radius={0.01} smoothness={4} material={accentMat} />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
