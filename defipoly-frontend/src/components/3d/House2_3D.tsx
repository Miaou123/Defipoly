'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface House2_3DProps {
  size?: number;
}

export function House2_3D({ size = 150 }: House2_3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    houseGroup: THREE.Group;
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

    const houseGroup = new THREE.Group();

    // === MATERIALS (matching SVG colors) ===
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xD2691E,
      roughness: 0.7, 
      metalness: 0.1
    });
    const roofMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.6, 
      metalness: 0.1
    });
    const roofDarkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x654321,
      roughness: 0.6, 
      metalness: 0.1
    });
    const doorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x654321, 
      roughness: 0.5, 
      metalness: 0.1
    });
    const windowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFCC,
      roughness: 0.2, 
      metalness: 0.3,
      emissive: 0xFFFFCC,
      emissiveIntensity: 0.3
    });
    const goldMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700, 
      roughness: 0.2, 
      metalness: 0.8
    });
    const chimneyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513, 
      roughness: 0.7, 
      metalness: 0.1
    });
    const chimneyCapMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x654321, 
      roughness: 0.6, 
      metalness: 0.1
    });

    // === MAIN HOUSE BODY ===
    const bodyWidth = 3;
    const bodyHeight = 2.5;
    const bodyDepth = 2.5;

    const bodyFront = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth),
      wallMaterial
    );
    bodyFront.position.y = bodyHeight / 2;
    houseGroup.add(bodyFront);

    // === ROOF ===
    const roofHeight = 1.2;
    const roofOverhang = 0.3;
    
    const roofHalfWidth = bodyWidth / 2 + roofOverhang;
    const roofDepth = bodyDepth + roofOverhang * 2;
    
    const roofVertices = new Float32Array([
      // Front face
      -roofHalfWidth, 0, roofDepth/2,
      roofHalfWidth, 0, roofDepth/2,
      0, roofHeight, roofDepth/2,
      // Back face
      roofHalfWidth, 0, -roofDepth/2,
      -roofHalfWidth, 0, -roofDepth/2,
      0, roofHeight, -roofDepth/2,
      // Left slope
      -roofHalfWidth, 0, roofDepth/2,
      0, roofHeight, roofDepth/2,
      0, roofHeight, -roofDepth/2,
      0, roofHeight, -roofDepth/2,
      -roofHalfWidth, 0, -roofDepth/2,
      -roofHalfWidth, 0, roofDepth/2,
      // Right slope
      roofHalfWidth, 0, roofDepth/2,
      roofHalfWidth, 0, -roofDepth/2,
      0, roofHeight, -roofDepth/2,
      0, roofHeight, -roofDepth/2,
      0, roofHeight, roofDepth/2,
      roofHalfWidth, 0, roofDepth/2,
      // Bottom
      -roofHalfWidth, 0, roofDepth/2,
      -roofHalfWidth, 0, -roofDepth/2,
      roofHalfWidth, 0, -roofDepth/2,
      roofHalfWidth, 0, -roofDepth/2,
      roofHalfWidth, 0, roofDepth/2,
      -roofHalfWidth, 0, roofDepth/2,
    ]);

    const roofGeometry = new THREE.BufferGeometry();
    roofGeometry.setAttribute('position', new THREE.BufferAttribute(roofVertices, 3));
    roofGeometry.computeVertexNormals();

    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = bodyHeight;
    houseGroup.add(roof);

    // === CHIMNEY ===
    const chimneyWidth = 0.5;
    const chimneyDepth = 0.5;
    const chimneyHeight = 1.8;
    
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(chimneyWidth, chimneyHeight, chimneyDepth),
      chimneyMaterial
    );
    chimney.position.set(-0.8, bodyHeight + chimneyHeight / 2 - 0.3, -0.5);
    houseGroup.add(chimney);

    const chimneyCap = new THREE.Mesh(
      new THREE.BoxGeometry(chimneyWidth + 0.15, 0.12, chimneyDepth + 0.15),
      chimneyCapMaterial
    );
    chimneyCap.position.set(-0.8, bodyHeight + chimneyHeight - 0.3 + 0.06, -0.5);
    houseGroup.add(chimneyCap);

    // === DOOR ===
    const doorWidth = 0.7;
    const doorHeight = 1.2;
    const frontZ = bodyDepth / 2;

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, doorHeight, 0.1),
      doorMaterial
    );
    door.position.set(0, doorHeight / 2, frontZ + 0.05);
    houseGroup.add(door);

    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      goldMaterial
    );
    handle.position.set(0.2, doorHeight / 2, frontZ + 0.12);
    houseGroup.add(handle);

    // === WINDOWS ===
    const windowSize = 0.45;
    const windowDepth = 0.08;
    const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, windowDepth);

    const windowPositions = [
      { x: -0.8, y: 1.8 },
      { x: 0.8, y: 1.8 },
      { x: -0.8, y: 0.9 },
      { x: 0.8, y: 0.9 },
    ];

    windowPositions.forEach(pos => {
      const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
      windowMesh.position.set(pos.x, pos.y, frontZ + 0.05);
      houseGroup.add(windowMesh);

      const frameThickness = 0.05;
      
      const hFrame = new THREE.Mesh(
        new THREE.BoxGeometry(windowSize + 0.1, frameThickness, windowDepth + 0.02),
        doorMaterial
      );
      hFrame.position.set(pos.x, pos.y + windowSize / 2 + frameThickness / 2, frontZ + 0.05);
      houseGroup.add(hFrame);

      const hFrameBottom = hFrame.clone();
      hFrameBottom.position.y = pos.y - windowSize / 2 - frameThickness / 2;
      houseGroup.add(hFrameBottom);

      const vFrame = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, windowSize + 0.1, windowDepth + 0.02),
        doorMaterial
      );
      vFrame.position.set(pos.x - windowSize / 2 - frameThickness / 2, pos.y, frontZ + 0.05);
      houseGroup.add(vFrame);

      const vFrameRight = vFrame.clone();
      vFrameRight.position.x = pos.x + windowSize / 2 + frameThickness / 2;
      houseGroup.add(vFrameRight);
    });

    houseGroup.position.y = -1;
    scene.add(houseGroup);

    camera.position.set(4, 4, 6);
    camera.lookAt(0, 1, 0);

    sceneRef.current = { renderer, houseGroup };

    let animationId: number;
    let time = 0;
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.016;
      
      houseGroup.rotation.y = Math.sin(time * 0.5) * 0.15;
      houseGroup.position.y = -1 + Math.sin(time * 0.8) * 0.05;
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      
      houseGroup.traverse((child) => {
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