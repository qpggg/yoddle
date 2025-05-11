import React from 'react';
import { Container, Typography, Box, TextField, Button, Paper, Alert, Slide } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const Login: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();
  const theme = useTheme();

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
      // Вход успешен
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