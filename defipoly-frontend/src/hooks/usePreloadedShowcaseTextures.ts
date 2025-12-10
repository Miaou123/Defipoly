import { useMemo, useEffect } from 'react';
import { getPresetById } from '@/utils/themePresets';
import { SHOWCASE_SCENES } from '@/utils/showcaseScenes';
import * as THREE from 'three';

// Cache for preloaded textures (data URLs)
const textureCache = new Map<string, string>();

// Cache for THREE.js texture objects
const threeTextureCache = new Map<string, THREE.Texture>();

/**
 * Generate a texture from colors synchronously (faster than toDataURL)
 */
function generateTexture(colors: [string, string], size: number): string {
  const cacheKey = `${colors[0]}-${colors[1]}-${size}`;
  
  // Return cached if available
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }
  
  // Generate new texture
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.warn('Could not get canvas context for texture generation');
    return '';
  }
  
  // Create diagonal gradient (135deg)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  
  // Fill canvas with gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Convert to data URL and cache it
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  textureCache.set(cacheKey, dataUrl);
  
  return dataUrl;
}

/**
 * Generate a solid color texture
 */
function generateSolidTexture(color: string, size: number): string {
  const cacheKey = `solid-${color}-${size}`;
  
  // Return cached if available
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }
  
  // Generate new texture
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.warn('Could not get canvas context for solid texture generation');
    return '';
  }
  
  // Fill with solid color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  
  // Convert to data URL and cache it
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  textureCache.set(cacheKey, dataUrl);
  
  return dataUrl;
}

/**
 * Create THREE.js texture from data URL
 */
function createThreeTexture(dataUrl: string): THREE.Texture {
  const cacheKey = `three-${dataUrl}`;
  
  // Return cached if available
  if (threeTextureCache.has(cacheKey)) {
    return threeTextureCache.get(cacheKey)!;
  }
  
  // Create new THREE.js texture
  const loader = new THREE.TextureLoader();
  const texture = loader.load(dataUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  texture.flipY = false; // Important for consistent orientation
  
  // Cache it
  threeTextureCache.set(cacheKey, texture);
  
  return texture;
}

/**
 * Hook that preloads all showcase textures for instant access
 */
export function usePreloadedShowcaseTextures(): Record<string, { board: string; property: string; boardTexture?: THREE.Texture; propertyTexture?: THREE.Texture }> {
  const preloadedData = useMemo(() => {
    const preloadedTextures: Record<string, { board: string; property: string; boardTexture?: THREE.Texture; propertyTexture?: THREE.Texture }> = {};
    
    // Preload textures for all showcase scenes
    SHOWCASE_SCENES.forEach(scene => {
      const preset = getPresetById(scene.themePresetId);
      if (preset) {
        const boardDataUrl = generateTexture(preset.colors, 512);
        const propertyDataUrl = generateSolidTexture(preset.colors[0], 256);
        
        preloadedTextures[scene.themePresetId] = {
          board: boardDataUrl,
          property: propertyDataUrl,
          boardTexture: createThreeTexture(boardDataUrl),
          propertyTexture: createThreeTexture(propertyDataUrl)
        };
      }
    });
    
    return preloadedTextures;
  }, []); // Empty dependency array - only run once
  
  return preloadedData;
}

/**
 * Clear the texture cache (for memory management)
 */
export function clearTextureCache(): void {
  textureCache.clear();
  
  // Dispose of THREE.js textures properly
  threeTextureCache.forEach(texture => {
    texture.dispose();
  });
  threeTextureCache.clear();
}