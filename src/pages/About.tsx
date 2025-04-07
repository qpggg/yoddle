import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';

const About: React.FC = () => {
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            py: { xs: 4, md: 8 }
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
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 700,
                mb: 3
              }}
            >
              О платформе
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                maxWidth: '800px',
                mb: 4
              }}
            >
              Yoddle — это инновационная платформа для управления льготами сотрудников, которая помогает компаниям повысить лояльность персонала и оптимизировать процессы HR-администрирования.
            </Typography>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

export default About; 