import React from 'react';
import { Container, Typography, Box, TextField, Button, Paper, Alert, Slide } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ADMIN_USER_KEY = 'yoddle_admin_user';

export const getAdminUser = () => {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAdminUser = (user: object) => {
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
};

export const clearAdminUser = () => {
  localStorage.removeItem(ADMIN_USER_KEY);
};

const AdminLogin: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Ошибка входа');
        return;
      }
      setAdminUser(data.user);
      navigate('/admin/dashboard');
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)', pt: { xs: 8, md: 12 } }}>
      <Container maxWidth="sm">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2, bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#8B0000' }}>
                Вход для HR
              </Typography>
              <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Логин"
                  autoComplete="email"
                  autoFocus
                  sx={{ mb: 2 }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Slide direction="down" in={!!error} mountOnEnter unmountOnExit>
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {error}
                  </Alert>
                </Slide>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={isLoading}
                  sx={{ backgroundColor: '#8B0000', color: '#fff', py: 1.5, '&:hover': { backgroundColor: '#6B0000' } }}
                >
                  {isLoading ? 'Вход...' : 'Войти'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default AdminLogin;
