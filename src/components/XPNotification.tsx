import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Paper } from '@mui/material';
import { FaStar, FaTrophy, FaHeart, FaUserShield } from 'react-icons/fa';

interface XPNotificationProps {
  xp: number;
  action: string;
  visible: boolean;
  onComplete: () => void;
}

const XPNotification: React.FC<XPNotificationProps> = ({ xp, action, visible, onComplete }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'login': 
        return { 
          icon: <FaStar />, 
          text: 'Ежедневный вход',
          color: '#FF6B35',
          bg: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
        };
      case 'benefit_selected': 
        return { 
          icon: <FaHeart />, 
          text: 'Льгота выбрана',
          color: '#8B0000',
          bg: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)'
        };
      case 'achievement_unlocked': 
        return { 
          icon: <FaTrophy />, 
          text: 'Достижение получено',
          color: '#FF9500',
          bg: 'linear-gradient(135deg, #FF9500 0%, #FF9F0A 100%)'
        };
      case 'profile_update': 
        return { 
          icon: <FaUserShield />, 
          text: 'Профиль обновлен',
          color: '#34C759',
          bg: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)'
        };
      default: 
        return { 
          icon: <FaStar />, 
          text: 'Активность',
          color: '#8B0000',
          bg: 'linear-gradient(135deg, #8B0000 0%, #B22222 100%)'
        };
    }
  };

  const actionConfig = getActionConfig(action);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: -50, x: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20, x: 50 }}
          transition={{ 
            type: 'spring',
            stiffness: 300,
            damping: 25
          }}
          style={{
            position: 'fixed',
            top: 120,
            right: 24,
            zIndex: 9999
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '24px',
              background: '#fff',
              border: '1px solid #eee',
              minWidth: 280,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Цветная полоска сверху */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: actionConfig.bg
              }}
            />
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
              style={{ display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '16px',
                  background: actionConfig.bg,
                  color: '#fff',
                  fontSize: 20,
                  boxShadow: '0 4px 12px rgba(139,0,0,0.2)'
                }}
              >
                {actionConfig.icon}
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ 
                  fontWeight: 600, 
                  color: '#1A1A1A',
                  mb: 0.5,
                  fontSize: '0.95rem'
                }}>
                  {actionConfig.text}
                </Typography>
                
                <motion.div
                  initial={{ scale: 0, x: -10 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
                >
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 800,
                      background: actionConfig.bg,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      display: 'inline-block'
                    }}
                  >
                    +{xp} XP
                  </Typography>
                </motion.div>
              </Box>
            </motion.div>
            
            {/* Анимация частиц */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                borderRadius: 24
              }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    scale: 0,
                    x: '60%',
                    y: '60%',
                    opacity: 1
                  }}
                  animate={{ 
                    scale: [0, 1.5, 0],
                    x: `${20 + Math.random() * 60}%`,
                    y: `${20 + Math.random() * 60}%`,
                    opacity: [1, 0.8, 0],
                    rotate: Math.random() * 360
                  }}
                  transition={{
                    duration: 2.5,
                    delay: i * 0.15,
                    ease: 'easeOut'
                  }}
                  style={{
                    position: 'absolute',
                    width: i % 2 === 0 ? 6 : 4,
                    height: i % 2 === 0 ? 6 : 4,
                    background: actionConfig.color,
                    borderRadius: i % 3 === 0 ? '50%' : '2px',
                    boxShadow: `0 0 8px ${actionConfig.color}80`
                  }}
                />
              ))}
            </motion.div>

            {/* Прогресс-бар анимация */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 3.5, ease: 'linear' }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 2,
                background: actionConfig.bg,
                transformOrigin: 'left',
                width: '100%'
              }}
            />
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default XPNotification; 