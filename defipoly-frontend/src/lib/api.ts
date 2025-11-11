/**
 * Centralized API client for Defipoly
 * Handles all backend API communication with error handling and retry logic
 */

// Custom error class for API errors
export class APIError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'APIError';
  }
}

// Get API base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3005';

// API request options interface
interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  retries?: number;
  retryDelay?: number;
}

/**
 * Core API request function with error handling and retry logic
 */
async function apiRequest(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<any> {
  const {
    retries = 3,
    retryDelay = 1000,
    body,
    headers,
    ...fetchOptions
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  
  let lastError: Error | null = null;
  
  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.text();
        let parsedError;
        try {
          parsedError = JSON.parse(errorData);
        } catch {
          parsedError = { message: errorData };
        }
        
        throw new APIError(
          response.status,
          parsedError.message || `API request failed: ${response.statusText}`,
          parsedError
        );
      }

      // Parse successful response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Network or server error - retry with exponential backoff
      if (attempt < retries - 1) {
        const delay = retryDelay * Math.pow(2, attempt);
        console.warn(`API request failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  throw lastError || new Error('API request failed after all retries');
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(
  endpoint: string,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>
): Promise<T> {
  return apiRequest(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>
): Promise<T> {
  return apiRequest(endpoint, { ...options, method: 'POST', body: data });
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>
): Promise<T> {
  return apiRequest(endpoint, { ...options, method: 'PUT', body: data });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(
  endpoint: string,
  options?: Omit<ApiRequestOptions, 'method' | 'body'>
): Promise<T> {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Helper to construct API endpoints with query parameters
 */
export function buildApiUrl(endpoint: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  
  return `${endpoint}?${searchParams.toString()}`;
}

/**
 * Profile-specific API helpers
 */
export const profileApi = {
  getProfile: (address: string) => apiGet(`/api/profile/${address}`),
  
  updateProfile: (address: string, data: any) => 
    apiPost('/api/profile', { walletAddress: address, ...data }),
  
  checkUsernameAvailability: (username: string) => 
    apiGet(`/api/profile/check-username/${username}`),
};

/**
 * Stats-specific API helpers
 */
export const statsApi = {
  getPlayerStats: (address: string) => apiGet(`/api/stats/${address}`),
  
  getLeaderboard: (params?: { limit?: number; offset?: number }) => 
    apiGet(buildApiUrl('/api/leaderboard', params)),
  
  getPropertyStats: () => apiGet('/api/properties'),
};

/**
 * Game-specific API helpers
 */
export const gameApi = {
  getGameState: () => apiGet('/api/game-state'),
  
  getRecentActions: (limit?: number) => 
    apiGet(`/api/actions/recent${limit ? `?limit=${limit}` : ''}`),
    
  getCooldowns: (playerAddress: string) =>
    apiGet(`/api/cooldown/${playerAddress}`),
    
  getStealCooldowns: (playerAddress: string) =>
    apiGet(`/api/steal-cooldown/${playerAddress}`),
    
  getOwnershipDetails: (playerAddress: string, propertyId: number) =>
    apiGet(`/api/ownership/${playerAddress}/${propertyId}`),
};

// Export everything for maximum flexibility
export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  profile: profileApi,
  stats: statsApi,
  game: gameApi,
};