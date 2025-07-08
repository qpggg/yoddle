import React from 'react';
import { Container, Typography, Box, Grid, Button, Tab, Tabs } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import PeopleIcon from '@mui/icons-material/People';
import TimelineIcon from '@mui/icons-material/Timeline';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { Link } from 'react-router-dom';
import { PlayArrow, InfoOutlined } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const About: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fadeInUp = {
    initial: { 
      opacity: 0, 
      y: 20 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8 }
    }
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
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

  const tabContentVariants = {
    hidden: {
      opacity: 0,
      x: -20,
      scale: 0.98
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: {
      opacity: 0,
      x: 20,
      scale: 0.98,
      transition: {
        duration: 0.3
      }
    }
  };

  const stats = [
    { value: '95%', label: 'Автоматизация HR-процессов' },
    { value: '3x', label: 'Рост эффективности команды' },
    { value: '48ч', label: 'Экономия времени в месяц' },
    { value: '89%', label: 'Удовлетворенность сотрудников' }
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
        pb: { xs: theme.spacing(8), md: theme.spacing(12) }
      }}
    >
      {/* Beautiful Background Decorations */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 0, 0, 0.03) 0%, rgba(139, 0, 0, 0.01) 70%, transparent 100%)',
          zIndex: 1,
          display: { xs: 'none', lg: 'block' }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '-15%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 0, 0, 0.02) 0%, transparent 70%)',
          zIndex: 1,
          display: { xs: 'none', lg: 'block' }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          left: '80%',
          zIndex: 1,
          display: { xs: 'none', xl: 'block' }
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: theme.typography.pxToRem(200),
            fontWeight: 900,
            color: 'rgba(139, 0, 0, 0.02)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            transform: 'rotate(15deg)',
            letterSpacing: '-0.1em'
          }}
        >
          SMART
        </Typography>
      </Box>

      <Container maxWidth="lg">
        {/* Hero Section */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
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
              Будущее HR уже{' '}
              <Box component="span" sx={{ color: theme.palette.primary.main }}>
                здесь
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
              Yoddle — это умная платформа нового поколения, которая революционизирует управление корпоративными льготами через автоматизацию, персонализацию и продвинутую аналитику данных
            </Typography>
          </Box>
        </motion.div>

        {/* Stats Section with Beautiful Animations */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Grid container spacing={4} sx={{ mb: 8, position: 'relative', zIndex: 2 }}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <motion.div variants={itemVariants}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      borderRadius: '20px',
                      bgcolor: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-12px)',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
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
                        background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, rgba(139, 0, 0, 0.7) 100%)`,
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                      }
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        fontWeight: 800,
                        color: theme.palette.primary.main,
                        mb: 1,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, rgba(139, 0, 0, 0.8) 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Enhanced Features Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Box sx={{ mb: 8, position: 'relative', zIndex: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              centered
              variant="scrollable"
              scrollButtons={false}
              sx={{
                mb: 4,
                '& .MuiTab-root': {
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                  textTransform: 'none',
                  minWidth: { xs: 'auto', sm: 140 },
                  px: { xs: 3, sm: 4 },
                  py: { xs: 2, sm: 2.5 },
                  minHeight: { xs: '52px', sm: '60px' },
                  flex: { xs: '1 1 auto', sm: 'none' },
                  fontWeight: 600,
                  borderRadius: '16px',
                  mr: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.05) 0%, rgba(139, 0, 0, 0.02) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
                    '&::before': {
                      opacity: 1
                    }
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(139, 0, 0, 0.08)',
                    color: theme.palette.primary.main,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(139, 0, 0, 0.15)'
                  }
                },
                '& .MuiTabs-indicator': {
                  display: 'none'
                }
              }}
            >
              <Tab label="Технологии" />
              <Tab label="Результаты" />
              <Tab label="Внедрение" />
            </Tabs>

            <AnimatePresence mode="wait">
              {tabValue === 0 && (
                <motion.div
                  key="technologies"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 4,
                        borderRadius: '20px',
                        backgroundColor: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        height: '100%',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)'
                        }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Box
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: '18px',
                              backgroundColor: 'rgba(139, 0, 0, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 3
                            }}
                          >
                            <AutoGraphIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                          </Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                            Продвинутая аналитика в реальном времени
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                          Умные алгоритмы анализируют предпочтения сотрудников и предлагают оптимальные пакеты льгот. Live дашборды показывают ROI каждого решения с готовностью к ML-интеграции.
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 4,
                        borderRadius: '20px',
                        backgroundColor: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        height: '100%',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)'
                        }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Box
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: '18px',
                              backgroundColor: 'rgba(139, 0, 0, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 3
                            }}
                          >
                            <PeopleIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                          </Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                            Интеллектуальная персонализация
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                          Продвинутые алгоритмы изучают поведение каждого сотрудника и автоматически предлагают наиболее релевантные льготы. Система работает 24/7 с готовностью к AI-апгрейду.
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </motion.div>
              )}

              {tabValue === 1 && (
                <motion.div
                  key="results"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 4,
                        borderRadius: '20px',
                        backgroundColor: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        height: '100%',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)'
                        }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Box
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: '18px',
                              backgroundColor: 'rgba(139, 0, 0, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 3
                            }}
                          >
                            <TimelineIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                          </Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                            300% рост эффективности HR
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                          Автоматизация рутинных процессов освобождает до 48 часов в месяц. HR-специалисты фокусируются на стратегических задачах, а не на администрировании.
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 4,
                        borderRadius: '20px',
                        backgroundColor: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        height: '100%',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)'
                        }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Box
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: '18px',
                              backgroundColor: 'rgba(139, 0, 0, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 3
                            }}
                          >
                            <WorkspacePremiumIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                          </Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                            Retention Rate 94%
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                          Data-driven подход к льготам снижает текучесть кадров на 67%. Сотрудники получают именно то, что им нужно, когда им это нужно.
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </motion.div>
              )}

              {tabValue === 2 && (
                <motion.div
                  key="implementation"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 4, 
                        borderRadius: '20px', 
                        backgroundColor: 'white', 
                        border: '1px solid rgba(0, 0, 0, 0.08)', 
                        height: '100%',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)'
                        }
                      }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 2 }}>
                          48-часовая интеграция
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                          Полностью готовая к работе система за 2 дня. API-first архитектура интегрируется с любыми HR-системами без технических сложностей.
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 4, 
                        borderRadius: '20px', 
                        backgroundColor: 'white', 
                        border: '1px solid rgba(0, 0, 0, 0.08)', 
                        height: '100%',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)'
                        }
                      }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 2 }}>
                          24/7 поддержка и консультации
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                          Профессиональная поддержка решает большинство вопросов автоматически. Для сложных случаев — команда экспертов с SLA 15 минут.
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </motion.div>

        {/* Modern CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Box
            sx={{
              position: 'relative',
              textAlign: 'center',
              p: { xs: 6, md: 10 },
              my: { xs: 6, md: 10 },
              mx: { xs: 2, md: 4 },
              borderRadius: '40px',
              background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.95) 0%, rgba(139, 0, 0, 0.8) 100%)',
              backdropFilter: 'blur(10px)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(139, 0, 0, 0.15)',
              isolation: 'isolate',
              zIndex: 2,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%)',
                zIndex: 1
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Typography 
                variant="h2" 
                fontWeight={800} 
                mb={3}
                sx={{ 
                  color: 'white',
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                  position: 'relative',
                  zIndex: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}
              >
                Готовы к трансформации?
              </Typography>
              <Typography 
                variant="h6" 
                mb={6}
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  maxWidth: '800px', 
                  mx: 'auto',
                  position: 'relative',
                  zIndex: 2,
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.35rem' },
                  lineHeight: 1.6,
                  fontWeight: 400,
                  letterSpacing: '0.01em'
                }}
              >
                Станьте частью HR-революции. 500+ компаний уже используют Yoddle для автоматизации управления льготами
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: { xs: 2, md: 4 }, 
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  position: 'relative',
                  zIndex: 2,
                  minHeight: { xs: '60px', md: '70px' },
                  '& > *': {
                    flex: '0 0 auto'
                  }
                }}
              >
                <motion.div
                  style={{ 
                    position: 'relative',
                    transformOrigin: 'center',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    mass: 0.5
                  }}
                >
                  <Button
                    component={Link}
                    to="/#cta"
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrow sx={{ fontSize: '1.5rem' }} />}
                    sx={{
                      position: 'relative',
                      height: { xs: '52px', md: '60px' },
                      bgcolor: 'white',
                      color: '#8B0000',
                      px: { xs: 4, md: 6 },
                      py: { xs: 2, md: 2.5 },
                      fontSize: { xs: '1.1rem', md: '1.2rem' },
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: 'translateZ(0)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.95)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    Запросить демо
                  </Button>
                </motion.div>
                <motion.div
                  style={{ 
                    position: 'relative',
                    transformOrigin: 'center',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    mass: 0.5
                  }}
                >
                  <Button
                    component={Link}
                    to="/benefits"
                    variant="outlined"
                    size="large"
                    startIcon={<InfoOutlined sx={{ fontSize: '1.5rem' }} />}
                    sx={{
                      position: 'relative',
                      height: { xs: '52px', md: '60px' },
                      borderColor: 'rgba(255,255,255,0.6)',
                      color: 'white',
                      px: { xs: 4, md: 6 },
                      py: { xs: 2, md: 2.5 },
                      fontSize: { xs: '1.1rem', md: '1.2rem' },
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: '16px',
                      borderWidth: '2px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: 'translateZ(0)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backdropFilter: 'blur(8px)',
                        borderRadius: 'inherit',
                        zIndex: -1
                      },
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    Узнать больше
                  </Button>
                </motion.div>
              </Box>
            </motion.div>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default About; 