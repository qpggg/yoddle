import { Client } from 'pg';

// Функция для создания клиента БД
function createDbClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });
}

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
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id is required' 
      });
    }

    const client = createDbClient();
    
    try {
      await client.connect();
      
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
        
        res.status(200).json({
          success: true,
          preferences: result.rows[0].data,
          timestamp: result.rows[0].timestamp
        });
      } else {
        console.log('ℹ️ Предпочтения не найдены');
        
        res.status(200).json({
          success: true,
          preferences: null
        });
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки предпочтений:', error);
      res.status(500).json({
        success: false,
        error: 'Database error: ' + error.message
      });
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (e) {
          console.error('Error closing client:', e);
        }
      }
    }
    return;
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
    await client.connect();
    
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

    await client.end();

    console.log('✅ User preferences saved successfully');

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
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing DB connection:', endError);
    }
    
    res.status(500).json({
      success: false,
      error: 'Ошибка при сохранении предпочтений',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
