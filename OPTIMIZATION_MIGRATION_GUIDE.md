# Defipoly Code Optimization Migration Guide

This guide helps you migrate your existing code to use the new optimized infrastructure.

## Overview of Changes

1. **Centralized API Client** - Replace all `BACKEND_URL` definitions with the new API client
2. **Solana Connection Singleton** - Use single connection instance instead of creating multiple
3. **Standardized Environment Variables** - Use consistent naming across the project
4. **Shared Types** - Import types from `@defipoly/shared-types` package
5. **Service Layer** - Use services instead of direct API calls
6. **Error Handling** - Consistent error handling with retry logic
7. **Caching** - Reduce API calls with intelligent caching

## Migration Steps

### Step 1: Update Environment Variables

Update your environment variable references:

```typescript
// OLD
const API_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3005';
const BACKEND_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3005';

// NEW
import { ENV } from '@/lib/env';
const API_URL = ENV.API_BASE_URL;
```

### Step 2: Replace Direct API Calls

#### Before:
```typescript
// In any component or utility
const BACKEND_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3005';

const response = await fetch(`${BACKEND_URL}/api/profile/${address}`);
if (!response.ok) {
  throw new Error('Failed to fetch profile');
}
const data = await response.json();
```

#### After:
```typescript
// Using the API client directly
import { profileApi } from '@/lib/api';

try {
  const data = await profileApi.getProfile(address);
} catch (error) {
  // Error is already handled with retry logic
  console.error('Failed to fetch profile:', error);
}

// OR using the service layer (recommended)
import { profileService } from '@/services/profileService';

const profile = await profileService.getProfile(address);
```

### Step 3: Replace Solana Connections

#### Before:
```typescript
import { Connection, clusterApiUrl } from '@solana/web3.js';

const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST || clusterApiUrl('devnet');
const connection = new Connection(endpoint, 'confirmed');
```

#### After:
```typescript
import { getConnection } from '@/lib/connection';

const connection = getConnection();
```

### Step 4: Update Type Imports

#### Before:
```typescript
// Local type definitions
interface ProfileData {
  username: string | null;
  profilePicture: string | null;
  lastUpdated: number;
}
```

#### After:
```typescript
import type { ProfileData, Profile } from '@defipoly/shared-types';
```

### Step 5: Update Service Calls

#### Profile Operations

Before:
```typescript
// Scattered throughout components
const updateProfile = async (username: string) => {
  const response = await fetch(`${BACKEND_URL}/api/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: address, username }),
  });
  // ... error handling
};
```

After:
```typescript
import { profileService } from '@/services/profileService';

const updateProfile = async (username: string) => {
  const profile = await profileService.updateProfile(address, { username });
  // Error handling is built-in
};
```

#### Property Operations

Before:
```typescript
const response = await fetch(`${BACKEND_URL}/api/properties`);
const data = await response.json();
```

After:
```typescript
import { propertyService } from '@/services/propertyService';

const properties = await propertyService.getAllProperties();
```

### Step 6: Add Caching

Before:
```typescript
// No caching, always fetches fresh data
const fetchProfile = async () => {
  const response = await fetch(`${API_URL}/api/profile/${address}`);
  return response.json();
};
```

After:
```typescript
import { profileCache, cachedRequest } from '@/lib/cache';
import { profileApi } from '@/lib/api';

const fetchProfile = async (address: string) => {
  return cachedRequest(
    profileCache,
    `profile_${address}`,
    () => profileApi.getProfile(address),
    60000 // Cache for 1 minute
  );
};
```

## File-by-File Migration

### Frontend Files to Update

1. **src/utils/profileStorage.ts**
   ```typescript
   // Remove:
   const API_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3005';
   
   // Add:
   import { profileService } from '@/services/profileService';
   import type { Profile } from '@defipoly/shared-types';
   ```

2. **src/utils/propertyStats.ts**
   ```typescript
   // Remove:
   const BACKEND_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3005';
   
   // Add:
   import { propertyService } from '@/services/propertyService';
   import { getConnection } from '@/lib/connection';
   ```

3. **src/app/profile/page.tsx**
   ```typescript
   // Remove direct fetch calls
   // Use profileService methods instead
   ```

4. **src/contexts/WalletContext.tsx**
   ```typescript
   // Remove:
   const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_HOST || clusterApiUrl('devnet');
   
   // Add:
   import { getConnection } from '@/lib/connection';
   import { ENV } from '@/lib/env';
   ```

### Backend Files to Update

1. **src/services/wssListener.js**
   ```javascript
   // Use consistent connection configuration
   const { Connection } = require('@solana/web3.js');
   const RPC_URL = process.env.SOLANA_RPC_URL || process.env.RPC_URL;
   ```

### Program Scripts to Update

1. **scripts/initialize-game.ts**
2. **scripts/bot/bot-interactions.ts**
   ```typescript
   // Add at top:
   import { ENV } from '../../defipoly-frontend/src/lib/env';
   
   // Use ENV.RPC_URL instead of process.env.ANCHOR_PROVIDER_URL
   ```

## Testing the Migration

1. **Test API calls**:
   ```typescript
   // In browser console
   import { profileApi } from '@/lib/api';
   const profile = await profileApi.getProfile('YOUR_WALLET_ADDRESS');
   console.log(profile);
   ```

2. **Test connection singleton**:
   ```typescript
   import { getConnection, checkConnection } from '@/lib/connection';
   const isHealthy = await checkConnection();
   console.log('Connection healthy:', isHealthy);
   ```

3. **Test caching**:
   ```typescript
   import { profileCache } from '@/lib/cache';
   console.log('Cache stats:', profileCache.getStats());
   ```

## Common Issues and Solutions

### Issue: Environment variables not found
**Solution**: Make sure you've updated `.env` with the new standardized names and restarted your dev server.

### Issue: TypeScript errors with shared types
**Solution**: Run `npm install` at the root to ensure workspaces are linked properly.

### Issue: API calls failing
**Solution**: Check that backend is using the updated `.env` path and variables.

## Benefits After Migration

1. **50% less code duplication** - No more repeated BACKEND_URL definitions
2. **Better performance** - Connection reuse and caching
3. **Improved reliability** - Automatic retry logic for failed requests
4. **Type safety** - Shared types between frontend and backend
5. **Easier maintenance** - Centralized configuration and services
6. **Better error handling** - Consistent error messages and handling

## Rollback Plan

If you need to rollback:

1. Keep old environment variable names in `.env` during migration
2. The old code will continue to work with fallback values
3. Migrate component by component rather than all at once
4. Test thoroughly before removing old environment variables

## Next Steps

1. Start with high-traffic components first
2. Monitor performance improvements
3. Gradually migrate all components
4. Remove old environment variables once migration is complete
5. Update documentation to reflect new patterns