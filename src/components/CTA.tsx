import { Button, Container, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';
import StarIcon from '@mui/icons-material/Star';

const CTA = () => {
  return (
    <Box
      component={motion.section}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      sx={{
        py: 8,
        backgroundColor: 'primary.main',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
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
            zIndex: 1,
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            sx={{
              mb: 2,
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '3rem' },
            }}
          >
            Готовы начать?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              maxWidth: '600px',
              opacity: 0.9,
            }}
          >
            Присоединяйтесь к тысячам компаний, которые уже используют нашу платформу для роста своего бизнеса
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0,118,255,0.23)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Начать бесплатно
          </Button>
        </Box>
      </Container>
      <Box
        component={motion.div}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.1,
          zIndex: 0,
        }}
      >
        <StarIcon sx={{ fontSize: 300 }} />
      </Box>
    </Box>
  );
};

export default CTA; 