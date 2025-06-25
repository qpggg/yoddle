import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, LinearProgress, Chip, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useUser } from '../hooks/useUser';
import { 
  FaTrophy, 
  FaFire, 
  FaStar, 
  FaCrown, 
  FaGem,
  FaUserFriends,
  FaEye,
  FaHeart,
  FaRocket,
  FaLightbulb,
  FaBullseye,
  FaBolt,
  FaShieldAlt
} from 'react-icons/fa';
import { GiCrystalShine, GiTrophyCup } from 'react-icons/gi';
import { FaUserShield } from 'react-icons/fa6';

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
  { name: 'Новичок', minXP: 0, maxXP: 100, color: '#8E8E93', icon: <FaUserShield /> },
  { name: 'Активный', minXP: 101, maxXP: 300, color: '#34C759', icon: <FaRocket /> },
  { name: 'Эксперт', minXP: 301, maxXP: 500, color: '#007AFF', icon: <FaBolt /> },
  { name: 'Мастер', minXP: 501, maxXP: 1000, color: '#AF52DE', icon: <FaCrown /> },
  { name: 'Легенда', minXP: 1001, maxXP: Infinity, color: '#FF9500', icon: <GiTrophyCup /> }
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

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return '#8E8E93';
    case 'rare': return '#34C759';
    case 'epic': return '#AF52DE';
    case 'legendary': return '#FF9500';
    default: return '#8E8E93';
  }
};

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#750000' }} />
      </Box>
    );
  }

  if (!progress) return null;

  const currentRank = RANKS.find(rank => rank.name === progress.rank) || RANKS[0];
  const progressPercent = ((progress.currentXP - currentRank.minXP) / (currentRank.maxXP - currentRank.minXP)) * 100;
  const unlockedAchievements = progress.achievements.filter(a => a.unlocked);

  return (
    <Box sx={{ minHeight: '100vh', background: '#f9fafb', pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography 
            variant="h3" 
            align="center" 
            sx={{ 
              fontWeight: 800, 
              color: '#750000', 
              mb: 8,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            🚀 Ваш прогресс в Yoddle
          </Typography>
        </motion.div>

        {/* Основная карточка прогресса */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: '24px',
              background: `linear-gradient(135deg, ${currentRank.color}15 0%, ${currentRank.color}05 100%)`,
              border: `2px solid ${currentRank.color}`,
              mb: 4
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${currentRank.color} 0%, ${currentRank.color}80 100%)`,
                    color: '#fff',
                    fontSize: 48,
                    mb: 2,
                    boxShadow: `0 0 30px ${currentRank.color}40`
                  }}
                >
                  {currentRank.icon}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: currentRank.color, mb: 1 }}>
                  {progress.rank}
                </Typography>
                <Typography variant="h6" sx={{ color: '#666' }}>
                  Уровень {progress.level}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Прогресс до следующего уровня
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: currentRank.color }}>
                      {progress.currentXP} / {progress.nextLevelXP} XP
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(90deg, ${currentRank.color} 0%, ${currentRank.color}80 100%)`,
                        borderRadius: 6
                      }
                    }}
                  />
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: currentRank.color }}>
                        {progress.stats.loginStreak}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Дней подряд
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: currentRank.color }}>
                        {unlockedAchievements.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Достижений
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: currentRank.color }}>
                        {progress.stats.benefitsUsed}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Льгот активно
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: currentRank.color }}>
                        {progress.stats.profileCompletion}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Профиль
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        {/* Достижения */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#1A1A1A', 
              mb: 4,
              textAlign: 'center'
            }}
          >
            🏆 Достижения
          </Typography>
          
          <Grid container spacing={3}>
            {progress.achievements.map((achievement) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={achievement.id}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: '20px',
                      background: achievement.unlocked 
                        ? `linear-gradient(135deg, ${getRarityColor(achievement.rarity)}15 0%, ${getRarityColor(achievement.rarity)}05 100%)`
                        : 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                      border: `2px solid ${achievement.unlocked ? getRarityColor(achievement.rarity) : '#ddd'}`,
                      opacity: achievement.unlocked ? 1 : 0.6,
                      transition: 'all 0.3s ease',
                      textAlign: 'center'
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: achievement.unlocked 
                          ? `linear-gradient(135deg, ${getRarityColor(achievement.rarity)} 0%, ${getRarityColor(achievement.rarity)}80 100%)`
                          : 'linear-gradient(135deg, #ccc 0%, #999 100%)',
                        color: '#fff',
                        fontSize: 24,
                        mb: 2
                      }}
                    >
                      {achievement.icon}
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        color: achievement.unlocked ? '#1A1A1A' : '#999',
                        mb: 1
                      }}
                    >
                      {achievement.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: achievement.unlocked ? '#666' : '#999',
                        mb: 2
                      }}
                    >
                      {achievement.description}
                    </Typography>
                    
                    <Chip
                      label={`+${achievement.points} XP`}
                      size="small"
                      sx={{
                        background: achievement.unlocked ? getRarityColor(achievement.rarity) : '#ccc',
                        color: '#fff',
                        fontWeight: 600
                      }}
                    />
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Статистика активности */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ marginTop: 48 }}
        >
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#1A1A1A', 
              mb: 4,
              textAlign: 'center'
            }}
          >
            📊 Статистика активности
          </Typography>
          
          <Grid container spacing={3}>
            {[
              { label: 'Здоровье', value: 85, color: '#FF6B6B', icon: <FaHeart /> },
              { label: 'Обучение', value: 60, color: '#4ECDC4', icon: <FaLightbulb /> },
              { label: 'Спорт', value: 45, color: '#45B7D1', icon: <FaBullseye /> },
              { label: 'Социальные', value: 30, color: '#96CEB4', icon: <FaUserFriends /> }
            ].map((category, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '20px',
                    background: '#fff',
                    border: '1px solid #eee',
                    textAlign: 'center',
                    height: '100%'
                  }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: `${category.color}20`,
                      color: category.color,
                      fontSize: 20,
                      mb: 2
                    }}
                  >
                    {category.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {category.label}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={category.value}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: `${category.color}20`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: category.color,
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 600, color: category.color, mt: 1 }}>
                    {category.value}%
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Progress; 