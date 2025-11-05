/**
 * Property Service
 * Handles all property-related API operations and business logic
 */

import { statsApi, APIError } from '@/lib/api';
import type { PropertyStats, PropertyOwnership, Property } from '@defipoly/shared-types';

export class PropertyService {
  /**
   * Get all properties with their current stats
   */
  async getAllProperties(): Promise<PropertyStats[]> {
    try {
      const response = await statsApi.getPropertyStats();
      return response.properties || [];
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      return [];
    }
  }

  /**
   * Get a single property's stats
   */
  async getPropertyStats(propertyId: number): Promise<PropertyStats | null> {
    try {
      const properties = await this.getAllProperties();
      return properties.find(p => p.propertyId === propertyId) || null;
    } catch (error) {
      console.error(`Failed to fetch property ${propertyId}:`, error);
      return null;
    }
  }

  /**
   * Get properties by set
   */
  async getPropertiesBySet(setId: number): Promise<PropertyStats[]> {
    try {
      const properties = await this.getAllProperties();
      return properties.filter(p => p.setId === setId);
    } catch (error) {
      console.error(`Failed to fetch properties for set ${setId}:`, error);
      return [];
    }
  }

  /**
   * Get player's owned properties
   */
  async getPlayerProperties(playerAddress: string): Promise<PropertyOwnership[]> {
    try {
      const response = await statsApi.getPlayerStats(playerAddress);
      return response.properties || [];
    } catch (error) {
      console.error(`Failed to fetch player properties:`, error);
      return [];
    }
  }

  /**
   * Calculate total income from properties
   */
  calculateTotalIncome(properties: PropertyOwnership[]): number {
    return properties.reduce((total, prop) => {
      // Assuming baseReward is per slot per day
      return total + (prop.slotsOwned * this.getBaseReward(prop.propertyId));
    }, 0);
  }

  /**
   * Get base reward for a property (you may want to fetch this from API)
   */
  private getBaseReward(propertyId: number): number {
    // This should ideally come from the property data
    const baseRewards: Record<number, number> = {
      0: 100,    // Mediterranean
      1: 120,    // Baltic
      2: 250,    // Oriental
      3: 250,    // Vermont
      4: 300,    // Connecticut
      5: 350,    // St. Charles
      6: 350,    // States
      7: 400,    // Virginia
      8: 450,    // St. James
      9: 450,    // Tennessee
      10: 500,   // New York
      11: 550,   // Kentucky
      12: 550,   // Indiana
      13: 600,   // Illinois
      14: 650,   // Atlantic
      15: 650,   // Ventnor
      16: 700,   // Marvin Gardens
      17: 750,   // Pacific
      18: 800,   // North Carolina
      19: 850,   // Pennsylvania
      20: 900,   // Park Place
      21: 1000,  // Boardwalk
    };
    return baseRewards[propertyId] || 0;
  }

  /**
   * Check if player owns a complete set
   */
  async checkCompleteSet(playerAddress: string, setId: number): Promise<boolean> {
    try {
      const [playerProperties, allProperties] = await Promise.all([
        this.getPlayerProperties(playerAddress),
        this.getAllProperties(),
      ]);

      const setProperties = allProperties.filter(p => p.setId === setId);
      const playerSetProperties = playerProperties.filter(p => 
        setProperties.some(sp => sp.propertyId === p.propertyId)
      );

      return setProperties.length > 0 && 
             setProperties.length === playerSetProperties.length &&
             playerSetProperties.every(p => p.slotsOwned > 0);
    } catch (error) {
      console.error(`Failed to check complete set:`, error);
      return false;
    }
  }

  /**
   * Get property availability percentage
   */
  getAvailabilityPercentage(property: PropertyStats): number {
    if (property.totalSlots === 0) return 0;
    return Math.round((property.availableSlots / property.totalSlots) * 100);
  }

  /**
   * Format property price for display
   */
  formatPrice(price: number): string {
    // Assuming price is in lamports (9 decimals)
    const inTokens = price / 1_000_000_000;
    if (inTokens >= 1_000_000) {
      return `${(inTokens / 1_000_000).toFixed(2)}M`;
    } else if (inTokens >= 1_000) {
      return `${(inTokens / 1_000).toFixed(2)}K`;
    } else {
      return inTokens.toFixed(2);
    }
  }

  /**
   * Get property tier color
   */
  getPropertyTierColor(setId: number): string {
    const colors: Record<number, string> = {
      0: '#8B4513', // Brown
      1: '#87CEEB', // Light Blue
      2: '#FF69B4', // Pink
      3: '#FFA500', // Orange
      4: '#FF0000', // Red
      5: '#FFFF00', // Yellow
      6: '#008000', // Green
      7: '#00008B', // Dark Blue
    };
    return colors[setId] || '#666666';
  }

  /**
   * Cache property data locally
   */
  cacheProperties(properties: PropertyStats[]): void {
    const key = 'defipoly_properties_cache';
    localStorage.setItem(key, JSON.stringify({
      properties,
      cachedAt: Date.now(),
    }));
  }

  /**
   * Get cached properties
   */
  getCachedProperties(): PropertyStats[] | null {
    const key = 'defipoly_properties_cache';
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    try {
      const data = JSON.parse(cached);
      // Check if cache is older than 5 minutes
      if (Date.now() - data.cachedAt > 300000) {
        localStorage.removeItem(key);
        return null;
      }
      return data.properties;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }
}

// Export singleton instance
export const propertyService = new PropertyService();