import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, Card, Button, Slider, TextField, CircularProgress, Alert, Snackbar } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../hooks/useUser';

import { useAI } from '../hooks/useAI';
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
  CheckIcon,
  XIcon,
  PartyPopperIcon,
  TargetIcon,
  RocketIcon,
  TrendingUpIcon
} from 'lucide-react';

// Компонент для отображения AI ответов с иконками
interface AIResponseDisplayProps {
  response: string;
  isWeekly?: boolean; // true для недельного инсайта, false для обычного анализа
}

const AIResponseDisplay: React.FC<AIResponseDisplayProps> = ({ response, isWeekly = false }) => {
  // Добавляем отладочную информацию
  console.log('AIResponseDisplay получил ответ:', response);
  
  // Функция для замены XML-тегов на иконки и форматирования
  const formatAIResponse = (text: string) => {
    if (!text) return text;

    console.log('Форматируем текст:', text);

    // Заменяем XML-теги на иконки и форматирование
    let formattedText = text
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
      
      // Убираем лишние переносы строк
      .replace(/\n\n+/g, '\n\n')
      .trim();

    console.log('Отформатированный текст:', formattedText);
    return formattedText;
  };

  const formattedResponse = formatAIResponse(response);

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
          whiteSpace: 'pre-wrap'
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
            icon = <PartyPopperIcon size={20} color="#FF6B6B" />;
            break;
          case 'ANALYSIS':
            icon = <BrainIcon size={20} color="#4ECDC4" />;
            break;
          case 'ADVICE':
            icon = <LightbulbIcon size={20} color="#FFD93D" />;
            break;
          case 'FORECAST':
            icon = <GemIcon size={20} color="#A8E6CF" />;
            break;
          case 'WEEKLY':
            icon = <BarChart3Icon size={20} color="#6C5CE7" />;
            break;
          case 'SUPPORT':
            icon = <TargetIcon size={20} color="#FD79A8" />;
            break;
          case 'SPECIFIC':
            icon = <RocketIcon size={20} color="#00B894" />;
            break;
          case 'MOTIVATION':
            icon = <StarIcon size={20} color="#FDCB6E" />;
            break;
          default:
            icon = <SparklesIcon size={20} color="#fff" />;
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
    flex: 1,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
    borderRadius: '20px',
    padding: '24px 20px',
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
    dailyInsight, 
    loading: aiLoading, 
    analyzeMood,
    logActivity,
    generateDailyInsight
  } = useAI();
  
  // Состояния
  const [weeklyMood, setWeeklyMood] = useState<WeeklyMood[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
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
    stress: 3
  });

  // Загрузка данных при монтировании
  useEffect(() => {
    console.log('Productivity page mounted, loading data...');
    loadProductivityData();
  }, []);

  const loadProductivityData = async () => {
    setLoading(true);
    try {
      // Используем реальные AI данные
      await generateDailyInsight();
      
      // Mock данные настроения за неделю (пока не реализовано в API)
      const mockWeeklyMood: WeeklyMood[] = [
        { day: 'Пн', mood: 6, energy: 7, stress: 4 },
        { day: 'Вт', mood: 8, energy: 8, stress: 2 },
        { day: 'Ср', mood: 7, energy: 6, stress: 5 },
        { day: 'Чт', mood: 9, energy: 9, stress: 1 },
        { day: 'Пт', mood: 8, energy: 7, stress: 3 },
        { day: 'Сб', mood: 9, energy: 8, stress: 2 },
        { day: 'Вс', mood: 8, energy: 6, stress: 3 }
      ];
      
      setWeeklyMood(mockWeeklyMood);
      
      // Загружаем последние активности по категориям (пока используем mock данные)
      setLastActivities({
        work: 'Завершение проекта Yoddle',
        health: 'Утренняя пробежка 5км',
        learning: 'Изучение React Hooks'
      });
    } catch (error) {
      console.error('Error loading productivity data:', error);
      setSnackbarMessage('Ошибка загрузки данных');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMoodSubmit = async () => {
    setSubmitting(true);
    try {
      // Проверяем, является ли это логированием активности
      if (moodEntry.notes === 'activity_form' || moodEntry.notes.startsWith('activity_form:') || 
          moodEntry.notes.startsWith('Работа: ') || 
          moodEntry.notes.startsWith('Спорт & Здоровье: ') || 
          moodEntry.notes.startsWith('Обучение: ')) {
        
        // Определяем категорию активности
        let category = activityEntry.category;
        if (moodEntry.notes.startsWith('Работа: ')) category = 'work';
        if (moodEntry.notes.startsWith('Спорт & Здоровье: ')) category = 'health';
        if (moodEntry.notes.startsWith('Обучение: ')) category = 'learning';
        
        // Извлекаем название активности из заметок
        let activityName = '';
        if (moodEntry.notes === 'activity_form') {
          activityName = 'Общая активность';
        } else if (moodEntry.notes.startsWith('activity_form:')) {
          activityName = moodEntry.notes.replace('activity_form:', '').trim();
        } else {
          activityName = moodEntry.notes.replace(/^(Работа|Спорт & Здоровье|Обучение): /, '').trim();
        }
        
        if (activityName && activityName !== 'Общая активность') {
          // Отправляем активность в AI API
          const activityResponse = await logActivity({
            activity: activityName,
            category: category,
            duration: activityEntry.duration,
            success: activityEntry.success,
            notes: activityEntry.notes
          });
          
          // Показываем AI ответ как уведомление
          if (activityResponse) {
            setSnackbarMessage(activityResponse);
          } else {
            setSnackbarMessage('Активность залогирована и проанализирована!');
          }
        } else if (activityName === 'Общая активность') {
          setSnackbarMessage('Пожалуйста, укажите название активности');
        } else {
          setSnackbarMessage('Пожалуйста, укажите название активности');
        }
      } else {
        // Обычное логирование настроения
        const analysis = await analyzeMood({
          mood: moodEntry.mood,
          activities: ['daily_mood_check'],
          notes: moodEntry.notes,
          stressLevel: moodEntry.stress
        });
        
        setLastAnalysis(analysis || 'AI проанализировал ваше настроение!');
        setSnackbarMessage('AI проанализировал ваше настроение!');
      }
      
      setSnackbarOpen(true);
      
      // Добавляем задержку перед сбросом формы, чтобы пользователь увидел ответ
      setTimeout(() => {
        // Сброс формы
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
          stress: 3
        });
        setShowQuickEntry(false);
      }, 2000); // 2 секунды задержки
      
      // Перезагрузка данных
      await loadProductivityData();
    } catch (error) {
      console.error('Error submitting data:', error);
      setSnackbarMessage('Ошибка отправки данных');
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };





  const calculateAverageFromWeek = () => {
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
  };



  const averages = calculateAverageFromWeek();

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
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f9fafb 0%, #f0f2f5 100%)', pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
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

          {/* Настроение за неделю */}
          <motion.div variants={itemVariants} style={{ marginBottom: '3rem' }}>
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
              
              <Box sx={{ position: 'relative', zIndex: 1, pt: 3 }}>
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
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
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
                  >
                    <Box sx={{
                      width: '60px',
                      height: '60px',
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
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1A1A1A', mb: 0.5, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
                      Ваше настроение за неделю
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Анализ эмоционального состояния и энергии
                    </Typography>
                  </Box>
                </Box>

                {/* Средние показатели */}
                <Box sx={{ display: 'flex', gap: 6, mb: 5, justifyContent: 'center' }}>
                  <AnimatedMoodIndicator 
                    value={averages.mood} 
                    label="Настроение" 
                    color="#8B0000" 
                    icon={<UserCheckIcon size={20} />} 
                  />
                  <AnimatedMoodIndicator 
                    value={averages.energy} 
                    label="Энергия" 
                    color="#A0000A" 
                    icon={<FlameIcon size={20} />} 
                  />
                  <AnimatedMoodIndicator 
                    value={100 - averages.stress} 
                    label="Спокойствие" 
                    color="#B71C1C" 
                    icon={<StarIcon size={20} />} 
                  />
                </Box>

                {/* График по дням */}
                <Grid container spacing={2}>
                  {weeklyMood.map((day, index) => (
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
                              height: `${Math.max(day.mood * 8, 15)}px`,
                              background: 'linear-gradient(to top, #8B0000 0%, #A52A2A 100%)',
                              borderRadius: '4px',
                              boxShadow: '0 2px 6px rgba(139,0,0,0.3)',
                              cursor: 'pointer'
                            }}
                          />
                          
                          {/* Энергия */}
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
                              height: `${Math.max(day.energy * 8, 15)}px`,
                              background: 'linear-gradient(to top, #A0000A 0%, #C41E3A 100%)',
                              borderRadius: '4px',
                              boxShadow: '0 2px 6px rgba(178,34,34,0.3)',
                              cursor: 'pointer'
                            }}
                          />
                          
                          {/* Спокойствие */}
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
                              height: `${Math.max((10 - day.stress) * 8, 15)}px`,
                              background: 'linear-gradient(to top, #B71C1C 0%, #DC143C 100%)',
                              borderRadius: '4px',
                              boxShadow: '0 2px 6px rgba(183,28,28,0.3)',
                              cursor: 'pointer'
                            }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ display: 'flex', gap: 4, mt: 4, justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '4px', 
                      background: '#8B0000',
                      boxShadow: '0 2px 4px rgba(139,0,0,0.3)'
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#555' }}>Настроение</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '4px', 
                      background: '#A0000A',
                      boxShadow: '0 2px 4px rgba(178,34,34,0.3)'
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#555' }}>Энергия</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '4px', 
                      background: '#B71C1C',
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <LightbulbIcon size={28} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                        display: 'inline-block'
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
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      Главная находка недели
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, lineHeight: 1.4 }}>
                  {dailyInsight ? 'AI Анализ недели' : 'Загрузка AI анализа...'}
                </Typography>
                
                <Box sx={{ opacity: 0.9, lineHeight: 1.6 }}>
                  {aiLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} color="inherit" />
                      AI анализирует ваши данные...
                    </Box>
                  ) : dailyInsight ? (
                    <AIResponseDisplay response={dailyInsight} isWeekly={true} />
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
                    setShowQuickEntry(true);
                    // Устанавливаем специальный режим для логирования активности
                    setMoodEntry({...moodEntry, notes: 'Работа: '});
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
                    setShowQuickEntry(true);
                    // Устанавливаем специальный режим для логирования активности
                    setMoodEntry({...moodEntry, notes: 'Спорт & Здоровье: '});
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
                    setShowQuickEntry(true);
                    // Устанавливаем специальный режим для логирования активности
                    setMoodEntry({...moodEntry, notes: 'Обучение: '});
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
                      <Card sx={{ 
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
                      }}>
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
                          {moodEntry.notes === 'activity_form' || moodEntry.notes.startsWith('Работа: ') || moodEntry.notes.startsWith('Спорт & Здоровье: ') || moodEntry.notes.startsWith('Обучение: ') 
                            ? 'Записать активность' 
                            : 'Быстрая оценка состояния'}
                        </Typography>
                        
                        {/* Название активности */}
                        {(moodEntry.notes === 'activity_form' || moodEntry.notes.startsWith('Работа: ') || moodEntry.notes.startsWith('Спорт & Здоровье: ') || moodEntry.notes.startsWith('Обучение: ')) && (
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
                              value={moodEntry.notes === 'activity_form' ? '' : moodEntry.notes.replace(/^(Работа|Спорт & Здоровье|Обучение): /, '')}
                              onChange={(e) => {
                                if (moodEntry.notes === 'activity_form') {
                                  setMoodEntry({...moodEntry, notes: 'activity_form:' + e.target.value});
                                } else {
                                  const prefix = moodEntry.notes.startsWith('Работа: ') ? 'Работа: ' : 
                                               moodEntry.notes.startsWith('Спорт & Здоровье: ') ? 'Спорт & Здоровье: ' : 'Обучение: ';
                                  setMoodEntry({...moodEntry, notes: prefix + e.target.value});
                                }
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
                        {(moodEntry.notes === 'activity_form' || moodEntry.notes.startsWith('Работа: ') || moodEntry.notes.startsWith('Спорт & Здоровье: ') || moodEntry.notes.startsWith('Обучение: ')) && (
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
                                  minWidth: '120px'
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
                                  minWidth: '120px'
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
                                  minWidth: '120px'
                                }}
                              >
                                <GraduationCapIcon size={16} style={{ marginRight: '8px' }} />
                                Обучение
                              </Button>
                            </Box>
                          </Box>
                        )}

                        {/* Длительность активности */}
                        {(moodEntry.notes === 'activity_form' || moodEntry.notes.startsWith('Работа: ') || moodEntry.notes.startsWith('Спорт & Здоровье: ') || moodEntry.notes.startsWith('Обучение: ')) && (
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
                        {(moodEntry.notes === 'activity_form' || moodEntry.notes.startsWith('Работа: ') || moodEntry.notes.startsWith('Спорт & Здоровье: ') || moodEntry.notes.startsWith('Обучение: ')) && (
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
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                              <Button
                                variant={activityEntry.success ? 'contained' : 'outlined'}
                                onClick={() => setActivityEntry({...activityEntry, success: true})}
                                sx={{
                                  background: activityEntry.success ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : 'transparent',
                                  color: activityEntry.success ? '#fff' : '#4CAF50',
                                  borderColor: '#4CAF50',
                                  borderRadius: '12px',
                                  textTransform: 'none',
                                  fontWeight: 600
                                }}
                              >
                                                                 <CheckIcon size={16} style={{ marginRight: '8px' }} />
                                 Успешно
                              </Button>
                              <Button
                                variant={!activityEntry.success ? 'contained' : 'outlined'}
                                onClick={() => setActivityEntry({...activityEntry, success: false})}
                                sx={{
                                  background: !activityEntry.success ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' : 'transparent',
                                  color: !activityEntry.success ? '#fff' : '#f44336',
                                  borderColor: '#f44336',
                                  borderRadius: '12px',
                                  textTransform: 'none',
                                  fontWeight: 600
                                }}
                              >
                                                                 <XIcon size={16} style={{ marginRight: '8px' }} />
                                 Неудача
                              </Button>
                            </Box>
                          </Box>
                        )}







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

                         {/* Дополнительные заметки */}
                         <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Дополнительные заметки"
                          value={activityEntry.notes}
                          onChange={(e) => setActivityEntry({...activityEntry, notes: e.target.value})}
                          sx={{ 
                            mb: 3,
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
                              color: '#666'
                            }
                          }}
                          placeholder="Дополнительные детали, мысли, планы..."
                        />

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                          <Button
                            variant="outlined"
                            onClick={() => setShowQuickEntry(false)}
                            disabled={submitting}
                            sx={{ borderRadius: '12px', textTransform: 'none' }}
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
                              fontWeight: 700
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
              whiteSpace: 'pre-wrap'
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
