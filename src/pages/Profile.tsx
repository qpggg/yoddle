import React from 'react';
import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { useActivity } from '../hooks/useActivity';
import { motion } from 'framer-motion';
import { 
  Box, 
  Typography, 
  Button, 
  Avatar, 
  Paper, 
  Grid, 
  Divider,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(139,0,0,0.08)',
  maxWidth: 800,
  margin: '40px auto',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    margin: '20px 16px',
  }
}));

const ProfileField = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  borderRadius: 8,
  backgroundColor: theme.palette.background.default,
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
  }
}));

const Profile: React.FC = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const theme = useTheme();
  const { logCustomActivity } = useActivity();

  const handleLogout = async () => {
    // 🎉 АВТОЛОГИРОВАНИЕ ВЫХОДА
    await logCustomActivity('logout', 5, `Пользователь ${user?.name || user?.email} вышел из системы`);
    
    logout();
    navigate('/');
  };

  if (!user) return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h6" color="text.secondary">
        Нет данных пользователя
      </Typography>
    </Box>
  );

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <StyledPaper>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <Avatar
              src={user.avatar}
              alt={user.name}
              sx={{
                width: 120,
                height: 120,
                margin: '0 auto',
                border: `4px solid ${theme.palette.primary.main}`,
                boxShadow: '0 4px 12px rgba(139,0,0,0.15)'
              }}
            />
          </motion.div>
          <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
            {user.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {user.position}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <ProfileField>
                <Typography variant="overline" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {user.email}
                </Typography>
              </ProfileField>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <ProfileField>
                <Typography variant="overline" color="text.secondary">
                  Телефон
                </Typography>
                <Typography variant="body1">
                  {user.phone}
                </Typography>
              </ProfileField>
            </motion.div>
          </Grid>

          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <ProfileField>
                <Typography variant="overline" color="text.secondary">
                  Льготы
                </Typography>
                <Typography variant="body1">
                  {user.benefits && user.benefits.length > 0 
                    ? user.benefits.join(', ') 
                    : 'Нет льгот'}
                </Typography>
              </ProfileField>
            </motion.div>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleLogout}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem'
              }}
            >
              Выйти
            </Button>
          </motion.div>
        </Box>
      </StyledPaper>
    </motion.div>
  );
};

export default Profile; 