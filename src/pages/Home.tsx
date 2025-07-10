import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

// 🚀 ОПТИМИЗИРОВАННЫЙ КОМПОНЕНТ С МЕМОИЗАЦИЕЙ
const Home: React.FC = React.memo(() => {
  const theme = useTheme();

  // 🚀 МЕМОИЗИРОВАННЫЕ АНИМАЦИИ (оптимизированные)
  const fadeInUp = React.useMemo(() => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" } // Упрощенный easing, ускорил с 0.8
  }), []);

  const fadeInUpDelayed = React.useMemo(() => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: 0.1, ease: "easeOut" } // Уменьшил delay с 0.2
  }), []);

  const fadeInUpButton = React.useMemo(() => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: 0.2, ease: "easeOut" } // Уменьшил delay с 0.4
  }), []);

  return (
    <Box 
      component="main"
      sx={{
        // 🚀 HARDWARE ACCELERATION
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        perspective: 1000
      }}
    >
      <Box
        component="section"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
          pt: { xs: theme.spacing(10), md: theme.spacing(15) },
          pb: { xs: theme.spacing(8), md: theme.spacing(15) },
          minHeight: { xs: 'calc(100vh - 64px)', md: '100vh' },
          // 🚀 HARDWARE ACCELERATION ДЛЯ СЕКЦИИ
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              zIndex: 2
            }}
          >
            <motion.div
              initial={fadeInUp.initial}
              animate={fadeInUp.animate}
              transition={fadeInUp.transition}
            >
              <Typography 
                variant="h1" 
                sx={{
                  fontSize: { xs: theme.typography.pxToRem(32), md: theme.typography.pxToRem(64) },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  mb: { xs: 2, md: 3 }
                }}
              >
                <Box component="span" sx={{ color: '#000' }}>
                  Yoddle —
                </Box>{' '}
                <Box component="span" sx={{ color: theme.palette.primary.main }}>
                  персонализированные
                </Box>{' '}
                <Box component="span" sx={{ color: '#000' }}>
                  льготы для вашего бизнеса
                </Box>
              </Typography>
            </motion.div>

            <motion.div
              initial={fadeInUpDelayed.initial}
              animate={fadeInUpDelayed.animate}
              transition={fadeInUpDelayed.transition}
            >
              <Typography 
                variant="h2" 
                sx={{ 
                  fontSize: { xs: theme.typography.pxToRem(18), md: theme.typography.pxToRem(24) },
                  fontWeight: 400,
                  color: '#666',
                  maxWidth: '800px',
                  mx: 'auto',
                  mb: { xs: 4, md: 5 }
                }}
              >
                Автоматизация управления льготами,{' '}
                <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
                  повышение лояльности
                </Box>{' '}
                сотрудников
              </Typography>
            </motion.div>

            <motion.div
              initial={fadeInUpButton.initial}
              animate={fadeInUpButton.animate}
              transition={fadeInUpButton.transition}
            >
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: '#fff',
                  fontSize: { xs: theme.typography.pxToRem(16), md: theme.typography.pxToRem(18) },
                  py: { xs: 1.5, md: 2 },
                  px: { xs: 4, md: 6 },
                  textTransform: 'none',
                  borderRadius: 2,
                  boxShadow: '0 4px 6px rgba(139, 0, 0, 0.2)',
                  // 🚀 ОПТИМИЗИРОВАННЫЕ HOVER ЭФФЕКТЫ
                  transition: 'all 0.2s ease', // Ускорил transition
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    boxShadow: '0 6px 8px rgba(139, 0, 0, 0.3)',
                    transform: 'translateY(-2px)' // Добавил hover lift
                  },
                  '&:focus': {
                    boxShadow: `0 0 0 3px ${theme.palette.primary.main}33`,
                  },
                  '&:active': {
                    transform: 'translateY(1px)',
                  }
                }}
              >
                Начать использовать
              </Button>
            </motion.div>
          </Box>

          {/* 🎨 ОПТИМИЗИРОВАННЫЙ ФОНОВЫЙ ТЕКСТ */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              display: { xs: 'none', md: 'block' },
              // 🚀 HARDWARE ACCELERATION
              willChange: 'transform',
              backfaceVisibility: 'hidden'
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: theme.typography.pxToRem(300), // Уменьшил с 400
                fontWeight: 800,
                color: 'rgba(139, 0, 0, 0.02)', // Уменьшил opacity с 0.03
                whiteSpace: 'nowrap',
                userSelect: 'none',
                pointerEvents: 'none' // Оптимизация для производительности
              }}
            >
              YODDLE
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* CTA Section - Оптимизированная */}
      <Box
        id="cta"
        component="section"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.95) 0%, rgba(139, 0, 0, 0.8) 100%)',
          py: { xs: 8, md: 12 },
          mt: { xs: 4, md: 6 },
          scrollMarginTop: '64px',
          scrollPaddingTop: '64px',
          scrollBehavior: 'smooth',
          // 🚀 HARDWARE ACCELERATION ДЛЯ CTA
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* CTA контент можно добавить здесь если нужно */}
      </Box>
    </Box>
  );
});

export default Home; 