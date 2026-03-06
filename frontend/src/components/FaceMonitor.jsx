import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

export default function FaceMonitor() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stats, setStats] = useState({ fear: 0, happiness: 0 });
  const [debugLog, setDebugLog] = useState("Initializing...");

  useEffect(() => {
    const run = async () => {
      try {
        setDebugLog("Loading AI Models...");
        const MODEL_URL = '/models';

        await Promise.all([
          faceapi.loadTinyFaceDetectorModel(MODEL_URL),
          faceapi.loadFaceLandmarkModel(MODEL_URL),
          faceapi.loadFaceExpressionModel(MODEL_URL)
        ]);

        setDebugLog("Models Loaded. Starting Camera...");

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

      } catch (err) {
        setDebugLog(`Error: ${err.message}`);
        console.error(err);
      }
    };

    run();
  }, []);

  const handleVideoPlay = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setDebugLog("System Active");

    const displaySize = { width: 640, height: 480 };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      try {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        ).withFaceLandmarks().withFaceExpressions();

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections.length > 0) {
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          // 👇👇 FINE TUNED CYBERPUNK STYLE 👇👇
          const drawOptions = {
            drawLines: true,
            drawPoints: true,      
            lineWidth: 1,          // Super thin precision lines
            lineColor: 'rgba(0, 255, 255, 0.8)', // 🔵 Cyan Lines (Transparentish)
            pointColor: '#bd00ff'  // 🟣 Purple Dots
          };

          const drawBox = new faceapi.draw.DrawFaceLandmarks(
            resizedDetections[0].landmarks, 
            drawOptions
          );
          drawBox.draw(canvas);

          // HIGH SENSITIVITY FEAR LOGIC
          const expr = detections[0].expressions;
          const happy = Math.round(expr.happy * 100);
          let rawFear = expr.fearful + expr.surprised; 
          let boostedFear = rawFear * 3.5; 
          const fear = Math.round(Math.min(100, boostedFear * 100));
          
          setStats({ fear, happiness: happy });
          
          if (Math.random() > 0.95) setDebugLog("Tracking Subject...");
        } else {
          setDebugLog("Searching...");
        }
      } catch (err) {
        // Silent catch
      }
    }, 100);
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '640px', 
      height: '480px', 
      margin: '0 auto',
      background: '#000',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #333',
      // Cyan/Purple Glow
      boxShadow: '0 0 20px rgba(0, 255, 255, 0.15)' 
    }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onPlay={handleVideoPlay}
        width="640"
        height="480"
        style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover', opacity: 0.9 }} 
      />

      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
      />

      {/* STATUS TAG */}
      <div style={{
        position: 'absolute', top: '15px', right: '15px',
        background: 'rgba(0, 20, 30, 0.8)', color: '#00ffff',
        padding: '4px 8px', borderRadius: '4px', fontSize: '10px', 
        zIndex: 20, letterSpacing: '1px',
        border: '1px solid rgba(0, 255, 255, 0.3)',
        fontFamily: '"Courier New", Courier, monospace'
      }}>
        ● {debugLog.toUpperCase()}
      </div>

      {/* STATS OVERLAY (Cyan & Purple Text) */}
      <div style={{
        position: 'absolute', bottom: '20px', width: '100%',
        textAlign: 'center', zIndex: 20
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '10px 20px',
          borderRadius: '30px',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          backdropFilter: 'blur(4px)'
        }}>
          <span style={{ 
            color: '#00ffff', fontSize: '18px', fontFamily: 'monospace', fontWeight: 'bold', marginRight: '20px' 
          }}>
            FEAR: <span style={{ color: '#fff' }}>{stats.fear}%</span>
          </span>
          <span style={{ 
            color: '#bd00ff', fontSize: '18px', fontFamily: 'monospace', fontWeight: 'bold' 
          }}>
            HAPPY: <span style={{ color: '#fff' }}>{stats.happiness}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}