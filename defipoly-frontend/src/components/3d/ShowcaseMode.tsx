'use client';

import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SHOWCASE_SCENES, ShowcaseScene } from '@/utils/showcaseScenes';
import { usePreloadShowcaseTextures } from '@/hooks/useShowcaseTexture';

interface ShowcaseModeProps {
  isActive: boolean;
  onSceneChange: (scene: ShowcaseScene) => void;
  onExit: () => void;
}

export function ShowcaseMode({ isActive, onSceneChange, onExit }: ShowcaseModeProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const sceneStartTimeRef = useRef(0);
  const isActiveRef = useRef(isActive);
  
  // Update ref when prop changes
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);
  
  // Preload all textures
  const presetIds = SHOWCASE_SCENES.map(scene => scene.themePresetId);
  const textures = usePreloadShowcaseTextures(presetIds);
  
  // Reset when showcase starts
  useEffect(() => {
    if (isActive && SHOWCASE_SCENES.length > 0) {
      setCurrentSceneIndex(0);
      setElapsedTime(0);
      sceneStartTimeRef.current = Date.now() + 3000; // Add 3 second delay
      const firstScene = SHOWCASE_SCENES[0];
      if (firstScene) {
        // Start the first scene immediately but delay the timer
        setTimeout(() => {
          onSceneChange(firstScene);
        }, 3000);
      }
    }
  }, [isActive, onSceneChange]);
  
  // Handle scene transitions
  useEffect(() => {
    if (!isActive || SHOWCASE_SCENES.length === 0) return;
    
    const currentScene = SHOWCASE_SCENES[currentSceneIndex];
    if (!currentScene) return;
    
    const timer = setTimeout(() => {
      const nextIndex = (currentSceneIndex + 1) % SHOWCASE_SCENES.length;
      const nextScene = SHOWCASE_SCENES[nextIndex];
      if (nextScene) {
        setCurrentSceneIndex(nextIndex);
        sceneStartTimeRef.current = Date.now();
        onSceneChange(nextScene);
      }
    }, currentScene.duration * 1000);
    
    return () => clearTimeout(timer);
  }, [isActive, currentSceneIndex, onSceneChange]);
  
  if (!isActive) return null;
  
  return null; // Logic component only
}

// Showcase overlay UI component
export function ShowcaseOverlay({ 
  currentScene, 
  onExit 
}: { 
  currentScene: ShowcaseScene; 
  onExit: () => void;
}) {
  const currentIndex = SHOWCASE_SCENES.findIndex(s => s.id === currentScene.id);
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 100,
    }}>
      {/* No exit button - demo will exit automatically or via other controls */}
    </div>
  );
}

// Camera controller for showcase animations with dive-in effect
export function ShowcaseCameraController({ 
  animation, 
  controlsRef,
  connected 
}: { 
  animation: 'orbit' | 'slow-zoom' | 'pan-left' | 'pan-right';
  controlsRef: React.RefObject<any>;
  connected: boolean;
}) {
  const startTimeRef = useRef<number | null>(null);
  
  useFrame(({ camera, clock }) => {
    const time = clock.getElapsedTime();
    
    // Initialize start time
    if (startTimeRef.current === null) {
      startTimeRef.current = time;
    }
    
    const elapsedSinceStart = time - startTimeRef.current;
    
    // For non-connected wallets, do dive-in animation first
    if (!connected && elapsedSinceStart < 2) {
      // Dive-in animation from ZOOMED_OUT to orbit position
      const progress = Math.min(elapsedSinceStart / 2, 1); // 2 second dive-in
      const easeInOut = progress * progress * (3 - 2 * progress); // Smooth easing
      
      // Starting position (ZOOMED_OUT)
      const startPos = { x: 0, y: 18, z: 25 };
      const startLookAt = { x: 0, y: 5, z: 0 };
      
      // Target orbit position
      const targetRadius = 10;
      const targetHeight = 7;
      const targetX = Math.sin(time * 0.15) * targetRadius;
      const targetZ = Math.cos(time * 0.15) * targetRadius;
      
      // Interpolate position
      camera.position.x = startPos.x + (targetX - startPos.x) * easeInOut;
      camera.position.y = startPos.y + (targetHeight - startPos.y) * easeInOut;
      camera.position.z = startPos.z + (targetZ - startPos.z) * easeInOut;
      
      // Interpolate look target - end at y=0 to match rotation mode
      const lookX = startLookAt.x + (0 - startLookAt.x) * easeInOut;
      const lookY = startLookAt.y + (0 - startLookAt.y) * easeInOut;
      const lookZ = startLookAt.z + (0 - startLookAt.z) * easeInOut;
      
      camera.lookAt(lookX, lookY, lookZ);
      
      // Update OrbitControls target to match
      if (controlsRef.current) {
        controlsRef.current.target.set(lookX, lookY, lookZ);
      }
    } else {
      // Normal orbit animation after dive-in or for connected wallets
      const radius = 10;
      const speed = 0.15;
      const height = 7;
      
      camera.position.x = Math.sin(time * speed) * radius;
      camera.position.z = Math.cos(time * speed) * radius;
      camera.position.y = height;
      camera.lookAt(0, 0, 0);  // Look at y=0 to match rotation mode
      
      // Update OrbitControls target to match
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
      }
    }
    
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });
  
  return null;
}