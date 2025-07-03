import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bell, 
  Clock, 
  Newspaper,
  Gift,
  Trophy,
  Settings,
  Download,
  ExternalLink,
  Check,
  XCircle
} from 'lucide-react';

interface Notification {
  id: number;
  type_name: string;
  type_icon: string;
  type_color: string;
  title: string;
  message: string;
  priority: number;
  link_url?: string;
  created_at: string;
  is_read?: boolean;
}

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  userId?: string | null;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose, userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Добавляем стили для кастомного скроллбара
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .notifications-content::-webkit-scrollbar {
        width: 6px;
      }
      .notifications-content::-webkit-scrollbar-track {
        background: transparent;
      }
      .notifications-content::-webkit-scrollbar-thumb {
        background: #750000;
        border-radius: 10px;
      }
      .notifications-content::-webkit-scrollbar-thumb:hover {
        background: #950000;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, userId]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notifications?action=unread${userId ? `&user_id=${userId}` : ''}`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Не удалось загрузить уведомления');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(
        `/api/notifications?action=mark-read&notification_id=${notificationId}${userId ? `&user_id=${userId}` : ''}`,
        { method: 'PUT' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        // Убираем уведомление из списка
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `/api/notifications?action=mark-all-read${userId ? `&user_id=${userId}` : ''}`,
        { method: 'PUT' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(
        `/api/notifications?action=delete&notification_id=${notificationId}${userId ? `&user_id=${userId}` : ''}`,
        { method: 'DELETE' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        // Удаляем уведомление из локального состояния
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        console.error('Error deleting notification:', data.error);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getIcon = (iconName: string) => {
    const iconProps = { size: 20 };
    
    switch (iconName) {
      case 'Newspaper': return <Newspaper {...iconProps} />;
      case 'Gift': return <Gift {...iconProps} />;
      case 'Trophy': return <Trophy {...iconProps} />;
      case 'Settings': return <Settings {...iconProps} />;
      case 'Clock': return <Clock {...iconProps} />;
      case 'Download': return <Download {...iconProps} />;
      default: return <Bell {...iconProps} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    // Отмечаем как прочитанное
    markAsRead(notification.id);
    
    // Переходим по ссылке если есть
    if (notification.link_url) {
      // Если это внутренняя ссылка, используем навигацию
      if (notification.link_url.startsWith('/')) {
        window.location.href = notification.link_url;
      } else {
        window.open(notification.link_url, '_blank');
      }
    }
    
    // Закрываем центр уведомлений
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '100px 20px 20px 20px',
            overflow: 'hidden',
            willChange: 'backdrop-filter',
            backfaceVisibility: 'hidden'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              background: 'white',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: 'calc(100vh - 160px)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Фиксированный заголовок */}
            <div style={{
              padding: '32px 32px 24px 32px',
              borderBottom: '1px solid #f1f1f1',
              background: 'white'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: notifications.length > 0 ? '24px' : 0
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #750000, #a00000)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Bell size={24} color="white" />
                  </div>
                  <div>
                    <h2 style={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#2c2c2c'
                    }}>
                      Уведомления
                    </h2>
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      {notifications.length > 0 
                        ? `У вас ${notifications.length} новых уведомлений` 
                        : 'Нет новых уведомлений'}
                    </p>
                  </div>
                </div>
                
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  <X size={24} />
                </motion.button>
              </div>

              {/* Кнопка "Прочитать все" */}
              {notifications.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={markAllAsRead}
                  style={{
                    background: 'linear-gradient(135deg, #fdf7f7, #faf0f0)',
                    border: '2px solid #e8d5d5',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    width: '100%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: '#750000',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  whileHover={{
                    scale: 1.02,
                    background: 'linear-gradient(135deg, #faf0f0, #f8e8e8)'
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check size={18} />
                  Прочитать все
                </motion.button>
              )}
            </div>

            {/* Скроллируемый контент */}
            <div 
              className="notifications-content"
              style={{
                padding: '24px 32px',
                overflowY: 'auto',
                flex: 1
              }}
            >
              {/* Список уведомлений */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '12px'
              }}>
                {loading ? (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#666'
                  }}>
                    Загрузка...
                  </div>
                ) : error ? (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#dc2626'
                  }}>
                    {error}
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#666',
                    background: '#f9fafb',
                    borderRadius: '12px'
                  }}>
                    <Bell size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>У вас нет новых уведомлений</p>
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease'
                      }}
                      whileHover={{
                        background: '#f9fafb',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      {/* Кнопка удаления */}
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        whileHover={{ 
                          scale: 1.1,
                          background: 'rgba(220, 38, 38, 0.1)',
                          color: '#dc2626'
                        }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'none',
                          border: 'none',
                          padding: '4px',
                          cursor: 'pointer',
                          color: '#666',
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <XCircle size={20} />
                      </motion.button>

                      <div 
                        style={{
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start'
                        }}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div style={{
                          width: '36px',
                          height: '36px',
                          background: notification.type_color,
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {getIcon(notification.type_icon)}
                        </div>
                        
                        <div style={{ flex: 1, paddingRight: '40px' }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '4px'
                          }}>
                            <h3 style={{
                              margin: 0,
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#2c2c2c'
                            }}>
                              {notification.title}
                            </h3>
                            <span style={{
                              fontSize: '12px',
                              color: '#666',
                              flexShrink: 0,
                              marginLeft: '12px'
                            }}>
                              {formatDate(notification.created_at)}
                            </span>
                          </div>
                          
                          <p style={{
                            margin: 0,
                            fontSize: '14px',
                            color: '#4b5563',
                            lineHeight: 1.5
                          }}>
                            {notification.message}
                          </p>
                          
                          {notification.link_url && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '8px',
                              fontSize: '13px',
                              color: '#750000',
                              fontWeight: 500
                            }}>
                              <span>Подробнее</span>
                              <ExternalLink size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter; 