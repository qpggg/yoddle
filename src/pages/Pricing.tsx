import { Box, Container, Typography, Card, CardContent, CardHeader, Button, List, ListItem, ListItemIcon, ListItemText, Grid, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BusinessIcon from '@mui/icons-material/Business';
import GroupIcon from '@mui/icons-material/Group';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SupportIcon from '@mui/icons-material/Support';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CampaignIcon from '@mui/icons-material/Campaign';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import BrushIcon from '@mui/icons-material/Brush';
import { styled } from '@mui/system';

// Updated color palette with brand colors and tariff-specific colors
const colors = {
  primary: {
    light: '#FFE5E5',
    main: '#8B0000',
    dark: '#660000'
  },
  tariffs: {
    economy: {
      light: '#FFE5E5',
      main: '#B22222',
      dark: '#8B0000'
    },
    comfort: {
      light: '#FFE8E8',
      main: '#8B0000',
      dark: '#660000'
    },
    premium: {
      light: '#E8E0E0',
      main: '#660000',
      dark: '#4B0000'
    }
  },
  secondary: {
    light: '#F5F5F5',
    main: '#E0E0E0',
    dark: '#BDBDBD'
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    light: '#FFFFFF'
  },
  background: '#FFFFFF',
  section: '#FBF7F7'
};

const StyledCard = styled(Card)(({ className }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  borderRadius: '24px',
  overflow: 'visible',
  position: 'relative',
  backgroundColor: colors.background,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  ...(className === 'economy' && {
    '& .MuiCardHeader-root': {
      background: `linear-gradient(135deg, ${colors.tariffs.economy.main} 0%, ${colors.tariffs.economy.dark} 100%)`
    },
    '&:hover': {
      transform: 'translateY(-12px)',
      boxShadow: '0 30px 60px rgba(178, 34, 34, 0.12)',
      '& .MuiCardHeader-root': {
        transform: 'scale(1.02)',
      }
    }
  }),
  ...(className === 'comfort' && {
    '& .MuiCardHeader-root': {
      background: `linear-gradient(135deg, ${colors.tariffs.comfort.main} 0%, ${colors.tariffs.comfort.dark} 100%)`
    },
    '&:hover': {
      transform: 'translateY(-12px)',
      boxShadow: '0 30px 60px rgba(139, 0, 0, 0.15)',
      '& .MuiCardHeader-root': {
        transform: 'scale(1.02)',
      }
    }
  }),
  ...(className === 'premium' && {
    '& .MuiCardHeader-root': {
      background: `linear-gradient(135deg, ${colors.tariffs.premium.main} 0%, ${colors.tariffs.premium.dark} 100%)`
    },
    '&:hover': {
      transform: 'translateY(-12px)',
      boxShadow: '0 30px 60px rgba(102, 0, 0, 0.18)',
      '& .MuiCardHeader-root': {
        transform: 'scale(1.02)',
      }
    }
  }),
  '& .MuiButton-root': {
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'scale(1.05) translateY(-2px)',
      boxShadow: '0 8px 20px rgba(139, 0, 0, 0.2)',
    }
  }
}));

const PlanHeader = styled(CardHeader)(() => ({
  textAlign: 'center',
  color: colors.text.light,
  borderRadius: '24px 24px 0 0',
  padding: '2.5rem 1.5rem',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  marginBottom: '1rem',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)',
    opacity: 0,
    transition: 'opacity 0.4s ease',
  },
  '&:hover::before': {
    opacity: 1
  }
}));

const PriceTypography = styled(Typography)({
  fontSize: '2.5rem',
  fontWeight: '700',
  marginBottom: '0.5rem',
  textAlign: 'center',
  color: colors.primary.main
});

const FeatureIcon = styled(Box)({
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1rem',
  backgroundColor: colors.primary.light,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1)',
    backgroundColor: colors.primary.main,
    '& svg': {
      color: colors.text.light
    }
  },
  '& svg': {
    color: colors.primary.main,
    fontSize: '24px'
  }
});

