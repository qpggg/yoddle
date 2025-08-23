import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, LinearProgress, Chip, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import { useProductivity } from '../hooks/useProductivity';
import { 
  FaRocket, 
  FaFire, 
  FaStar, 
  FaCrown, 
  FaEye, 
  FaHeart, 
  FaUserShield, 
  FaBolt,
  FaCheckCircle,
  FaLock,
  FaGift,
  FaBullseye,
  FaSun
} from 'react-icons/fa';
import { GiCrystalShine, GiTrophyCup } from 'react-icons/gi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    }
  }
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
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
  flexDirection: 'column'
};

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Теперь это строка из БД
  unlocked: boolean;
  points: number;
  tier: number;
  requirement_type: string;
  requirement_value: number;
  requirement_action: string;
  unlocked_at?: string;
}

interface UserProgress {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  rank: string;
  achievements: Achievement[];
  stats: {
    loginStreak: number;
    benefitsUsed: number;
    profileCompletion: number;
    daysActive: number;
  };
}

// Функция для преобразования иконки из строки в React элемент
const getIconFromString = (iconString: string) => {
  const iconMap: { [key: string]: React.ReactElement } = {
    // Иконки уровней и достижений - соответствуют секции "уровни и ранги"
    '👤': <FaRocket size={32} />,        // Новичок
    '🔥': <FaFire size={32} />,          // Активист  
    '⭐': <FaStar size={32} />,          // Профи
    '👑': <FaCrown size={32} />,         // Эксперт
    '✅': <FaCheckCircle size={32} />,   // Завершение
    '🎁': <FaGift size={32} />,         // Льготы
    '🏆': <GiTrophyCup size={32} />,    // Достижения
    '💎': <GiCrystalShine size={32} />, // Мастер
    '🌟': <FaStar size={32} />,         // Звезда
    '🚀': <FaRocket size={32} />,       // Ракета
    '⚡': <FaBolt size={32} />,         // Молния
    '🎯': <FaBullseye size={32} />,     // Цель
    '🔓': <FaLock size={32} />,         // Разблокировка
    '🎊': <FaGift size={32} />,         // Подарок
    '🌅': <FaSun size={32} />,          // Утро
    '🦉': <FaBolt size={32} />,         // Сова -> Молния
    '⚔️': <FaBolt size={32} />          // Меч -> Молния
  };
  
  return iconMap[iconString] || <FaStar size={32} />;
};

// Функция для определения редкости достижения
const getRarityFromTier = (tier: number) => {
  switch (tier) {
    case 1: return 'common';
    case 2: return 'rare';
    case 3: return 'epic';
    default: return 'common';
  }
};

const RANKS = [
  { name: 'Новичок', minXP: 0, maxXP: 100, icon: <FaRocket /> },
  { name: 'Активист', minXP: 101, maxXP: 300, icon: <FaBolt /> },
  { name: 'Профи', minXP: 301, maxXP: 500, icon: <FaStar /> },
  { name: 'Эксперт', minXP: 501, maxXP: 1000, icon: <FaCrown /> },
  { name: 'Мастер', minXP: 1001, maxXP: Infinity, icon: <GiCrystalShine /> }
];

