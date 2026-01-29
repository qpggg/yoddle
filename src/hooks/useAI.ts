import { useState, useEffect, useCallback } from 'react';
import aiClient, { 
  MoodEntry, 
  ActivityEntry, 
  AIInsight, 
  AIRecommendation 
} from '../services/aiClient';

export const useAI = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [dailyInsight, setDailyInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка инсайтов
  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiClient.getInsights();
      if (response.success) {
        setInsights(response.insights);
      }
    } catch (err) {
      setError('Ошибка загрузки инсайтов');
      console.error('Load insights error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка рекомендаций
  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiClient.getRecommendations();
      if (response.success) {
        setRecommendations(response.recommendations);
      }
    } catch (err) {
      setError('Ошибка загрузки рекомендаций');
      console.error('Load recommendations error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Генерация дневного инсайта
  const generateDailyInsight = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiClient.generateDailyInsight();
      if (response.success) {
        setDailyInsight(response.insight);
        // Перезагружаем инсайты после генерации нового
        await loadInsights();
      }
    } catch (err) {
      setError('Ошибка генерации инсайта');
      console.error('Generate daily insight error:', err);
    } finally {
      setLoading(false);
    }
  }, [loadInsights]);

  // Анализ настроения
  const analyzeMood = useCallback(async (moodData: MoodEntry, userId?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userId) {
        throw new Error('User ID is required for mood analysis');
      }
      
      const response = await aiClient.analyzeMood(moodData, userId);
      if (response.success && response.analysis) {
        // Перезагружаем инсайты после анализа
        await loadInsights();
        return response.analysis;
      } else {
        throw new Error(response.error || 'Failed to analyze mood');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Ошибка анализа настроения';
      setError(errorMessage);
      console.error('Analyze mood error:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadInsights]);

  // Логирование активности
  const logActivity = useCallback(async (activityData: ActivityEntry, userId?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userId) {
        throw new Error('User ID is required for activity logging');
      }
      
      const response = await aiClient.logActivity(activityData, userId);
      if (response.success && response.recommendation) {
        // Перезагружаем рекомендации после логирования
        await loadRecommendations();
        return response.recommendation;
      } else {
        throw new Error(response.error || 'Failed to log activity');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Ошибка логирования активности';
      setError(errorMessage);
      console.error('Log activity error:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadRecommendations]);

  // Загрузка всех данных при инициализации
  // ИСПРАВЛЕНО: убрали автоматический вызов generateDailyInsight() так как он использует дефолтный userId='1'
  // Недельный инсайт должен загружаться через loadWeeklyInsight() с правильным userId
  useEffect(() => {
    loadInsights();
    loadRecommendations();
    // generateDailyInsight() вызывается только явно с правильным userId
  }, [loadInsights, loadRecommendations]);

  return {
    insights,
    recommendations,
    dailyInsight,
    loading,
    error,
    analyzeMood,
    logActivity,
    generateDailyInsight,
    refreshData: () => {
      loadInsights();
      loadRecommendations();
      generateDailyInsight();
    }
  };
};
