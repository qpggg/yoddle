// API для системы уведомлений Yoddle
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  try {
    const { method, query } = req;
    const { action, user_id, notification_id, type, priority = 1 } = query;

    console.log(`📢 Notifications API: ${method} ${action || 'default'}`, {
      action,
      user_id,
      notification_id,
      query: Object.keys(query)
    });

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
        const query = `
          SELECT * FROM notifications 
          WHERE (user_id = $1 OR is_global = true)
          AND is_read = false
          ORDER BY created_at DESC
        `;
        
        const { rows } = await pool.query(query, [user_id]);
        
        return res.status(200).json({
          success: true,
          data: rows,
          count: rows.length
        });
      }

      // Подсчет непрочитанных уведомлений
      if (action === 'count') {
        console.log('📢 Counting unread notifications for user_id:', user_id);
        
        const query = `
          SELECT COUNT(*) as count 
          FROM notifications 
          WHERE (user_id = $1 OR is_global = true)
          AND is_read = false
        `;
        
        const { rows } = await pool.query(query, [user_id]);
        const count = parseInt(rows[0].count) || 0;
        
        console.log('📢 Unread notifications count:', count);
        
        // Добавляем заголовки для предотвращения кэширования
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        return res.status(200).json({
          success: true,
          count: count
        });
      }

      // Получить последние уведомления (для дашборда)
      if (action === 'recent') {
        const limit = parseInt(query.limit) || 10;
        
        const query = `
          SELECT * FROM notifications
          WHERE (user_id = $1 OR is_global = true)
          ORDER BY created_at DESC
          LIMIT $2
        `;
        
        const { rows } = await pool.query(query, [user_id, limit]);
        
        return res.status(200).json({
          success: true,
          data: rows
        });
      }

      // Получить статистику уведомлений
      if (action === 'stats') {
        const query = `
          SELECT 
            type,
            COUNT(*) as total,
            SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread
          FROM notifications
          WHERE user_id = $1 OR is_global = true
          GROUP BY type
        `;
        
        const { rows } = await pool.query(query, [user_id]);
        
        return res.status(200).json({
          success: true,
          data: rows
        });
      }

      // Получить типы уведомлений
      if (action === 'types') {
        const query = `
          SELECT DISTINCT type 
          FROM notifications 
          ORDER BY type
        `;
        
        const { rows } = await pool.query(query);
        
        return res.status(200).json({
          success: true,
          data: rows
        });
      }
    }

    // ================================================
    // POST ENDPOINTS
    // ================================================
    if (method === 'POST') {
      // Создать новое уведомление
      if (action === 'create') {
        const query = `
          INSERT INTO notifications (
            user_id, type, title, message, priority, is_global
          ) VALUES (
            $1, $2, $3, $4, $5, $6
          ) RETURNING *
        `;
        
        const { rows } = await pool.query(query, [
          user_id,
          type,
          req.body.title,
          req.body.message,
          priority,
          req.body.is_global || false
        ]);
        
        return res.status(201).json({
          success: true,
          data: rows[0]
        });
      }
    }

    // ================================================
    // PUT ENDPOINTS
    // ================================================
    if (method === 'PUT') {
      // Отметить уведомление как прочитанное
      if (action === 'read' || action === 'mark-read') {
        if (!notification_id) {
          return res.status(400).json({
            success: false,
            error: 'notification_id обязателен'
          });
        }
        
        const query = `
          UPDATE notifications 
          SET is_read = true, 
              read_at = CURRENT_TIMESTAMP 
          WHERE id = $1 AND (user_id = $2 OR is_global = true)
          RETURNING *
        `;
        
        const { rows } = await pool.query(query, [notification_id, user_id]);
        
        return res.status(200).json({
          success: true,
          data: rows[0]
        });
      }

      // Отметить все уведомления как прочитанные
      if (action === 'mark-all-read') {
        console.log('📢 Mark all as read request for user_id:', user_id);
        
        let query;
        let params;
        
        if (user_id) {
          // Отмечаем как прочитанные уведомления пользователя и глобальные
          query = `
            UPDATE notifications 
            SET is_read = true, 
                read_at = CURRENT_TIMESTAMP 
            WHERE (user_id = $1 OR is_global = true)
            AND is_read = false
          `;
          params = [user_id];
        } else {
          // Если user_id не передан, отмечаем только глобальные
          query = `
            UPDATE notifications 
            SET is_read = true, 
                read_at = CURRENT_TIMESTAMP 
            WHERE is_global = true
            AND is_read = false
          `;
          params = [];
        }
        
        const result = await pool.query(query, params);
        
        console.log('📢 Marked', result.rowCount, 'notifications as read');
        
        return res.status(200).json({
          success: true,
          updated: result.rowCount
        });
      }
      
      // Если action не распознан для PUT метода
      return res.status(400).json({
        success: false,
        error: `Неизвестное действие для PUT: ${action || 'не указано'}`
      });
    }

    // ================================================
    // DELETE ENDPOINTS
    // ================================================
    if (method === 'DELETE') {
      if (notification_id) {
        const query = `
          DELETE FROM notifications 
          WHERE id = $1 AND (user_id = $2 OR is_global = true)
          RETURNING id
        `;
        
        const { rows } = await pool.query(query, [notification_id, user_id]);
        
        return res.status(200).json({
          success: true,
          data: rows[0]
        });
      }
    }

    // Если метод не поддерживается или action не найден
    return res.status(404).json({
      success: false,
      error: `Метод ${method} с действием "${action || 'не указано'}" не найден`
    });

  } catch (error) {
    console.error('❌ Notifications API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
} 