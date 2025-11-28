'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface House5_3DProps {
  size?: number;
}

export function House5_3D({ size = 150 }: House5_3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    hotelGroup: THREE.Group;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (sceneRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
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
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffd700, 0.2);
    rimLight.position.set(0, 5, -10);
    scene.add(rimLight);

    const hotelGroup = new THREE.Group();

    // === MATERIALS ===
    const platinumMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xE8E8E8,
      roughness: 0.3, 
      metalness: 0.4
    });
    const platinumDarkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xD0D0D0,
      roughness: 0.3, 
      metalness: 0.4
    });
    const goldMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700, 
      roughness: 0.2, 
      metalness: 0.8
    });
    const windowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFCC,
      roughness: 0.2, 
      metalness: 0.3,
      emissive: 0xFFFFCC,
      emissiveIntensity: 0.3
    });
    const doorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x404040, 
      roughness: 0.4, 
      metalness: 0.2
    });
    const doorFrameMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x505050, 
      roughness: 0.4, 
      metalness: 0.2
    });
    const redMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xDC143C, 
      roughness: 0.5, 
      metalness: 0.1
    });
    const flagPoleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513, 
      roughness: 0.6, 
      metalness: 0.1
    });

    // === DIMENSIONS ===
    const bodyWidth = 4;
    const bodyHeight = 6;
    const bodyDepth = 3;

    // === MAIN BUILDING BODY ===
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth),
      platinumMaterial
    );
    body.position.y = bodyHeight / 2;
    hotelGroup.add(body);

    // === GOLD ROOF ACCENT ===
    const roofHeight = 0.4;
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth + 0.2, roofHeight, bodyDepth + 0.2),
      goldMaterial
    );
    roof.position.y = bodyHeight + roofHeight / 2;
    hotelGroup.add(roof);

    // === WINDOWS (4 columns × 5 rows) ===
    const windowSize = 0.35;
    const windowDepth = 0.08;
    const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, windowDepth);
    const frontZ = bodyDepth / 2;

    const windowCols = [-1.2, -0.4, 0.4, 1.2];
    const windowRows = [5.2, 4.2, 3.2, 2.2, 1.2];

    windowCols.forEach(x => {
      windowRows.forEach(y => {
        // Skip bottom center windows for door area
        if (y === 1.2 && (x === -0.4 || x === 0.4)) return;
        
        const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
        windowMesh.position.set(x, y, frontZ + 0.05);
        hotelGroup.add(windowMesh);
      });
    });

    // === GRAND ENTRANCE ===
    const doorWidth = 1.6;
    const doorHeight = 1.8;

    // Door recess
    const doorRecess = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth + 0.2, doorHeight + 0.1, 0.15),
      doorMaterial
    );
    doorRecess.position.set(0, doorHeight / 2, frontZ + 0.05);
    hotelGroup.add(doorRecess);

    // Left door
    const doorLeft = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth / 2 - 0.05, doorHeight - 0.1, 0.08),
      doorFrameMaterial
    );
    doorLeft.position.set(-doorWidth / 4, doorHeight / 2, frontZ + 0.12);
    hotelGroup.add(doorLeft);

    // Right door
    const doorRight = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth / 2 - 0.05, doorHeight - 0.1, 0.08),
      doorFrameMaterial
    );
    doorRight.position.set(doorWidth / 4, doorHeight / 2, frontZ + 0.12);
    hotelGroup.add(doorRight);

    // Door handles
    const handleLeft = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      goldMaterial
    );
    handleLeft.position.set(-0.15, doorHeight / 2, frontZ + 0.18);
    hotelGroup.add(handleLeft);

    const handleRight = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      goldMaterial
    );
    handleRight.position.set(0.15, doorHeight / 2, frontZ + 0.18);
    hotelGroup.add(handleRight);

    // === RED AWNING ===
    const awningWidth = doorWidth + 0.6;
    const awningDepth = 0.5;
    const awningHeight = 0.15;

    // Awning shape (slanted)
    const awningVertices = new Float32Array([
      // Top face (slanted)
      -awningWidth/2, 0, 0,
      awningWidth/2, 0, 0,
      awningWidth/2, -awningHeight, awningDepth,
      -awningWidth/2, -awningHeight, awningDepth,
      // Bottom face
      -awningWidth/2, -0.05, 0,
      awningWidth/2, -0.05, 0,
      awningWidth/2, -awningHeight - 0.05, awningDepth,
      -awningWidth/2, -awningHeight - 0.05, awningDepth,
    ]);

    const awningGeometry = new THREE.BoxGeometry(awningWidth, awningHeight, awningDepth);
    const awning = new THREE.Mesh(awningGeometry, redMaterial);
    awning.position.set(0, doorHeight + awningHeight / 2 + 0.1, frontZ + awningDepth / 2);
    awning.rotation.x = 0.15;
    hotelGroup.add(awning);

    // === FLAG POLES AND FLAGS ===
    const poleHeight = 1.2;
    const poleRadius = 0.04;

    // Left flag pole
    const poleLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 8),
      flagPoleMaterial
    );
    poleLeft.position.set(-bodyWidth/2 + 0.3, bodyHeight + poleHeight/2, frontZ - 0.2);
    hotelGroup.add(poleLeft);

    // Left flag
    const flagLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.3, 0.02),
      redMaterial
    );
    flagLeft.position.set(-bodyWidth/2 + 0.55, bodyHeight + poleHeight - 0.15, frontZ - 0.2);
    hotelGroup.add(flagLeft);

    // Left star
    const starLeft = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      goldMaterial
    );
    starLeft.position.set(-bodyWidth/2 + 0.55, bodyHeight + poleHeight - 0.15, frontZ - 0.17);
    hotelGroup.add(starLeft);

    // Right flag pole
    const poleRight = new THREE.Mesh(
      new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 8),
      flagPoleMaterial
    );
    poleRight.position.set(bodyWidth/2 - 0.3, bodyHeight + poleHeight/2, frontZ - 0.2);
    hotelGroup.add(poleRight);

    // Right flag
    const flagRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.3, 0.02),
      redMaterial
    );
    flagRight.position.set(bodyWidth/2 - 0.55, bodyHeight + poleHeight - 0.15, frontZ - 0.2);
    hotelGroup.add(flagRight);

    // Right star
    const starRight = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      goldMaterial
    );
    starRight.position.set(bodyWidth/2 - 0.55, bodyHeight + poleHeight - 0.15, frontZ - 0.17);
    hotelGroup.add(starRight);

    // Position hotel
    hotelGroup.position.y = -2.5;
    scene.add(hotelGroup);

    camera.position.set(5, 5, 8);
    camera.lookAt(0, 1.5, 0);

    sceneRef.current = { renderer, hotelGroup };

    let animationId: number;
    let time = 0;
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.016;
      
      hotelGroup.rotation.y = Math.sin(time * 0.5) * 0.12;
      hotelGroup.position.y = -2.5 + Math.sin(time * 0.8) * 0.05;
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      
      hotelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
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

  return <div ref={containerRef} className="flex items-center justify-center" />;
}