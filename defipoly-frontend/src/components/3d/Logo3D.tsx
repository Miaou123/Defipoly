'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Logo3DProps {
  size?: number;
}

export function Logo3D({ size = 160 }: Logo3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Already initialized - skip
    if (sceneRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    
    // Add better WebGL context options
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "default"
    });
    
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);
    
    const fillLight = new THREE.DirectionalLight(0xb494d4, 0.5);
    fillLight.position.set(-4, 3, 2);
    scene.add(fillLight);
    
    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.4);
    rimLight.position.set(0, 2, -5);
    scene.add(rimLight);

    const bounceLight = new THREE.DirectionalLight(0x6644aa, 0.2);
    bounceLight.position.set(0, -3, 0);
    scene.add(bounceLight);

    const hatGroup = new THREE.Group();

    // Materials
    const purpleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4D2783,
      roughness: 0.7,
      metalness: 0.0
    });

    const goldMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFBD32,
      roughness: 0.2,
      metalness: 0.8
    });

    const innerMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a1548,
      roughness: 0.4,
      metalness: 0.1
    });

    // Crown
    const crownHeight = 1.8;
    const crownRadius = 1;
    const crownRadiusTop = 0.95;

    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(crownRadiusTop, crownRadius, crownHeight, 64),
      purpleMaterial
    );
    crown.position.y = crownHeight / 2 + 0.15;
    hatGroup.add(crown);

    // Flat top
    const topCap = new THREE.Mesh(
      new THREE.CircleGeometry(crownRadiusTop, 64),
      purpleMaterial
    );
    topCap.rotation.x = -Math.PI / 2;
    topCap.position.y = crownHeight + 0.15;
    hatGroup.add(topCap);

    // Inner crown
    const innerCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(crownRadius - 0.05, crownRadius - 0.05, 0.5, 64, 1, true),
      innerMaterial
    );
    innerCrown.position.y = 0.1;
    hatGroup.add(innerCrown);

    // Brim
    const brimPoints = [
      new THREE.Vector2(crownRadius - 0.02, 0.04),
      new THREE.Vector2(1.6, 0.04),
      new THREE.Vector2(1.7, 0),
      new THREE.Vector2(1.6, -0.04),
      new THREE.Vector2(crownRadius - 0.02, -0.04),
    ];
    const brim = new THREE.Mesh(
      new THREE.LatheGeometry(brimPoints, 64),
      purpleMaterial
    );
    brim.position.y = 0.15;
    hatGroup.add(brim);

    // Gold band
    const bandHeight = 0.35;
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(crownRadius + 0.025, crownRadius + 0.025, bandHeight, 64, 1, true),
      goldMaterial
    );
    band.position.y = 0.15 + bandHeight / 2 + 0.05;
    hatGroup.add(band);

    // Band edges
    const bandTop = new THREE.Mesh(
      new THREE.TorusGeometry(crownRadius + 0.025, 0.02, 8, 64),
      goldMaterial
    );
    bandTop.rotation.x = Math.PI / 2;
    bandTop.position.y = 0.15 + bandHeight + 0.05;
    hatGroup.add(bandTop);

    const bandBottom = new THREE.Mesh(
      new THREE.TorusGeometry(crownRadius + 0.025, 0.02, 8, 64),
      goldMaterial
    );
    bandBottom.rotation.x = Math.PI / 2;
    bandBottom.position.y = 0.2;
    hatGroup.add(bandBottom);

    // Small knot
    const knot = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.2, 0.08),
      goldMaterial
    );
    knot.position.set(0, 0.38, crownRadius + 0.05);
    hatGroup.add(knot);

    hatGroup.rotation.x = 0.2;
    hatGroup.rotation.z = 0.08;
    scene.add(hatGroup);

    camera.position.set(0, 1.8, 6);
    camera.lookAt(0, 1, 0);

    const animate = (): void => {
      const currentAnimationId = requestAnimationFrame(animate);
      
      // Check if renderer context is still valid
      if (!renderer.domElement || renderer.getContext().isContextLost()) {
        return;
      }
      
      hatGroup.rotation.y += 0.008;
      
      try {
        renderer.render(scene, camera);
      } catch (error) {
        console.warn('WebGL render error in Logo3D:', error);
        cancelAnimationFrame(currentAnimationId);
      }
    };
    
    const initialAnimationId = requestAnimationFrame(animate);

    // Store refs for cleanup
    sceneRef.current = { renderer, animationId: initialAnimationId };

    return () => {
      // Cancel animation
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      
      // Dispose geometries and materials
      hatGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      
      // Dispose renderer and remove canvas
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