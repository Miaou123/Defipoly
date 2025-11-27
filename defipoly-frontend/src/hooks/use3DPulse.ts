import { useEffect } from 'react';

export interface PulseRef {
  targetScale: number;
  currentScale: number;
}

/**
 * Common hook for managing 3D component pulsing animation
 * @param sceneRef - Reference to the 3D scene object containing targetScale and currentScale
 * @param isPulsing - Whether the component should pulse
 * @param pulseScale - The scale to pulse to (default: 1.15)
 * @param duration - Duration of the pulse in ms (default: 150)
 */
export function use3DPulse(
  sceneRef: React.MutableRefObject<PulseRef | null>,
  isPulsing: boolean,
  pulseScale: number = 1.15,
  duration: number = 150
) {
  useEffect(() => {
    if (sceneRef.current) {
      if (isPulsing) {
        sceneRef.current.targetScale = pulseScale;
        const timeout = setTimeout(() => {
          if (sceneRef.current) sceneRef.current.targetScale = 1;
        }, duration);
        return () => clearTimeout(timeout);
      } else {
        sceneRef.current.targetScale = 1;
      }
    }
  }, [isPulsing, pulseScale, duration]);
}

/**
 * Animation function to smoothly interpolate scale changes
 * Call this in your animation loop
 */
export function updatePulseScale(sceneRef: PulseRef, group: THREE.Group): void {
  const newScale = sceneRef.currentScale + (sceneRef.targetScale - sceneRef.currentScale) * 0.15;
  sceneRef.currentScale = newScale;
  group.scale.setScalar(newScale);
}