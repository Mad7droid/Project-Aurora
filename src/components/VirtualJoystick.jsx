import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';

export default function VirtualJoystick({ 
  side = 'left', 
  label = 'JOINT',
  xAxis = 'baseAngle',
  yAxis = 'shoulderAngle',
  armId = 'left',
  invertX = false,
  invertY = false
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef(null);
  const { setArmState, arms } = useStore();
  
  const SPEED = 0.04;
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        const arm = arms[armId];
        if (!arm) return;

        const updates = {};
        
        // Calculate incremental change based on joystick offset (-1 to 1)
        const dx = (offset.x / 40) * SPEED * (invertX ? -1 : 1);
        const dy = (offset.y / 40) * SPEED * (invertY ? -1 : 1);

        if (xAxis) {
          updates[xAxis] = arm[xAxis] + dx;
        }
        
        if (yAxis) {
          // Clamp joint angles if necessary (should be consistent with keyboard logic)
          if (yAxis === 'shoulderAngle') {
            updates[yAxis] = Math.min(Math.PI / 2, Math.max(-Math.PI / 2, arm[yAxis] + dy));
          } else if (yAxis === 'elbowAngle') {
            updates[yAxis] = Math.min(Math.PI * 0.75, Math.max(-Math.PI * 0.75, arm[yAxis] + dy));
          } else {
            updates[yAxis] = arm[yAxis] + dy;
          }
        }

        setArmState(armId, updates);
      }, 16);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, offset, armId, arms, setArmState, xAxis, yAxis, invertX, invertY]);

  const handleTouch = (e) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    
    // Clamp to 50px radius
    const distance = Math.sqrt(dx * dx + dy * dy);
    const max = 40;
    if (distance > max) {
      dx *= max / distance;
      dy *= max / distance;
    }
    
    setOffset({ x: dx, y: dy });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <span className="label" style={{ fontSize: '0.55rem', opacity: 0.5 }}>{label}</span>
      <div 
        ref={containerRef}
        className="joystick-base"
        onTouchStart={(e) => { setIsActive(true); handleTouch(e); }}
        onTouchMove={handleTouch}
        onTouchEnd={() => { setIsActive(false); setOffset({ x: 0, y: 0 }); }}
      >
        <div 
          className="joystick-handle"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        />
      </div>
    </div>
  );
}
