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
}

// Define the component first, then wrap with memo
function LazyView3DComponent({ 
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

    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0 &&
        rect.left < window.innerWidth && rect.right > 0) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

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

// Export the memoized version
export const LazyView3D = memo(LazyView3DComponent);