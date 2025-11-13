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
    // Получение существующих оценок пользователя
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
      
      console.log('📥 Загружаем feedback для пользователя', user_id);
      
      // Получаем все оценки пользователя
      const result = await client.query(`
        SELECT benefit_id, label, reason, created_at 
        FROM ai_feedback 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [user_id]);
      
      console.log('✅ Найдено оценок:', result.rows.length);
      
      res.status(200).json({
        success: true,
        feedback: result.rows
      });
      
    } catch (error) {
      console.error('❌ Ошибка загрузки feedback:', error);
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

  const { user_id, benefit_id, label, reason, context = {} } = req.body;

  // Валидация входных данных
  if (!user_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'user_id is required' 
    });
  }

  if (!benefit_id || benefit_id === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Valid benefit_id is required (must be > 0)' 
    });
  }

  if (!label || !['useful', 'not_useful', 'added', 'ignored'].includes(label)) {
    return res.status(400).json({ 
      success: false, 
      error: 'label must be one of: useful, not_useful, added, ignored' 
    });
  }

  const client = createDbClient();
  
  try {
    await client.connect();
    
    console.log('🎯 Saving recommendation feedback:', {
      user_id,
      benefit_id,
      label,
      reason: reason || 'not specified',
      context,
      timestamp: new Date().toISOString()
    });

    // Проверяем, не голосовал ли уже пользователь за эту рекомендацию
    const existingCheck = await client.query(`
      SELECT id, label FROM ai_feedback 
      WHERE user_id = $1 AND benefit_id = $2
    `, [user_id, benefit_id]);

    if (existingCheck.rows.length > 0) {
      await client.end();
      return res.status(409).json({
        success: false,
        error: 'Вы уже оценили эту рекомендацию',
        existing_feedback: {
          label: existingCheck.rows[0].label,
          id: existingCheck.rows[0].id
        }
      });
    }

    // Пытаемся записать в основную таблицу ai_feedback
    try {
      const result = await client.query(`
        INSERT INTO ai_feedback (user_id, benefit_id, label, context, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, created_at
      `, [
        user_id, 
        benefit_id, 
        label, 
        JSON.stringify({ 
          reason: reason || '', 
          ...context,
          source: context.source || 'unknown',
          timestamp: new Date().toISOString()
        })
      ]);

      await client.end();

      console.log('✅ Feedback saved successfully to ai_feedback table');

      return res.json({
        success: true,
        message: 'Оценка сохранена',
        data: {
          id: result.rows[0].id,
          user_id,
          benefit_id,
          label,
          reason: reason || '',
          created_at: result.rows[0].created_at,
          stored_in: 'ai_feedback'
        }
      });

    } catch (feedbackError) {
      // Fallback: записываем в ai_signals если ai_feedback не существует
      console.log('ai_feedback table not available, using fallback to ai_signals:', feedbackError.message);
      
      const fallbackResult = await client.query(`
        INSERT INTO ai_signals (user_id, type, data, timestamp)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, timestamp
      `, [
        user_id,
        'benefit_feedback',
        JSON.stringify({ 
          benefit_id, 
          label, 
          reason: reason || '',
          context,
          via: 'fallback_from_ai_feedback',
          original_error: feedbackError.message
        })
      ]);

      await client.end();

      console.log('✅ Feedback saved successfully to ai_signals table (fallback)');

      return res.json({
        success: true,
        message: 'Оценка сохранена (fallback)',
        data: {
          id: fallbackResult.rows[0].id,
          user_id,
          benefit_id,
          label,
          reason: reason || '',
          created_at: fallbackResult.rows[0].timestamp,
          stored_in: 'ai_signals'
        }
      });
    }

  } catch (error) {
    console.error('❌ Error saving recommendation feedback:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing DB connection:', endError);
    }
    
    res.status(500).json({
      success: false,
      error: 'Ошибка при сохранении оценки рекомендации',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
