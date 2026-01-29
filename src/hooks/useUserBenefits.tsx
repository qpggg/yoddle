import { useState, useEffect, useCallback } from 'react';
import { useUser } from './useUser';

interface Benefit {
  id: number;
  name: string;
  description: string;
  category: string;
}

export const useUserBenefits = () => {
  const { user } = useUser();
  const [userBenefits, setUserBenefits] = useState<Benefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserBenefits = useCallback(async () => {
    if (!user?.id) {
      console.log('[useUserBenefits] No user.id, skipping');
      setUserBenefits([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      console.log('[useUserBenefits] Starting to fetch benefits for user:', user.id);
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/user-benefits?user_id=${user.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[useUserBenefits] Benefits loaded:', data.benefits?.length || 0, 'benefits');
      setUserBenefits(data.benefits || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки льгот пользователя';
      console.error('[useUserBenefits] Error loading benefits:', error);
      setError(errorMessage);
      setUserBenefits([]);
    } finally {
      console.log('[useUserBenefits] Loading completed, setting isLoading = false');
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserBenefits();
  }, [fetchUserBenefits]);

  return { userBenefits, isLoading, error, refetch: fetchUserBenefits };
}; 