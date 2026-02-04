import React, { useState, useEffect, useCallback } from 'react';
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

  const fetchCount = useCallback(async () => {
    try {
      // Добавляем timestamp для предотвращения кэширования
      const timestamp = Date.now();
      const url = `/api/notifications?action=count&_t=${timestamp}${userId ? `&user_id=${userId}` : ''}`;
      
      console.log('📢 Fetching notification count from:', url);
      
      const response = await fetch(url, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // Проверяем статус ответа
      if (!response.ok) {
        console.warn('📢 Notifications API not available:', response.status);
        setCount(0);
        onCountChange?.(0);
        return;
      }
      
      const data = await response.json();
      
      console.log('📢 Notification count response:', data);
      
      if (data.success) {
        const newCount = parseInt(data.count) || 0;
        console.log('📢 Setting notification count to:', newCount);
        setCount(newCount);
        onCountChange?.(newCount);
      } else {
        console.warn('📢 API returned error:', data.error);
        setCount(0);
        onCountChange?.(0);
      }
    } catch (err) {
      console.warn('📢 Notifications system not ready:', err instanceof Error ? err.message : 'Unknown error');
      setCount(0);
      onCountChange?.(0);
    }
  }, [userId, onCountChange]);

  useEffect(() => {
    fetchCount();
    
    // Обновляем счетчик каждые 30 секунд
    const interval = setInterval(() => {
      fetchCount();
    }, 30000);
    
    // Обработчик события для обновления счетчика при отметке всех как прочитанных
    const handleNotificationsReadAll = () => {
      console.log('📢 Event received: notifications-read-all, fetching count...');
      // Небольшая задержка, чтобы дать время БД обновиться
      setTimeout(() => {
        fetchCount();
      }, 200);
    };
    
    window.addEventListener('notifications-read-all', handleNotificationsReadAll);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-read-all', handleNotificationsReadAll);
    };
  }, [fetchCount]);

  // Функция для обновления счетчика извне
  const updateCount = useCallback(() => {
    console.log('📢 updateNotificationCount called, fetching count...');
    fetchCount();
  }, [fetchCount]);

  // Добавляем метод в window для глобального доступа
  useEffect(() => {
    (window as any).updateNotificationCount = updateCount;
    
    return () => {
      delete (window as any).updateNotificationCount;
    };
  }, [updateCount]);

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