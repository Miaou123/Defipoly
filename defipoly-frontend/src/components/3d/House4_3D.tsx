'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { use3DPulse, updatePulseScale, PulseRef } from '@/hooks/use3DPulse';

interface House4_3DProps {
  size?: number;
  isPulsing?: boolean;
}

export function House4_3D({ size = 120, isPulsing = false }: House4_3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    buildingGroup: THREE.Group;
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

    const buildingGroup = new THREE.Group();

    // === MATERIALS ===
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xB8B8B8,
      roughness: 0.5, 
      metalness: 0.1
    });
    
    const wallSideMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xA0A0A0,
      roughness: 0.5, 
      metalness: 0.1
    });
    
    const roofMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      roughness: 0.4, 
      metalness: 0.2
    });
    
    const windowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFCC,
      roughness: 0.2, 
      metalness: 0.0,
      emissive: 0xFFFF99,
      emissiveIntensity: 0.3
    });

    const doorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x404040,
      roughness: 0.3, 
      metalness: 0.2
    });

    const goldMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFBD32,
      roughness: 0.3, 
      metalness: 0.6
    });

    const windowFrameMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x505050, 
      roughness: 0.4 
    });

    // === BUILDING DIMENSIONS ===
    const buildingWidth = 3.5;
    const buildingHeight = 5;
    const buildingDepth = 2.5;

    // === MAIN BUILDING BODY ===
    const bodyGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    const bodyMaterials = [
      wallSideMaterial, // right (darker)
      wallMaterial,     // left
      roofMaterial,     // top
      wallMaterial,     // bottom
      wallMaterial,     // front
      wallSideMaterial  // back
    ];
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterials);
    body.position.set(0, buildingHeight / 2, 0);
    buildingGroup.add(body);

    // === ROOF STRUCTURE ===
    const roofTrim = new THREE.Mesh(
      new THREE.BoxGeometry(buildingWidth + 0.15, 0.15, buildingDepth + 0.15),
      roofMaterial
    );
    roofTrim.position.set(0, buildingHeight + 0.075, 0);
    buildingGroup.add(roofTrim);

    // === WINDOWS - 5 floors, 4 columns ===
    const windowWidth = 0.35;
    const windowHeight = 0.45;
    const windowDepth = 0.06;
    
    const floors = 5;
    const columns = 4;
    const floorHeight = buildingHeight / floors;
    const columnSpacing = buildingWidth / (columns + 1);

    for (let floor = 0; floor < floors; floor++) {
      const yPos = floorHeight * (floor + 0.5) + 0.1;
      
      for (let col = 0; col < columns; col++) {
        const xPos = -buildingWidth / 2 + columnSpacing * (col + 1);
        
        // Window glass
        const windowMesh = new THREE.Mesh(
          new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
          windowMaterial
        );
        windowMesh.position.set(xPos, yPos, buildingDepth / 2 + 0.03);
        buildingGroup.add(windowMesh);
        
        // Window frame
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(windowWidth + 0.08, windowHeight + 0.08, 0.02),
          windowFrameMaterial
        );
        frame.position.set(xPos, yPos, buildingDepth / 2 + 0.01);
        buildingGroup.add(frame);
      }
    }

    // === ENTRANCE ===
    const doorWidth = 0.6;
    const doorHeight = 0.9;
    
    // Door recess
    const recess = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth + 0.2, doorHeight + 0.1, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 0.5 })
    );
    recess.position.set(0, doorHeight / 2, buildingDepth / 2 + 0.02);
    buildingGroup.add(recess);
    
    // Door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, doorHeight, 0.08),
      doorMaterial
    );
    door.position.set(0, doorHeight / 2, buildingDepth / 2 + 0.06);
    buildingGroup.add(door);

    // Door handle
    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      goldMaterial
    );
    handle.position.set(0.15, doorHeight / 2, buildingDepth / 2 + 0.12);
    buildingGroup.add(handle);

    // === BASE/GROUND ===
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(buildingWidth + 0.6, 0.15, buildingDepth + 0.6),
      new THREE.MeshStandardMaterial({ color: 0x4a7c4e, roughness: 0.9 })
    );
    base.position.y = -0.075;
    buildingGroup.add(base);

    // Steps
    for (let i = 0; i < 2; i++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(1.2 - i * 0.1, 0.08, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x909090, roughness: 0.6 })
      );
      step.position.set(0, 0.04 - i * 0.08, buildingDepth / 2 + 0.25 + i * 0.25);
      buildingGroup.add(step);
    }

    scene.add(buildingGroup);

    // Zoomed out camera position
    camera.position.set(7, 5, 7);
    camera.lookAt(0, 2, 0);

    // Store refs
    sceneRef.current = {
      renderer,
      buildingGroup,
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
        updatePulseScale(sceneRef.current, sceneRef.current.buildingGroup);
      }

      buildingGroup.rotation.y = Math.sin(time * 0.3) * 0.15 + 0.4;

      try {
        renderer.render(scene, camera);
      } catch (error) {
        console.warn('WebGL render error in House4_3D:', error);
        cancelAnimationFrame(animationId);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      
      buildingGroup.traverse((child) => {
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