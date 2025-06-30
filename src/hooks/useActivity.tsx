import { useState } from 'react';
import { useUser } from './useUser';

export interface ActivityEntry {
  id?: number;
  user_id: number;
  action: string;
  xp_earned?: number;
  description?: string;
  created_at?: string;
}

interface AddActivityData {
  action: string;
  xp_earned?: number;
  description?: string;
}

export const useActivity = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentActions, setRecentActions] = useState<Set<string>>(new Set());

  // Добавление новой активности
  const addActivity = async (activityData: AddActivityData): Promise<boolean> => {
    if (!user?.id) {
      setError('Пользователь не авторизован');
      return false;
    }

    // 🛡️ ЗАЩИТА ОТ ДУБЛИРОВАНИЯ (дедупликация по ключу)
    const recentKey = `${user.id}-${activityData.action}`;
    
    if (recentActions.has(recentKey)) {
      console.log('useActivity: Пропускаем дублированное действие:', activityData.action);
      return true; // Возвращаем true чтобы не показывать ошибку
    }

    // Добавляем в список недавних действий
    setRecentActions(prev => new Set([...prev, recentKey]));
    
    // Удаляем из списка через 1 секунду (защита от спама)
    setTimeout(() => {
      setRecentActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(recentKey);
        return newSet;
      });
    }, 1000);

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: Number(user.id), // ✅ КОНВЕРТИРУЕМ В NUMBER
          ...activityData
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Ошибка сервера: ${response.status}`);
      }

      console.log('useActivity: Активность добавлена:', result.data);
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('useActivity: Ошибка добавления активности:', errorMessage, err);
      
      // 🚨 НЕ БЛОКИРУЕМ UI ИЗ-ЗА ОШИБОК API
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Быстрые методы для часто используемых действий
  const logLogin = async (description = 'Вход в систему') => {
    return await addActivity({
      action: 'login',
      xp_earned: 10,
      description
    });
  };

  const logProfileUpdate = async (description = 'Обновление профиля') => {
    return await addActivity({
      action: 'profile_update',
      xp_earned: 25,
      description
    });
  };

  const logBenefitAdded = async (benefitName?: string) => {
    return await addActivity({
      action: 'benefit_added',
      xp_earned: 50,
      description: benefitName ? `Добавлена льгота: ${benefitName}` : 'Добавлена льгота'
    });
  };

  const logBenefitUsed = async (benefitName?: string) => {
    return await addActivity({
      action: 'benefit_used',
      xp_earned: 25,
      description: benefitName ? `Использована льгота: ${benefitName}` : 'Использована льгота'
    });
  };

  const logCustomActivity = async (action: string, xp: number, description?: string) => {
    return await addActivity({
      action,
      xp_earned: xp,
      description
    });
  };

  return {
    // Состояние
    isLoading,
    error,
    
    // Основные методы
    addActivity,
    
    // Быстрые методы
    logLogin,
    logProfileUpdate,
    logBenefitAdded,
    logBenefitUsed,
    logCustomActivity
  };
}; 