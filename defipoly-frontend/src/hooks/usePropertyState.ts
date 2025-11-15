// ============================================
// FILE: src/hooks/usePropertyState.ts
// Hook for fetching property availability from backend API
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { fetchAllPropertyStates, fetchPropertyState, type ApiPropertyState } from '@/services/api';

interface UsePropertyStateReturn {
  propertyStates: ApiPropertyState[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getAvailableSlots: (propertyId: number) => number;
  getPropertyState: (propertyId: number) => ApiPropertyState | null;
}

export function usePropertyState(): UsePropertyStateReturn {
  const [propertyStates, setPropertyStates] = useState<ApiPropertyState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const states = await fetchAllPropertyStates();
      setPropertyStates(states);
    } catch (err) {
      console.error('Error fetching property states:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch property states');
      setPropertyStates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAvailableSlots = useCallback((propertyId: number): number => {
    const state = propertyStates.find(s => s.property_id === propertyId);
    return state?.available_slots ?? 0;
  }, [propertyStates]);

  const getPropertyState = useCallback((propertyId: number): ApiPropertyState | null => {
    return propertyStates.find(s => s.property_id === propertyId) || null;
  }, [propertyStates]);

  return {
    propertyStates,
    loading,
    error,
    refresh: fetchData,
    getAvailableSlots,
    getPropertyState,
  };
}

// ========== Individual property fetcher ==========
export async function fetchPropertyAvailability(propertyId: number): Promise<number> {
  const state = await fetchPropertyState(propertyId);
  return state?.available_slots ?? 0;
}