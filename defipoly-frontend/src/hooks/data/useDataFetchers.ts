import { useCallback } from 'react';
import { Program } from '@coral-xyz/anchor';
import { fetchPropertyData, fetchOwnershipData, fetchPlayerData, fetchSetCooldownData } from '@/utils/program';

export const useDataFetchers = (program: Program | null, wallet: any) => {
  const getPropertyData = useCallback(async (propertyId: number) => {
    if (!program) throw new Error('Program not initialized');
    return await fetchPropertyData(program, propertyId);
  }, [program]);

  const getOwnershipData = useCallback(async (propertyId: number) => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    return await fetchOwnershipData(program, wallet.publicKey, propertyId);
  }, [program, wallet]);

  const getPlayerData = useCallback(async () => {
    if (!program || !wallet) throw new Error('Wallet not connected');
    return await fetchPlayerData(program, wallet.publicKey);
  }, [program, wallet]);

  const getSetCooldownData = useCallback(async (setId: number) => {
    if (!program || !wallet) return null;
    return fetchSetCooldownData(program, wallet.publicKey, setId);
  }, [program, wallet]);

  return {
    getPropertyData,
    getOwnershipData,
    getPlayerData,
    getSetCooldownData
  };
};