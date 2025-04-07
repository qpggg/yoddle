import React from 'react';
import { Container, Typography, Box, TextField, Button, Grid } from '@mui/material';
import { motion } from 'framer-motion';

const Contacts: React.FC = () => {
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
              Контакты
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                maxWidth: '800px',
                mb: 6
              }}
            >
              Свяжитесь с нами, чтобы узнать больше о возможностях платформы Yoddle
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Box
              component="form"
              sx={{
                maxWidth: '600px',
                mx: 'auto',
                p: 4,
                borderRadius: 2,
                bgcolor: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Имя"
                    variant="outlined"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    variant="outlined"
                    type="email"
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Компания"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Сообщение"
                    variant="outlined"
                    multiline
                    rows={4}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                      backgroundColor: '#8B0000',
                      color: '#fff',
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: '#6B0000'
                      }
                    }}
                  >
                    Отправить
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

export default Contacts; 