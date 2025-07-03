import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bell, 
  CheckCircle, 
  Clock, 
  Newspaper,
  Gift,
  Trophy,
  Settings,
  Download,
  ExternalLink,
  Check
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

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return '#dc2626'; // высокий - красный
      case 2: return '#f59e0b'; // средний - оранжевый  
      default: return '#6b7280'; // низкий - серый
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
            padding: '80px 20px 20px 20px',
            overflow: 'hidden'
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
              maxWidth: '450px',
              width: '100%',
              maxHeight: 'calc(100vh - 140px)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid #f1f1f1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #750000, #a00000)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bell size={20} color="white" />
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#2c2c2c'
                  }}>
                    Уведомления
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    {loading ? 'Загрузка...' : `${notifications.length} новых`}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {notifications.length > 0 && (
                  <motion.button
                    onClick={markAllAsRead}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: 'none',
                      border: '1px solid #e1e1e1',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCircle size={14} />
                    Все прочитано
                  </motion.button>
                )}
                
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
                  <X size={20} />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div 
              style={{
                padding: '0',
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto'
              }}
              className="notification-scroll"
            >
              {loading ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '200px',
                  color: '#666'
                }}>
                  Загрузка уведомлений...
                </div>
              ) : error ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '200px',
                  color: '#dc2626'
                }}>
                  {error}
                </div>
              ) : notifications.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '200px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px' }} />
                  <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Все прочитано!</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    У вас нет новых уведомлений
                  </p>
                </div>
              ) : (
                <div style={{ padding: '8px 0' }}>
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid #f8f8f8',
                        cursor: notification.link_url ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fafafa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Priority indicator */}
                      {notification.priority > 1 && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          background: getPriorityColor(notification.priority)
                        }} />
                      )}
                      
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                      }}>
                        {/* Icon */}
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: `${notification.type_color}15`,
                          border: `1px solid ${notification.type_color}30`,
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: notification.type_color,
                          flexShrink: 0
                        }}>
                          {getIcon(notification.type_icon)}
                        </div>
                        
                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '4px'
                          }}>
                            <h4 style={{
                              margin: 0,
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#2c2c2c',
                              lineHeight: '1.3'
                            }}>
                              {notification.title}
                            </h4>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {notification.link_url && (
                                <ExternalLink size={12} color="#666" />
                              )}
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '4px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#666'
                                }}
                              >
                                <Check size={14} />
                              </motion.button>
                            </div>
                          </div>
                          
                          <p style={{
                            margin: '0 0 8px 0',
                            fontSize: '13px',
                            color: '#555',
                            lineHeight: '1.4'
                          }}>
                            {notification.message}
                          </p>
                          
                          <span style={{
                            fontSize: '11px',
                            color: '#888'
                          }}>
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter; 