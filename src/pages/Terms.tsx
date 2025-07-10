import React from 'react';
import { Container, Typography, Box, Paper, List, ListItem, ListItemText } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { Scale, Shield, CheckCircle } from 'lucide-react';

const Terms: React.FC = React.memo(() => {
  const theme = useTheme();

  const fadeInUp = React.useMemo(() => ({
    initial: { 
      opacity: 0, 
      y: 20 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  }), []);

  const containerVariants = React.useMemo(() => ({
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }), []);

  const itemVariants = React.useMemo(() => ({
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  }), []);

  const sections = [
    {
      title: '1. Общие положения',
      content: [
        'Настоящие Условия использования регулируют отношения между пользователем и Yoddle при использовании нашей платформы управления корпоративными льготами.',
        'Используя наш сервис, вы соглашаетесь с настоящими условиями в полном объеме.',
        'Мы оставляем за собой право изменять условия использования с предварительным уведомлением пользователей.'
      ]
    },
    {
      title: '2. Описание сервиса',
      content: [
        'Yoddle — это SaaS-платформа для автоматизации управления корпоративными льготами и benefits-программами.',
        'Мы предоставляем инструменты для HR-отделов по управлению льготами, аналитике и персонализации программ.',
        'Сервис включает веб-интерфейс, API, системы уведомлений и интеграции с HR-системами.'
      ]
    },
    {
      title: '3. Права и обязанности пользователей',
      content: [
        'Пользователи обязуются предоставлять достоверную информацию при регистрации и использовании сервиса.',
        'Запрещается использование сервиса в противоправных целях или для нарушения прав третьих лиц.',
        'Пользователи несут ответственность за безопасность своих учетных данных и паролей.',
        'Мы предоставляем право на использование платформы в соответствии с выбранным тарифным планом.'
      ]
    },
    {
      title: '4. Конфиденциальность и защита данных',
      content: [
        'Мы обеспечиваем защиту персональных данных в соответствии с требованиями ФЗ-152 "О персональных данных".',
        'Все данные хранятся с применением современных методов шифрования и безопасности.',
        'Мы не передаем данные третьим лицам без согласия пользователей, за исключением случаев, предусмотренных законом.'
      ]
    },
    {
      title: '5. Платежи и возвраты',
      content: [
        'Оплата услуг производится согласно выбранному тарифному плану на ежемесячной или годовой основе.',
        'Возврат средств возможен в течение 14 дней с момента оплаты при отсутствии использования сервиса.',
        'Автоматическое продление подписки происходит за 3 дня до окончания текущего периода.'
      ]
    },
    {
      title: '6. Ответственность и ограничения',
      content: [
        'Yoddle не несет ответственности за любые прямые или косвенные убытки, возникшие в результате использования сервиса.',
        'Мы обеспечиваем uptime не менее 99.5% с возможными техническими перерывами для обслуживания.',
        'Пользователи несут полную ответственность за контент, загружаемый в систему.'
      ]
    },
    {
      title: '7. Завершение соглашения',
      content: [
        'Соглашение может быть прекращено любой из сторон с уведомлением за 30 дней.',
        'При нарушении условий мы оставляем за собой право заблокировать доступ к сервису.',
        'После завершения соглашения данные пользователя удаляются в течение 90 дней.'
      ]
    }
  ];

  return (
    <Box
      component="main"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)',
        pt: { xs: theme.spacing(10), md: theme.spacing(15) },
        pb: { xs: theme.spacing(8), md: theme.spacing(12) },
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        perspective: 1000
      }}
    >
      {/* Background Decorations */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '-5%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 0, 0, 0.02) 0%, transparent 70%)',
          zIndex: 1,
          display: { xs: 'none', lg: 'block' },
          willChange: 'transform'
        }}
      />

      <Container maxWidth="lg">
        {/* Header Section */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 }, position: 'relative', zIndex: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <Scale size={48} color={theme.palette.primary.main} />
            </Box>
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
              Условия{' '}
              <Box component="span" sx={{ color: theme.palette.primary.main }}>
                использования
              </Box>
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: theme.typography.pxToRem(18), md: theme.typography.pxToRem(22) },
                fontWeight: 400,
                color: '#666',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Правила и условия использования платформы Yoddle для управления корпоративными льготами
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: '#888',
                fontSize: theme.typography.pxToRem(14)
              }}
            >
              Последнее обновление: 07 января 2025 г.
            </Typography>
          </Box>
        </motion.div>

        {/* Content Sections */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            {sections.map((section, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, md: 4 },
                    mb: 3,
                    borderRadius: '20px',
                    bgcolor: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontSize: { xs: theme.typography.pxToRem(20), md: theme.typography.pxToRem(24) },
                      fontWeight: 700,
                      color: '#1A1A1A',
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <CheckCircle size={24} color={theme.palette.primary.main} />
                    {section.title}
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {section.content.map((item, itemIndex) => (
                      <ListItem key={itemIndex} sx={{ px: 0, py: 1 }}>
                        <ListItemText
                          primary={item}
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontSize: theme.typography.pxToRem(16),
                              lineHeight: 1.7,
                              color: '#444'
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </motion.div>
            ))}
          </Box>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              mt: 4,
              borderRadius: '20px',
              bgcolor: 'linear-gradient(135deg, rgba(139, 0, 0, 0.02) 0%, rgba(139, 0, 0, 0.05) 100%)',
              border: '1px solid rgba(139, 0, 0, 0.1)',
              textAlign: 'center',
              position: 'relative',
              zIndex: 2
            }}
          >
            <Shield size={32} color={theme.palette.primary.main} style={{ marginBottom: 16 }} />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1A1A1A',
                mb: 2
              }}
            >
              Вопросы по условиям использования?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#666',
                mb: 3,
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Если у вас есть вопросы относительно наших условий использования или правовых аспектов сотрудничества, мы готовы предоставить подробные разъяснения.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#888'
              }}
            >
              📧 legal@yoddle.ru  •  📱 +7 (999) 123-45-67
            </Typography>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
});

Terms.displayName = 'Terms';

export default Terms; 