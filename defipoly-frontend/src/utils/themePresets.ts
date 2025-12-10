export interface ThemePreset {
  id: string;
  name: string;
  category: 'dark' | 'medium' | 'light';
  colors: [string, string]; // [start, end] gradient colors
  description?: string;
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  // Dark themes
  'current-purple': { id: 'current-purple', name: 'Current Purple', category: 'dark', colors: ['#0a0015', '#1a0a2e'], description: 'Classic purple depths' },
  'ocean-blue': { id: 'ocean-blue', name: 'Ocean Blue', category: 'dark', colors: ['#001524', '#0a2a3f'], description: 'Deep ocean blues' },
  'emerald': { id: 'emerald', name: 'Emerald', category: 'dark', colors: ['#001a0d', '#0a2e1a'], description: 'Rich emerald greens' },
  'midnight': { id: 'midnight', name: 'Midnight', category: 'dark', colors: ['#05051a', '#0a0a2e'], description: 'Deep midnight blue' },
  'rose-gold': { id: 'rose-gold', name: 'Rose Gold', category: 'dark', colors: ['#1a0f0f', '#2e1a1a'], description: 'Dark rose gold' },
  'cyber': { id: 'cyber', name: 'Cyber', category: 'dark', colors: ['#0a0a14', '#14142e'], description: 'Cyberpunk vibes' },
  'forest': { id: 'forest', name: 'Forest', category: 'dark', colors: ['#0a140a', '#142e14'], description: 'Dark forest greens' },
  'coffee': { id: 'coffee', name: 'Coffee', category: 'dark', colors: ['#6f4e37', '#a67b5b'], description: 'Rich coffee browns' },
  'crimson': { id: 'crimson', name: 'Crimson', category: 'dark', colors: ['#8b0000', '#dc143c'], description: 'Deep crimson red' },
  
  // Medium themes
  'dusty-purple': { id: 'dusty-purple', name: 'Dusty Purple', category: 'medium', colors: ['#3d2a4d', '#5a4070'], description: 'Muted purple tones' },
  'teal': { id: 'teal', name: 'Teal', category: 'medium', colors: ['#1a3d3d', '#2a5555'], description: 'Cool teal waters' },
  'slate': { id: 'slate', name: 'Slate', category: 'medium', colors: ['#2d3748', '#4a5568'], description: 'Modern slate grays' },
  'mauve': { id: 'mauve', name: 'Mauve', category: 'medium', colors: ['#4a3040', '#6a4860'], description: 'Elegant mauve' },
  'olive': { id: 'olive', name: 'Olive', category: 'medium', colors: ['#3a3d2a', '#505540'], description: 'Natural olive tones' },
  'copper': { id: 'copper', name: 'Copper', category: 'medium', colors: ['#3d2a20', '#5a4030'], description: 'Metallic copper' },
  'ocean': { id: 'ocean', name: 'Ocean', category: 'medium', colors: ['#0077b6', '#00b4d8'], description: 'Ocean blue waves' },
  'amber': { id: 'amber', name: 'Amber', category: 'medium', colors: ['#f59e0b', '#fbbf24'], description: 'Warm amber glow' },
  
  // Light themes
  'soft-lavender': { id: 'soft-lavender', name: 'Soft Lavender', category: 'light', colors: ['#c4b8d4', '#a898c0'], description: 'Gentle lavender' },
  'sky': { id: 'sky', name: 'Sky', category: 'light', colors: ['#a8c8d8', '#8ab4c8'], description: 'Clear sky blue' },
  'mint': { id: 'mint', name: 'Mint', category: 'light', colors: ['#a8d4c0', '#8ac4a8'], description: 'Fresh mint green' },
  'peach': { id: 'peach', name: 'Peach', category: 'light', colors: ['#dcc0a8', '#c8a890'], description: 'Warm peach tones' },
  'cream': { id: 'cream', name: 'Cream', category: 'light', colors: ['#d4c8b0', '#c0b498'], description: 'Creamy vanilla' },
  'blush': { id: 'blush', name: 'Blush', category: 'light', colors: ['#d4b8c0', '#c0a0ac'], description: 'Soft blush pink' },
  'pearl': { id: 'pearl', name: 'Pearl', category: 'light', colors: ['#c0c0c8', '#a8a8b8'], description: 'Soft pearl grays' },
  'sand': { id: 'sand', name: 'Sand', category: 'light', colors: ['#ccc4a8', '#b8ac90'], description: 'Warm sand tones' },
  'sunset': { id: 'sunset', name: 'Sunset', category: 'light', colors: ['#e07a5f', '#f2cc8f'], description: 'Warm sunset colors' },
  'rose': { id: 'rose', name: 'Rose', category: 'light', colors: ['#fda4af', '#fecaca'], description: 'Gentle rose pink' },
};

/**
 * Get a specific preset by ID
 */
export const getPresetById = (id: string): ThemePreset | null =>
  THEME_PRESETS[id] || null;

/**
 * Get all presets filtered by category
 */
export const getPresetsByCategory = (category: 'dark' | 'medium' | 'light'): ThemePreset[] =>
  Object.values(THEME_PRESETS).filter(p => p.category === category);

/**
 * Get all presets as an array
 */
export const getAllPresets = (): ThemePreset[] =>
  Object.values(THEME_PRESETS);

/**
 * Get preset categories
 */
export const getPresetCategories = (): ('dark' | 'medium' | 'light')[] =>
  ['dark', 'medium', 'light'];

/**
 * Determine writing style based on preset category
 * Dark/medium themes use light text, light themes use dark text
 */
export const getWritingStyleForPreset = (presetId: string): 'light' | 'dark' => {
  const preset = getPresetById(presetId);
  return preset?.category === 'light' ? 'dark' : 'light';
};

// Legacy compatibility functions for existing code
export const getSceneGradient = (preset: ThemePreset): string => {
  return `${preset.colors[0]},${preset.colors[1]}`;
};

export const getBoardGradient = (preset: ThemePreset): string => {
  return `${preset.colors[0]},${preset.colors[1]}`;
};

// Helper function to parse stored gradient string back to array
export const parseGradient = (gradient: string | null): [string, string] | null => {
  if (!gradient) return null;
  const colors = gradient.split(',');
  if (colors.length === 2 && colors[0] && colors[1]) {
    return [colors[0].trim(), colors[1].trim()];
  }
  return null;
};

// Create gradient CSS string from stored format
export const createGradientStyle = (gradient: string | null, direction: string = '180deg'): string => {
  const colors = parseGradient(gradient);
  if (!colors) return '';
  return `linear-gradient(${direction}, ${colors[0]} 0%, ${colors[1]} 100%)`;
};

// Create 3-point gradient for scene (matching current Board3DScene format)
export const createSceneGradientStyle = (gradient: string | null): string => {
  const colors = parseGradient(gradient);
  if (!colors) return '';
  return `linear-gradient(180deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[0]} 100%)`;
};