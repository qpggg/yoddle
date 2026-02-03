import React from 'react';
import { Container, Typography, Box, Paper, List, ListItem, ListItemText } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { Shield, Lock, Eye, Database } from 'lucide-react';

const Privacy: React.FC = React.memo(() => {
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
      title: '1. Общие принципы обработки данных',
      icon: Shield,
      content: [
        'Yoddle обрабатывает персональные данные в соответствии с ФЗ-152 "О персональных данных" и GDPR для международных клиентов.',
        'Мы собираем только те данные, которые необходимы для предоставления наших услуг по управлению корпоративными льготами.',
        'Обработка данных осуществляется на основании согласия пользователя или для исполнения договорных обязательств.',
        'Мы применяем принципы минимизации данных — собираем только необходимую информацию.'
      ]
    },
    {
      title: '2. Какие данные мы собираем',
      icon: Database,
      content: [
        'Персональные данные: ФИО, email, телефон, должность, информация о компании.',
        'Технические данные: IP-адрес, данные браузера, cookies, логи активности в системе.',
        'Данные об использовании: предпочтения льгот, история активности, статистика использования платформы.',
        'Корпоративные данные: структура компании, информация о льготах и benefits-программах.'
      ]
    },
    {
      title: '3. Цели обработки персональных данных',
      icon: Eye,
      content: [
        'Предоставление услуг платформы управления корпоративными льготами.',
        'Персонализация рекомендаций и настройка интерфейса под потребности пользователя.',
        'Аналитика эффективности HR-программ и формирование отчетов для работодателей.',
        'Обеспечение технической поддержки и коммуникации с пользователями.',
        'Улучшение качества сервиса и разработка новых функций.'
      ]
    },
    {
      title: '4. Безопасность и защита данных',
      icon: Lock,
      content: [
        'Все данные шифруются при передаче (TLS 1.3) и хранении (AES-256).',
        'Доступ к данным предоставляется только авторизованному персоналу на основе принципа минимальных привилегий.',
        'Регулярные аудиты безопасности и тестирование на проникновение.',
        'Резервное копирование данных с шифрованием и географическим разделением.',
        'Мониторинг активности и системы обнаружения несанкционированного доступа.'
      ]
    },
    {
      title: '5. Передача данных третьим лицам',
      icon: Shield,
      content: [
        'Мы не продаем и не передаем персональные данные третьим лицам в коммерческих целях.',
        'Передача возможна только интеграционным партнерам для обеспечения работы HR-систем с согласия клиента.',
        'В случаях, предусмотренных законом (по запросам уполномоченных органов).',
        'Поставщикам технических услуг (облачные сервисы, аналитика) с заключением соглашений о конфиденциальности.'
      ]
    },
    {
      title: '6. Права субъектов персональных данных',
      icon: Eye,
      content: [
        'Право на доступ: получение информации о том, какие данные мы обрабатываем.',
        'Право на исправление: корректировка неточных или неполных данных.',
        'Право на удаление: запрос на удаление персональных данных из системы.',
        'Право на ограничение обработки: временная приостановка обработки данных.',
        'Право на портируемость: получение данных в структурированном формате.',
        'Право на отзыв согласия: возможность отозвать согласие на обработку в любое время.'
      ]
    },
    {
      title: '7. Cookies и аналитика',
      icon: Database,
      content: [
        'Мы используем необходимые cookies для работы сервиса и аналитические для улучшения UX.',
        'Пользователь может настроить использование cookies в настройках браузера.',
        'Веб-аналитика используется для понимания поведения пользователей и оптимизации интерфейса.',
        'Данные аналитики обезличены и не позволяют идентифицировать конкретного пользователя.'
      ]
    },
    {
      title: '8. Хранение и удаление данных',
      icon: Lock,
      content: [
        'Персональные данные хранятся только в течение периода, необходимого для достижения целей обработки.',
        'После завершения договора данные удаляются в течение 90 дней, если иное не предусмотрено законом.',
        'Архивные копии для соблюдения требований законодательства хранятся в зашифрованном виде.',
        'Пользователь может запросить досрочное удаление данных через службу поддержки.'
      ]
    }
  ];

  return (
    <Box
      component="main"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        overflowX: 'hidden',
        minWidth: 0,
        maxWidth: '100%',
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
          top: '15%',
          left: '-5%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(76, 236, 196, 0.02) 0%, transparent 70%)',
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
              <Shield size={48} color={theme.palette.primary.main} />
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
              Политика{' '}
              <Box component="span" sx={{ color: theme.palette.primary.main }}>
                конфиденциальности
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
              Как мы защищаем ваши данные и обеспечиваем конфиденциальность при использовании платформы Yoddle
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: '#888',
                fontSize: theme.typography.pxToRem(14)
              }}
            >
              Последнее обновление: 10 июля 2025 г.
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
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
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
                      <IconComponent size={24} color={theme.palette.primary.main} />
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
              );
            })}
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
              background: 'linear-gradient(135deg, rgba(76, 236, 196, 0.02) 0%, rgba(76, 236, 196, 0.05) 100%)',
              border: '1px solid rgba(76, 236, 196, 0.1)',
              textAlign: 'center',
              position: 'relative',
              zIndex: 2
            }}
          >
            <Lock size={32} color={theme.palette.primary.main} style={{ marginBottom: 16 }} />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1A1A1A',
                mb: 2
              }}
            >
              Защищаем ваши данные 24/7
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
              Вопросы по обработке персональных данных? Хотите воспользоваться своими правами? Обратитесь к нашему офицеру по защите данных.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#888'
              }}
            >
              📧 info@yoddle.ru 
            </Typography>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
});

Privacy.displayName = 'Privacy';

export default Privacy; 