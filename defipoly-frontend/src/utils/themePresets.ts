export interface ThemePreset {
  id: string;
  name: string;
  category: 'dark' | 'medium' | 'light';
  scene: [string, string]; // [top, mid] gradient colors
  board: [string, string]; // [primary, secondary] gradient colors
  tile: string; // solid color
}

export const THEME_PRESETS: ThemePreset[] = [
  // Dark themes
  { id: 'current-purple', name: 'Current Purple', category: 'dark', scene: ['#0a0015', '#1a0a2e'], board: ['#5E3D6E', '#4A2C5A'], tile: '#1f2937' },
  { id: 'ocean-blue', name: 'Ocean Blue', category: 'dark', scene: ['#001524', '#0a2a3f'], board: ['#1e4d6b', '#0d3a5c'], tile: '#0c2a3d' },
  { id: 'emerald', name: 'Emerald', category: 'dark', scene: ['#001a0d', '#0a2e1a'], board: ['#0f5132', '#0a3b24'], tile: '#0d2818' },
  { id: 'sunset', name: 'Sunset', category: 'dark', scene: ['#1a0a05', '#2e1a0a'], board: ['#8b4513', '#6b3410'], tile: '#3d1f0d' },
  { id: 'midnight', name: 'Midnight', category: 'dark', scene: ['#05051a', '#0a0a2e'], board: ['#1e1e4d', '#14143a'], tile: '#0d0d2a' },
  { id: 'rose-gold', name: 'Rose Gold', category: 'dark', scene: ['#1a0f0f', '#2e1a1a'], board: ['#8b5a5a', '#6b4040'], tile: '#3d2222' },
  { id: 'cyber', name: 'Cyber', category: 'dark', scene: ['#0a0a14', '#14142e'], board: ['#2a1a4d', '#1a0f3a'], tile: '#0f0a2a' },
  { id: 'forest', name: 'Forest', category: 'dark', scene: ['#0a140a', '#142e14'], board: ['#2d4a2d', '#1f3a1f'], tile: '#0f1f0f' },
  
  // Medium themes
  { id: 'dusty-purple', name: 'Dusty Purple', category: 'medium', scene: ['#3d2a4d', '#5a4070'], board: ['#8b6aa0', '#785890'], tile: '#4a3860' },
  { id: 'teal', name: 'Teal', category: 'medium', scene: ['#1a3d3d', '#2a5555'], board: ['#4a9090', '#388080'], tile: '#2a4a4a' },
  { id: 'slate', name: 'Slate', category: 'medium', scene: ['#2d3748', '#4a5568'], board: ['#718096', '#5a6b80'], tile: '#3d4a5c' },
  { id: 'mauve', name: 'Mauve', category: 'medium', scene: ['#4a3040', '#6a4860'], board: ['#a07890', '#907080'], tile: '#5a4050' },
  { id: 'olive', name: 'Olive', category: 'medium', scene: ['#3a3d2a', '#505540'], board: ['#808860', '#707850'], tile: '#454a38' },
  { id: 'copper', name: 'Copper', category: 'medium', scene: ['#3d2a20', '#5a4030'], board: ['#b87850', '#a86840'], tile: '#4a3828' },
  
  // Light themes (muted, not washed out)
  { id: 'soft-lavender', name: 'Soft Lavender', category: 'light', scene: ['#c4b8d4', '#a898c0'], board: ['#8b6aa8', '#7a5898'], tile: '#d4c8e0' },
  { id: 'sky', name: 'Sky', category: 'light', scene: ['#a8c8d8', '#8ab4c8'], board: ['#5890a8', '#4880a0'], tile: '#b8d0dc' },
  { id: 'mint', name: 'Mint', category: 'light', scene: ['#a8d4c0', '#8ac4a8'], board: ['#4a9878', '#3a8868'], tile: '#b8dcc8' },
  { id: 'peach', name: 'Peach', category: 'light', scene: ['#dcc0a8', '#c8a890'], board: ['#c08860', '#b07850'], tile: '#e0ccb8' },
  { id: 'cream', name: 'Cream', category: 'light', scene: ['#d4c8b0', '#c0b498'], board: ['#a89870', '#988860'], tile: '#dcd4c0' },
  { id: 'blush', name: 'Blush', category: 'light', scene: ['#d4b8c0', '#c0a0ac'], board: ['#b07888', '#a06878'], tile: '#dcc4cc' },
  { id: 'pearl', name: 'Pearl', category: 'light', scene: ['#c0c0c8', '#a8a8b8'], board: ['#808898', '#707888'], tile: '#ccccd4' },
  { id: 'sand', name: 'Sand', category: 'light', scene: ['#ccc4a8', '#b8ac90'], board: ['#a89060', '#987850'], tile: '#d8d0b8' },
];

export const getPresetById = (id: string): ThemePreset | undefined => 
  THEME_PRESETS.find(p => p.id === id);

export const getPresetsByCategory = (category: ThemePreset['category']): ThemePreset[] =>
  THEME_PRESETS.filter(p => p.category === category);

// Helper function to convert preset colors to gradient strings
export const getSceneGradient = (preset: ThemePreset): string => {
  return `${preset.scene[0]},${preset.scene[1]}`;
};

export const getBoardGradient = (preset: ThemePreset): string => {
  return `${preset.board[0]},${preset.board[1]}`;
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