import { Box, Button, Container, Grid, Paper, Typography } from '@mui/material'

export const Pricing = () => {
  return (
    <Box
      id="pricing"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            Гибкие тарифы для любого бизнеса
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '1rem', md: '1.25rem' },
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            Выберите оптимальный тариф для вашей компании. Все тарифы включают полный набор функций.
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: '100%',
                borderRadius: 2,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  color: 'primary.main',
                  fontWeight: 600,
                }}
              >
                Стартовый
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  mb: 3,
                  fontWeight: 700,
                }}
              >
                ₽4,900
                <Typography
                  component="span"
                  sx={{
                    fontSize: '1rem',
                    color: 'text.secondary',
                    ml: 1,
                  }}
                >
                  /мес
                </Typography>
              </Typography>
              <Typography
                sx={{
                  mb: 4,
                  color: 'text.secondary',
                }}
              >
                Идеально подходит для малого бизнеса и индивидуальных предпринимателей.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Начать бесплатно
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: '100%',
                borderRadius: 2,
                backgroundColor: 'primary.main',
                color: 'white',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(139, 0, 0, 0.2)',
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                }}
              >
                Бизнес
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  mb: 3,
                  fontWeight: 700,
                }}
              >
                ₽9,900
                <Typography
                  component="span"
                  sx={{
                    fontSize: '1rem',
                    opacity: 0.8,
                    ml: 1,
                  }}
                >
                  /мес
                </Typography>
              </Typography>
              <Typography
                sx={{
                  mb: 4,
                  opacity: 0.8,
                }}
              >
                Оптимальное решение для растущего бизнеса с расширенными потребностями.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  backgroundColor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
              >
                Попробовать бесплатно
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: '100%',
                borderRadius: 2,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  color: 'primary.main',
                  fontWeight: 600,
                }}
              >
                Корпоративный
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  mb: 3,
                  fontWeight: 700,
                }}
              >
                ₽19,900
                <Typography
                  component="span"
                  sx={{
                    fontSize: '1rem',
                    color: 'text.secondary',
                    ml: 1,
                  }}
                >
                  /мес
                </Typography>
              </Typography>
              <Typography
                sx={{
                  mb: 4,
                  color: 'text.secondary',
                }}
              >
                Полный набор функций для крупных компаний с высокими требованиями.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Связаться с нами
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
} 