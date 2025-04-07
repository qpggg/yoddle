import { Box, Container, Grid, Typography, Avatar } from '@mui/material'
import { motion } from 'framer-motion'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'

const testimonials = [
  {
    quote: 'После внедрения Yoddle текучка кадров снизилась на 30%. Сотрудники довольны персонализированным подходом к льготам.',
    author: 'Колесникова Валерия',
    position: 'HR-директор',
    metric: '-30%',
    metricLabel: 'текучка кадров',
    initial: 'В'
  },
  {
    quote: 'Автоматизация процессов с Yoddle позволила нам сэкономить более 100 часов работы HR-отдела ежемесячно.',
    author: 'Ефремов Александр',
    position: 'CEO',
    metric: '100+',
    metricLabel: 'часов в месяц',
    initial: 'А'
  },
  {
    quote: 'Благодаря аналитике Yoddle мы оптимизировали бюджет на льготы и повысили удовлетворенность сотрудников на 45%.',
    author: 'Николаев Тимофей',
    position: 'HR-менеджер',
    metric: '+45%',
    metricLabel: 'лояльность',
    initial: 'Т'
  }
]

export const Testimonials = () => {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: '#F8F9FA',
        overflow: 'hidden',
        position: 'relative'
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

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
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
            Отзывы наших клиентов
          </Typography>
        </motion.div>

        <Grid container spacing={4} sx={{ mt: { xs: 6, md: 8 } }}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={testimonial.author}>
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
                <Box
                  sx={{
                    p: 4,
                    height: '100%',
                    minHeight: '360px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '24px',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
                    }
                  }}
                >
                  <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: 'rgba(117, 0, 0, 0.1)',
                        color: '#750000',
                        fontSize: '1.5rem',
                        fontWeight: 600
                      }}
                    >
                      {testimonial.initial}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#1A1A1A',
                          mb: 0.5
                        }}
                      >
                        {testimonial.author}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666666',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        {testimonial.position}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ position: 'relative', flex: 1 }}>
                    <FormatQuoteIcon
                      sx={{
                        position: 'absolute',
                        top: -10,
                        left: -8,
                        fontSize: 40,
                        color: 'rgba(117, 0, 0, 0.1)',
                        transform: 'scaleX(-1)'
                      }}
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#1A1A1A',
                        lineHeight: 1.6,
                        position: 'relative',
                        pl: 4
                      }}
                    >
                      {testimonial.quote}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      mt: 4,
                      pt: 4,
                      borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 1
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        color: '#750000',
                        fontWeight: 700
                      }}
                    >
                      {testimonial.metric}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666666'
                      }}
                    >
                      {testimonial.metricLabel}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
} 