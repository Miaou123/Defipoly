'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { use3DPulse, updatePulseScale, PulseRef } from '@/hooks/use3DPulse';

interface House1_3DProps {
  size?: number;
  isPulsing?: boolean;
}

export function House1_3D({ size = 120, isPulsing = false }: House1_3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    houseGroup: THREE.Group;
  } & PulseRef | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (sceneRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "default"
    });
    
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(5, 10, 7);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const houseGroup = new THREE.Group();

    // === MATERIALS ===
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xD2691E,
      roughness: 0.7, 
      metalness: 0.0
    });
    
    const wallSideMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xA0522D,
      roughness: 0.7, 
      metalness: 0.0
    });
    
    const roofMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.6, 
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    
    const roofDarkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x654321,
      roughness: 0.6, 
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    
    const doorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x654321,
      roughness: 0.5, 
      metalness: 0.1
    });
    
    const windowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFCC,
      roughness: 0.2, 
      metalness: 0.0,
      emissive: 0xFFFF99,
      emissiveIntensity: 0.3
    });

    // === HOUSE DIMENSIONS ===
    const houseWidth = 2;
    const houseHeight = 1.5;
    const houseDepth = 1.8;

    // === MAIN HOUSE BODY ===
    const bodyGeometry = new THREE.BoxGeometry(houseWidth, houseHeight, houseDepth);
    const bodyMaterials = [
      wallSideMaterial, // right (darker)
      wallMaterial,     // left
      wallMaterial,     // top
      wallMaterial,     // bottom
      wallMaterial,     // front
      wallMaterial      // back
    ];
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterials);
    body.position.set(0, houseHeight / 2, 0);
    houseGroup.add(body);

    // === ROOF - Ridge runs FRONT-TO-BACK, slopes go LEFT and RIGHT ===
    const roofHeight = 0.9;
    const roofOverhang = 0.15;
    
    const hw = houseWidth / 2 + roofOverhang;
    const hd = houseDepth / 2 + roofOverhang;
    const baseY = houseHeight;
    const peakY = houseHeight + roofHeight;

    // Left roof slope
    const leftRoofGeo = new THREE.BufferGeometry();
    const leftRoofVerts = new Float32Array([
      0,   peakY, -hd,
      0,   peakY, hd,
      -hw, baseY, hd,
       
      0,   peakY, -hd,
      -hw, baseY, hd,
      -hw, baseY, -hd,
    ]);
    leftRoofGeo.setAttribute('position', new THREE.BufferAttribute(leftRoofVerts, 3));
    leftRoofGeo.computeVertexNormals();
    
    const leftRoof = new THREE.Mesh(leftRoofGeo, roofMaterial);
    houseGroup.add(leftRoof);

    // Right roof slope (darker)
    const rightRoofGeo = new THREE.BufferGeometry();
    const rightRoofVerts = new Float32Array([
      0,  peakY, hd,
      0,  peakY, -hd,
      hw, baseY, -hd,
       
      0,  peakY, hd,
      hw, baseY, -hd,
      hw, baseY, hd,
    ]);
    rightRoofGeo.setAttribute('position', new THREE.BufferAttribute(rightRoofVerts, 3));
    rightRoofGeo.computeVertexNormals();
    
    const rightRoof = new THREE.Mesh(rightRoofGeo, roofDarkMaterial);
    houseGroup.add(rightRoof);

    // Front gable cap
    const frontRoofGeo = new THREE.BufferGeometry();
    const frontRoofVerts = new Float32Array([
      -hw, baseY, hd,
       hw, baseY, hd,
       0,  peakY, hd,
    ]);
    frontRoofGeo.setAttribute('position', new THREE.BufferAttribute(frontRoofVerts, 3));
    frontRoofGeo.computeVertexNormals();
    const frontRoofCap = new THREE.Mesh(frontRoofGeo, roofMaterial);
    houseGroup.add(frontRoofCap);

    // Back gable cap
    const backRoofGeo = new THREE.BufferGeometry();
    const backRoofVerts = new Float32Array([
       hw, baseY, -hd,
      -hw, baseY, -hd,
       0,  peakY, -hd,
    ]);
    backRoofGeo.setAttribute('position', new THREE.BufferAttribute(backRoofVerts, 3));
    backRoofGeo.computeVertexNormals();
    const backRoofCap = new THREE.Mesh(backRoofGeo, roofDarkMaterial);
    houseGroup.add(backRoofCap);

    // Front gable wall
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-houseWidth / 2, 0);
    gableShape.lineTo(houseWidth / 2, 0);
    gableShape.lineTo(0, roofHeight);
    gableShape.closePath();
    
    const gableGeometry = new THREE.ShapeGeometry(gableShape);
    
    const frontGable = new THREE.Mesh(gableGeometry, wallMaterial);
    frontGable.position.set(0, houseHeight, houseDepth / 2 + 0.01);
    houseGroup.add(frontGable);
    
    // Back gable wall
    const backGable = new THREE.Mesh(gableGeometry, wallSideMaterial);
    backGable.position.set(0, houseHeight, -houseDepth / 2 - 0.01);
    backGable.rotation.y = Math.PI;
    houseGroup.add(backGable);

    // === DOOR ===
    const doorWidth = 0.4;
    const doorHeight = 0.7;
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, doorHeight, 0.08),
      doorMaterial
    );
    door.position.set(0, doorHeight / 2, houseDepth / 2 + 0.04);
    houseGroup.add(door);

    // === WINDOWS ===
    const windowSize = 0.3;
    const windowDepth = 0.06;
    const windowFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.6 });
    
    [-0.55, 0.55].forEach(xPos => {
      const windowMesh = new THREE.Mesh(
        new THREE.BoxGeometry(windowSize, windowSize, windowDepth),
        windowMaterial
      );
      windowMesh.position.set(xPos, houseHeight * 0.55, houseDepth / 2 + 0.04);
      houseGroup.add(windowMesh);
      
      const wFrame = new THREE.Mesh(
        new THREE.BoxGeometry(windowSize + 0.08, windowSize + 0.08, 0.03),
        windowFrameMaterial
      );
      wFrame.position.set(xPos, houseHeight * 0.55, houseDepth / 2 + 0.02);
      houseGroup.add(wFrame);
    });

    // === BASE/GROUND ===
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(houseWidth + 0.4, 0.1, houseDepth + 0.4),
      new THREE.MeshStandardMaterial({ color: 0x4a7c4e, roughness: 0.9 })
    );
    base.position.y = -0.05;
    houseGroup.add(base);

    scene.add(houseGroup);

    camera.position.set(4, 3, 4);
    camera.lookAt(0, 0.8, 0);

    // Store refs
    sceneRef.current = {
      renderer,
      houseGroup,
      targetScale: 1,
      currentScale: 1,
    };

    let animationId: number;
    let time = 0;
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.016;

      if (!renderer.domElement || renderer.getContext().isContextLost()) {
        return;
      }

      if (sceneRef.current) {
        updatePulseScale(sceneRef.current, sceneRef.current.houseGroup);
      }

      houseGroup.rotation.y = Math.sin(time * 0.3) * 0.15 + 0.4;

      try {
        renderer.render(scene, camera);
      } catch (error) {
        console.warn('WebGL render error in House1_3D:', error);
        cancelAnimationFrame(animationId);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      
      houseGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          } else if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          }
        }
      });
      
      renderer.dispose();
      renderer.forceContextLoss();
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      
      sceneRef.current = null;
    };
  }, [size]);

  use3DPulse(sceneRef, isPulsing);

  return <div ref={containerRef} className="flex items-center justify-center" />;
}