self.onmessage = (e) => {
  const { type, data } = e.data;
  if (type === 'CALCULATE_IK') {
    const { ballPosition, dimensions, armVisuals, target } = data;
    const armX = armVisuals[target]?.posX || 0;
    const dx = ballPosition[0] - armX;
    const dy = ballPosition[1];
    const dz = ballPosition[2];

    // Base rotation (yaw)
    const baseAngle = Math.atan2(dx, dz);

    // Planar geometry
    const r = Math.sqrt(dx * dx + dz * dz);
    const h = dy - dimensions.baseHeight; // Height relative to shoulder
    
    const L1 = dimensions.link1;
    const L2 = dimensions.link2 + 0.36; // include wrist to pincer center
    const d = Math.sqrt(r * r + h * h); // Direct distance from shoulder to ball

    // Reachability check
    if (d >= L1 + L2) {
      self.postMessage({ 
        type: 'IK_RESULT', 
        success: false, 
        error: `Target out of reach! Max radius: ${(L1 + L2).toFixed(1)}u.`,
        target 
      });
      return;
    }

    // Law of Cosines for angles
    const alpha = Math.atan2(r, h); // Angle from +Y axis
    const cosGamma = (L1*L1 + d*d - L2*L2) / (2 * L1 * d);
    const gamma = Math.acos(Math.max(-1, Math.min(1, cosGamma)));
    
    const cosBeta = (L1*L1 + L2*L2 - d*d) / (2 * L1 * L2);
    const beta = Math.acos(Math.max(-1, Math.min(1, cosBeta)));

    // "Elbow Up" configuration
    const shoulderAngle = alpha - gamma;
    const elbowAngle = Math.PI - beta; // positive pitch bends forward

    self.postMessage({ 
      type: 'IK_RESULT', 
      success: true, 
      data: { baseAngle, shoulderAngle, elbowAngle },
      target 
    });
  }
};
