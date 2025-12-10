import { useMemo } from 'react';
import { getPresetById, createGradientStyle, createSceneGradientStyle } from '@/utils/themePresets';

export function useShowcaseTexture(
  presetId: string, 
  textureType: 'board' | 'property' | 'scene',
  size = 256
): string | null {
  return useMemo(() => {
    const preset = getPresetById(presetId);
    if (!preset) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Convert preset colors to gradient string format
    const gradientString = `${preset.colors[0]},${preset.colors[1]}`;
    
    // Get gradient style based on type
    let gradientStyle = '';
    if (textureType === 'scene') {
      gradientStyle = createSceneGradientStyle(gradientString);
    } else {
      gradientStyle = createGradientStyle(gradientString);
    }
    
    // Extract gradient from CSS string
    const gradientMatch = gradientStyle.match(/linear-gradient\(([^)]+)\)/);
    if (!gradientMatch) return null;
    
    // Parse gradient parameters
    const gradientParams = gradientMatch[1];
    const parts = gradientParams.split(/,\s*/);
    
    // Create canvas gradient
    let gradient;
    if (parts[0].includes('deg')) {
      // Handle angle
      const angle = parseFloat(parts[0]) * (Math.PI / 180);
      const x1 = size / 2 - Math.cos(angle + Math.PI / 2) * size / 2;
      const y1 = size / 2 - Math.sin(angle + Math.PI / 2) * size / 2;
      const x2 = size / 2 + Math.cos(angle + Math.PI / 2) * size / 2;
      const y2 = size / 2 + Math.sin(angle + Math.PI / 2) * size / 2;
      gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    } else {
      // Default diagonal gradient
      gradient = ctx.createLinearGradient(0, 0, size, size);
    }
    
    // Extract colors and add color stops
    const colors = parts.slice(parts[0].includes('deg') ? 1 : 0);
    if (colors.length === 2) {
      // Clean color values by removing percentage values
      const color1 = colors[0].trim().replace(/\s+\d+%/, '');
      const color2 = colors[1].trim().replace(/\s+\d+%/, '');
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
    } else if (colors.length > 2) {
      // Handle multiple color stops
      colors.forEach((color, index) => {
        // Clean color values by removing percentage values
        const cleanColor = color.trim().replace(/\s+\d+%/, '');
        gradient.addColorStop(index / (colors.length - 1), cleanColor);
      });
    }
    
    // Fill canvas with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    return canvas.toDataURL('image/png');
  }, [presetId, textureType, size]);
}

// Hook to preload all showcase textures
export function usePreloadShowcaseTextures(presetIds: string[]): Record<string, string | null> {
  return useMemo(() => {
    const textures: Record<string, string | null> = {};
    
    presetIds.forEach(presetId => {
      textures[`${presetId}-board`] = useShowcaseTexture(presetId, 'board', 512);
      textures[`${presetId}-property`] = useShowcaseTexture(presetId, 'property', 256);
      textures[`${presetId}-scene`] = useShowcaseTexture(presetId, 'scene', 1024);
    });
    
    return textures;
  }, [presetIds]);
}