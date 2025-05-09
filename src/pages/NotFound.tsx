import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 8
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '6rem', md: '8rem' },
              fontWeight: 700,
              color: '#8B0000',
              mb: 2
            }}
          >
            404
          </Typography>
          <Typography
            variant="h4"
            sx={{
              mb: 4,
              color: 'rgba(0, 0, 0, 0.87)',
              fontWeight: 500
            }}
          >
            Страница не найдена
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 6,
              color: 'rgba(0, 0, 0, 0.6)',
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Извините, запрашиваемая страница не существует или была перемещена.
          </Typography>
          <Button
            component={Link}
            to="/"
            variant="contained"
            sx={{
              backgroundColor: '#8B0000',
              color: '#fff',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                backgroundColor: '#6B0000'
              }
            }}
          >
            Вернуться на главную
          </Button>
        </motion.div>
      </Box>
    </Container>
  );
};

export default NotFound; 