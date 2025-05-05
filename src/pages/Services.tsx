import React from 'react';
import { Container, Typography, Box, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SportsIcon from '@mui/icons-material/Sports';
import SchoolIcon from '@mui/icons-material/School';
import { useTheme } from '@mui/material/styles';

const Services: React.FC = () => {
  const theme = useTheme();

  const services = [
    {
      title: 'Здоровье',
      icon: <FavoriteIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      description: 'Забота о психологическом благополучии ваших сотрудников',
      items: [
        'Онлайн-консультации с профессиональными психологами',
        'Программы поддержки ментального здоровья',
        'Групповые сессии по управлению стрессом',
        'Индивидуальные планы развития',
        'Мониторинг эмоционального состояния'
      ]
    },
    {
      title: 'Спорт',
      icon: <SportsIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      description: 'Комплексные программы для физического развития',
      items: [
        'Корпоративные абонементы в фитнес-центры',
        'Онлайн и офлайн тренировки с инструкторами',
        'Групповые занятия йогой',
        'Спортивные мероприятия и соревнования',
        'Персональные программы тренировок'
      ]
    },
    {
      title: 'Обучение',
      icon: <SchoolIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />,
      description: 'Развитие профессиональных и личных навыков',
      items: [
        'Курсы повышения квалификации',
        'Тренинги по развитию лидерских качеств',
        'Программы по развитию soft skills',
        'Языковые курсы',
        'Мастер-классы от экспертов отрасли'
      ]
    }
  ];

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

        {services.map((service, index) => (
          <motion.div
            key={service.title}
            variants={sectionVariants}
            whileHover={{ 
              scale: 1.01,
              transition: { 
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1]
              }
            }}
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <Box
              sx={{
                mb: 6,
                p: 6,
                borderRadius: '20px',
                backgroundColor: '#fff',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                position: 'relative',
                overflow: 'hidden',
                transform: 'perspective(1000px)',
                transformStyle: 'preserve-3d',
                willChange: 'transform, box-shadow',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: '#8B0000',
                  opacity: 0,
                  transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                },
                '&:hover::before': {
                  opacity: 1
                },
                '&:hover': {
                  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.08)',
                  transform: 'perspective(1000px) translateY(-8px) rotateX(1deg)'
                }
              }}
            >
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: { xs: 'center', md: 'flex-start' },
                    gap: 2 
                  }}>
                    <Box sx={{
                      p: 2,
                      borderRadius: '16px',
                      backgroundColor: 'rgba(139, 0, 0, 0.05)',
                      display: 'inline-flex'
                    }}>
                      {service.icon}
                    </Box>
                    <Typography
                      variant="h4"
                      component="h2"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.primary.main,
                        textAlign: { xs: 'center', md: 'left' }
                      }}
                    >
                      {service.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'rgba(0, 0, 0, 0.7)',
                        textAlign: { xs: 'center', md: 'left' },
                        mb: { xs: 2, md: 0 }
                      }}
                    >
                      {service.description}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 3
                  }}>
                    {service.items.map((item, idx) => (
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
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        ))}
      </motion.div>
    </Container>
  );
};

export default Services; 