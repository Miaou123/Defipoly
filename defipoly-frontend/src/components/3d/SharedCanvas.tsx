'use client';

import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { ReactNode, useRef, Suspense, memo } from 'react';
import { GeometryCacheProvider } from './GeometryCache';

function SharedLighting() {
  return (
    <>
      {/* Ambient light - overall illumination */}
      <ambientLight intensity={0.8} />
      
      {/* Main directional lights - key lighting */}
      <directionalLight position={[5, 10, 7]} intensity={2.0} />
      <directionalLight position={[-5, 5, -5]} intensity={0.8} color="#ffeedd" />
      <directionalLight position={[0, -5, 5]} intensity={0.6} />
      
      {/* Additional directional lights for more coverage */}
      <directionalLight position={[10, 2, 0]} intensity={0.4} color="#ffffff" />
      <directionalLight position={[-10, 2, 0]} intensity={0.4} color="#ffffff" />
      
      {/* Point lights for focused illumination */}
      <pointLight position={[0, 8, 0]} intensity={0.8} distance={20} decay={2} />
      <pointLight position={[8, 6, 8]} intensity={0.5} distance={15} decay={2} color="#f0f8ff" />
      <pointLight position={[-8, 6, -8]} intensity={0.5} distance={15} decay={2} color="#fff5ee" />
      
      {/* Hemisphere light for natural lighting */}
      <hemisphereLight 
        color="#ffffff" 
        groundColor="#444444" 
        intensity={0.6} 
      />
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
          zIndex: 9999,  // Above modals to show 3D content
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
        <GeometryCacheProvider>
          <View.Port />
        </GeometryCacheProvider>
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