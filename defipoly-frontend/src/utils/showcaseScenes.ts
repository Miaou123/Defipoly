import { THEME_PRESETS } from './themePresets';
import { PROPERTIES } from './constants';

// Types
export interface MockOwnership {
  propertyId: number;
  slotsOwned: number; // determines building level (1-5)
  owner: string; // mock wallet address
}

export interface ShowcaseSceneConfig {
  id: string;
  name: string;
  duration: number; // seconds
  themePresetId: string; // from THEME_PRESETS
  ownershipConfig: {
    avgLevel: number;
    coverage: number;
    brownToGreenBias?: boolean;
    level5Percentage?: number;
  };
  bankDisplayValue: number;
  cameraAnimation: 'orbit' | 'slow-zoom' | 'pan-left' | 'pan-right';
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

// Function to generate a ShowcaseScene from config (generates fresh ownerships each time)
export function generateShowcaseScene(config: ShowcaseSceneConfig): ShowcaseScene {
  const { ownershipConfig } = config;
  
  let mockOwnerships: MockOwnership[];
  if (ownershipConfig.brownToGreenBias || ownershipConfig.level5Percentage) {
    mockOwnerships = generateFocusedMockOwnerships({
      avgLevel: ownershipConfig.avgLevel,
      coverage: ownershipConfig.coverage,
      brownToGreenBias: ownershipConfig.brownToGreenBias || false,
      level5Percentage: ownershipConfig.level5Percentage,
    });
  } else {
    mockOwnerships = generateMockOwnerships({
      avgLevel: ownershipConfig.avgLevel,
      coverage: ownershipConfig.coverage,
    });
  }
  
  return {
    id: config.id,
    name: config.name,
    duration: config.duration,
    themePresetId: config.themePresetId,
    mockOwnerships,
    bankDisplayValue: config.bankDisplayValue,
    cameraAnimation: config.cameraAnimation,
  };
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
  const totalProperties = 22;
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
    
    // Generate level with improved variance around avgLevel for better showcase
    let level = avgLevel;
    if (avgLevel >= 3) {
      // For higher average levels (3+), create more variety
      // 40% chance at avgLevel, 30% chance at avgLevel±1, 15% chance at min/max
      const rand = Math.random();
      if (rand < 0.4) {
        level = Math.round(avgLevel);
      } else if (rand < 0.7) {
        level = Math.round(avgLevel) + (Math.random() < 0.5 ? -1 : 1);
      } else if (rand < 0.85) {
        level = Math.max(Math.round(avgLevel) - 2, 1);
      } else {
        level = Math.min(Math.round(avgLevel) + 1, 5);
      }
      level = Math.max(1, Math.min(5, level));
    } else if (avgLevel > 1 && avgLevel < 3) {
      // For mid levels, use the original variance
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

// Generate mock ownerships with higher level buildings focused on brown to green properties (0-19)
export function generateFocusedMockOwnerships(config: {
  avgLevel: number; // 1-5
  coverage: number; // 0-1, what percentage of properties are "owned"
  brownToGreenBias: boolean; // true to focus high-level buildings on brown to green (0-19)
  level5Percentage?: number; // 0-1, what percentage should be level 5 (for final empire scene)
}): MockOwnership[] {
  const { avgLevel, coverage, brownToGreenBias, level5Percentage } = config;
  const ownerships: MockOwnership[] = [];
  
  // Total properties (excluding corners) 
  const totalProperties = 22;
  const ownedCount = Math.floor(totalProperties * coverage);
  
  // Brown to Green properties are IDs 0-19 (20 properties)
  const brownToGreenProperties = Array.from({ length: 20 }, (_, i) => i);
  const darkBlueProperties = [20, 21]; // Park Place and Boardwalk
  
  // Create a shuffled array of property IDs with bias toward brown-green
  const propertyIds: number[] = [];
  
  if (brownToGreenBias && ownedCount > 0) {
    // Prioritize brown to green properties for ownership
    const brownToGreenOwned = Math.min(Math.ceil(ownedCount * 0.8), 20); // 80% from brown-green
    const otherOwned = ownedCount - brownToGreenOwned;
    
    // Shuffle brown to green properties
    const shuffledBrownGreen = [...brownToGreenProperties];
    for (let i = shuffledBrownGreen.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledBrownGreen[i], shuffledBrownGreen[j]] = [shuffledBrownGreen[j], shuffledBrownGreen[i]];
    }
    
    // Add prioritized brown-green properties
    propertyIds.push(...shuffledBrownGreen.slice(0, brownToGreenOwned));
    
    // Add some other properties if needed
    if (otherOwned > 0) {
      const shuffledOthers = [...darkBlueProperties];
      for (let i = shuffledOthers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOthers[i], shuffledOthers[j]] = [shuffledOthers[j], shuffledOthers[i]];
      }
      propertyIds.push(...shuffledOthers.slice(0, Math.min(otherOwned, 2)));
    }
  } else {
    // Original random distribution
    const allProperties = Array.from({ length: totalProperties }, (_, i) => i);
    for (let i = allProperties.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allProperties[i], allProperties[j]] = [allProperties[j], allProperties[i]];
    }
    propertyIds.push(...allProperties.slice(0, ownedCount));
  }
  
