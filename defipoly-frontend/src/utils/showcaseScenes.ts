import { THEME_PRESETS } from './themePresets';

// Types
export interface MockOwnership {
  propertyId: number;
  slotsOwned: number; // determines building level (1-5)
  owner: string; // mock wallet address
}

export interface ShowcaseScene {
  id: string;
  name: string;
  duration: number; // seconds
  themePresetId: string; // from THEME_PRESETS
  mockOwnerships: MockOwnership[];
  bankDisplayValue: number;
  cameraAnimation: 'orbit' | 'slow-zoom' | 'pan-left' | 'pan-right';
}

// Generate mock wallet addresses for variety
const MOCK_WALLETS = [
  'Demo1...wxyz',
  'Demo2...abcd',
  'Demo3...efgh',
  'Demo4...ijkl',
  'Demo5...mnop',
];

// Generate mock ownerships with specified building level distribution
export function generateMockOwnerships(config: {
  avgLevel: number; // 1-5
  coverage: number; // 0-1, what percentage of properties are "owned"
}): MockOwnership[] {
  const { avgLevel, coverage } = config;
  const ownerships: MockOwnership[] = [];
  
  // Total properties (excluding corners)
  const totalProperties = 24;
  const ownedCount = Math.floor(totalProperties * coverage);
  
  // Create a shuffled array of property IDs
  const propertyIds = Array.from({ length: totalProperties }, (_, i) => i);
  for (let i = propertyIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [propertyIds[i], propertyIds[j]] = [propertyIds[j], propertyIds[i]];
  }
  
  // Generate ownerships for the owned properties
  for (let i = 0; i < ownedCount; i++) {
    const propertyId = propertyIds[i];
    
    // Generate level with variance around avgLevel
    let level = avgLevel;
    if (avgLevel > 1 && avgLevel < 5) {
      const variance = Math.random() * 2 - 1; // -1 to 1
      level = Math.max(1, Math.min(5, Math.round(avgLevel + variance)));
    }
    
    ownerships.push({
      propertyId,
      slotsOwned: level,
      owner: MOCK_WALLETS[Math.floor(Math.random() * MOCK_WALLETS.length)],
    });
  }
  
  return ownerships;
}

// Predefined scenes for the showcase
export const SHOWCASE_SCENES: ShowcaseScene[] = [
  {
    id: 'intro',
    name: 'Welcome to Defipoly',
    duration: 1.5,
    themePresetId: 'deepPurple', // default look
    mockOwnerships: generateMockOwnerships({ avgLevel: 0, coverage: 0 }),
    bankDisplayValue: 0,
    cameraAnimation: 'orbit',
  },
  {
    id: 'first-purchase',
    name: 'First Properties',
    duration: 1.2,
    themePresetId: 'midnight',
    mockOwnerships: generateMockOwnerships({ avgLevel: 1, coverage: 0.2 }),
    bankDisplayValue: 500,
    cameraAnimation: 'orbit',
  },
  {
    id: 'growing',
    name: 'Growing Empire',
    duration: 1.2,
    themePresetId: 'ocean',
    mockOwnerships: generateMockOwnerships({ avgLevel: 2, coverage: 0.4 }),
    bankDisplayValue: 5000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'upgrades',
    name: 'Upgrading Properties',
    duration: 1.2,
    themePresetId: 'forest',
    mockOwnerships: generateMockOwnerships({ avgLevel: 3, coverage: 0.5 }),
    bankDisplayValue: 25000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'complete-sets',
    name: 'Complete Sets Bonus',
    duration: 1.2,
    themePresetId: 'sunset',
    mockOwnerships: generateMockOwnerships({ avgLevel: 3, coverage: 0.7 }),
    bankDisplayValue: 75000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'mansion',
    name: 'Luxury Mansions',
    duration: 1.2,
    themePresetId: 'lavender',
    mockOwnerships: generateMockOwnerships({ avgLevel: 4, coverage: 0.6 }),
    bankDisplayValue: 150000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'skyscrapers',
    name: 'Towering Skyscrapers',
    duration: 1.2,
    themePresetId: 'slate',
    mockOwnerships: generateMockOwnerships({ avgLevel: 5, coverage: 0.5 }),
    bankDisplayValue: 500000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'empire',
    name: 'Full Empire',
    duration: 1.5,
    themePresetId: 'coffee',
    mockOwnerships: generateMockOwnerships({ avgLevel: 5, coverage: 1.0 }),
    bankDisplayValue: 1000000,
    cameraAnimation: 'orbit',
  },
];