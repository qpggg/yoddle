import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Paper } from '@mui/material';
import { FaStar, FaTrophy, FaGem } from 'react-icons/fa';

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
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return <FaStar />;
      case 'benefit_selected': return <FaTrophy />;
      case 'achievement_unlocked': return <FaGem />;
      default: return <FaStar />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'login': return 'Ежедневный вход';
      case 'benefit_selected': return 'Льгота выбрана';
      case 'achievement_unlocked': return 'Достижение получено';
      case 'profile_update': return 'Профиль обновлен';
      default: return 'Активность';
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: -50 }}
          transition={{ 
            type: 'spring',
            stiffness: 200,
            damping: 20
          }}
          style={{
            position: 'fixed',
            top: 100,
            right: 20,
            zIndex: 9999
          }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 2,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#333',
              minWidth: 200,
              boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4)'
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.3)',
                  fontSize: 20,
                  color: '#333'
                }}
              >
                {getActionIcon(action)}
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {getActionText(action)}
                </Typography>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 400 }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#FF6B00',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
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
                borderRadius: 16
              }}
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    scale: 0,
                    x: '50%',
                    y: '50%',
                    opacity: 1
                  }}
                  animate={{ 
                    scale: [0, 1, 0],
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    ease: 'easeOut'
                  }}
                  style={{
                    position: 'absolute',
                    width: 4,
                    height: 4,
                    background: '#FFF',
                    borderRadius: '50%',
                    boxShadow: '0 0 4px rgba(255,255,255,0.8)'
                  }}
                />
              ))}
            </motion.div>
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default XPNotification; 