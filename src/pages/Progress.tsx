import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, LinearProgress, Chip, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import { useActivity } from '../hooks/useActivity';
import { 
  FaFire, 
  FaStar, 
  FaCrown, 
  FaUserFriends,
  FaEye,
  FaHeart,
  FaRocket,

  FaBolt,
  FaCheckCircle,
  FaLock
} from 'react-icons/fa';
import { GiCrystalShine, GiTrophyCup } from 'react-icons/gi';
import { FaUserShield } from 'react-icons/fa6';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 100 }
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
  icon: React.ReactElement;
  unlocked: boolean;
  points: number;
  category: 'activity' | 'social' | 'explorer' | 'expert';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
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

const RANKS = [
  { name: 'Новичок', minXP: 0, maxXP: 100, color: '#8E8E93', icon: <FaUserShield />, gradient: 'linear-gradient(135deg, #8E8E93 0%, #A8A8AA 100%)' },
  { name: 'Активный', minXP: 101, maxXP: 300, color: '#34C759', icon: <FaRocket />, gradient: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)' },
  { name: 'Эксперт', minXP: 301, maxXP: 500, color: '#007AFF', icon: <FaBolt />, gradient: 'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)' },
  { name: 'Мастер', minXP: 501, maxXP: 1000, color: '#AF52DE', icon: <FaCrown />, gradient: 'linear-gradient(135deg, #AF52DE 0%, #BF5AF2 100%)' },
  { name: 'Легенда', minXP: 1001, maxXP: Infinity, color: '#FF9500', icon: <GiTrophyCup />, gradient: 'linear-gradient(135deg, #FF9500 0%, #FF9F0A 100%)' }
];

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_login',
    title: 'Первые шаги',
    description: 'Добро пожаловать в Yoddle!',
    icon: <FaRocket />,
    unlocked: true,
    points: 25,
    category: 'activity',
    rarity: 'common'
  },
  {
    id: 'profile_complete',
    title: 'Мастер профиля',
    description: 'Заполните профиль на 100%',
    icon: <FaUserShield />,
    unlocked: false,
    points: 50,
    category: 'activity',
    rarity: 'rare'
  },
  {
    id: 'first_benefit',
    title: 'Исследователь',
    description: 'Выберите первую льготу',
    icon: <FaEye />,
    unlocked: true,
    points: 30,
    category: 'explorer',
    rarity: 'common'
  },
  {
    id: 'wellness_expert',
    title: 'Эксперт велнеса',
    description: 'Выберите 5 льгот категории "Здоровье"',
    icon: <FaHeart />,
    unlocked: false,
    points: 100,
    category: 'expert',
    rarity: 'epic'
  },
  {
    id: 'streak_week',
    title: 'Постоянство',
    description: '7 дней подряд в приложении',
    icon: <FaFire />,
    unlocked: false,
    points: 75,
    category: 'activity',
    rarity: 'rare'
  },
  {
    id: 'social_butterfly',
    title: 'Социальная бабочка',
    description: 'Пригласите 3 коллег',
    icon: <FaUserFriends />,
    unlocked: false,
    points: 150,
    category: 'social',
    rarity: 'epic'
  },
  {
    id: 'master_user',
    title: 'Мастер платформы',
    description: 'Используйте все функции Yoddle',
    icon: <GiCrystalShine />,
    unlocked: false,
    points: 200,
    category: 'expert',
    rarity: 'legendary'
  },
  {
    id: 'feedback_hero',
    title: 'Герой отзывов',
    description: 'Оставьте 10 отзывов о льготах',
    icon: <FaStar />,
    unlocked: false,
    points: 80,
    category: 'social',
    rarity: 'rare'
  }
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
  const rarityConfig = getRarityConfig(achievement.rarity);
  
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
          {achievement.icon}
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
      borderRadius: '24px',
      minHeight: '200px',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      overflow: 'hidden'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <Box sx={{ 
          color: '#8B0000', 
          fontSize: '2rem', 
          background: '#8B000015',
          borderRadius: '16px',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </Box>
      </Box>
      
      <Typography variant="h6" sx={{ 
        fontWeight: 700, 
        color: '#1A1A1A',
        mb: 2,
        fontSize: '1rem'
      }}>
        {title}
      </Typography>
      
      <Typography variant="h2" sx={{ 
        fontWeight: 800, 
        color: '#8B0000', 
        mb: 1,
        fontSize: '2.5rem'
      }}>
        {value}
      </Typography>
      
      {subtitle && (
        <Typography variant="body2" sx={{ 
          color: '#555', 
          fontWeight: 500
        }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  </motion.div>
);

const Progress: React.FC = () => {
  const { user } = useUser();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { logCustomActivity } = useActivity();

  // 🎉 АВТОЛОГИРОВАНИЕ ПОСЕЩЕНИЯ СТРАНИЦЫ ПРОГРЕССА
  useEffect(() => {
    if (user?.id) {
      logCustomActivity('progress_view', 5, 'Пользователь посмотрел страницу прогресса');
    }
  }, [user?.id, logCustomActivity]);

  useEffect(() => {
    setTimeout(() => {
      const currentRank = RANKS.find(rank => 
        150 >= rank.minXP && 150 <= rank.maxXP
      ) || RANKS[0];
      
      setProgress({
        level: 2,
        currentXP: 150,
        nextLevelXP: 300,
        totalXP: 150,
        rank: currentRank.name,
        achievements: ACHIEVEMENTS.map(achievement => ({
          ...achievement,
          unlocked: achievement.id === 'first_login' || achievement.id === 'first_benefit'
        })),
        stats: {
          loginStreak: 5,
          benefitsUsed: 2,
          profileCompletion: 75,
          daysActive: 12
        }
      });
      setLoading(false);
    }, 1000);
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
  const progressPercent = Math.min(((progress.currentXP - currentRank.minXP) / (currentRank.maxXP - currentRank.minXP)) * 100, 100);
  const unlockedAchievements = progress.achievements.filter(a => a.unlocked);
  const lockedAchievements = progress.achievements.filter(a => !a.unlocked);

  return (
    <Box sx={{ minHeight: '100vh', background: '#f9fafb', pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Typography variant="h4" align="center" sx={{ 
            fontWeight: 700, 
            color: '#8B0000', 
            mb: 8, 
            lineHeight: 1.4, 
            fontSize: { xs: '1.8rem', md: '2.2rem' } 
          }}>
            {user?.name}, ваш прогресс в Yoddle
          </Typography>
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
                subtitle="дней подряд"
                icon={<FaBolt />}
              />
            </Grid>
          </Grid>
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