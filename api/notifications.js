// API для системы уведомлений Yoddle
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    const { method, query } = req;
    const { action, user_id, notification_id, type, priority = 1 } = query;

    console.log(`📢 Notifications API: ${method} ${action || 'default'}`);

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      return res.status(200).end();
    }

    // ================================================
    // GET ENDPOINTS
    // ================================================
    if (method === 'GET') {
      
      // Получить все непрочитанные уведомления
      if (action === 'unread') {
        const { data, error } = await supabase
          .rpc('get_unread_notifications', { p_user_id: user_id || null });

        if (error) {
          console.error('❌ Error fetching unread notifications:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Ошибка получения уведомлений' 
          });
        }

        return res.status(200).json({
          success: true,
          data: data || [],
          count: data?.length || 0
        });
      }

      // Подсчет непрочитанных уведомлений
      if (action === 'count') {
        const { data, error } = await supabase
          .rpc('count_unread_notifications', { p_user_id: user_id || null });

        if (error) {
          console.error('❌ Error counting notifications:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Ошибка подсчета уведомлений' 
          });
        }

        return res.status(200).json({
          success: true,
          count: data || 0
        });
      }

      // Получить последние уведомления (для дашборда)
      if (action === 'recent') {
        const limit = parseInt(query.limit) || 10;
        
        let queryBuilder = supabase
          .from('recent_notifications')
          .select('*');

        // Фильтр по пользователю
        if (user_id) {
          queryBuilder = queryBuilder.or(`is_global.eq.true,user_id.eq.${user_id}`);
        } else {
          queryBuilder = queryBuilder.eq('is_global', true);
        }

        queryBuilder = queryBuilder
          .order('created_at', { ascending: false })
          .limit(limit);

        const { data, error } = await queryBuilder;

        if (error) {
          console.error('❌ Error fetching recent notifications:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Ошибка получения последних уведомлений' 
          });
        }

        return res.status(200).json({
          success: true,
          data: data || []
        });
      }

      // Получить статистику уведомлений
      if (action === 'stats') {
        const { data, error } = await supabase
          .from('notification_stats')
          .select('*');

        if (error) {
          console.error('❌ Error fetching notification stats:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Ошибка получения статистики' 
          });
        }

        return res.status(200).json({
          success: true,
          data: data || []
        });
      }

      // Получить типы уведомлений
      if (action === 'types') {
        const { data, error } = await supabase
          .from('notification_types')
          .select('*')
          .order('name');

        if (error) {
          console.error('❌ Error fetching notification types:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Ошибка получения типов уведомлений' 
          });
        }

        return res.status(200).json({
          success: true,
          data: data || []
        });
      }

      // Получить все уведомления с пагинацией
      if (action === 'all' || !action) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const offset = (page - 1) * limit;

        let queryBuilder = supabase
          .from('notifications')
          .select(`
            id,
            title,
            message,
            is_read,
            priority,
            link_url,
            created_at,
            read_at,
            notification_types (
              name,
              icon,
              color,
              description
            )
          `);

        // Фильтры
        if (user_id) {
          queryBuilder = queryBuilder.or(`is_global.eq.true,user_id.eq.${user_id}`);
        } else {
          queryBuilder = queryBuilder.eq('is_global', true);
        }

        if (type) {
          queryBuilder = queryBuilder.eq('notification_types.name', type);
        }

        if (query.is_read !== undefined) {
          queryBuilder = queryBuilder.eq('is_read', query.is_read === 'true');
        }

        // Применяем пагинацию и сортировку
        queryBuilder = queryBuilder
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        const { data, error, count } = await queryBuilder;

        if (error) {
          console.error('❌ Error fetching notifications:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Ошибка получения уведомлений' 
          });
        }

        return res.status(200).json({
          success: true,
          data: data || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit)
          }
        });
      }
    }

    // ================================================
    // POST ENDPOINTS
    // ================================================
    if (method === 'POST') {
      const { type_name, title, message, is_global = false, link_url, expires_at } = req.body;

      // Создать новое уведомление
      if (action === 'create') {
        if (!type_name || !title || !message) {
          return res.status(400).json({
            success: false,
            error: 'Обязательные поля: type_name, title, message'
          });
        }

        const { data, error } = await supabase
          .rpc('create_notification', {
            p_type_name: type_name,
            p_title: title,
            p_message: message,
            p_user_id: user_id || null,
            p_is_global: is_global,
            p_priority: priority,
            p_link_url: link_url || null
          });

        if (error) {
          console.error('❌ Error creating notification:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Ошибка создания уведомления' 
          });
        }

        return res.status(201).json({
          success: true,
          notification_id: data,
          message: 'Уведомление создано успешно'
        });
      }

      // Массовое создание уведомлений
      if (action === 'bulk-create') {
        const { notifications } = req.body;

        if (!Array.isArray(notifications) || notifications.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Поле notifications должно быть массивом'
          });
        }

        const results = [];
        const errors = [];

        for (const notification of notifications) {
          try {
            const { data, error } = await supabase
              .rpc('create_notification', {
                p_type_name: notification.type_name,
                p_title: notification.title,
                p_message: notification.message,
                p_user_id: notification.user_id || null,
                p_is_global: notification.is_global || false,
                p_priority: notification.priority || 1,
                p_link_url: notification.link_url || null
              });

            if (error) {
              errors.push({ notification, error: error.message });
            } else {
              results.push({ notification_id: data });
            }
          } catch (err) {
            errors.push({ notification, error: err.message });
          }
        }

        return res.status(200).json({
          success: true,
          created: results.length,
          errors: errors.length,
          results,
          errors
        });
      }
    }

    // ================================================
    // PUT ENDPOINTS  
    // ================================================
    if (method === 'PUT') {
      
      // Отметить уведомление как прочитанное
      if (action === 'mark-read') {
        if (!notification_id) {
          return res.status(400).json({
            success: false,
            error: 'Требуется notification_id'
          });
        }

        const { data, error } = await supabase
          .rpc('mark_notification_read', {
            p_notification_id: parseInt(notification_id),
            p_user_id: user_id || 'anonymous'
          });

        if (error) {
          console.error('❌ Error marking notification as read:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Ошибка обновления уведомления' 
          });
        }

        return res.status(200).json({
          success: true,
          updated: data,
          message: 'Уведомление отмечено как прочитанное'
        });
      }

      // Отметить все уведомления как прочитанные
      if (action === 'mark-all-read') {
        let queryBuilder = supabase
          .from('notifications')
          .update({ 
            is_read: true, 
            read_at: new Date().toISOString() 
          });

        if (user_id) {
          queryBuilder = queryBuilder.or(`is_global.eq.true,user_id.eq.${user_id}`);
        } else {
          queryBuilder = queryBuilder.eq('is_global', true);
        }

        queryBuilder = queryBuilder.eq('is_read', false);

        const { data, error } = await queryBuilder;

        if (error) {
          console.error('❌ Error marking all notifications as read:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Ошибка обновления уведомлений' 
          });
        }

        return res.status(200).json({
          success: true,
          updated_count: data?.length || 0,
          message: 'Все уведомления отмечены как прочитанные'
        });
      }
    }

    // ================================================
    // DELETE ENDPOINTS
    // ================================================
    if (method === 'DELETE') {
      
      // Удалить уведомление (только для админов/создателей)
      if (action === 'delete' && notification_id) {
        const { data, error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notification_id);

        if (error) {
          console.error('❌ Error deleting notification:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Ошибка удаления уведомления' 
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Уведомление удалено'
        });
      }
    }

    // Неизвестный endpoint
    return res.status(404).json({
      success: false,
      error: 'Endpoint не найден'
    });

  } catch (error) {
    console.error('❌ Notifications API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
} 