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
  
  const [boardTheme, setBoardTheme] = useState('classic');
  const [propertyCardTheme, setPropertyCardTheme] = useState('default');
  const [customBoardBackground, setCustomBoardBackground] = useState<string | null>(null);
  const [customPropertyCardBackground, setCustomPropertyCardBackground] = useState<string | null>(null);

  // Load themes from localStorage on wallet connection
  useEffect(() => {
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
  }, [publicKey]);

  // Save themes to localStorage when they change
  useEffect(() => {
    if (publicKey) {
      const walletKey = publicKey.toString();
      localStorage.setItem(`boardTheme_${walletKey}`, boardTheme);
    }
  }, [boardTheme, publicKey]);

  useEffect(() => {
    if (publicKey) {
      const walletKey = publicKey.toString();
      localStorage.setItem(`propertyTheme_${walletKey}`, propertyCardTheme);
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
    }
  }, [customPropertyCardBackground, publicKey]);

  const getBoardThemeStyles = () => {
    if (boardTheme === 'custom' && customBoardBackground) {
      return `url(${customBoardBackground}) center/cover`;
    }
    
    const themeMap: Record<string, string> = {
      'classic': 'linear-gradient(135deg, rgba(12, 5, 25, 0.95), rgba(26, 11, 46, 0.9))',
      'ocean': 'linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(17, 94, 89, 0.9))',
      'fire': 'linear-gradient(135deg, rgba(127, 29, 29, 0.95), rgba(154, 52, 18, 0.9))',
      'dark': 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(0, 0, 0, 0.9))',
    };
    return themeMap[boardTheme] || themeMap['classic'];
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