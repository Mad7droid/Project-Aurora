import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import RoboticArm   from './RoboticArm';
import RoboticArmV1 from './RoboticArmV1';
import RoboticArmV2 from './RoboticArmV2';
import RoboticArmV3 from './RoboticArmV3';
import InteractableObject from './InteractableObject';
import { useStore } from '../store';
import * as THREE from 'three';

// Camera reset controller — listens to the store signal
function CameraController({ controlsRef }) {
  const { camera } = useThree();
  const tick = useStore(s => s.cameraResetTick);
  const DEFAULT_POS = new THREE.Vector3(0, 5, 9);

  useEffect(() => {
    if (tick === 0) return;
    camera.position.copy(DEFAULT_POS);
    camera.lookAt(0, 1, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 1, 0);
      controlsRef.current.update();
    }
  }, [tick]);

  return null;
}

// Reads sceneConfig from store and applies to Three.js scene
function SceneBackground() {
  const { scene } = useThree();
  const c = useStore(s => s.sceneConfig);

  useEffect(() => {
    scene.background = new THREE.Color(c.bgColor);
  }, [c.bgColor, scene]);

  return (
    <>
      <ambientLight intensity={c.ambientIntensity} />
      <directionalLight position={[6, 12, 6]} intensity={c.dirLightIntensity} color={c.dirLightColor} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-6, 4, -5]} intensity={c.pointLight1Intensity} color={c.pointLight1Color} />
      <pointLight position={[6,  2,  5]} intensity={c.pointLight2Intensity} color={c.pointLight2Color} />
    </>
  );
}

export default function ArmSimulation() {
  const controlsRef = useRef();
  const pincerRefs = { left: useRef(), right: useRef() };
  const activeArms   = useStore(s => s.activeArms);
  const armVisuals   = useStore(s => s.armVisuals);
  const sceneConfig  = useStore(s => s.sceneConfig);
  const armModel     = useStore(s => s.armModel);

  const handleFloorClick = (e) => {
    e.stopPropagation();
    const store = useStore.getState();
    if (store.isTargetSelected && !store.attachedTo) {
      store.setBallState(null, [e.point.x, 0.15, e.point.z]);
      store.setIsTargetSelected(false);
    }
  };

  // Single dispatch function — keeps JSX DRY
  const renderArm = (id, posX) => {
    const vis = armVisuals[id];
    const sharedProps = {
      armId: id,
      position: [posX, 0, 0],
      accentColor: vis.accentColor,
      bodyColor:   vis.bodyColor,
      pincerTargetRef: pincerRefs[id],
    };
    if (armModel === 'v1') return <RoboticArmV1 armId={id} position={[posX, 0, 0]} pincerTargetRef={pincerRefs[id]} />;
    if (armModel === 'v2') return <RoboticArmV2 {...sharedProps} />;
    if (armModel === 'v3') return <RoboticArmV3 {...sharedProps} />;
    return <RoboticArm {...sharedProps} />; // v0 default
  };

  return (
    <Canvas
      camera={{ position: [0, 5, 9], fov: 42 }}
      shadows
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}   // cap pixel ratio for performance
    >
      <SceneBackground />
      <CameraController controlsRef={controlsRef} />

      <Suspense fallback={null}>
        <Environment preset="city" />
        <Grid
          position={[0, 0, 0]}
          args={[30, 30]}
          cellSize={0.6}
          cellThickness={0.5}
          cellColor={sceneConfig.gridColor}
          sectionSize={3}
          sectionThickness={0.9}
          sectionColor={sceneConfig.gridSectionColor}
          fadeDistance={20}
          fadeStrength={1.6}
          infiniteGrid
        />

        {/* Invisible click floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} onClick={handleFloorClick}>
          <planeGeometry args={[30, 30]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {/* Shadow plane — lighter than ContactShadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.45} />
        </mesh>

        <group>
          {activeArms.includes('left') && renderArm('left', activeArms.length > 1 ? armVisuals.left.posX : 0)}
          {activeArms.includes('right') && renderArm('right', armVisuals.right.posX)}
        </group>

        <InteractableObject pincerRefs={pincerRefs} />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 1, 0]}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={3}
        maxDistance={20}
        enablePan={false}
      />
    </Canvas>
  );
}
