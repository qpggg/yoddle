import React from 'react';
import { Container, Typography, Box, Grid } from '@mui/material';
import { motion } from 'framer-motion';

const Benefits: React.FC = () => {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
        pt: { xs: 8, md: 12 }
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            py: { xs: 4, md: 8 }
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 700,
                mb: 3
              }}
            >
              Преимущества
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                maxWidth: '800px',
                mb: 6
              }}
            >
              Узнайте, почему ведущие компании выбирают Yoddle для управления льготами сотрудников
            </Typography>
          </motion.div>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: 'white',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    height: '100%'
                  }}
                >
                  <Typography variant="h5" sx={{ mb: 2, color: '#8B0000' }}>
                    Автоматизация
                  </Typography>
                  <Typography variant="body1">
                    Полностью автоматизированное управление льготами сотрудников, минимум ручной работы
                  </Typography>
                </Box>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: 'white',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    height: '100%'
                  }}
                >
                  <Typography variant="h5" sx={{ mb: 2, color: '#8B0000' }}>
                    Персонализация
                  </Typography>
                  <Typography variant="body1">
                    Индивидуальный подход к каждому сотруднику с учетом его потребностей и предпочтений
                  </Typography>
                </Box>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: 'white',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    height: '100%'
                  }}
                >
                  <Typography variant="h5" sx={{ mb: 2, color: '#8B0000' }}>
                    Аналитика
                  </Typography>
                  <Typography variant="body1">
                    Подробная аналитика использования льгот и оценка эффективности программ
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Benefits; 