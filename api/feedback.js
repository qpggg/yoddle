import { Client } from 'pg';

// Функция для создания клиента БД
function createDbClient() {
  const connectionString = 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';
  
  return new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
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

  const { action } = req.query;

  try {
    switch (action) {
      case 'check-user':
        return await checkUserFeedback(req, res);
      case 'recent':
        return await getRecentFeedback(req, res);
      case 'submit':
        return await submitFeedback(req, res);
      default:
        return await getAllFeedback(req, res);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
}

// Проверка, оставлял ли пользователь отзыв
async function checkUserFeedback(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ success: false, error: 'user_id is required' });
  }

  const client = createDbClient();
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT id, rating, comment, created_at 
      FROM feedback 
      WHERE user_id = $1
    `, [user_id]);

    await client.end();

    res.json({
      success: true,
      hasSubmitted: result.rows.length > 0,
      feedback: result.rows[0] || null
    });

  } catch (error) {
    console.error('Error checking user feedback:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при проверке отзыва пользователя'
    });
  }
}

// Получение последних 5 отзывов
async function getRecentFeedback(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const client = createDbClient();
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        f.id,
        f.rating,
        f.comment,
        f.created_at,
        u.name as user_name,
        u.position,
        u.avatar
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
      LIMIT 5
    `);

    await client.end();

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching recent feedback:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении отзывов'
    });
  }
}

// Создание отзыва
async function submitFeedback(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { user_id, rating, comment } = req.body;

  if (!user_id || !rating || !comment) {
    return res.status(400).json({ 
      success: false, 
      error: 'user_id, rating и comment обязательны' 
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ 
      success: false, 
      error: 'Рейтинг должен быть от 1 до 5' 
    });
  }

  const client = createDbClient();
  try {
    await client.connect();
    
    // Проверяем, есть ли уже отзыв от этого пользователя
    const existingCheck = await client.query(`
      SELECT id FROM feedback WHERE user_id = $1
    `, [user_id]);

    if (existingCheck.rows.length > 0) {
      await client.end();
      return res.status(409).json({
        success: false,
        error: 'Вы уже оставили отзыв'
      });
    }

    // Создаем новый отзыв
    const result = await client.query(`
      INSERT INTO feedback (user_id, rating, comment, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, created_at
    `, [user_id, rating, comment]);

    await client.end();

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        user_id,
        rating,
        comment,
        created_at: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при сохранении отзыва'
    });
  }
}

// Получение всех отзывов (с пагинацией)
async function getAllFeedback(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const client = createDbClient();
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        f.id,
        f.rating,
        f.comment,
        f.created_at,
        u.name as user_name,
        u.position,
        u.avatar
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    // Подсчет общего количества
    const countResult = await client.query('SELECT COUNT(*) as total FROM feedback');
    const total = parseInt(countResult.rows[0].total);

    await client.end();

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении отзывов'
    });
  }
} 