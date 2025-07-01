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
      case 'categories':
        return await getCategories(req, res);
      case 'modal-data':
        return await getModalData(req, res);
      default:
        return await getNews(req, res);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
}

// Получение категорий новостей
async function getCategories(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const client = createDbClient();
  try {
    await client.connect();
    const result = await client.query(`
      SELECT * FROM category_stats 
      ORDER BY sort_order ASC
    `);
    await client.end();
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении категорий'
    });
  }
}

// Получение данных для модального окна
async function getModalData(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const client = createDbClient();
  try {
    await client.connect();
    
    const { limit = 10 } = req.query;

    const result = await client.query(`
      SELECT 
        n.id,
        n.title,
        n.content,
        n.author,
        n.publish_date as date,
        nc.name as category,
        n.image_url as image
      FROM news n
      JOIN news_categories nc ON n.category_id = nc.id
      WHERE n.status = 'published'
      ORDER BY n.is_featured DESC, n.publish_date DESC
      LIMIT $1
    `, [parseInt(limit)]);

    await client.end();

    // Форматируем данные под формат NewsModal
    const formattedData = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      date: row.date ? row.date.toISOString().split('T')[0] : null,
      author: row.author,
      category: row.category,
      image: row.image
    }));

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error fetching modal data:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении данных для модального окна'
    });
  }
}

// Получение новостей (основной endpoint)
async function getNews(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const client = createDbClient();
  try {
    await client.connect();
    
    const {
      page = 1,
      limit = 10,
      category,
      featured,
      search,
      status = 'published'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE n.status = $1';
    let queryParams = [status];
    let paramCount = 1;

    // Фильтр по категории
    if (category) {
      paramCount++;
      whereClause += ` AND nc.name = $${paramCount}`;
      queryParams.push(category);
    }

    // Фильтр по featured
    if (featured !== undefined) {
      paramCount++;
      whereClause += ` AND n.is_featured = $${paramCount}`;
      queryParams.push(featured === 'true');
    }

    // Поиск по тексту
    if (search) {
      paramCount++;
      whereClause += ` AND (to_tsvector('russian', n.title || ' ' || n.content || ' ' || n.excerpt) @@ plainto_tsquery('russian', $${paramCount}) OR n.title ILIKE $${paramCount + 1} OR n.excerpt ILIKE $${paramCount + 2})`;
      queryParams.push(search, `%${search}%`, `%${search}%`);
      paramCount += 2;
    }

    // Основной запрос
    const query = `
      SELECT 
        n.id,
        n.title,
        n.content,
        n.excerpt,
        n.author,
        n.image_url,
        n.is_featured,
        n.publish_date,
        n.views_count,
        n.created_at,
        nc.name as category_name,
        nc.color_code as category_color,
        nc.icon as category_icon
      FROM news n
      JOIN news_categories nc ON n.category_id = nc.id
      ${whereClause}
      ORDER BY n.is_featured DESC, n.publish_date DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await client.query(query, queryParams);

    // Подсчет общего количества
    const countQuery = `
      SELECT COUNT(*) as total
      FROM news n
      JOIN news_categories nc ON n.category_id = nc.id
      ${whereClause}
    `;

    const countResult = await client.query(countQuery, queryParams.slice(0, -2));
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
    console.error('Error fetching news:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении новостей'
    });
  }
} 