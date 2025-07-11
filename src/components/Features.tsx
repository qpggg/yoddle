import { Box, Container, Typography, Grid, Paper, Accordion, AccordionSummary, AccordionDetails, useMediaQuery, useTheme } from '@mui/material'
import { motion } from 'framer-motion'
import { useState } from 'react'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const features = [
  {
    title: 'Управление льготами',
    items: [
      'Настройка программ льгот',
      'Управление бюджетом',
      'Автоматизация процессов',
      'Мониторинг использования'
    ]
  },
  {
    title: 'Аналитика и отчетность',
    items: [
      'Детальная статистика',
      'Анализ эффективности',
      'Прогнозирование расходов',
      'Экспорт отчетов'
    ]
  },
  {
    title: 'HR-автоматизация',
    items: [
      'Интеграция с HR-системами',
      'Автоматическое начисление',
      'Уведомления и напоминания'
    ]
  }
]

export const Features = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);

  // Обработчик аккордеона для мобильных
  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        py: { xs: 8, md: 12 },
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '-5%',
            width: '25rem',
            height: '25rem',
            background: 'radial-gradient(circle, rgba(117, 0, 0, 0.02) 0%, rgba(117, 0, 0, 0) 70%)',
            borderRadius: '50%',
            filter: 'blur(50px)',
            zIndex: 0,
          }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.2 }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            right: '-5%',
            width: '20rem',
            height: '20rem',
            background: 'radial-gradient(circle, rgba(117, 0, 0, 0.02) 0%, rgba(117, 0, 0, 0) 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            zIndex: 0,
          }}
        />
      </motion.div>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ 
            duration: 0.8,
            type: "spring",
            stiffness: 100,
            damping: 20
          }}
        >
          <Typography
            variant="h2"
            align="center"
            sx={{
              color: '#1A1A1A',
              mb: 2,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-16px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80px',
                height: '4px',
                backgroundColor: '#750000',
                borderRadius: '2px',
              },
            }}
          >
            Возможности платформы
          </Typography>
        </motion.div>

        {/* Мобильная версия с аккордеоном */}
        {isMobile ? (
          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Accordion
                  expanded={expandedAccordion === `panel${index}`}
                  onChange={handleAccordionChange(`panel${index}`)}
                  sx={{
                    mb: 2,
                    borderRadius: '16px !important',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    '&:before': {
                      display: 'none',
                    },
                    '&.Mui-expanded': {
                      margin: '0 0 16px 0',
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: '#750000' }} />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        margin: '12px 0',
                      },
                      '&.Mui-expanded': {
                        minHeight: 56,
                      },
                      '&.Mui-expanded .MuiAccordionSummary-content': {
                        margin: '12px 0',
                      },
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#1A1A1A',
                        fontWeight: 600,
                      }}
                    >
                      {feature.title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                                         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                       {feature.items.map((item, _itemIndex) => (
                         <Box
                           key={item}
                           sx={{
                             display: 'flex',
                             alignItems: 'flex-start',
                             gap: 2,
                           }}
                         >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: 'rgba(117, 0, 0, 0.1)',
                              flexShrink: 0,
                            }}
                          >
                            <CheckCircleIcon
                              sx={{
                                fontSize: 16,
                                color: '#750000',
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#1A1A1A',
                              mt: 0.25,
                              fontSize: '0.9rem',
                            }}
                          >
                            {item}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </motion.div>
            ))}
          </Box>
        ) : (
          /* Десктопная версия с карточками */
          <Grid container spacing={4} sx={{ mt: { xs: 6, md: 8 } }}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={feature.title}>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.8,
                    delay: 0.2 + index * 0.2,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      height: '100%',
                      minHeight: '360px',
                      borderRadius: '24px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.3s ease-in-out',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #750000 0%, rgba(117, 0, 0, 0.3) 100%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease-in-out',
                      },
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(117, 0, 0, 0.1)',
                        '&::before': {
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.2 }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          color: '#1A1A1A',
                          mb: 4,
                        }}
                      >
                        {feature.title}
                      </Typography>
                    </motion.div>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {feature.items.map((item, itemIndex) => (
                        <Box
                          key={item}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                          }}
                        >
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 20,
                              delay: 0.6 + index * 0.2 + itemIndex * 0.1,
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(117, 0, 0, 0.1)',
                                flexShrink: 0,
                              }}
                            >
                              <CheckCircleIcon
                                sx={{
                                  fontSize: 20,
                                  color: '#750000',
                                }}
                              />
                            </Box>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ 
                              duration: 0.5,
                              delay: 0.7 + index * 0.2 + itemIndex * 0.1
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                color: '#1A1A1A',
                                mt: 0.25,
                              }}
                            >
                              {item}
                            </Typography>
                          </motion.div>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  )
} 