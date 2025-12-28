'use client';

import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameState } from '@/contexts/GameStateContext';
import { useParticleSpawn } from '@/contexts/ParticleSpawnContext';
import { PROPERTIES } from '@/utils/constants';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ============================================================
// CONSTANTS
// ============================================================

const MAX_BILLS = 18;
const MAX_DIAMONDS = 12;
const PARTICLE_SPEED = 0.6;

// Board dimensions
const cornerSize = 1.0;
const tileLong = 0.82;
const tileShort = 1.0;
const boardWidth = cornerSize * 2 + tileLong * 6;
const boardHeight = cornerSize * 2 + tileLong * 5;
const halfW = boardWidth / 2;
const halfH = boardHeight / 2;

const BANK_TARGET = new THREE.Vector3(0, 1.95, 0);

// ============================================================
// TYPES
// ============================================================

interface ParticleData {
  active: boolean;
  startPos: THREE.Vector3;
  controlPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  progress: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  incomeValue: number;
}

interface PropertyIncomeData {
  propertyId: number;
  position: THREE.Vector3;
  income: number;
  tier: { symbol: 'bill' | 'diamond'; intervalMs: number };
}

// ============================================================
// GEOMETRY BUILDERS
// ============================================================

/**
 * Creates complete bill stack - exactly like the debug bill that works
 */
function createBillGeometry(): THREE.BufferGeometry {
  const scale = 0.12;
  const geometries: THREE.BufferGeometry[] = [];
  
  // Create the exact same structure as debug bill
  const offsets = Array.from({ length: 4 }, () => ({
    x: (Math.random() - 0.5) * 0.02 * scale,
    z: (Math.random() - 0.5) * 0.02 * scale,
  }));

  // Green bills
  offsets.forEach((offset, i) => {
    const billGeo = new THREE.BoxGeometry(1.4 * scale, 0.05 * scale, 0.7 * scale);
    billGeo.translate(offset.x, i * 0.03 * scale, offset.z);
    geometries.push(billGeo);
  });

  // Gold symbol on top
  const dollarGeo = new THREE.BoxGeometry(0.3 * scale, 0.03 * scale, 0.5 * scale);
  dollarGeo.translate(0, 4 * 0.03 * scale + 0.02 * scale, 0);
  geometries.push(dollarGeo);
  
  const merged = mergeBufferGeometries(geometries);
  merged.center();
  
  geometries.forEach(g => g.dispose());
  
  return merged;
}

/**
 * Creates merged geometry for Diamond V2 (Brilliant Cut)
 */
function createDiamondGeometry(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];
  const scale = 0.15; // Increased for bigger diamonds
  
  const crownHeight = 0.25 * scale;
  const tableRadius = 0.25 * scale;
  const crownRadius = 0.5 * scale;
  const pavilionHeight = 0.6 * scale;
  
  const tableGeo = new THREE.CylinderGeometry(tableRadius, tableRadius, 0.02 * scale, 8);
  tableGeo.translate(0, crownHeight, 0);
  geometries.push(tableGeo);
  
  const crownGeo = new THREE.CylinderGeometry(tableRadius, crownRadius, crownHeight, 8);
  crownGeo.translate(0, crownHeight / 2, 0);
  geometries.push(crownGeo);
  
  const girdleGeo = new THREE.CylinderGeometry(crownRadius, crownRadius, 0.05 * scale, 8);
  girdleGeo.translate(0, 0, 0);
  geometries.push(girdleGeo);
  
  const pavilionGeo = new THREE.ConeGeometry(crownRadius, pavilionHeight, 8);
  pavilionGeo.rotateX(Math.PI);
  pavilionGeo.translate(0, -pavilionHeight / 2, 0);
  geometries.push(pavilionGeo);
  
  const merged = mergeBufferGeometries(geometries);
  merged.center();
  
  geometries.forEach(g => g.dispose());
  
  return merged;
}

