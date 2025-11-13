# WebSocket Testing Guide for Defipoly

## Overview

This guide provides comprehensive instructions for testing the WebSocket implementation between the Defipoly backend and frontend. The WebSocket connection enables real-time communication for game events, property updates, player stats, and live feeds.

## Architecture Analysis

### Frontend WebSocket Implementation

**File:** `/src/contexts/WebSocketContext.tsx`

The frontend uses Socket.IO client (`socket.io-client` v4.8.1) with the following features:
- Automatic reconnection with 5 retry attempts
- Support for both WebSocket and polling transports
- Wallet-based event subscriptions
- Property-specific event subscriptions
- Real-time game event handling

**Key Events Handled:**
- `property-bought`, `property-sold`, `property-stolen`, `property-shielded`
- `stats-updated`, `cooldown-updated`, `steal-cooldown-updated`
- `recent-action`, `leaderboard-updated`, `reward-claimed`

### Backend WebSocket Implementation

**File:** `/src/services/socketService.js`

The backend uses Socket.IO server (`socket.io` v4.8.1) with:
- CORS configuration for frontend URL
- Room-based subscriptions (wallet and property rooms)
- Comprehensive game event emitters
- Support for targeted and broadcast messaging

## Potential Issues Identified

### 🚨 Critical Issues

1. **Missing Solana Wallet Adapter Dependencies**
   - The frontend code imports `@solana/wallet-adapter-react` but this package is **not listed** in `package.json`
   - This will cause runtime errors when the WebSocket context tries to access wallet information
   - **Impact:** WebSocket wallet subscriptions will fail

2. **Environment Variable Dependencies**
   - Frontend requires `NEXT_PUBLIC_API_BASE_URL` for WebSocket connection
   - Backend requires `FRONTEND_URL` for CORS configuration
   - Missing variables will cause connection failures

### ⚠️ Minor Issues

1. **CORS Configuration**
   - Backend CORS origin defaults to `http://localhost:3000` but frontend runs on port `3100`
   - May cause connection issues in development

2. **WebSocket URL Fallback**
   - Frontend falls back to `http://localhost:3101` if environment variable is missing
   - Should match backend's actual port configuration

## Environment Setup Requirements

### Frontend Environment Variables (.env.local)

```bash
# Required for WebSocket connection
NEXT_PUBLIC_API_BASE_URL=http://localhost:3101

# Required for Solana functionality
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=your_program_id_here
NEXT_PUBLIC_TOKEN_MINT=your_token_mint_here
```

### Backend Environment Variables (.env)

```bash
# Server Configuration
PORT=3101
NODE_ENV=development

# WebSocket Configuration
FRONTEND_URL=http://localhost:3100
ENABLE_WSS=true

# Solana Configuration
RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
PROGRAM_ID=your_program_id_here
```

## Step-by-Step Testing Instructions

### Phase 1: Dependency Verification

1. **Fix Missing Dependencies**
   ```bash
   cd defipoly-frontend
   npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
   ```

2. **Verify Package Versions**
   ```bash
   npm list socket.io-client
   npm list @solana/wallet-adapter-react
   ```

### Phase 2: Environment Configuration

3. **Setup Frontend Environment**
   ```bash
   cd defipoly-frontend
   cp .env.example .env.local
   # Edit .env.local with correct values
   ```

4. **Setup Backend Environment**
   ```bash
   cd defipoly-backend
   cp .env.example .env
   # Edit .env with correct values
   ```

5. **Verify Environment Variables**
   ```bash
   # Frontend
   echo "Frontend API URL: $NEXT_PUBLIC_API_BASE_URL"
   
   # Backend
   echo "Backend Port: $PORT"
   echo "Frontend URL: $FRONTEND_URL"
   ```

### Phase 3: Connection Testing

6. **Start Backend Server**
   ```bash
   cd defipoly-backend
   npm run dev
   ```

   **Expected Output:**
   ```
   🔌 Socket.IO server initialized
   🚀 Defipoly API v2.0 running on port 3101
   📢 Socket.IO server enabled on port 3101
   ```

7. **Start Frontend Development Server**
   ```bash
   cd defipoly-frontend
   npm run dev
   ```

   **Expected Output:**
   ```
   ✓ Ready on http://localhost:3100
   ```

8. **Monitor Connection Logs**
   
   **Backend Console Should Show:**
   ```
   📱 Client connected: [socket-id]
   ✅ Client [socket-id] subscribed to wallet [wallet-address]
   ```

   **Frontend Browser Console Should Show:**
   ```
   🔌 Connecting to WebSocket server: http://localhost:3101
   ✅ Connected to WebSocket server
   👛 Subscribing to wallet events: [wallet-address]
   ```

### Phase 4: Functional Testing

9. **Test Wallet Connection**
   - Open browser developer tools (F12)
   - Navigate to the game interface
   - Connect a Solana wallet
   - Check console for successful wallet subscription

10. **Test Property Subscriptions**
   ```javascript
   // In browser console
   const wsContext = window.__WEBSOCKET_CONTEXT__;
   if (wsContext) {
     wsContext.subscribeToProperty(1);
     console.log('Subscribed properties:', wsContext.subscribedProperties);
   }
   ```

