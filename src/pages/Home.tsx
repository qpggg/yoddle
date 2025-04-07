import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const Home: React.FC = () => {
  const theme = useTheme();

  return (
    <Box component="main">
      <Box
        component="section"
        sx={{
            position: 'relative',
            overflow: 'hidden',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
          pt: { xs: theme.spacing(10), md: theme.spacing(15) },
          pb: { xs: theme.spacing(8), md: theme.spacing(15) },
          minHeight: { xs: 'calc(100vh - 64px)', md: '100vh' }
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
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
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    boxShadow: '0 6px 8px rgba(139, 0, 0, 0.3)',
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

                  <Box
                    sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              display: { xs: 'none', md: 'block' }
                    }}
                  >
                    <Typography
              variant="h1"
                      sx={{
                fontSize: theme.typography.pxToRem(400),
                fontWeight: 800,
                color: 'rgba(139, 0, 0, 0.03)',
                whiteSpace: 'nowrap',
                userSelect: 'none'
              }}
            >
              YODDLE
            </Typography>
          </Box>
        </Container>
              </Box>
            </Box>
  );
};

export default Home; 