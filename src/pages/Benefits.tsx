import React from 'react';
import { Container, Typography, Box, Grid, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import AutomationIcon from '@mui/icons-material/AutoFixHigh';
import PersonalizationIcon from '@mui/icons-material/PersonOutline';
import AnalyticsIcon from '@mui/icons-material/QueryStats';
import SupportIcon from '@mui/icons-material/Support';
import SavingsIcon from '@mui/icons-material/Savings';
import { useTheme } from '@mui/material/styles';

const Benefits: React.FC = () => {
  const theme = useTheme();
  
  const benefits = [
    {
      icon: <AutomationIcon />,
      title: 'Гиперавтоматизация HR-процессов',
      description: 'Умные алгоритмы автоматизируют 95% рутинных операций. Продвинутые системы управляют распределением льгот, бюджетированием и отчетностью без участия человека. Smart algorithms оптимизируют процессы в режиме 24/7.',
      stats: '95% автоматизация',
      color: '#8B0000'
    },
    {
      icon: <PersonalizationIcon />,
      title: 'Data-driven персонализация',
      description: 'Интеллектуальные алгоритмы анализируют 200+ параметров поведения сотрудников и предлагают оптимальные льготы с высокой точностью. Каждый получает персональный опыт, основанный на данных.',
      stats: '200+ параметров анализа',
      color: '#FF6B35'
    },
    {
      icon: <AnalyticsIcon />,
      title: 'Real-time аналитика и insights',
      description: 'Продвинутая BI-система с live дашбордами. Smart analytics прогнозирует тренды удовлетворенности и retention rate. Каждое решение подкреплено данными и готово к ML-интеграции.',
      stats: 'Live данные 24/7',
      color: '#4ECDC4'
    },
    {
      icon: <SupportIcon />,
      title: 'Умная система поддержки',
      description: 'Автоматизированная поддержка решает 89% запросов мгновенно. Для сложных кейсов — команда экспертов с гарантированным SLA 15 минут. Система постоянно совершенствуется.',
      stats: '89% автоматизация',
      color: '#45B7D1'
    },
    {
      icon: <SavingsIcon />,
      title: 'Максимизация ROI через данные',
      description: 'Продвинутая аналитика оптимизирует каждый рубль бюджета льгот. Cost-per-engagement снижается на 67%, а satisfaction score растет на 156%. Data-driven подход к каждому решению.',
      stats: '+156% satisfaction',
      color: '#96CEB4'
    }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <Box
      component="main"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
        pt: { xs: theme.spacing(10), md: theme.spacing(15) },
        pb: { xs: theme.spacing(8), md: theme.spacing(12) }
      }}
    >
      {/* Enhanced Background Decorations */}
      <Box
        sx={{
          position: 'absolute',
          top: '5%',
          right: '-15%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 0, 0, 0.02) 0%, rgba(139, 0, 0, 0.005) 50%, transparent 100%)',
          zIndex: 1,
          display: { xs: 'none', lg: 'block' }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '-20%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 107, 53, 0.02) 0%, transparent 70%)',
          zIndex: 1,
          display: { xs: 'none', lg: 'block' }
        }}
      />
      
      {/* Floating Elements */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{
          position: 'absolute',
          top: '20%',
          left: '5%',
          zIndex: 1
        }}
      >
        <Box
          sx={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.1) 0%, rgba(139, 0, 0, 0.05) 100%)',
            display: { xs: 'none', xl: 'block' }
          }}
        />
      </motion.div>
      
      <motion.div
        variants={{
          animate: {
            y: [0, 15, 0],
            transition: {
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }
        }}
        animate="animate"
        style={{
          position: 'absolute',
          bottom: '30%',
          right: '8%',
          zIndex: 1
        }}
      >
        <Box
          sx={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(76, 236, 196, 0.15) 0%, rgba(76, 236, 196, 0.05) 100%)',
            display: { xs: 'none', xl: 'block' }
          }}
        />
      </motion.div>

      {/* Background Text */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '-15%',
          zIndex: 1,
          display: { xs: 'none', lg: 'block' }
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: theme.typography.pxToRem(350),
            fontWeight: 900,
            color: 'rgba(139, 0, 0, 0.015)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            transform: 'rotate(-12deg)',
            letterSpacing: '-0.05em'
          }}
        >
          SMART·DATA
        </Typography>
      </Box>

      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 }, position: 'relative', zIndex: 2 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: theme.typography.pxToRem(40), md: theme.typography.pxToRem(56) },
                fontWeight: 800,
                lineHeight: 1.2,
                mb: { xs: 2, md: 3 },
                color: '#1A1A1A',
                letterSpacing: '-0.02em'
              }}
            >
              Smart-преимущества{' '}
              <Box component="span" sx={{ color: theme.palette.primary.main }}>
                Yoddle
              </Box>
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: theme.typography.pxToRem(18), md: theme.typography.pxToRem(22) },
                fontWeight: 400,
                color: '#666',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Умная платформа с продвинутыми алгоритмами, которая трансформирует HR через automation, personalization и data science
            </Typography>
          </Box>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Grid container spacing={4} sx={{ position: 'relative', zIndex: 2 }}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <motion.div variants={itemVariants}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      height: '100%',
                      borderRadius: '24px',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      backgroundColor: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-12px) scale(1.02)',
                        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.15)',
                        '&::before': {
                          opacity: 1
                        },
                        '&::after': {
                          opacity: 1
                        }
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: `linear-gradient(90deg, ${benefit.color} 0%, ${benefit.color}80 100%)`,
                        opacity: 0.7,
                        transition: 'opacity 0.4s ease'
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(135deg, ${benefit.color}03 0%, transparent 50%)`,
                        opacity: 0,
                        transition: 'opacity 0.4s ease'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '20px',
                        background: `linear-gradient(135deg, ${benefit.color}15 0%, ${benefit.color}08 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          inset: '-2px',
                          borderRadius: '22px',
                          border: `2px solid ${benefit.color}20`,
                          opacity: 0,
                          transition: 'opacity 0.3s ease'
                        },
                        '&:hover::after': {
                          opacity: 1
                        },
                        '& svg': {
                          fontSize: '36px',
                          color: benefit.color,
                          transition: 'transform 0.3s ease'
                        },
                        '&:hover svg': {
                          transform: 'scale(1.1) rotate(5deg)'
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
                        mb: 2,
                        fontSize: { xs: '1.4rem', md: '1.6rem' },
                        lineHeight: 1.3
                      }}
                    >
                      {benefit.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#666666',
                        mb: 3,
                        fontSize: '1rem',
                        lineHeight: 1.7,
                        letterSpacing: '0.01em'
                      }}
                    >
                      {benefit.description}
                    </Typography>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 3,
                        py: 1.5,
                        borderRadius: '20px',
                        background: `linear-gradient(135deg, ${benefit.color}12 0%, ${benefit.color}06 100%)`,
                        border: `1px solid ${benefit.color}20`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          right: 0,
                          bottom: 0,
                          background: `linear-gradient(90deg, transparent 0%, ${benefit.color}08 50%, transparent 100%)`,
                          animation: 'shimmer 3s infinite',
                          zIndex: 1
                        },
                        '@keyframes shimmer': {
                          '0%': { left: '-100%' },
                          '50%': { left: '100%' },
                          '100%': { left: '100%' }
                        }
                      }}
                    >
                      <Typography
                        sx={{
                          color: benefit.color,
                          fontWeight: 700,
                          fontSize: '1rem',
                          position: 'relative',
                          zIndex: 2
                        }}
                      >
                        {benefit.stats}
                      </Typography>
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Enhanced Technology Stack Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Box sx={{ mt: { xs: 8, md: 12 }, textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#1A1A1A',
                mb: 2,
                fontSize: { xs: '2rem', md: '2.8rem' },
                letterSpacing: '-0.02em'
              }}
            >
              Технологический стек
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#666',
                mb: 6,
                fontSize: { xs: '1rem', md: '1.2rem' },
                maxWidth: '600px',
                mx: 'auto'
              }}
            >
              Передовые технологии для создания интеллектуальных HR-решений
            </Typography>
            <Grid container spacing={3} sx={{ mb: 8 }}>
              {[
                { tech: 'Smart Algorithms', desc: 'Intelligent automation', color: '#8B0000' },
                { tech: 'Real-time Processing', desc: 'Live data streams', color: '#FF6B35' },
                { tech: 'Advanced Analytics', desc: 'Data-driven insights', color: '#4ECDC4' },
                { tech: 'Cloud Infrastructure', desc: '99.9% uptime SLA', color: '#45B7D1' },
                { tech: 'API-first Design', desc: 'Seamless integrations', color: '#96CEB4' },
                { tech: 'Enterprise Security', desc: 'Bank-grade protection', color: '#8B0000' }
              ].map((item, index) => (
                <Grid item xs={6} md={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.1,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        borderRadius: '20px',
                        backgroundColor: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
                          '&::before': {
                            opacity: 1
                          }
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}80 100%)`,
                          opacity: 0,
                          transition: 'opacity 0.3s ease'
                        }
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: item.color,
                          mb: 1,
                          fontSize: '1.2rem'
                        }}
                      >
                        {item.tech}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#666',
                          fontSize: '0.95rem',
                          lineHeight: 1.5
                        }}
                      >
                        {item.desc}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Benefits; 