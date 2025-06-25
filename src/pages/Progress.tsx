import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, LinearProgress, Chip, CircularProgress, Card, CardContent } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import { 
  FaFire, 
  FaStar, 
  FaCrown, 
  FaUserFriends,
  FaEye,
  FaHeart,
  FaRocket,
  FaLightbulb,
  FaBullseye,
  FaBolt,
  FaCheckCircle,
  FaLock
} from 'react-icons/fa';
import { GiCrystalShine, GiTrophyCup, GiLevelUp } from 'react-icons/gi';
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

const buttonStyle = {
  background: 'linear-gradient(45deg, #8B0000, #B22222)',
  color: '#fff',
  border: 'none',
  borderRadius: '50px',
  padding: '12px 28px',
  fontWeight: 600,
  fontSize: 16,
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(139,0,0,0.2)',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
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
  { name: 'Новичок', minXP: 0, maxXP: 100, color: '#8E8E93', icon: <FaUserShield />, gradient: 'linear-gradient(45deg, #8E8E93, #A8A8AA)' },
  { name: 'Активный', minXP: 101, maxXP: 300, color: '#34C759', icon: <FaRocket />, gradient: 'linear-gradient(45deg, #34C759, #30D158)' },
  { name: 'Эксперт', minXP: 301, maxXP: 500, color: '#007AFF', icon: <FaBolt />, gradient: 'linear-gradient(45deg, #007AFF, #0A84FF)' },
  { name: 'Мастер', minXP: 501, maxXP: 1000, color: '#AF52DE', icon: <FaCrown />, gradient: 'linear-gradient(45deg, #AF52DE, #BF5AF2)' },
  { name: 'Легенда', minXP: 1001, maxXP: Infinity, color: '#FF9500', icon: <GiTrophyCup />, gradient: 'linear-gradient(45deg, #FF9500, #FF9F0A)' }
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
    <motion.div variants={itemVariants} whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(139,0,0,0.15)' }} style={{ height: '100%' }}>
      <Paper elevation={0} sx={{ 
        ...cardStyle, 
        position: 'relative',
        opacity: achievement.unlocked ? 1 : 0.6,
        background: achievement.unlocked ? '#fff' : '#f8f9fa'
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

const StatCard = ({ title, value, subtitle, icon, color }: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ReactElement;
  color: string;
}) => (
  <motion.div variants={itemVariants} whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(139,0,0,0.15)' }}>
    <Paper elevation={0} sx={cardStyle}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ color, fontSize: '1.5rem', mr: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
          {title}
        </Typography>
      </Box>
      
      <Typography variant="h3" sx={{ 
        fontWeight: 800, 
        color: '#8B0000', 
        mb: 1,
        textAlign: 'center'
      }}>
        {value}
      </Typography>
      
      {subtitle && (
        <Typography variant="body2" sx={{ 
          color: '#555', 
          textAlign: 'center',
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

        {/* ОСНОВНОЙ ПРОГРЕСС */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" style={{ marginBottom: '3rem' }}>
          <Paper elevation={0} sx={{ 
            ...cardStyle, 
            background: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)',
            color: 'white',
            textAlign: 'center'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Box sx={{ 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: '50%', 
                p: 2,
                fontSize: '3rem'
              }}>
                {currentRank.icon}
              </Box>
            </Box>
            
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
              Уровень {progress.level}
            </Typography>
            
            <Typography variant="h5" sx={{ mb: 3, opacity: 0.9 }}>
              {currentRank.name}
            </Typography>
            
            <Box sx={{ mb: 3, px: { xs: 2, md: 8 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">{progress.currentXP} XP</Typography>
                <Typography variant="body1">{currentRank.maxXP === Infinity ? '∞' : currentRank.maxXP} XP</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white',
                    borderRadius: 6,
                  },
                }}
              />
            </Box>
            
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {currentRank.maxXP === Infinity 
                ? 'Вы достигли максимального ранга!' 
                : `${currentRank.maxXP - progress.currentXP} XP до следующего уровня`
              }
            </Typography>
          </Paper>
        </motion.div>

        {/* СТАТИСТИКА */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ marginBottom: '3rem' }}>
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
                color="#FF6B35"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Выбрано льгот"
                value={progress.stats.benefitsUsed}
                icon={<FaHeart />}
                color="#8B0000"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Заполнение профиля"
                value={`${progress.stats.profileCompletion}%`}
                icon={<FaUserShield />}
                color="#34C759"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Серия входов"
                value={progress.stats.loginStreak}
                subtitle="дней подряд"
                icon={<FaBolt />}
                color="#AF52DE"
              />
            </Grid>
          </Grid>
        </motion.div>

        {/* ПОЛУЧЕННЫЕ ДОСТИЖЕНИЯ */}
        {unlockedAchievements.length > 0 && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ marginBottom: '3rem' }}>
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