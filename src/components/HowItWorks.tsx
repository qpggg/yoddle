import { Box, Container, Grid, Typography, useTheme, useMediaQuery } from '@mui/material'
import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Подключение',
    description: 'Быстрая интеграция платформы с вашими HR-системами',
  },
  {
    number: '02',
    title: 'Настройка',
    description: 'Персонализация льгот под потребности вашей компании',
  },
  {
    number: '03',
    title: 'Запуск',
    description: 'Автоматическое управление льготами для всех сотрудников',
  },
]

export const HowItWorks = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: '#FFFFFF',
      }}
    >
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
              mb: 2,
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            Как это работает
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            color="text.secondary"
            sx={{ mb: 8, maxWidth: 800, mx: 'auto' }}
          >
            Простой процесс внедрения Yoddle в вашу компанию
          </Typography>
        </motion.div>

        <Grid container spacing={4} alignItems="center">
          {steps.map((step, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    textAlign: 'center',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      right: '-50%',
                      width: '100%',
                      height: '2px',
                      backgroundColor: '#E0E0E0',
                      display: index < steps.length - 1 && !isMobile ? 'block' : 'none',
                    },
                  }}
                >
                  <Typography
                    variant="h1"
                    sx={{
                      color: 'rgba(139, 0, 0, 0.1)',
                      fontSize: { xs: '4rem', md: '6rem' },
                      fontWeight: 700,
                      mb: 2,
                    }}
                  >
                    {step.number}
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {step.description}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
} 