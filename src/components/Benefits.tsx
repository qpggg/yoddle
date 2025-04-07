import { Box, Container, Typography, Grid, Paper } from '@mui/material'
import { motion } from 'framer-motion'
import PersonIcon from '@mui/icons-material/Person'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AssessmentIcon from '@mui/icons-material/Assessment'

const benefits = [
  {
    icon: <PersonIcon sx={{ fontSize: 40, color: '#750000' }} />,
    title: 'Персонализация',
    description: 'Индивидуальный подход к каждому сотруднику с учетом их предпочтений и потребностей',
  },
  {
    icon: <AccessTimeIcon sx={{ fontSize: 40, color: '#750000' }} />,
    title: 'Экономия времени',
    description: 'Автоматизация HR-процессов позволяет сократить время на рутинные задачи до 80%',
  },
  {
    icon: <AssessmentIcon sx={{ fontSize: 40, color: '#750000' }} />,
    title: 'Аналитика',
    description: 'Подробные отчеты и метрики для оптимизации программ льгот и бюджета',
  },
]

export const Benefits = () => {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        py: { xs: 8, md: 12 },
        backgroundColor: '#F8F9FA',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Decorative background elements */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'linear-gradient(180deg, rgba(117, 0, 0, 0.02) 0%, rgba(117, 0, 0, 0) 100%)',
            zIndex: 0,
          }}
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '-5%',
            width: '20rem',
            height: '20rem',
            background: 'radial-gradient(circle, rgba(117, 0, 0, 0.03) 0%, rgba(117, 0, 0, 0) 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
          }}
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.4 }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            right: '-5%',
            width: '25rem',
            height: '25rem',
            background: 'radial-gradient(circle, rgba(117, 0, 0, 0.03) 0%, rgba(117, 0, 0, 0) 70%)',
            borderRadius: '50%',
            filter: 'blur(50px)',
          }}
        />
      </motion.div>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="overline"
            align="center"
            sx={{
              display: 'block',
              color: '#750000',
              mb: 1,
            }}
          >
            ПРЕИМУЩЕСТВА
          </Typography>
          <Typography
            variant="h2"
            align="center"
            sx={{
              color: '#1A1A1A',
              mb: 2,
            }}
          >
            Почему выбирают Yoddle?
          </Typography>
          <Typography
            variant="body1"
            align="center"
            sx={{
              color: '#666666',
              mb: { xs: 6, md: 8 },
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            Мы предоставляем полный набор инструментов для эффективного управления льготами
          </Typography>
        </motion.div>

        <Grid container spacing={4}>
          {benefits.map((benefit, index) => (
            <Grid item xs={12} md={4} key={benefit.title}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.2,
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
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(117, 0, 0, 0.05) 0%, rgba(117, 0, 0, 0) 100%)',
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
                      '& .benefit-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                        color: '#8B0000',
                      },
                    },
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.2 + index * 0.1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: '16px',
                        backgroundColor: 'rgba(117, 0, 0, 0.05)',
                        mb: 3,
                      }}
                    >
                      <Box
                        className="benefit-icon"
                        sx={{
                          transition: 'all 0.3s ease-in-out',
                        }}
                      >
                        {benefit.icon}
                      </Box>
                    </Box>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.2 }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        color: '#1A1A1A',
                      }}
                    >
                      {benefit.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#666666',
                        lineHeight: 1.6,
                      }}
                    >
                      {benefit.description}
                    </Typography>
                  </motion.div>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
} 