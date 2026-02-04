import { createDbClient } from '../db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Получение существующих предпочтений пользователя
    const { user_id, action } = req.query;
    
    // Игнорируем action, если он передан
    if (action && action !== 'get') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid action' 
      });
    }
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id is required' 
      });
    }

    const client = createDbClient();
    
    try {
      console.log('📥 Загружаем предпочтения для пользователя', user_id);
      
      // Получаем последние предпочтения пользователя
      const result = await client.query(`
        SELECT data, timestamp 
        FROM ai_signals 
        WHERE user_id = $1 AND type = 'preferences_free' 
        ORDER BY timestamp DESC 
        LIMIT 1
      `, [user_id]);
      
      if (result.rows.length > 0) {
        console.log('✅ Найдены предпочтения:', result.rows[0].data);
        
        // Парсим JSON данные если они строки
        let preferences = result.rows[0].data;
        if (typeof preferences === 'string') {
          try {
            preferences = JSON.parse(preferences);
          } catch (e) {
            console.warn('⚠️ Не удалось распарсить данные предпочтений:', e);
          }
        }
        
        return res.status(200).json({
          success: true,
          preferences: preferences,
          timestamp: result.rows[0].timestamp
        });
      } else {
        console.log('ℹ️ Предпочтения не найдены');
        
        return res.status(200).json({
          success: true,
          preferences: null
        });
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки предпочтений:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error: ' + error.message
      });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET or POST.' 
    });
  }

  const { user_id, free_text, tags, avoid, constraints } = req.body;

  // Валидация входных данных
  if (!user_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'user_id is required' 
    });
  }

  const client = createDbClient();
  
  try {
    console.log('💾 Saving user preferences:', {
      user_id,
      free_text: free_text ? `${free_text.substring(0, 50)}...` : 'empty',
      tags_count: Array.isArray(tags) ? tags.length : 0,
      avoid_count: Array.isArray(avoid) ? avoid.length : 0,
      constraints,
      timestamp: new Date().toISOString()
    });

    // Сохраняем свободные предпочтения в ai_signals
    const result = await client.query(`
      INSERT INTO ai_signals (user_id, type, data, timestamp)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, timestamp
    `, [
      user_id,
      'preferences_free',
      JSON.stringify({
        free_text: free_text || '',
        tags: Array.isArray(tags) ? tags : [],
        avoid: Array.isArray(avoid) ? avoid : [],
        constraints: constraints || {},
        source: 'preferences_page',
        version: '1.0'
      })
    ]);

    console.log('✅ User preferences saved successfully, ID:', result.rows[0].id);

    return res.json({
      success: true,
      message: 'Предпочтения сохранены',
      data: {
        id: result.rows[0].id,
        user_id,
        type: 'preferences_free',
        saved_at: result.rows[0].timestamp,
        preferences: {
          free_text: free_text || '',
          tags: Array.isArray(tags) ? tags : [],
          avoid: Array.isArray(avoid) ? avoid : [],
          constraints: constraints || {}
        }
      }
    });

  } catch (error) {
    console.error('❌ Error saving user preferences:', error);
    console.error('📋 Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      error: 'Ошибка при сохранении предпочтений: ' + (error.message || 'Неизвестная ошибка'),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
