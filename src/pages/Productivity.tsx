import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Container, Typography, Box, Grid, Paper, Card, Button, Slider, TextField, CircularProgress, Alert, Snackbar, Tooltip, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import { useProductivity } from '../hooks/useProductivity';
import { useAI } from '../hooks/useAI';

// Утилита для retry логики с таймаутом
const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}, 
  retries = 2, 
  timeout = 30000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok && retries > 0 && response.status >= 500) {
      // Retry только для серверных ошибок
      await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
      return fetchWithRetry(url, options, retries - 1, timeout);
    }
    
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Запрос превысил время ожидания');
    }
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
      return fetchWithRetry(url, options, retries - 1, timeout);
    }
    throw error;
  }
};

// Debounce утилита
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
import {
  BrainIcon,
  HeartIcon,
  SparklesIcon,
  LightbulbIcon,
  ArrowRightIcon,
  UserCheckIcon,
  BarChart3Icon,
  ZapIcon,
  ActivityIcon,
  StarIcon,
  ShieldCheckIcon,
  TrophyIcon,
  FlameIcon,
  GemIcon,
  BriefcaseIcon,
  BookOpenIcon,
  Building2Icon,
  GraduationCapIcon,
  PartyPopperIcon,
  TargetIcon,
  RocketIcon,
  InfoIcon,
  AlertTriangleIcon
} from 'lucide-react';

// Компонент для отображения AI ответов с иконками
interface AIResponseDisplayProps {
  response: string;
  isWeekly?: boolean; // true для недельного инсайта, false для обычного анализа
}

const AIResponseDisplay: React.FC<AIResponseDisplayProps> = ({ response, isWeekly = false }) => {
  // Функция для замены XML-тегов на иконки и форматирования
  const formatAIResponse = useCallback((text: string) => {
    if (!text) return text;

    // Убираем теги response если они есть
    let formattedText = text
      .replace(/<response>/g, '')
      .replace(/<\/response>/g, '')
      
      // Убираем английский текст situation_assessment
      .replace(/<situation_assessment>[\s\S]*?<\/situation_assessment>/g, '')
      
      // Основные теги для недельного инсайта
      .replace(/<answer>/g, '')
      .replace(/<\/answer>/g, '')
      
      // Эмоциональные реакции
      .replace(/<emotional_reaction>/g, 'EMOTION ')
      .replace(/<\/emotional_reaction>/g, '\n\n')
      
      // Анализ ситуации
      .replace(/<situation_analysis>/g, 'ANALYSIS ')
      .replace(/<\/situation_analysis>/g, '\n\n')
      
      // Советы
      .replace(/<advice>/g, 'ADVICE ')
      .replace(/<\/advice>/g, '\n\n')
      
      // Прогноз
      .replace(/<forecast>/g, 'FORECAST ')
      .replace(/<\/forecast>/g, '\n\n')
      
      // Недельный инсайт
      .replace(/<weekly_insight>/g, 'WEEKLY ')
      .replace(/<\/weekly_insight>/g, '\n\n')
      
      // Поддержка
      .replace(/<encouragement>/g, 'SUPPORT ')
      .replace(/<\/encouragement>/g, '\n\n')
      
      // Конкретный совет
      .replace(/<specific_advice>/g, 'SPECIFIC ')
      .replace(/<\/specific_advice>/g, '\n\n')
      
      // Мотивация
      .replace(/<motivation>/g, 'MOTIVATION ')
      .replace(/<\/motivation>/g, '\n\n')
      
      // Сначала добавляем перенос перед "🚀 ЧТО ДАЛЬШЕ:"
      .replace(/\s*🚀/g, '\n🚀')
      // Убираем все переносы строк и заменяем на пробелы
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      // Снова добавляем перенос перед "🚀 ЧТО ДАЛЬШЕ:"
      .replace(/\s*🚀/g, '\n🚀')
      .trim();

    return formattedText;
  }, []);

  const formattedResponse = useMemo(() => formatAIResponse(response), [response, formatAIResponse]);

  // Проверяем, есть ли XML-теги в ответе
  const hasXMLTags = /<[^>]+>/.test(response);
  
  if (!hasXMLTags) {
    // Если нет XML-тегов, отображаем как обычный текст
    return (
      <Typography 
        variant="body1" 
        sx={{ 
          color: isWeekly ? '#fff' : '#1A1A1A',
          fontWeight: 500,
          lineHeight: 1.8,
          whiteSpace: 'normal'
        }}
      >
        {response}
      </Typography>
    );
  }

  return (
    <Box sx={{ 
      textAlign: 'left',
      lineHeight: 1.8
    }}>
      {formattedResponse.split('\n\n').map((section, index) => {
        if (!section.trim()) return null;
        
        // Определяем тип секции по ключевому слову
        const sectionType = section.split(' ')[0];
        let icon = null;
        
        switch (sectionType) {
          case 'EMOTION':
            icon = <PartyPopperIcon size={20} color="#8B0000" />;
            break;
          case 'ANALYSIS':
            icon = <BrainIcon size={20} color="#8B0000" />;
            break;
          case 'ADVICE':
            icon = <LightbulbIcon size={20} color="#8B0000" />;
            break;
          case 'FORECAST':
            icon = <GemIcon size={20} color="#8B0000" />;
            break;
          case 'WEEKLY':
            icon = <BarChart3Icon size={20} color="#8B0000" />;
            break;
          case 'SUPPORT':
            icon = <TargetIcon size={20} color="#8B0000" />;
            break;
          case 'SPECIFIC':
            icon = <RocketIcon size={20} color="#8B0000" />;
            break;
          case 'MOTIVATION':
            icon = <StarIcon size={20} color="#8B0000" />;
            break;
          default:
            icon = <SparklesIcon size={20} color="#8B0000" />;
        }

        return (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 2, 
              mb: 2
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              flexShrink: 0,
              mt: 0.5
            }}>
              {icon}
            </Box>
            <Typography 
              variant="body1" 
              sx={{ 
                flex: 1,
                color: isWeekly ? '#fff' : '#1A1A1A',
                fontWeight: 500,
                lineHeight: 1.6
              }}
            >
              {section.replace(/^(EMOTION|ANALYSIS|ADVICE|FORECAST|WEEKLY|SUPPORT|SPECIFIC|MOTIVATION)\s+/, '').trim()}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

// Анимационные варианты
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.15,
      ease: 'easeOut'
    }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: 'easeOut'
    }
  }
};

const cardStyle = {
  background: '#fff',
  borderRadius: '24px',
  padding: '2rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
  border: '1px solid #eee',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
};

// Интерфейсы
interface WeeklyMood {
  day: string;
  mood: number;
  energy: number;
  stress: number;
}



interface MoodEntry {
  mood: number;
  energy: number;
  stress: number;
  notes: string;
}

// Компонент анимированного AI мозга
const AnimatedBrain: React.FC = () => (
  <motion.div
    style={{
      width: '80px',
      height: '80px',
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1.5rem',
      boxShadow: '0 20px 40px rgba(139,0,0,0.3), 0 8px 16px rgba(0,0,0,0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}
    animate={{
      rotate: [0, 1, -1, 0],
      scale: [1, 1.01, 1],
      boxShadow: [
        '0 20px 40px rgba(139,0,0,0.3), 0 8px 16px rgba(0,0,0,0.1)',
        '0 22px 44px rgba(139,0,0,0.35), 0 10px 20px rgba(0,0,0,0.12)',
        '0 20px 40px rgba(139,0,0,0.3), 0 8px 16px rgba(0,0,0,0.1)'
      ]
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
    whileHover={{
      scale: 1.05,
      rotate: 3,
      transition: { duration: 0.2 }
    }}
  >
    {/* Фоновый градиент с анимацией */}
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)',
        borderRadius: '24px'
      }}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.5, 0.8, 0.5]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
    
    <BrainIcon size={40} color="#fff" style={{ position: 'relative', zIndex: 1 }} />
  </motion.div>
);

// Компонент премиального анимированного индикатора
const AnimatedMoodIndicator: React.FC<{ value: number; label: string; color: string; icon: React.ReactNode }> = ({ value, label, color, icon }) => (
  <Box sx={{ 
    flex: '1 1 0',
    minWidth: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
    borderRadius: '20px',
    padding: { xs: '16px 12px', sm: '24px 20px' },
    border: '1px solid rgba(139,0,0,0.1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
    }
  }}>
    {/* Иконка и процент */}
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Box sx={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        boxShadow: `0 4px 16px ${color}40`
      }}>
        {icon}
      </Box>
      <Typography variant="h4" sx={{ 
        fontWeight: 800,
        color: color,
        fontSize: '2rem'
      }}>
        {Math.round(value)}%
      </Typography>
    </Box>
    
    {/* Прогресс-бар */}
    <Box sx={{ mb: 2 }}>
      <Box sx={{
        width: '100%',
        height: '8px',
        borderRadius: '4px',
        background: 'rgba(0,0,0,0.08)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${color} 0%, ${color}DD 100%)`,
            borderRadius: '4px',
            boxShadow: `0 2px 8px ${color}60`
          }}
        />
      </Box>
    </Box>
    {/* Название */}
    <Typography variant="body1" sx={{ 
      fontWeight: 600, 
      color: '#555',
      fontSize: '1rem',
      textAlign: 'center'
    }}>
      {label}
    </Typography>
  </Box>
);

