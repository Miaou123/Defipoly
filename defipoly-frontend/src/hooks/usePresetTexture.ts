import { useMemo } from 'react';
import { THEME_PRESETS } from '@/utils/themePresets';

/**
 * Generates a texture URL from a preset ID or returns custom URL
 * 
 * Priority order:
 * 1. If customUrl is provided -> return it (custom upload takes priority)
 * 2. If presetId is provided -> generate gradient texture client-side
 * 3. Otherwise -> return null (use default)
 * 
 * @param presetId - Preset ID to generate texture from
 * @param customUrl - Custom uploaded texture URL
 * @param size - Canvas size for generated texture (default: 256x256)
 * @returns Data URL (for presets) or server URL (for custom uploads) or null
 */
export function usePresetTexture(
  presetId: string | null,
  customUrl: string | null,
  size: number = 256
): string | null {
  return useMemo(() => {
    // Custom upload takes priority, but check if it's a color format first  
    if (customUrl) {
      // Check if customUrl is in gradient format (color1,color2)
      if (customUrl.includes(',') && customUrl.split(',').length === 2) {
        const colors = customUrl.split(',').map(c => c.trim());
        // Validate that both parts look like hex colors
        const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
        if (colors[0] && colors[1] && hexColorRegex.test(colors[0]) && hexColorRegex.test(colors[1])) {
          // Generate canvas texture from gradient colors
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.warn('Could not get canvas context for gradient texture generation');
            return null;
          }
          
          // Create diagonal gradient (135deg)
          const gradient = ctx.createLinearGradient(0, 0, size, size);
          gradient.addColorStop(0, colors[0]);
          gradient.addColorStop(1, colors[1]);
          
          // Fill canvas with gradient
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, size, size);
          
          // Return as data URL
          return canvas.toDataURL('image/png');
        }
      }
      
      // Check if it's a single hex color
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (hexColorRegex.test(customUrl)) {
        // Generate canvas texture from single color
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.warn('Could not get canvas context for color texture generation');
          return null;
        }
        
        // Fill with solid color
        ctx.fillStyle = customUrl;
        ctx.fillRect(0, 0, size, size);
        
        // Return as data URL
        return canvas.toDataURL('image/png');
      }
      
      // If not color format, treat as regular URL (actual image)
      return customUrl;
    }
    
    // Generate gradient texture from preset
    if (presetId && THEME_PRESETS[presetId]) {
      const preset = THEME_PRESETS[presetId];
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.warn('Could not get canvas context for preset texture generation');
        return null;
      }
      
      // Create diagonal gradient (135deg)
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, preset.colors[0]);
      gradient.addColorStop(1, preset.colors[1]);
      
      // Fill canvas with gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      
      // Return as data URL
      const dataUrl = canvas.toDataURL('image/png');
      return dataUrl;
    }
    
    // No preset or custom URL
    return null;
  }, [presetId, customUrl, size]);
}

/**
 * Hook specifically for board textures (larger size for better quality)
 */
export function useBoardPresetTexture(
  presetId: string | null,
  customUrl: string | null
): string | null {
  const result = usePresetTexture(presetId, customUrl, 512);
  return result;
}

/**
 * Hook specifically for tile textures (smaller size for performance)
 */
export function useTilePresetTexture(
  presetId: string | null,
  customUrl: string | null
): string | null {
  return usePresetTexture(presetId, customUrl, 256);
}

/**
 * Hook for scene background textures (large size for quality)
 */
export function useScenePresetTexture(
  presetId: string | null,
  customUrl: string | null
): string | null {
  return usePresetTexture(presetId, customUrl, 512);
}