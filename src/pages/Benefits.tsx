import React, { useState } from 'react';
import { Container, Typography, Box, Grid, Paper, Accordion, AccordionSummary, AccordionDetails, useMediaQuery, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutomationIcon from '@mui/icons-material/AutoFixHigh';
import PersonalizationIcon from '@mui/icons-material/PersonOutline';
import AnalyticsIcon from '@mui/icons-material/QueryStats';
import SupportIcon from '@mui/icons-material/Support';
import SavingsIcon from '@mui/icons-material/Savings';
import ComputerIcon from '@mui/icons-material/Computer';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CloudIcon from '@mui/icons-material/Cloud';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import SecurityIcon from '@mui/icons-material/Security';

// 🚀 ОПТИМИЗИРОВАННЫЙ КОМПОНЕНТ С МЕМОИЗАЦИЕЙ
const Benefits: React.FC = React.memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // xs и sm - мобильные
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);

  // Обработчик аккордеона для мобильных
  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };
  
  const benefits = [
    {
      icon: <AutomationIcon />,
      title: 'Автоматизация HR-процессов',
      description: 'Автоматизируем основные операции с льготами и отчетностью. Система работает круглосуточно, снижая время на рутинные задачи на 70%.',
      stats: '70% автоматизация',
      color: '#8B0000'
    },
    {
      icon: <PersonalizationIcon />,
      title: 'Персонализация льгот',
      description: 'Анализируем предпочтения сотрудников и предлагаем подходящие льготы на основе их профиля и истории использования. Каждый получает персональные рекомендации.',
      stats: 'Персональный подход',
      color: '#A61E1E'
    },
    {
      icon: <AnalyticsIcon />,
      title: 'Аналитика и отчеты',
      description: 'Подробная аналитика использования льгот с понятными графиками и отчетами. Отслеживаем тренды удовлетворенности и помогаем принимать обоснованные решения.',
      stats: 'Данные в реальном времени',
      color: '#C43D3D'
    },
    {
      icon: <SupportIcon />,
      title: 'Техническая поддержка',
      description: 'Быстрая поддержка через чат и email. Решаем большинство вопросов в течение 30 минут. Система самообслуживания покрывает типовые запросы пользователей.',
      stats: '30 мин среднее время ответа',
      color: '#8B0000'
    },
    {
      icon: <SavingsIcon />,
      title: 'Оптимизация бюджета',
      description: 'Помогаем эффективно распределять бюджет на льготы через детальную аналитику. Отслеживаем популярность льгот и их влияние на удовлетворенность команды.',
      stats: 'Прозрачность трат',
      color: '#A61E1E'
    }
  ];

  // 🚀 ОПТИМИЗИРОВАННЫЕ АНИМАЦИИ (мемоизированные и упрощенные)
  const containerVariants = React.useMemo(() => ({
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1, // Уменьшил с 0.15
        delayChildren: 0.1    // Уменьшил с 0.2
      }
    }
  }), []);

  const itemVariants = React.useMemo(() => ({
    hidden: {
      opacity: 0,
      y: 20, // Уменьшил с 30
      scale: 0.98 // Уменьшил с 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4, // Уменьшил с 0.6
        ease: "easeOut" // Упрощенный easing
      }
    }
  }), []);

  // 🎯 УБРАЛ БЕСКОНЕЧНЫЕ АНИМАЦИИ (они лагают)
  // const floatingVariants = ...

  return (
    <Box
      component="main"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
        pt: { xs: theme.spacing(10), md: theme.spacing(15) },
        pb: { xs: theme.spacing(8), md: theme.spacing(12) },
        // 🚀 HARDWARE ACCELERATION
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        perspective: 1000
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
          background: 'radial-gradient(circle, rgba(139, 0, 0, 0.02) 0%, transparent 70%)',
          zIndex: 1,
          display: { xs: 'none', lg: 'block' }
        }}
      />
      
      {/* 🎯 УДАЛИЛ ТЯЖЕЛЫЕ FLOATING ЭЛЕМЕНТЫ (они лагают) */}

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
              Преимущества{' '}
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
              Современная платформа для управления льготами с автоматизацией, персонализацией и удобной аналитикой
            </Typography>
          </Box>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Grid container spacing={{ xs: 3, md: 4 }} sx={{ position: 'relative', zIndex: 2 }}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <motion.div variants={itemVariants}>
                  {isMobile ? (
                    // 📱 МОБИЛЬНАЯ ВЕРСИЯ - АККОРДЕОН
                    <Accordion 
                      expanded={expandedAccordion === `benefit-${index}`}
                      onChange={handleAccordionChange(`benefit-${index}`)}
                      sx={{
                        borderRadius: '16px !important',
                        border: `1px solid ${benefit.color}20`,
                        boxShadow: 'none',
                        '&:before': {
                          display: 'none',
                        },
                        '&.Mui-expanded': {
                          margin: '0 !important',
                        }
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: benefit.color }} />}
                        sx={{
                          backgroundColor: `${benefit.color}04`,
                          borderRadius: '16px',
                          '&.Mui-expanded': {
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                          },
                          '& .MuiAccordionSummary-content': {
                            margin: '12px 0',
                            alignItems: 'center'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: `linear-gradient(135deg, ${benefit.color}15 0%, ${benefit.color}08 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              '& svg': {
                                fontSize: '24px',
                                color: benefit.color
                              }
                            }}
                          >
                            {benefit.icon}
                          </Box>
                          <Typography
                            variant="h6"
                            sx={{
                              color: benefit.color,
                              fontWeight: 600,
                              fontSize: '1.1rem'
                            }}
                          >
                            {benefit.title}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 3 }}>
                        <Typography
                          sx={{
                            color: '#666666',
                            mb: 2,
                            fontSize: '0.95rem',
                            lineHeight: 1.6,
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
                            borderRadius: '16px',
                            background: `linear-gradient(135deg, ${benefit.color}12 0%, ${benefit.color}06 100%)`,
                            border: `1px solid ${benefit.color}20`,
                          }}
                        >
                          <Typography
                            sx={{
                              color: benefit.color,
                              fontWeight: 700,
                              fontSize: '0.9rem'
                            }}
                          >
                            {benefit.stats}
                          </Typography>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ) : (
                    // 🖥️ ДЕСКТОПНАЯ ВЕРСИЯ - КАК РАНЬШЕ
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 2, md: 4 },
                        height: '100%',
                        minHeight: { xs: '240px', md: '380px' },
                        borderRadius: { xs: '16px', md: '24px' },
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        backgroundColor: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
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
                          width: { xs: '48px', md: '72px' },
                          height: { xs: '48px', md: '72px' },
                          borderRadius: { xs: '12px', md: '20px' },
                          background: `linear-gradient(135deg, ${benefit.color}15 0%, ${benefit.color}08 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: { xs: 1.5, md: 3 },
                          position: 'relative',
                          transition: 'all 0.3s ease',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            inset: '-2px',
                            borderRadius: { xs: '18px', md: '22px' },
                            border: `2px solid ${benefit.color}20`,
                            opacity: 0,
                            transition: 'opacity 0.3s ease'
                          },
                          '&:hover::after': {
                            opacity: 1
                          },
                          '& svg': {
                            fontSize: { xs: '28px', md: '36px' },
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
                          mb: { xs: 1.5, md: 2 },
                          fontSize: { xs: '1.1rem', md: '1.6rem' },
                          lineHeight: 1.3
                        }}
                      >
                        {benefit.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#666666',
                          mb: { xs: 2, md: 3 },
                          fontSize: { xs: '0.85rem', md: '1rem' },
                          lineHeight: { xs: 1.5, md: 1.7 },
                          letterSpacing: '0.01em',
                          flex: 1
                        }}
                      >
                        {benefit.description}
                      </Typography>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: { xs: 2, md: 3 },
                          py: { xs: 1, md: 1.5 },
                          borderRadius: { xs: '16px', md: '20px' },
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
                            fontSize: { xs: '0.85rem', md: '1rem' },
                            position: 'relative',
                            zIndex: 2
                          }}
                        >
                          {benefit.stats}
                        </Typography>
                      </Box>
                    </Paper>
                  )}
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Modern Technology Stack Section */}
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
                fontSize: { xs: '2rem', md: '2.4rem' },
                letterSpacing: '-0.02em'
              }}
            >
              Основа платформы
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#666',
                mb: 8,
                fontSize: { xs: '1rem', md: '1.1rem' },
                maxWidth: '500px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Надежные решения для удобной работы с льготами
            </Typography>
            
            {/* Modern Grid Layout */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
              gap: 3,
              mb: 6 
            }}>
              {[
                { 
                  title: 'Веб-интерфейс', 
                  desc: 'Простой и понятный дизайн',
                  icon: <ComputerIcon />,
                  gradient: 'linear-gradient(135deg, #8B0000 0%, #A61E1E 100%)'
                },
                { 
                  title: 'Отчеты', 
                  desc: 'Быстрая генерация данных',
                  icon: <BarChartIcon />,
                  gradient: 'linear-gradient(135deg, #A61E1E 0%, #C43D3D 100%)'
                },
                { 
                  title: 'Аналитика', 
                  desc: 'Наглядные графики',
                  icon: <TrendingUpIcon />,
                  gradient: 'linear-gradient(135deg, #C43D3D 0%, #8B0000 100%)'
                },
                { 
                  title: 'Хранение', 
                  desc: 'Безопасность данных',
                  icon: <CloudIcon />,
                  gradient: 'linear-gradient(135deg, #8B0000 0%, #A61E1E 100%)'
                },
                { 
                  title: 'Интеграция', 
                  desc: 'Экспорт данных и настройки',
                  icon: <IntegrationInstructionsIcon />,
                  gradient: 'linear-gradient(135deg, #A61E1E 0%, #C43D3D 100%)'
                },
                { 
                  title: 'Поддержка', 
                  desc: 'Техническое сопровождение',
                  icon: <SecurityIcon />,
                  gradient: 'linear-gradient(135deg, #C43D3D 0%, #8B0000 100%)'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  whileHover={{ 
                    y: -8,
                    transition: { duration: 0.3 }
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2.5, md: 4 },
                      height: { xs: '180px', md: '220px' },
                      borderRadius: { xs: '16px', md: '24px' },
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      backgroundColor: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
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
                        background: item.gradient,
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
                        background: `linear-gradient(135deg, ${item.gradient}03 0%, transparent 50%)`,
                        opacity: 0,
                        transition: 'opacity 0.4s ease'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: '56px', md: '72px' },
                        height: { xs: '56px', md: '72px' },
                        borderRadius: { xs: '14px', md: '20px' },
                        background: `linear-gradient(135deg, rgba(139, 0, 0, 0.15) 0%, rgba(139, 0, 0, 0.08) 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: { xs: 2, md: 3 },
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        mx: 'auto',
                        flexShrink: 0,
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          inset: '-2px',
                          borderRadius: { xs: '16px', md: '22px' },
                          border: `2px solid rgba(139, 0, 0, 0.2)`,
                          opacity: 0,
                          transition: 'opacity 0.3s ease'
                        },
                        '&:hover::after': {
                          opacity: 1
                        },
                        '& svg': {
                          fontSize: { xs: '28px', md: '36px' },
                          color: '#8B0000',
                          transition: 'transform 0.3s ease',
                          display: 'block',
                          margin: 'auto'
                        },
                        '&:hover svg': {
                          transform: 'scale(1.1) rotate(5deg)'
                        }
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: '#1A1A1A',
                        mb: { xs: 1.5, md: 2 },
                        fontSize: { xs: '1rem', md: '1.2rem' },
                        lineHeight: 1.3,
                        textAlign: 'center'
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#666666',
                        fontSize: { xs: '0.8rem', md: '0.9rem' },
                        lineHeight: 1.5,
                        letterSpacing: '0.01em',
                        flex: 1,
                        textAlign: 'center'
                      }}
                    >
                      {item.desc}
                    </Typography>
                  </Paper>
                </motion.div>
              ))}
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
});

export default Benefits; 