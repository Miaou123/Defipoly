'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface ThemeContextType {
  boardTheme: string;
  setBoardTheme: (theme: string) => void;
  propertyCardTheme: string;
  setPropertyCardTheme: (theme: string) => void;
  customBoardBackground: string | null;
  setCustomBoardBackground: (bg: string | null) => void;
  customPropertyCardBackground: string | null;
  setCustomPropertyCardBackground: (bg: string | null) => void;
  getBoardThemeStyles: () => string;
  getPropertyCardThemeId: () => string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();
  
  const [boardTheme, setBoardTheme] = useState('dark');
  const [propertyCardTheme, setPropertyCardTheme] = useState('dark');
  const [customBoardBackground, setCustomBoardBackground] = useState<string | null>(null);
  const [customPropertyCardBackground, setCustomPropertyCardBackground] = useState<string | null>(null);

  // Fetch themes from backend
  const fetchThemesFromBackend = async () => {
    if (!publicKey) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101'}/api/profile/themes/${publicKey.toString()}`);
      
      if (response.ok) {
        const themes = await response.json();
        if (themes.boardTheme) setBoardTheme(themes.boardTheme);
        if (themes.propertyCardTheme) setPropertyCardTheme(themes.propertyCardTheme);
        if (themes.customBoardBackground) setCustomBoardBackground(themes.customBoardBackground);
        if (themes.customPropertyCardBackground) setCustomPropertyCardBackground(themes.customPropertyCardBackground);
        console.log('Themes loaded from backend successfully');
      }
    } catch (error) {
      console.error('Error fetching themes from backend:', error);
      // Fallback to localStorage if backend fails
      loadThemesFromLocalStorage();
    }
  };

  // Load themes from localStorage as fallback
  const loadThemesFromLocalStorage = () => {
    if (publicKey) {
      const walletKey = publicKey.toString();
      const savedBoardTheme = localStorage.getItem(`boardTheme_${walletKey}`);
      const savedPropertyTheme = localStorage.getItem(`propertyTheme_${walletKey}`);
      const savedCustomBoard = localStorage.getItem(`customBoard_${walletKey}`);
      const savedCustomProperty = localStorage.getItem(`customProperty_${walletKey}`);

      if (savedBoardTheme) setBoardTheme(savedBoardTheme);
      if (savedPropertyTheme) setPropertyCardTheme(savedPropertyTheme);
      if (savedCustomBoard) setCustomBoardBackground(savedCustomBoard);
      if (savedCustomProperty) setCustomPropertyCardBackground(savedCustomProperty);
    }
  };

  // Load themes from backend first, fallback to localStorage on wallet connection
  useEffect(() => {
    if (publicKey) {
      fetchThemesFromBackend();
    }
  }, [publicKey]);

  // Save themes to both backend and localStorage when they change
  const saveThemeToBackend = async (themeData: any) => {
    if (!publicKey) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101'}/api/profile/themes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          ...themeData,
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to save theme to backend:', response.statusText);
      } else {
        console.log('Theme saved to backend successfully');
      }
    } catch (error) {
      console.error('Error saving theme to backend:', error);
    }
  };

  useEffect(() => {
    if (publicKey) {
      const walletKey = publicKey.toString();
      localStorage.setItem(`boardTheme_${walletKey}`, boardTheme);
      
      // Save to backend
      saveThemeToBackend({ 
        boardTheme,
        propertyCardTheme,
        customBoardBackground,
        customPropertyCardBackground 
      });
    }
  }, [boardTheme, publicKey]);

  useEffect(() => {
    if (publicKey) {
      const walletKey = publicKey.toString();
      localStorage.setItem(`propertyTheme_${walletKey}`, propertyCardTheme);
      
      // Save to backend
      saveThemeToBackend({ 
        boardTheme,
        propertyCardTheme,
        customBoardBackground,
        customPropertyCardBackground 
      });
    }
  }, [propertyCardTheme, publicKey]);

  useEffect(() => {
    if (publicKey) {
      const walletKey = publicKey.toString();
      if (customBoardBackground) {
        localStorage.setItem(`customBoard_${walletKey}`, customBoardBackground);
      } else {
        localStorage.removeItem(`customBoard_${walletKey}`);
      }
      
      // Save to backend
      saveThemeToBackend({ 
        boardTheme,
        propertyCardTheme,
        customBoardBackground,
        customPropertyCardBackground 
      });
    }
  }, [customBoardBackground, publicKey]);

  useEffect(() => {
    if (publicKey) {
      const walletKey = publicKey.toString();
      if (customPropertyCardBackground) {
        localStorage.setItem(`customProperty_${walletKey}`, customPropertyCardBackground);
      } else {
        localStorage.removeItem(`customProperty_${walletKey}`);
      }
      
      // Save to backend
      saveThemeToBackend({ 
        boardTheme,
        propertyCardTheme,
        customBoardBackground,
        customPropertyCardBackground 
      });
    }
  }, [customPropertyCardBackground, publicKey]);

  const getBoardThemeStyles = () => {
    if (boardTheme === 'custom' && customBoardBackground) {
      console.log('Using custom board background:', customBoardBackground);
      return `url(${customBoardBackground}) center/cover`;
    }
    
    // Default background when no custom theme is set
    return 'linear-gradient(135deg, rgba(12, 5, 25, 0.95), rgba(26, 11, 46, 0.9))';
  };

  const getPropertyCardThemeId = () => {
    return propertyCardTheme;
  };

  return (
    <ThemeContext.Provider value={{
      boardTheme,
      setBoardTheme,
      propertyCardTheme,
      setPropertyCardTheme,
      customBoardBackground,
      setCustomBoardBackground,
      customPropertyCardBackground,
      setCustomPropertyCardBackground,
      getBoardThemeStyles,
      getPropertyCardThemeId
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}