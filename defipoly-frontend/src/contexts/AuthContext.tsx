// ============================================
// Frontend: JWT Auth Context
// src/contexts/AuthContext.tsx
// ============================================

'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { jwtDecode } from 'jwt-decode';
import bs58 from 'bs58';
import { DevnetConfirmationModal } from '@/components/DevnetConfirmationModal';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, signMessage, connected } = useWallet();
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Devnet confirmation modal state
  const [pendingAuthToken, setPendingAuthToken] = useState<string | null>(null);
  const [showDevnetModal, setShowDevnetModal] = useState(false);

  // Check if user has already confirmed devnet for this wallet
  const hasDevnetConfirmation = useCallback((walletAddress: string): boolean => {
    const confirmationKey = 'defipoly_devnet_confirmed';
    const confirmedWallet = localStorage.getItem(confirmationKey);
    return confirmedWallet === walletAddress;
  }, []);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('defipoly_auth_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('defipoly_auth_token');
    
    if (savedToken && publicKey) {
      try {
        const decoded = jwtDecode<{ wallet: string }>(savedToken);
        
        // If wallet changed, logout
        if (decoded.wallet !== publicKey.toString()) {
          logout();
        }
      } catch (error) {
        // Invalid token
        logout();
      }
    }
  }, [publicKey]);

  const login = useCallback(async () => {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected');
    }

    try {
      const walletAddress = publicKey.toString();

      // Step 1: Get nonce
      const nonceResponse = await fetch(`${API_BASE_URL}/api/auth/nonce?wallet=${walletAddress}`);
      if (!nonceResponse.ok) throw new Error('Failed to get nonce');
      const { nonce } = await nonceResponse.json();

      // Step 2: Sign message with nonce
      const message = `Sign this message to authenticate with Defipoly.\n\nNonce: ${nonce}`;
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = bs58.encode(signatureBytes);

      // Step 3: Verify signature and get JWT
      const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress, signature })
      });

      if (!verifyResponse.ok) throw new Error('Authentication failed');
      
      const { token: jwtToken } = await verifyResponse.json();

      // Step 4: Check if user needs devnet confirmation
      if (hasDevnetConfirmation(walletAddress)) {
        // User already confirmed devnet for this wallet, complete auth immediately
        localStorage.setItem('defipoly_auth_token', jwtToken);
        setToken(jwtToken);
        setIsAuthenticated(true);
      } else {
        // User needs to confirm devnet settings, show modal
        setPendingAuthToken(jwtToken);
        setShowDevnetModal(true);
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }, [publicKey, signMessage, hasDevnetConfirmation]);

  // Handle devnet confirmation
  const handleDevnetConfirmed = useCallback(() => {
    if (pendingAuthToken) {
      // Complete the auth process
      localStorage.setItem('defipoly_auth_token', pendingAuthToken);
      setToken(pendingAuthToken);
      setIsAuthenticated(true);
      
      // Clean up modal state
      setPendingAuthToken(null);
      setShowDevnetModal(false);
    }
  }, [pendingAuthToken]);

  const logout = useCallback(() => {
    localStorage.removeItem('defipoly_auth_token');
    setToken(null);
    setIsAuthenticated(false);
    
    // Clean up modal state
    setPendingAuthToken(null);
    setShowDevnetModal(false);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
      
      {/* Devnet Confirmation Modal */}
      <DevnetConfirmationModal
        isOpen={showDevnetModal}
        walletAddress={publicKey?.toString() || ''}
        onConfirm={handleDevnetConfirmed}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// ============================================
// Helper function for authenticated requests
// ============================================

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('defipoly_auth_token');

    if (!token) {
        throw new Error('Not authenticated');
    }

    const headers: any = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
    };

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    return fetch(url, {
        ...options,
        headers,
    });
}
