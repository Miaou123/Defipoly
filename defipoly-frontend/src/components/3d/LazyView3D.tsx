'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { View3D } from './SharedCanvas';

interface LazyView3DProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  rootMargin?: string; // How early to start loading (e.g., '100px')
  threshold?: number; // What percentage visible to trigger (0.1 = 10%)
}

export function LazyView3D({ 
  children, 
  className, 
  style, 
  onClick,
  rootMargin = '50px',
  threshold = 0.1
}: LazyView3DProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, stop observing
          observer.unobserve(element);
        }
      },
      { 
        rootMargin,
        threshold 
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref} className={className} style={style} onClick={onClick}>
      {isVisible ? (
        <View3D>
          {children}
        </View3D>
      ) : (
        // Placeholder with same dimensions while loading
        <div style={{ width: '120px', height: '120px', backgroundColor: 'transparent' }} />
      )}
    </div>
  );
}