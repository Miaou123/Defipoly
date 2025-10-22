// ============================================
// FILE: defipoly-frontend/src/utils/propertyStats.ts
// Utility to fetch property statistics from backend
// ============================================

const BACKEND_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3001';

export interface PropertyStats {
  propertyId: number;
  ownersWithUnshieldedSlots: number;
}

/**
 * Fetch statistics for a specific property
 */
export async function fetchPropertyStats(propertyId: number): Promise<PropertyStats | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/properties/${propertyId}/stats`);
    
    if (!response.ok) {
      console.error(`Failed to fetch property stats: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return {
      propertyId: data.propertyId,
      ownersWithUnshieldedSlots: data.ownersWithUnshieldedSlots
    };
  } catch (error) {
    console.error('Error fetching property stats:', error);
    return null;
  }
}

/**
 * Fetch statistics for all properties at once (more efficient)
 */
export async function fetchAllPropertiesStats(): Promise<Map<number, PropertyStats>> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/properties/stats`);
    
    if (!response.ok) {
      console.error(`Failed to fetch all properties stats: ${response.status}`);
      return new Map();
    }
    
    const data = await response.json();
    const statsMap = new Map<number, PropertyStats>();
    
    Object.entries(data.properties).forEach(([propertyId, stats]: [string, any]) => {
      const id = parseInt(propertyId);
      statsMap.set(id, {
        propertyId: id,
        ownersWithUnshieldedSlots: stats.ownersWithUnshieldedSlots
      });
    });
    
    return statsMap;
  } catch (error) {
    console.error('Error fetching all properties stats:', error);
    return new Map();
  }
}