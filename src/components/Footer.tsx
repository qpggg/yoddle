import { Box, Container, Grid, Typography, Link, Divider } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

const footerLinks = {
  product: {
    title: 'Продукт',
    items: [
      { name: 'Возможности', href: '/services' },
      { name: 'Преимущества', href: '/benefits' },
      { name: 'О платформе', href: '/about' },
      { name: 'Тарифы', href: '/pricing' },
    ],
  },
  company: {
    title: 'Компания',
    items: [
      { name: 'О нас', href: '/about' },
      { name: 'Контакты', href: '/contacts' },
      { name: 'Войти в систему', href: '/login' },
      { name: 'Демо', href: '/dashboard' },
    ],
  },
  legal: {
    title: 'Правовая информация',
    items: [
      { name: 'Условия использования', href: '/terms' },
      { name: 'Политика конфиденциальности', href: '/privacy' },
    ],
  },
}

export const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: { xs: 6, md: 8 },
        backgroundColor: '#1A1A1A',
        color: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: { xs: 4, md: 0 } }}>
              <Typography variant="h6" gutterBottom>
                Yoddle
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                Платформа для управления корпоративными льготами, которая помогает компаниям заботиться о сотрудниках
              </Typography>
              <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                📧 info@yoddle.ru
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                📱 +7 (999) 123-45-67
              </Typography>
            </Box>
          </Grid>

          {Object.entries(footerLinks).map(([key, section]) => (
            <Grid item xs={12} sm={6} md={2} key={key}>
              <Typography variant="subtitle1" gutterBottom>
                {section.title}
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {section.items.map((item) => (
                  <Box component="li" key={item.name} sx={{ mb: 1 }}>
                    <Link
                      component={RouterLink}
                      to={item.href}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        '&:hover': {
                          color: 'white',
                          textDecoration: 'none',
                        },
                      }}
                    >
                      {item.name}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'flex-start' },
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
            © {new Date().getFullYear()} Yoddle. Все права защищены.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mt: { xs: 2, sm: 0 },
            }}
          >
            <Link
              component={RouterLink}
              to="/terms"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                textDecoration: 'none',
                '&:hover': {
                  color: 'white',
                },
              }}
            >
              Условия
            </Link>
            <Link
              component={RouterLink}
              to="/privacy"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                textDecoration: 'none',
                '&:hover': {
                  color: 'white',
                },
              }}
            >
              Конфиденциальность
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  )
} 