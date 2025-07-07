import React from 'react';
import { Container, Typography, Box, TextField, Button, Paper, Alert, Slide } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';


const Login: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: email, password })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Ошибка входа');
        return;
      }
      const data = await res.json();
      
      // 🎉 АВТОЛОГИРОВАНИЕ ВХОДА (СНАЧАЛА ЛОГИРУЕМ, ПОТОМ ПЕРЕХОДИМ)
      try {
        // Получаем текущее время
        const now = new Date();
        const hours = now.getHours();
        const isWeekend = now.getDay() === 0 || now.getDay() === 6; // 0 = Воскресенье, 6 = Суббота
        
        // Логируем основной вход
        const loginResponse = await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: Number(data.user.id),
            action: 'login',
            xp_earned: 10,
            description: `Пользователь ${data.user.name || data.user.email} вошел в систему`
          })
        });
        
        // Проверяем специальные условия для достижений
        const specialActions = [];
        
        // 🦉 Сова - вход после 22:00
        if (hours >= 22 || hours < 6) {
          specialActions.push({
            action: 'late_login',
            xp_earned: 30,
            description: `🦉 Вход в систему в ${hours}:${now.getMinutes().toString().padStart(2, '0')} - заработано достижение "Сова"`
          });
        }
        
        // 🐦 Ранняя пташка - вход до 9:00
        if (hours >= 6 && hours < 9) {
          specialActions.push({
            action: 'early_login', 
            xp_earned: 30,
            description: `🐦 Вход в систему в ${hours}:${now.getMinutes().toString().padStart(2, '0')} - заработано достижение "Ранняя пташка"`
          });
        }
        
        // ⚔️ Воин выходных - активность в выходные
        if (isWeekend) {
          specialActions.push({
            action: 'weekend_activity',
            xp_earned: 40,
            description: `⚔️ Активность в выходной день - заработано достижение "Воин выходных"`
          });
        }
        
        // Логируем все специальные действия
        for (const specialAction of specialActions) {
          try {
            const specialResponse = await fetch('/api/activity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: Number(data.user.id),
                ...specialAction
              })
            });
            
            if (specialResponse.ok) {
              console.log(`✅ Специальное достижение: ${specialAction.action}`);
            }
          } catch (specialError) {
            console.error(`❌ Ошибка логирования ${specialAction.action}:`, specialError);
          }
        }
        
        // 🔥 ОБНОВЛЯЕМ LOGIN_STREAK (серию входов)
        try {
          // Получаем текущий прогресс для определения streak
          const progressResponse = await fetch(`/api/progress?user_id=${data.user.id}`);
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            const currentStreak = progressData.progress?.login_streak || 0;
            
            // Проверяем, был ли вход вчера (для продления streak)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const lastLoginResult = await fetch(`/api/activity?user_id=${data.user.id}&action=login&date=${yesterday.toISOString().split('T')[0]}`);
            const wasActiveYesterday = lastLoginResult.ok;
            
            // Обновляем streak
            const newStreak = wasActiveYesterday ? currentStreak + 1 : 1;
            
            const streakUpdateResponse = await fetch('/api/progress', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: Number(data.user.id),
                field: 'login_streak',
                value: newStreak
              })
            });
            
            if (streakUpdateResponse.ok) {
              console.log(`🔥 Login streak обновлен: ${newStreak} дней`);
              
              // Проверяем достижения за streak отдельным запросом
              if (newStreak >= 3) {
                await fetch('/api/activity', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    user_id: Number(data.user.id),
                    action: 'streak_update',
                    xp_earned: 0,
                    description: `Серия входов: ${newStreak} дней подряд`
                  })
                });
              }
            }
          }
        } catch (streakError) {
          console.error('❌ Ошибка обновления streak:', streakError);
        }
        
        if (loginResponse.ok) {
          console.log('✅ Логирование входа успешно');
        } else {
          console.error('❌ Ошибка логирования входа');
        }
      } catch (loginError) {
        console.error('❌ Ошибка при логировании входа:', loginError);
      }
      
      setUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError('Ошибка соединения с сервером');
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
        pt: { xs: 8, md: 12 }
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 2,
              bgcolor: 'white'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: '#8B0000'
                }}
              >
                Вход в систему
              </Typography>

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  width: '100%',
                  mt: 1
                }}
              >
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Email"
                  autoComplete="email"
                  autoFocus
                  sx={{ mb: 2 }}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Пароль"
                  type="password"
                  autoComplete="current-password"
                  sx={{ mb: 3 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <Slide direction="down" in={!!error} mountOnEnter unmountOnExit>
                  <Alert
                    severity="error"
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(139,0,0,0.08)',
                      background: 'linear-gradient(90deg, #fff 80%, #fbeaec 100%)',
                      color: '#8B0000',
                      fontWeight: 600,
                      fontFamily: 'Montserrat, Inter, Arial, sans-serif',
                      alignItems: 'center',
                      fontSize: { xs: '1.08rem', sm: '1.18rem' },
                      letterSpacing: 0.1,
                    }}
                    iconMapping={{ error: <span style={{fontSize:24,marginRight:8, color:'#8B0000'}}>❗</span> }}
                  >
                    {error === 'Database connection error' ? 'Ошибка соединения с сервером. Попробуйте позже.' :
                     error === 'Invalid login or password' ? 'Неверный логин или пароль' :
                     error === 'Login and password required' ? 'Введите логин и пароль' :
                     error === 'Ошибка входа' ? 'Ошибка входа' :
                     error}
                  </Alert>
                </Slide>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  sx={{
                    backgroundColor: '#8B0000',
                    color: '#fff',
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: '#6B0000'
                    }
                  }}
                >
                  Войти
                </Button>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Login; 