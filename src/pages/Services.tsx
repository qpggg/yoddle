import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AutomationIcon from '@mui/icons-material/AutoFixHigh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';

// 🚀 ОПТИМИЗИРОВАННЫЙ КОМПОНЕНТ С МЕМОИЗАЦИЕЙ
const Services: React.FC = React.memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // xs и sm - мобильные
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);

  // Обработчик аккордеона для мобильных
  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  // 🚀 ОПТИМИЗИРОВАННЫЕ АНИМАЦИИ (мемоизированные и упрощенные)
  const containerVariants = React.useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Уменьшил с 0.25
        delayChildren: 0.1    // Уменьшил с 0.2
      }
    }
  }), []);

  const sectionVariants = React.useMemo(() => ({
    hidden: { opacity: 0, y: 20, scale: 0.98 }, // Уменьшил значения
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4, // Уменьшил с 0.8
        ease: "easeOut" // Упрощенный easing
      }
    }
  }), []);

  // 🎯 УБРАЛ БЕСКОНЕЧНЫЕ АНИМАЦИИ (они лагают)
  // const floatingVariants = ...

  const services = [
    {
      icon: PsychologyIcon,
      title: 'Здоровье и благополучие',
      subtitle: 'Комплексная поддержка физического и психологического состояния сотрудников',
      items: [
        'Профилактика выгорания и стресса',
        'Консультации по режиму дня и балансу работы/отдыха',
        'Правильное питание и нутрициология',
        'Психологическая поддержка и консультации',
        'Мониторинг самочувствия команды',
        'Программы формирования здоровых привычек'
      ],
      color: '#8B0000',
      stats: 'Забота о здоровье'
    },
    {
      icon: AnalyticsIcon,
      title: 'Спорт и активность',
      subtitle: 'Разнообразные спортивные активности для команд и индивидуально',
      items: [
        'Командные виды спорта для сплочения',
        'Индивидуальные фитнес-программы',
        'Тимбилдинг через спортивные активности',
        'Корпоративные спортивные турниры',
        'Абонементы в спортзалы и бассейны',
        'Программы здорового образа жизни'
      ],
      color: '#A61E1E',
      stats: 'Активная команда'
    },
    {
      icon: AutomationIcon,
      title: 'Обучение и развитие',
      subtitle: 'Развитие профессиональных и личных компетенций, улучшение социальных навыков',
      items: [
        'Профессиональные курсы и тренинги',
        'Развитие лидерских качеств',
        'Soft-skills тренинги и мастер-классы',
        'Корпоративное обучение и менторство',
        'Конференции и образовательные мероприятия',
        'Программы карьерного роста'
      ],
      color: '#C43D3D',
      stats: 'Рост компетенций'
    }
  ];

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
          top: '8%',
          right: '-20%',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 0, 0, 0.02) 0%, rgba(139, 0, 0, 0.005) 50%, transparent 100%)',
          zIndex: 1,
          display: { xs: 'none', lg: 'block' }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '-25%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 0, 0, 0.015) 0%, transparent 70%)',
          zIndex: 1,
          display: { xs: 'none', lg: 'block' }
        }}
      />
      
      {/* 🎯 УДАЛИЛ ВСЕ ТЯЖЕЛЫЕ FLOATING ЭЛЕМЕНТЫ (они лагают) */}
      <Container maxWidth="lg">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Hero Section */}
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
              Льготы для{' '}
              <Box component="span" sx={{ color: theme.palette.primary.main }}>
                вашей команды
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
              Комплексные программы поддержки сотрудников: здоровье, спорт, обучение с персонализацией и геймификацией для повышения вовлеченности
            </Typography>
          </Box>

          {/* Services Grid */}
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Grid container spacing={6}>
              {services.map((service, index) => (
                <Grid item xs={12} lg={4} key={index}>
                  <motion.div
                    variants={sectionVariants}
                    whileHover={{ 
                      scale: 1.03,
                      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                    }}
                    style={{ height: '100%' }}
                  >
                  <Box
                    sx={{
                      p: 5,
                      borderRadius: '28px',
                      background: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                      '&:hover': {
                        transform: 'translateY(-12px)',
                        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.12)',
                        '&::before': {
                          opacity: 1,
                          transform: 'translateX(100%)'
                        }
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(90deg, transparent, ${service.color}08, transparent)`,
                        opacity: 0,
                        transition: 'all 0.6s ease',
                        transform: 'translateX(-100%)'
                      }
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ mb: 4, position: 'relative', zIndex: 2 }}>
                      <Box
                        sx={{
                          width: 72,
                          height: 72,
                          borderRadius: '20px',
                          background: `linear-gradient(135deg, ${service.color}15 0%, ${service.color}08 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 3,
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '20px',
                            border: `2px solid ${service.color}20`,
                          }
                        }}
                      >
                        <service.icon sx={{ fontSize: 36, color: service.color }} />
                      </Box>
                      
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700, 
                          color: '#1A1A1A',
                          mb: 1,
                          fontSize: { xs: '1.5rem', md: '1.75rem' },
                          lineHeight: 1.3
                        }}
                      >
                        {service.title}
                      </Typography>
                      
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#666',
                          fontSize: '1rem',
                          lineHeight: 1.6,
                          letterSpacing: '0.01em'
                        }}
                      >
                        {service.subtitle}
                      </Typography>
                    </Box>

                    {/* Features List - Responsive: Accordion на мобильных, Grid на десктопе */}
                    <Box sx={{ flex: 1, mb: 4, position: 'relative', zIndex: 2 }}>
                      {isMobile ? (
                        // 📱 МОБИЛЬНАЯ ВЕРСИЯ - АККОРДЕОН
                        <Accordion 
                          expanded={expandedAccordion === `panel-${index}`}
                          onChange={handleAccordionChange(`panel-${index}`)}
                          sx={{
                            borderRadius: '16px !important',
                            border: `1px solid ${service.color}20`,
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
                            expandIcon={<ExpandMoreIcon sx={{ color: service.color }} />}
                            sx={{
                              backgroundColor: `${service.color}04`,
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
                            <Typography
                              variant="body1"
                              sx={{
                                color: service.color,
                                fontWeight: 600,
                                fontSize: '1rem'
                              }}
                            >
                              Показать все льготы ({service.items.length})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ p: 0 }}>
                            <Grid container spacing={2} sx={{ p: 2 }}>
                              {service.items.map((item, idx) => (
                                <Grid item xs={12} key={idx}>
                                  <Box
                                    sx={{
                                      p: 2,
                                      borderRadius: '12px',
                                      backgroundColor: `${service.color}04`,
                                      border: `1px solid ${service.color}10`,
                                      position: 'relative',
                                      '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '3px',
                                        height: '60%',
                                        borderRadius: '2px',
                                        backgroundColor: service.color,
                                        opacity: 0.6,
                                      }
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: '#333',
                                        fontWeight: 500,
                                        fontSize: '0.9rem',
                                        lineHeight: 1.4,
                                        pl: 1.5
                                      }}
                                    >
                                      {item}
                                    </Typography>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      ) : (
                        // 🖥️ ДЕСКТОПНАЯ ВЕРСИЯ - КАК РАНЬШЕ
                        <Grid container spacing={2}>
                          {service.items.map((item, idx) => (
                            <Grid item xs={12} key={idx}>
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                              >
                                <Box
                                  sx={{
                                    p: 2.5,
                                    borderRadius: '16px',
                                    backgroundColor: `${service.color}04`,
                                    border: `1px solid ${service.color}10`,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&:hover': {
                                      backgroundColor: `${service.color}08`,
                                      transform: 'translateX(8px)',
                                      boxShadow: `0 6px 20px ${service.color}15`
                                    },
                                    '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      left: 0,
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      width: '4px',
                                      height: '60%',
                                      borderRadius: '2px',
                                      backgroundColor: service.color,
                                      opacity: 0.6,
                                      transition: 'opacity 0.3s ease'
                                    },
                                    '&:hover::before': {
                                      opacity: 1
                                    }
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: '#333',
                                      fontWeight: 500,
                                      fontSize: '0.95rem',
                                      lineHeight: 1.5,
                                      pl: 2
                                    }}
                                  >
                                    {item}
                                  </Typography>
                                </Box>
                              </motion.div>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </Box>

                    {/* Stats Badge */}
                    <Box
                      sx={{
                        alignSelf: 'flex-start',
                        position: 'relative',
                        zIndex: 2
                      }}
                    >
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 4,
                          py: 2,
                          borderRadius: '20px',
                          background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}CC 100%)`,
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '1rem',
                          boxShadow: `0 8px 24px ${service.color}40`,
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                            transform: 'translateX(-100%)',
                            transition: 'transform 2s ease',
                          },
                          '&:hover::before': {
                            transform: 'translateX(100%)'
                          }
                        }}
                      >
                        <Typography
                          sx={{
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1rem',
                            position: 'relative',
                            zIndex: 1
                          }}
                        >
                          {service.stats}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
                    </Grid>
          </Box>

          {/* Gamification & Personalization Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Box
              sx={{
                mt: { xs: 8, md: 12 },
                p: { xs: 4, md: 6 },
                borderRadius: '32px',
                background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.04) 0%, rgba(166, 30, 30, 0.02) 100%)',
                border: '1px solid rgba(139, 0, 0, 0.08)',
                textAlign: 'center',
                position: 'relative',
                zIndex: 2,
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 30% 70%, rgba(139, 0, 0, 0.02) 0%, transparent 50%)',
                  zIndex: -1
                }
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontSize: { xs: theme.typography.pxToRem(28), md: theme.typography.pxToRem(36) },
                  fontWeight: 800,
                  mb: 2,
                  color: '#1A1A1A',
                  letterSpacing: '-0.02em'
                }}
              >
                Персонализация и геймификация
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: theme.typography.pxToRem(16), md: theme.typography.pxToRem(18) },
                  color: '#666',
                  mb: 6,
                  maxWidth: '700px',
                  mx: 'auto',
                  lineHeight: 1.6
                }}
              >
                Индивидуальный подход к каждому сотруднику с элементами игры для повышения мотивации и вовлеченности
              </Typography>
              <Grid container spacing={4}>
                {[
                  { name: 'Рекомендации', desc: 'Подбор льгот по интересам', color: '#8B0000' },
                  { name: 'Достижения', desc: 'Награды за активность', color: '#A61E1E' },
                  { name: 'Рейтинги', desc: 'Здоровая конкуренция', color: '#C43D3D' },
                  { name: 'Прогресс', desc: 'Отслеживание результатов', color: '#8B0000' },
                  { name: 'Социальность', desc: 'Общение команды', color: '#A61E1E' },
                  { name: 'Настройки', desc: 'Адаптация под нужды', color: '#C43D3D' }
                ].map((feature, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
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
                          p: { xs: 3, md: 4 },
                          borderRadius: { xs: '16px', md: '20px' },
                          bgcolor: 'white',
                          textAlign: 'center',
                          transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
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
                            height: '4px',
                            background: `linear-gradient(90deg, ${feature.color} 0%, ${feature.color}80 100%)`,
                            opacity: 0,
                            transition: 'opacity 0.3s ease'
                          }
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 700, color: feature.color, mb: 1, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                          {feature.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.5, fontSize: { xs: '0.9rem', md: '0.95rem' } }}>
                          {feature.desc}
                        </Typography>
                      </Box>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </motion.div>

        </motion.div>

        {/* Background Element */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '-20%',
            zIndex: 1,
            display: { xs: 'none', lg: 'block' }
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: theme.typography.pxToRem(380),
              fontWeight: 900,
              color: 'rgba(139, 0, 0, 0.012)',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              transform: 'rotate(-15deg)',
              letterSpacing: '-0.05em'
            }}
          >
            ЛЬГОТЫ·YODDLE
          </Typography>
        </Box>
      </Container>
    </Box>
  );
});

export default Services; 