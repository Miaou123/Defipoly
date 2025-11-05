/**
 * Environment Variable Validation and Access
 * Ensures all required environment variables are present and valid
 */

/**
 * Get a required environment variable
 */
function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Get an optional environment variable with a default value
 */
function getOptionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Validate and export all environment variables
 */
export const ENV = {
  // API Configuration
  API_BASE_URL: getOptionalEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3005'),
  
  // Solana Configuration
  RPC_URL: getRequiredEnv('NEXT_PUBLIC_RPC_URL'),
  NETWORK: getOptionalEnv('NEXT_PUBLIC_NETWORK', 'devnet'),
  PROGRAM_ID: getRequiredEnv('NEXT_PUBLIC_PROGRAM_ID'),
  TOKEN_MINT: getRequiredEnv('NEXT_PUBLIC_TOKEN_MINT'),
  
  // Feature Flags (optional)
  ENABLE_WEBSOCKET: getOptionalEnv('NEXT_PUBLIC_ENABLE_WEBSOCKET', 'true') === 'true',
  ENABLE_ANALYTICS: getOptionalEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'false') === 'true',
  
  // Development
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

/**
 * Validate environment on startup
 */
export function validateEnvironment(): void {
  const errors: string[] = [];

  // Check critical variables
  if (!ENV.RPC_URL) {
    errors.push('NEXT_PUBLIC_RPC_URL is required');
  }

  if (!ENV.PROGRAM_ID) {
    errors.push('NEXT_PUBLIC_PROGRAM_ID is required');
  }

  if (!ENV.TOKEN_MINT) {
    errors.push('NEXT_PUBLIC_TOKEN_MINT is required');
  }

  // Validate formats
  if (ENV.RPC_URL && !ENV.RPC_URL.startsWith('http')) {
    errors.push('NEXT_PUBLIC_RPC_URL must be a valid URL');
  }

  if (ENV.PROGRAM_ID && ENV.PROGRAM_ID.length < 32) {
    errors.push('NEXT_PUBLIC_PROGRAM_ID appears to be invalid');
  }

  // Network validation
  const validNetworks = ['devnet', 'mainnet-beta', 'testnet', 'localnet'];
  if (!validNetworks.includes(ENV.NETWORK)) {
    errors.push(`NEXT_PUBLIC_NETWORK must be one of: ${validNetworks.join(', ')}`);
  }

  // Throw if any errors
  if (errors.length > 0) {
    const errorMessage = `Environment validation failed:\n${errors.join('\n')}`;
    console.error(errorMessage);
    
    // In development, show a clear error
    if (ENV.IS_DEVELOPMENT) {
      throw new Error(errorMessage);
    }
  }
}

/**
 * Log environment info (development only)
 */
export function logEnvironment(): void {
  if (!ENV.IS_DEVELOPMENT) return;

  console.log('🔧 Environment Configuration:');
  console.log(`  Network: ${ENV.NETWORK}`);
  console.log(`  RPC URL: ${ENV.RPC_URL}`);
  console.log(`  API URL: ${ENV.API_BASE_URL}`);
  console.log(`  Program ID: ${ENV.PROGRAM_ID}`);
  console.log(`  Token Mint: ${ENV.TOKEN_MINT}`);
  console.log(`  WebSocket: ${ENV.ENABLE_WEBSOCKET ? 'Enabled' : 'Disabled'}`);
}

// Export for use in other files
export default ENV;