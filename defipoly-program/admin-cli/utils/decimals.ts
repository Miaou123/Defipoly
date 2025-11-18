import BN from "bn.js";

// Token decimals for the Defipoly token (9 decimals)
export const TOKEN_DECIMALS = 9;

/**
 * Convert a human-readable token amount to the on-chain amount with decimals
 * @param amount The human-readable amount (e.g., 1000 for 1000 tokens)
 * @returns BN with decimals applied (e.g., 1000000000000 for 1000 tokens with 9 decimals)
 */
export function toTokenAmount(amount: number): BN {
  // Convert to string to avoid floating point precision issues
  const amountStr = amount.toString();
  
  // Check if it's a decimal number
  if (amountStr.includes('.')) {
    throw new Error('Please provide whole token amounts. Decimals are added automatically.');
  }
  
  // Multiply by 10^decimals
  const multiplier = new BN(10).pow(new BN(TOKEN_DECIMALS));
  return new BN(amount).mul(multiplier);
}

/**
 * Convert an on-chain token amount to human-readable format
 * @param amount BN with decimals
 * @returns Human-readable amount (e.g., 1000 from 1000000000000)
 */
export function fromTokenAmount(amount: BN): number {
  const divisor = new BN(10).pow(new BN(TOKEN_DECIMALS));
  return amount.div(divisor).toNumber();
}

/**
 * Format a token amount for display
 * @param amount Human-readable amount
 * @returns Formatted string with commas
 */
export function formatTokenAmount(amount: number): string {
  return amount.toLocaleString();
}