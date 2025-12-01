'use client';

import { useState, useEffect, useRef, ReactNode, memo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { View3D } from './SharedCanvas';

// Shared lighting config
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

interface LazyView3DProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  rootMargin?: string;
  threshold?: number;
  inModal?: boolean;
}

function LazyView3DComponent({ 
  children, 
  className, 
  style, 
  onClick,
  rootMargin = '50px',
  threshold = 0.1,
  inModal = false
}: LazyView3DProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    
    if (rect.top < window.innerHeight && rect.bottom > 0 &&
        rect.left < window.innerWidth && rect.right > 0) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  // For modal context, use inline Canvas (renders above modal backdrop)
  if (inModal) {
    return (
      <div ref={ref} className={className} style={style} onClick={onClick}>
        {isVisible && (
          <Canvas
            style={{ width: '100%', height: '100%' }}
            gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
            flat
          >
            <SharedLighting />
            <Suspense fallback={null}>
              {children}
            </Suspense>
          </Canvas>
        )}
      </div>
    );
  }

  // For normal context, use shared View3D (global canvas at z-10)
  return (
    <div ref={ref} className={className} style={style} onClick={onClick}>
      {isVisible ? (
        <View3D className="w-full h-full">
          {children}
        </View3D>
      ) : (
        <div style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  );
}

export const LazyView3D = memo(LazyView3DComponent);