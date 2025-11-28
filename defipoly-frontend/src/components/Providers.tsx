'use client';

import { WalletContextProvider } from "@/contexts/WalletContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { GameStateProvider } from '@/contexts/GameStateContext';
import { RewardsProvider } from '@/contexts/RewardsContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ParticleSpawnProvider } from '@/contexts/ParticleSpawnContext';
import { DefipolyProvider } from '@/contexts/DefipolyContext';
import { MobileBlocker } from "./MobileBlocker";
import { SharedCanvasProvider } from "./3d/SharedCanvas";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <DefipolyProvider>
        <AuthProvider>
          <NotificationProvider>
              <WebSocketProvider>
                <GameStateProvider>
                  <RewardsProvider>
                    <ParticleSpawnProvider>
                      <SharedCanvasProvider>
                        {children}
                      </SharedCanvasProvider>
                    </ParticleSpawnProvider>
                  </RewardsProvider>
                </GameStateProvider>
              </WebSocketProvider>
          </NotificationProvider>
        </AuthProvider>
      </DefipolyProvider>
    </WalletContextProvider>
  );
}