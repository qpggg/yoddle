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
  const analyzeMood = useCallback(async (moodData: MoodEntry) => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiClient.analyzeMood(moodData);
      if (response.success) {
        // Перезагружаем инсайты после анализа
        await loadInsights();
        return response.analysis;
      }
    } catch (err) {
      setError('Ошибка анализа настроения');
      console.error('Analyze mood error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadInsights]);

  // Логирование активности
  const logActivity = useCallback(async (activityData: ActivityEntry) => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiClient.logActivity(activityData);
      if (response.success) {
        // Перезагружаем рекомендации после логирования
        await loadRecommendations();
        return response.recommendation;
      }
    } catch (err) {
      setError('Ошибка логирования активности');
      console.error('Log activity error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadRecommendations]);

  // Загрузка всех данных при инициализации
  useEffect(() => {
    loadInsights();
    loadRecommendations();
    generateDailyInsight();
  }, [loadInsights, loadRecommendations, generateDailyInsight]);

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
