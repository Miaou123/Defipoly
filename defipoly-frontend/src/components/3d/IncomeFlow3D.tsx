'use client';

import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameState } from '@/contexts/GameStateContext';
import { useParticleSpawn } from '@/contexts/ParticleSpawnContext';
import { PROPERTIES } from '@/utils/constants';
import * as THREE from 'three';

// ============================================================
// CONSTANTS
// ============================================================

const MAX_COINS = 60;
const MAX_DIAMONDS = 40;
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
  tier: { symbol: 'coin' | 'diamond'; intervalMs: number };
}

// ============================================================
// GEOMETRY BUILDERS
// ============================================================

/**
 * Creates a thick gold coin geometry
 */
function createCoinGeometry(): THREE.BufferGeometry {
  const scale = 0.25; // Increased from 0.15
  const radius = 0.5 * scale;
  const thickness = 0.2 * scale; // Thicker
  const bevelSize = 0.02 * scale;
  
  const geometries: THREE.BufferGeometry[] = [];
  
  // Main coin body
  const coinGeo = new THREE.CylinderGeometry(radius, radius, thickness, 32);
  geometries.push(coinGeo);
  
  // Top edge bevel
  const topBevelGeo = new THREE.TorusGeometry(radius - bevelSize, bevelSize, 8, 32);
  topBevelGeo.rotateX(Math.PI / 2);
  topBevelGeo.translate(0, thickness / 2, 0);
  geometries.push(topBevelGeo);
  
  // Bottom edge bevel
  const bottomBevelGeo = new THREE.TorusGeometry(radius - bevelSize, bevelSize, 8, 32);
  bottomBevelGeo.rotateX(Math.PI / 2);
  bottomBevelGeo.translate(0, -thickness / 2, 0);
  geometries.push(bottomBevelGeo);
  
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
  const scale = 0.10;
  
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
 * Simple geometry merge utility
 */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalVertices = 0;
  
  geometries.forEach(geo => {
    if (geo.attributes.position) {
      totalVertices += geo.attributes.position.count;
    }
  });
  
  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const indices: number[] = [];
  
  let vertexOffset = 0;
  
  geometries.forEach(geo => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    
    for (let i = 0; i < pos.count; i++) {
      positions[(vertexOffset + i) * 3] = pos.getX(i);
      positions[(vertexOffset + i) * 3 + 1] = pos.getY(i);
      positions[(vertexOffset + i) * 3 + 2] = pos.getZ(i);
      
      if (norm) {
        normals[(vertexOffset + i) * 3] = norm.getX(i);
        normals[(vertexOffset + i) * 3 + 1] = norm.getY(i);
        normals[(vertexOffset + i) * 3 + 2] = norm.getZ(i);
      }
    }
    
    if (geo.index) {
      for (let i = 0; i < geo.index.count; i++) {
        indices.push(geo.index.getX(i) + vertexOffset);
      }
    } else {
      for (let i = 0; i < pos.count; i++) {
        indices.push(vertexOffset + i);
      }
    }
    
    vertexOffset += pos.count;
  });
  
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(indices);
  merged.computeVertexNormals();
  
  return merged;
}

// ============================================================
// CUSTOM SHADER MATERIALS
// ============================================================

function createCoinMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uGoldColor: { value: new THREE.Color(0xFFBD32) },
      uGoldDark: { value: new THREE.Color(0xD4A020) },
      uEmissive: { value: new THREE.Color(0xFFBD32) },
      uEmissiveIntensity: { value: 0.3 },
      uPurpleColor: { value: new THREE.Color(0x9333ea) },
    },
    vertexShader: `
      attribute float instanceOpacity;
      varying float vOpacity;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vOpacity = instanceOpacity;
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uGoldColor;
      uniform vec3 uGoldDark;
      uniform vec3 uEmissive;
      uniform float uEmissiveIntensity;
      uniform vec3 uPurpleColor;
      varying float vOpacity;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vec3 light = normalize(vec3(1.0, 2.0, 1.0));
        float diff = max(dot(vNormal, light), 0.0) * 0.6 + 0.4;
        
        vec3 finalColor;
        
        // Top and bottom faces - add purple rectangles
        if (abs(vNormal.y) > 0.8) {
          vec3 goldBase = mix(uGoldColor, uGoldDark, step(0.0, -vNormal.y)) * diff;
          
          // Purple rectangles on each side
          float rectWidth = 0.2;
          float rectHeight = 0.6;
          float rectOffset = 0.3;
          
          bool inLeftRect = (vUv.x > rectOffset - rectWidth/2.0 && vUv.x < rectOffset + rectWidth/2.0) && 
                           (vUv.y > 0.5 - rectHeight/2.0 && vUv.y < 0.5 + rectHeight/2.0);
          bool inRightRect = (vUv.x > 1.0 - rectOffset - rectWidth/2.0 && vUv.x < 1.0 - rectOffset + rectWidth/2.0) && 
                            (vUv.y > 0.5 - rectHeight/2.0 && vUv.y < 0.5 + rectHeight/2.0);
          
          if (inLeftRect || inRightRect) {
            finalColor = uPurpleColor;
          } else {
            finalColor = goldBase;
          }
        }
        // Side/rim - slightly darker gold
        else {
          finalColor = mix(uGoldColor, uGoldDark, 0.3) * diff;
        }
        
        finalColor += uEmissive * uEmissiveIntensity;
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
  if (income < 500)    return { symbol: 'coin' as const,    intervalMs: 1250 };
  if (income < 2000)   return { symbol: 'coin' as const,    intervalMs: 1000 };
  if (income < 5000)   return { symbol: 'coin' as const,    intervalMs: 750 };
  if (income < 10000)  return { symbol: 'coin' as const,    intervalMs: 500 };
  if (income < 20000)  return { symbol: 'coin' as const,    intervalMs: 250 };
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
}

export function IncomeFlow3D({ enabled = true, particlesVisible = true, onParticleArrive }: IncomeFlow3DProps) {
  const { ownerships } = useGameState();
  const { triggerSpawn } = useParticleSpawn();
  
  // Refs for instanced meshes
  const coinMeshRef = useRef<THREE.InstancedMesh>(null);
  const diamondMeshRef = useRef<THREE.InstancedMesh>(null);
  
  // Logo texture removed - no longer needed
  
  // Particle data pools
  const coinDataRef = useRef<ParticleData[]>([]);
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
  const coinGeometry = useMemo(() => createCoinGeometry(), []);
  const diamondGeometry = useMemo(() => createDiamondGeometry(), []);
  const coinMaterial = useMemo(() => createCoinMaterial(), []);
  const diamondMaterial = useMemo(() => createDiamondMaterial(), []);
  
  // Coin material no longer needs texture updates

  // Initialize particle pools
  useEffect(() => {
    coinDataRef.current = Array.from({ length: MAX_COINS }, () => ({
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
    if (coinMeshRef.current && !coinMeshRef.current.geometry.getAttribute('instanceOpacity')) {
      const opacities = new Float32Array(MAX_COINS).fill(0);
      coinMeshRef.current.geometry.setAttribute('instanceOpacity', new THREE.InstancedBufferAttribute(opacities, 1));
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
    const isCoin = propData.tier.symbol === 'coin';
    const dataPool = isCoin ? coinDataRef.current : diamondDataRef.current;
    
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
    
    triggerSpawn(propData.propertyId);
  }, [triggerSpawn]);

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

  // Spawn timer management
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
      
      const interval = propData.tier.intervalMs * (0.8 + Math.random() * 0.4);
      const timer = setTimeout(() => {
        if (!isActive) return;
        spawnParticle(propData, interval);
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
  }, [enabled, ownedProperties, spawnParticle, particlesVisible]);

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
    
    const coinMesh = coinMeshRef.current;
    const diamondMesh = diamondMeshRef.current;
    if (!coinMesh || !diamondMesh) return;
    
    const coinOpacities = coinMesh.geometry.getAttribute('instanceOpacity') as THREE.InstancedBufferAttribute;
    const diamondOpacities = diamondMesh.geometry.getAttribute('instanceOpacity') as THREE.InstancedBufferAttribute;
    
    if (!coinOpacities || !diamondOpacities) return;
    
    // Update coins
    coinDataRef.current.forEach((particle, i) => {
      if (!particle.active) {
        coinOpacities.setX(i, 0);
        return;
      }
      
      particle.progress += delta * PARTICLE_SPEED;
      
      if (particle.progress >= 1) {
        particle.active = false;
        coinOpacities.setX(i, 0);
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
      coinOpacities.setX(i, fadeIn * fadeOut);
      
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      coinMesh.setMatrixAt(i, tempMatrix);
    });
    
    coinMesh.instanceMatrix.needsUpdate = true;
    coinOpacities.needsUpdate = true;
    
    // Update diamonds
    diamondDataRef.current.forEach((particle, i) => {
      if (!particle.active) {
        diamondOpacities.setX(i, 0);
        return;
      }
      
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
    
    diamondMesh.instanceMatrix.needsUpdate = true;
    diamondOpacities.needsUpdate = true;
  });

  // Cleanup
  useEffect(() => {
    return () => {
      coinGeometry.dispose();
      diamondGeometry.dispose();
      coinMaterial.dispose();
      diamondMaterial.dispose();
    };
  }, [coinGeometry, diamondGeometry, coinMaterial, diamondMaterial]);

  if (!enabled || ownedProperties.length === 0) return null;
  if (!particlesVisible) return null;

  return (
    <group>
      <instancedMesh
        ref={coinMeshRef}
        args={[coinGeometry, coinMaterial, MAX_COINS]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={diamondMeshRef}
        args={[diamondGeometry, diamondMaterial, MAX_DIAMONDS]}
        frustumCulled={false}
      />
    </group>
  );
}