  // Generate ownerships for the selected properties
  for (let i = 0; i < propertyIds.length; i++) {
    const propertyId = propertyIds[i];
    const isBrownToGreen = propertyId >= 0 && propertyId <= 19;
    
    let level = avgLevel;
    
    // Special handling for level 5 percentage in final empire scene
    if (level5Percentage && level5Percentage > 0) {
      if (Math.random() < level5Percentage) {
        level = 5;
      } else {
        // For non-level-5 buildings, distribute between 3-4
        level = Math.random() < 0.6 ? 4 : 3;
      }
    } else if (brownToGreenBias && isBrownToGreen && avgLevel >= 3) {
      // Focus high-level buildings on brown to green properties
      // 50% chance of level 4-5, 30% chance of level 3, 20% chance of level 1-2
      const rand = Math.random();
      if (rand < 0.25) {
        level = 5; // 25% level 5
      } else if (rand < 0.5) {
        level = 4; // 25% level 4
      } else if (rand < 0.8) {
        level = 3; // 30% level 3
      } else {
        level = Math.random() < 0.5 ? 2 : 1; // 20% level 1-2
      }
    } else if (avgLevel >= 3) {
      // Use original enhanced algorithm for other properties
      const rand = Math.random();
      if (rand < 0.4) {
        level = Math.round(avgLevel);
      } else if (rand < 0.7) {
        level = Math.round(avgLevel) + (Math.random() < 0.5 ? -1 : 1);
      } else if (rand < 0.85) {
        level = Math.max(Math.round(avgLevel) - 2, 1);
      } else {
        level = Math.min(Math.round(avgLevel) + 1, 5);
      }
      level = Math.max(1, Math.min(5, level));
    } else if (avgLevel > 1 && avgLevel < 3) {
      // For mid levels, use the original variance
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

// Debug function to test the generation (can be removed later)
export function testGenerations() {
  console.log('=== Testing Showcase Generations ===');
  
  const regularEmpire = generateMockOwnerships({ avgLevel: 5, coverage: 1.0 });
  const focusedEmpire = generateFocusedMockOwnerships({ 
    avgLevel: 5, 
    coverage: 1.0, 
    brownToGreenBias: true,
    level5Percentage: 0.7 
  });
  
  console.log('Regular Empire - Level 5 count:', regularEmpire.filter(o => o.slotsOwned === 5).length);
  console.log('Focused Empire - Level 5 count:', focusedEmpire.filter(o => o.slotsOwned === 5).length);
  console.log('Focused Empire - Brown-Green Level 5:', focusedEmpire.filter(o => o.propertyId <= 19 && o.slotsOwned === 5).length);
  console.log('Focused Empire - Total properties:', focusedEmpire.length);
}

// Predefined scene configurations
export const SHOWCASE_SCENE_CONFIGS: ShowcaseSceneConfig[] = [
  {
    id: 'intro',
    name: 'Welcome to Defipoly',
    duration: 1.5,
    themePresetId: 'current-purple',
    ownershipConfig: { avgLevel: 0, coverage: 0 },
    bankDisplayValue: 0,
    cameraAnimation: 'orbit',
  },
  {
    id: 'first-purchase',
    name: 'First Properties',
    duration: 1.2,
    themePresetId: 'midnight',
    ownershipConfig: { avgLevel: 1, coverage: 0.2 },
    bankDisplayValue: 500,
    cameraAnimation: 'orbit',
  },
  {
    id: 'growing',
    name: 'Growing Empire',
    duration: 1.2,
    themePresetId: 'ocean',
    ownershipConfig: { avgLevel: 2, coverage: 0.4 },
    bankDisplayValue: 5000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'expanding',
    name: 'Expanding Portfolio',
    duration: 1.2,
    themePresetId: 'teal',
    ownershipConfig: { avgLevel: 2.5, coverage: 0.55 },
    bankDisplayValue: 15000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'upgrades',
    name: 'Upgrading Properties',
    duration: 1.2,
    themePresetId: 'forest',
    ownershipConfig: { avgLevel: 3, coverage: 0.6 },
    bankDisplayValue: 30000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'complete-sets',
    name: 'Complete Sets Bonus',
    duration: 1.2,
    themePresetId: 'sunset',
    ownershipConfig: { 
      avgLevel: 3.5, 
      coverage: 0.7, 
      brownToGreenBias: true 
    },
    bankDisplayValue: 75000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'premium-buildings',
    name: 'Premium Buildings',
    duration: 1.2,
    themePresetId: 'amber',
    ownershipConfig: { 
      avgLevel: 4, 
      coverage: 0.65, 
      brownToGreenBias: true 
    },
    bankDisplayValue: 150000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'mansion',
    name: 'Luxury Mansions',
    duration: 1.2,
    themePresetId: 'soft-lavender',
    ownershipConfig: { 
      avgLevel: 4.5, 
      coverage: 0.75, 
      brownToGreenBias: true 
    },
    bankDisplayValue: 300000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'skyscrapers',
    name: 'Towering Skyscrapers',
    duration: 1.2,
    themePresetId: 'slate',
    ownershipConfig: { 
      avgLevel: 5, 
      coverage: 0.8, 
      brownToGreenBias: true 
    },
    bankDisplayValue: 750000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'empire',
    name: 'Full Empire',
    duration: 5,
    themePresetId: 'coffee',
    ownershipConfig: { 
      avgLevel: 5, 
      coverage: 1.0, 
      brownToGreenBias: true,
      level5Percentage: 0.8
    },
    bankDisplayValue: 2000000,
    cameraAnimation: 'orbit',
  },
];

// Generate actual showcase scenes (called each time to get fresh random results)
export const getShowcaseScenes = (): ShowcaseScene[] => {
  return SHOWCASE_SCENE_CONFIGS.map(config => generateShowcaseScene(config));
};

// Import property data to get maxPerPlayer values (imported at top)

// Create hardcoded ownerships with guaranteed high-level buildings for final scenes
function createEmpireOwnerships(): MockOwnership[] {
  const ownerships: MockOwnership[] = [];
  
  // All 22 properties owned, with focus on level 5 in brown-green (0-19)
  for (let i = 0; i < 22; i++) {
    const property = PROPERTIES[i];
    const maxPerPlayer = property.maxPerPlayer;
    
    let slotsOwned: number;
    
    if (i <= 19) { // Brown to Green properties
      // 80% level 5, 15% level 4, 5% level 3
      const rand = Math.random();
      if (rand < 0.8) {
        slotsOwned = maxPerPlayer; // Level 5: 100% of maxPerPlayer
      } else if (rand < 0.95) {
        slotsOwned = Math.ceil(maxPerPlayer * 0.8); // Level 4: 80% of maxPerPlayer  
      } else {
        slotsOwned = Math.ceil(maxPerPlayer * 0.6); // Level 3: 60% of maxPerPlayer
      }
    } else { // Dark Blue properties (20-21)
      // Also make these high level
      if (Math.random() < 0.7) {
        slotsOwned = maxPerPlayer; // Level 5
      } else {
        slotsOwned = Math.ceil(maxPerPlayer * 0.8); // Level 4
      }
    }
    
    ownerships.push({
      propertyId: i,
      slotsOwned,
      owner: MOCK_WALLETS[i % MOCK_WALLETS.length],
    });
  }
  
  return ownerships;
}

function createSkyscraperOwnerships(): MockOwnership[] {
  const ownerships: MockOwnership[] = [];
  
  // 80% of properties owned (about 18 properties)
  const ownedProperties = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]; // All brown-green
  
  for (const propertyId of ownedProperties) {
    const property = PROPERTIES[propertyId];
    const maxPerPlayer = property.maxPerPlayer;
    
    let slotsOwned: number;
    // 60% level 5, 30% level 4, 10% level 3
    const rand = Math.random();
    if (rand < 0.6) {
      slotsOwned = maxPerPlayer; // Level 5: 100% of maxPerPlayer
    } else if (rand < 0.9) {
      slotsOwned = Math.ceil(maxPerPlayer * 0.8); // Level 4: 80% of maxPerPlayer
    } else {
      slotsOwned = Math.ceil(maxPerPlayer * 0.6); // Level 3: 60% of maxPerPlayer
    }
    
    ownerships.push({
      propertyId,
      slotsOwned,
      owner: MOCK_WALLETS[propertyId % MOCK_WALLETS.length],
    });
  }
  
  return ownerships;
}

function createMansionOwnerships(): MockOwnership[] {
  const ownerships: MockOwnership[] = [];
  
  // 75% of properties owned (about 16-17 properties), focus on brown-green
  const ownedProperties = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]; // Mix of brown-green
  
  for (const propertyId of ownedProperties) {
    const property = PROPERTIES[propertyId];
    const maxPerPlayer = property.maxPerPlayer;
    
    let slotsOwned: number;
    if (propertyId <= 19) { // Brown-green properties
      // 40% level 4, 30% level 5, 20% level 3, 10% level 2
      const rand = Math.random();
      if (rand < 0.4) {
        slotsOwned = Math.ceil(maxPerPlayer * 0.8); // Level 4: 80% of maxPerPlayer
      } else if (rand < 0.7) {
        slotsOwned = maxPerPlayer; // Level 5: 100% of maxPerPlayer
      } else if (rand < 0.9) {
        slotsOwned = Math.ceil(maxPerPlayer * 0.6); // Level 3: 60% of maxPerPlayer
      } else {
        slotsOwned = Math.ceil(maxPerPlayer * 0.4); // Level 2: 40% of maxPerPlayer
      }
    } else {
      if (Math.random() < 0.5) {
        slotsOwned = Math.ceil(maxPerPlayer * 0.8); // Level 4
      } else {
        slotsOwned = Math.ceil(maxPerPlayer * 0.6); // Level 3
      }
    }
    
    ownerships.push({
      propertyId,
      slotsOwned,
      owner: MOCK_WALLETS[propertyId % MOCK_WALLETS.length],
    });
  }
  
  return ownerships;
}

// Override the final scenes with hardcoded high-level buildings
const HARDCODED_FINAL_SCENES: ShowcaseScene[] = [
  {
    id: 'mansion',
    name: 'Luxury Mansions',
    duration: 1.2,
    themePresetId: 'soft-lavender',
    mockOwnerships: createMansionOwnerships(),
    bankDisplayValue: 300000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'skyscrapers',
    name: 'Towering Skyscrapers',
    duration: 1.2,
    themePresetId: 'slate',
    mockOwnerships: createSkyscraperOwnerships(),
    bankDisplayValue: 750000,
    cameraAnimation: 'orbit',
  },
  {
    id: 'empire',
    name: 'Full Empire',
    duration: 5,
    themePresetId: 'coffee',
    mockOwnerships: createEmpireOwnerships(),
    bankDisplayValue: 2000000,
    cameraAnimation: 'orbit',
  },
];

// Generate the early scenes and combine with hardcoded final scenes
export const SHOWCASE_SCENES: ShowcaseScene[] = [
  ...SHOWCASE_SCENE_CONFIGS.slice(0, 7).map(config => generateShowcaseScene(config)), // First 7 scenes
  ...HARDCODED_FINAL_SCENES, // Last 3 scenes with guaranteed high-level buildings
];