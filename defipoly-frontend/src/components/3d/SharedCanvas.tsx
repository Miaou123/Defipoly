'use client';

import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { ReactNode, useRef, Suspense, memo } from 'react';

function SharedLighting() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 10, 7]} intensity={1.5} />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#ffeedd" />
      <directionalLight position={[0, -5, 5]} intensity={0.3} />
    </>
  );
}

interface SharedCanvasProviderProps {
  children: ReactNode;
}

interface View3DProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function SharedCanvasProvider({ children }: SharedCanvasProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null!);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {children}
      <Canvas
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,  // Lower than modals (z-50)
        }}
        eventSource={containerRef}
        eventPrefix="client"
        frameloop="always"
        flat
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'default',
        }}
      >
        <View.Port />
      </Canvas>
    </div>
  );
}

function View3DComponent({ 
  children, 
  className, 
  style, 
  onClick 
}: View3DProps) {
  const trackRef = useRef<HTMLDivElement>(null!);

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

export const View3D = memo(View3DComponent);