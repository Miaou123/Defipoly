// ============================================
// AUTO-GENERATED - DO NOT EDIT
// Source: defipoly-program/scripts/property-config.ts
// Generated: 2025-11-06T20:49:44.789Z
// ============================================

import { PublicKey } from "@solana/web3.js";

// ========================================
// BLOCKCHAIN ADDRESSES
// ========================================
// These come from deployment-info.json which is created by initialize-game.ts

export const PROGRAM_ID = new PublicKey("5pmt4n2ge5ywu1Bc9tU1qjjtGbeNoFvVJpomSjvU1PwV");
export const TOKEN_MINT = new PublicKey("8EgsaXdNt4bRoDqcqNmfvA4Tx46cXN4k73XrEHyMGb7p");
export const GAME_CONFIG = new PublicKey("BaziXxeeWJ4GSwnV1u8XjNoeEA7GqcfEiDFSfgZNCgmq");
export const REWARD_POOL_VAULT = new PublicKey("4RM9MM88FZN5Nx6KtJCRvxChSS5anGGHbyBgPiVbczWJ");
export const REWARD_POOL = REWARD_POOL_VAULT; // ✅ FIXED: Use vault address, not numeric amount
export const NETWORK = "devnet";

// ========================================
// WALLET ADDRESSES
// ========================================
// These match the hardcoded addresses in the Solana program

export const DEV_WALLET = new PublicKey("CgWTFX7JJQHed3qyMDjJkNCxK4sFe3wbDFABmWAAmrdS");
export const MARKETING_WALLET = new PublicKey("FoPKSQ5HDSVyZgaQobX64YEBVQ2iiKMZp8VHWtd6jLQE");

// ========================================
// PROPERTIES
// ========================================
// Exact copy from property-config.ts

