/**
 * Solana Connection Singleton
 * Ensures we only have one connection instance to the Solana network
 */

import { Connection, ConnectionConfig } from '@solana/web3.js';

// Cache the connection instance
let cachedConnection: Connection | null = null;

// Default connection config
const DEFAULT_CONFIG: ConnectionConfig = {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  disableRetryOnRateLimit: false,
};

/**
 * Get or create a singleton Solana connection
 */
export function getConnection(config?: ConnectionConfig): Connection {
  // Return existing connection if available
  if (cachedConnection) {
    return cachedConnection;
  }

  // Get RPC URL from environment
  const rpcUrl = process.env['NEXT_PUBLIC_RPC_URL'] || process.env['NEXT_PUBLIC_SOLANA_RPC_HOST'];
  
  if (!rpcUrl) {
    throw new Error(
      'No RPC URL configured. Please set NEXT_PUBLIC_RPC_URL in your environment variables.'
    );
  }

  // Create new connection with merged config
  cachedConnection = new Connection(rpcUrl, {
    ...DEFAULT_CONFIG,
    ...config,
  });

  // Add connection event handlers
  cachedConnection.onLogs('all', (logs) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Solana Logs]', logs);
    }
  });

  return cachedConnection;
}

/**
 * Reset the connection (useful for testing or switching networks)
 */
export function resetConnection(): void {
  if (cachedConnection) {
    cachedConnection = null;
  }
}

/**
 * Get connection with custom config (creates new if config differs)
 */
export function getCustomConnection(
  rpcUrl: string,
  config?: ConnectionConfig
): Connection {
  return new Connection(rpcUrl, {
    ...DEFAULT_CONFIG,
    ...config,
  });
}

/**
 * Utility to check if connection is healthy
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const conn = getConnection();
    const version = await conn.getVersion();
    console.log('Solana connection healthy. Version:', version);
    return true;
  } catch (error) {
    console.error('Solana connection error:', error);
    return false;
  }
}

/**
 * Get connection stats for monitoring
 */
export async function getConnectionStats() {
  try {
    const conn = getConnection();
    const [slot, blockHeight, epochInfo] = await Promise.all([
      conn.getSlot(),
      conn.getBlockHeight(),
      conn.getEpochInfo(),
    ]);

    return {
      connected: true,
      slot,
      blockHeight,
      epoch: epochInfo.epoch,
      slotIndex: epochInfo.slotIndex,
      slotsInEpoch: epochInfo.slotsInEpoch,
      rpcUrl: process.env['NEXT_PUBLIC_RPC_URL'],
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Singleton connection getter for backwards compatibility
 */
export const connection = new Proxy({} as Connection, {
  get(target, prop) {
    const conn = getConnection();
    return conn[prop as keyof Connection];
  },
});

// Export for convenience
export default getConnection;