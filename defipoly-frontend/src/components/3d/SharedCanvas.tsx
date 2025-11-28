'use client';

import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { ReactNode, useRef, Suspense, memo, useMemo } from 'react';
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

  const canvasElement = useMemo(() => (
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
  ), []);

  return (
    <>
      <div ref={ref} style={{ position: 'relative', width: '100%', height: '100%' }}>
        {children}
      </div>
      {canvasElement}
    </>
  );
}

// Wrapper component for individual 3D objects
interface View3DProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

// Define the component first
function View3DComponent({ 
  children, 
  className, 
  style, 
  onClick 
}: View3DProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={trackRef} 
      className={className} 
      style={{ ...style, position: 'relative' }} 
      onClick={onClick}
    >
      <View 
        track={trackRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <SharedLighting />
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </View>
    </div>
  );
}

// Export the memoized version
export const View3D = memo(View3DComponent);