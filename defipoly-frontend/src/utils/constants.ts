import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey("Fx8rVmiwHiBuB28MWDAaY68PXRmZLTsXsf2SJ6694oFi");
export const TOKEN_MINT = new PublicKey("HJhZC9TfGMvHh8VYTshxDWg9RFxmUSNFtYzPVo7h2MUv");
export const GAME_CONFIG = new PublicKey("5tcqVj62EfgBxtnT8NKR9h1sc2GJpP4H9tT3Ssx2c4vU");
export const REWARD_POOL = new PublicKey("4w7U9vhXpShdiWYBeecLKxvLR8sBj1zPBX2LdhcfKF9U");

export const RPC_ENDPOINT = "https://api.devnet.solana.com";

export const PROPERTIES = [
  // ========== SET 0: BROWN (2 properties) ==========
  {
    id: 0,
    name: "Mediterranean Avenue",
    setId: 0,
    tier: "brown",
    color: "bg-amber-900",
    price: 1000,
    dailyIncome: 100,        // 10% yield
    slotsPerProperty: 100,
    totalSlots: 100,
    roi: 10
  },
  {
    id: 1,
    name: "Baltic Avenue",
    setId: 0,
    tier: "brown",
    color: "bg-amber-900",
    price: 1500,
    dailyIncome: 150,        // 10% yield
    slotsPerProperty: 100,
    totalSlots: 100,
    roi: 10
  },

  // ========== SET 1: LIGHT BLUE (3 properties) ==========
  {
    id: 2,
    name: "Oriental Avenue",
    setId: 1,
    tier: "lightblue",
    color: "bg-sky-300",
    price: 2000,
    dailyIncome: 220,        // 11% yield
    slotsPerProperty: 90,
    totalSlots: 90,
    roi: 9.1
  },
  {
    id: 3,
    name: "Vermont Avenue",
    setId: 1,
    tier: "lightblue",
    color: "bg-sky-300",
    price: 2500,
    dailyIncome: 275,        // 11% yield
    slotsPerProperty: 90,
    totalSlots: 90,
    roi: 9.1
  },
  {
    id: 4,
    name: "Connecticut Avenue",
    setId: 1,
    tier: "lightblue",
    color: "bg-sky-300",
    price: 3000,
    dailyIncome: 330,        // 11% yield
    slotsPerProperty: 90,
    totalSlots: 90,
    roi: 9.1
  },

  // ========== SET 2: PINK (3 properties) ==========
  {
    id: 5,
    name: "St. Charles Place",
    setId: 2,
    tier: "pink",
    color: "bg-pink-400",
    price: 5000,
    dailyIncome: 600,        // 12% yield
    slotsPerProperty: 80,
    totalSlots: 80,
    roi: 8.3
  },
  {
    id: 6,
    name: "States Avenue",
    setId: 2,
    tier: "pink",
    color: "bg-pink-400",
    price: 5500,
    dailyIncome: 660,        // 12% yield
    slotsPerProperty: 80,
    totalSlots: 80,
    roi: 8.3
  },
  {
    id: 7,
    name: "Virginia Avenue",
    setId: 2,
    tier: "pink",
    color: "bg-pink-400",
    price: 6000,
    dailyIncome: 720,        // 12% yield
    slotsPerProperty: 80,
    totalSlots: 80,
    roi: 8.3
  },

  // ========== SET 3: ORANGE (3 properties) ==========
  {
    id: 8,
    name: "St. James Place",
    setId: 3,
    tier: "orange",
    color: "bg-orange-500",
    price: 10000,
    dailyIncome: 1300,       // 13% yield
    slotsPerProperty: 70,
    totalSlots: 70,
    roi: 7.7
  },
  {
    id: 9,
    name: "Tennessee Avenue",
    setId: 3,
    tier: "orange",
    color: "bg-orange-500",
    price: 11000,
    dailyIncome: 1430,       // 13% yield
    slotsPerProperty: 70,
    totalSlots: 70,
    roi: 7.7
  },
  {
    id: 10,
    name: "New York Avenue",
    setId: 3,
    tier: "orange",
    color: "bg-orange-500",
    price: 12000,
    dailyIncome: 1560,       // 13% yield
    slotsPerProperty: 70,
    totalSlots: 70,
    roi: 7.7
  },

  // ========== SET 4: RED (3 properties) ==========
  {
    id: 11,
    name: "Kentucky Avenue",
    setId: 4,
    tier: "red",
    color: "bg-red-600",
    price: 15000,
    dailyIncome: 2100,       // 14% yield
    slotsPerProperty: 60,
    totalSlots: 60,
    roi: 7.1
  },
  {
    id: 12,
    name: "Indiana Avenue",
    setId: 4,
    tier: "red",
    color: "bg-red-600",
    price: 16000,
    dailyIncome: 2240,       // 14% yield
    slotsPerProperty: 60,
    totalSlots: 60,
    roi: 7.1
  },
  {
    id: 13,
    name: "Illinois Avenue",
    setId: 4,
    tier: "red",
    color: "bg-red-600",
    price: 17000,
    dailyIncome: 2380,       // 14% yield
    slotsPerProperty: 60,
    totalSlots: 60,
    roi: 7.1
  },

  // ========== SET 5: YELLOW (3 properties) ==========
  {
    id: 14,
    name: "Atlantic Avenue",
    setId: 5,
    tier: "yellow",
    color: "bg-yellow-400",
    price: 20000,
    dailyIncome: 3000,       // 15% yield
    slotsPerProperty: 50,
    totalSlots: 50,
    roi: 6.7
  },
  {
    id: 15,
    name: "Ventnor Avenue",
    setId: 5,
    tier: "yellow",
    color: "bg-yellow-400",
    price: 22000,
    dailyIncome: 3300,       // 15% yield
    slotsPerProperty: 50,
    totalSlots: 50,
    roi: 6.7
  },
  {
    id: 16,
    name: "Marvin Gardens",
    setId: 5,
    tier: "yellow",
    color: "bg-yellow-400",
    price: 24000,
    dailyIncome: 3600,       // 15% yield
    slotsPerProperty: 50,
    totalSlots: 50,
    roi: 6.7
  },

  // ========== SET 6: GREEN (3 properties) ==========
  {
    id: 17,
    name: "Pacific Avenue",
    setId: 6,
    tier: "green",
    color: "bg-green-600",
    price: 30000,
    dailyIncome: 4800,       // 16% yield
    slotsPerProperty: 40,
    totalSlots: 40,
    roi: 6.3
  },
  {
    id: 18,
    name: "North Carolina Avenue",
    setId: 6,
    tier: "green",
    color: "bg-green-600",
    price: 32000,
    dailyIncome: 5120,       // 16% yield
    slotsPerProperty: 40,
    totalSlots: 40,
    roi: 6.3
  },
  {
    id: 19,
    name: "Pennsylvania Avenue",
    setId: 6,
    tier: "green",
    color: "bg-green-600",
    price: 35000,
    dailyIncome: 5600,       // 16% yield
    slotsPerProperty: 40,
    totalSlots: 40,
    roi: 6.3
  },

  // ========== SET 7: DARK BLUE (2 properties) ==========
  {
    id: 20,
    name: "Park Place",
    setId: 7,
    tier: "darkblue",
    color: "bg-blue-900",
    price: 50000,
    dailyIncome: 8500,       // 17% yield
    slotsPerProperty: 30,
    totalSlots: 30,
    roi: 5.9
  },
  {
    id: 21,
    name: "Boardwalk",
    setId: 7,
    tier: "darkblue",
    color: "bg-blue-900",
    price: 70000,
    dailyIncome: 11900,      // 17% yield
    slotsPerProperty: 30,
    totalSlots: 30,
    roi: 5.9
  },
];

// Helper to get property by ID
export function getPropertyById(id: number) {
  return PROPERTIES.find(p => p.id === id);
}

// Helper to calculate yield percentage
export function getYieldPercentage(property: typeof PROPERTIES[0]) {
  return ((property.dailyIncome / property.price) * 100).toFixed(1);
}

// Helper to get all properties in a set
export function getPropertiesBySet(setId: number) {
  return PROPERTIES.filter(p => p.setId === setId);
}

// Helper to get set name
export function getSetName(setId: number): string {
  const setNames = [
    "Brown",
    "Light Blue", 
    "Pink",
    "Orange",
    "Red",
    "Yellow",
    "Green",
    "Dark Blue"
  ];
  return setNames[setId] || "Unknown";
}