const subscriptionPlans = [
  {
    title: 'Демо',
    price: 'Бесплатно',
    description: 'Идеально для тестирования платформы',
    features: [
      'Две услуги для руководителей на выбор',
      'Ежемесячный отчет по использованию',
      'Базовая техническая поддержка в рабочее время',
      'Простая аналитика использования'
    ],
    savings: 'Оценка нашей компетенции и уникальности',
    className: 'economy'
  },
  {
    title: 'Стандарт',
    price: '9500₽',
    description: 'Оптимально для растущих компаний',
    features: [
      'Полный доступ ко всем блокам',
      'Увеличенные скидки для сотрудников до 20%',
      'Еженедельная расширенная аналитика',
      'Приоритетная поддержка',
      'Доступ к эксклюзивным акциям',
      'Интеграция с HR системами'
    ],
    savings: 'Лояльность сотрудников, удобство для HR-отдела',
    className: 'comfort',
    popular: true
  },
  {
    title: 'Расширенный',
    price: 'Индивидуально',
    description: 'Максимум возможностей для крупного бизнеса',
    features: [
      'Бенефиты и плюшки сверх стандартного пакета',
      'Максимальные скидки до 30% и кэшбэк',
      'Ежедневная аналитика в реальном времени',
      'VIP поддержка 24/7 с персональным менеджером',
      'Эксклюзивные бизнес-тренинги',
      'Расширенная интеграция и API доступ',
      'Брендирование личного кабинета'
    ],
    savings: 'Мощная команда, готовая свернуть горы',
    className: 'premium'
  }
];

const benefits = [
  {
    title: 'Для работодателей',
    icon: <BusinessIcon sx={{ fontSize: 40 }} />,
    color: '#8B0000',
    items: [
      'Повышение лояльности сотрудников',
      'Оптимизация расходов на персонал',
      'Автоматизация процессов',
      'Аналитика и отчетность'
    ]
  },
  {
    title: 'Для сотрудников',
    icon: <GroupIcon sx={{ fontSize: 40 }} />,
    color: '#8B0000',
    items: [
      'Существенная экономия на покупках',
      'Доступ к эксклюзивным предложениям',
      'Удобный личный кабинет',
      'Программы обучения и развития'
    ]
  }
];

const features = [
  {
    icon: <AnalyticsIcon />,
    title: 'Аналитика',
    description: 'Детальные отчеты и статистика использования'
  },
  {
    icon: <LocalOfferIcon />,
    title: 'Скидки',
    description: 'Эксклюзивные предложения от партнеров'
  },
  {
    icon: <SupportIcon />,
    title: 'Поддержка',
    description: 'Профессиональная помощь команды'
  },
  {
    icon: <SchoolIcon />,
    title: 'Обучение',
    description: 'Доступ к образовательным материалам'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

const BenefitIcon = styled(Box)({
  width: '64px',
  height: '64px',
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1.5rem',
  background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 8px 24px rgba(139, 0, 0, 0.15)',
  '&:hover': {
    transform: 'translateY(-5px) rotate(5deg)',
    boxShadow: '0 12px 30px rgba(139, 0, 0, 0.25)',
  },
  '& svg': {
    color: colors.text.light,
    fontSize: '32px',
    transition: 'all 0.4s ease',
  }
});

const BenefitCard = styled(Paper)({
  padding: '2rem',
  height: '100%',
  backgroundColor: colors.background,
  borderRadius: '24px',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
    opacity: 0,
    transition: 'all 0.4s ease',
  },
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(139, 0, 0, 0.1)',
    '&::before': {
      opacity: 1,
    },
    '& .MuiListItem-root': {
      transform: 'translateX(8px)',
    }
  }
});

const getFeatureIcon = (feature: string) => {
  if (feature.includes('партнер')) return <PeopleIcon />;
  if (feature.includes('скидк')) return <LocalOfferIcon />;
  if (feature.includes('аналитик')) return <BarChartIcon />;
  if (feature.includes('поддержка')) return <SupportAgentIcon />;
  if (feature.includes('отчет')) return <AnalyticsIcon />;
  if (feature.includes('акци')) return <CampaignIcon />;
  if (feature.includes('интеграци')) return <IntegrationInstructionsIcon />;
  if (feature.includes('тренинг')) return <SchoolIcon />;
  if (feature.includes('брендирование')) return <BrushIcon />;
  if (feature.includes('время')) return <AccessTimeIcon />;
  return <CheckCircleIcon />;
};

const PricingPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <motion.div variants={itemVariants}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                color: colors.primary.main,
                mb: 2
              }}
            >
              Выберите оптимальный тариф
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                maxWidth: '800px', 
                mx: 'auto', 
                mb: 6,
                color: colors.text.secondary,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                lineHeight: 1.6
              }}
            >
              Каждый тариф создан с учетом потребностей вашего бизнеса. 
              Начните экономить уже сегодня!
            </Typography>
          </motion.div>

          <Grid container spacing={4} sx={{ mb: 8 }}>
            {features.map((feature, _index) => (
              <Grid item xs={12} sm={6} md={3} key={feature.title}>
                <motion.div variants={itemVariants}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      height: '100%',
                      backgroundColor: colors.background,
                      borderRadius: '16px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 30px rgba(139, 0, 0, 0.06)'
                      }
                    }}
                  >
                    <FeatureIcon>
                      {feature.icon}
                    </FeatureIcon>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        color: colors.text.primary,
                        fontSize: '1.1rem'
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: colors.text.secondary,
                        lineHeight: 1.6,
                        fontSize: '0.95rem'
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ mb: 10 }}>
          <Grid container spacing={4} alignItems="stretch">
            {subscriptionPlans.map((plan, _index) => (
              <Grid item xs={12} md={4} key={plan.title} sx={{ display: 'flex' }}>
                <motion.div variants={itemVariants} style={{ width: '100%' }}>
                  <StyledCard className={plan.className}>
                    {plan.popular && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -20,
                          right: 20,
                          backgroundColor: colors.tariffs.comfort.main,
                          color: colors.text.light,
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          zIndex: 1,
                          boxShadow: '0 8px 24px rgba(139, 0, 0, 0.25)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          transform: 'translateY(0)',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 28px rgba(139, 0, 0, 0.3)',
                          }
                        }}
                      >
                        Популярный выбор
                      </Box>
                    )}
                    <PlanHeader
                      title={
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: 700,
                            fontSize: '1.75rem',
                            mb: 1
                          }}
                        >
                          {plan.title}
                        </Typography>
                      }
                      subheader={
                        <Typography sx={{ 
                          color: 'rgba(255, 255, 255, 0.95)',
                          fontSize: '1.1rem',
                          lineHeight: 1.4
                        }}>
                          {plan.description}
                        </Typography>
                      }
                    />
                    <CardContent sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      p: 4 
                    }}>
                      <Box sx={{ mb: 3 }}>
                        <PriceTypography variant="h3">
                          {plan.price}
                        </PriceTypography>
                        <Typography 
                          variant="subtitle1" 
                          align="center" 
                          sx={{ 
                            color: colors.text.secondary,
                            fontSize: '1rem'
                          }}
                        >
                          за сотрудника в месяц
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start'
                      }}>
                        <List sx={{ py: 0 }}>
                          {plan.features.map((feature, idx) => (
                            <ListItem 
                              key={idx} 
                              sx={{ 
                                py: 1.25,
                                px: 0,
                                minHeight: '48px',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateX(8px)',
                                  '& .MuiListItemIcon-root svg': {
                                    transform: 'scale(1.2)',
                                    color: plan.className === 'economy' 
                                      ? colors.tariffs.economy.main 
                                      : plan.className === 'comfort'
                                      ? colors.tariffs.comfort.main
                                      : colors.tariffs.premium.main
                                  }
                                }
                              }}
                            >
                              <ListItemIcon 
                                sx={{ 
                                  minWidth: 36,
                                  '& svg': {
                                    transition: 'all 0.3s ease',
                                    fontSize: '1.4rem',
                                    color: plan.className === 'economy' 
                                      ? colors.tariffs.economy.main 
                                      : plan.className === 'comfort'
                                      ? colors.tariffs.comfort.main
                                      : colors.tariffs.premium.main,
                                    filter: 'drop-shadow(0 2px 4px rgba(139, 0, 0, 0.2))'
                                  }
                                }}
                              >
                                {getFeatureIcon(feature)}
                              </ListItemIcon>
                              <ListItemText 
                                primary={feature}
                                primaryTypographyProps={{
                                  fontSize: '1.1rem',
                                  lineHeight: 1.4,
                                  fontWeight: 500,
                                  color: colors.text.secondary
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>

                      <Box sx={{ mt: 3 }}>
                        <Typography 
                          variant="subtitle2" 
                          align="center"
                          sx={{ 
                            mb: 3,
                            backgroundColor: plan.className === 'economy' 
                              ? colors.tariffs.economy.light
                              : plan.className === 'comfort'
                              ? colors.tariffs.comfort.light
                              : colors.tariffs.premium.light,
                            color: plan.className === 'economy' 
                              ? colors.tariffs.economy.main
                              : plan.className === 'comfort'
                              ? colors.tariffs.comfort.main
                              : colors.tariffs.premium.main,
                            py: 1.5,
                            px: 3,
                            borderRadius: '12px',
                            display: 'inline-block',
                            fontWeight: 600,
                            fontSize: '1rem',
                            boxShadow: '0 4px 12px rgba(139, 0, 0, 0.08)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 16px rgba(139, 0, 0, 0.12)',
                            }
                          }}
                        >
                          {plan.savings}
                        </Typography>
                        <Button 
                          component={Link}
                          to={`/contacts?plan=${encodeURIComponent(plan.title)}`}
                          variant="contained" 
                          size="large"
                          fullWidth
                          sx={{
                            py: 2,
                            backgroundColor: plan.className === 'economy' 
                              ? colors.tariffs.economy.main
                              : plan.className === 'comfort'
                              ? colors.tariffs.comfort.main
                              : colors.tariffs.premium.main,
                            '&:hover': {
                              backgroundColor: plan.className === 'economy' 
                                ? colors.tariffs.economy.dark
                                : plan.className === 'comfort'
                                ? colors.tariffs.comfort.dark
                                : colors.tariffs.premium.dark,
                            },
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(139, 0, 0, 0.15)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
                              opacity: 0,
                              transition: 'opacity 0.3s ease',
                            },
                            '&:hover::before': {
                              opacity: 1
                            }
                          }}
                        >
                          Выбрать план
                        </Button>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box 
          sx={{ 
            mt: 8, 
            py: 8,
            px: { xs: 2, md: 0 },
            backgroundColor: colors.section,
            borderRadius: '32px',
            boxShadow: 'inset 0 2px 8px rgba(139, 0, 0, 0.05)'
          }}
        >
          <motion.div variants={itemVariants}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography 
                variant="h3" 
                align="center" 
                gutterBottom
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  color: colors.primary.main,
                  mb: 2
                }}
              >
                Для кого это выгодно?
              </Typography>
              <Typography 
                variant="h6" 
                align="center" 
                sx={{ 
                  mb: 8, 
                  maxWidth: '800px', 
                  mx: 'auto',
                  color: colors.text.secondary,
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  lineHeight: 1.6
                }}
              >
                Наша платформа создает выгодную экосистему для всех участников
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} md={6} key={index}>
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <BenefitCard elevation={0}>
                    <BenefitIcon>
                      {benefit.icon}
                    </BenefitIcon>
                    <Typography 
                      variant="h5" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 700,
                        color: colors.text.primary,
                        fontSize: '1.75rem',
                        mb: 3,
                        background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {benefit.title}
                    </Typography>
                    <List>
                      {benefit.items.map((item, idx) => (
                        <ListItem 
                          key={idx} 
                          sx={{ 
                            px: 0, 
                            py: 1.5,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckCircleIcon 
                              sx={{ 
                                color: colors.primary.main,
                                fontSize: '1.4rem',
                                filter: 'drop-shadow(0 2px 4px rgba(139, 0, 0, 0.2))'
                              }} 
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary={item}
                            primaryTypographyProps={{
                              fontSize: '1.1rem',
                              lineHeight: 1.5,
                              fontWeight: 500,
                              color: colors.text.secondary
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </BenefitCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      </motion.div>
    </Container>
  );
};

export default PricingPage; 