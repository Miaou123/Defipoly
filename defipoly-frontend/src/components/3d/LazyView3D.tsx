'use client';

import { useState, useEffect, useRef, ReactNode, memo } from 'react';
import { View3D } from './SharedCanvas';

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

    // For modals, immediately set as visible since they're always in the viewport
    if (inModal) {
      setIsVisible(true);
      return;
    }

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
  }, [rootMargin, threshold, inModal]);

  // For modal context, also use shared View3D system
  if (inModal) {
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