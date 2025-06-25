import { useState, useEffect, useCallback } from 'react';
import { useUser } from './useUser';

interface ProgressData {
  xp: number;
  level: number;
  login_streak: number;
  days_active: number;
  benefits_used: number;
  profile_completion: number;
  unlockedAchievements: string[];
}

interface XPNotification {
  xp: number;
  action: string;
  visible: boolean;
}

export const useProgress = () => {
  const { user } = useUser();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [notification, setNotification] = useState<XPNotification>({ xp: 0, action: '', visible: false });
  const [loading, setLoading] = useState(false);

  // Загрузка прогресса пользователя
  const loadProgress = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/progress?user_id=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setProgress({
          xp: data.progress.xp || 0,
          level: data.progress.level || 1,
          login_streak: data.progress.login_streak || 0,
          days_active: data.progress.days_active || 0,
          benefits_used: data.progress.benefits_used || 0,
          profile_completion: data.progress.profile_completion || 0,
          unlockedAchievements: data.achievements || []
        });
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Добавление очков опыта
  const addXP = useCallback(async (xpToAdd: number, action: string, showNotification = true) => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          xp_to_add: xpToAdd,
          action
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Обновляем локальный прогресс
        setProgress(prev => prev ? {
          ...prev,
          xp: data.newXP,
          level: data.newLevel
        } : null);

        // Показываем уведомление
        if (showNotification) {
          setNotification({
            xp: xpToAdd,
            action,
            visible: true
          });
        }

        // Если разблокированы новые достижения
        if (data.unlockedAchievements?.length > 0) {
          // Можно показать дополнительные уведомления о достижениях
          console.log('Unlocked achievements:', data.unlockedAchievements);
        }

        return data;
      }
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  }, [user?.id]);

  // Обновление статистики
  const updateStat = useCallback(async (field: string, value: number) => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          field,
          value
        })
      });

      if (response.ok) {
        setProgress(prev => prev ? {
          ...prev,
          [field]: value
        } : null);
      }
    } catch (error) {
      console.error('Error updating stat:', error);
    }
  }, [user?.id]);

  // Скрытие уведомления
  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, visible: false }));
  }, []);

  // Загрузка прогресса при изменении пользователя
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Автоматическое начисление XP за вход (можно вызывать при инициализации)
  const handleDailyLogin = useCallback(() => {
    addXP(10, 'login');
  }, [addXP]);

  // Начисление XP за выбор льготы
  const handleBenefitSelected = useCallback(() => {
    addXP(50, 'benefit_selected');
  }, [addXP]);

  // Начисление XP за обновление профиля
  const handleProfileUpdate = useCallback(() => {
    addXP(25, 'profile_update');
  }, [addXP]);

  // Получение текущего ранга
  const getCurrentRank = useCallback(() => {
    if (!progress) return { name: 'Новичок', color: '#8E8E93' };
    
    const { xp } = progress;
    
    if (xp >= 1001) return { name: 'Легенда', color: '#FF9500' };
    if (xp >= 501) return { name: 'Мастер', color: '#AF52DE' };
    if (xp >= 301) return { name: 'Эксперт', color: '#007AFF' };
    if (xp >= 101) return { name: 'Активный', color: '#34C759' };
    return { name: 'Новичок', color: '#8E8E93' };
  }, [progress]);

  // Получение прогресса до следующего уровня
  const getProgressToNextLevel = useCallback(() => {
    if (!progress) return { current: 0, next: 100, percent: 0 };
    
    const { xp } = progress;
    
    let nextLevelXP = 100;
    if (xp >= 1001) nextLevelXP = Infinity;
    else if (xp >= 501) nextLevelXP = 1001;
    else if (xp >= 301) nextLevelXP = 501;
    else if (xp >= 101) nextLevelXP = 301;
    
    const currentRank = getCurrentRank();
    let minXP = 0;
    if (currentRank.name === 'Легенда') minXP = 1001;
    else if (currentRank.name === 'Мастер') minXP = 501;
    else if (currentRank.name === 'Эксперт') minXP = 301;
    else if (currentRank.name === 'Активный') minXP = 101;
    
    const percent = nextLevelXP === Infinity ? 100 : ((xp - minXP) / (nextLevelXP - minXP)) * 100;
    
    return {
      current: xp,
      next: nextLevelXP,
      percent: Math.min(percent, 100)
    };
  }, [progress, getCurrentRank]);

  return {
    progress,
    loading,
    notification,
    addXP,
    updateStat,
    hideNotification,
    loadProgress,
    handleDailyLogin,
    handleBenefitSelected,
    handleProfileUpdate,
    getCurrentRank,
    getProgressToNextLevel
  };
}; 