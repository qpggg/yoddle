import React from 'react';
import { Container, Typography, Box, TextField, Button, Paper } from '@mui/material';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
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
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Пароль"
                  type="password"
                  autoComplete="current-password"
                  sx={{ mb: 3 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
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