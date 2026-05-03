import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useStore } from '../store';
import * as THREE from 'three';

// Shared base-plate material — cast iron look, very matte
const baseDarkMat = new THREE.MeshPhysicalMaterial({
  color: '#0d0d0f',
  roughness: 0.88,
  metalness: 0.75,
  reflectivity: 0.1,
});

export default function RoboticArm({ armId, position, accentColor, bodyColor, pincerTargetRef }) {
  const armState   = useStore(s => s.arms[armId]);
  const dimensions = useStore(s => s.dimensions);

  // Body — anodised aluminium / powder-coated steel feel
  // High roughness = matte, high metalness = still clearly metal
  const bodyMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color:       bodyColor ?? '#1e1e21',
    roughness:   0.78,          // matte — not plastic
    metalness:   0.90,
    reflectivity: 0.2,
    clearcoat:   0.08,          // very faint clearcoat — realistic industrial finish
    clearcoatRoughness: 0.7,
  }), [bodyColor]);

  // Accent rings — iridescent anodised titanium
  // MeshPhysicalMaterial lets us use the built-in iridescence extension
  const accentMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color:              accentColor ?? '#c07830',
    roughness:          0.38,
    metalness:          0.82,
    iridescence:        0.85,           // subtle colour-shift shimmer
    iridescenceIOR:     1.6,            // titanium-anodised range
    iridescenceThicknessRange: [80, 420],
    emissive:           new THREE.Color(accentColor ?? '#c07830').multiplyScalar(0.18),
    emissiveIntensity:  1,
    toneMapped:         false,
  }), [accentColor]);

  const baseRef         = useRef();
  const shoulderRef     = useRef();
  const elbowRef        = useRef();
  const leftPincerRef   = useRef();
  const rightPincerRef  = useRef();

  if (!armState) return null;

  const { baseAngle, shoulderAngle, elbowAngle, pincerOpen } = armState;
  const { baseHeight: bh, link1: l1, link2: l2 } = dimensions;

  useFrame(() => {
    if (baseRef.current)      baseRef.current.rotation.y      = THREE.MathUtils.lerp(baseRef.current.rotation.y,      baseAngle,     0.12);
    if (shoulderRef.current)  shoulderRef.current.rotation.x  = THREE.MathUtils.lerp(shoulderRef.current.rotation.x,  shoulderAngle, 0.12);
    if (elbowRef.current)     elbowRef.current.rotation.x     = THREE.MathUtils.lerp(elbowRef.current.rotation.x,     elbowAngle,    0.12);

    const po = 0.1 + pincerOpen * 0.15;
    if (leftPincerRef.current)  leftPincerRef.current.position.x  = THREE.MathUtils.lerp(leftPincerRef.current.position.x,   po, 0.18);
    if (rightPincerRef.current) rightPincerRef.current.position.x = THREE.MathUtils.lerp(rightPincerRef.current.position.x,  -po, 0.18);
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
        {/* Accent ring */}
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

          {/* Upper arm */}
          <RoundedBox position={[0, l1 / 2, 0]} args={[0.24, l1, 0.24]} radius={0.04} smoothness={4} material={bodyMat} castShadow />

          <group position={[0, l1, 0]} ref={elbowRef}>
            {/* Elbow joint */}
            <mesh rotation={[0, 0, Math.PI / 2]} material={bodyMat} castShadow>
              <cylinderGeometry args={[0.21, 0.21, 0.44, 24]} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} material={accentMat} scale={[1, 1.06, 1]}>
              <cylinderGeometry args={[0.13, 0.13, 0.46, 24]} />
            </mesh>

            {/* Forearm */}
            <RoundedBox position={[0, l2 / 2, 0]} args={[0.17, l2, 0.17]} radius={0.03} smoothness={4} material={bodyMat} castShadow />

            {/* Wrist & claw */}
            <group position={[0, l2, 0]}>
              <RoundedBox args={[0.26, 0.16, 0.48]} radius={0.04} smoothness={4} material={baseDarkMat} castShadow />
              <group ref={pincerTargetRef} position={[0, 0.36, 0]} />

              {/* Left jaw — offset on +X, opens left */}
              <group ref={leftPincerRef} position={[0.1, 0.26, 0]}>
                <RoundedBox args={[0.05, 0.48, 0.09]} radius={0.02} smoothness={4} material={bodyMat} castShadow />
                <RoundedBox position={[-0.04, 0.22, 0]} args={[0.02, 0.07, 0.07]} radius={0.01} smoothness={4} material={accentMat} />
              </group>

              {/* Right jaw — offset on -X, opens right */}
              <group ref={rightPincerRef} position={[-0.1, 0.26, 0]}>
                <RoundedBox args={[0.05, 0.48, 0.09]} radius={0.02} smoothness={4} material={bodyMat} castShadow />
                <RoundedBox position={[0.04, 0.22, 0]} args={[0.02, 0.07, 0.07]} radius={0.01} smoothness={4} material={accentMat} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