const getRarityConfig = (rarity: string) => {
  switch (rarity) {
    case 'common': return { color: '#8E8E93', bg: '#F2F2F7', label: 'Обычное' };
    case 'rare': return { color: '#34C759', bg: '#E8F5E8', label: 'Редкое' };
    case 'epic': return { color: '#AF52DE', bg: '#F3E8FF', label: 'Эпическое' };
    case 'legendary': return { color: '#FF9500', bg: '#FFF4E6', label: 'Легендарное' };
    default: return { color: '#8E8E93', bg: '#F2F2F7', label: 'Обычное' };
  }
};

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const rarity = getRarityFromTier(achievement.tier);
  const rarityConfig = getRarityConfig(rarity);
  
  return (
    <motion.div 
      variants={itemVariants} 
      whileHover={{ 
        y: -8, 
        boxShadow: '0 20px 40px rgba(139,0,0,0.15)',
        transition: { duration: 0.2 }
      }} 
      style={{ 
        height: '100%',
        borderRadius: '24px',
        overflow: 'hidden'
      }}
    >
      <Paper elevation={0} sx={{ 
        ...cardStyle, 
        position: 'relative',
        opacity: achievement.unlocked ? 1 : 0.6,
        background: achievement.unlocked ? '#fff' : '#f8f9fa',
        borderRadius: '24px',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          color: achievement.unlocked ? '#34C759' : '#8E8E93' 
        }}>
          {achievement.unlocked ? <FaCheckCircle size={24} /> : <FaLock size={20} />}
        </Box>
        
        <Box sx={{ 
          color: achievement.unlocked ? '#8B0000' : '#8E8E93', 
          mb: 2, 
          fontSize: '2rem' 
        }}>
          {getIconFromString(achievement.icon)}
        </Box>
        
        <Typography variant="h6" sx={{ 
          fontWeight: 700, 
          color: achievement.unlocked ? '#1A1A1A' : '#8E8E93', 
          mb: 1 
        }}>
          {achievement.title}
        </Typography>
        
        <Typography variant="body2" sx={{ 
          color: achievement.unlocked ? '#555' : '#8E8E93', 
          mb: 3, 
          lineHeight: 1.6, 
          flexGrow: 1 
        }}>
          {achievement.description}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Chip 
            label={rarityConfig.label} 
            size="small" 
            sx={{ 
              background: rarityConfig.bg, 
              color: rarityConfig.color, 
              fontWeight: 600 
            }} 
          />
          <Typography variant="body2" sx={{ 
            fontWeight: 700, 
            color: '#8B0000',
            background: '#FFF0F0',
            padding: '4px 8px',
            borderRadius: '8px'
          }}>
            +{achievement.points} XP
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  );
};

