'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  txHash?: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showSuccess: (title: string, message: string, txHash?: string) => void;
  showError: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    const duration = notification.duration || 5000;
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }, [removeNotification]);

  const showSuccess = useCallback((title: string, message: string, txHash?: string) => {
    showNotification({ type: 'success', title, message, txHash });
  }, [showNotification]);

  const showError = useCallback((title: string, message: string) => {
    showNotification({ type: 'error', title, message });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string) => {
    showNotification({ type: 'info', title, message });
  }, [showNotification]);

  const getSolscanUrl = (txHash: string) => {
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    return `https://solscan.io/tx/${txHash}${network === 'devnet' ? '?cluster=devnet' : ''}`;
  };

  return (
    <NotificationContext.Provider value={{ showNotification, showSuccess, showError, showInfo }}>
      {children}
      
      <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="pointer-events-auto animate-in slide-in-from-right-full duration-300"
          >
            <div className={`
              min-w-[320px] max-w-md rounded-xl shadow-2xl backdrop-blur-xl border-2 overflow-hidden
              ${notification.type === 'success' 
                ? 'bg-gradient-to-r from-green-900/95 to-emerald-900/95 border-green-500/50' 
                : notification.type === 'error'
                ? 'bg-gradient-to-r from-red-900/95 to-rose-900/95 border-red-500/50'
                : 'bg-gradient-to-r from-purple-900/95 to-purple-800/95 border-purple-500/50'
              }
            `}>
              <div className="flex items-start justify-between p-4 pb-2">
                <div className="flex items-center gap-3">
                  {notification.type === 'success' ? (
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  ) : notification.type === 'error' ? (
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  )}
                  <h3 className="font-bold text-white text-lg">{notification.title}</h3>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-4 pb-4">
                <p className="text-white/80 text-sm mb-3">{notification.message}</p>
                
                {notification.txHash && (
                  <a
                    href={getSolscanUrl(notification.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-semibold transition-all hover:scale-105 border border-white/20"
                  >
                    <span className="font-mono">{notification.txHash.slice(0, 4)}...{notification.txHash.slice(-4)}</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>

              <div className="h-1 bg-white/10">
                <div 
                  className={`h-full ${
                    notification.type === 'success' ? 'bg-green-400' :
                    notification.type === 'error' ? 'bg-red-400' : 'bg-purple-400'
                  }`}
                  style={{
                    animation: `shrink ${notification.duration || 5000}ms linear forwards`
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}