/**
 * Safe geometry merge utility using Three.js official implementation
 */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // Ensure all geometries have normals computed before merging
  geometries.forEach(geo => {
    if (!geo.attributes['normal']) {
      geo.computeVertexNormals();
    }
  });
  
  const merged = mergeGeometries(geometries, false);
  if (!merged) {
    return new THREE.BufferGeometry();
  }
  return merged;
}

// ============================================================
// CUSTOM SHADER MATERIALS
// ============================================================

/**
 * Creates a texture atlas with green bills and gold symbol
 */
function createBillAtlas(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  
  // Left half: Medium green bill texture (0.0 - 0.5 UV)
  ctx.fillStyle = '#1ca049'; // Medium green (between bright and dark)
  ctx.fillRect(0, 0, 128, 128);
  
  // Add some texture to the green part
  ctx.fillStyle = '#15803d'; // Dark green for accents
  ctx.fillRect(10, 10, 108, 20);
  ctx.fillRect(10, 40, 108, 20);
  ctx.fillRect(10, 70, 108, 20);
  ctx.fillRect(10, 100, 108, 20);
  
  // Right half: Gold symbol texture (0.5 - 1.0 UV)
  ctx.fillStyle = '#FFBd32'; // Gold
  ctx.fillRect(128, 0, 128, 128);
  
  // Draw $ symbol
  ctx.fillStyle = '#D4A020'; // Darker gold for contrast
  ctx.font = '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('$', 192, 80);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createBillMaterial(): THREE.ShaderMaterial {
  const billAtlas = createBillAtlas();
  
  return new THREE.ShaderMaterial({
    uniforms: {
      uBillAtlas: { value: billAtlas },
      uEmissiveIntensity: { value: 0.2 },
    },
    vertexShader: `
      attribute float instanceOpacity;
      varying float vOpacity;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vLocalPosition;
      
      void main() {
        vOpacity = instanceOpacity;
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uBillAtlas;
      uniform float uEmissiveIntensity;
      varying float vOpacity;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vLocalPosition;
      
      void main() {
        vec3 light = normalize(vec3(1.0, 2.0, 1.0));
        float diff = max(dot(vNormal, light), 0.0) * 0.6 + 0.4;
        
        // Map UV coordinates to atlas regions
        vec2 atlasUV = vUv;
        
        bool isGoldSymbol = vLocalPosition.y > 0.01;
        
        if (isGoldSymbol) {
          // Use right half of texture (gold region: 0.5-1.0)
          atlasUV.x = vUv.x * 0.5 + 0.5;
        } else {
          // Use left half of texture (green region: 0.0-0.5)
          atlasUV.x = vUv.x * 0.5;
        }
        
        vec4 textureColor = texture2D(uBillAtlas, atlasUV);
        vec3 finalColor = textureColor.rgb * diff;
        
        // Add slight emissive glow
        finalColor += textureColor.rgb * uEmissiveIntensity;
        
        gl_FragColor = vec4(finalColor, vOpacity);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

function createDiamondMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x60a5fa) },
      uEmissive: { value: new THREE.Color(0x3b82f6) },
      uEmissiveIntensity: { value: 0.4 },
    },
    vertexShader: `
      attribute float instanceOpacity;
      varying float vOpacity;
      varying vec3 vNormal;
      
      void main() {
        vOpacity = instanceOpacity;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uEmissive;
      uniform float uEmissiveIntensity;
      varying float vOpacity;
      varying vec3 vNormal;
      
      void main() {
        vec3 light = normalize(vec3(1.0, 2.0, 1.0));
        float diff = max(dot(vNormal, light), 0.0) * 0.5 + 0.5;
        
        vec3 color = uColor * diff + uEmissive * uEmissiveIntensity;
        gl_FragColor = vec4(color, vOpacity);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function getPropertyPosition(propertyId: number): THREE.Vector3 | null {
  const tileY = 0.5;
  
  if (propertyId >= 0 && propertyId <= 5) {
    const bottomRowIds = [5, 4, 3, 2, 1, 0];
    const i = bottomRowIds.indexOf(propertyId);
    if (i === -1) return null;
    const x = -halfW + cornerSize + tileLong/2 + i * tileLong;
    const z = halfH - tileShort/2;
    return new THREE.Vector3(x, tileY, z);
  }
  
  if (propertyId >= 6 && propertyId <= 10) {
    const leftColIds = [10, 9, 8, 7, 6];
    const i = leftColIds.indexOf(propertyId);
    if (i === -1) return null;
    const x = -halfW + tileShort/2;
    const z = -halfH + cornerSize + tileLong/2 + i * tileLong;
    return new THREE.Vector3(x, tileY, z);
  }
  
  if (propertyId >= 11 && propertyId <= 16) {
    const topRowIds = [11, 12, 13, 14, 15, 16];
    const i = topRowIds.indexOf(propertyId);
    if (i === -1) return null;
    const x = -halfW + cornerSize + tileLong/2 + i * tileLong;
    const z = -halfH + tileShort/2;
    return new THREE.Vector3(x, tileY, z);
  }
  
  if (propertyId >= 17 && propertyId <= 21) {
    const rightColIds = [17, 18, 19, 20, 21];
    const i = rightColIds.indexOf(propertyId);
    if (i === -1) return null;
    const x = halfW - tileShort/2;
    const z = -halfH + cornerSize + tileLong/2 + i * tileLong;
    return new THREE.Vector3(x, tileY, z);
  }
  
  return null;
}

function getIncomeTier(income: number) {
  if (income < 500)    return { symbol: 'bill' as const,    intervalMs: 1250 };
  if (income < 2000)   return { symbol: 'bill' as const,    intervalMs: 1000 };
  if (income < 5000)   return { symbol: 'bill' as const,    intervalMs: 750 };
  if (income < 10000)  return { symbol: 'bill' as const,    intervalMs: 500 };
  if (income < 20000)  return { symbol: 'bill' as const,    intervalMs: 250 };
  if (income < 50000)  return { symbol: 'diamond' as const, intervalMs: 1000 };
  if (income < 100000) return { symbol: 'diamond' as const, intervalMs: 750 };
  if (income < 150000) return { symbol: 'diamond' as const, intervalMs: 500 };
  return                      { symbol: 'diamond' as const, intervalMs: 250 };
}

function quadraticBezier(start: THREE.Vector3, control: THREE.Vector3, end: THREE.Vector3, t: number): THREE.Vector3 {
  return new THREE.Vector3(
    (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * control.x + t * t * end.x,
    (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * control.y + t * t * end.y,
    (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * control.z + t * t * end.z
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

interface IncomeFlow3DProps {
  enabled?: boolean;
  particlesVisible?: boolean;
  onParticleArrive?: (incomeValue: number) => void;
  showcaseMode?: boolean;
  showcaseOwnerships?: Array<{propertyId: number; slotsOwned: number; owner: string}>;
}

export function IncomeFlow3D({ enabled = true, particlesVisible = true, onParticleArrive, showcaseMode = false, showcaseOwnerships }: IncomeFlow3DProps) {
  const { ownerships: gameOwnerships } = useGameState();
  const { triggerSpawn } = useParticleSpawn();
  
  // Use showcase ownerships or real game ownerships
  const ownerships = showcaseMode ? (showcaseOwnerships || []) : gameOwnerships;
  
  // Refs for instanced meshes
  const billMeshRef = useRef<THREE.InstancedMesh>(null);
  const diamondMeshRef = useRef<THREE.InstancedMesh>(null);
  
  // Logo texture removed - no longer needed for bills
  
  // Particle data pools
  const billDataRef = useRef<ParticleData[]>([]);
  const diamondDataRef = useRef<ParticleData[]>([]);
  
  // Spawn timers
  const spawnTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  
  // Bank counter timers
  const bankTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  
  // Temp objects for matrix calculations
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);
  const tempEuler = useMemo(() => new THREE.Euler(), []);

  // Create geometries and materials
  const billGeometry = useMemo(() => createBillGeometry(), []);
  const diamondGeometry = useMemo(() => createDiamondGeometry(), []);
  const billMaterial = useMemo(() => createBillMaterial(), []);
  const diamondMaterial = useMemo(() => createDiamondMaterial(), []);
  
  // Bill material doesn't need texture updates

  // Initialize particle pools
  useEffect(() => {
    billDataRef.current = Array.from({ length: MAX_BILLS }, () => ({
      active: false,
      startPos: new THREE.Vector3(),
      controlPos: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      progress: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      rotSpeedX: 0,
      rotSpeedY: 0,
      rotSpeedZ: 0,
      incomeValue: 0,
    }));
    
    diamondDataRef.current = Array.from({ length: MAX_DIAMONDS }, () => ({
      active: false,
      startPos: new THREE.Vector3(),
      controlPos: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      progress: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      rotSpeedX: 0,
      rotSpeedY: 0,
      rotSpeedZ: 0,
      incomeValue: 0,
    }));
  }, []);

  // Initialize opacity attributes
  useEffect(() => {
    if (billMeshRef.current && !billMeshRef.current.geometry.getAttribute('instanceOpacity')) {
      const opacities = new Float32Array(MAX_BILLS).fill(0);
      billMeshRef.current.geometry.setAttribute('instanceOpacity', new THREE.InstancedBufferAttribute(opacities, 1));
    }
    if (diamondMeshRef.current && !diamondMeshRef.current.geometry.getAttribute('instanceOpacity')) {
      const opacities = new Float32Array(MAX_DIAMONDS).fill(0);
      diamondMeshRef.current.geometry.setAttribute('instanceOpacity', new THREE.InstancedBufferAttribute(opacities, 1));
    }
  });

  // Calculate owned properties
  const ownedProperties = useMemo((): PropertyIncomeData[] => {
    return ownerships
      .filter(o => o.slotsOwned > 0)
      .map(o => {
        const property = PROPERTIES.find(p => p.id === o.propertyId);
        if (!property) return null;
        
        const position = getPropertyPosition(o.propertyId);
        if (!position) return null;
        
        const income = Math.floor((property.price * property.yieldBps) / 10000) * o.slotsOwned;
        const tier = getIncomeTier(income);
        
        return { propertyId: o.propertyId, position, income, tier };
      })
      .filter((p): p is PropertyIncomeData => p !== null);
  }, [ownerships]);

  // Spawn a particle
  const spawnParticle = useCallback((propData: PropertyIncomeData, intervalUsed: number) => {
    const isBill = propData.tier.symbol === 'bill';
    const dataPool = isBill ? billDataRef.current : diamondDataRef.current;
    
    const slot = dataPool.findIndex(p => !p.active);
    if (slot === -1) return;
    
    const particle = dataPool[slot]!;
    particle.active = true;
    particle.startPos.copy(propData.position);
    particle.targetPos.copy(BANK_TARGET);
    particle.progress = 0;
    
    particle.incomeValue = (propData.income / 86400) * (intervalUsed / 1000);
    
    const midX = (propData.position.x + BANK_TARGET.x) / 2 + (Math.random() - 0.5) * 2;
    const midZ = (propData.position.z + BANK_TARGET.z) / 2 + (Math.random() - 0.5) * 2;
    particle.controlPos.set(midX, 2.0 + Math.random() * 1.0, midZ);
    
    particle.rotationX = Math.random() * Math.PI * 2;
    particle.rotationY = Math.random() * Math.PI * 2;
    particle.rotationZ = Math.random() * Math.PI * 2;
    particle.rotSpeedX = (Math.random() - 0.5) * 3;
    particle.rotSpeedY = (Math.random() - 0.5) * 4;
    particle.rotSpeedZ = (Math.random() - 0.5) * 2;
  }, []);

  // Bank counter timer
  const scheduleBankUpdate = useCallback((propData: PropertyIncomeData) => {
    if (!enabled) return;
    
    const interval = propData.tier.intervalMs * (0.8 + Math.random() * 0.4);
    const incomeValue = (propData.income / 86400) * (interval / 1000);
    
    const timer = setTimeout(() => {
      onParticleArrive?.(incomeValue);
      scheduleBankUpdate(propData);
    }, interval);
    
    bankTimersRef.current.set(propData.propertyId, timer);
  }, [enabled, onParticleArrive]);

  // Spawn timer management (works for both normal and showcase mode)
  useEffect(() => {
    if (!enabled || !particlesVisible) {
      spawnTimersRef.current.forEach(timer => clearTimeout(timer));
      spawnTimersRef.current.clear();
      return;
    }
    
    spawnTimersRef.current.forEach(timer => clearTimeout(timer));
    spawnTimersRef.current.clear();
    
    let isActive = true;
    
    const scheduleSpawn = (propData: PropertyIncomeData) => {
      if (!isActive) return;
      
      // In showcase mode, make spawns more frequent and random
      const baseInterval = showcaseMode ? 
        propData.tier.intervalMs * 0.3 : // Much faster in showcase
        propData.tier.intervalMs;
      
      const interval = baseInterval * (0.8 + Math.random() * 0.4);
      const timer = setTimeout(() => {
        if (!isActive) return;
        spawnParticle(propData, interval);
        
        // In showcase mode, don't trigger real spawn context
        if (!showcaseMode) {
          triggerSpawn(propData.propertyId);
        }
        
        scheduleSpawn(propData);
      }, interval);
      
      spawnTimersRef.current.set(propData.propertyId, timer);
    };
    
    ownedProperties.forEach((propData, index) => {
      const initialDelay = index * 100 + Math.random() * propData.tier.intervalMs * 0.3;
      const timer = setTimeout(() => {
        if (!isActive) return;
        spawnParticle(propData, initialDelay);
        scheduleSpawn(propData);
      }, initialDelay);
      spawnTimersRef.current.set(propData.propertyId, timer);
    });
    
    return () => {
      isActive = false;
      spawnTimersRef.current.forEach(timer => clearTimeout(timer));
      spawnTimersRef.current.clear();
    };
  }, [enabled, ownedProperties, spawnParticle, particlesVisible, showcaseMode, triggerSpawn]);

  // Bank counter timer management
  useEffect(() => {
    if (!enabled) {
      bankTimersRef.current.forEach(timer => clearTimeout(timer));
      bankTimersRef.current.clear();
      return;
    }
    
    bankTimersRef.current.forEach(timer => clearTimeout(timer));
    bankTimersRef.current.clear();
    
    if (!particlesVisible) {
      ownedProperties.forEach((propData, index) => {
        const initialDelay = index * 100 + Math.random() * propData.tier.intervalMs * 0.3;
        setTimeout(() => {
          scheduleBankUpdate(propData);
        }, initialDelay);
      });
    }
    
    return () => {
      bankTimersRef.current.forEach(timer => clearTimeout(timer));
      bankTimersRef.current.clear();
    };
  }, [enabled, ownedProperties, scheduleBankUpdate, particlesVisible]);

  // Animation loop
  useFrame((state, delta) => {
    if (!enabled || !particlesVisible) return;
    
    const billMesh = billMeshRef.current;
    const diamondMesh = diamondMeshRef.current;
    if (!billMesh || !diamondMesh) return;
    
    const billOpacities = billMesh.geometry.getAttribute('instanceOpacity') as THREE.InstancedBufferAttribute;
    const diamondOpacities = diamondMesh.geometry.getAttribute('instanceOpacity') as THREE.InstancedBufferAttribute;
    
    if (!billOpacities || !diamondOpacities) return;
    
    // Track if we have active particles
    let hasActiveBills = false;
    let hasActiveDiamonds = false;
    
    // Update bills
    billDataRef.current.forEach((particle, i) => {
      if (!particle.active) {
        billOpacities.setX(i, 0);
        return;
      }
      
      hasActiveBills = true;
      particle.progress += delta * PARTICLE_SPEED;
      
      if (particle.progress >= 1) {
        particle.active = false;
        billOpacities.setX(i, 0);
        onParticleArrive?.(particle.incomeValue);
        return;
      }
      
      const pos = quadraticBezier(particle.startPos, particle.controlPos, particle.targetPos, particle.progress);
      tempPosition.copy(pos);
      
      particle.rotationX += particle.rotSpeedX * delta;
      particle.rotationY += particle.rotSpeedY * delta;
      particle.rotationZ += particle.rotSpeedZ * delta;
      tempEuler.set(particle.rotationX, particle.rotationY, particle.rotationZ);
      tempQuaternion.setFromEuler(tempEuler);
      
      const scale = 1 - particle.progress * 0.4;
      tempScale.setScalar(scale);
      
      const fadeIn = Math.min(1, particle.progress * 5);
      const fadeOut = 1 - Math.max(0, (particle.progress - 0.8) / 0.2);
      billOpacities.setX(i, fadeIn * fadeOut);
      
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      billMesh.setMatrixAt(i, tempMatrix);
    });
    
    // Only update if there are active bills
    if (hasActiveBills) {
      billMesh.instanceMatrix.needsUpdate = true;
      billOpacities.needsUpdate = true;
    }
    
    // Update diamonds
    diamondDataRef.current.forEach((particle, i) => {
      if (!particle.active) {
        diamondOpacities.setX(i, 0);
        return;
      }
      
      hasActiveDiamonds = true;
      particle.progress += delta * PARTICLE_SPEED;
      
      if (particle.progress >= 1) {
        particle.active = false;
        diamondOpacities.setX(i, 0);
        onParticleArrive?.(particle.incomeValue);
        return;
      }
      
      const pos = quadraticBezier(particle.startPos, particle.controlPos, particle.targetPos, particle.progress);
      tempPosition.copy(pos);
      
      particle.rotationX += particle.rotSpeedX * delta;
      particle.rotationY += particle.rotSpeedY * delta;
      tempEuler.set(particle.rotationX, particle.rotationY, 0);
      tempQuaternion.setFromEuler(tempEuler);
      
      const scale = 1 - particle.progress * 0.4;
      tempScale.setScalar(scale);
      
      const fadeIn = Math.min(1, particle.progress * 5);
      const fadeOut = 1 - Math.max(0, (particle.progress - 0.8) / 0.2);
      diamondOpacities.setX(i, fadeIn * fadeOut);
      
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      diamondMesh.setMatrixAt(i, tempMatrix);
    });
    
    // Only update if there are active diamonds
    if (hasActiveDiamonds) {
      diamondMesh.instanceMatrix.needsUpdate = true;
      diamondOpacities.needsUpdate = true;
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      billGeometry.dispose();
      diamondGeometry.dispose();
      billMaterial.dispose();
      diamondMaterial.dispose();
    };
  }, [billGeometry, diamondGeometry, billMaterial, diamondMaterial]);

  return (
    <group>
      {(!enabled || ownedProperties.length === 0 || !particlesVisible) ? null : (
        <>
          <instancedMesh
            ref={billMeshRef}
            args={[billGeometry, billMaterial, MAX_BILLS]}
            frustumCulled={false}
          />
          <instancedMesh
            ref={diamondMeshRef}
            args={[diamondGeometry, diamondMaterial, MAX_DIAMONDS]}
            frustumCulled={false}
          />
        </>
      )}
    </group>
  );
}