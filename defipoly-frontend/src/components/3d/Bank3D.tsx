'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Bank3DProps {
  size?: number;
  isPulsing?: boolean;
  rewardsAmount?: number;
  profilePicture?: string | null;
  onCollect?: () => void;
}

export function Bank3D({ 
  size = 350, 
  isPulsing = false, 
  rewardsAmount = 0,
  profilePicture = null,
  onCollect 
}: Bank3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    bankGroup: THREE.Group;
    targetScale: number;
    currentScale: number;
    counterTexture: THREE.CanvasTexture;
    counterCanvas: HTMLCanvasElement;
    profileTexture: THREE.CanvasTexture;
    profileCanvas: HTMLCanvasElement;
  } | null>(null);

  // Update counter when rewards change
  useEffect(() => {
    if (sceneRef.current) {
      const { counterCanvas, counterTexture } = sceneRef.current;
      updateCounterCanvas(counterCanvas, counterTexture, rewardsAmount);
    }
  }, [rewardsAmount]);

  // Update profile picture when it changes
  useEffect(() => {
    if (sceneRef.current) {
      const { profileCanvas, profileTexture } = sceneRef.current;
      updateProfileCanvas(profileCanvas, profileTexture, profilePicture);
    }
  }, [profilePicture]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (sceneRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
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

    const fillLight = new THREE.DirectionalLight(0xb494d4, 0.4);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 0.6);
    frontLight.position.set(0, 0, 10);
    scene.add(frontLight);

    const bankGroup = new THREE.Group();

    // === MATERIALS ===
    const purpleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x5D3A9B, roughness: 0.4, metalness: 0.1
    });
    const darkPurpleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3D2570, roughness: 0.5, metalness: 0.1
    });
    const goldMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFBD32, roughness: 0.2, metalness: 0.7
    });
    const lightPurpleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B6BC4, roughness: 0.3, metalness: 0.2
    });
    const whiteMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xE8E0F0, roughness: 0.3, metalness: 0.1
    });
    const doorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a0a2e, roughness: 0.4, metalness: 0.1
    });

    const buildingWidth = 18;
    const buildingHeight = 8;
    const buildingDepth = 10;

    // === BASE PLATFORM ===
    bankGroup.add(createMesh(new THREE.BoxGeometry(20, 0.8, 12), lightPurpleMaterial, [0, 0.4, 0]));
    bankGroup.add(createMesh(new THREE.BoxGeometry(20.4, 0.3, 12.4), darkPurpleMaterial, [0, 0.1, 0]));

    // === MAIN BUILDING BODY ===
    bankGroup.add(createMesh(new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth), purpleMaterial, [0, 4.8, 0]));

    // === COLUMNS ===
    const columnGeometry = new THREE.CylinderGeometry(0.5, 0.56, 7.2, 16);
    const columnPositions = [-8, -6, -4, 4, 6, 8];

    columnPositions.forEach(xPos => {
      bankGroup.add(createMesh(columnGeometry, whiteMaterial, [xPos, 4.4, buildingDepth/2 + 0.2]));
      bankGroup.add(createMesh(new THREE.BoxGeometry(1.2, 0.5, 1.2), lightPurpleMaterial, [xPos, 1.0, buildingDepth/2 + 0.2]));
      bankGroup.add(createMesh(new THREE.BoxGeometry(1.1, 0.36, 1.1), lightPurpleMaterial, [xPos, 8.4, buildingDepth/2 + 0.2]));
    });

    // === ROOF BEAM ===
    const beamHeight = 0.9;
    bankGroup.add(createMesh(new THREE.BoxGeometry(buildingWidth + 1.2, beamHeight, buildingDepth + 1.2), purpleMaterial, [0, 8.8 + beamHeight/2, 0]));
    bankGroup.add(createMesh(new THREE.BoxGeometry(buildingWidth + 1.4, 0.24, 0.3), goldMaterial, [0, 9.0, buildingDepth/2 + 0.76]));

    // Dentils
    for (let i = -8.4; i <= 8.4; i += 1.0) {
      bankGroup.add(createMesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), darkPurpleMaterial, [i, 8.7, buildingDepth/2 + 0.5]));
    }

    // === COUNTER SECTION ===
    const counterSectionHeight = 3.6;
    const counterSectionWidth = buildingWidth + 1.2;
    const counterSectionDepth = buildingDepth + 1.0;
    const counterSectionY = 9.7 + counterSectionHeight/2;

    bankGroup.add(createMesh(new THREE.BoxGeometry(counterSectionWidth, counterSectionHeight, counterSectionDepth), purpleMaterial, [0, counterSectionY, 0]));
    bankGroup.add(createMesh(new THREE.BoxGeometry(counterSectionWidth + 0.3, 0.2, 0.24), goldMaterial, [0, counterSectionY + counterSectionHeight/2 + 0.1, counterSectionDepth/2 + 0.16]));

    // === COUNTER DISPLAY ===
    const counterCanvas = document.createElement('canvas');
    counterCanvas.width = 900;
    counterCanvas.height = 280;
    const counterTexture = new THREE.CanvasTexture(counterCanvas);
    counterTexture.minFilter = THREE.LinearFilter;
    counterTexture.magFilter = THREE.LinearFilter;
    updateCounterCanvas(counterCanvas, counterTexture, rewardsAmount);

    const counterPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(17.0, 3.2),
      new THREE.MeshBasicMaterial({ map: counterTexture, transparent: true })
    );
    counterPanel.position.set(0, counterSectionY, counterSectionDepth/2 + 0.16);
    bankGroup.add(counterPanel);

    // === TRIANGULAR ROOF ===
    const roofBaseY = counterSectionY + counterSectionHeight/2 + 0.1;
    const peakHeight = 5.6;
    const roofHalfWidth = counterSectionWidth / 2 + 0.1;
    const roofDepth = counterSectionDepth + 0.1;

    const lf: [number, number, number] = [-roofHalfWidth, 0, roofDepth/2];
    const rf: [number, number, number] = [roofHalfWidth, 0, roofDepth/2];
    const pf: [number, number, number] = [0, peakHeight, roofDepth/2];
    const lb: [number, number, number] = [-roofHalfWidth, 0, -roofDepth/2];
    const rb: [number, number, number] = [roofHalfWidth, 0, -roofDepth/2];
    const pb: [number, number, number] = [0, peakHeight, -roofDepth/2];

    const roofVertices = new Float32Array([
      ...lf, ...rf, ...pf,
      ...rb, ...lb, ...pb,
      ...lf, ...pf, ...pb, ...pb, ...lb, ...lf,
      ...rf, ...rb, ...pb, ...pb, ...pf, ...rf,
      ...lf, ...lb, ...rb, ...rb, ...rf, ...lf,
    ]);

    const roofGeometry = new THREE.BufferGeometry();
    roofGeometry.setAttribute('position', new THREE.BufferAttribute(roofVertices, 3));
    roofGeometry.computeVertexNormals();

    const roof = new THREE.Mesh(roofGeometry, purpleMaterial);
    roof.position.set(0, roofBaseY, 0);
    bankGroup.add(roof);

    // Gold trim on roof edges
    const trimRadius = 0.12;
    const edges: [[number, number, number], [number, number, number]][] = [
      [lf, rf], [lf, pf], [rf, pf],
      [lb, rb], [lb, pb], [rb, pb],
      [lf, lb], [rf, rb], [pf, pb]
    ];
    
    edges.forEach(([p1, p2]) => {
      bankGroup.add(createTrimLine(p1, p2, trimRadius, goldMaterial, roofBaseY));
    });

    // Corner spheres
    [lf, rf, pf, lb, rb, pb].forEach(pos => {
      bankGroup.add(createCornerSphere(pos, trimRadius, goldMaterial, roofBaseY));
    });

    // === PROFILE PICTURE CIRCLE ===
    const profileRadius = 2.2;
    const profileCanvas = document.createElement('canvas');
    profileCanvas.width = 512;
    profileCanvas.height = 512;
    const profileTexture = new THREE.CanvasTexture(profileCanvas);
    updateProfileCanvas(profileCanvas, profileTexture, profilePicture);

    const profileCircle = new THREE.Mesh(
      new THREE.CircleGeometry(profileRadius, 32),
      new THREE.MeshBasicMaterial({ map: profileTexture, side: THREE.DoubleSide })
    );
    profileCircle.position.set(0, roofBaseY + peakHeight * 0.40, roofDepth/2 + 0.2);
    bankGroup.add(profileCircle);

    // Gold ring around profile
    const profileRing = new THREE.Mesh(
      new THREE.TorusGeometry(profileRadius + 0.15, 0.18, 16, 32),
      goldMaterial
    );
    profileRing.position.set(0, roofBaseY + peakHeight * 0.40, roofDepth/2 + 0.24);
    bankGroup.add(profileRing);

    // === DOOR ===
    const frontZ = buildingDepth/2;
    bankGroup.add(createMesh(new THREE.BoxGeometry(3.6, 6.4, 0.7), darkPurpleMaterial, [0, 4.0, frontZ + 0.1]));
    bankGroup.add(createMesh(new THREE.BoxGeometry(2.8, 5.6, 0.24), doorMaterial, [0, 3.6, frontZ + 0.36]));
    bankGroup.add(createMesh(new THREE.BoxGeometry(0.08, 5.6, 0.28), darkPurpleMaterial, [0, 3.6, frontZ + 0.44]));

    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.2, 8, 16, Math.PI), goldMaterial);
    arch.rotation.z = Math.PI;
    arch.position.set(0, 6.4, frontZ + 0.44);
    bankGroup.add(arch);

    bankGroup.add(createMesh(new THREE.SphereGeometry(0.16, 8, 8), goldMaterial, [-0.6, 3.4, frontZ + 0.6]));
    bankGroup.add(createMesh(new THREE.SphereGeometry(0.16, 8, 8), goldMaterial, [0.6, 3.4, frontZ + 0.6]));

    bankGroup.position.y = -6.5;
    scene.add(bankGroup);

    camera.position.set(0, 12, 60);
    camera.lookAt(0, 5.5, 0);

    // Store refs
    sceneRef.current = {
      renderer,
      bankGroup,
      targetScale: 1,
      currentScale: 1,
      counterTexture,
      counterCanvas,
      profileTexture,
      profileCanvas,
    };

    let time = 0;
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.016;

      if (!renderer.domElement || renderer.getContext()?.isContextLost()) {
        return;
      }

      if (sceneRef.current) {
        const { targetScale, currentScale } = sceneRef.current;
        const newScale = currentScale + (targetScale - currentScale) * 0.15;
        sceneRef.current.currentScale = newScale;
        bankGroup.scale.setScalar(newScale);
      }

      bankGroup.rotation.y = Math.sin(time * 0.5) * 0.1;
      bankGroup.position.y = -6.5 + Math.sin(time * 0.8) * 0.1;
      bankGroup.rotation.x = Math.sin(time * 0.6) * 0.012;

      try {
        renderer.render(scene, camera);
      } catch {
        cancelAnimationFrame(animationId);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      bankGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else if (child.material) {
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

  // Handle pulse
  useEffect(() => {
    if (sceneRef.current) {
      if (isPulsing) {
        sceneRef.current.targetScale = 1.12;
        const timeout = setTimeout(() => {
          if (sceneRef.current) sceneRef.current.targetScale = 1;
        }, 150);
        return () => clearTimeout(timeout);
      } else {
        sceneRef.current.targetScale = 1;
      }
    }
  }, [isPulsing]);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center cursor-pointer"
      onClick={onCollect}
    />
  );
}

