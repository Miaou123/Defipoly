/**
 * Utility functions for calculating sell values based on holding time
 * Uses the same formula as the Solana program
 */

/**
 * Calculate the sell value percentage based on holding time
 * @param buyTimestamp - Unix timestamp when the property was bought
 * @param currentTimestamp - Current unix timestamp (optional, defaults to now)
 * @returns Sell value percentage (0.15 to 0.30)
 */
export function calculateSellValuePercentage(
  buyTimestamp: number,
  currentTimestamp: number = Math.floor(Date.now() / 1000)
): number {
  // Constants from the program
  const MIN_SELL_VALUE_BPS = 1500; // 15%
  const MAX_SELL_VALUE_BPS = 3000; // 30%
  const MAX_HOLD_DAYS = 14;
  
  // Calculate days held
  const secondsHeld = Math.max(0, currentTimestamp - buyTimestamp);
  const daysHeld = secondsHeld / (24 * 60 * 60);
  
  // Linear interpolation between 15% and 30% over 14 days
  const holdRatio = Math.min(daysHeld / MAX_HOLD_DAYS, 1.0);
  const sellValueBps = MIN_SELL_VALUE_BPS + (holdRatio * (MAX_SELL_VALUE_BPS - MIN_SELL_VALUE_BPS));
  
  // Convert BPS to percentage (divide by 10000)
  return sellValueBps / 10000;
}

/**
 * Calculate the actual sell value in tokens
 * @param propertyPrice - Property price per slot
 * @param slotsToSell - Number of slots to sell
 * @param buyTimestamp - Unix timestamp when the property was bought
 * @param currentTimestamp - Current unix timestamp (optional, defaults to now)
 * @returns Total sell value in tokens
 */
export function calculateSellValue(
  propertyPrice: number,
  slotsToSell: number,
  buyTimestamp: number,
  currentTimestamp?: number
): number {
  const sellPercentage = calculateSellValuePercentage(buyTimestamp, currentTimestamp);
  return propertyPrice * slotsToSell * sellPercentage;
}

/**
 * Format days held for display
 * @param buyTimestamp - Unix timestamp when the property was bought
 * @param currentTimestamp - Current unix timestamp (optional, defaults to now)
 * @returns Formatted string like "2.5 days" or "14+ days"
 */
export function formatDaysHeld(
  buyTimestamp: number,
  currentTimestamp: number = Math.floor(Date.now() / 1000)
): string {
  const secondsHeld = Math.max(0, currentTimestamp - buyTimestamp);
  const daysHeld = secondsHeld / (24 * 60 * 60);
  
  if (daysHeld >= 14) {
    return "14+ days";
  } else if (daysHeld >= 1) {
    return `${daysHeld.toFixed(1)} days`;
  } else if (daysHeld >= 1/24) { // More than 1 hour
    const hoursHeld = daysHeld * 24;
    return `${hoursHeld.toFixed(1)} hours`;
  } else {
    const minutesHeld = daysHeld * 24 * 60;
    return `${Math.max(1, Math.floor(minutesHeld))} minutes`;
  }
}

/**
 * Get sell value info with all details
 * @param propertyPrice - Property price per slot
 * @param slotsToSell - Number of slots to sell
 * @param buyTimestamp - Unix timestamp when the property was bought
 * @param currentTimestamp - Current unix timestamp (optional, defaults to now)
 * @returns Object with all sell value details
 */
export function getSellValueInfo(
  propertyPrice: number,
  slotsToSell: number,
  buyTimestamp: number,
  currentTimestamp?: number
) {
  const sellPercentage = calculateSellValuePercentage(buyTimestamp, currentTimestamp);
  const sellValue = calculateSellValue(propertyPrice, slotsToSell, buyTimestamp, currentTimestamp);
  const daysHeld = formatDaysHeld(buyTimestamp, currentTimestamp);
  const percentageDisplay = (sellPercentage * 100).toFixed(1);
  
  return {
    sellValue,
    sellPercentage,
    percentageDisplay,
    daysHeld,
    isMaxValue: sellPercentage >= 0.30
  };
}