const Productivity: React.FC = () => {
  const { user } = useUser();
  const { 
    analyzeMood,
    logActivity
    // generateDailyInsight не используем - у нас есть loadWeeklyInsight() с правильным userId
  } = useAI();
  
  // Состояние для недельного инсайта
  const [weeklyInsight, setWeeklyInsight] = useState<string>('');
  const [weeklyInsightLoading, setWeeklyInsightLoading] = useState(false);
  
  // Хук для продуктивности
  const {
    dashboard,
    moodPercentages,
    dailyMoodData,
    loading: productivityLoading,
    error: productivityError,
    loadDashboard,
    loadMoodPercentages
  } = useProductivity();
  
  // Состояния
  const [weeklyMood, setWeeklyMood] = useState<WeeklyMood[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [formType, setFormType] = useState<'mood' | 'activity' | null>(null);
  const [moodEntry, setMoodEntry] = useState<MoodEntry>({
    mood: 7,
    energy: 7,
    stress: 3,
    notes: ''
  });
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [lastActivities, setLastActivities] = useState<{[key: string]: string}>({});
  
  // Состояния для логирования активностей
  const [activityEntry, setActivityEntry] = useState({
    activity: '',
    category: 'work',
    duration: 60,
    success: true,
    notes: '',
    mood: 7,
    energy: 7,
    stress: 3,
    success_rating: 5
  });
  
  // Состояния для графика зависимости рейтинга от активностей
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartStats, setChartStats] = useState<any>(null);
  const [showActivityChart, setShowActivityChart] = useState(false);

  // Ref для формы и графика
  const formRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Загрузка недельного инсайта с retry и таймаутом
  const loadWeeklyInsight = useCallback(async () => {
    if (!user?.id) return;
    
    setWeeklyInsightLoading(true);
    try {
      const response = await fetchWithRetry('/api/ai/generate-daily-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: String(user.id), 
          forceRegenerate: !weeklyInsight
        })
      }, 2, 45000); // 45 секунд таймаут для AI запросов
      
      const data = await response.json();
      
      if (data.success && data.insight) {
        setWeeklyInsight(data.insight);
      } else {
        setWeeklyInsight(data.insight || '');
      }
    } catch (error: any) {
      // Graceful degradation - показываем сообщение вместо пустоты
      setWeeklyInsight('Не удалось загрузить недельный анализ. Попробуйте обновить страницу.');
    } finally {
      setWeeklyInsightLoading(false);
    }
  }, [user?.id, weeklyInsight]);
  
  // Загрузка данных графика зависимости рейтинга от активностей
  const loadRatingChart = useCallback(async () => {
    if (!user?.id) return;
    
    setChartLoading(true);
    try {
      const response = await fetchWithRetry(`/api/productivity/rating-chart/${user.id}?days=14`, {}, 2, 20000);
      const data = await response.json();
      
      if (data.success && data.chartData && data.chartData.length > 0) {
        setChartData(data.chartData);
        setChartStats(data.stats);
      } else {
        setChartData([]);
        setChartStats(null);
      }
    } catch (error) {
      // Graceful degradation - показываем пустой график вместо ошибки
      setChartData([]);
      setChartStats(null);
    } finally {
      setChartLoading(false);
    }
  }, [user?.id]);
  
  // Загрузка данных при монтировании
  useEffect(() => {
    if (user?.id) {
      loadDashboard();
      loadMoodPercentages();
      loadRatingChart();
      loadWeeklyInsight();
    }
  }, [user?.id, loadDashboard, loadMoodPercentages, loadRatingChart, loadWeeklyInsight]);

  // Мемоизированное преобразование данных настроения
  const transformedWeeklyMood = useMemo(() => {
    if (!dailyMoodData || dailyMoodData.length === 0) {
      return [
        { day: 'Пн', mood: 5, energy: 5, stress: 5 },
        { day: 'Вт', mood: 5, energy: 5, stress: 5 },
        { day: 'Ср', mood: 5, energy: 5, stress: 5 },
        { day: 'Чт', mood: 5, energy: 5, stress: 5 },
        { day: 'Пт', mood: 5, energy: 5, stress: 5 },
        { day: 'Сб', mood: 5, energy: 5, stress: 5 },
        { day: 'Вс', mood: 5, energy: 5, stress: 5 }
      ];
    }
    
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const dayNamesMap: { [key: string]: string } = {
      'Mon': 'Пн', 'Tue': 'Вт', 'Wed': 'Ср', 'Thu': 'Чт', 'Fri': 'Пт', 'Sat': 'Сб', 'Sun': 'Вс',
      'Пн': 'Пн', 'Вт': 'Вт', 'Ср': 'Ср', 'Чт': 'Чт', 'Пт': 'Пт', 'Сб': 'Сб', 'Вс': 'Вс'
    };
    
    return weekDays.map((dayName, index) => {
      const dayData = dailyMoodData.find((data: any) => {
        if ((data as any).day_name && dayNamesMap[(data as any).day_name] === dayName) {
          return true;
        }
        if (data.date) {
          const date = new Date(data.date);
          const dayIndex = date.getDay();
          const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
          return adjustedIndex === index;
        }
        return false;
      });
      
      if (dayData) {
        const moodValue = (dayData as any).mood || dayData.mood_percentage || 0;
        const energyValue = (dayData as any).energy || dayData.energy_percentage || 0;
        const calmnessValue = (dayData as any).calmness || dayData.calmness_percentage || 0;
        
        return {
          day: dayName,
          mood: Math.round(moodValue),
          energy: Math.round(energyValue),
          stress: Math.round(100 - calmnessValue)
        };
      }
      
      return {
        day: dayName,
        mood: 0,
        energy: 0,
        stress: 100
      };
    });
  }, [dailyMoodData]);
  
  const loadProductivityData = useCallback(async () => {
    setLoading(true);
    try {
      setWeeklyMood(transformedWeeklyMood);
      setLastActivities({
        work: 'Завершение проекта Yoddle',
        health: 'Утренняя пробежка 5км',
        learning: 'Изучение React Hooks'
      });
    } catch (error) {
      setSnackbarMessage('Ошибка загрузки данных');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, [transformedWeeklyMood]);
  
  // Debounced обновление данных при изменении процентов из БД
  const debouncedLoadProductivityData = useMemo(
    () => debounce(() => {
      if (moodPercentages && dailyMoodData) {
        loadProductivityData();
      }
    }, 300),
    [moodPercentages, dailyMoodData, loadProductivityData]
  );
  
  useEffect(() => {
    debouncedLoadProductivityData();
  }, [moodPercentages, dailyMoodData, debouncedLoadProductivityData]);

  // Функция плавного скролла к форме
  const scrollToForm = useCallback(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, []);

  // Обновляем weeklyMood при изменении transformedWeeklyMood
  useEffect(() => {
    setWeeklyMood(transformedWeeklyMood);
  }, [transformedWeeklyMood]);

  const handleQuickMoodSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      if (formType === 'activity') {
        const activityName = activityEntry.activity.trim();
        
        if (!activityName) {
          setSnackbarMessage('Пожалуйста, укажите название активности');
          setSnackbarOpen(true);
          return;
        }
        
        if (!user?.id) {
          setSnackbarMessage('Ошибка: пользователь не авторизован');
          setSnackbarOpen(true);
          return;
        }
        
        try {
          const activityResponse = await logActivity({
            activity: activityName,
            category: activityEntry.category,
            duration: activityEntry.duration,
            success: activityEntry.success_rating >= 5,
            success_rating: activityEntry.success_rating,
            notes: activityEntry.notes
          }, parseInt(user.id, 10));
          
          if (activityResponse) {
            setLastAnalysis(activityResponse);
          }
          setSnackbarMessage('Активность залогирована и проанализирована!');
        } catch (error: any) {
          throw new Error(error?.message || 'Ошибка при отправке активности');
        }
      } else {
        if (!user?.id) {
          setSnackbarMessage('Ошибка: пользователь не авторизован');
          setSnackbarOpen(true);
          return;
        }
        
        try {
          const analysis = await analyzeMood({
            mood: moodEntry.mood,
            energy: moodEntry.energy,
            activities: ['daily_mood_check'],
            notes: moodEntry.notes,
            stressLevel: moodEntry.stress,
            timestamp: new Date().toISOString()
          }, parseInt(user.id, 10));
          
          setLastAnalysis(analysis || 'AI проанализировал ваше настроение!');
          setSnackbarMessage('AI проанализировал ваше настроение!');
        } catch (error: any) {
          throw new Error(error?.message || 'Ошибка при анализе настроения');
        }
      }
      
      setSnackbarOpen(true);
      
      // Оптимистичное обновление UI - сбрасываем форму сразу
      setTimeout(() => {
        setMoodEntry({
          mood: 7,
          energy: 7,
          stress: 3,
          notes: ''
        });
        setActivityEntry({
          activity: '',
          category: 'work',
          duration: 60,
          success: true,
          notes: '',
          mood: 7,
          energy: 7,
          stress: 3,
          success_rating: 5
        });
        setFormType(null);
        setShowQuickEntry(false);
      }, 2000);
      
      // Перезагрузка данных в фоне (не блокируем UI)
      Promise.all([
        loadProductivityData(),
        loadDashboard(),
        loadRatingChart()
      ]).catch(() => {
        // Тихая ошибка - данные обновятся при следующей загрузке
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка отправки данных';
      setSnackbarMessage(errorMessage.includes('User ID') || errorMessage.includes('авторизован') 
        ? 'Ошибка: пользователь не авторизован' 
        : errorMessage);
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  }, [formType, activityEntry, moodEntry, user?.id, logActivity, analyzeMood, loadProductivityData, loadDashboard, loadRatingChart]);





  // Мемоизированный расчет средних значений
  const averages = useMemo(() => {
    if (moodPercentages) {
      return {
        mood: moodPercentages.mood || 0,
        energy: moodPercentages.energy || 0,
        stress: 100 - (moodPercentages.calmness || 0)
      };
    }
    
    if (weeklyMood.length === 0) return { mood: 0, energy: 0, stress: 0 };
    
    const totals = weeklyMood.reduce((acc, day) => ({
      mood: acc.mood + day.mood,
      energy: acc.energy + day.energy,
      stress: acc.stress + day.stress
    }), { mood: 0, energy: 0, stress: 0 });
    
    return {
      mood: Math.round((totals.mood / weeklyMood.length) * 10),
      energy: Math.round((totals.energy / weeklyMood.length) * 10),
      stress: Math.round((totals.stress / weeklyMood.length) * 10)
    };
  }, [moodPercentages, weeklyMood]);




  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f9fafb' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#8B0000', mb: 2 }} size={60} />
          <Typography variant="h6" color="textSecondary">
            Анализируем ваши данные...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f9fafb 0%, #f0f2f5 100%)', pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 }, overflowX: 'hidden', minWidth: 0 }}>
      <Container maxWidth="lg" sx={{ minWidth: 0 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero секция */}
          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <motion.div
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 1, -1, 0],
                  scale: [1, 1.01, 1]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{
                  scale: 1.08,
                  y: -12,
                  transition: { 
                    duration: 0.3,
                    ease: "easeOut"
                  }
                }}
                style={{
                  width: '100px',
                  height: '100px',
                  margin: '0 auto 24px',
                  display: 'block'
                }}
              >
                <Box
                  sx={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '32px',
                    background: 'linear-gradient(135deg, #8B0000 0%, #A52A2A 25%, #B22222 50%, #CD5C5C 75%, #DC143C 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 20px 40px rgba(139,0,0,0.4), 0 0 30px rgba(220,20,60,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    '& svg': {
                      fontSize: '48px',
                      color: '#fff',
                      zIndex: 3,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 75%, transparent 100%)',
                      borderRadius: '32px',
                      zIndex: 1,
                      animation: 'shimmer 3s ease-in-out infinite'
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)',
                      borderRadius: '32px',
                      zIndex: 2,
                      animation: 'glow 4s ease-in-out infinite alternate'
                    },
                    '@keyframes shimmer': {
                      '0%': {
                        transform: 'translateX(-100%) rotate(45deg)'
                      },
                      '100%': {
                        transform: 'translateX(200%) rotate(45deg)'
                      }
                    },
                    '@keyframes glow': {
                      '0%': {
                        opacity: 0.3
                      },
                      '100%': {
                        opacity: 0.7
                      }
                    }
                  }}
                >
                  <BrainIcon size={48} />
                </Box>
              </motion.div>
              
              <Typography
                variant="h2"
                sx={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 900,
                  color: '#1A1A1A',
                  mb: 4,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  lineHeight: 1.1,
                  letterSpacing: '-1px'
                }}
              >
                Добро пожаловать, {user?.name?.split(' ')[0] || 'Коллега'}
                <br />
                <Box component="span" sx={{ 
                  background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Анализ продуктивности!
                </Box>
              </Typography>
              
              <Box sx={{
                maxWidth: '700px',
                mx: 'auto',
                mb: 4,
                p: 3,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                border: '2px solid #8B000015',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'rgba(139,0,0,0.05)',
                  zIndex: 0
                }} />
                
                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(139,0,0,0.3)'
                  }}>
                    <SparklesIcon size={24} color="#fff" />
                  </Box>
                  <Typography sx={{
                    color: '#2c3e50',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    lineHeight: 1.5
                  }}>
                    Мы используем передовые технологии искусственного интеллекта для наиболее точного анализа вашей продуктивности
                  </Typography>
                </Box>
              </Box>
              
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 500,
                  color: '#666',
                  maxWidth: '700px',
                  mx: 'auto',
                  lineHeight: 1.6,
                  textAlign: 'center',
                  mb: 8,
                  mt: 4
                }}
              >
                Анализируйте настроение, отслеживайте энергию, получайте персональные рекомендации от ИИ
              </Typography>
            </Box>
          </motion.div>

          {/* Информационный блок о записи настроения и активности */}
          <motion.div variants={itemVariants} style={{ marginBottom: '2rem', position: 'relative' }}>
            <Paper elevation={0} sx={{
              p: 4,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              border: '2px solid #8B000015',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
            }}>
              {/* Декоративный элемент */}
              <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'rgba(139,0,0,0.05)',
                zIndex: 0
              }} />
              
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                {/* Заголовок */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  mb: 3
                }}>
                  <Box sx={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(139,0,0,0.3)'
                  }}>
                    <LightbulbIcon size={24} color="#fff" />
                  </Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700, 
                    color: '#1A1A1A',
                    fontSize: '1.25rem'
                  }}>
                    Зачем записывать настроение и активность?
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ 
                      minWidth: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(139,0,0,0.2)'
                    }}>
                      <BarChart3Icon size={20} color="#fff" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ 
                        color: '#1A1A1A', 
                        lineHeight: 1.7,
                        fontSize: '0.95rem',
                        fontWeight: 500
                      }}>
                        <Box component="span" sx={{ fontWeight: 700, color: '#8B0000' }}>
                          Запись настроения помогает AI анализировать ваше состояние
                        </Box>
                        {' — '}система отслеживает ваши эмоции, энергию и уровень стресса для более точных рекомендаций
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ 
                      minWidth: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(139,0,0,0.2)'
                    }}>
                      <BrainIcon size={20} color="#fff" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ 
                        color: '#1A1A1A', 
                        lineHeight: 1.7,
                        fontSize: '0.95rem',
                        fontWeight: 500
                      }}>
                        <Box component="span" sx={{ fontWeight: 700, color: '#8B0000' }}>
                          На основе активности вы получаете персональные рекомендации
                        </Box>
                        {' — '}AI изучает ваши паттерны поведения и предлагает индивидуальные советы по улучшению продуктивности
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ 
                      minWidth: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(139,0,0,0.2)'
                    }}>
                      <SparklesIcon size={20} color="#fff" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ 
                        color: '#1A1A1A', 
                        lineHeight: 1.7,
                        fontSize: '0.95rem',
                        fontWeight: 500
                      }}>
                        <Box component="span" sx={{ fontWeight: 700, color: '#8B0000' }}>
                          Все данные взаимосвязаны и улучшают качество инсайтов
                        </Box>
                        {' — '}чем больше информации вы предоставляете, тем точнее становятся аналитика и рекомендации
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Ограничения */}
                <Box sx={{ 
                  mt: 3,
                  pt: 3,
                  borderTop: '1px solid rgba(139,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2
                }}>
                  <Box sx={{ 
                    minWidth: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ff9800 0%, #ff6b00 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(255,152,0,0.2)'
                  }}>
                    <AlertTriangleIcon size={20} color="#fff" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 700, 
                      color: '#1A1A1A',
                      mb: 1.5,
                      fontSize: '0.95rem'
                    }}>
                      Ограничения записей
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" sx={{ 
                        color: '#666', 
                        lineHeight: 1.7,
                        fontSize: '0.9rem'
                      }}>
                        <Box component="span" sx={{ fontWeight: 600, color: '#1A1A1A' }}>Обычная запись настроения:</Box> до 3 раз в день
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#666', 
                        lineHeight: 1.7,
                        fontSize: '0.9rem'
                      }}>
                        <Box component="span" sx={{ fontWeight: 600, color: '#1A1A1A' }}>Расширенная запись активности:</Box> до 2 раз в день
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {/* Бейдж уровня продуктивности */}
          <motion.div variants={itemVariants} style={{ marginBottom: '3rem' }}>
            <Paper elevation={0} sx={{
              ...cardStyle,
              background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
              border: '2px solid #8B000020',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(90deg, #8B0000 0%, #B22222 50%, #8B0000 100%)'
              }} />
              
              <Box sx={{ position: 'relative', zIndex: 1, pt: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 1,
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: '#666', 
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '0.9rem'
                  }}>
                    Ваш уровень продуктивности
                  </Typography>
                  
                  {/* Иконка информации о тестовой функции */}
                  <Tooltip
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ color: '#fff', mb: 1, fontWeight: 600 }}>
                          Тестовая функция
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#fff', mb: 1.5, lineHeight: 1.6 }}>
                          Система определения уровня продуктивности находится в тестовом режиме. Ваш уровень рассчитывается на основе:
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2, color: '#fff' }}>
                          <li style={{ marginBottom: '8px' }}>
                            <Typography variant="body2" sx={{ color: '#fff', lineHeight: 1.6 }}>
                              <strong>Записей настроения</strong> — эмоциональное состояние, энергия и уровень стресса
                            </Typography>
                          </li>
                          <li style={{ marginBottom: '8px' }}>
                            <Typography variant="body2" sx={{ color: '#fff', lineHeight: 1.6 }}>
                              <strong>Активности</strong> — ваши действия и достижения в течение дня
                            </Typography>
                          </li>
                          <li style={{ marginBottom: '8px' }}>
                            <Typography variant="body2" sx={{ color: '#fff', lineHeight: 1.6 }}>
                              <strong>AI-анализа</strong> — персональные инсайты и рекомендации на основе ваших данных
                            </Typography>
                          </li>
                          <li>
                            <Typography variant="body2" sx={{ color: '#fff', lineHeight: 1.6 }}>
                              <strong>Интеграции с системой</strong> — уровень влияет на рекомендации льгот и аналитику продуктивности
                            </Typography>
                          </li>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#fff', mt: 1.5, fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.6 }}>
                          Чем больше данных вы предоставляете, тем точнее определяется ваш уровень продуктивности.
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="top"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: '#1A1A1A',
                          maxWidth: '450px',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                          p: 0,
                          '& .MuiTooltip-arrow': {
                            color: '#1A1A1A'
                          }
                        }
                      }
                    }}
                  >
                    <IconButton
                      sx={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(139,0,0,0.1)',
                        border: '1px solid rgba(139,0,0,0.2)',
                        color: '#8B0000',
                        padding: 0,
                        '&:hover': {
                          background: 'rgba(139,0,0,0.15)',
                          borderColor: 'rgba(139,0,0,0.3)'
                        }
                      }}
                    >
                      <InfoIcon size={14} />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                {productivityLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: '#8B0000' }} size={40} />
                    <Typography sx={{ ml: 2, color: '#666' }}>Загрузка данных продуктивности...</Typography>
                  </Box>
                ) : productivityError ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" sx={{ color: '#f44336', mb: 2 }}>
                        Ошибка загрузки: {productivityError}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        onClick={() => loadDashboard()}
                        sx={{ color: '#8B0000', borderColor: '#8B0000' }}
                      >
                        Попробовать снова
                      </Button>
                    </Box>
                ) : dashboard ? (
                  <Box sx={{ textAlign: 'center' }}>
                    {/* Большой бейдж уровня */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      whileHover={{ scale: 1.05 }}
                      style={{ display: 'inline-block', marginBottom: '2rem' }}
                    >
                      <Box sx={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 20px 40px rgba(139, 0, 0, 0.4)',
                        border: '4px solid #fff',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -8,
                          left: -8,
                          right: -8,
                          bottom: -8,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.2) 0%, transparent 100%)',
                          zIndex: -1
                        }
                      }}>
                        <Typography variant="h2" sx={{ 
                          color: '#fff', 
                          fontWeight: 900,
                          fontSize: '3rem',
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                          {dashboard.level_icon || '🌱'}
                        </Typography>
                      </Box>
                    </motion.div>
                    
                    {/* Название уровня */}
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800, 
                      color: '#1A1A1A', 
                      mb: 2,
                      fontSize: { xs: '2rem', md: '2.5rem' }
                    }}>
                      {dashboard.productivity_level || 'Новичок'}
                    </Typography>
                    
                    {/* Описание уровня */}
                    <Typography variant="body1" sx={{ 
                      color: '#666', 
                      mb: 3, 
                      maxWidth: '500px', 
                      mx: 'auto',
                      lineHeight: 1.6,
                      fontSize: '1.1rem'
                    }}>
                      {dashboard.level_description || 'Начинающий путь к продуктивности'}
                    </Typography>
                    
                    {/* Рейтинг продуктивности */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 4,
                      mb: 4
                    }}>
                      <Box sx={{ textAlign: 'center', position: 'relative' }}>
                        <Typography variant="h2" sx={{ 
                          fontWeight: 900, 
                          color: '#8B0000',
                          fontSize: '3.5rem',
                          textShadow: '0 4px 16px rgba(139, 0, 0, 0.4)',
                          fontFamily: 'Inter, system-ui, sans-serif',
                          letterSpacing: '-0.03em',
                          mb: 1
                        }}>
                          {dashboard?.productivity_score ? Number(dashboard.productivity_score).toFixed(1) : '0.0'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ 
                            color: '#666', 
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontSize: '0.85rem'
                          }}>
                            Рейтинг
                          </Typography>
                          <Tooltip
                            title={
                              <Box sx={{ p: 1 }}>
                                <Typography variant="body2" sx={{ color: '#fff', mb: 1.5, fontWeight: 600 }}>
                                  Как рассчитывается рейтинг продуктивности?
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#fff', lineHeight: 1.6, mb: 1 }}>
                                  Рейтинг учитывает ваше настроение, успешность выполненных активностей и общую активность на платформе.
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#fff', lineHeight: 1.6, mb: 1 }}>
                                  Чем выше ваше настроение, чем больше успешных активностей вы выполняете и чем активнее вы используете платформу, тем выше ваш рейтинг продуктивности.
                                </Typography>
                                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                                  <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.6 }}>
                                    💡 Это тестовая функция. Алгоритм расчета может изменяться для улучшения точности.
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.85rem', lineHeight: 1.6, mt: 1, fontWeight: 600 }}>
                                    📅 Рейтинг обнуляется каждый месяц в первый день для всех пользователей. Это дает возможность начать с чистого листа и лучше понять, как работает система.
                                  </Typography>
                                </Box>
                              </Box>
                            }
                            arrow
                            placement="top"
                            componentsProps={{
                              tooltip: {
                                sx: {
                                  bgcolor: '#1A1A1A',
                                  maxWidth: '500px',
                                  borderRadius: '12px',
                                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                  p: 0,
                                  '& .MuiTooltip-arrow': {
                                    color: '#1A1A1A'
                                  }
                                }
                              }
                            }}
                          >
                            <IconButton
                              sx={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: 'rgba(139,0,0,0.1)',
                                border: '1px solid rgba(139,0,0,0.2)',
                                color: '#8B0000',
                                padding: 0,
                                '&:hover': {
                                  background: 'rgba(139,0,0,0.15)',
                                  borderColor: 'rgba(139,0,0,0.3)'
                                }
                              }}
                            >
                              <InfoIcon size={12} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      <Box sx={{ 
                        width: '3px', 
                        height: '60px', 
                        background: 'linear-gradient(to bottom, transparent, #ddd, transparent)',
                        borderRadius: '2px'
                      }} />
                      
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h2" sx={{ 
                          fontWeight: 900, 
                          color: '#8B0000',
                          fontSize: '3.5rem',
                          textShadow: '0 4px 16px rgba(139, 0, 0, 0.4)',
                          fontFamily: 'Inter, system-ui, sans-serif',
                          letterSpacing: '-0.03em',
                          mb: 1
                        }}>
                          {dashboard.xp_multiplier || 1.0}x
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ 
                            color: '#666', 
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontSize: '0.85rem'
                          }}>
                            XP множитель
                          </Typography>
                          <Tooltip
                            title={
                              <Box sx={{ p: 1 }}>
                                <Typography variant="body2" sx={{ color: '#fff', mb: 1, fontWeight: 600 }}>
                                  Что такое XP множитель?
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#fff', lineHeight: 1.6 }}>
                                  Множитель опыта увеличивает количество очков опыта (XP), которые вы получаете за действия на платформе.
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#fff', lineHeight: 1.6, mt: 1 }}>
                                  Чем выше ваш рейтинг продуктивности, тем выше множитель. Это позволяет быстрее повышать уровень и получать больше наград.
                                </Typography>
                                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                                  <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.6 }}>
                                    💡 Поддерживайте высокий рейтинг продуктивности для максимального множителя.
                                  </Typography>
                                </Box>
                              </Box>
                            }
                            arrow
                            placement="top"
                            componentsProps={{
                              tooltip: {
                                sx: {
                                  bgcolor: '#1A1A1A',
                                  maxWidth: '400px',
                                  borderRadius: '12px',
                                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                  p: 0,
                                  '& .MuiTooltip-arrow': {
                                    color: '#1A1A1A'
                                  }
                                }
                              }
                            }}
                          >
                            <IconButton
                              sx={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: 'rgba(139,0,0,0.1)',
                                border: '1px solid rgba(139,0,0,0.2)',
                                color: '#8B0000',
                                padding: 0,
                                '&:hover': {
                                  background: 'rgba(139,0,0,0.15)',
                                  borderColor: 'rgba(139,0,0,0.3)'
                                }
                              }}
                            >
                              <InfoIcon size={10} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* Статистика */}
                    <Grid container spacing={3} sx={{ maxWidth: '600px', mx: 'auto' }}>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 800, 
                            color: '#8B0000',
                            fontSize: '1.8rem'
                          }}>
                            {dashboard?.weekly_productivity ? Number(dashboard.weekly_productivity).toFixed(1) : '0.0'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                            За неделю
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 800, 
                            color: '#8B0000',
                            fontSize: '1.8rem'
                          }}>
                            {dashboard?.monthly_productivity ? Number(dashboard.monthly_productivity).toFixed(1) : '0.0'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                            За месяц
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 800, 
                            color: '#8B0000',
                            fontSize: '1.8rem'
                          }}>
                            {dashboard?.days_tracked_this_week || 0}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                            Дней отслежено
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 800, 
                            color: '#8B0000',
                            fontSize: '1.8rem'
                          }}>
                            {dashboard.productivity_achievements_count || 0}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                            Достижения
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    {/* Кнопка показать график активности */}
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setShowActivityChart(!showActivityChart);
                          if (!showActivityChart && chartRef.current) {
                            setTimeout(() => {
                              chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                          }
                        }}
                        sx={{
                          borderColor: '#8B0000',
                          color: '#8B0000',
                          fontWeight: 600,
                          px: 4,
                          py: 1.5,
                          borderRadius: '50px',
                          textTransform: 'none',
                          fontSize: '1rem',
                          '&:hover': {
                            borderColor: '#A0000A',
                            background: 'rgba(139, 0, 0, 0.05)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(139, 0, 0, 0.2)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                        startIcon={<BarChart3Icon size={20} />}
                      >
                        {showActivityChart ? 'Скрыть график активности' : 'Показать график активности'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" sx={{ color: '#666' }}>
                      Загрузка данных продуктивности...
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </motion.div>

          {/* График зависимости рейтинга от активностей - ПЕРЕД еженедельной аналитикой */}
          {showActivityChart && (
            <motion.div 
              ref={chartRef}
              variants={itemVariants} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ marginBottom: '3rem' }}
            >
            <Paper elevation={0} sx={{
              ...cardStyle,
              background: '#fff',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(90deg, #8B0000 0%, #B22222 50%, #8B0000 100%)'
              }} />
              
              <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700, 
                    color: '#1A1A1A',
                    fontSize: '1.3rem'
                  }}>
                    Зависимость рейтинга от активностей
                  </Typography>
                  <Tooltip title="Накопительный рейтинг учитывает всю историю ваших активностей и настроения. Коэффициент активности (K) также рассчитывается как среднее за всю историю, поэтому рейтинг плавно изменяется и отражает ваш общий прогресс.">
                    <IconButton size="small" sx={{ color: '#8B0000' }}>
                      <InfoIcon size={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                {chartLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                    <CircularProgress sx={{ color: '#8B0000' }} />
                  </Box>
                ) : chartData && chartData.length > 0 ? (
                  <Box>
                    {/* SVG График */}
                    <Box sx={{ width: '100%', height: '300px', position: 'relative', mb: 3 }}>
                      <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        {/* Сетка */}
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((y) => (
                          <line
                            key={y}
                            x1="60"
                            y1={270 - y * 27}
                            x2="800"
                            y2={270 - y * 27}
                            stroke="#e0e0e0"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                        ))}
                        
                        {/* Оси */}
                        <line x1="60" y1="20" x2="60" y2="270" stroke="#8B0000" strokeWidth="2" />
                        <line x1="60" y1="270" x2="800" y2="270" stroke="#8B0000" strokeWidth="2" />
                        
                        {/* Подписи оси Y (рейтинг 0-10) */}
                        {[0, 2, 4, 6, 8, 10].map((y) => (
                          <text
                            key={y}
                            x="55"
                            y={270 - y * 27 + 4}
                            textAnchor="end"
                            fill="#666"
                            fontSize="12"
                            fontWeight="600"
                          >
                            {y}
                          </text>
                        ))}
                        
                        {/* Линия рейтинга */}
                        {chartData.length > 1 && (
                          <polyline
                            points={chartData.map((d, i) => {
                              const x = 60 + (i / Math.max(chartData.length - 1, 1)) * 740;
                              const y = 270 - Math.max(0, Math.min(10, parseFloat(d.rating) || 0)) * 27;
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#8B0000"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                        
                        {/* Точки на графике */}
                        {chartData.map((d, i) => {
                          const x = 60 + (i / Math.max(chartData.length - 1, 1)) * 740;
                          const y = 270 - (parseFloat(d.rating) || 0) * 27;
                          const date = new Date(d.date);
                          const dayLabel = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                          
                          return (
                            <g key={i}>
                              <circle
                                cx={x}
                                cy={y}
                                r="5"
                                fill="#8B0000"
                                stroke="#fff"
                                strokeWidth="2"
                                style={{ cursor: 'pointer' }}
                              />
                              <text
                                x={x}
                                y={285}
                                textAnchor="middle"
                                fill="#666"
                                fontSize="10"
                                transform={`rotate(-45 ${x} ${285})`}
                              >
                                {dayLabel}
                              </text>
                            </g>
                          );
                        })}
                        
                        {/* Градиент под линией */}
                        {chartData.length > 1 && (
                          <defs>
                            <linearGradient id="ratingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#8B0000" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#8B0000" stopOpacity="0.05" />
                            </linearGradient>
                          </defs>
                        )}
                        
                        {chartData.length > 1 && (
                          <polygon
                            points={`60,270 ${chartData.map((d, i) => {
                              const x = 60 + (i / Math.max(chartData.length - 1, 1)) * 740;
                              const y = 270 - Math.max(0, Math.min(10, parseFloat(d.rating) || 0)) * 27;
                              return `${x},${y}`;
                            }).join(' ')} 800,270`}
                            fill="url(#ratingGradient)"
                          />
                        )}
                      </svg>
                    </Box>
                    
                    {/* Статистика */}
                    {chartStats && (
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 2, background: '#f5f5f5', borderRadius: '8px' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#8B0000', mb: 0.5 }}>
                              {chartStats?.average ? chartStats.average.toFixed(1) : '0.0'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                              Средний рейтинг
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 2, background: '#f5f5f5', borderRadius: '8px' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#8B0000', mb: 0.5 }}>
                              {chartStats?.total_activities ? chartStats.total_activities : 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                              Всего активностей
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 2, background: '#f5f5f5', borderRadius: '8px' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#8B0000', mb: 0.5 }}>
                              {chartStats?.successful_activities ? chartStats.successful_activities : 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                              Успешных
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 2, background: '#f5f5f5', borderRadius: '8px' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#8B0000', mb: 0.5 }}>
                              {chartStats?.success_rate ? `${chartStats.success_rate.toFixed(0)}%` : '0%'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                              Успешность
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Нет данных для отображения графика
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </motion.div>
          )}

          {/* Настроение за неделю */}
          <motion.div variants={itemVariants} style={{ marginBottom: '3rem' }}>
            <Paper elevation={0} sx={{
              ...cardStyle,
              background: '#fff',
              position: 'relative',
              overflow: 'hidden',
              minWidth: 0
            }}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(90deg, #8B0000 0%, #B22222 50%, #8B0000 100%)'
              }} />
              
              <Box sx={{ position: 'relative', zIndex: 1, pt: 3, px: { xs: 2, sm: 3 }, minWidth: 0 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: '#666', 
                  mb: 3,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontSize: '0.9rem'
                }}>
                  Еженедельная аналитика
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 4, minWidth: 0 }}>
                  <motion.div
                    animate={{ 
                      x: [0, 2, -2, 0],
                      scale: [1, 1.03, 1]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    whileHover={{
                      scale: 1.08,
                      y: -3,
                      transition: { duration: 0.25 }
                    }}
                    style={{ flexShrink: 0 }}
                  >
                    <Box sx={{
                      width: { xs: 48, sm: '60px' },
                      height: { xs: 48, sm: '60px' },
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(139,0,0,0.3)'
                    }}>
                      <BarChart3Icon size={28} color="#fff" />
                    </Box>
                  </motion.div>
                  <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1A1A1A', mb: 0.5, fontSize: { xs: '1.5rem', md: '1.8rem' }, wordBreak: 'break-word' }}>
                      Ваше настроение за неделю
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Анализ эмоционального состояния и энергии
                    </Typography>
                  </Box>
                </Box>

                {/* Средние показатели */}
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  gap: { xs: 2, md: 6 }, 
                  mb: 5, 
                  justifyContent: 'center',
                  minWidth: 0
                }}>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0', minWidth: { xs: 0, sm: 180 } } }}>
                    <AnimatedMoodIndicator 
                      value={averages.mood} 
                      label="Настроение" 
                      color="#8B0000" 
                      icon={<UserCheckIcon size={20} />} 
                    />
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0', minWidth: { xs: 0, sm: 180 } } }}>
                    <AnimatedMoodIndicator 
                      value={averages.energy} 
                      label="Энергия" 
                      color="#A0000A" 
                      icon={<FlameIcon size={20} />} 
                    />
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0', minWidth: { xs: 0, sm: 180 } } }}>
                    <AnimatedMoodIndicator 
                      value={100 - averages.stress} 
                      label="Спокойствие" 
                      color="#B71C1C" 
                      icon={<StarIcon size={20} />} 
                    />
                  </Box>
                </Box>

                {/* График по дням */}
                <Grid container spacing={2}>
                  {weeklyMood && weeklyMood.length > 0 ? (
                    weeklyMood
                      .sort((a, b) => {
                        // Сортируем дни в правильном порядке: Пн, Вт, Ср, Чт, Пт, Сб, Вс
                        const dayOrder = { 'Пн': 1, 'Вт': 2, 'Ср': 3, 'Чт': 4, 'Пт': 5, 'Сб': 6, 'Вс': 7 };
                        return (dayOrder[a.day as keyof typeof dayOrder] || 0) - (dayOrder[b.day as keyof typeof dayOrder] || 0);
                      })
                      .map((day, index) => (
                        <Grid item xs key={day.day}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: '#666' }}>
                          {day.day}
                        </Typography>
                        <Box sx={{ 
                          height: '120px', 
                          display: 'flex', 
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          gap: 1,
                          padding: '10px',
                          background: 'rgba(139,0,0,0.03)',
                          borderRadius: '12px'
                        }}>
                          {/* Настроение */}
                          <Tooltip 
                            title={`Настроение: ${Math.round(day.mood || 0)}%`}
                            arrow
                            placement="top"
                          >
                            <motion.div
                              initial={{ scaleY: 0, opacity: 0 }}
                              animate={{ scaleY: 1, opacity: 1 }}
                              whileHover={{ 
                                scaleY: 1.1, 
                                scaleX: 1.2,
                                boxShadow: '0 4px 12px rgba(139,0,0,0.5)',
                                transition: { duration: 0.2 }
                              }}
                              transition={{ 
                                delay: index * 0.1, 
                                duration: 0.8,
                                ease: "backOut"
                              }}
                              style={{
                                transformOrigin: 'bottom',
                                width: '18px',
                                height: `${Math.max((day.mood || 0) * 1.2, 15)}px`,
                                background: 'linear-gradient(to top, #8B0000 0%, #A52A2A 100%)',
                                borderRadius: '4px',
                                boxShadow: '0 2px 6px rgba(139,0,0,0.3)',
                                cursor: 'pointer',
                                minHeight: '15px'
                              }}
                            />
                          </Tooltip>
                          
                          {/* Энергия */}
                          <Tooltip 
                            title={`Энергия: ${Math.round(day.energy)}%`}
                            arrow
                            placement="top"
                          >
                            <motion.div
                              initial={{ scaleY: 0, opacity: 0 }}
                              animate={{ scaleY: 1, opacity: 1 }}
                              whileHover={{ 
                                scaleY: 1.1, 
                                scaleX: 1.2,
                                boxShadow: '0 4px 12px rgba(160,0,10,0.5)',
                                transition: { duration: 0.2 }
                              }}
                              transition={{ 
                                delay: index * 0.1 + 0.1, 
                                duration: 0.8,
                                ease: "backOut"
                              }}
                              style={{
                                transformOrigin: 'bottom',
                                width: '18px',
                                height: `${Math.max(day.energy * 1.2, 15)}px`,
                                background: 'linear-gradient(to top, #A0000A 0%, #C41E3A 100%)',
                                borderRadius: '4px',
                                boxShadow: '0 2px 6px rgba(178,34,34,0.3)',
                                cursor: 'pointer'
                              }}
                            />
                          </Tooltip>
                          
                          {/* Спокойствие */}
                          <Tooltip 
                            title={`Спокойствие: ${Math.round(100 - (day.stress || 100))}%`}
                            arrow
                            placement="top"
                          >
                            <motion.div
                              initial={{ scaleY: 0, opacity: 0 }}
                              animate={{ scaleY: 1, opacity: 1 }}
                              whileHover={{ 
                                scaleY: 1.1, 
                                scaleX: 1.2,
                                boxShadow: '0 4px 12px rgba(183,28,28,0.5)',
                                transition: { duration: 0.2 }
                              }}
                              transition={{ 
                                delay: index * 0.1 + 0.2, 
                                duration: 0.8,
                                ease: "backOut"
                              }}
                              style={{
                                transformOrigin: 'bottom',
                                width: '18px',
                                height: `${Math.max((100 - (day.stress || 100)) * 1.2, 15)}px`,
                                background: 'linear-gradient(to top, #B71C1C 0%, #DC143C 100%)',
                                borderRadius: '4px',
                                boxShadow: '0 2px 6px rgba(183,28,28,0.3)',
                                cursor: 'pointer',
                                minHeight: '15px'
                              }}
                            />
                          </Tooltip>
                        </Box>
                      </Box>
                        </Grid>
                      ))
                  ) : (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Нет данных для отображения гистограмм
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  gap: { xs: 2, sm: 4 }, 
                  mt: 4, 
                  justifyContent: 'center',
                  minWidth: 0
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '4px', 
                      background: 'linear-gradient(to top, #8B0000 0%, #A52A2A 100%)',
                      boxShadow: '0 2px 4px rgba(139,0,0,0.3)'
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#555' }}>Настроение</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '4px', 
                      background: 'linear-gradient(to top, #A0000A 0%, #C41E3A 100%)',
                      boxShadow: '0 2px 4px rgba(178,34,34,0.3)'
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#555' }}>Энергия</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '4px', 
                      background: 'linear-gradient(to top, #B71C1C 0%, #DC143C 100%)',
                      boxShadow: '0 2px 4px rgba(183,28,28,0.3)'
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#555' }}>Спокойствие</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {/* Главная находка недели */}
          <motion.div variants={itemVariants} style={{ marginBottom: '3rem' }}>
            <Paper elevation={0} sx={{
              ...cardStyle,
              background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                zIndex: 0
              }} />
              
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  alignItems: 'center', 
                  gap: 2, 
                  mb: 3,
                  minWidth: 0
                }}>
                  <Box sx={{
                    width: { xs: 48, sm: 60 },
                    height: { xs: 48, sm: 60 },
                    flexShrink: 0,
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <LightbulbIcon size={28} />
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    minWidth: 0,
                    flex: '1 1 200px'
                  }}>
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.2, 1],
                        filter: [
                          'drop-shadow(0 0 8px rgba(255,255,255,0.5))',
                          'drop-shadow(0 0 16px rgba(255,255,255,0.8))',
                          'drop-shadow(0 0 8px rgba(255,255,255,0.5))'
                        ]
                      }}
                      transition={{ 
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      whileHover={{
                        scale: 1.3,
                        rotate: 45,
                        filter: 'drop-shadow(0 0 20px rgba(255,255,255,1))',
                        transition: { duration: 0.3 }
                      }}
                      style={{
                        position: 'relative',
                        display: 'inline-block',
                        flexShrink: 0
                      }}
                    >
                      <GemIcon size={32} style={{ color: 'rgba(255,255,255,0.9)' }} />
                      <motion.div
                        animate={{ 
                          opacity: [0, 1, 0],
                          scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.5
                        }}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '40px',
                          height: '40px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderRadius: '50%',
                          pointerEvents: 'none'
                        }}
                      />
                    </motion.div>
                    <Typography variant="h5" sx={{ fontWeight: 800, wordBreak: 'break-word', minWidth: 0 }}>
                      Главная находка недели
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, lineHeight: 1.4 }}>
                  {weeklyInsight ? 'AI Анализ недели' : 'Загрузка AI анализа...'}
                </Typography>
                
                <Box sx={{ opacity: 0.9, lineHeight: 1.6 }}>
                  {weeklyInsightLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} color="inherit" />
                      AI анализирует ваши данные...
                    </Box>
                  ) : weeklyInsight ? (
                    <AIResponseDisplay response={weeklyInsight} isWeekly={true} />
                  ) : (
                    <Typography variant="body1" sx={{ color: 'inherit' }}>
                      AI анализирует ваши данные и готовит персональные инсайты. Продолжайте вести дневник настроения!
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {/* Логирование активностей */}
          <motion.div variants={itemVariants} style={{ marginBottom: '3rem' }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              color: '#1A1A1A', 
              mb: 5, 
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <motion.div
                animate={{ 
                  rotate: [0, 2, -2, 0],
                  scale: [1, 1.04, 1]
                }}
                transition={{ 
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{
                  scale: 1.15,
                  y: -2,
                  transition: { duration: 0.25 }
                }}
                style={{ display: 'inline-block' }}
              >
                <ActivityIcon size={32} color="#8B0000" />
              </motion.div>
              Логирование активностей
            </Typography>
            
            <Grid container spacing={3}>
              {/* Карточка 1: Работа */}
              <Grid item xs={12} md={6}>
                <motion.div
                  whileHover={{ 
                    y: -8,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    transition: { duration: 0.3 }
                  }}
                >
                  <Paper elevation={0} sx={{
                    ...cardStyle,
                    borderLeft: '6px solid #8B0000',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setActivityEntry({...activityEntry, category: 'work'});
                    setFormType('activity');
                    setShowQuickEntry(true);
                    // Плавный скролл к форме
                    setTimeout(() => scrollToForm(), 100);
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <motion.div
                        animate={{ 
                          y: [0, -2, 0],
                          scale: [1, 1.02, 1]
                        }}
                        transition={{ 
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        whileHover={{
                          scale: 1.08,
                          y: -3,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <Box sx={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '12px',
                          background: '#8B000015',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#8B0000',
                          boxShadow: '0 4px 12px #8B000020'
                        }}>
                          <BriefcaseIcon size={24} />
                        </Box>
                      </motion.div>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1A1A1A' }}>
                          Работа
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6, mb: 2 }}>
                          Записать завершение проекта, встречу или задачу. AI проанализирует вашу продуктивность и даст рекомендации.
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#8B0000', 
                          fontWeight: 600, 
                          fontSize: '0.9rem',
                          fontStyle: 'italic'
                        }}>
                          Последняя активность: {lastActivities.work}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Button
                      variant="text"
                      endIcon={<ArrowRightIcon size={16} />}
                      sx={{
                        color: '#8B0000',
                        fontWeight: 600,
                        mt: 1,
                        textTransform: 'none',
                        '&:hover': {
                          background: '#8B000010'
                        }
                      }}
                    >
                      Записать активность
                    </Button>
                  </Paper>
                </motion.div>
              </Grid>

              {/* Карточка 2: Спорт/Здоровье */}
              <Grid item xs={12} md={6}>
                <motion.div
                  whileHover={{ 
                    y: -8,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    transition: { duration: 0.3 }
                  }}
                >
                  <Paper elevation={0} sx={{
                    ...cardStyle,
                    borderLeft: '6px solid #B71C1C',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setActivityEntry({...activityEntry, category: 'health'});
                    setFormType('activity');
                    setShowQuickEntry(true);
                    // Плавный скролл к форме
                    setTimeout(() => scrollToForm(), 100);
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <motion.div
                        animate={{ 
                          x: [0, 1, -1, 0],
                          rotate: [0, 0.5, -0.5, 0]
                        }}
                        transition={{ 
                          duration: 3.2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        whileHover={{
                          scale: 1.08,
                          x: 0,
                          rotate: 3,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <Box sx={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '12px',
                          background: '#B71C1C15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#B71C1C',
                          boxShadow: '0 4px 12px #B71C1C20'
                        }}>
                          <HeartIcon size={24} />
                        </Box>
                      </motion.div>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1A1A1A' }}>
                          Спорт & Здоровье
                        </Typography>
                                                 <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6, mb: 2 }}>
                           Записать тренировку, прогулку или здоровые привычки. AI оценит ваш прогресс и предложит мотивацию.
                         </Typography>
                         <Typography variant="body2" sx={{ 
                           color: '#B71C1C', 
                           fontWeight: 600, 
                           fontSize: '0.9rem',
                           fontStyle: 'italic'
                         }}>
                           Последняя активность: {lastActivities.health}
                         </Typography>
                       </Box>
                     </Box>
                    
                    <Button
                      variant="text"
                      endIcon={<ArrowRightIcon size={16} />}
                      sx={{
                        color: '#B71C1C',
                        fontWeight: 600,
                        mt: 1,
                        textTransform: 'none',
                        '&:hover': {
                          background: '#B71C1C10'
                        }
                      }}
                    >
                      Записать активность
                    </Button>
                  </Paper>
                </motion.div>
              </Grid>

              {/* Карточка 3: Обучение */}
              <Grid item xs={12} md={6}>
                <motion.div
                  whileHover={{ 
                    y: -8,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    transition: { duration: 0.3 }
                  }}
                >
                  <Paper elevation={0} sx={{
                    ...cardStyle,
                    borderLeft: '6px solid #A0000A',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setActivityEntry({...activityEntry, category: 'learning'});
                    setFormType('activity');
                    setShowQuickEntry(true);
                    // Плавный скролл к форме
                    setTimeout(() => scrollToForm(), 100);
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <motion.div
                        animate={{ 
                          scale: [1, 1.03, 0.98, 1],
                          rotate: [0, 1, 0]
                        }}
                        transition={{ 
                          duration: 2.8,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        whileHover={{
                          scale: 1.08,
                          rotate: 2,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <Box sx={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '12px',
                          background: '#A0000A15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#A0000A',
                          boxShadow: '0 4px 12px #A0000A20'
                        }}>
                          <BookOpenIcon size={24} />
                        </Box>
                      </motion.div>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1A1A1A' }}>
                          Обучение
                        </Typography>
                                                 <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6, mb: 2 }}>
                           Записать изучение нового навыка, чтение книги или курс. AI проанализирует ваш рост и даст советы.
                         </Typography>
                         <Typography variant="body2" sx={{ 
                           color: '#A0000A', 
                           fontWeight: 600, 
                           fontSize: '0.9rem',
                           fontStyle: 'italic'
                         }}>
                           Последняя активность: {lastActivities.learning}
                         </Typography>
                       </Box>
                     </Box>
                    
                    <Button
                      variant="text"
                      endIcon={<ArrowRightIcon size={16} />}
                      sx={{
                        color: '#A0000A',
                        fontWeight: 600,
                        mt: 1,
                        textTransform: 'none',
                        '&:hover': {
                          background: '#A0000A10'
                        }
                      }}
                    >
                      Записать активность
                    </Button>
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>




          </motion.div>

          {/* Call to Action */}
          <motion.div variants={itemVariants}>
            <Paper elevation={0} sx={{
              ...cardStyle,
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              border: '2px solid #8B000020',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{
                position: 'absolute',
                top: -30,
                left: -30,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(139,0,0,0.05)',
                zIndex: 0
              }} />
              
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <AnimatedBrain />
                
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 800, 
                    color: '#1A1A1A',
                    fontSize: { xs: '1.8rem', md: '2.2rem' }
                  }}>
                    Что происходило сегодня?
                  </Typography>
                </Box>
                
                <Typography variant="body1" sx={{ 
                  color: '#666', 
                  mb: 4, 
                  maxWidth: '500px', 
                  mx: 'auto',
                  lineHeight: 1.6
                }}>
                  Поделитесь своими мыслями или запишите активность, и ИИ проанализирует данные, даст персональную обратную связь 
                  и предложит подходящие льготы
                </Typography>

                {!showQuickEntry ? (
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<TrophyIcon size={20} />}
                        onClick={() => {
                          setShowQuickEntry(true);
                          setFormType('mood');
                          setMoodEntry({...moodEntry, notes: 'Сегодня у меня был успех: '});
                        }}
                        sx={{
                          background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                          color: '#fff',
                          borderRadius: '16px',
                          padding: '12px 32px',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          boxShadow: '0 8px 24px rgba(139,0,0,0.3)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            transition: 'left 0.6s ease'
                          },
                          '&:hover': {
                            background: 'linear-gradient(135deg, #B22222 0%, #8B0000 100%)',
                            boxShadow: '0 12px 32px rgba(139,0,0,0.4)',
                            '&:before': {
                              left: '100%'
                            }
                          }
                        }}
                      >
                        Поделиться успехом
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<ShieldCheckIcon size={20} />}
                        onClick={() => {
                          setShowQuickEntry(true);
                          setFormType('mood');
                          setMoodEntry({...moodEntry, notes: 'Сегодня мне нужна поддержка: ', mood: 4, stress: 8, energy: 3});
                        }}
                        sx={{
                          background: 'linear-gradient(135deg, #B22222 0%, #8B0000 100%)',
                          color: '#fff',
                          borderRadius: '16px',
                          padding: '12px 32px',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          boxShadow: '0 8px 24px rgba(178,34,34,0.3)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            transition: 'left 0.6s ease'
                          },
                          '&:hover': {
                            background: 'linear-gradient(135deg, #8B0000 0%, #A0000A 100%)',
                            boxShadow: '0 12px 32px rgba(178,34,34,0.4)',
                            '&:before': {
                              left: '100%'
                            }
                          }
                        }}
                      >
                        Нужна поддержка
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<ActivityIcon size={20} />}
                        onClick={() => {
                          setShowQuickEntry(true);
                          setFormType('activity');
                          setMoodEntry({...moodEntry, notes: 'activity_form'});
                        }}
                        sx={{
                          borderColor: '#8B0000',
                          color: '#8B0000',
                          borderRadius: '16px',
                          padding: '12px 32px',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderWidth: '2px',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(220,20,60,0.1), transparent)',
                            transition: 'left 0.6s ease'
                          },
                          '&:hover': {
                            borderColor: '#8B0000',
                            background: 'linear-gradient(135deg, rgba(220,20,60,0.05) 0%, rgba(220,20,60,0.1) 100%)',
                            borderWidth: '2px',
                            boxShadow: '0 8px 24px rgba(220,20,60,0.15)',
                            '&:before': {
                              left: '100%'
                            }
                          }
                        }}
                      >
                        Записать активность
                      </Button>
                    </motion.div>
                  </Box>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Card 
                        ref={formRef}
                        sx={{ 
                          maxWidth: '700px', 
                          mx: 'auto', 
                          p: 4,
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                          borderRadius: '24px',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 8px 32px rgba(139,0,0,0.1)',
                          border: '2px solid rgba(139,0,0,0.1)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'linear-gradient(90deg, #8B0000 0%, #B22222 50%, #A0000A 100%)',
                            zIndex: 1
                          }
                        }}
                      >
                        <Typography variant="h5" sx={{ 
                          fontWeight: 800, 
                          mb: 4, 
                          textAlign: 'center', 
                          color: '#1A1A1A',
                          background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 2px 4px rgba(139,0,0,0.1)'
                        }}>
                          {formType === 'activity' ? 'Записать активность' : 'Быстрая оценка состояния'}
                        </Typography>
                        
                        {/* Название активности */}
                        {formType === 'activity' && (
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Box sx={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(139,0,0,0.4)',
                                position: 'relative',
                                '&:before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '16px',
                                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                                  zIndex: 0
                                }
                              }}>
                                <BriefcaseIcon size={24} color="#fff" style={{ zIndex: 1, position: 'relative' }} />
                              </Box>
                              <Typography sx={{ fontWeight: 700, color: '#2c3e50', flex: 1, textAlign: 'center' }}>
                                Название активности
                              </Typography>
                            </Box>
                            <TextField
                              fullWidth
                              value={activityEntry.activity}
                              onChange={(e) => {
                                setActivityEntry({...activityEntry, activity: e.target.value});
                              }}
                              placeholder="Например: Завершение проекта, Тренировка, Изучение React"
                              sx={{ 
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '16px',
                                  backgroundColor: '#f8f9fa',
                                  border: '2px solid transparent',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    backgroundColor: '#f0f2f5',
                                    border: '2px solid #8B000020'
                                  },
                                  '&.Mui-focused': {
                                    backgroundColor: '#fff',
                                    border: '2px solid #8B0000',
                                    boxShadow: '0 8px 24px rgba(139,0,0,0.15)'
                                  }
                                }
                              }}
                            />
                          </Box>
                        )}

                        {/* Категория активности */}
                        {formType === 'activity' && (
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Box sx={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #A0000A 0%, #8B0000 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(160,0,10,0.4)',
                                position: 'relative',
                                '&:before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '16px',
                                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                                  zIndex: 0
                                }
                              }}>
                                <BarChart3Icon size={24} color="#fff" style={{ zIndex: 1, position: 'relative' }} />
                              </Box>
                              <Typography sx={{ fontWeight: 700, color: '#2c3e50', flex: 1, textAlign: 'center' }}>
                                Категория активности
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                              <Button
                                variant={activityEntry.category === 'work' ? 'contained' : 'outlined'}
                                onClick={() => setActivityEntry({...activityEntry, category: 'work'})}
                                sx={{
                                  background: activityEntry.category === 'work' ? 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)' : 'transparent',
                                  color: activityEntry.category === 'work' ? '#fff' : '#8B0000',
                                  borderColor: '#8B0000',
                                  borderRadius: '12px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  minWidth: { xs: 0, sm: '120px' }
                                }}
                              >
                                <Building2Icon size={16} style={{ marginRight: '8px' }} />
                                Работа
                              </Button>
                              <Button
                                variant={activityEntry.category === 'health' ? 'contained' : 'outlined'}
                                onClick={() => setActivityEntry({...activityEntry, category: 'health'})}
                                sx={{
                                  background: activityEntry.category === 'health' ? 'linear-gradient(135deg, #B22222 0%, #8B0000 100%)' : 'transparent',
                                  color: activityEntry.category === 'health' ? '#fff' : '#B22222',
                                  borderColor: '#B22222',
                                  borderRadius: '12px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  minWidth: { xs: 0, sm: '120px' }
                                }}
                              >
                                <HeartIcon size={16} style={{ marginRight: '8px' }} />
                                Здоровье
                              </Button>
                              <Button
                                variant={activityEntry.category === 'learning' ? 'contained' : 'outlined'}
                                onClick={() => setActivityEntry({...activityEntry, category: 'learning'})}
                                sx={{
                                  background: activityEntry.category === 'learning' ? 'linear-gradient(135deg, #A0000A 0%, #8B0000 100%)' : 'transparent',
                                  color: activityEntry.category === 'learning' ? '#fff' : '#A0000A',
                                  borderColor: '#A0000A',
                                  borderRadius: '12px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  minWidth: { xs: 0, sm: '120px' }
                                }}
                              >
                                <GraduationCapIcon size={16} style={{ marginRight: '8px' }} />
                                Обучение
                              </Button>
                            </Box>
                          </Box>
                        )}

                        {/* Длительность активности */}
                        {formType === 'activity' && (
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Box sx={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #B22222 0%, #8B0000 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(178,34,34,0.4)',
                                position: 'relative',
                                '&:before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '16px',
                                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                                  zIndex: 0
                                }
                              }}>
                                <ActivityIcon size={24} color="#fff" style={{ zIndex: 1, position: 'relative' }} />
                              </Box>
                              <Typography sx={{ fontWeight: 700, color: '#2c3e50', flex: 1, textAlign: 'center' }}>
                                Длительность: {activityEntry.duration} минут
                              </Typography>
                            </Box>
                            <Slider
                              value={activityEntry.duration}
                              onChange={(_, value) => setActivityEntry({...activityEntry, duration: value as number})}
                              min={15} max={480} step={15}
                              marks={[
                                { value: 15, label: '15м' },
                                { value: 60, label: '1ч' },
                                { value: 120, label: '2ч' },
                                { value: 240, label: '4ч' },
                                { value: 480, label: '8ч' }
                              ]}
                              sx={{
                                color: '#B22222',
                                height: 8,
                                '& .MuiSlider-track': {
                                  background: 'linear-gradient(90deg, #B22222 0%, #8B0000 100%)',
                                  border: 'none',
                                  height: 8,
                                  borderRadius: 4
                                },
                                '& .MuiSlider-thumb': {
                                  width: 24,
                                  height: 24,
                                  backgroundColor: '#fff',
                                  border: '3px solid #B22222',
                                  boxShadow: '0 4px 12px rgba(178,34,34,0.4)',
                                  '&:hover': {
                                    boxShadow: '0 6px 16px rgba(178,34,34,0.5)'
                                  }
                                },
                                '& .MuiSlider-rail': {
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: '#f0f0f0'
                                }
                              }}
                            />
                          </Box>
                        )}

                        {/* Успешность активности */}
                        {formType === 'activity' && (
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Box sx={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #8B0000 0%, #A0000A 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(220,20,60,0.4)',
                                position: 'relative',
                                '&:before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '16px',
                                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                                  zIndex: 0
                                }
                              }}>
                                <TrophyIcon size={24} color="#fff" style={{ zIndex: 1, position: 'relative' }} />
                              </Box>
                              <Typography sx={{ fontWeight: 700, color: '#2c3e50', flex: 1, textAlign: 'center' }}>
                                Успешность
                              </Typography>
                            </Box>
                            <Box sx={{ px: 1, mt: 1 }}>
                              <Slider
                                value={activityEntry.success_rating}
                                onChange={(_, value) => setActivityEntry({ ...activityEntry, success_rating: value as number })}
                                min={0}
                                max={10}
                                step={1}
                                marks
                                sx={{
                                  color: '#4CAF50',
                                  height: 8,
                                  '& .MuiSlider-track': {
                                    background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)',
                                    border: 'none',
                                    height: 8,
                                    borderRadius: 4
                                  },
                                  '& .MuiSlider-thumb': {
                                    width: 24,
                                    height: 24,
                                    backgroundColor: '#fff',
                                    border: '3px solid #4CAF50',
                                    boxShadow: '0 4px 12px rgba(76,175,80,0.4)'
                                  },
                                  '& .MuiSlider-rail': {
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: '#f0f0f0'
                                  }
                                }}
                              />
                              <Box sx={{ textAlign: 'center', mt: 1, fontWeight: 700, color: '#2c3e50' }}>
                                {activityEntry.success_rating}
                              </Box>
                            </Box>
                          </Box>
                        )}

                        {/* Поля настроения, энергии и стресса - показываются только для формы настроения */}
                        {formType === 'mood' && (
                          <>
                            {/* Настроение */}
                         <Box sx={{ mb: 3 }}>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                             <Box sx={{
                               width: '48px',
                               height: '48px',
                               borderRadius: '16px',
                               background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               boxShadow: '0 8px 24px rgba(139,0,0,0.4)',
                               position: 'relative',
                               '&:before': {
                                 content: '""',
                                 position: 'absolute',
                                 top: '50%',
                                 left: '50%',
                                 transform: 'translate(-50%, -50%)',
                                 width: '100%',
                                 height: '100%',
                                 borderRadius: '16px',
                                 background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                                 zIndex: 0
                               }
                             }}>
                               <UserCheckIcon size={24} color="#fff" style={{ zIndex: 1, position: 'relative' }} />
                             </Box>
                             <Typography sx={{ fontWeight: 700, color: '#2c3e50', flex: 1, textAlign: 'center' }}>
                               Настроение: {moodEntry.mood}/10
                             </Typography>
                           </Box>
                           <Slider
                             value={moodEntry.mood}
                             onChange={(_, value) => setMoodEntry({...moodEntry, mood: value as number})}
                             min={1} max={10} step={1}
                             sx={{
                               color: '#8B0000',
                               height: 8,
                               '& .MuiSlider-track': {
                                 background: 'linear-gradient(90deg, #8B0000 0%, #B22222 100%)',
                                 border: 'none',
                                 height: 8,
                                 borderRadius: 4
                               },
                               '& .MuiSlider-thumb': {
                                 width: 24,
                                 height: 24,
                                 backgroundColor: '#fff',
                                 border: '3px solid #8B0000',
                                 boxShadow: '0 4px 12px rgba(139,0,0,0.4)',
                                 '&:hover': {
                                   boxShadow: '0 6px 16px rgba(139,0,0,0.5)'
                                 }
                               },
                               '& .MuiSlider-rail': {
                                 height: 8,
                                 borderRadius: 4,
                                 backgroundColor: '#f0f0f0'
                               }
                             }}
                           />
                         </Box>

                         {/* Энергия */}
                         <Box sx={{ mb: 3 }}>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                             <Box sx={{
                               width: '48px',
                               height: '48px',
                               borderRadius: '16px',
                               background: 'linear-gradient(135deg, #B22222 0%, #8B0000 100%)',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               boxShadow: '0 8px 24px rgba(178,34,34,0.4)',
                               position: 'relative',
                               '&:before': {
                                 content: '""',
                                 position: 'absolute',
                                 top: '50%',
                                 left: '50%',
                                 transform: 'translate(-50%, -50%)',
                                 width: '100%',
                                 height: '100%',
                                 borderRadius: '16px',
                                 background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                                 zIndex: 0
                               }
                             }}>
                               <FlameIcon size={24} color="#fff" style={{ zIndex: 1, position: 'relative' }} />
                             </Box>
                             <Typography sx={{ fontWeight: 700, color: '#2c3e50', flex: 1, textAlign: 'center' }}>
                               Энергия: {moodEntry.energy}/10
                             </Typography>
                           </Box>
                           <Slider
                             value={moodEntry.energy}
                             onChange={(_, value) => setMoodEntry({...moodEntry, energy: value as number})}
                             min={1} max={10} step={1}
                             sx={{
                               color: '#B22222',
                               height: 8,
                               '& .MuiSlider-track': {
                                 background: 'linear-gradient(90deg, #B22222 0%, #8B0000 100%)',
                                 border: 'none',
                                 height: 8,
                                 borderRadius: 4
                               },
                               '& .MuiSlider-thumb': {
                                 width: 24,
                                 height: 24,
                                 backgroundColor: '#fff',
                                 border: '3px solid #B22222',
                                 boxShadow: '0 4px 12px rgba(178,34,34,0.4)',
                                 '&:hover': {
                                   boxShadow: '0 6px 16px rgba(178,34,34,0.5)'
                                 }
                               },
                               '& .MuiSlider-rail': {
                                 height: 8,
                                 borderRadius: 4,
                                 backgroundColor: '#f0f0f0'
                               }
                             }}
                           />
                         </Box>

                         {/* Стресс */}
                         <Box sx={{ mb: 3 }}>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                             <Box sx={{
                               width: '48px',
                               height: '48px',
                               borderRadius: '16px',
                               background: 'linear-gradient(135deg, #8B0000 0%, #A0000A 100%)',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               boxShadow: '0 8px 24px rgba(220,20,60,0.4)',
                               position: 'relative',
                               '&:before': {
                                 content: '""',
                                 position: 'absolute',
                                 top: '50%',
                                 left: '50%',
                                 transform: 'translate(-50%, -50%)',
                                 width: '100%',
                                 height: '100%',
                                 borderRadius: '16px',
                                 background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                                 zIndex: 0
                               }
                             }}>
                               <ActivityIcon size={24} color="#fff" style={{ zIndex: 1, position: 'relative' }} />
                             </Box>
                             <Typography sx={{ fontWeight: 700, color: '#2c3e50', flex: 1, textAlign: 'center' }}>
                               Стресс: {moodEntry.stress}/10
                             </Typography>
                           </Box>
                           <Slider
                             value={moodEntry.stress}
                             onChange={(_, value) => setMoodEntry({...moodEntry, stress: value as number})}
                             min={1} max={10} step={1}
                             sx={{
                               color: '#8B0000',
                               height: 8,
                               '& .MuiSlider-track': {
                                 background: 'linear-gradient(90deg, #8B0000 0%, #A0000A 100%)',
                                 border: 'none',
                                 height: 8,
                                 borderRadius: 4
                               },
                               '& .MuiSlider-thumb': {
                                 width: 24,
                                 height: 24,
                                 backgroundColor: '#fff',
                                 border: '3px solid #8B0000',
                                 boxShadow: '0 4px 12px rgba(220,20,60,0.4)',
                                 '&:hover': {
                                   boxShadow: '0 6px 16px rgba(220,20,60,0.5)'
                                 }
                               },
                               '& .MuiSlider-rail': {
                                 height: 8,
                                 borderRadius: 4,
                                 backgroundColor: '#f0f0f0'
                               }
                             }}
                           />
                         </Box>
                          </>
                        )}

                         {/* Дополнительные заметки */}
                         <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Дополнительные заметки"
                          value={formType === 'activity' ? activityEntry.notes : moodEntry.notes}
                          onChange={(e) => {
                            if (formType === 'activity') {
                              setActivityEntry({...activityEntry, notes: e.target.value});
                            } else {
                              setMoodEntry({...moodEntry, notes: e.target.value});
                            }
                          }}
                          InputLabelProps={{ shrink: true }}
                          sx={{ 
                            mb: 3,
                            minWidth: 0,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '16px',
                              backgroundColor: '#f8f9fa',
                              border: '2px solid transparent',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: '#f0f2f5',
                                border: '2px solid #8B000020'
                              },
                              '&.Mui-focused': {
                                backgroundColor: '#fff',
                                border: '2px solid #8B0000',
                                boxShadow: '0 8px 24px rgba(139,0,0,0.15)'
                              }
                            },
                            '& .MuiInputLabel-root': {
                              fontWeight: 600,
                              color: '#666',
                              whiteSpace: 'normal'
                            }
                          }}
                          placeholder={formType === 'activity' 
                            ? "Дополнительные детали, мысли, планы..."
                            : "Расскажите подробнее о вашем настроении, что произошло сегодня, ваши мысли и планы..."}
                        />

                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap',
                          gap: 2, 
                          justifyContent: 'center',
                          minWidth: 0
                        }}>
                          <Button
                            variant="outlined"
                            onClick={() => setShowQuickEntry(false)}
                            disabled={submitting}
                            sx={{ 
                              borderRadius: '12px', 
                              textTransform: 'none',
                              flex: { xs: '1 1 100%', sm: '0 0 auto' },
                              minWidth: { xs: '100%', sm: 120 }
                            }}
                          >
                            Отмена
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleQuickMoodSubmit}
                            disabled={submitting}
                            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <ZapIcon size={20} />}
                            sx={{
                              background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                              borderRadius: '12px',
                              textTransform: 'none',
                              fontWeight: 700,
                              flex: { xs: '1 1 100%', sm: '0 0 auto' },
                              minWidth: { xs: '100%', sm: 200 }
                            }}
                          >
                            {submitting ? 'Анализируем...' : 'Сохранить и проанализировать'}
                          </Button>
                        </Box>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                )}

                {lastAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: '2rem' }}
                  >
                    <Alert 
                      severity="success" 
                      sx={{ 
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)',
                        maxWidth: '600px',
                        mx: 'auto'
                      }}
                    >
                      <Box sx={{ fontWeight: 600 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                          ИИ-анализ:
                        </Typography>
                        {lastAnalysis ? (
                          <AIResponseDisplay response={lastAnalysis} isWeekly={false} />
                        ) : (
                          <Typography variant="body1">
                            AI проанализировал ваше настроение!
                          </Typography>
                        )}
                      </Box>
                    </Alert>
                  </motion.div>
                )}
              </Box>
            </Paper>
          </motion.div>
        </motion.div>
      </Container>
      
      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={snackbarMessage && snackbarMessage.length > 50 ? 8000 : 4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ 
          '& .MuiSnackbar-root': {
            maxWidth: '600px'
          }
        }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success" 
          sx={{ 
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)',
            border: '2px solid #4CAF50',
            maxWidth: '600px',
            '& .MuiAlert-message': {
              width: '100%',
              wordBreak: 'break-word'
            }
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 500,
              lineHeight: 1.6,
              whiteSpace: 'normal'
            }}
          >
            {snackbarMessage}
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Productivity;