const StatCard = ({ title, value, subtitle, icon }: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ReactElement;
}) => (
  <motion.div variants={itemVariants}>
    <Paper elevation={0} sx={{
      ...cardStyle,
      textAlign: 'center',
      background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
      color: '#fff',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <Box sx={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        zIndex: 0
      }} />
      
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ fontSize: '2.5rem', mb: 2, opacity: 0.9 }}>
          {icon}
        </Box>
        
        <Typography variant="h3" sx={{ 
          fontWeight: 900, 
          mb: 1,
          textShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
          {value}
        </Typography>
        
        {subtitle && (
          <Typography variant="body2" sx={{ 
            opacity: 0.8, 
            mb: 1,
            fontWeight: 500
          }}>
            {subtitle}
          </Typography>
        )}
        
        <Typography variant="body1" sx={{ 
          fontWeight: 600,
          opacity: 0.9,
          fontSize: '1rem'
        }}>
          {title}
        </Typography>
      </Box>
    </Paper>
  </motion.div>
);

const Progress: React.FC = () => {
  const { user } = useUser();
  const { progress: productivityProgress } = useProductivity();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRealProgress = async () => {
    setLoading(true);
    try {
      // Параллельная загрузка данных
      const [progressResponse, benefitsResponse] = await Promise.all([
        fetch(`/api/progress?user_id=${user?.id || 1}`),
        fetch(`/api/user-benefits?user_id=${user?.id || 1}`)
      ]);
      
      if (progressResponse.ok && benefitsResponse.ok) {
        const progressData = await progressResponse.json();
        const benefitsData = await benefitsResponse.json();
        
        const userXP = progressData.progress.xp || 0;
        const currentRank = RANKS.find(rank => 
          userXP >= rank.minXP && userXP <= rank.maxXP
        ) || RANKS[0];
        
        // Вычисляем уровень на основе XP
        let level = 1;
        if (userXP >= 1001) level = 5;
        else if (userXP >= 501) level = 4;
        else if (userXP >= 301) level = 3;
        else if (userXP >= 101) level = 2;
        
        // 📊 РЕАЛЬНОЕ КОЛИЧЕСТВО ЛЬГОТ
        const realBenefitsCount = benefitsData.benefits ? benefitsData.benefits.length : 0;
        
        setProgress({
          level: level,
          currentXP: userXP,
          nextLevelXP: currentRank.maxXP === Infinity ? Infinity : currentRank.maxXP,
          totalXP: userXP,
          rank: currentRank.name,
          achievements: progressData.achievements || [], // Теперь это данные из БД
          stats: {
            loginStreak: progressData.progress.login_streak || 0,
            benefitsUsed: realBenefitsCount, // ✅ РЕАЛЬНОЕ КОЛИЧЕСТВО ЛЬГОТ
            profileCompletion: progressData.progress.profile_completion || 75,
            daysActive: progressData.progress.days_active || 0
          }
        });
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Progress page mounted, loading data...');
    loadRealProgress();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f9fafb' }}>
        <CircularProgress sx={{ color: '#8B0000' }} />
      </Box>
    );
  }

  if (!progress) return null;

  const currentRank = RANKS.find(rank => rank.name === progress.rank) || RANKS[0];
  const progressPercent = currentRank.maxXP === Infinity ? 100 : (progress.currentXP / currentRank.maxXP) * 100;
  
  // Разделяем достижения на полученные и доступные
  const unlockedAchievements = progress.achievements.filter(a => a.unlocked);
  const lockedAchievements = progress.achievements.filter(a => !a.unlocked);

  return (
    <Box sx={{ minHeight: '100vh', background: '#f9fafb', pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box
              sx={{
                width: '80px',
                height: '80px',
                borderRadius: '16px',
                backgroundColor: 'rgba(139, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                '& svg': {
                  fontSize: '36px',
                  color: '#8B0000'
                }
              }}
            >
              <FaRocket />
            </Box>
            
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 900,
                color: '#1A1A1A',
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              {user?.name}, ваш прогресс в Yoddle
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 500,
                color: '#666',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Отслеживайте свои достижения, собирайте очки опыта и открывайте новые уровни
            </Typography>
          </Box>
        </motion.div>

        {/* ОСНОВНОЙ ПРОГРЕСС - УЛУЧШЕННЫЙ ДИЗАЙН */}
        <motion.div 
          variants={itemVariants} 
          initial="hidden" 
          animate="visible" 
          style={{ marginBottom: '4rem' }}
        >
          <Paper elevation={0} sx={{ 
            background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
            color: 'white',
            textAlign: 'center',
            borderRadius: '32px',
            padding: '3rem 2rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(139,0,0,0.3)'
          }}>
            {/* Декоративные элементы */}
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
            <Box sx={{
              position: 'absolute',
              bottom: -80,
              left: -80,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)',
              zIndex: 0
            }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mb: 3 
                }}>
                  <Box sx={{ 
                    background: 'rgba(255,255,255,0.15)', 
                    borderRadius: '24px', 
                    p: 3,
                    fontSize: '3.5rem',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)'
                                      }}>
                     {currentRank.icon}
                    </Box>
                </Box>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Typography variant="h2" sx={{ 
                  fontWeight: 900, 
                  mb: 1,
                  fontSize: { xs: '2rem', md: '3rem' },
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                  Уровень {progress.level}
                </Typography>
                
                <Typography variant="h4" sx={{ 
                  mb: 4, 
                  opacity: 0.95,
                  fontWeight: 600,
                  fontSize: { xs: '1.2rem', md: '1.5rem' }
                }}>
                  {currentRank.name}
                </Typography>
              </motion.div>
              
              <Box sx={{ mb: 4, px: { xs: 2, md: 8 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {progress.currentXP} XP
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {currentRank.maxXP === Infinity ? '∞' : currentRank.maxXP} XP
                  </Typography>
                </Box>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.7, duration: 1.5, ease: 'easeOut' }}
                  style={{ transformOrigin: 'left' }}
                >
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'white',
                        borderRadius: 8,
                        boxShadow: '0 2px 10px rgba(255,255,255,0.3)'
                      },
                    }}
                  />
                </motion.div>
              </Box>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <Typography variant="h6" sx={{ 
                  opacity: 0.9,
                  fontWeight: 500,
                  fontSize: { xs: '1rem', md: '1.1rem' }
                }}>
                  {currentRank.maxXP === Infinity 
                    ? '🎉 Вы достигли максимального ранга!' 
                    : `${currentRank.maxXP - progress.currentXP} XP до следующего уровня`
                  }
                </Typography>
              </motion.div>
            </Box>
          </Paper>
        </motion.div>

        {/* СТАТИСТИКА - ОДИНАКОВЫЕ РАЗМЕРЫ */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ marginBottom: '4rem' }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: '#1A1A1A', 
            mb: 4, 
            textAlign: 'center' 
          }}>
            Статистика
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Дней в приложении"
                value={progress.stats.daysActive}
                icon={<FaFire />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Выбрано льгот"
                value={progress.stats.benefitsUsed}
                icon={<FaHeart />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Заполнение профиля"
                value={`${progress.stats.profileCompletion}%`}
                icon={<FaUserShield />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Серия входов"
                value={progress.stats.loginStreak}
                icon={<FaBolt />}
              />
            </Grid>
          </Grid>
        </motion.div>

        {/* СИСТЕМА ОЧКОВ - МИНИМАЛЬНЫЕ АНИМАЦИИ */}
        <div style={{ marginBottom: '4rem' }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: '#1A1A1A', 
            mb: 4, 
            textAlign: 'center' 
          }}>
            Система очков
          </Typography>
          
          <Paper elevation={0} sx={{
            ...cardStyle,
            background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
            color: '#fff',
            mb: 3,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Минимальные декоративные элементы */}
            <Box sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              zIndex: 0
            }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <FaStar size={24} /> Как работает система XP
              </Typography>
              <Typography variant="body1" sx={{ 
                lineHeight: 1.7,
                opacity: 0.95,
                fontSize: '1.1rem'
              }}>
                Выполняйте действия в приложении и получайте очки опыта (XP). 
                Накапливайте XP для повышения уровня, получения достижений и разблокировки новых возможностей!
              </Typography>
            </Box>
          </Paper>

          <Grid container spacing={3}>
            {[
              { 
                category: 'Активность', 
                icon: <FaBolt />, 
                color: '#8B0000', 
                gradient: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                actions: [
                  { action: 'Ежедневный вход', xp: 10, icon: <FaRocket /> },
                  { action: 'Первый вход за день', xp: 15, icon: <FaFire /> },
                  { action: 'Просмотр прогресса', xp: 5, icon: <FaBolt /> }
                ]
              },
              { 
                category: 'Профиль', 
                icon: <FaUserShield />, 
                color: '#8B0000', 
                gradient: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                actions: [
                  { action: 'Обновление профиля', xp: 25, icon: <FaUserShield /> },
                  { action: 'Загрузка аватара', xp: 30, icon: <FaUserShield /> },
                  { action: 'Тест предпочтений', xp: 75, icon: <FaCheckCircle /> }
                ]
              },
              { 
                category: 'Льготы', 
                icon: <FaHeart />, 
                color: '#8B0000', 
                gradient: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                actions: [
                  { action: 'Добавление льготы', xp: 50, icon: <FaHeart /> },
                  { action: 'Использование льготы', xp: 25, icon: <FaCheckCircle /> },
                  { action: 'Получение рекомендаций', xp: 20, icon: <FaEye /> }
                ]
              },
              { 
                category: 'Достижения', 
                icon: <GiTrophyCup />, 
                color: '#8B0000', 
                gradient: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
                actions: [
                  { action: 'Повышение уровня', xp: 100, icon: <FaCrown /> },
                  { action: 'Серия входов (неделя)', xp: 50, icon: <FaFire /> },
                  { action: 'Разблокировка достижения', xp: 'Бонус', icon: <GiTrophyCup /> }
                ]
              }
            ].map((category, _) => (
              <Grid item xs={12} md={6} key={category.category}>
                <Paper elevation={0} sx={{
                  ...cardStyle,
                  borderRadius: '24px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: `2px solid ${category.color}20`,
                  background: '#fff',
                  minHeight: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    borderColor: `${category.color}80`,
                    background: `${category.color}05`
                  },
                  transition: 'border-color 0.2s ease'
                }}>
                  {/* Декоративная полоска сверху */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 5,
                    background: category.gradient,
                    borderRadius: '24px 24px 0 0'
                  }} />
                  
                  {/* Заголовок категории */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2.5, 
                    mb: 3,
                    pt: 1.5,
                    px: 3
                  }}>
                    <Box sx={{ 
                      color: category.color, 
                      fontSize: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: '16px',
                      background: `${category.color}15`,
                      border: `1px solid ${category.color}20`
                    }}>
                      {category.icon}
                    </Box>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 800, 
                      color: '#1A1A1A',
                      fontSize: '1.3rem',
                      letterSpacing: '-0.5px'
                    }}>
                      {category.category}
                    </Typography>
                  </Box>

                  {/* Список действий */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2.5,
                    px: 3,
                    pb: 3,
                    flex: 1
                  }}>
                    {category.actions.map((item, idx) => (
                      <Box key={idx} sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 3,
                        borderRadius: '18px',
                        background: '#f8f9fa',
                        border: `1px solid ${category.color}15`,
                        transition: 'background-color 0.2s ease',
                        '&:hover': {
                          background: `${category.color}08`,
                          borderColor: `${category.color}40`
                        }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Box sx={{ 
                            color: category.color, 
                            fontSize: '1.4rem',
                            display: 'flex',
                            alignItems: 'center',
                            p: 1.2,
                            borderRadius: '12px',
                            background: `${category.color}15`,
                            border: `1px solid ${category.color}20`
                          }}>
                            {item.icon}
                          </Box>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 600,
                            color: '#2D3748',
                            fontSize: '1rem',
                            letterSpacing: '-0.2px'
                          }}>
                            {item.action}
                          </Typography>
                        </Box>
                        <Chip 
                          label={typeof item.xp === 'number' ? `+${item.xp} XP` : item.xp}
                          size="medium"
                          sx={{
                            background: category.gradient,
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            height: 36,
                            borderRadius: '18px',
                            boxShadow: `0 2px 8px ${category.color}30`,
                            border: '1px solid rgba(255,255,255,0.2)',
                            minWidth: 80,
                            '& .MuiChip-label': {
                              px: 2
                            }
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </div>

        {/* Информация об уровнях */}
        <motion.div variants={itemVariants} style={{ marginTop: '6rem' }}>
          <Paper elevation={0} sx={{
            ...cardStyle,
            background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Декоративные элементы */}
            <Box sx={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              zIndex: 0
            }} />
            <Box sx={{
              position: 'absolute',
              bottom: -50,
              left: -50,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              zIndex: 0
            }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <GiCrystalShine size={24} /> Уровни и ранги
              </Typography>
              
              <Grid container spacing={2}>
                {[
                  { level: 1, name: 'Новичок', xp: '0-100 XP', icon: <FaRocket />, color: '#8E8E93' },
                  { level: 2, name: 'Активист', xp: '101-300 XP', icon: <FaBolt />, color: '#2E8B57' },
                  { level: 3, name: 'Профи', xp: '301-500 XP', icon: <FaStar />, color: '#4682B4' },
                  { level: 4, name: 'Эксперт', xp: '501-1000 XP', icon: <FaCrown />, color: '#9370DB' },
                  { level: 5, name: 'Мастер', xp: '1001+ XP', icon: <GiCrystalShine />, color: '#FFD700' }
                ].map((rank, _) => (
                  <Grid item xs={12} sm={6} md={2.4} key={rank.level}>
                    <Box sx={{
                      textAlign: 'center',
                      p: 2.5,
                      borderRadius: '20px',
                      background: progress.level === rank.level 
                        ? 'rgba(255,255,255,0.25)' 
                        : 'rgba(255,255,255,0.1)',
                      border: progress.level === rank.level 
                        ? '2px solid rgba(255,255,255,0.5)' 
                        : '1px solid rgba(255,255,255,0.2)',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.2)',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                      }
                    }}>
                      <Box sx={{ 
                        fontSize: '2.2rem', 
                        mb: 1.5,
                        color: progress.level === rank.level ? '#fff' : 'rgba(255,255,255,0.8)',
                        display: 'flex',
                        justifyContent: 'center',
                        filter: progress.level === rank.level ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'
                      }}>
                        {rank.icon}
                      </Box>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 700, 
                        mb: 0.5,
                        fontSize: '0.95rem',
                        textShadow: progress.level === rank.level ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                      }}>
                        Уровень {rank.level}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        opacity: 0.9, 
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        textShadow: progress.level === rank.level ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                      }}>
                        {rank.name}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        opacity: 0.8, 
                        fontSize: '0.75rem',
                        display: 'block',
                        mt: 0.5,
                        textShadow: progress.level === rank.level ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                      }}>
                        {rank.xp}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </motion.div>

        {/* ПОЛУЧЕННЫЕ ДОСТИЖЕНИЯ */}
        {unlockedAchievements.length > 0 && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ marginBottom: '4rem' }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              color: '#1A1A1A', 
              mb: 4, 
              textAlign: 'center' 
            }}>
              Полученные достижения ({unlockedAchievements.length})
            </Typography>
            
            <Grid container spacing={3}>
              {unlockedAchievements.map((achievement) => (
                <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                  <AchievementCard achievement={achievement} />
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}

        {/* ДОСТУПНЫЕ ДОСТИЖЕНИЯ */}
        {lockedAchievements.length > 0 && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              color: '#1A1A1A', 
              mb: 4, 
              textAlign: 'center' 
            }}>
              Доступные достижения ({lockedAchievements.length})
            </Typography>
            
            <Grid container spacing={3}>
              {lockedAchievements.map((achievement) => (
                <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                  <AchievementCard achievement={achievement} />
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}
      </Container>
    </Box>
  );
};

export default Progress; 