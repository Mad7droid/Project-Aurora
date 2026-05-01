import { useEffect, useRef } from 'react';
import { useStore } from '../store';

const SPEED = 0.03;

export function useKeyboardControls() {
  const keys = useRef({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      keys.current[e.code] = true;
      
      const { activeArms, arms, setArmState } = useStore.getState();

      // Pincer toggles
      if (e.code === 'Space' && activeArms.includes('left')) {
        setArmState('left', { pincerOpen: arms.left.pincerOpen === 1 ? 0 : 1 });
      }
      if (e.code === 'Enter' && activeArms.includes('right')) {
        setArmState('right', { pincerOpen: arms.right.pincerOpen === 1 ? 0 : 1 });
      }
    };
    
    const handleKeyUp = (e) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId;
    
    const update = () => {
      const state = useStore.getState();
      
      // LEFT ARM (WASD Q E)
      if (state.activeArms.includes('left')) {
        const left = state.arms.left;
        if (keys.current['KeyA']) state.setArmState('left', { baseAngle: left.baseAngle + SPEED });
        if (keys.current['KeyD']) state.setArmState('left', { baseAngle: left.baseAngle - SPEED });
        if (keys.current['KeyW']) state.setArmState('left', { shoulderAngle: Math.min(Math.PI / 2, left.shoulderAngle + SPEED) });
        if (keys.current['KeyS']) state.setArmState('left', { shoulderAngle: Math.max(-Math.PI / 2, left.shoulderAngle - SPEED) });
        if (keys.current['KeyQ']) state.setArmState('left', { elbowAngle: Math.min(Math.PI * 0.75, left.elbowAngle + SPEED) });
        if (keys.current['KeyE']) state.setArmState('left', { elbowAngle: Math.max(-Math.PI * 0.75, left.elbowAngle - SPEED) });
      }

      // RIGHT ARM (I J K L U O)
      if (state.activeArms.includes('right')) {
        const right = state.arms.right;
        if (keys.current['KeyJ']) state.setArmState('right', { baseAngle: right.baseAngle + SPEED });
        if (keys.current['KeyL']) state.setArmState('right', { baseAngle: right.baseAngle - SPEED });
        if (keys.current['KeyI']) state.setArmState('right', { shoulderAngle: Math.min(Math.PI / 2, right.shoulderAngle + SPEED) });
        if (keys.current['KeyK']) state.setArmState('right', { shoulderAngle: Math.max(-Math.PI / 2, right.shoulderAngle - SPEED) });
        if (keys.current['KeyU']) state.setArmState('right', { elbowAngle: Math.min(Math.PI * 0.75, right.elbowAngle + SPEED) });
        if (keys.current['KeyO']) state.setArmState('right', { elbowAngle: Math.max(-Math.PI * 0.75, right.elbowAngle - SPEED) });
      }

      animationFrameId = requestAnimationFrame(update);
    };
    
    update();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
}
