// ============================================
// FILE: defipoly-program/scripts/property-config.ts
// SINGLE SOURCE OF TRUTH FOR ALL PROPERTY DATA
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
    shieldCostBps: number;   // Basis points (2000 = 20%)
    cooldown: number;        // In hours
  }
  
  export const PROPERTY_CONFIG: PropertyConfig[] = [
    // ========== SET 0: BROWN (2 properties) ==========
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
      shieldCostBps: 2000,   // 20% shield cost
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
      shieldCostBps: 2000,
      cooldown: 6,
    },
  
    // ========== SET 1: LIGHT BLUE (3 properties) ==========
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
      shieldCostBps: 2300,   // 23% shield cost
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
      shieldCostBps: 2300,
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
      shieldCostBps: 2300,
      cooldown: 8,
    },
  
    // ========== SET 2: PINK (3 properties) ==========
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
      shieldCostBps: 2600,   // 26% shield cost
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
      shieldCostBps: 2600,
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
      shieldCostBps: 2600,
      cooldown: 10,
    },
  
    // ========== SET 3: ORANGE (3 properties) ==========
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
      shieldCostBps: 2900,   // 29% shield cost
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
      shieldCostBps: 2900,
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
      shieldCostBps: 2900,
      cooldown: 12,
    },
  
    // ========== SET 4: RED (3 properties) ==========
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
      shieldCostBps: 3200,   // 32% shield cost
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
      shieldCostBps: 3200,
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
      shieldCostBps: 3200,
      cooldown: 16,
    },
  
    // ========== SET 5: YELLOW (3 properties) ==========
    {
      id: 14,
      name: "Atlantic Avenue",
      setId: 5,
      tier: "yellow",
      color: "bg-yellow-400",
      maxSlots: 120,
      maxPerPlayer: 15,
      price: 60000,
      yieldBps: 850,         // 8.5% daily yield
      shieldCostBps: 3500,   // 35% shield cost
      cooldown: 20,          // 20 hours
    },
    {
      id: 15,
      name: "Ventnor Avenue",
      setId: 5,
      tier: "yellow",
      color: "bg-yellow-400",
      maxSlots: 120,
      maxPerPlayer: 15,
      price: 60000,
      yieldBps: 850,
      shieldCostBps: 3500,
      cooldown: 20,
    },
    {
      id: 16,
      name: "Marvin Gardens",
      setId: 5,
      tier: "yellow",
      color: "bg-yellow-400",
      maxSlots: 120,
      maxPerPlayer: 15,
      price: 60000,
      yieldBps: 850,
      shieldCostBps: 3500,
      cooldown: 20,
    },
  
    // ========== SET 6: GREEN (3 properties) ==========
    {
      id: 17,
      name: "Pacific Avenue",
      setId: 6,
      tier: "green",
      color: "bg-green-600",
      maxSlots: 60,
      maxPerPlayer: 10,
      price: 120000,
      yieldBps: 900,         // 9.0% daily yield
      shieldCostBps: 3500,   // 35% shield cost
      cooldown: 24,          // 24 hours
    },
    {
      id: 18,
      name: "North Carolina Avenue",
      setId: 6,
      tier: "green",
      color: "bg-green-600",
      maxSlots: 60,
      maxPerPlayer: 10,
      price: 120000,
      yieldBps: 900,
      shieldCostBps: 3500,
      cooldown: 24,
    },
    {
      id: 19,
      name: "Pennsylvania Avenue",
      setId: 6,
      tier: "green",
      color: "bg-green-600",
      maxSlots: 60,
      maxPerPlayer: 10,
      price: 120000,
      yieldBps: 900,
      shieldCostBps: 3500,
      cooldown: 24,
    },
  
    // ========== SET 7: DARK BLUE (2 properties) ==========
    {
      id: 20,
      name: "Park Place",
      setId: 7,
      tier: "darkblue",
      color: "bg-blue-900",
      maxSlots: 40,
      maxPerPlayer: 5,
      price: 250000,
      yieldBps: 1000,        // 10.0% daily yield
      shieldCostBps: 3500,   // 35% shield cost
      cooldown: 24,          // 24 hours
    },
    {
      id: 21,
      name: "Boardwalk",
      setId: 7,
      tier: "darkblue",
      color: "bg-blue-900",
      maxSlots: 40,
      maxPerPlayer: 5,
      price: 250000,
      yieldBps: 1000,
      shieldCostBps: 3500,
      cooldown: 24,
    },
  ];
  
  // Helper: Convert to blockchain deployment format
  export interface DeploymentProperty {
    id: number;
    setId: number;
    maxSlots: number;
    maxPerPlayer: number;
    price: string;        // Lamports as string
    yieldBps: number;
    shieldCostBps: number;
    cooldown: number;     // Seconds
    name: string;
  }
  
  export function toDeploymentFormat(prop: PropertyConfig): DeploymentProperty {
    return {
      id: prop.id,
      setId: prop.setId,
      maxSlots: prop.maxSlots,
      maxPerPlayer: prop.maxPerPlayer,
      price: (prop.price * 1e9).toString(), // Convert tokens to lamports
      yieldBps: prop.yieldBps,
      shieldCostBps: prop.shieldCostBps,
      cooldown: prop.cooldown * 3600,       // Convert hours to seconds
      name: prop.name,
    };
  }
  
  // Helper: Calculate daily income from price and yield
  export function calculateDailyIncome(price: number, yieldBps: number): number {
    return Math.floor((price * yieldBps) / 10000);
  }
  
  // Statistics
  export function getPropertyStats() {
    const totalSlots = PROPERTY_CONFIG.reduce((sum, p) => sum + p.maxSlots, 0);
    const totalMarketCap = PROPERTY_CONFIG.reduce(
      (sum, p) => sum + p.maxSlots * p.price,
      0
    );
    
    return {
      totalProperties: PROPERTY_CONFIG.length,
      totalSlots,
      totalMarketCap,
      sets: 8,
    };
  }