export interface BoardTheme {
  id: string;
  name: string;
  boardBackground: string;
  propertyCardStyle: string;
}

export interface PropertyCardTheme {
  id: string;
  name: string;
  background: string;
  border: string;
  textColor: string;
  accent: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'classic',
    name: 'Classic',
    boardBackground: 'linear-gradient(135deg, rgba(12, 5, 25, 0.95), rgba(26, 11, 46, 0.9))',
    propertyCardStyle: 'default'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    boardBackground: 'linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(17, 94, 89, 0.9))',
    propertyCardStyle: 'default'
  },
  {
    id: 'fire',
    name: 'Fire',
    boardBackground: 'linear-gradient(135deg, rgba(127, 29, 29, 0.95), rgba(154, 52, 18, 0.9))',
    propertyCardStyle: 'default'
  },
  {
    id: 'dark',
    name: 'Dark',
    boardBackground: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(0, 0, 0, 0.9))',
    propertyCardStyle: 'default'
  }
];

export const PROPERTY_CARD_THEMES: PropertyCardTheme[] = [
  {
    id: 'default',
    name: 'Default',
    background: 'bg-white/10 backdrop-blur-sm',
    border: 'border border-white/20',
    textColor: 'text-white',
    accent: 'text-purple-300'
  },
  {
    id: 'neon',
    name: 'Neon',
    background: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm',
    border: 'border border-purple-400/50 shadow-lg shadow-purple-500/25',
    textColor: 'text-white',
    accent: 'text-pink-300'
  },
  {
    id: 'gold',
    name: 'Gold',
    background: 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20 backdrop-blur-sm',
    border: 'border border-yellow-400/50 shadow-lg shadow-yellow-500/25',
    textColor: 'text-white',
    accent: 'text-yellow-300'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    background: 'bg-white/95 backdrop-blur-sm',
    border: 'border-2 border-gray-800',
    textColor: 'text-gray-900',
    accent: 'text-gray-700'
  },
  {
    id: 'custom',
    name: 'Custom',
    background: 'bg-white/10 backdrop-blur-sm',
    border: 'border border-white/20',
    textColor: 'text-white',
    accent: 'text-purple-300'
  }
];

export const DEFAULT_THEME = {
  boardTheme: 'classic',
  propertyCardTheme: 'dark'
};

export function getBoardTheme(themeId: string): BoardTheme {
  return BOARD_THEMES.find(theme => theme.id === themeId) || BOARD_THEMES[0];
}

export function getPropertyCardTheme(themeId: string): PropertyCardTheme {
  return PROPERTY_CARD_THEMES.find(theme => theme.id === themeId) || PROPERTY_CARD_THEMES[0];
}