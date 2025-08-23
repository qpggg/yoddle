import { useState, useEffect, useCallback } from 'react';
import { useUser } from './useUser';

// Интерфейсы для типизации
interface ProductivityStats {
  current_score: number;
  current_level: string;
  current_tier: string;
  xp_multiplier: number;
  weekly_average: number;
  monthly_average: number;
  mood_stability: number;
  energy_consistency: number;
  stress_management: number;
  total_achievements: number;
  productivity_achievements: number;
}

interface ProductivityDashboard {
  user_id: number;
  user_name: string;
  productivity_score: number;
  productivity_level: string;
  productivity_tier: string;
  xp_multiplier: number;
  level_icon: string;
  level_color: string;
  level_description: string;
  weekly_productivity: number;
  monthly_productivity: number;
  mood_stability: number;
  energy_consistency: number;
  stress_management: number;
  daily_entries_count: number;
  weekly_entries_count: number;
  days_tracked_this_week: number;
  productivity_achievements_count: number;
}

interface ProductivityProgress {
  user_id: number;
  user_name: string;
  xp: number;
  level: number;
  productivity_score: number;
  productivity_level: string;
  productivity_tier: string;
  xp_multiplier: number;
  level_icon: string;
  level_color: string;
  progress_percentage: number;
  next_level: string;
  score_to_next_level: number;
}

interface ProductivityAchievement {
  code: string;
  name: string;
  description: string;
  category: string;
  xp_reward: number;
  icon: string;
  tier: string;
  unlocked: boolean;
  unlocked_at?: string;
}

interface WeeklyData {
  date: string;
  final_score: number;
  mood_component: number;
  activity_component: number;
  quality_multiplier: number;
  platform_activity_coefficient: number;
  mood_entries_count: number;
  activity_entries_count: number;
}

interface MoodCheckData {
  mood: number;
  energy: number;
  stress: number;
  notes: string;
}

interface ActivityLogData {
  activity: string;
  category: string;
  duration: number;
  success: boolean;
  notes: string;
  mood: number;
  energy: number;
  stress: number;
}

