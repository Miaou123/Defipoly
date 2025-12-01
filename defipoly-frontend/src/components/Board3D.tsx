'use client';

import { ReactNode, useState, useRef, useCallback } from 'react';

interface Board3DProps {
  children: ReactNode;
}

interface RotationState {
  x: number;
  z: number;
}

interface TouchState {
  touch1: { x: number; y: number } | null;
  touch2: { x: number; y: number } | null;
  initialDistance: number;
  initialZoom: number;
}

export function Board3D({ children }: Board3DProps) {
  const [rotation, setRotation] = useState<RotationState>({ x: 55, z: -45 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 });
  const [touchState, setTouchState] = useState<TouchState>({
    touch1: null,
    touch2: null,
    initialDistance: 0,
    initialZoom: 1,
  });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Clamp rotation values
  const clampRotation = (rot: RotationState): RotationState => ({
    x: Math.max(20, Math.min(80, rot.x)),
    z: rot.z, // unlimited
  });

  // Clamp zoom values
  const clampZoom = (z: number): number => Math.max(0.5, Math.min(2, z));

  // Reset view to defaults
  const resetView = useCallback(() => {
    setRotation({ x: 55, z: -45 });
    setZoom(1);
  }, []);

  // Pointer down handler
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Skip if clicking on a property card
    if (e.target instanceof Element && e.target.closest('[data-property-id]')) {
      return;
    }

    setIsDragging(true);
    setLastPointer({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, []);

  // Pointer move handler
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastPointer.x;
    const deltaY = e.clientY - lastPointer.y;

    setRotation(prev => clampRotation({
      x: prev.x - deltaY * 0.5, // Invert Y for natural rotation
      z: prev.z - deltaX * 0.5, // Invert X for natural rotation
    }));

    setLastPointer({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, [isDragging, lastPointer]);

  // Pointer up handler
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel handler for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => clampZoom(prev + delta));
  }, []);

  // Touch handlers for pinch zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      setTouchState({
        touch1: { x: touch1.clientX, y: touch1.clientY },
        touch2: { x: touch2.clientX, y: touch2.clientY },
        initialDistance: distance,
        initialZoom: zoom,
      });
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchState.touch1 && touchState.touch2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = distance / touchState.initialDistance;
      const newZoom = touchState.initialZoom * scale;
      setZoom(clampZoom(newZoom));
      e.preventDefault();
    }
  }, [touchState]);

  const handleTouchEnd = useCallback(() => {
    setTouchState({
      touch1: null,
      touch2: null,
      initialDistance: 0,
      initialZoom: 1,
    });
  }, []);

  const boardThickness = 20; // 20px thick board

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a0015 0%, #1a0a2e 50%, #0a0015 100%)',
        perspective: '1500px',
        overflow: 'hidden',
        position: 'relative',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Reset View Button */}
      <button
        onClick={resetView}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: 'none',
          background: 'rgba(139, 92, 246, 0.8)',
          color: 'white',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(139, 92, 246, 1)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.8)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        Reset View
      </button>

      {/* 3D Board Container */}
      <div
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateZ(${rotation.z}deg) scale(${zoom})`,
          cursor: isDragging ? 'grabbing' : 'grab',
          position: 'relative',
        }}
      >
        {/* Main Board Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
          }}
        >
          {children}
        </div>

        {/* Board Thickness - Front Side (Bottom Edge) */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: `${boardThickness}px`,
            background: 'linear-gradient(180deg, #3d2570 0%, #1a0a2e 100%)',
            bottom: 0,
            transform: `translateZ(${-boardThickness/2}px) rotateX(-90deg)`,
            transformOrigin: 'top center',
          }}
        />

        {/* Board Thickness - Back Side (Top Edge) */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: `${boardThickness}px`,
            background: 'linear-gradient(0deg, #3d2570 0%, #1a0a2e 100%)',
            top: 0,
            transform: `translateZ(${-boardThickness/2}px) rotateX(90deg)`,
            transformOrigin: 'bottom center',
          }}
        />

        {/* Board Thickness - Left Side */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            width: `${boardThickness}px`,
            background: 'linear-gradient(90deg, #1a0a2e 0%, #3d2570 100%)',
            left: 0,
            transform: `translateZ(${-boardThickness/2}px) rotateY(90deg)`,
            transformOrigin: 'center right',
          }}
        />

        {/* Board Thickness - Right Side */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            width: `${boardThickness}px`,
            background: 'linear-gradient(-90deg, #1a0a2e 0%, #3d2570 100%)',
            right: 0,
            transform: `translateZ(${-boardThickness/2}px) rotateY(-90deg)`,
            transformOrigin: 'center left',
          }}
        />
      </div>
    </div>
  );
}