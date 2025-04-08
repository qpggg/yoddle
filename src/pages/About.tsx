import React from 'react';
import { Container, Typography, Box, Grid, Button, Tab, Tabs } from '@mui/material';
import { motion } from 'framer-motion';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import PeopleIcon from '@mui/icons-material/People';
import TimelineIcon from '@mui/icons-material/Timeline';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { Link } from 'react-router-dom';
import { PlayArrow, InfoOutlined } from '@mui/icons-material';

const About: React.FC = () => {
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

  const stats = [
    { value: '87%', label: 'Рост вовлеченности' },
    { value: '35%', label: 'Снижение текучести' },
    { value: '92%', label: 'Довольных клиентов' },
    { value: '2.5x', label: 'ROI для бизнеса' }
  ];

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
        {/* Hero Section */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 700,
                mb: 3,
                color: '#8B0000'
              }}
            >
              О платформе Yoddle
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                maxWidth: '800px',
                mx: 'auto',
                mb: 4,
                color: 'text.secondary'
              }}
            >
              Инновационное решение для управления льготами сотрудников, которое помогает компаниям повысить лояльность персонала и оптимизировать HR-процессы
            </Typography>
          </Box>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Grid container spacing={4} sx={{ mb: 8 }}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 2,
                    bgcolor: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontSize: { xs: '2rem', md: '2.5rem' },
                      fontWeight: 700,
                      color: '#8B0000',
                      mb: 1
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Features Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Box sx={{ mb: 8 }}>
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
                  minWidth: { xs: 'auto', sm: 120 },
                  px: { xs: 2, sm: 3 },
                  minHeight: { xs: '48px', sm: '56px' },
                  flex: { xs: '1 1 auto', sm: 'none' },
                  fontWeight: 500
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#8B0000',
                  height: '3px'
                }
              }}
            >
              <Tab label="Возможности" />
              <Tab label="Преимущества" />
              <Tab label="Внедрение" />
            </Tabs>

            {tabValue === 0 && (
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AutoGraphIcon sx={{ fontSize: 40, color: '#8B0000', mr: 2 }} />
                      <Typography variant="h5" fontWeight={600}>
                        Аналитика и отчетность
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                      Получайте детальную аналитику по использованию льгот, уровню вовлеченности сотрудников и эффективности программ мотивации.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PeopleIcon sx={{ fontSize: 40, color: '#8B0000', mr: 2 }} />
                      <Typography variant="h5" fontWeight={600}>
                        Персонализация льгот
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                      Создавайте индивидуальные пакеты льгот для разных категорий сотрудников с учетом их потребностей и предпочтений.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}

            {tabValue === 1 && (
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TimelineIcon sx={{ fontSize: 40, color: '#8B0000', mr: 2 }} />
                      <Typography variant="h5" fontWeight={600}>
                        Повышение эффективности
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                      Автоматизация процессов управления льготами экономит время HR-специалистов и повышает эффективность работы.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <WorkspacePremiumIcon sx={{ fontSize: 40, color: '#8B0000', mr: 2 }} />
                      <Typography variant="h5" fontWeight={600}>
                        Удержание талантов
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                      Персонализированный подход к льготам помогает удерживать ценных сотрудников и привлекать новые таланты.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}

            {tabValue === 2 && (
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h5" fontWeight={600} mb={2}>
                      Простая интеграция
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Быстрое внедрение платформы без необходимости длительной настройки и обучения персонала.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h5" fontWeight={600} mb={2}>
                      Техническая поддержка
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Круглосуточная поддержка и помощь в настройке системы под ваши потребности.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
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
                Готовы начать?
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
                Присоединяйтесь к компаниям, которые уже оптимизировали
                управление льготами с помощью Yoddle
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