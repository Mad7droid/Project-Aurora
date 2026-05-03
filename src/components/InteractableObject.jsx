import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store';
import * as THREE from 'three';

const ballMat = new THREE.MeshStandardMaterial({
  color: '#e83050',
  roughness: 0.2,
  metalness: 0.1,
});
const cubeMat = new THREE.MeshStandardMaterial({
  color: '#3080e8',
  roughness: 0.4,
  metalness: 0.2,
});
const canMat = new THREE.MeshPhysicalMaterial({
  color: '#silver',
  roughness: 0.3,
  metalness: 0.9,
  clearcoat: 0.5,
});

export default function InteractableObject({ pincerRefs }) {
  const meshRef = useRef();
  const prevAttachedTo = useRef(null);

  // Store state
  const attachedTo = useStore(s => s.attachedTo);
  const ballPosition = useStore(s => s.ballPosition);
  const targetType = useStore(s => s.targetType);
  const isSelected = useStore(s => s.isTargetSelected);
  const setIsSelected = useStore(s => s.setIsTargetSelected);
  const setBallState = useStore(s => s.setBallState);

  // Set initial position imperatively (we don't use the position prop
  // so React can't teleport the mesh when ballPosition state changes)
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...ballPosition);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const velocityY = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Detect drop transition: was attached, now free
    if (prevAttachedTo.current && !attachedTo) {
      const cur = meshRef.current.position;
      // Record the actual drop X/Z in the store so it doesn't "reset" back to the original spot
      setBallState(null, [cur.x, 0.15, cur.z]);
      velocityY.current = 0; 
    }
    prevAttachedTo.current = attachedTo;

    if (attachedTo && pincerRefs[attachedTo]?.current) {
      // Follow the pincer if attached
      const pincer = pincerRefs[attachedTo].current;
      const targetPos = new THREE.Vector3();
      pincer.getWorldPosition(targetPos);
      targetPos.y -= 0.15;
      
      // Faster damp for pick-up to prevent "flying" look
      meshRef.current.position.x = THREE.MathUtils.damp(meshRef.current.position.x, targetPos.x, 25, delta);
      meshRef.current.position.y = THREE.MathUtils.damp(meshRef.current.position.y, targetPos.y, 25, delta);
      meshRef.current.position.z = THREE.MathUtils.damp(meshRef.current.position.z, targetPos.z, 25, delta);
      velocityY.current = 0;
    } else {
      // Real Gravity Drop logic
      if (!isSelected) {
        if (meshRef.current.position.y > 0.15) {
          velocityY.current -= 12.81 * delta; // standard gravity
          meshRef.current.position.y += velocityY.current * delta;
          
          if (meshRef.current.position.y <= 0.15) {
            meshRef.current.position.y = 0.15;
            velocityY.current = 0; 
            // Sync final landing position to store so the bot knows exactly where to pick it up next time
            setBallState(null, [meshRef.current.position.x, 0.15, meshRef.current.position.z]);
          }
        }
        
        const target = new THREE.Vector3(...ballPosition);
        meshRef.current.position.x = THREE.MathUtils.damp(meshRef.current.position.x, target.x, 10, delta);
        meshRef.current.position.z = THREE.MathUtils.damp(meshRef.current.position.z, target.z, 10, delta);
      }
    }
    
    // Add a gentle floating/bobbing effect if selected
    if (isSelected && !attachedTo) {
      const time = Date.now() * 0.005;
      meshRef.current.position.y = ballPosition[1] + Math.sin(time) * 0.05 + 0.05;
      meshRef.current.rotation.y += 0.02;
    } else {
      // Reset rotation slowly if not selected
      meshRef.current.rotation.y = THREE.MathUtils.damp(meshRef.current.rotation.y, 0, 8, delta);
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (!attachedTo) {
      setIsSelected(!isSelected);
    }
  };

  return (
    <group>
      {/* The main object */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        {targetType === 'ball' && <sphereGeometry args={[0.15, 32, 32]} />}
        {targetType === 'cube' && <boxGeometry args={[0.25, 0.25, 0.25]} />}
        {targetType === 'can'  && <cylinderGeometry args={[0.12, 0.12, 0.35, 32]} />}
        
        {targetType === 'ball' && <primitive object={ballMat} attach="material" />}
        {targetType === 'cube' && <primitive object={cubeMat} attach="material" />}
        {targetType === 'can'  && <primitive object={canMat} attach="material" />}
      </mesh>

      {/* Selection Ring Indicator */}
      {isSelected && !attachedTo && (
        <mesh position={[ballPosition[0], 0.02, ballPosition[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.3, 32]} />
          <meshBasicMaterial color="#e8a45a" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}
