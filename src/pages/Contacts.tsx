import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, Grid, Paper, Snackbar, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { useSearchParams } from 'react-router-dom';
import { User, UserCheck } from 'lucide-react';

// Примеры других доступных иконок для контактов:
// import { 
//   Phone, PhoneCall, Mail, MailOpen, MapPin, Globe, 
//   Building, Building2, Briefcase, Calendar, Clock,
//   Linkedin, Twitter, Facebook, Instagram, Github,
//   MessageCircle, Send, ExternalLink, Share2, Users,
//   UserPlus, UserMinus, Crown, Shield, Award, Star
// } from 'lucide-react';

const Contacts: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Автозаполнение поля message при наличии параметра plan в URL
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam) {
      setFormData(prev => ({
        ...prev,
        message: `Выбран план: ${planParam}`
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.',
          severity: 'success'
        });
        
        setFormData({ name: '', email: '', company: '', message: '' });
      } else {
        throw new Error(data.error || 'Ошибка сервера');
      }
    } catch (error) {
      console.error('Ошибка отправки формы:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Произошла ошибка при отправке. Попробуйте еще раз.',
        severity: 'error'
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
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

  const floatingVariants = {
    animate: {
      y: [0, -8, 0],
      rotate: [0, 3, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const contactInfo = [
    {
      icon: User,
      title: 'Михаил Полшков',
      value: '+7 915 876 34 58',
      description: 'Founder & CEO',
      color: '#8B0000'
    },
    {
      icon: UserCheck,
      title: 'Леонид Чумаков',
      value: '+7 906 419 46 44',
      description: 'Co-Founder & CMO',
      color: '#FF6B35'
    }
  ];

  // Примеры других вариантов contactInfo с разными иконками:
  // const contactInfoExtended = [
  //   { icon: Phone, title: 'Телефон', value: '+7 915 876 34 58', description: 'Основной номер', color: '#8B0000' },
  //   { icon: Mail, title: 'Email', value: 'info@yoddle.ru', description: 'Общие вопросы', color: '#0066CC' },
  //   { icon: MapPin, title: 'Адрес', value: 'Москва, Россия', description: 'Офис', color: '#28A745' },
  //   { icon: Globe, title: 'Сайт', value: 'www.yoddle.ru', description: 'Официальный сайт', color: '#17A2B8' },
  //   { icon: Building, title: 'Офис', value: 'БЦ Технопарк', description: 'Головной офис', color: '#6C757D' },
  //   { icon: Calendar, title: 'Режим работы', value: 'Пн-Пт 9:00-18:00', description: 'Московское время', color: '#FFC107' },
  //   { icon: Crown, title: 'CEO', value: 'Михаил Полшков', description: 'Руководитель', color: '#8B0000' },
  //   { icon: Shield, title: 'CTO', value: 'Иван Иванов', description: 'Технический директор', color: '#6F42C1' },
  //   { icon: Award, title: 'CMO', value: 'Леонид Чумаков', description: 'Маркетинг', color: '#FF6B35' },
  //   { icon: MessageCircle, title: 'Поддержка', value: 'support@yoddle.ru', description: 'Техподдержка', color: '#20C997' },
  //   { icon: Linkedin, title: 'LinkedIn', value: '/company/yoddle', description: 'Корпоративная страница', color: '#0077B5' },
  //   { icon: Github, title: 'GitHub', value: '/yoddle-team', description: 'Открытый код', color: '#333' }
  // ];

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
      {/* Enhanced Background Decorations */}
      <Box
        sx={{
          position: 'absolute',
          top: '5%',
          right: '-15%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 0, 0, 0.02) 0%, rgba(139, 0, 0, 0.005) 50%, transparent 100%)',
          zIndex: 1,
          display: { xs: 'none', lg: 'block' }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '-20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(76, 236, 196, 0.015) 0%, transparent 70%)',
          zIndex: 1,
          display: { xs: 'none', lg: 'block' }
        }}
      />
      
      {/* Floating Elements */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{
          position: 'absolute',
          top: '30%',
          left: '5%',
          zIndex: 1
        }}
      >
        <Box
          sx={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.08) 0%, rgba(139, 0, 0, 0.03) 100%)',
            display: { xs: 'none', xl: 'block' }
          }}
        />
      </motion.div>
      
      <motion.div
        variants={{
          animate: {
            y: [0, 12, 0],
            x: [0, -3, 0],
            transition: {
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }
        }}
        animate="animate"
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '8%',
          zIndex: 1
        }}
      >
        <Box
          sx={{
            width: '45px',
            height: '45px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.04) 100%)',
            display: { xs: 'none', xl: 'block' }
          }}
        />
      </motion.div>

      {/* Background Text */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          right: '-10%',
          zIndex: 1,
          display: { xs: 'none', lg: 'block' }
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: theme.typography.pxToRem(280),
            fontWeight: 900,
            color: 'rgba(139, 0, 0, 0.015)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            transform: 'rotate(-15deg)',
            letterSpacing: '-0.02em'
          }}
        >
          CONNECT
        </Typography>
      </Box>

      <Container maxWidth="lg">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box
            sx={{
              textAlign: 'center',
              mb: { xs: 6, md: 8 },
              position: 'relative',
              zIndex: 2
            }}
          >
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
              Свяжитесь с{' '}
              <Box component="span" sx={{ color: theme.palette.primary.main }}>
                командой Yoddle
              </Box>
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: theme.typography.pxToRem(18), md: theme.typography.pxToRem(22) },
                fontWeight: 400,
                color: '#666',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Готовы обсудить, как Yoddle поможет вашей компании? 
              Оставьте заявку, и мы свяжемся с вами в течение часа
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={6} sx={{ position: 'relative', zIndex: 2 }}>
          {/* Контактная информация */}
          <Grid item xs={12} lg={5}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 4,
                  color: '#1A1A1A'
                }}
              >
                Контактная информация
              </Typography>
              
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <Grid container spacing={3}>
                  {contactInfo.map((item, index) => (
                    <Grid item xs={12} sm={6} lg={12} key={index}>
                      <motion.div variants={itemVariants}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            borderRadius: '20px',
                            backgroundColor: 'white',
                            border: '1px solid rgba(0, 0, 0, 0.06)',
                            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                              transform: 'translateY(-6px)',
                              boxShadow: '0 15px 50px rgba(0, 0, 0, 0.12)',
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
                              height: '3px',
                              background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}80 100%)`,
                              opacity: 0,
                              transition: 'opacity 0.3s ease'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box
                              sx={{
                                width: 52,
                                height: 52,
                                borderRadius: '14px',
                                backgroundColor: `${item.color}10`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'scale(1.1) rotate(5deg)'
                                }
                              }}
                            >
                              <item.icon size={26} color={item.color} />
                            </Box>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, color: '#1A1A1A' }}
                            >
                              {item.title}
                            </Typography>
                          </Box>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: item.color,
                              mb: 0.5,
                              fontSize: '1.1rem'
                            }}
                          >
                            {item.value}
                          </Typography>
                          <Typography
                            sx={{
                              color: '#666',
                              fontSize: '0.95rem',
                              lineHeight: 1.5
                            }}
                          >
                            {item.description}
                          </Typography>
                        </Paper>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            </motion.div>
          </Grid>

          {/* Форма обратной связи */}
          <Grid item xs={12} lg={7}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 4, md: 6 },
                  borderRadius: '32px',
                  backgroundColor: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 80% 20%, rgba(139, 0, 0, 0.01) 0%, transparent 50%)',
                    zIndex: 0
                  }
                }}
              >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 3,
                      color: '#1A1A1A'
                    }}
                  >
                    Оставить заявку
                  </Typography>
                  
                  <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Ваше имя"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          variant="outlined"
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '16px',
                              backgroundColor: 'rgba(139, 0, 0, 0.02)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: 'rgba(139, 0, 0, 0.03)',
                                '& fieldset': {
                                  borderColor: theme.palette.primary.main,
                                }
                              },
                              '&.Mui-focused': {
                                backgroundColor: 'rgba(139, 0, 0, 0.04)',
                                '& fieldset': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: '2px'
                                }
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          variant="outlined"
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '16px',
                              backgroundColor: 'rgba(139, 0, 0, 0.02)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: 'rgba(139, 0, 0, 0.03)',
                                '& fieldset': {
                                  borderColor: theme.palette.primary.main,
                                }
                              },
                              '&.Mui-focused': {
                                backgroundColor: 'rgba(139, 0, 0, 0.04)',
                                '& fieldset': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: '2px'
                                }
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Компания"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '16px',
                              backgroundColor: 'rgba(139, 0, 0, 0.02)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: 'rgba(139, 0, 0, 0.03)',
                                '& fieldset': {
                                  borderColor: theme.palette.primary.main,
                                }
                              },
                              '&.Mui-focused': {
                                backgroundColor: 'rgba(139, 0, 0, 0.04)',
                                '& fieldset': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: '2px'
                                }
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Расскажите о ваших потребностях"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          variant="outlined"
                          multiline
                          rows={4}
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '16px',
                              backgroundColor: 'rgba(139, 0, 0, 0.02)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: 'rgba(139, 0, 0, 0.03)',
                                '& fieldset': {
                                  borderColor: theme.palette.primary.main,
                                }
                              },
                              '&.Mui-focused': {
                                backgroundColor: 'rgba(139, 0, 0, 0.04)',
                                '& fieldset': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: '2px'
                                }
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{
                              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                              color: '#fff',
                              py: 2.5,
                              fontSize: '1.1rem',
                              fontWeight: 600,
                              borderRadius: '16px',
                              textTransform: 'none',
                              boxShadow: '0 6px 20px rgba(139, 0, 0, 0.25)',
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
                                transition: 'transform 0.6s ease',
                              },
                              '&:hover': {
                                boxShadow: '0 10px 30px rgba(139, 0, 0, 0.35)',
                                '&::before': {
                                  transform: 'translateX(100%)'
                                }
                              }
                            }}
                          >
                            Отправить заявку
                          </Button>
                        </motion.div>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Contacts; 