export const PROPERTIES = [
  {
    "id": 0,
    "name": "Mediterranean Avenue",
    "setId": 0,
    "tier": "brown",
    "color": "bg-amber-900",
    "maxSlots": 600,
    "maxPerPlayer": 50,
    "price": 1500,
    "yieldBps": 600,
    "shieldCostBps": 1000,
    "cooldown": 6
  },
  {
    "id": 1,
    "name": "Baltic Avenue",
    "setId": 0,
    "tier": "brown",
    "color": "bg-amber-900",
    "maxSlots": 600,
    "maxPerPlayer": 50,
    "price": 1500,
    "yieldBps": 600,
    "shieldCostBps": 1000,
    "cooldown": 6
  },
  {
    "id": 2,
    "name": "Oriental Avenue",
    "setId": 1,
    "tier": "lightblue",
    "color": "bg-sky-300",
    "maxSlots": 450,
    "maxPerPlayer": 40,
    "price": 3500,
    "yieldBps": 650,
    "shieldCostBps": 1100,
    "cooldown": 8
  },
  {
    "id": 3,
    "name": "Vermont Avenue",
    "setId": 1,
    "tier": "lightblue",
    "color": "bg-sky-300",
    "maxSlots": 450,
    "maxPerPlayer": 40,
    "price": 3500,
    "yieldBps": 650,
    "shieldCostBps": 1100,
    "cooldown": 8
  },
  {
    "id": 4,
    "name": "Connecticut Avenue",
    "setId": 1,
    "tier": "lightblue",
    "color": "bg-sky-300",
    "maxSlots": 450,
    "maxPerPlayer": 40,
    "price": 3500,
    "yieldBps": 650,
    "shieldCostBps": 1100,
    "cooldown": 8
  },
  {
    "id": 5,
    "name": "St. Charles Place",
    "setId": 2,
    "tier": "pink",
    "color": "bg-pink-400",
    "maxSlots": 350,
    "maxPerPlayer": 30,
    "price": 7500,
    "yieldBps": 700,
    "shieldCostBps": 1200,
    "cooldown": 10
  },
  {
    "id": 6,
    "name": "States Avenue",
    "setId": 2,
    "tier": "pink",
    "color": "bg-pink-400",
    "maxSlots": 350,
    "maxPerPlayer": 30,
    "price": 7500,
    "yieldBps": 700,
    "shieldCostBps": 1200,
    "cooldown": 10
  },
  {
    "id": 7,
    "name": "Virginia Avenue",
    "setId": 2,
    "tier": "pink",
    "color": "bg-pink-400",
    "maxSlots": 350,
    "maxPerPlayer": 30,
    "price": 7500,
    "yieldBps": 700,
    "shieldCostBps": 1200,
    "cooldown": 10
  },
  {
    "id": 8,
    "name": "St. James Place",
    "setId": 3,
    "tier": "orange",
    "color": "bg-orange-500",
    "maxSlots": 250,
    "maxPerPlayer": 25,
    "price": 15000,
    "yieldBps": 750,
    "shieldCostBps": 1300,
    "cooldown": 12
  },
  {
    "id": 9,
    "name": "Tennessee Avenue",
    "setId": 3,
    "tier": "orange",
    "color": "bg-orange-500",
    "maxSlots": 250,
    "maxPerPlayer": 25,
    "price": 15000,
    "yieldBps": 750,
    "shieldCostBps": 1300,
    "cooldown": 12
  },
  {
    "id": 10,
    "name": "New York Avenue",
    "setId": 3,
    "tier": "orange",
    "color": "bg-orange-500",
    "maxSlots": 250,
    "maxPerPlayer": 25,
    "price": 15000,
    "yieldBps": 750,
    "shieldCostBps": 1300,
    "cooldown": 12
  },
  {
    "id": 11,
    "name": "Kentucky Avenue",
    "setId": 4,
    "tier": "red",
    "color": "bg-red-600",
    "maxSlots": 180,
    "maxPerPlayer": 20,
    "price": 30000,
    "yieldBps": 800,
    "shieldCostBps": 1400,
    "cooldown": 16
  },
  {
    "id": 12,
    "name": "Indiana Avenue",
    "setId": 4,
    "tier": "red",
    "color": "bg-red-600",
    "maxSlots": 180,
    "maxPerPlayer": 20,
    "price": 30000,
    "yieldBps": 800,
    "shieldCostBps": 1400,
    "cooldown": 16
  },
  {
    "id": 13,
    "name": "Illinois Avenue",
    "setId": 4,
    "tier": "red",
    "color": "bg-red-600",
    "maxSlots": 180,
    "maxPerPlayer": 20,
    "price": 30000,
    "yieldBps": 800,
    "shieldCostBps": 1400,
    "cooldown": 16
  },
  {
    "id": 14,
    "name": "Atlantic Avenue",
    "setId": 5,
    "tier": "yellow",
    "color": "bg-yellow-500",
    "maxSlots": 120,
    "maxPerPlayer": 15,
    "price": 60000,
    "yieldBps": 850,
    "shieldCostBps": 1500,
    "cooldown": 20
  },
  {
    "id": 15,
    "name": "Ventnor Avenue",
    "setId": 5,
    "tier": "yellow",
    "color": "bg-yellow-500",
    "maxSlots": 120,
    "maxPerPlayer": 15,
    "price": 60000,
    "yieldBps": 850,
    "shieldCostBps": 1500,
    "cooldown": 20
  },
  {
    "id": 16,
    "name": "Marvin Gardens",
    "setId": 5,
    "tier": "yellow",
    "color": "bg-yellow-500",
    "maxSlots": 120,
    "maxPerPlayer": 15,
    "price": 60000,
    "yieldBps": 850,
    "shieldCostBps": 1500,
    "cooldown": 20
  },
  {
    "id": 17,
    "name": "Pacific Avenue",
    "setId": 6,
    "tier": "green",
    "color": "bg-green-600",
    "maxSlots": 80,
    "maxPerPlayer": 10,
    "price": 120000,
    "yieldBps": 900,
    "shieldCostBps": 1600,
    "cooldown": 24
  },
  {
    "id": 18,
    "name": "North Carolina Avenue",
    "setId": 6,
    "tier": "green",
    "color": "bg-green-600",
    "maxSlots": 80,
    "maxPerPlayer": 10,
    "price": 120000,
    "yieldBps": 900,
    "shieldCostBps": 1600,
    "cooldown": 24
  },
  {
    "id": 19,
    "name": "Pennsylvania Avenue",
    "setId": 6,
    "tier": "green",
    "color": "bg-green-600",
    "maxSlots": 80,
    "maxPerPlayer": 10,
    "price": 120000,
    "yieldBps": 900,
    "shieldCostBps": 1600,
    "cooldown": 24
  },
  {
    "id": 20,
    "name": "Park Place",
    "setId": 7,
    "tier": "darkblue",
    "color": "bg-blue-900",
    "maxSlots": 40,
    "maxPerPlayer": 5,
    "price": 240000,
    "yieldBps": 1000,
    "shieldCostBps": 1700,
    "cooldown": 28
  },
  {
    "id": 21,
    "name": "Boardwalk",
    "setId": 7,
    "tier": "darkblue",
    "color": "bg-blue-900",
    "maxSlots": 40,
    "maxPerPlayer": 5,
    "price": 240000,
    "yieldBps": 1000,
    "shieldCostBps": 1700,
    "cooldown": 28
  }
];

// ========================================
// SET BONUSES
// ========================================
// Exact copy from property-config.ts

export const SET_BONUSES = {
  "0": {
    "percent": 30,
    "bps": 3000
  },
  "1": {
    "percent": 32.86,
    "bps": 3286
  },
  "2": {
    "percent": 35.71,
    "bps": 3571
  },
  "3": {
    "percent": 38.57,
    "bps": 3857
  },
  "4": {
    "percent": 41.43,
    "bps": 4143
  },
  "5": {
    "percent": 44.29,
    "bps": 4429
  },
  "6": {
    "percent": 47.14,
    "bps": 4714
  },
  "7": {
    "percent": 50,
    "bps": 5000
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getPropertyById(id: number) {
  return PROPERTIES.find(p => p.id === id);
}

export function getPropertiesBySetId(setId: number) {
  return PROPERTIES.filter(p => p.setId === setId);
}

export function getSetBonus(setId: number) {
  return SET_BONUSES[setId as keyof typeof SET_BONUSES];
}
