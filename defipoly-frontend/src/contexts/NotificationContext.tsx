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
      
      {/* Notification Container */}
      <div 
        className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none"
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 9999
        }}
      >
        {notifications.map((notification, index) => (
            <div
              key={notification.id}
              className="pointer-events-auto"
              style={{
                minWidth: '320px',
                maxWidth: '28rem',
                background: notification.type === 'success' 
                  ? 'linear-gradient(to right, rgba(6, 78, 59, 0.95), rgba(6, 95, 70, 0.95))'
                  : notification.type === 'error'
                  ? 'linear-gradient(to right, rgba(127, 29, 29, 0.95), rgba(159, 18, 57, 0.95))'
                  : 'linear-gradient(to right, rgba(88, 28, 135, 0.95), rgba(107, 33, 168, 0.95))',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(24px)',
                border: notification.type === 'success'
                  ? '2px solid rgba(34, 197, 94, 0.5)'
                  : notification.type === 'error'
                  ? '2px solid rgba(239, 68, 68, 0.5)'
                  : '2px solid rgba(168, 85, 247, 0.5)',
                overflow: 'hidden',
                pointerEvents: 'auto',
                marginBottom: '12px',
                animation: 'slideInFromRight 0.3s ease-out'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '16px',
                paddingBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {notification.type === 'success' ? (
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  ) : notification.type === 'error' ? (
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  )}
                  <h3 style={{
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '18px',
                    margin: 0
                  }}>
                    {notification.title}
                  </h3>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '0 16px 16px 16px' }}>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  marginBottom: '12px'
                }}>
                  {notification.message}
                </p>
                
                {notification.txHash && (
                  <a
                    href={getSolscanUrl(notification.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span style={{ fontFamily: 'monospace' }}>
                      {notification.txHash.slice(0, 4)}...{notification.txHash.slice(-4)}
                    </span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>

              <div style={{
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)'
              }}>
                <div 
                  style={{
                    height: '100%',
                    background: notification.type === 'success' 
                      ? 'rgb(74, 222, 128)'
                      : notification.type === 'error'
                      ? 'rgb(248, 113, 113)'
                      : 'rgb(192, 132, 252)',
                    animation: `shrink ${notification.duration || 5000}ms linear forwards`
                  }}
                />
              </div>
            </div>
        ))}
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}