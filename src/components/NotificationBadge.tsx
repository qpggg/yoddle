import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationBadgeProps {
  userId?: string | null;
  onCountChange?: (count: number) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  userId, 
  onCountChange, 
  children, 
  className,
  style 
}) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCount();
    
    // Обновляем счетчик каждые 30 секунд
    const interval = setInterval(fetchCount, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const fetchCount = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/notifications?action=count${userId ? `&user_id=${userId}` : ''}`);
      const data = await response.json();
      
      if (data.success) {
        const newCount = data.count || 0;
        setCount(newCount);
        onCountChange?.(newCount);
      }
    } catch (err) {
      console.error('Error fetching notification count:', err);
    } finally {
      setLoading(false);
    }
  };

  // Функция для обновления счетчика извне
  const updateCount = () => {
    fetchCount();
  };

  // Добавляем метод в window для глобального доступа
  useEffect(() => {
    (window as any).updateNotificationCount = updateCount;
    
    return () => {
      delete (window as any).updateNotificationCount;
    };
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }} className={className}>
      {children}
      
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30 
            }}
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: 'linear-gradient(135deg, #dc2626, #ef4444)',
              color: 'white',
              borderRadius: '50%',
              minWidth: count > 9 ? '20px' : '18px',
              height: count > 9 ? '20px' : '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: count > 99 ? '10px' : '11px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
              border: '2px solid white',
              lineHeight: 1
            }}
          >
            {count > 99 ? '99+' : count}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBadge; 