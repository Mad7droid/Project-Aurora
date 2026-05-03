import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../store';
import { Camera, CameraOff, Loader2, FlipHorizontal, Hand } from 'lucide-react';

// ── MediaPipe singleton ──────────────────────────────────────────────────────
const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL  = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

let _landmarker = null;
let _initPromise = null;

async function getHandLandmarker() {
  if (_landmarker) return _landmarker;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const fs = await FilesetResolver.forVisionTasks(WASM_PATH);
    _landmarker = await HandLandmarker.createFromOptions(fs, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numHands: 2,
    });
    return _landmarker;
  })();
  return _initPromise;
}

// ── Math helpers ─────────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;

function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

function mapHandToArm(lm) {
  const wrist    = lm[0];
  const indexMCP = lm[5];   // index knuckle
  const middleMCP= lm[9];   // middle knuckle (better palm-normal reference)
  const pinkyMCP = lm[17];  // pinky knuckle
  const thumbTip = lm[4];
  const indexTip = lm[8];

  // ── Base yaw ────────────────────────────────────────────────────────────
  const baseAngle = clamp((0.5 - wrist.x) * Math.PI * 2.0, -Math.PI * 0.9, Math.PI * 0.9);

  // ── Shoulder ────────────────────────────────────────────────────────────
  const shoulderAngle = lerp(-Math.PI * 0.5, Math.PI * 0.55, wrist.y);

  // ── Elbow (auto-coupled + hand tilt fine-tune) ────────────────────────────────
  const autoElbow = lerp(-Math.PI * 0.25, Math.PI * 0.6, wrist.y);
  const hvx = indexMCP.x - wrist.x;
  const hvy = indexMCP.y - wrist.y;
  const handSize2D = Math.hypot(hvx, hvy) + 0.001;
  const tiltNorm   = hvy / handSize2D;
  const handTilt   = tiltNorm * Math.PI * 0.5;
  const elbowAngle = clamp(autoElbow + handTilt, -Math.PI * 0.75, Math.PI * 0.75);

  // ── Gripper ────────────────────────────────────────────────────────────────
  const handSize  = Math.hypot(indexMCP.x - wrist.x, indexMCP.y - wrist.y) + 0.001;
  const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
  const pincerOpen = (pinchDist / handSize) > 0.40 ? 1 : 0;

  // ── V3 Wrist (3-DOF from hand orientation) ──────────────────────────────────
  // wristRoll  — palm twist: compare indexMCP vs pinkyMCP vertical position
  //   palm face-up (pinky higher): positive roll
  //   palm face-down (index higher): negative roll
  const rollRaw = (pinkyMCP.y - indexMCP.y) / (Math.hypot(pinkyMCP.x-indexMCP.x, pinkyMCP.y-indexMCP.y) + 0.001);
  const wristRoll = clamp(rollRaw * Math.PI * 0.5, -Math.PI * 0.5, Math.PI * 0.5);

  // wristPitch — middle-finger direction up/down (nod):
  //   middleMCP above wrist → hand pointing up → negative pitch (tip up)
  const pmvy = middleMCP.y - wrist.y;
  const pmvx = middleMCP.x - wrist.x;
  const palmLen = Math.hypot(pmvx, pmvy) + 0.001;
  const wristPitch = clamp(-(pmvy / palmLen) * Math.PI * 0.5, -Math.PI * 0.5, Math.PI * 0.5);

  // wristYaw — thumb tip horizontal offset from index tip (sweep left/right)
  const thumbIndexDx = (thumbTip.x - indexTip.x) / (handSize + 0.001);
  const wristYaw = clamp(thumbIndexDx * Math.PI * 0.4, -Math.PI * 0.4, Math.PI * 0.4);

  return { baseAngle, shoulderAngle, elbowAngle, pincerOpen, wristPitch, wristRoll, wristYaw };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function VisionPanel() {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const lmRef     = useRef(null);
  const streamRef = useRef(null);

  // Per-arm smoothed angles stored in a ref (not state — updated 30fps)
  const smooth = useRef({
    left:  { baseAngle: 0, shoulderAngle: Math.PI / 4, elbowAngle: -Math.PI / 4, pincerOpen: 0 },
    right: { baseAngle: 0, shoulderAngle: Math.PI / 4, elbowAngle: -Math.PI / 4, pincerOpen: 0 },
  });

  const [status, setStatus] = useState('idle');   // idle | loading | active | denied | error
  const [handsDetected, setHandsDetected] = useState(0);
  const [mirror, setMirror] = useState(true);

  const { setArmState } = useStore();

  // Refs so the rAF loop always reads the latest values without stale closures
  const mirrorRef = useRef(true);
  useEffect(() => { mirrorRef.current = mirror; }, [mirror]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  // ── Start ──────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setStatus('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const landmarker = await getHandLandmarker();
      lmRef.current = landmarker;
      setStatus('active');

      // Detection loop
      const { DrawingUtils, HandLandmarker } = await import('@mediapipe/tasks-vision');
      // Create DrawingUtils once — reusing the same instance every frame is fine
      let duCtx = null;
      let du = null;

      const loop = (time) => {
        rafRef.current = requestAnimationFrame(loop);
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return;

        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Reuse DrawingUtils unless context changed
        if (ctx !== duCtx) { du = new DrawingUtils(ctx); duCtx = ctx; }

        const results = lmRef.current.detectForVideo(video, time);
        const count   = results.landmarks?.length || 0;
        setHandsDetected(count);

        if (count > 0) {
          // Always read current state from store — avoids stale closures on arm-mode changes
          const { activeArms } = useStore.getState();
          const isMirrored = mirrorRef.current;

          results.landmarks.forEach((lm, i) => {
            const rawSide = results.handednesses[i]?.[0]?.categoryName; // 'Left' | 'Right'

            // ── Handedness correction ─────────────────────────────────────────
            // MediaPipe processes the raw (unmirrored) frame. When using a front-facing
            // camera with CSS mirror, what the user sees as their RIGHT hand is on the
            // LEFT of the raw frame → MediaPipe calls it 'Left'.
            // So we must flip the label when the camera is mirrored.
            const side = isMirrored
              ? (rawSide === 'Left' ? 'Right' : 'Left')
              : rawSide;

            const color = side === 'Right' ? '#e8a45a' : '#5a7aaa';
            du.drawConnectors(lm, HandLandmarker.HAND_CONNECTIONS, { color, lineWidth: 2 });
            du.drawLandmarks(lm, { color, fillColor: color, radius: 3 });

            // Map to robot arm
            const target = mapHandToArm(lm);
            const armId = activeArms.length > 1
              ? (side === 'Right' ? 'right' : 'left')
              : (activeArms[0] || 'left');

            if (!activeArms.includes(armId)) return;

            const s = smooth.current[armId];
            const T = 0.13;
            s.baseAngle     = lerp(s.baseAngle,     target.baseAngle,     T);
            s.shoulderAngle = lerp(s.shoulderAngle, target.shoulderAngle, T);
            s.elbowAngle    = lerp(s.elbowAngle,    target.elbowAngle,    T);
            const prevPincer = s.pincerOpen;
            s.pincerOpen = target.pincerOpen; // snap gripper

            // If vision detects a grab/drop transition, trigger the store's full logic
            if (prevPincer !== undefined && prevPincer !== s.pincerOpen) {
              const store = useStore.getState();
              if (store.arms[armId].pincerOpen !== s.pincerOpen) {
                store.toggleGrip(armId);
              }
            }

            const update = {
              baseAngle:     s.baseAngle,
              shoulderAngle: s.shoulderAngle,
              elbowAngle:    s.elbowAngle,
              // don't write pincerOpen here, let toggleGrip handle it
            };

            // V3: also drive the wrist joints from hand orientation
            const { armModel } = useStore.getState();
            if (armModel === 'v3') {
              s.wristPitch = lerp(s.wristPitch || 0, target.wristPitch, T);
              s.wristRoll  = lerp(s.wristRoll  || 0, target.wristRoll,  T);
              s.wristYaw   = lerp(s.wristYaw   || 0, target.wristYaw,   T);
              update.wristPitch = s.wristPitch;
              update.wristRoll  = s.wristRoll;
              update.wristYaw   = s.wristYaw;
            }

            setArmState(armId, update);
          });
        }
      };
      rafRef.current = requestAnimationFrame(loop);

    } catch (err) {
      if (err.name === 'NotAllowedError') setStatus('denied');
      else { console.error(err); setStatus('error'); }
    }
  }, [setArmState]);

  // ── UI ─────────────────────────────────────────────────────────────────────
  const pill = (label, value) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '4px 10px', borderRadius: '20px',
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      fontSize: '0.68rem', color: 'var(--text-secondary)',
    }}>
      <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{value}</span>
      <span>{label}</span>
    </div>
  );

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'rgba(10,10,10,0.96)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
      }}>
        <Hand size={15} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Vision Control</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {status === 'active' && (
            <>
              {pill('hands', handsDetected)}
              <button
                onClick={() => setMirror(m => !m)}
                title="Toggle mirror"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <FlipHorizontal size={16} />
              </button>
              <button
                onClick={() => { stop(); setStatus('idle'); setHandsDetected(0); }}
                title="Stop camera"
                style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}
              >
                <CameraOff size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Camera Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>

        {/* Video + canvas overlay */}
        <video
          ref={videoRef}
          muted playsInline
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: mirror ? 'scaleX(-1)' : 'none',
            display: status === 'active' ? 'block' : 'none',
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            transform: mirror ? 'scaleX(-1)' : 'none',
            pointerEvents: 'none',
            display: status === 'active' ? 'block' : 'none',
          }}
        />

        {/* Idle state */}
        {status === 'idle' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '24px',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(232,164,90,0.1)', border: '1px solid rgba(232,164,90,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>Hand Pose Teleoperation</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Your camera will track your hands in real-time and mirror the movement onto the robot arms.
                No data leaves your device.
              </div>
            </div>
            <button
              onClick={start}
              className="btn btn-active"
              style={{ padding: '10px 24px', fontSize: '0.82rem', gap: '8px' }}
            >
              <Camera size={15} /> Enable Camera
            </button>
          </div>
        )}

        {/* Loading state */}
        {status === 'loading' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '14px',
          }}>
            <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Loading hand tracking model…
            </span>
          </div>
        )}

        {/* Denied state */}
        {status === 'denied' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '24px', textAlign: 'center',
          }}>
            <CameraOff size={32} style={{ color: '#ff6b6b' }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: '#ff6b6b' }}>Camera Access Denied</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Allow camera access in your browser settings, then click Retry.
              </div>
            </div>
            <button onClick={start} className="btn" style={{ padding: '8px 20px' }}>Retry</button>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '24px', textAlign: 'center',
          }}>
            <span style={{ fontSize: '0.88rem', color: '#ff6b6b' }}>Something went wrong</span>
            <button onClick={start} className="btn" style={{ padding: '8px 20px' }}>Retry</button>
          </div>
        )}

        {/* Live status badge */}
        {status === 'active' && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            padding: '4px 10px', borderRadius: '20px',
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(232,164,90,0.3)',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: handsDetected > 0 ? '#4caf50' : '#ff6b6b',
            }} />
            {handsDetected > 0 ? `${handsDetected} HAND${handsDetected > 1 ? 'S' : ''} TRACKED` : 'NO HANDS'}
          </div>
        )}
      </div>

      {/* Tips footer */}
      {status === 'active' && (
        <div style={{
          padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', gap: '16px', flexShrink: 0, flexWrap: 'wrap',
        }}>
          {[
            ['↔ wrist X', 'Base rotate'],
            ['☝ hand up', 'Arm raises'],
            ['👇 hand down', 'Arm reaches floor'],
            ['↕ hand tilt', 'Elbow fine-tune'],
            ['👌 pinch', 'Grip'],
          ].map(([key, val]) => (
            <div key={key} style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{key}</span> → {val}
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
