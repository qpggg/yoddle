import { Box, Container, Typography, TextField, Button } from '@mui/material';
import { motion } from 'framer-motion';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export const Contact = () => {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Декоративный элемент */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(117, 0, 0, 0.1), transparent)',
        }}
      />

      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h2"
            align="center"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 2,
              color: '#2C3E50',
            }}
          >
            Свяжитесь с нами
          </Typography>

          <Typography
            align="center"
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              color: '#6C757D',
              mb: { xs: 6, md: 8 },
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Остались вопросы? Заполните форму, и мы свяжемся с вами в ближайшее время.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 4, md: 8 },
              alignItems: 'start',
            }}
          >
            {/* Форма */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Box
                component="form"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <TextField
                  label="Имя"
                  required
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#F8F9FA',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(117, 0, 0, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#750000',
                      },
                    },
                  }}
                />
                <TextField
                  label="Email"
                  required
                  fullWidth
                  type="email"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#F8F9FA',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(117, 0, 0, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#750000',
                      },
                    },
                  }}
                />
                <TextField
                  label="Сообщение"
                  required
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#F8F9FA',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(117, 0, 0, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#750000',
                      },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    py: 2,
                    px: 4,
                    backgroundColor: '#750000',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 8px 24px rgba(117, 0, 0, 0.15)',
                    '&:hover': {
                      backgroundColor: '#600000',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 32px rgba(117, 0, 0, 0.2)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Отправить
                </Button>
              </Box>
            </motion.div>

            {/* Контактная информация */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Box
                sx={{
                  backgroundColor: '#F8F9FA',
                  borderRadius: '24px',
                  p: { xs: 4, md: 5 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontSize: { xs: '1.5rem', md: '1.75rem' },
                      fontWeight: 700,
                      color: '#2C3E50',
                      mb: 3,
                    }}
                  >
                    Контактная информация
                  </Typography>

                  <Typography
                    sx={{
                      color: '#6C757D',
                      fontSize: '1rem',
                    }}
                  >
                    Есть вопросы? Мы всегда рады помочь вам выбрать оптимальное решение для вашей компании.
                  </Typography>
                </Box>

                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 3,
                    mt: 5
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        backgroundColor: 'rgba(117, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <EmailIcon sx={{ color: '#750000' }} />
                    </Box>
                    <Typography
                      component="a"
                      href="mailto:info@yoddle.ru"
                      sx={{
                        color: '#2C3E50',
                        textDecoration: 'none',
                        '&:hover': {
                          color: '#750000',
                        },
                        transition: 'color 0.2s ease',
                      }}
                    >
                      info@yoddle.ru
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        backgroundColor: 'rgba(117, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PhoneIcon sx={{ color: '#750000' }} />
                    </Box>
                    <Typography
                      component="a"
                      href="tel:+74951234567"
                      sx={{
                        color: '#2C3E50',
                        textDecoration: 'none',
                        '&:hover': {
                          color: '#750000',
                        },
                        transition: 'color 0.2s ease',
                      }}
                    >
                      +7 (495) 123-45-67
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        backgroundColor: 'rgba(117, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LocationOnIcon sx={{ color: '#750000' }} />
                    </Box>
                    <Typography sx={{ color: '#2C3E50' }}>
                      Москва, ул. Тверская, д. 1
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}; 