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
  const [isVisible, setIsVisible] = useState(true); // TEMP: Force visible for debugging
  const ref = useRef<HTMLDivElement>(null);
  const renderCount = useRef(0);
  
  renderCount.current++;
  if (renderCount.current > 5) {
    console.log(`🔄 LazyView3D render #${renderCount.current} - CALLING View3D!`);
  }


  useEffect(() => {
    console.log('🔍 LazyView3D useEffect running');
    const element = ref.current;
    if (!element) {
      console.log('❌ LazyView3D: No element ref');
      return;
    }

    console.log('✅ LazyView3D: Element found, setting up observer');

    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log('👀 LazyView3D intersection:', entry.isIntersecting);
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { 
        rootMargin,
        threshold 
      }
    );

    observer.observe(element);

    // Check if element is already visible on mount (fallback for immediately visible elements)
    const checkIfVisible = () => {
      const rect = element.getBoundingClientRect();
      const isInViewport = rect.top >= 0 && rect.left >= 0 && 
                          rect.bottom <= window.innerHeight && 
                          rect.right <= window.innerWidth;
      console.log('📏 LazyView3D viewport check:', { rect, isInViewport });
      if (isInViewport) {
        console.log('✅ LazyView3D: Setting visible=true from viewport check');
        setIsVisible(true);
        observer.unobserve(element);
      }
    };

    // Check immediately after mount
    checkIfVisible();

    return () => observer.disconnect();
  }, [rootMargin, threshold]);


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