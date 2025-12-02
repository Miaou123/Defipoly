'use client';

import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameState } from '@/contexts/GameStateContext';
import { useParticleSpawn } from '@/contexts/ParticleSpawnContext';
import { PROPERTIES } from '@/utils/constants';
import * as THREE from 'three';

// ============================================================
// CONSTANTS
// ============================================================

const MAX_BILLS = 60;
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

const BANK_TARGET = new THREE.Vector3(0, 1.8, 0);

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
 * Creates merged geometry for Bill V3 (Stack Bill)
 * - 4 stacked bill layers
 * - Gold $ symbol on top
 * Scale: ~0.12 units wide (appropriate for board scale)
 */
function createBillGeometry(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];
  const scale = 0.08; // Scale down for board
  
  const stackCount = 4;
  const stackSpacing = 0.03 * scale;
  
  // Bill stack layers
  for (let i = 0; i < stackCount; i++) {
    const billGeo = new THREE.BoxGeometry(1.4 * scale, 0.05 * scale, 0.7 * scale);
    billGeo.translate(
      (Math.random() - 0.5) * 0.02 * scale,
      i * stackSpacing,
      (Math.random() - 0.5) * 0.02 * scale
    );
    geometries.push(billGeo);
  }
  
  // Top frame
  const frameGeo = new THREE.BoxGeometry(1.2 * scale, 0.02 * scale, 0.5 * scale);
  frameGeo.translate(0, stackCount * stackSpacing + 0.02 * scale, 0);
  geometries.push(frameGeo);
  
  // $ Symbol - simplified as small box for performance
  const dollarGeo = new THREE.BoxGeometry(0.08 * scale, 0.03 * scale, 0.25 * scale);
  dollarGeo.translate(0, stackCount * stackSpacing + 0.04 * scale, 0);
  geometries.push(dollarGeo);
  
  // Merge all
  const merged = mergeBufferGeometries(geometries);
  merged.center();
  
  // Cleanup
  geometries.forEach(g => g.dispose());
  
  return merged;
}

/**
 * Creates merged geometry for Diamond V2 (Brilliant Cut)
 * - Flat table top
 * - Crown (angled top section)
 * - Girdle (middle band)
 * - Pavilion (bottom cone)
 * Scale: ~0.12 units tall
 */
function createDiamondGeometry(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];
  const scale = 0.10;
  
  const crownHeight = 0.25 * scale;
  const tableRadius = 0.25 * scale;
  const crownRadius = 0.5 * scale;
  const pavilionHeight = 0.6 * scale;
  
  // Table (flat top)
  const tableGeo = new THREE.CylinderGeometry(tableRadius, tableRadius, 0.02 * scale, 8);
  tableGeo.translate(0, crownHeight, 0);
  geometries.push(tableGeo);
  
  // Crown
  const crownGeo = new THREE.CylinderGeometry(tableRadius, crownRadius, crownHeight, 8);
  crownGeo.translate(0, crownHeight / 2, 0);
  geometries.push(crownGeo);
  
  // Girdle
  const girdleGeo = new THREE.CylinderGeometry(crownRadius, crownRadius, 0.05 * scale, 8);
  girdleGeo.translate(0, 0, 0);
  geometries.push(girdleGeo);
  
  // Pavilion (inverted cone)
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
  let totalIndices = 0;
  
  geometries.forEach(geo => {
    totalVertices += geo.attributes.position.count;
    if (geo.index) totalIndices += geo.index.count;
  });
  
  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const indices: number[] = [];
  
  let vertexOffset = 0;
  let indexOffset = 0;
  
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
// CUSTOM SHADER MATERIAL (supports per-instance opacity)
// ============================================================

