import { Box, Container, Typography, Grid } from '@mui/material'
import { motion } from 'framer-motion'

export const About = () => {
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

      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 6, md: 8 },
            alignItems: 'center',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: '#750000',
                  mb: 1,
                  display: 'block',
                  position: 'relative',
                  paddingLeft: '24px',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    width: '16px',
                    height: '2px',
                    backgroundColor: '#750000',
                    transform: 'translateY(-50%)',
                  }
                }}
              >
                О ПЛАТФОРМЕ
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Typography
                variant="h2"
                sx={{
                  color: '#1A1A1A',
                  mb: 3,
                  maxWidth: '600px',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-12px',
                    left: 0,
                    width: '60px',
                    height: '4px',
                    background: 'linear-gradient(90deg, #750000 0%, rgba(117, 0, 0, 0.3) 100%)',
                    borderRadius: '2px',
                  }
                }}
              >
                Современное решение для управления льготами
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: '#666666',
                  mb: 4,
                  maxWidth: '600px',
                }}
              >
                Yoddle — это инновационная платформа, которая помогает компаниям эффективно управлять программами льгот для сотрудников. Мы объединяем передовые технологии и удобный интерфейс, чтобы сделать процесс управления льготами максимально простым и эффективным.
              </Typography>
            </motion.div>

            <Grid container spacing={3}>
              {[
                {
                  title: 'Простота использования',
                  description: 'Интуитивно понятный интерфейс для HR-специалистов и сотрудников',
                  gradient: 'linear-gradient(135deg, rgba(117, 0, 0, 0.08) 0%, rgba(117, 0, 0, 0.03) 100%)'
                },
                {
                  title: 'Гибкая настройка',
                  description: 'Настраивайте программы льгот под потребности вашей компании',
                  gradient: 'linear-gradient(135deg, rgba(117, 0, 0, 0.06) 0%, rgba(117, 0, 0, 0.02) 100%)'
                },
                {
                  title: 'Аналитика и отчеты',
                  description: 'Детальная статистика использования льгот и удовлетворенности',
                  gradient: 'linear-gradient(135deg, rgba(117, 0, 0, 0.07) 0%, rgba(117, 0, 0, 0.02) 100%)'
                },
                {
                  title: 'Безопасность данных',
                  description: 'Надежная защита персональных данных и информации компании',
                  gradient: 'linear-gradient(135deg, rgba(117, 0, 0, 0.05) 0%, rgba(117, 0, 0, 0.01) 100%)'
                }
              ].map((item, index) => (
                <Grid item xs={12} sm={6} key={item.title}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 0.6 + index * 0.1,
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        height: '100%',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        borderRadius: 3,
                        background: item.gradient,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '2px',
                          background: 'linear-gradient(90deg, #750000 0%, rgba(117, 0, 0, 0.3) 100%)',
                          opacity: 0,
                          transition: 'opacity 0.3s ease-in-out',
                        },
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)',
                          '&::before': {
                            opacity: 1,
                          }
                        }
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#1A1A1A',
                          mb: 2,
                          position: 'relative',
                          display: 'inline-block',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: '-4px',
                            left: 0,
                            width: '100%',
                            height: '2px',
                            background: 'linear-gradient(90deg, #750000 0%, rgba(117, 0, 0, 0) 100%)',
                            opacity: 0.5,
                          }
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#666666',
                          lineHeight: 1.6,
                        }}
                      >
                        {item.description}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box
            sx={{
              flex: '0 0 400px',
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 1,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
            >
              <Box
                sx={{
                  width: '300px',
                  height: '300px',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    border: '2px solid #750000',
                    opacity: 0.1,
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    border: '2px solid #750000',
                    opacity: 0.15,
                  }
                }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(117, 0, 0, 0.3) 0%, rgba(117, 0, 0, 0) 70%)',
                      filter: 'blur(10px)',
                    }}
                  />
                </motion.div>
                
                <motion.div
                  animate={{ 
                    scale: [1, 0.8, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#750000',
                      opacity: 0.2,
                    }}
                  />
                </motion.div>
              </Box>
            </motion.div>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}