// Helper functions
function createMesh(
  geometry: THREE.BufferGeometry, 
  material: THREE.Material, 
  position: [number, number, number]
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  return mesh;
}

function createTrimLine(
  p1: [number, number, number], 
  p2: [number, number, number], 
  radius: number, 
  material: THREE.Material, 
  baseY: number
): THREE.Mesh {
  const curve = new THREE.LineCurve3(
    new THREE.Vector3(p1[0], p1[1], p1[2]),
    new THREE.Vector3(p2[0], p2[1], p2[2])
  );
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 1, radius, 8, false), material);
  tube.position.y = baseY;
  return tube;
}

function createCornerSphere(
  pos: [number, number, number], 
  radius: number, 
  material: THREE.Material, 
  baseY: number
): THREE.Mesh {
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.3, 8, 8), material);
  sphere.position.set(pos[0], baseY + pos[1], pos[2]);
  return sphere;
}

function updateCounterCanvas(
  canvas: HTMLCanvasElement, 
  texture: THREE.CanvasTexture, 
  amount: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Dark background with rounded corners
  ctx.fillStyle = 'rgba(5, 5, 15, 0.95)';
  ctx.beginPath();
  ctx.roundRect(10, 10, w - 20, h - 20, 24);
  ctx.fill();

  // Purple border
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(10, 10, w - 20, h - 20, 24);
  ctx.stroke();

  // Corner dots
  const dotRadius = 7;
  const dotOffset = 26;
  ctx.fillStyle = '#a855f7';
  [[dotOffset, dotOffset], [w - dotOffset, dotOffset],
   [dotOffset, h - dotOffset], [w - dotOffset, h - dotOffset]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Format number
  const formatted = amount < 100000
    ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.floor(amount).toLocaleString();

  // Text with stroke outline for better visibility
  ctx.font = 'bold 100px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Dark stroke for contrast
  ctx.strokeStyle = '#0a1a2a';
  ctx.lineWidth = 8;
  ctx.strokeText(formatted, w / 2, h / 2);
  
  // Bright cyan fill
  ctx.fillStyle = '#22d3ee';
  ctx.fillText(formatted, w / 2, h / 2);

  texture.needsUpdate = true;
}

function updateProfileCanvas(
  canvas: HTMLCanvasElement, 
  texture: THREE.CanvasTexture, 
  profilePicture: string | null
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = canvas.width;
  const center = size / 2;
  const radius = 240;

  ctx.clearRect(0, 0, size, size);

  if (profilePicture) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, center - radius, center - radius, radius * 2, radius * 2);
      ctx.restore();
      
      // Purple border
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(center, center, radius - 6, 0, Math.PI * 2);
      ctx.stroke();
      
      texture.needsUpdate = true;
    };
    img.onerror = () => {
      drawDefaultLogo(ctx, center, radius);
      texture.needsUpdate = true;
    };
    img.src = profilePicture;
  } else {
    drawDefaultLogo(ctx, center, radius);
    texture.needsUpdate = true;
  }
}