function createInstancedMaterial(color: THREE.Color, emissive: THREE.Color, emissiveIntensity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uEmissive: { value: emissive },
      uEmissiveIntensity: { value: emissiveIntensity },
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
        // Simple lighting
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
  const tileY = 0.5; // Spawn slightly above tiles
  
  // BOTTOM ROW: properties [5, 4, 3, 2, 1, 0] (left to right order)
  if (propertyId >= 0 && propertyId <= 5) {
    const bottomRowIds = [5, 4, 3, 2, 1, 0];
    const i = bottomRowIds.indexOf(propertyId);
    if (i === -1) return null;
    const x = -halfW + cornerSize + tileLong/2 + i * tileLong;
    const z = halfH - tileShort/2;
    return new THREE.Vector3(x, tileY, z);
  }
  
  // LEFT COLUMN: properties [10, 9, 8, 7, 6] (top to bottom order)
  if (propertyId >= 6 && propertyId <= 10) {
    const leftColIds = [10, 9, 8, 7, 6];
    const i = leftColIds.indexOf(propertyId);
    if (i === -1) return null;
    const x = -halfW + tileShort/2;
    const z = -halfH + cornerSize + tileLong/2 + i * tileLong;
    return new THREE.Vector3(x, tileY, z);
  }
  
  // TOP ROW: properties [11, 12, 13, 14, 15, 16] (left to right order)
  if (propertyId >= 11 && propertyId <= 16) {
    const topRowIds = [11, 12, 13, 14, 15, 16];
    const i = topRowIds.indexOf(propertyId);
    if (i === -1) return null;
    const x = -halfW + cornerSize + tileLong/2 + i * tileLong;
    const z = -halfH + tileShort/2;
    return new THREE.Vector3(x, tileY, z);
  }
  
  // RIGHT COLUMN: properties [17, 18, 19, 20, 21] (top to bottom order)
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
  onParticleArrive?: () => void;
}

