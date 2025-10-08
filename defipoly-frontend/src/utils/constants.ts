import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey("H1zzYzWPReWJ4W2JNiBrYbsrHDxFDGJ9n9jAyYG2VhLQ");
export const TOKEN_MINT = new PublicKey("743D9e7PCGgh2V3TY2tUeg31e63tmFjJ9rTZJkwhRVLX");
export const GAME_CONFIG = new PublicKey("aedS8uSUBgLFgd1RqitymXTfDTzkpuoS4hLCPGGRxVi");
export const REWARD_POOL = new PublicKey("E1y1axQ9oBT98f3D293QKsAanXNLwg8unkY5JJgcFLLj");

export const RPC_ENDPOINT = "https://api.devnet.solana.com";

export const PROPERTIES = [
  { 
    id: 0, 
    name: "Bronze Basic", 
    tier: "bronze", 
    color: "bg-amber-800", 
    price: 1000, 
    dailyIncome: 100, 
    count: 10, 
    slotsPerProperty: 100,
    totalSlots: 1000, // count × slotsPerProperty
    roi: 10 // days to break even
  },
  { 
    id: 1, 
    name: "Bronze Plus", 
    tier: "bronze", 
    color: "bg-amber-800", 
    price: 1500, 
    dailyIncome: 150, 
    count: 8, 
    slotsPerProperty: 80,
    totalSlots: 640,
    roi: 10
  },
  { 
    id: 2, 
    name: "Silver Basic", 
    tier: "silver", 
    color: "bg-sky-400", 
    price: 5000, 
    dailyIncome: 600, 
    count: 6, 
    slotsPerProperty: 60,
    totalSlots: 360,
    roi: 8.3
  },
  { 
    id: 3, 
    name: "Silver Plus", 
    tier: "silver", 
    color: "bg-sky-400", 
    price: 7000, 
    dailyIncome: 850, 
    count: 5, 
    slotsPerProperty: 50,
    totalSlots: 250,
    roi: 8.2
  },
  { 
    id: 4, 
    name: "Gold Basic", 
    tier: "gold", 
    color: "bg-orange-500", 
    price: 15000, 
    dailyIncome: 2000, 
    count: 4, 
    slotsPerProperty: 40,
    totalSlots: 160,
    roi: 7.5
  },
  { 
    id: 5, 
    name: "Gold Plus", 
    tier: "gold", 
    color: "bg-orange-500", 
    price: 20000, 
    dailyIncome: 2700, 
    count: 3, 
    slotsPerProperty: 30,
    totalSlots: 90,
    roi: 7.4
  },
  { 
    id: 6, 
    name: "Platinum Basic", 
    tier: "platinum", 
    color: "bg-blue-600", 
    price: 50000, 
    dailyIncome: 7000, 
    count: 2, 
    slotsPerProperty: 20,
    totalSlots: 40,
    roi: 7.1
  },
  { 
    id: 7, 
    name: "Platinum Elite", 
    tier: "platinum", 
    color: "bg-blue-600", 
    price: 100000, 
    dailyIncome: 15000, 
    count: 1, 
    slotsPerProperty: 10,
    totalSlots: 10,
    roi: 6.7
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