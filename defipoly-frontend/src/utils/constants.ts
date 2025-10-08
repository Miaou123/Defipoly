import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey("H1zzYzWPReWJ4W2JNiBrYbsrHDxFDGJ9n9jAyYG2VhLQ");
export const TOKEN_MINT = new PublicKey("743D9e7PCGgh2V3TY2tUeg31e63tmFjJ9rTZJkwhRVLX");
export const GAME_CONFIG = new PublicKey("aedS8uSUBgLFgd1RqitymXTfDTzkpuoS4hLCPGGRxVi");
export const REWARD_POOL = new PublicKey("E1y1axQ9oBT98f3D293QKsAanXNLwg8unkY5JJgcFLLj");

export const RPC_ENDPOINT = "https://api.devnet.solana.com";

export const PROPERTIES = [
  { id: 0, name: "Bronze Basic", tier: "bronze", color: "bg-amber-800", price: 1000, dailyIncome: 100, count: 10, slots: 100 },
  { id: 1, name: "Bronze Plus", tier: "bronze", color: "bg-amber-800", price: 1500, dailyIncome: 150, count: 8, slots: 80 },
  { id: 2, name: "Silver Basic", tier: "silver", color: "bg-sky-400", price: 5000, dailyIncome: 600, count: 6, slots: 60 },
  { id: 3, name: "Silver Plus", tier: "silver", color: "bg-sky-400", price: 7000, dailyIncome: 850, count: 5, slots: 50 },
  { id: 4, name: "Gold Basic", tier: "gold", color: "bg-orange-500", price: 15000, dailyIncome: 2000, count: 4, slots: 40 },
  { id: 5, name: "Gold Plus", tier: "gold", color: "bg-orange-500", price: 20000, dailyIncome: 2700, count: 3, slots: 30 },
  { id: 6, name: "Platinum Basic", tier: "platinum", color: "bg-blue-600", price: 50000, dailyIncome: 7000, count: 2, slots: 20 },
  { id: 7, name: "Platinum Elite", tier: "platinum", color: "bg-blue-600", price: 100000, dailyIncome: 15000, count: 1, slots: 10 },
];