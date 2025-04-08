import React, { useState } from 'react';
import { Box, TextField, Paper } from '@mui/material';
import LoginButton from './LoginButton';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      // Здесь будет логика авторизации
      console.log('Login attempt with:', { email, password });
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        width: '100%',
        maxWidth: '400px',
        borderRadius: '24px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'white',
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(139, 0, 0, 0.3)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#8B0000',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#8B0000',
            },
          }}
        />
        <TextField
          fullWidth
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(139, 0, 0, 0.3)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#8B0000',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#8B0000',
            },
          }}
        />
        <LoginButton isDisabled={!isFormValid} onClick={() => handleSubmit} />
      </Box>
    </Paper>
  );
};

export default LoginForm; 