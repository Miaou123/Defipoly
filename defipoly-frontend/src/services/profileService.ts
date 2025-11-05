/**
 * Profile Service
 * Handles all profile-related API operations
 */

import { profileApi, APIError } from '@/lib/api';
import type { Profile, ProfileFormData, ApiResponse } from '@defipoly/shared-types';

export class ProfileService {
  /**
   * Get a player's profile
   */
  async getProfile(address: string): Promise<Profile | null> {
    try {
      const response = await profileApi.getProfile(address);
      return response;
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update or create a player's profile
   */
  async updateProfile(
    address: string, 
    data: ProfileFormData
  ): Promise<Profile> {
    try {
      const response = await profileApi.updateProfile(address, data);
      return response;
    } catch (error) {
      if (error instanceof APIError) {
        throw new Error(error.data?.error || error.message);
      }
      throw error;
    }
  }

  /**
   * Check if a username is available
   */
  async checkUsernameAvailability(username: string): Promise<{
    available: boolean;
    message?: string;
  }> {
    try {
      const response = await profileApi.checkUsernameAvailability(username);
      return response;
    } catch (error) {
      if (error instanceof APIError) {
        return {
          available: false,
          message: error.data?.message || 'Username check failed',
        };
      }
      throw error;
    }
  }

  /**
   * Save profile to local storage (for offline access)
   */
  saveProfileToLocalStorage(address: string, profile: Profile): void {
    const key = `defipoly_profile_${address}`;
    localStorage.setItem(key, JSON.stringify({
      ...profile,
      cachedAt: Date.now(),
    }));
  }

  /**
   * Get profile from local storage
   */
  getProfileFromLocalStorage(address: string): Profile | null {
    const key = `defipoly_profile_${address}`;
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    try {
      const data = JSON.parse(cached);
      // Check if cache is older than 1 hour
      if (Date.now() - data.cachedAt > 3600000) {
        localStorage.removeItem(key);
        return null;
      }
      delete data.cachedAt;
      return data;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Clear cached profile
   */
  clearCachedProfile(address: string): void {
    const key = `defipoly_profile_${address}`;
    localStorage.removeItem(key);
  }

  /**
   * Clear all cached profiles
   */
  clearAllCachedProfiles(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('defipoly_profile_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Export singleton instance
export const profileService = new ProfileService();