function drawDefaultLogo(
  ctx: CanvasRenderingContext2D, 
  center: number, 
  radius: number
): void {
  // Dark purple background
  ctx.fillStyle = '#1a0a2e';
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw proper top hat like the SVG
  const hatColor = '#4D2783';
  const goldColor = '#FFBD32';
  
  // Hat crown (tall cylinder part) - tapers slightly at top
  const crownWidth = radius * 0.55;
  const crownTopWidth = radius * 0.50;
  const crownHeight = radius * 0.75;
  const crownTop = center - radius * 0.55;
  const crownBottom = crownTop + crownHeight;
  
  ctx.fillStyle = hatColor;
  ctx.beginPath();
  ctx.moveTo(center - crownWidth/2, crownBottom);
  ctx.lineTo(center - crownTopWidth/2, crownTop);
  ctx.quadraticCurveTo(center, crownTop - 10, center + crownTopWidth/2, crownTop);
  ctx.lineTo(center + crownWidth/2, crownBottom);
  ctx.closePath();
  ctx.fill();
  
  // Hat brim (wide curved ellipse)
  const brimWidth = radius * 1.1;
  const brimHeight = radius * 0.25;
  const brimY = crownBottom - brimHeight * 0.3;
  
  ctx.fillStyle = hatColor;
  ctx.beginPath();
  ctx.ellipse(center, brimY + brimHeight/2, brimWidth/2, brimHeight/2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Darker inner part of brim (shadow/depth)
  ctx.fillStyle = '#3D1F6B';
  ctx.beginPath();
  ctx.ellipse(center, brimY + brimHeight/2, brimWidth/2 - 8, brimHeight/2 - 4, 0, 0, Math.PI);
  ctx.fill();
  
  // Crown overlaps brim - redraw lower part of crown
  ctx.fillStyle = hatColor;
  ctx.fillRect(center - crownWidth/2, brimY, crownWidth, brimHeight * 0.6);
  
  // Gold band
  const bandHeight = radius * 0.12;
  const bandY = crownBottom - brimHeight * 0.5 - bandHeight;
  
  ctx.fillStyle = goldColor;
  ctx.fillRect(center - crownWidth/2, bandY, crownWidth, bandHeight);
  
  // Band highlight
  ctx.fillStyle = '#FFD766';
  ctx.fillRect(center - crownWidth/2, bandY, crownWidth, bandHeight * 0.3);

  // Purple border around circle
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(center, center, radius - 6, 0, Math.PI * 2);
  ctx.stroke();
}