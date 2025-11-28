'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface House3_3DProps {
  size?: number;
}

export function House3_3D({ size = 150 }: House3_3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    buildingGroup: THREE.Group;
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

    const fillLight = new THREE.DirectionalLight(0xffd4a3, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, 5, -10);
    scene.add(rimLight);

    const buildingGroup = new THREE.Group();

    // === MATERIALS (matching SVG colors) ===
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xC19A6B,
      roughness: 0.6,
      metalness: 0.0,
    });

    const wallSideMaterial = new THREE.MeshStandardMaterial({
      color: 0x9C7A4F,
      roughness: 0.6,
      metalness: 0.0,
    });

    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.5,
      metalness: 0.1,
    });

    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.5,
      metalness: 0.1,
    });

    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFCC,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0xFFFFCC,
      emissiveIntensity: 0.3,
    });

    const windowFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x5C4033,
      roughness: 0.6,
      metalness: 0.1,
    });

    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Building dimensions (3-story apartment)
    const buildingWidth = 3.0;
    const buildingHeight = 4.5;
    const buildingDepth = 2.2;

    // === MAIN BUILDING BODY ===
    const bodyGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    const bodyMaterials = [
      wallSideMaterial,
      wallMaterial,
      roofMaterial,
      wallMaterial,
      wallMaterial,
      wallSideMaterial,
    ];
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterials);
    body.position.y = buildingHeight / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    buildingGroup.add(body);

    // === FLAT ROOF WITH EDGE ===
    const roofEdgeHeight = 0.2;
    const roofGeometry = new THREE.BoxGeometry(buildingWidth + 0.3, roofEdgeHeight, buildingDepth + 0.3);
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = buildingHeight + roofEdgeHeight / 2;
    roof.castShadow = true;
    buildingGroup.add(roof);

    const corniceGeometry = new THREE.BoxGeometry(buildingWidth + 0.4, 0.1, buildingDepth + 0.4);
    const cornice = new THREE.Mesh(corniceGeometry, roofMaterial);
    cornice.position.y = buildingHeight;
    buildingGroup.add(cornice);

    // === DOOR ===
    const doorWidth = 0.7;
    const doorHeight = 1.3;
    const frontZ = buildingDepth / 2;

    const doorFrameGeometry = new THREE.BoxGeometry(doorWidth + 0.15, doorHeight + 0.1, 0.1);
    const doorFrame = new THREE.Mesh(doorFrameGeometry, roofMaterial);
    doorFrame.position.set(0, doorHeight / 2 + 0.05, frontZ + 0.02);
    buildingGroup.add(doorFrame);

    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.08);
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, doorHeight / 2, frontZ + 0.05);
    buildingGroup.add(door);

    const handleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0.2, doorHeight / 2, frontZ + 0.12);
    buildingGroup.add(handle);

    // === WINDOWS ===
    const windowWidth = 0.4;
    const windowHeight = 0.4;

    const createWindow = (x: number, y: number, z: number) => {
      const frameGeometry = new THREE.BoxGeometry(windowWidth + 0.08, windowHeight + 0.08, 0.05);
      const frame = new THREE.Mesh(frameGeometry, windowFrameMaterial);
      frame.position.set(x, y, z);
      buildingGroup.add(frame);

      const glassGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, 0.06);
      const glass = new THREE.Mesh(glassGeometry, windowMaterial);
      glass.position.set(x, y, z + 0.02);
      buildingGroup.add(glass);

      const barHGeometry = new THREE.BoxGeometry(windowWidth, 0.03, 0.02);
      const barH = new THREE.Mesh(barHGeometry, windowFrameMaterial);
      barH.position.set(x, y, z + 0.05);
      buildingGroup.add(barH);

      const barVGeometry = new THREE.BoxGeometry(0.03, windowHeight, 0.02);
      const barV = new THREE.Mesh(barVGeometry, windowFrameMaterial);
      barV.position.set(x, y, z + 0.05);
      buildingGroup.add(barV);
    };

    const windowXPositions = [-0.9, 0, 0.9];
    const windowYPositions = [1.2, 2.4, 3.6];

    windowYPositions.forEach((y, rowIndex) => {
      windowXPositions.forEach((x, colIndex) => {
        if (rowIndex === 0 && colIndex === 1) return;
        createWindow(x, y, frontZ + 0.02);
      });
    });

    // Side windows
    const sideZ = [-0.5, 0.5];
    windowYPositions.forEach((y) => {
      sideZ.forEach((z) => {
        const frameR = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, windowHeight + 0.08, windowWidth + 0.08),
          windowFrameMaterial
        );
        frameR.position.set(buildingWidth / 2 + 0.02, y, z);
        buildingGroup.add(frameR);

        const glassR = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, windowHeight, windowWidth),
          windowMaterial
        );
        glassR.position.set(buildingWidth / 2 + 0.04, y, z);
        buildingGroup.add(glassR);
      });
    });

    // === GROUND SHADOW ===
    const shadowGeometry = new THREE.PlaneGeometry(4, 3);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.25,
    });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0.3, 0.01, 0.3);
    buildingGroup.add(shadow);

    buildingGroup.position.y = -2;
    scene.add(buildingGroup);

    camera.position.set(4, 5, 7);
    camera.lookAt(0, 1.5, 0);

    sceneRef.current = {
      renderer,
      buildingGroup,
    };

    let animationId: number;
    let time = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.016;

      buildingGroup.rotation.y = Math.sin(time * 0.5) * 0.1;
      buildingGroup.position.y = -2 + Math.sin(time * 0.8) * 0.04;

      renderer.render(scene, camera);
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
            child.material.forEach((m) => m.dispose());
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