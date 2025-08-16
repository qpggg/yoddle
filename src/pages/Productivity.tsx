import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, Card, Button, Slider, TextField, CircularProgress, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUpIcon,
  BrainIcon,
  HeartIcon,
  SparklesIcon,
  ChartBarIcon,
  LightbulbIcon,
  ArrowRightIcon,
  UserCheckIcon,
  SunIcon,
  BarChart3Icon,
  MessageSquareIcon,
  ZapIcon,
  ActivityIcon,
  StarIcon,
  ShieldCheckIcon,
  TrophyIcon,
  FlameIcon,
  GemIcon
} from 'lucide-react';

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

interface PersonalInsight {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'neutral' | 'warning';
  icon: React.ReactNode;
  actionable: boolean;
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
  const navigate = useNavigate();
  
  // Состояния
  const [weeklyMood, setWeeklyMood] = useState<WeeklyMood[]>([]);
  const [insights, setInsights] = useState<PersonalInsight[]>([]);
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

  // Загрузка данных при монтировании
  useEffect(() => {
    console.log('Productivity page mounted, loading data...');
    loadProductivityData();
  }, []);

  const loadProductivityData = async () => {
    setLoading(true);
    try {
      // Имитация загрузки данных - здесь будут реальные API вызовы
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Мок данные настроения за неделю
      const mockWeeklyMood: WeeklyMood[] = [
        { day: 'Пн', mood: 6, energy: 7, stress: 4 },
        { day: 'Вт', mood: 8, energy: 8, stress: 2 },
        { day: 'Ср', mood: 7, energy: 6, stress: 5 },
        { day: 'Чт', mood: 9, energy: 9, stress: 1 },
        { day: 'Пт', mood: 8, energy: 7, stress: 3 },
        { day: 'Сб', mood: 9, energy: 8, stress: 2 },
        { day: 'Вс', mood: 8, energy: 6, stress: 3 }
      ];
      
      // Мок персональных инсайтов
      const mockInsights: PersonalInsight[] = [
        {
          id: '1',
          title: 'Отличная динамика настроения',
          description: 'Ваше настроение стабильно растёт. Особенно продуктивны вы во вторник и четверг утром.',
          type: 'positive',
          icon: <TrendingUpIcon size={24} />,
          actionable: true
        },
        {
          id: '2',
          title: 'Рекомендуем отдых',
          description: 'Уровень стресса в середине недели повышается. Попробуйте медитацию или прогулку.',
          type: 'warning',
          icon: <HeartIcon size={24} />,
          actionable: true
        },
        {
          id: '3',
          title: 'Пик энергии утром',
          description: 'Планируйте сложные задачи на первую половину дня - это ваше золотое время.',
          type: 'neutral',
          icon: <SunIcon size={24} />,
          actionable: true
        }
      ];
      
      setWeeklyMood(mockWeeklyMood);
      setInsights(mockInsights);
    } catch (error) {
      console.error('Error loading productivity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMoodSubmit = async () => {
    setSubmitting(true);
    try {
      // Здесь будет отправка данных в API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Мок ответа от AI
      const aiResponse = generateAIResponse(moodEntry);
      setLastAnalysis(aiResponse);
      
      // Сброс формы
      setMoodEntry({
        mood: 7,
        energy: 7,
        stress: 3,
        notes: ''
      });
      setShowQuickEntry(false);
      
      // Перезагрузка данных
      await loadProductivityData();
    } catch (error) {
      console.error('Error submitting mood:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const generateAIResponse = (entry: MoodEntry): string => {
    if (entry.mood >= 8 && entry.stress <= 3) {
      return "Отлично! Вы в прекрасном настроении и низком стрессе. Это идеальное время для новых проектов и амбициозных задач!";
    } else if (entry.stress >= 7) {
      return "Замечаю высокий уровень стресса. Рекомендую воспользоваться корпоративным психологом или массажем для восстановления баланса.";
    } else if (entry.energy <= 4) {
      return "Низкая энергия может быть признаком переутомления. Рассмотрите фитнес-абонемент или витаминный комплекс для восстановления сил.";
    } else {
      return "Хорошие показатели! Продолжайте в том же духе и не забывайте про важный баланс между работой и отдыхом.";
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

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return '#8B0000';
      case 'warning': return '#B71C1C';
      default: return '#A0000A';
    }
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
                  Вы наиболее продуктивны во вторник и четверг утром
                </Typography>
                
                <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
                  ИИ-анализ показывает, что ваш пик энергии приходится на начало недели. 
                  Планируйте важные встречи и сложные задачи на вторник и четверг до 12:00.
                </Typography>
              </Box>
            </Paper>
          </motion.div>

          {/* Персональные инсайты */}
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
                <ChartBarIcon size={32} color="#8B0000" />
              </motion.div>
              Персональные инсайты
            </Typography>
            
            <Grid container spacing={3}>
              {insights.map((insight) => (
                <Grid item xs={12} md={6} key={insight.id}>
                  <motion.div
                    whileHover={{ 
                      y: -8,
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      transition: { duration: 0.3 }
                    }}
                  >
                    <Paper elevation={0} sx={{
                      ...cardStyle,
                      borderLeft: `6px solid ${getInsightColor(insight.type)}`,
                      position: 'relative'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                        <motion.div
                          animate={
                            insight.id === '1' ? {
                              y: [0, -2, 0],
                              scale: [1, 1.02, 1]
                            } : insight.id === '2' ? {
                              x: [0, 1, -1, 0],
                              rotate: [0, 0.5, -0.5, 0]
                            } : {
                              scale: [1, 1.03, 0.98, 1],
                              rotate: [0, 1, 0]
                            }
                          }
                          transition={{ 
                            duration: insight.id === '1' ? 2.5 : insight.id === '2' ? 3.2 : 2.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: insight.id === '1' ? 0 : insight.id === '2' ? 0.8 : 1.6
                          }}
                          whileHover={{
                            scale: 1.08,
                            y: insight.id === '1' ? -3 : insight.id === '2' ? 0 : -1,
                            rotate: insight.id === '1' ? 0 : insight.id === '2' ? 3 : 2,
                            transition: { duration: 0.2 }
                          }}
                        >
                          <Box sx={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '12px',
                            background: `${getInsightColor(insight.type)}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: getInsightColor(insight.type),
                            boxShadow: `0 4px 12px ${getInsightColor(insight.type)}20`
                          }}>
                            {insight.icon}
                          </Box>
                        </motion.div>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1A1A1A' }}>
                            {insight.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6 }}>
                            {insight.description}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {insight.actionable && (
                        <Button
                          variant="text"
                          endIcon={<ArrowRightIcon size={16} />}
                          onClick={() => navigate('/preferences')}
                          sx={{
                            color: getInsightColor(insight.type),
                            fontWeight: 600,
                            mt: 1,
                            textTransform: 'none',
                            '&:hover': {
                              background: `${getInsightColor(insight.type)}10`
                            }
                          }}
                        >
                          Настроить предпочтения
                        </Button>
                      )}
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
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
                  Поделитесь своими мыслями, и ИИ проанализирует данные, даст персональную обратную связь 
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
                        startIcon={<MessageSquareIcon size={20} />}
                        onClick={() => {
                          setShowQuickEntry(true);
                          setMoodEntry({...moodEntry, notes: 'Мои мысли на сегодня: '});
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
                        Просто записать мысли
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
                      <Card sx={{ maxWidth: '600px', mx: 'auto', p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, textAlign: 'left' }}>
                          Быстрая оценка состояния
                        </Typography>
                        
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Box sx={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(139,0,0,0.3)'
                            }}>
                              <UserCheckIcon size={20} color="#fff" />
                            </Box>
                            <Typography sx={{ fontWeight: 700, color: '#2c3e50', flex: 1 }}>
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

                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Box sx={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #B22222 0%, #8B0000 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(178,34,34,0.3)'
                            }}>
                              <FlameIcon size={20} color="#fff" />
                            </Box>
                            <Typography sx={{ fontWeight: 700, color: '#2c3e50', flex: 1 }}>
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

                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Box sx={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #8B0000 0%, #A0000A 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(220,20,60,0.3)'
                            }}>
                              <ActivityIcon size={20} color="#fff" />
                            </Box>
                            <Typography sx={{ fontWeight: 700, color: '#2c3e50', flex: 1 }}>
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

                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Что происходило сегодня?"
                          value={moodEntry.notes}
                          onChange={(e) => setMoodEntry({...moodEntry, notes: e.target.value})}
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
                          placeholder="Расскажите о своих успехах, проблемах или просто о настроении..."
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
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        ИИ-анализ: {lastAnalysis}
                      </Typography>
                    </Alert>
                  </motion.div>
                )}
              </Box>
            </Paper>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Productivity;
