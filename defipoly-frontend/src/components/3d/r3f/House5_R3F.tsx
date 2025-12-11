'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGeometryCache } from '../GeometryCache';
import { getMaterialsForSet } from '../MaterialRegistry';

interface House5_R3FProps {
  isPulsing?: boolean;
  color?: string;
}

// Convert Tailwind color class to setId mapping (same as property color to setId)
function getSetIdFromColor(colorClass: string): number {
  const colorToSetMap: { [key: string]: number } = {
    'bg-amber-900': 0,   // Brown
    'bg-sky-300': 1,     // Light Blue  
    'bg-pink-400': 2,    // Pink
    'bg-orange-500': 3,  // Orange
    'bg-red-600': 4,     // Red
    'bg-yellow-400': 5,  // Yellow (original)
    'bg-yellow-500': 5,  // Yellow (actual property color)
    'bg-green-600': 6,   // Green
    'bg-blue-900': 7,    // Dark Blue
  };
  
  const result = colorToSetMap[colorClass] ?? 0;
  return result;
}

// Color schemes for each property set
const SET_COLOR_SCHEMES: { [key: number]: { wall: number; roof: number; trim: number; door: number; accent: number } } = {
  0: { wall: 0xE8D4B8, roof: 0x78350f, trim: 0xF5E6D3, door: 0x4A2409, accent: 0x8B4513 }, // Brown
  1: { wall: 0xF0F8FF, roof: 0x4A90A4, trim: 0xFFFFFF, door: 0x2C5F7C, accent: 0x7dd3fc }, // Light Blue
  2: { wall: 0xFFF0F5, roof: 0x9B4D6A, trim: 0xFFE4EC, door: 0x6B2D4A, accent: 0xf472b6 }, // Pink
  3: { wall: 0xFFF5E6, roof: 0xC75B20, trim: 0xFFEDD5, door: 0x8B4513, accent: 0xf97316 }, // Orange
  4: { wall: 0xFFF5F5, roof: 0x8B1A1A, trim: 0xFFE8E8, door: 0x5C1010, accent: 0xdc2626 }, // Red
  5: { wall: 0xFFFDF0, roof: 0xB8960B, trim: 0xFFF8DC, door: 0x6B5B00, accent: 0xfacc15 }, // Yellow
  6: { wall: 0xF5FFF5, roof: 0x2D5A2D, trim: 0xE8F5E8, door: 0x1A3A1A, accent: 0x16a34a }, // Green
  7: { wall: 0xF0F4FF, roof: 0x1e3a8a, trim: 0xE8EEFF, door: 0x0F1D45, accent: 0x3b82f6 }, // Dark Blue
};

export function House5_R3F({ isPulsing = false, color = 'bg-purple-500' }: House5_R3FProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef({ current: 1, target: 1 });

  // Use the merged geometry system
  const { house5 } = useGeometryCache();
  
  // Get colors based on property color (convert to setId first)
  const setId = getSetIdFromColor(color);
  const materials = getMaterialsForSet(setId);
  

  useFrame(() => {
    if (!groupRef.current) return;
    
    scaleRef.current.target = isPulsing ? 1.15 : 1;
    scaleRef.current.current += (scaleRef.current.target - scaleRef.current.current) * 0.15;
    groupRef.current.scale.setScalar(scaleRef.current.current);
  });

  return (
    <group ref={groupRef} position={[0, 0.15, 0]} scale={0.28}>
      <mesh geometry={house5.walls} material={materials.wall} />
      <mesh geometry={house5.roof} material={materials.roof} />
      <mesh geometry={house5.trim} material={materials.trim} />
      <mesh geometry={house5.accents} material={materials.gold} />
    </group>
  );
}