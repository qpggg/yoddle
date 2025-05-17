import { Box, Button, Container, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { useEffect } from 'react'

export const Hero = () => {
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      const offset = -70;
      const targetPosition = contactSection.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Функция для обработки хэша в URL
    const handleHashChange = () => {
      if (window.location.hash === '#contact') {
        scrollToContact();
      }
    };

    // Проверяем хэш при загрузке
    handleHashChange();

    // Добавляем слушатель изменения хэша
    window.addEventListener('hashchange', handleHashChange);

    // Очистка слушателя при размонтировании
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        py: { xs: 4, md: 6 },
        backgroundColor: '#F8F9FA',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Background Text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.03, scale: 1 }}
        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Typography
          sx={{
            position: 'absolute',
            right: '10%',
            top: '35%',
            fontSize: { xs: '6rem', md: '14rem' },
            fontWeight: 700,
            color: 'rgba(117, 0, 0, 1)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            lineHeight: 0.7,
            letterSpacing: '-0.02em',
            zIndex: 0,
            fontFamily: '"Inter", sans-serif',
            transform: 'translateY(-50%) rotate(-2deg)',
          }}
        >
          YODDLE
        </Typography>
      </motion.div>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Typography
              variant="h1"
              sx={{
                mb: 1,
                color: '#2C3E50',
                fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                fontWeight: 700,
              }}
            >
              Yoddle —
            </Typography>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Typography
              variant="h1"
              sx={{
                mb: 3,
                color: '#2C3E50',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
                lineHeight: { xs: 1.3, md: 1.2 },
              }}
            >
              <Box 
                component="span" 
                sx={{ 
                  color: '#750000',
                  position: 'relative',
                  fontSize: { xs: '2rem', sm: '2.75rem', md: '3.75rem' },
                  display: 'block',
                  mb: { xs: 2, sm: 3 },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '4px',
                    left: 0,
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'rgba(117, 0, 0, 0.1)',
                    zIndex: -1,
                  }
                }}
              >
                персонализированные
              </Box>
              <Box 
                component="span" 
                sx={{ 
                  display: 'block',
                  mb: { xs: 2, sm: 3 },
                }}
              >
                льготы для вашего
              </Box>
              <Box 
                component="span" 
                sx={{ 
                  display: 'block',
                }}
              >
                бизнеса
              </Box>
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Typography
              variant="body1"
              sx={{
                mb: 5,
                maxWidth: '600px',
                position: 'relative',
                paddingTop: '24px',
                color: '#6C757D',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '40px',
                  height: '3px',
                  backgroundColor: '#750000',
                }
              }}
            >
              Автоматизация управления льготами,{' '}
              <Box 
                component="span" 
                sx={{ 
                  color: '#2C3E50',
                  fontWeight: 500,
                }}
              >
                повышение лояльности
              </Box>
              {' '}сотрудников и{' '}
              <Box 
                component="span" 
                sx={{ 
                  color: '#2C3E50',
                  fontWeight: 500,
                }}
              >
                снижение текучки
              </Box>
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={scrollToContact}
              sx={{
                py: { xs: 1.5, md: 2 },
                px: { xs: 4, md: 6 },
                backgroundColor: '#750000',
                fontSize: { xs: '1rem', md: '1.125rem' },
                fontWeight: 600,
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(117, 0, 0, 0.15)',
                transition: 'all 0.3s ease',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#600000',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 32px rgba(117, 0, 0, 0.2)',
                },
              }}
            >
              Попробовать бесплатно
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Box
              sx={{
                mt: { xs: 8, md: 10 },
                display: 'flex',
                gap: { xs: 4, md: 0 },
                position: 'relative',
                width: '100%',
                maxWidth: '900px',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'space-between',
                  mb: { xs: 4, md: 0 },
                }}
              >
                {[
                  { value: '100%', label: 'Автоматизация' },
                  { value: '24/7', label: 'Поддержка' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.5,
                      delay: 1.2 + index * 0.2,
                      type: 'spring',
                      stiffness: 100
                    }}
                  >
                    <Box sx={{ 
                      textAlign: 'center',
                      width: { xs: '140px', md: '200px' },
                    }}>
                      <Typography
                        variant="h2"
                        sx={{
                          fontSize: { xs: '2.5rem', md: '3.5rem' },
                          fontWeight: 700,
                          color: '#750000',
                          lineHeight: 1,
                          mb: 2,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#6C757D',
                          fontSize: { xs: '1rem', md: '1.125rem' },
                          fontWeight: 500,
                          letterSpacing: '0.5px',
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  </motion.div>
                ))}
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bottom: { xs: '-60px', md: 0 },
                  width: { xs: '140px', md: '200px' },
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.5,
                    delay: 1.6,
                    type: 'spring',
                    stiffness: 100
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontSize: { xs: '2.5rem', md: '3.5rem' },
                        fontWeight: 700,
                        color: '#750000',
                        lineHeight: 1,
                        mb: 2,
                      }}
                    >
                      +45%
                    </Typography>
                    <Typography
                      sx={{
                        color: '#6C757D',
                        fontSize: { xs: '1rem', md: '1.125rem' },
                        fontWeight: 500,
                        letterSpacing: '0.5px',
                      }}
                    >
                      Лояльность
                    </Typography>
                  </Box>
                </motion.div>
              </Box>
            </Box>
          </motion.div>
        </Box>
      </Container>
    </Box>
  )
} 