11. **Test Game Events (Manual)**
   - Perform a game action (buy, sell, steal property)
   - Check both frontend and backend consoles for event logs
   - Verify UI updates in real-time

12. **Test Event Broadcasting**
   ```bash
   # Use backend API to simulate an event
   curl -X POST http://localhost:3101/api/actions \
     -H "Content-Type: application/json" \
     -d '{
       "txSignature": "test123",
       "actionType": "buy",
       "playerAddress": "test_wallet",
       "propertyId": 1,
       "amount": 1000000000,
       "slots": 1
     }'
   ```

### Phase 5: Stress Testing

13. **Connection Stability Test**
   - Refresh page multiple times
   - Verify reconnection works properly
   - Check for memory leaks in browser

14. **Multiple Client Test**
   - Open multiple browser tabs
   - Verify each gets unique socket connection
   - Test event broadcasting to all clients

15. **Network Interruption Test**
   - Disable network connection briefly
   - Verify automatic reconnection
   - Check event queue handling

### Phase 6: Integration Testing

16. **Live Feed Component**
   - Navigate to page with LiveFeed component
   - Perform actions and verify they appear in feed
   - Check profile loading for feed items

17. **Property Refresh Context**
   - Open property modal
   - Perform action on property from another client
   - Verify property data refreshes automatically

18. **Real-time Stats Updates**
   - Monitor player stats panel
   - Perform actions and verify stats update immediately
   - Check leaderboard updates

## Testing Checklist

### ✅ Pre-Test Verification
- [ ] All required dependencies installed
- [ ] Environment variables configured
- [ ] Backend server starts without errors
- [ ] Frontend builds and starts successfully

### ✅ Connection Testing
- [ ] WebSocket connection establishes successfully
- [ ] Wallet subscription works when wallet is connected
- [ ] Property subscriptions work correctly
- [ ] Disconnection and reconnection work properly

### ✅ Event Testing
- [ ] Property events (buy/sell/steal/shield) are received
- [ ] Player stats events are received
- [ ] Cooldown events are received
- [ ] Recent action events populate live feed
- [ ] Leaderboard updates are received

### ✅ UI Integration Testing
- [ ] LiveFeed component displays real-time actions
- [ ] Property modals refresh on property changes
- [ ] Player stats update without page refresh
- [ ] Cooldown timers update in real-time

### ✅ Error Handling Testing
- [ ] Frontend handles backend disconnection gracefully
- [ ] Invalid events don't crash the application
- [ ] Network interruptions are handled properly
- [ ] CORS issues are resolved

## Common Issues and Troubleshooting

### Connection Fails

**Problem:** WebSocket connection cannot be established

**Solutions:**
1. Verify backend is running on correct port (3101)
2. Check `NEXT_PUBLIC_API_BASE_URL` in frontend environment
3. Verify `FRONTEND_URL` in backend environment for CORS
4. Check firewall/proxy settings

### Wallet Events Not Working

**Problem:** Wallet-related events not being received

**Solutions:**
1. Ensure wallet is properly connected
2. Check wallet adapter dependencies are installed
3. Verify wallet public key is being passed correctly
4. Check backend logs for subscription confirmation

### Events Not Triggering

**Problem:** Game events not being sent from backend

**Solutions:**
1. Verify `gameEvents` are called in webhook controller
2. Check transaction processing is working
3. Verify Socket.IO is properly initialized
4. Check for errors in event emission

### CORS Errors

**Problem:** CORS policy blocks WebSocket connection

**Solutions:**
1. Set correct `FRONTEND_URL` in backend .env
2. Verify frontend URL matches CORS origin
3. Check for protocol mismatches (http vs https)
4. Ensure credentials are properly configured

### Performance Issues

**Problem:** WebSocket connection degrades over time

**Solutions:**
1. Check for memory leaks in event listeners
2. Verify proper cleanup on component unmount
3. Monitor connection pool limits
4. Check for excessive event frequency

## Security Considerations

1. **Wallet Address Validation:** Ensure wallet addresses are validated before subscription
2. **Rate Limiting:** Consider implementing rate limiting for WebSocket connections
3. **Event Data Sanitization:** Validate all event data before broadcasting
4. **Authentication:** Consider adding authentication for sensitive events

## Performance Monitoring

### Metrics to Track

1. **Connection Metrics:**
   - Connection establishment time
   - Reconnection frequency
   - Concurrent connection count

2. **Event Metrics:**
   - Event emission latency
   - Event processing time
   - Failed event delivery rate

3. **Resource Usage:**
   - Memory usage on both client and server
   - CPU usage during high event frequency
   - Network bandwidth utilization

### Monitoring Tools

```javascript
// Frontend monitoring
const wsContext = useWebSocket();
console.log('Connection status:', wsContext.connected);
console.log('Subscribed properties:', wsContext.subscribedProperties.size);

// Backend monitoring (available at /api/wss/stats)
curl http://localhost:3101/api/wss/stats
```

## Conclusion

This testing guide covers all aspects of the WebSocket implementation testing. The main issue identified is the missing Solana wallet adapter dependencies in the frontend, which must be resolved before testing can proceed successfully. Once dependencies are fixed and environment variables are properly configured, the WebSocket system should function correctly for real-time game events and updates.

For ongoing maintenance, implement automated tests for WebSocket functionality and monitor connection health using the provided endpoints and techniques.