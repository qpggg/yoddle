import React from 'react';
import { Container, Typography, Box, Grid, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import AutomationIcon from '@mui/icons-material/AutoFixHigh';
import PersonalizationIcon from '@mui/icons-material/PersonOutline';
import AnalyticsIcon from '@mui/icons-material/QueryStats';
import SupportIcon from '@mui/icons-material/Support';
import SavingsIcon from '@mui/icons-material/Savings';

const Benefits: React.FC = () => {
  const benefits = [
    {
      icon: <AutomationIcon />,
      title: 'Автоматизация и экономия времени',
      description: 'Сокращение рутинных операций на 75%. Автоматическое распределение льгот и управление бюджетом освобождает до 20 часов в неделю для HR-специалистов.',
      stats: 'Экономия 75% времени'
    },
    {
      icon: <PersonalizationIcon />,
      title: 'Индивидуальные льготы для каждого',
      description: 'Персонализированный подход к выбору льгот повышает удовлетворенность сотрудников на 40%. Каждый работник получает именно те бенефиты, которые ему важны.',
      stats: '+40% удовлетворенность'
    },
    {
      icon: <AnalyticsIcon />,
      title: 'Глубокая аналитика и прозрачность',
      description: 'Детальные отчеты об использовании льгот и их влиянии на вовлеченность. Измеримые результаты и ROI для каждого внедренного решения.',
      stats: '100% прозрачность'
    },
    {
      icon: <SupportIcon />,
      title: 'Поддержка 24/7',
      description: 'Профессиональная техническая и консультационная поддержка в режиме реального времени. Среднее время ответа — менее 15 минут.',
      stats: '15 минут на ответ'
    },
    {
      icon: <SavingsIcon />,
      title: 'Оптимизация бюджета',
      description: 'Снижение затрат на администрирование льгот на 30% при одновременном повышении их эффективности. Прозрачное распределение бюджета.',
      stats: '-30% затрат'
    }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
        pt: { xs: 8, md: 12 },
        pb: { xs: 8, md: 12 }
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 800,
                color: '#1A1A1A',
                mb: 3,
                letterSpacing: '-0.02em'
              }}
            >
              Преимущества Yoddle
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                color: '#666666',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Инновационная платформа, которая трансформирует управление льготами
              и повышает эффективность HR-процессов
            </Typography>
          </Box>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} md={6} key={index}>
                <motion.div variants={itemVariants}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      height: '100%',
                      borderRadius: '24px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      backgroundColor: 'white',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(139, 0, 0, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        '& svg': {
                          fontSize: '28px',
                          color: '#8B0000'
                        }
                      }}
                    >
                      {benefit.icon}
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: '#1A1A1A',
                        mb: 1,
                        fontSize: { xs: '1.5rem', md: '1.75rem' }
                      }}
                    >
                      {benefit.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#666666',
                        mb: 3,
                        fontSize: '1.1rem',
                        lineHeight: 1.6
                      }}
                    >
                      {benefit.description}
                    </Typography>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 1,
                        borderRadius: '12px',
                        backgroundColor: 'rgba(139, 0, 0, 0.08)',
                        color: '#8B0000',
                        fontWeight: 600,
                        fontSize: '1.1rem'
                      }}
                    >
                      {benefit.stats}
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Benefits; 