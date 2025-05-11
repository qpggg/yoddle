import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const Dashboard: React.FC = () => {
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
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            bgcolor: 'white',
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#8B0000', mb: 2 }}>
            Добро пожаловать!
          </Typography>
          <Typography>
            Вы успешно вошли в систему. Здесь будет ваш личный кабинет или панель управления.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Dashboard; 