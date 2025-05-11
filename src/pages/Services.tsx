import React from 'react';
import { Container, Typography, Box, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SportsIcon from '@mui/icons-material/Sports';
import SchoolIcon from '@mui/icons-material/School';
import { useTheme } from '@mui/material/styles';

const Services: React.FC = () => {
  const theme = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 12, mb: 8 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Typography
          variant="h2"
          component="h1"
          align="center"
          sx={{
            mb: 8,
            fontSize: { xs: '2.5rem', md: '3rem' },
            fontWeight: 700,
            fontFamily: "'Montserrat', sans-serif",
            color: '#8B0000',
            position: 'relative',
            textAlign: 'center',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-16px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '4px',
              background: '#8B0000',
              borderRadius: '2px'
            }
          }}
        >
          Наши услуги
        </Typography>

        <Box
          sx={{
            border: '3px solid #8B0000',
            borderRadius: '40px',
            p: { xs: 2, md: 6 },
            background: '#fff',
            mb: 8,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          {/* Верхняя половина — Здоровье */}
          <motion.div
            variants={sectionVariants}
            whileHover={{ 
              scale: 1.01,
              transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
            }}
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{ width: '100%' }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 2
              }}
            >
              <Box sx={{ p: 2, borderRadius: '16px', backgroundColor: 'rgba(139, 0, 0, 0.05)', display: 'inline-flex', mb: 2 }}>
                <FavoriteIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
              </Box>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 600, color: theme.palette.primary.main, textAlign: 'center', mb: 1 }}>
                Здоровье
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(0, 0, 0, 0.7)', textAlign: 'center', mb: 3 }}>
                Комплексная поддержка физического и психологического состояния сотрудников
              </Typography>
            </Box>
            <Grid container spacing={2} columns={12} sx={{ mb: 2 }}>
              {[
                'Профилактика выгорания',
                'Режим дня и баланс работы/отдыха',
                'Правильное питание и нутрициология',
                'Психологическая поддержка',
                'Мониторинг самочувствия',
                'Здоровые привычки'
              ].map((item, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      backgroundColor: 'rgba(139, 0, 0, 0.02)',
                      transform: 'translateZ(0)',
                      willChange: 'transform, background-color',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      mb: 1.5,
                      '&:hover': {
                        backgroundColor: 'rgba(139, 0, 0, 0.05)',
                        transform: 'translateX(8px) translateZ(0)',
                        boxShadow: '0 4px 12px rgba(139, 0, 0, 0.06)'
                      }
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'rgba(0, 0, 0, 0.8)',
                        position: 'relative',
                        pl: 2,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          backgroundColor: theme.palette.primary.main
                        }
                      }}
                    >
                      {item}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </motion.div>

          {/* Нижняя половина — Спорт и Обучение */}
          <Grid container spacing={2} columns={12}>
            {/* Спорт */}
            <Grid item xs={12} md={6}>
              <motion.div
                variants={sectionVariants}
                whileHover={{ 
                  scale: 1.01,
                  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                }}
                initial={{ scale: 1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%'
                  }}
                >
                  <Box sx={{ p: 2, borderRadius: '16px', backgroundColor: 'rgba(139, 0, 0, 0.05)', display: 'inline-flex', mb: 2 }}>
                    <SportsIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
                  </Box>
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 600, color: theme.palette.primary.main, textAlign: 'center', mb: 1 }}>
                    Спорт
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(0, 0, 0, 0.7)', textAlign: 'center', mb: 3 }}>
                    Разнообразные спортивные активности для команд и индивидуально
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                    {[
                      'Командные виды спорта',
                      'Фитнес-программы',
                      'Тимбилдинг через спорт'
                    ].map((item, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          backgroundColor: 'rgba(139, 0, 0, 0.02)',
                          transform: 'translateZ(0)',
                          willChange: 'transform, background-color',
                          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            backgroundColor: 'rgba(139, 0, 0, 0.05)',
                            transform: 'translateX(8px) translateZ(0)',
                            boxShadow: '0 4px 12px rgba(139, 0, 0, 0.06)'
                          }
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            color: 'rgba(0, 0, 0, 0.8)',
                            position: 'relative',
                            pl: 2,
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '4px',
                              height: '4px',
                              borderRadius: '50%',
                              backgroundColor: theme.palette.primary.main
                            }
                          }}
                        >
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            </Grid>
            {/* Обучение */}
            <Grid item xs={12} md={6}>
              <motion.div
                variants={sectionVariants}
                whileHover={{ 
                  scale: 1.01,
                  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                }}
                initial={{ scale: 1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                style={{ height: '100%' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%'
                  }}
                >
                  <Box sx={{ p: 2, borderRadius: '16px', backgroundColor: 'rgba(139, 0, 0, 0.05)', display: 'inline-flex', mb: 2 }}>
                    <SchoolIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
                  </Box>
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 600, color: theme.palette.primary.main, textAlign: 'center', mb: 1 }}>
                    Обучение
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(0, 0, 0, 0.7)', textAlign: 'center', mb: 3 }}>
                    Развитие профессиональных и личных компетенций, улучшение социальных навыков
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                    {['Soft-skills тренинги'].map((item, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          backgroundColor: 'rgba(139, 0, 0, 0.02)',
                          transform: 'translateZ(0)',
                          willChange: 'transform, background-color',
                          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            backgroundColor: 'rgba(139, 0, 0, 0.05)',
                            transform: 'translateX(8px) translateZ(0)',
                            boxShadow: '0 4px 12px rgba(139, 0, 0, 0.06)'
                          }
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            color: 'rgba(0, 0, 0, 0.8)',
                            position: 'relative',
                            pl: 2,
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '4px',
                              height: '4px',
                              borderRadius: '50%',
                              backgroundColor: theme.palette.primary.main
                            }
                          }}
                        >
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Box>
      </motion.div>
    </Container>
  );
};

export default Services; 