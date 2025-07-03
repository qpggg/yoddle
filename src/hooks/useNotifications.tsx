import { useState, useEffect, useCallback } from 'react';

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

interface UseNotificationsProps {
  userId?: string | null;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useNotifications = ({ 
  userId, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: UseNotificationsProps = {}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Получить все непрочитанные уведомления
  const fetchUnreadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notifications?action=unread${userId ? `&user_id=${userId}` : ''}`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.count || 0);
      } else {
        setError(data.error || 'Ошибка загрузки уведомлений');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Не удалось загрузить уведомления');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Получить только счетчик непрочитанных
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications?action=count${userId ? `&user_id=${userId}` : ''}`);
      const data = await response.json();
      
      if (data.success) {
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  }, [userId]);

  // Отметить уведомление как прочитанное
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await fetch(
        `/api/notifications?action=mark-read&notification_id=${notificationId}${userId ? `&user_id=${userId}` : ''}`,
        { method: 'PUT' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        // Убираем уведомление из списка
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        // Уменьшаем счетчик
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Обновляем глобальный счетчик если есть
        if ((window as any).updateNotificationCount) {
          (window as any).updateNotificationCount();
        }
      }
      
      return data.success;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [userId]);

  // Отметить все уведомления как прочитанные
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/notifications?action=mark-all-read${userId ? `&user_id=${userId}` : ''}`,
        { method: 'PUT' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications([]);
        setUnreadCount(0);
        
        // Обновляем глобальный счетчик если есть
        if ((window as any).updateNotificationCount) {
          (window as any).updateNotificationCount();
        }
      }
      
      return data.success;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [userId]);

  // Создать новое уведомление (для администраторов)
  const createNotification = useCallback(async (notification: {
    type_name: string;
    title: string;
    message: string;
    is_global?: boolean;
    priority?: number;
    link_url?: string;
  }) => {
    try {
      const response = await fetch(
        `/api/notifications?action=create${userId ? `&user_id=${userId}` : ''}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notification),
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        // Обновляем списки уведомлений
        await fetchUnreadNotifications();
      }
      
      return data;
    } catch (err) {
      console.error('Error creating notification:', err);
      return { success: false, error: 'Ошибка создания уведомления' };
    }
  }, [userId, fetchUnreadNotifications]);

  // Получить последние уведомления для дашборда
  const fetchRecentNotifications = useCallback(async (limit: number = 5) => {
    try {
      const response = await fetch(
        `/api/notifications?action=recent&limit=${limit}${userId ? `&user_id=${userId}` : ''}`
      );
      const data = await response.json();
      
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Error fetching recent notifications:', err);
      return [];
    }
  }, [userId]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      fetchUnreadCount(); // Начальная загрузка
      
      const interval = setInterval(fetchUnreadCount, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [fetchUnreadCount, autoRefresh, refreshInterval]);

  return {
    // Состояние
    notifications,
    unreadCount,
    loading,
    error,
    
    // Методы
    fetchUnreadNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    fetchRecentNotifications,
    
    // Обновления
    refresh: fetchUnreadNotifications,
    refreshCount: fetchUnreadCount,
  };
}; 