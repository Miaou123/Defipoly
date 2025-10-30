// ============================================
// FILE: defipoly-program/scripts/property-config.ts
// SINGLE SOURCE OF TRUTH FOR ALL PROPERTY DATA
// UPDATED: Shield costs graduated from 10-17% by set
// ============================================

export interface PropertyConfig {
  id: number;
  name: string;
  setId: number;
  tier: string;
  color: string;
  maxSlots: number;
  maxPerPlayer: number;
  price: number;           // In tokens (not lamports)
  yieldBps: number;        // Basis points (600 = 6.0%)
  shieldCostBps: number;   // Basis points (1000 = 10%)
  cooldown: number;        // In hours
}

export const PROPERTY_CONFIG: PropertyConfig[] = [
  // ========== SET 0: BROWN (2 properties) - 10% ==========
  {
    id: 0,
    name: "Mediterranean Avenue",
    setId: 0,
    tier: "brown",
    color: "bg-amber-900",
    maxSlots: 600,
    maxPerPlayer: 50,
    price: 1500,
    yieldBps: 600,         // 6.0% daily yield
    shieldCostBps: 1000,   // 10% shield cost ← CHANGED
    cooldown: 6,           // 6 hours
  },
  {
    id: 1,
    name: "Baltic Avenue",
    setId: 0,
    tier: "brown",
    color: "bg-amber-900",
    maxSlots: 600,
    maxPerPlayer: 50,
    price: 1500,
    yieldBps: 600,
    shieldCostBps: 1000,   // 10% shield cost ← CHANGED
    cooldown: 6,
  },

  // ========== SET 1: LIGHT BLUE (3 properties) - 11% ==========
  {
    id: 2,
    name: "Oriental Avenue",
    setId: 1,
    tier: "lightblue",
    color: "bg-sky-300",
    maxSlots: 450,
    maxPerPlayer: 40,
    price: 3500,
    yieldBps: 650,         // 6.5% daily yield
    shieldCostBps: 1100,   // 11% shield cost ← CHANGED
    cooldown: 8,           // 8 hours
  },
  {
    id: 3,
    name: "Vermont Avenue",
    setId: 1,
    tier: "lightblue",
    color: "bg-sky-300",
    maxSlots: 450,
    maxPerPlayer: 40,
    price: 3500,
    yieldBps: 650,
    shieldCostBps: 1100,   // 11% shield cost ← CHANGED
    cooldown: 8,
  },
  {
    id: 4,
    name: "Connecticut Avenue",
    setId: 1,
    tier: "lightblue",
    color: "bg-sky-300",
    maxSlots: 450,
    maxPerPlayer: 40,
    price: 3500,
    yieldBps: 650,
    shieldCostBps: 1100,   // 11% shield cost ← CHANGED
    cooldown: 8,
  },

  // ========== SET 2: PINK (3 properties) - 12% ==========
  {
    id: 5,
    name: "St. Charles Place",
    setId: 2,
    tier: "pink",
    color: "bg-pink-400",
    maxSlots: 350,
    maxPerPlayer: 30,
    price: 7500,
    yieldBps: 700,         // 7.0% daily yield
    shieldCostBps: 1200,   // 12% shield cost ← CHANGED
    cooldown: 10,          // 10 hours
  },
  {
    id: 6,
    name: "States Avenue",
    setId: 2,
    tier: "pink",
    color: "bg-pink-400",
    maxSlots: 350,
    maxPerPlayer: 30,
    price: 7500,
    yieldBps: 700,
    shieldCostBps: 1200,   // 12% shield cost ← CHANGED
    cooldown: 10,
  },
  {
    id: 7,
    name: "Virginia Avenue",
    setId: 2,
    tier: "pink",
    color: "bg-pink-400",
    maxSlots: 350,
    maxPerPlayer: 30,
    price: 7500,
    yieldBps: 700,
    shieldCostBps: 1200,   // 12% shield cost ← CHANGED
    cooldown: 10,
  },

  // ========== SET 3: ORANGE (3 properties) - 13% ==========
  {
    id: 8,
    name: "St. James Place",
    setId: 3,
    tier: "orange",
    color: "bg-orange-500",
    maxSlots: 250,
    maxPerPlayer: 25,
    price: 15000,
    yieldBps: 750,         // 7.5% daily yield
    shieldCostBps: 1300,   // 13% shield cost ← CHANGED
    cooldown: 12,          // 12 hours
  },
  {
    id: 9,
    name: "Tennessee Avenue",
    setId: 3,
    tier: "orange",
    color: "bg-orange-500",
    maxSlots: 250,
    maxPerPlayer: 25,
    price: 15000,
    yieldBps: 750,
    shieldCostBps: 1300,   // 13% shield cost ← CHANGED
    cooldown: 12,
  },
  {
    id: 10,
    name: "New York Avenue",
    setId: 3,
    tier: "orange",
    color: "bg-orange-500",
    maxSlots: 250,
    maxPerPlayer: 25,
    price: 15000,
    yieldBps: 750,
    shieldCostBps: 1300,   // 13% shield cost ← CHANGED
    cooldown: 12,
  },

  // ========== SET 4: RED (3 properties) - 14% ==========
  {
    id: 11,
    name: "Kentucky Avenue",
    setId: 4,
    tier: "red",
    color: "bg-red-600",
    maxSlots: 180,
    maxPerPlayer: 20,
    price: 30000,
    yieldBps: 800,         // 8.0% daily yield
    shieldCostBps: 1400,   // 14% shield cost ← CHANGED
    cooldown: 16,          // 16 hours
  },
  {
    id: 12,
    name: "Indiana Avenue",
    setId: 4,
    tier: "red",
    color: "bg-red-600",
    maxSlots: 180,
    maxPerPlayer: 20,
    price: 30000,
    yieldBps: 800,
    shieldCostBps: 1400,   // 14% shield cost ← CHANGED
    cooldown: 16,
  },
  {
    id: 13,
    name: "Illinois Avenue",
    setId: 4,
    tier: "red",
    color: "bg-red-600",
    maxSlots: 180,
    maxPerPlayer: 20,
    price: 30000,
    yieldBps: 800,
    shieldCostBps: 1400,   // 14% shield cost ← CHANGED
    cooldown: 16,
  },

  // ========== SET 5: YELLOW (3 properties) - 15% ==========
  {
    id: 14,
    name: "Atlantic Avenue",
    setId: 5,
    tier: "yellow",
    color: "bg-yellow-500",
    maxSlots: 120,
    maxPerPlayer: 15,
    price: 60000,
    yieldBps: 850,         // 8.5% daily yield
    shieldCostBps: 1500,   // 15% shield cost ← CHANGED
    cooldown: 20,          // 20 hours
  },
  {
    id: 15,
    name: "Ventnor Avenue",
    setId: 5,
    tier: "yellow",
    color: "bg-yellow-500",
    maxSlots: 120,
    maxPerPlayer: 15,
    price: 60000,
    yieldBps: 850,
    shieldCostBps: 1500,   // 15% shield cost ← CHANGED
    cooldown: 20,
  },
  {
    id: 16,
    name: "Marvin Gardens",
    setId: 5,
    tier: "yellow",
    color: "bg-yellow-500",
    maxSlots: 120,
    maxPerPlayer: 15,
    price: 60000,
    yieldBps: 850,
    shieldCostBps: 1500,   // 15% shield cost ← CHANGED
    cooldown: 20,
  },

  // ========== SET 6: GREEN (3 properties) - 16% ==========
  {
    id: 17,
    name: "Pacific Avenue",
    setId: 6,
    tier: "green",
    color: "bg-green-600",
    maxSlots: 80,
    maxPerPlayer: 10,
    price: 120000,
    yieldBps: 900,         // 9.0% daily yield
    shieldCostBps: 1600,   // 16% shield cost ← CHANGED
    cooldown: 24,          // 24 hours
  },
  {
    id: 18,
    name: "North Carolina Avenue",
    setId: 6,
    tier: "green",
    color: "bg-green-600",
    maxSlots: 80,
    maxPerPlayer: 10,
    price: 120000,
    yieldBps: 900,
    shieldCostBps: 1600,   // 16% shield cost ← CHANGED
    cooldown: 24,
  },
  {
    id: 19,
    name: "Pennsylvania Avenue",
    setId: 6,
    tier: "green",
    color: "bg-green-600",
    maxSlots: 80,
    maxPerPlayer: 10,
    price: 120000,
    yieldBps: 900,
    shieldCostBps: 1600,   // 16% shield cost ← CHANGED
    cooldown: 24,
  },

  // ========== SET 7: DARK BLUE (2 properties) - 17% ==========
  {
    id: 20,
    name: "Park Place",
    setId: 7,
    tier: "darkblue",
    color: "bg-blue-900",
    maxSlots: 40,
    maxPerPlayer: 5,
    price: 240000,
    yieldBps: 1000,        // 10.0% daily yield
    shieldCostBps: 1700,   // 17% shield cost ← CHANGED
    cooldown: 28,          // 28 hours
  },
  {
    id: 21,
    name: "Boardwalk",
    setId: 7,
    tier: "darkblue",
    color: "bg-blue-900",
    maxSlots: 40,
    maxPerPlayer: 5,
    price: 240000,
    yieldBps: 1000,
    shieldCostBps: 1700,   // 17% shield cost ← CHANGED
    cooldown: 28,
  },
];

// Helper to calculate daily income
export function calculateDailyIncome(price: number, yieldBps: number): number {
  return Math.floor((price * yieldBps) / 10000);
}

// Convert to deployment format (lamports)
export function toDeploymentFormat(config: PropertyConfig) {
  return {
    ...config,
    price: config.price * 1_000_000_000, // Convert to lamports
    cooldown: config.cooldown * 3600, // Convert hours to seconds
  };
}

// Get stats for all properties
export function getPropertyStats() {
  const totalSlots = PROPERTY_CONFIG.reduce((sum, p) => sum + p.maxSlots, 0);
  const totalMarketCap = PROPERTY_CONFIG.reduce(
    (sum, p) => sum + p.price * p.maxSlots,
    0
  );

  return {
    totalProperties: PROPERTY_CONFIG.length,
    totalSlots,
    totalMarketCap,
    sets: 8,
  };
}