export function IncomeFlow3D({ enabled = true, particlesVisible = true, onParticleArrive }: IncomeFlow3DProps) {
  const { ownerships } = useGameState();
  const { triggerSpawn } = useParticleSpawn();
  const { camera } = useThree();
  
  // Refs for instanced meshes
  const billMeshRef = useRef<THREE.InstancedMesh>(null);
  const diamondMeshRef = useRef<THREE.InstancedMesh>(null);
  
  // Particle data pools
  const billDataRef = useRef<ParticleData[]>([]);
  const diamondDataRef = useRef<ParticleData[]>([]);
  
  // Spawn timers
  const spawnTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  
  // Temp objects for matrix calculations (avoid GC)
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);
  const tempEuler = useMemo(() => new THREE.Euler(), []);

  // Create geometries and materials once
  const billGeometry = useMemo(() => createBillGeometry(), []);
  const diamondGeometry = useMemo(() => createDiamondGeometry(), []);
  
  const billMaterial = useMemo(() => createInstancedMaterial(
    new THREE.Color(0x22c55e),
    new THREE.Color(0x15803d),
    0.2
  ), []);
  
  const diamondMaterial = useMemo(() => createInstancedMaterial(
    new THREE.Color(0x60a5fa),
    new THREE.Color(0x3b82f6),
    0.4
  ), []);

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
    }));
  }, []);

  // Initialize opacity attributes when meshes are ready
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
  const spawnParticle = useCallback((propData: PropertyIncomeData) => {
    const isBill = propData.tier.symbol === 'bill';
    const dataPool = isBill ? billDataRef.current : diamondDataRef.current;
    
    // Find inactive slot
    const slot = dataPool.findIndex(p => !p.active);
    if (slot === -1) return; // Pool full
    
    const particle = dataPool[slot];
    particle.active = true;
    particle.startPos.copy(propData.position);
    particle.targetPos.copy(BANK_TARGET);
    particle.progress = 0;
    
    // Random bezier control point
    const midX = (propData.position.x + BANK_TARGET.x) / 2 + (Math.random() - 0.5) * 2;
    const midZ = (propData.position.z + BANK_TARGET.z) / 2 + (Math.random() - 0.5) * 2;
    particle.controlPos.set(midX, 2.0 + Math.random() * 1.0, midZ);
    
    // Random rotation speeds
    particle.rotationX = Math.random() * Math.PI * 2;
    particle.rotationY = Math.random() * Math.PI * 2;
    particle.rotationZ = Math.random() * Math.PI * 2;
    particle.rotSpeedX = (Math.random() - 0.5) * 3;
    particle.rotSpeedY = (Math.random() - 0.5) * 4;
    particle.rotSpeedZ = (Math.random() - 0.5) * 2;
    
    // Trigger property pulse
    triggerSpawn(propData.propertyId);
  }, [triggerSpawn]);

  // Spawn timer management
  useEffect(() => {
    if (!enabled) {
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
        spawnParticle(propData);
        scheduleSpawn(propData);
      }, interval);
      
      spawnTimersRef.current.set(propData.propertyId, timer);
    };
    
    // Stagger initial spawns
    ownedProperties.forEach((propData, index) => {
      const initialDelay = index * 100 + Math.random() * propData.tier.intervalMs * 0.3;
      const timer = setTimeout(() => {
        if (!isActive) return;
        spawnParticle(propData);
        scheduleSpawn(propData);
      }, initialDelay);
      spawnTimersRef.current.set(propData.propertyId, timer);
    });
    
    return () => {
      isActive = false;
      spawnTimersRef.current.forEach(timer => clearTimeout(timer));
      spawnTimersRef.current.clear();
    };
  }, [enabled, ownedProperties, spawnParticle]);

  // Animation loop
  useFrame((state, delta) => {
    if (!enabled) return;
    
    const billMesh = billMeshRef.current;
    const diamondMesh = diamondMeshRef.current;
    if (!billMesh || !diamondMesh) return;
    
    const billOpacities = billMesh.geometry.getAttribute('instanceOpacity') as THREE.InstancedBufferAttribute;
    const diamondOpacities = diamondMesh.geometry.getAttribute('instanceOpacity') as THREE.InstancedBufferAttribute;
    
    // Early return if attributes aren't ready yet
    if (!billOpacities || !diamondOpacities) return;
    
    // Update bills
    billDataRef.current.forEach((particle, i) => {
      if (!particle.active) {
        billOpacities.setX(i, 0);
        return;
      }
      
      particle.progress += delta * PARTICLE_SPEED;
      
      if (particle.progress >= 1) {
        particle.active = false;
        billOpacities.setX(i, 0);
        onParticleArrive?.();
        return;
      }
      
      // Position along bezier
      const pos = quadraticBezier(particle.startPos, particle.controlPos, particle.targetPos, particle.progress);
      tempPosition.copy(pos);
      
      // Bills rotate freely in 3D (removed billboard effect)
      particle.rotationX += particle.rotSpeedX * delta;
      particle.rotationY += particle.rotSpeedY * delta;
      particle.rotationZ += particle.rotSpeedZ * delta;
      tempEuler.set(particle.rotationX, particle.rotationY, particle.rotationZ);
      tempQuaternion.setFromEuler(tempEuler);
      
      // Scale down as approaching
      const scale = 1 - particle.progress * 0.4;
      tempScale.setScalar(scale);
      
      // Opacity - hide if particlesVisible is false
      if (particlesVisible) {
        const fadeIn = Math.min(1, particle.progress * 5);
        const fadeOut = 1 - Math.max(0, (particle.progress - 0.8) / 0.2);
        billOpacities.setX(i, fadeIn * fadeOut);
      } else {
        billOpacities.setX(i, 0); // Completely hidden
      }
      
      // Build matrix
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      billMesh.setMatrixAt(i, tempMatrix);
    });
    
    billMesh.instanceMatrix.needsUpdate = true;
    billOpacities.needsUpdate = true;
    
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
        onParticleArrive?.();
        return;
      }
      
      // Position
      const pos = quadraticBezier(particle.startPos, particle.controlPos, particle.targetPos, particle.progress);
      tempPosition.copy(pos);
      
      // Rotation (diamonds spin freely)
      particle.rotationX += particle.rotSpeedX * delta;
      particle.rotationY += particle.rotSpeedY * delta;
      tempEuler.set(particle.rotationX, particle.rotationY, 0);
      tempQuaternion.setFromEuler(tempEuler);
      
      // Scale
      const scale = 1 - particle.progress * 0.4;
      tempScale.setScalar(scale);
      
      // Opacity - hide if particlesVisible is false
      if (particlesVisible) {
        const fadeIn = Math.min(1, particle.progress * 5);
        const fadeOut = 1 - Math.max(0, (particle.progress - 0.8) / 0.2);
        diamondOpacities.setX(i, fadeIn * fadeOut);
      } else {
        diamondOpacities.setX(i, 0); // Completely hidden
      }
      
      // Build matrix
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      diamondMesh.setMatrixAt(i, tempMatrix);
    });
    
    diamondMesh.instanceMatrix.needsUpdate = true;
    diamondOpacities.needsUpdate = true;
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

  if (!enabled || ownedProperties.length === 0) return null;

  return (
    <group>
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
    </group>
  );
}