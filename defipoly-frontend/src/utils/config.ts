// ============================================
// Centralized Configuration
// Single source of truth for API URLs and environment settings
// ============================================

export const API_CONFIG = {
  // Backend API base URL - configurable via environment
  BASE_URL: process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101',
  
  // WebSocket URL (defaults to same as API base)
  SOCKET_URL: process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101',
  
  // Environment detection
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// Re-export for backwards compatibility with existing code
export const API_BASE_URL = API_CONFIG.BASE_URL;