// Основной хук для продуктивности
export const useProductivity = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния для данных
  const [stats, setStats] = useState<ProductivityStats | null>(null);
  const [dashboard, setDashboard] = useState<ProductivityDashboard | null>(null);
  const [progress, setProgress] = useState<ProductivityProgress | null>(null);
  const [achievements, setAchievements] = useState<ProductivityAchievement[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);

  // Базовый URL для API
  const API_BASE = '/api/productivity';

  // Функция для обработки ошибок
  const handleError = (error: any, defaultMessage: string) => {
    console.error('Productivity API Error:', error);
    const message = error.response?.data?.message || error.message || defaultMessage;
    setError(message);
    return message;
  };

  // Функция для очистки ошибок
  const clearError = () => setError(null);

  // Проверка настроения
  const checkMood = useCallback(async (data: MoodCheckData): Promise<{ success: boolean; message: string; score?: number }> => {
    if (!user?.id) {
      const message = 'Пользователь не авторизован';
      setError(message);
      return { success: false, message };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/mood-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...data
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Обновляем статистику
        if (result.stats) {
          setStats(result.stats);
        }
        return { 
          success: true, 
          message: result.message,
          score: result.productivityScore
        };
      } else {
        const message = result.message || 'Ошибка при записи настроения';
        setError(message);
        return { success: false, message };
      }
    } catch (err: any) {
      const message = handleError(err, 'Ошибка при записи настроения');
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Логирование активности
  const logActivity = useCallback(async (data: ActivityLogData): Promise<{ success: boolean; message: string; score?: number }> => {
    if (!user?.id) {
      const message = 'Пользователь не авторизован';
      setError(message);
      return { success: false, message };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/activity-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...data
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Обновляем статистику
        if (result.stats) {
          setStats(result.stats);
        }
        return { 
          success: true, 
          message: result.message,
          score: result.productivityScore
        };
      } else {
        const message = result.message || 'Ошибка при записи активности';
        setError(message);
        return { success: false, message };
      }
    } catch (err: any) {
      const message = handleError(err, 'Ошибка при записи активности');
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Загрузка статистики продуктивности
  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/stats/${user.id}`);
      const result = await response.json();

      if (result.success) {
        setStats(result.stats);
      } else {
        setError(result.message || 'Ошибка при загрузке статистики');
      }
    } catch (err: any) {
      handleError(err, 'Ошибка при загрузке статистики');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Загрузка данных дашборда
  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/dashboard/${user.id}`);
      const result = await response.json();

      if (result.success) {
        setDashboard(result.dashboard);
      } else {
        setError(result.message || 'Ошибка при загрузке дашборда');
      }
    } catch (err: any) {
      handleError(err, 'Ошибка при загрузке дашборда');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Загрузка данных прогресса
  const loadProgress = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading progress for user:', user.id);
      const response = await fetch(`${API_BASE}/progress/${user.id}`);
      const result = await response.json();

      if (result.success) {
        console.log('✅ Progress loaded:', result.progress);
        setProgress(result.progress);
      } else {
        console.error('❌ Progress load failed:', result.message);
        setError(result.message || 'Ошибка при загрузке прогресса');
      }
    } catch (err: any) {
      console.error('❌ Progress load error:', err);
      handleError(err, 'Ошибка при загрузке прогресса');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Загрузка достижений
  const loadAchievements = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/achievements/${user.id}`);
      const result = await response.json();

      if (result.success) {
        setAchievements(result.achievements);
      } else {
        setError(result.message || 'Ошибка при загрузке достижений');
      }
    } catch (err: any) {
      handleError(err, 'Ошибка при загрузке достижений');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Загрузка недельных данных
  const loadWeeklyData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/weekly/${user.id}`);
      const result = await response.json();

      if (result.success) {
        setWeeklyData(result.weeklyData);
      } else {
        setError(result.message || 'Ошибка при загрузке недельных данных');
      }
    } catch (err: any) {
      handleError(err, 'Ошибка при загрузке недельных данных');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Принудительный расчет продуктивности
  const calculateProductivity = useCallback(async (date?: string) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/calculate/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      });

      const result = await response.json();

      if (result.success) {
        // Обновляем статистику
        if (result.stats) {
          setStats(result.stats);
        }
        return { 
          success: true, 
          message: result.message,
          score: result.productivityScore
        };
      } else {
        const message = result.message || 'Ошибка при расчете продуктивности';
        setError(message);
        return { success: false, message };
      }
    } catch (err: any) {
      const message = handleError(err, 'Ошибка при расчете продуктивности');
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Загрузка всех данных при изменении пользователя
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Loading productivity data for user:', user.id);
      loadStats();
      loadDashboard();
      loadProgress();
      loadAchievements();
      loadWeeklyData();
    }
  }, [user?.id, loadStats, loadDashboard, loadProgress, loadAchievements, loadWeeklyData]);

  // Функция для получения цвета уровня
  const getLevelColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return '#8B4513';
      case 'silver': return '#4682B4';
      case 'gold': return '#FFD700';
      case 'platinum': return '#9370DB';
      default: return '#8B4513';
    }
  };

  // Функция для получения иконки уровня
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Новичок': return '🌱';
      case 'Стажер': return '🚀';
      case 'Специалист': return '⭐';
      case 'Эксперт': return '👑';
      case 'Мастер': return '💎';
      default: return '🌱';
    }
  };

  // Функция для получения описания уровня
  const getLevelDescription = (level: string) => {
    switch (level) {
      case 'Новичок': return 'Начинающий путь к продуктивности';
      case 'Стажер': return 'Стабильный прогресс';
      case 'Специалист': return 'Опытный пользователь';
      case 'Эксперт': return 'Высокий уровень продуктивности';
      case 'Мастер': return 'Максимальная продуктивность';
      default: return 'Начинающий путь к продуктивности';
    }
  };

  return {
    // Состояния
    loading,
    error,
    stats,
    dashboard,
    progress,
    achievements,
    weeklyData,
    
    // Функции
    checkMood,
    logActivity,
    loadStats,
    loadDashboard,
    loadProgress,
    loadAchievements,
    loadWeeklyData,
    calculateProductivity,
    clearError,
    
    // Утилиты
    getLevelColor,
    getLevelIcon,
    getLevelDescription,
  };
};
