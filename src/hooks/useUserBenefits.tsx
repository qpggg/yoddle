import { useState, useEffect } from 'react';
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

  const fetchUserBenefits = async () => {
    if (!user?.id) {
      setUserBenefits([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/user-benefits?user_id=${user.id}`);
      const data = await response.json();
      setUserBenefits(data.benefits || []);
    } catch (error) {
      console.error('Ошибка загрузки льгот пользователя:', error);
      setUserBenefits([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBenefits();
  }, [user?.id]);

  return { userBenefits, isLoading, refetch: fetchUserBenefits };
}; 