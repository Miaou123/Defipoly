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
    name: 'Default Purple',
    background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.8), rgba(109, 40, 217, 0.6))',
    border: 'border border-purple-400/50',
    textColor: 'text-white',
    accent: 'text-purple-300'
  },
  {
    id: 'neon',
    name: 'Neon Pink',
    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.7))',
    border: 'border border-purple-400/50',
    textColor: 'text-white',
    accent: 'text-pink-300'
  },
  {
    id: 'gold',
    name: 'Golden Glow',
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.7))',
    border: 'border border-yellow-400/50',
    textColor: 'text-white',
    accent: 'text-yellow-300'
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(34, 197, 94, 0.7))',
    border: 'border border-emerald-400/50',
    textColor: 'text-white',
    accent: 'text-emerald-300'
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(14, 165, 233, 0.7))',
    border: 'border border-blue-400/50',
    textColor: 'text-white',
    accent: 'text-blue-300'
  },
  {
    id: 'fire',
    name: 'Fire Red',
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.7))',
    border: 'border border-red-400/50',
    textColor: 'text-white',
    accent: 'text-red-300'
  },
  {
    id: 'minimal',
    name: 'Clean White',
    background: 'rgba(255, 255, 255, 0.95)',
    border: 'border-2 border-gray-800',
    textColor: 'text-gray-900',
    accent: 'text-gray-700'
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.9))',
    border: 'border border-gray-600/50',
    textColor: 'text-white',
    accent: 'text-gray-300'
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