import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Button, Box, Container, IconButton, Drawer, List, ListItem, Badge, Menu, MenuItem, Divider, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { useUser } from '../hooks/useUser';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';

const navItems = [
  { title: 'О платформе', path: '/about' },
  { title: 'Преимущества', path: '/benefits' },
  { title: 'Тарифы', path: '/pricing' },
  { title: 'Услуги', path: '/services' }
];

const authNavItems = [
  { title: 'Продуктивность', path: '/productivity' },
  { title: 'Мои льготы', path: '/my-benefits' },
  { title: 'Прогресс', path: '/progress' },
  { title: 'Предпочтения', path: '/preferences' }
];

const Navbar: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications({ userId: user?.id });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [walletPreview, setWalletPreview] = useState<string>('…');

  useEffect(() => {
    const loadWallet = async () => {
      try {
        if (user?.id) {
          const r = await fetch(`/api/wallet?user_id=${user.id}`);
          const d = await r.json();
          if (d && d.success) setWalletPreview(Number(d.balance || 0).toLocaleString('ru-RU'));
          else setWalletPreview('—');
        } else setWalletPreview('—');
      } catch { setWalletPreview('—'); }
    };
    loadWallet();
  }, [user?.id]);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          boxShadow: scrolled 
            ? '0px 1px 2px rgba(0, 0, 0, 0.05), 0px 0px 20px rgba(0, 0, 0, 0.03)' 
            : '0px 1px 0px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', padding: '0.75rem 0' }}>
            <motion.div
              whileHover={{ 
                scale: 1.03,
                filter: 'drop-shadow(0px 4px 12px rgba(139, 0, 0, 0.15))'
              }}
              whileTap={{ 
                scale: 0.97,
                filter: 'drop-shadow(0px 2px 4px rgba(139, 0, 0, 0.2))'
              }}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                touchAction: 'manipulation'
              }}
            >
              <Box
                component={Link}
                to="/"
                sx={{
                  display: 'flex',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  WebkitTapHighlightColor: 'transparent',
                  background: 'transparent',
                  '&:focus': {
                    outline: 'none',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: '-12px -16px',
                    background: 'radial-gradient(70% 100% at center, rgba(139, 0, 0, 0.08), transparent)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    borderRadius: '100px',
                  },
                  '&:hover::before': {
                    opacity: 1,
                  },
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
                  '&:hover::after': {
                    opacity: 1,
                  }
                }}
                onMouseMove={(e) => {
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
              </Box>
            </motion.div>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: '2.5rem', alignItems: 'center' }}>
              {(user ? authNavItems : navItems).map((item) => (
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
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: theme.palette.primary.main
                    },
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
                      borderRadius: '2px'
                    },
                    '&:hover::after': {
                      width: '100%',
                      opacity: 0.7
                    }
                  }}
                >
                  {item.title}
                </Button>
              ))}
              {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton sx={{ p: 0 }} onClick={handleAvatarClick} aria-controls={open ? 'user-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined}>
                    {user.avatar ? (
                      <Box component="img" src={user.avatar} alt={user.name} sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #8B0000' }} />
                    ) : (
                      <Box sx={{ width: 40, height: 40, borderRadius: '50%', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #8B0000' }}>
                        <span style={{ fontSize: 24, color: '#8B0000' }}>{user.name ? user.name[0] : 'U'}</span>
                      </Box>
                    )}
                  </IconButton>

                  <Menu
                    id="user-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                      'aria-labelledby': 'avatar-button',
                    }}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{ '& .MuiPaper-root': { borderRadius: 2, mt: 1, minWidth: 220 } }}
                  >
                    <MenuItem onClick={() => { handleClose(); navigate('/dashboard'); }}>
                      <Typography fontWeight={800}>Кабинет</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                      <Typography fontWeight={600}>Профиль</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { handleClose(); setShowNotificationCenter(true); }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Typography fontWeight={800}>Уведомления</Typography>
                        <Badge badgeContent={unreadCount} sx={{ ml: 2, mr: -0.5, '& .MuiBadge-badge': { bgcolor: '#8B0000', color: '#fff' } }} />
                      </Box>
                    </MenuItem>
                    <MenuItem onClick={() => { handleClose(); navigate('/balance'); }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight={600}>Баланс: {walletPreview}</Typography>
                        <Box component="img" src="/coins.png" alt="coins" sx={{ width: 16, height: 16 }} />
                      </Box>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => { handleClose(); window.dispatchEvent(new CustomEvent('openProfileEditModal')); }}>
                      <Typography>Изменить профиль</Typography>
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  component={Link}
                  to="/login"
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: '#fff',
                    padding: '0.6rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    borderRadius: '12px',
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Вход
                </Button>
              )}
            </Box>

            <IconButton
              sx={{
                display: { xs: 'flex', md: 'none' },
                color: theme.palette.primary.main,
                padding: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(139, 0, 0, 0.04)'
                }
              }}
              onClick={handleMobileMenuToggle}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: '100%',
            maxWidth: '300px',
            backgroundColor: '#fff',
            boxShadow: '-4px 0px 16px rgba(0, 0, 0, 0.05)',
            borderLeft: '1px solid rgba(0, 0, 0, 0.08)'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <List>
            {(user ? authNavItems : navItems).map((item) => (
              <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                <Button
                  component={Link}
                  to={item.path}
                  fullWidth
                  onClick={handleMobileMenuToggle}
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
                      color: theme.palette.primary.main
                    }
                  }}
                >
                  {item.title}
                </Button>
              </ListItem>
            ))}
            {user ? (
              <ListItem disablePadding sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  component={Link}
                  to="/logout"
                  fullWidth
                  onClick={logout}
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
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  Выход
                </Button>
              </ListItem>
            ) : (
              <ListItem disablePadding sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  component={Link}
                  to="/login"
                  fullWidth
                  onClick={handleMobileMenuToggle}
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
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  Вход
                </Button>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>

      <Toolbar /> {/* Spacer for fixed AppBar */}
      <NotificationCenter open={showNotificationCenter} onClose={() => setShowNotificationCenter(false)} userId={user?.id || null} />
    </motion.div>
  );
};

export default Navbar; 