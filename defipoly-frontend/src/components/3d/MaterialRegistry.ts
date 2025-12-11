import * as THREE from 'three';

// Color schemes for different property sets
export const SET_COLOR_SCHEMES = [
  { wall: 0xE8D4B8, roof: 0x78350f, trim: 0xF5E6D3, door: 0x4A2409, accent: 0x8B4513 }, // Cream/Brown
  { wall: 0xD4E8E8, roof: 0x2F4F4F, trim: 0xF0F8FF, door: 0x2F4F4F, accent: 0x708090 }, // Blue-gray
  { wall: 0xE8E0D4, roof: 0x4A4A4A, trim: 0xF5F5F5, door: 0x333333, accent: 0x808080 }, // Gray
  { wall: 0xF5E6D3, roof: 0x8B0000, trim: 0xFFFAF0, door: 0x8B0000, accent: 0xB22222 }, // Red
  { wall: 0xE6E8D4, roof: 0x2E8B57, trim: 0xF0FFF0, door: 0x228B22, accent: 0x3CB371 }, // Green
  { wall: 0xF0E6D4, roof: 0x4B0082, trim: 0xE6E6FA, door: 0x4B0082, accent: 0x8A2BE2 }, // Purple
  { wall: 0xE8D8C8, roof: 0xD2691E, trim: 0xFFFAF0, door: 0x8B4513, accent: 0xCD853F }, // Orange
  { wall: 0xE8E8D4, roof: 0xB8860B, trim: 0xFFFACD, door: 0xDAA520, accent: 0xFFD700 }, // Gold
];

// Create materials once, reuse everywhere
function createMaterials() {
  const materials: Record<string, THREE.MeshStandardMaterial> = {};
  
  SET_COLOR_SCHEMES.forEach((scheme, index) => {
    materials[`wall_${index}`] = new THREE.MeshStandardMaterial({ 
      color: scheme.wall, 
      roughness: 0.7 
    });
    materials[`roof_${index}`] = new THREE.MeshStandardMaterial({ 
      color: scheme.roof, 
      roughness: 0.6 
    });
    materials[`trim_${index}`] = new THREE.MeshStandardMaterial({ 
      color: scheme.trim, 
      roughness: 0.5 
    });
    materials[`accent_${index}`] = new THREE.MeshStandardMaterial({ 
      color: scheme.accent, 
      roughness: 0.4 
    });
  });
  
  // Special materials
  materials['gold'] = new THREE.MeshStandardMaterial({ 
    color: 0xD4AF37, 
    metalness: 0.8, 
    roughness: 0.2 
  });
  materials['window'] = new THREE.MeshStandardMaterial({ 
    color: 0xE8F4FF, 
    emissive: 0xFFFFCC, 
    emissiveIntensity: 0.2, 
    roughness: 0.1 
  });
  
  return materials;
}

export const SHARED_MATERIALS = createMaterials();

export function getMaterialsForSet(setIndex: number) {
  const idx = setIndex % SET_COLOR_SCHEMES.length;
  return {
    wall: SHARED_MATERIALS[`wall_${idx}`]!,
    roof: SHARED_MATERIALS[`roof_${idx}`]!,
    trim: SHARED_MATERIALS[`trim_${idx}`]!,
    accent: SHARED_MATERIALS[`accent_${idx}`]!,
    gold: SHARED_MATERIALS['gold']!,
    window: SHARED_MATERIALS['window']!,
  };
}