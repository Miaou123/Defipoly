// ============================================
// FILE: defipoly-frontend/src/utils/profileStorage.ts
// ============================================

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3005';

export interface ProfileData {
  username: string | null;
  profilePicture: string | null;
  lastUpdated: number;
}

// Cache for API responses (in-memory, per session)
const profileCache = new Map<string, { data: ProfileData; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Get profile data for a wallet address
 * Tries API first, falls back to localStorage
 */
export async function getProfile(address: string): Promise<ProfileData> {
  // Check cache first
  const cached = profileCache.get(address);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Try API first
    const response = await fetch(`${API_URL}/api/profile/${address}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      const profile: ProfileData = {
        username: data.username || null,
        profilePicture: data.profilePicture || null,
        lastUpdated: data.updatedAt || 0,
      };

      // Cache the result
      profileCache.set(address, { data: profile, timestamp: Date.now() });
      return profile;
    }

    // If 404, no profile exists yet
    if (response.status === 404) {
      return { username: null, profilePicture: null, lastUpdated: 0 };
    }
  } catch (error) {
    console.warn('API unavailable, using localStorage fallback:', error);
  }

  // Fallback to localStorage
  return getProfileFromLocalStorage(address);
}

/**
 * Get multiple profiles at once (optimized for leaderboard)
 */
export async function getProfilesBatch(addresses: string[]): Promise<Record<string, ProfileData>> {
  if (addresses.length === 0) return {};

  try {
    const response = await fetch(`${API_URL}/api/profiles/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallets: addresses }),
    });

    if (response.ok) {
      const data = await response.json();
      const profiles: Record<string, ProfileData> = {};

      for (const [address, profileData] of Object.entries(data.profiles)) {
        const profile = profileData as any;
        profiles[address] = {
          username: profile.username || null,
          profilePicture: profile.profilePicture || null,
          lastUpdated: profile.updatedAt || 0,
        };

        // Cache each profile
        profileCache.set(address, {
          data: profiles[address],
          timestamp: Date.now(),
        });
      }

      return profiles;
    }
  } catch (error) {
    console.warn('Batch API unavailable, using localStorage fallback:', error);
  }

  // Fallback to localStorage for each address
  const profiles: Record<string, ProfileData> = {};
  for (const address of addresses) {
    profiles[address] = getProfileFromLocalStorage(address);
  }
  return profiles;
}

/**
 * Set username for a wallet address
 */
export async function setUsername(address: string, username: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: address,
        username: username,
      }),
    });

    if (response.ok) {
      // Clear cache
      profileCache.delete(address);
      
      // Also save to localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem(`username_${address}`, username);
        localStorage.setItem(`profile_updated_${address}`, Date.now().toString());
      }
      
      return true;
    }
  } catch (error) {
    console.error('Failed to save username to API:', error);
  }

  // Fallback to localStorage only
  if (typeof window !== 'undefined') {
    localStorage.setItem(`username_${address}`, username);
    localStorage.setItem(`profile_updated_${address}`, Date.now().toString());
  }
  
  return false;
}

/**
 * Set profile picture for a wallet address
 */
export async function setProfilePicture(address: string, base64Image: string): Promise<boolean> {
  // Validate size
  const sizeInBytes = new Blob([base64Image]).size;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB > 2) {
    throw new Error('Image too large. Please use an image under 2MB.');
  }

  try {
    const response = await fetch(`${API_URL}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: address,
        profilePicture: base64Image,
      }),
    });

    if (response.ok) {
      // Clear cache
      profileCache.delete(address);
      
      // Also save to localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem(`pfp_${address}`, base64Image);
        localStorage.setItem(`profile_updated_${address}`, Date.now().toString());
      }
      
      return true;
    }
  } catch (error) {
    console.error('Failed to save profile picture to API:', error);
  }

  // Fallback to localStorage only
  if (typeof window !== 'undefined') {
    localStorage.setItem(`pfp_${address}`, base64Image);
    localStorage.setItem(`profile_updated_${address}`, Date.now().toString());
  }
  
  return false;
}

/**
 * Remove profile picture
 */
export async function removeProfilePicture(address: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/profile/${address}/picture`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      // Clear cache
      profileCache.delete(address);
      
      // Also remove from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`pfp_${address}`);
        localStorage.setItem(`profile_updated_${address}`, Date.now().toString());
      }
      
      return true;
    }
  } catch (error) {
    console.error('Failed to remove profile picture from API:', error);
  }

  // Fallback to localStorage only
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`pfp_${address}`);
    localStorage.setItem(`profile_updated_${address}`, Date.now().toString());
  }
  
  return false;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get profile from localStorage (fallback)
 */
function getProfileFromLocalStorage(address: string): ProfileData {
  if (typeof window === 'undefined') {
    return { username: null, profilePicture: null, lastUpdated: 0 };
  }

  const username = localStorage.getItem(`username_${address}`);
  const profilePicture = localStorage.getItem(`pfp_${address}`);
  const lastUpdated = parseInt(localStorage.getItem(`profile_updated_${address}`) || '0');

  return {
    username,
    profilePicture,
    lastUpdated,
  };
}

/**
 * Get username only (for backwards compatibility)
 */
export async function getUsername(address: string): Promise<string | null> {
  const profile = await getProfile(address);
  return profile.username;
}

/**
 * Get profile picture only
 */
export async function getProfilePicture(address: string): Promise<string | null> {
  const profile = await getProfile(address);
  return profile.profilePicture;
}

/**
 * Get display name (username or shortened address)
 */
export async function getDisplayName(address: string): Promise<string> {
  const username = await getUsername(address);
  if (username) return username;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Convert file to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Compress image before storing
 */
export async function compressImage(file: File, maxWidth: number = 200, maxHeight: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

/**
 * Clear profile cache (call after updates)
 */
export function clearProfileCache(address?: string): void {
  if (address) {
    profileCache.delete(address);
  } else {
    profileCache.clear();
  }
}