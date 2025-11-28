'use client';

import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { ReactNode, useRef, Suspense } from 'react';
import * as THREE from 'three';

// Shared scene components that will be used across all views
function SharedLighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 7]} intensity={1.0} />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#ffeedd" />
    </>
  );
}

interface SharedCanvasProviderProps {
  children: ReactNode;
}

// This component provides the single WebGL canvas that all 3D objects will share
export function SharedCanvasProvider({ children }: SharedCanvasProviderProps) {
  const ref = useRef<HTMLDivElement>(null);

  console.log('🖼️ SharedCanvasProvider render');

  return (
    <>
      {/* All 3D view containers go here */}
      <div ref={ref} style={{ position: 'relative', width: '100%', height: '100%' }}>
        {children}
      </div>
      
      {/* Single WebGL canvas that renders all views */}
      <Canvas
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 50,
        }}
        eventSource={ref}
        eventPrefix="client"
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          alpha: true,
        }}
      >
        <View.Port />
      </Canvas>
    </>
  );
}

// Wrapper component for individual 3D objects
interface View3DProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function View3D({ children, className, style, onClick }: View3DProps & { onClick?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const renderCount = useRef(0);
  
  renderCount.current++;
  if (renderCount.current > 5) {
    console.log(`🔄 View3D render #${renderCount.current} - INFINITE LOOP DETECTED!`);
  }
  
  return (
    <div ref={ref} className={className} style={style} onClick={onClick}>
      Simple div - no 3D
    </div>
  );
}