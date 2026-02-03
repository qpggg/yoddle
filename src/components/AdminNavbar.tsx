import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Button, Box, Container, IconButton, Drawer, List, ListItem, Menu, MenuItem, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { getAdminUser, clearAdminUser } from '../pages/admin/AdminLogin';
import { useUser } from '../hooks/useUser';

// Те же пункты и пути, что в основном навбаре — только названия и /admin/*
const adminNavItems = [
  { title: 'Кабинет', path: '/admin/dashboard' },
  { title: 'Сотрудники', path: '/admin/employees' },
  { title: 'Отчёты', path: '/admin/reports' },
  { title: 'Управление', path: '/admin/management' },
  { title: 'Финансы', path: '/admin/finance' },
];

const AdminNavbar: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout: logoutMain } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const admin = getAdminUser();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) setScrolled(isScrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => {
    clearAdminUser();
    logoutMain(); // сброс основной сессии — на /login навбар покажет лендинг (О платформе, Вход)
    handleClose();
    navigate('/login?redirect=/admin/dashboard');
  };

  return (
    <motion.div initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          boxShadow: scrolled
            ? '0px 1px 2px rgba(0, 0, 0, 0.05), 0px 0px 20px rgba(0, 0, 0, 0.03)'
            : '0px 1px 0px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', padding: '0.75rem 0' }}>
            {/* Тот же лого с анимациями, что в основном Navbar; ссылка на админ-кабинет + HR */}
            <motion.div
              whileHover={{
                scale: 1.03,
                filter: 'drop-shadow(0px 4px 12px rgba(139, 0, 0, 0.15))',
              }}
              whileTap={{
                scale: 0.97,
                filter: 'drop-shadow(0px 2px 4px rgba(139, 0, 0, 0.2))',
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                touchAction: 'manipulation',
              }}
            >
              <Box
                component={Link}
                to="/admin/dashboard"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  WebkitTapHighlightColor: 'transparent',
                  background: 'transparent',
                  textDecoration: 'none',
                  '&:focus': { outline: 'none' },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: '-12px -16px',
                    background: 'radial-gradient(70% 100% at center, rgba(139, 0, 0, 0.08), transparent)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    borderRadius: '100px',
                  },
                  '&:hover::before': { opacity: 1 },
                  '&:active::before': {
                    background: 'radial-gradient(60% 100% at center, rgba(139, 0, 0, 0.12), transparent)',
                    opacity: 1,
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: '-14px -18px',
                    background: 'radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(139, 0, 0, 0.12), transparent)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    zIndex: -1,
                    borderRadius: '100px',
                    filter: 'blur(8px)',
                  },
                  '&:hover::after': { opacity: 1 },
                }}
                onMouseMove={(e: React.MouseEvent<HTMLDivElement>) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  e.currentTarget.style.setProperty('--x', `${x}%`);
                  e.currentTarget.style.setProperty('--y', `${y}%`);
                }}
              >
                <Box
                  component="img"
                  src="/logo.png"
                  alt="Yoddle"
                  sx={{
                    height: { xs: '48px', md: '48px' },
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.06))',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: 'translateZ(0)',
                    willChange: 'transform',
                    borderRadius: '12px',
                    padding: '4px 8px',
                    backgroundColor: '#fff',
                    boxShadow: '0 0 1px rgba(0,0,0,0.05)',
                  }}
                />
                <Typography sx={{ ml: 1.5, color: '#8B0000', fontWeight: 700, fontSize: '1.1rem' }}>HR</Typography>
              </Box>
            </motion.div>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: '2.5rem', alignItems: 'center' }}>
              {adminNavItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  sx={{
                    color: location.pathname === item.path ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.87)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                    position: 'relative',
                    padding: '0.5rem 0.25rem',
                    minWidth: 'auto',
                    '&:hover': { backgroundColor: 'transparent', color: theme.palette.primary.main },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: '0.35rem',
                      left: '50%',
                      width: location.pathname === item.path ? '100%' : '0%',
                      height: '2px',
                      backgroundColor: theme.palette.primary.main,
                      transition: 'all 0.3s ease',
                      transform: 'translateX(-50%)',
                      opacity: location.pathname === item.path ? 1 : 0,
                      borderRadius: '2px',
                    },
                    '&:hover::after': { width: '100%', opacity: 0.7 },
                  }}
                >
                  {item.title}
                </Button>
              ))}
              {admin && (
                <IconButton sx={{ p: 0 }} onClick={handleAvatarClick} aria-controls={open ? 'admin-menu' : undefined} aria-haspopup="true">
                  {admin.avatar ? (
                    <Box component="img" src={admin.avatar} alt={admin.name} sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #8B0000' }} />
                  ) : (
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #8B0000' }}>
                      <Typography component="span" sx={{ fontSize: 24, color: '#8B0000' }}>{admin.name ? admin.name[0] : 'A'}</Typography>
                    </Box>
                  )}
                </IconButton>
              )}
            </Box>

            <IconButton
              sx={{
                display: { xs: 'flex', md: 'none' },
                color: theme.palette.primary.main,
                padding: '8px',
                '&:hover': { backgroundColor: 'rgba(139, 0, 0, 0.04)' },
              }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Menu
        id="admin-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ '& .MuiPaper-root': { borderRadius: 2, mt: 1, minWidth: 220 } }}
      >
        <MenuItem onClick={() => { handleClose(); navigate('/admin/dashboard'); }}>
          <Typography fontWeight={800}>Кабинет</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleClose(); navigate('/admin/employees'); }}>
          <Typography fontWeight={600}>Сотрудники</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleClose(); navigate('/admin/reports'); }}>
          <Typography fontWeight={600}>Отчёты</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleClose(); navigate('/admin/management'); }}>
          <Typography fontWeight={600}>Управление</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleClose(); navigate('/admin/finance'); }}>
          <Typography fontWeight={600}>Финансы</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: '#8B0000' }}>
          <Typography fontWeight={600}>Выход</Typography>
        </MenuItem>
      </Menu>

      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: '100%',
            maxWidth: '300px',
            backgroundColor: '#fff',
            boxShadow: '-4px 0px 16px rgba(0, 0, 0, 0.05)',
            borderLeft: '1px solid rgba(0, 0, 0, 0.08)',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <List>
            {adminNavItems.map((item) => (
              <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                <Button
                  component={Link}
                  to={item.path}
                  fullWidth
                  onClick={() => setMobileMenuOpen(false)}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.2,
                    px: 2,
                    color: location.pathname === item.path ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.87)',
                    fontSize: '1rem',
                    fontWeight: 500,
                    borderRadius: '12px',
                    backgroundColor: location.pathname === item.path ? 'rgba(139, 0, 0, 0.04)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(139, 0, 0, 0.04)',
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  {item.title}
                </Button>
              </ListItem>
            ))}
            {admin && (
              <ListItem disablePadding sx={{ mt: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleLogout}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: '#fff',
                    py: 1.2,
                    fontSize: '1rem',
                    fontWeight: 500,
                    borderRadius: '12px',
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  Выход
                </Button>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>

      <Toolbar />
    </motion.div>
  );
};

export default AdminNavbar;
