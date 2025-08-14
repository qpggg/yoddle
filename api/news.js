import express from 'express';
import { createDbClient } from '../db.js';

// Экспресс-роутер для /api/news
const router = express.Router();

// GET /api/news (список новостей) + поддержка action=modal-data для обратной совместимости
router.get('/', async (req, res) => {
  try {
    if (req.query && req.query.action === 'modal-data') {
      return await getModalData(req, res);
    }
    return await getNews(req, res);
  } catch (e) {
    console.error('News root handler error:', e);
    return res.status(500).json({ success: false, error: 'Ошибка при загрузке новостей' });
  }
});

// GET /api/news/categories
router.get('/categories', async (req, res) => {
  await getCategories(req, res);
});

// GET /api/news/modal-data
router.get('/modal-data', async (req, res) => {
  await getModalData(req, res);
});

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
        n.excerpt,
        n.author,
        n.publish_date,
        n.created_at,
        n.updated_at,
        n.is_featured,
        n.status,
        n.views_count,
        n.image_url,
        nc.id AS category_id,
        nc.name AS category,
        nc.description AS category_description,
        nc.color_code AS category_color,
        nc.icon AS category_icon
      FROM news n
      JOIN news_categories nc ON n.category_id = nc.id
      WHERE n.status = 'published'
      ORDER BY n.is_featured DESC, COALESCE(n.publish_date, n.created_at) DESC
      LIMIT $1
    `, [parseInt(limit)]);

    await client.end();

    // Форматируем данные под формат NewsModal
    const formattedData = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt || null,
      author: row.author,
      date: (row.publish_date || row.created_at) ? new Date(row.publish_date || row.created_at).toISOString() : null,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      isFeatured: !!row.is_featured,
      status: row.status,
      views: row.views_count,
      image: row.image_url || null,
      categoryId: row.category_id,
      category: row.category,
      categoryDescription: row.category_description,
      categoryColor: row.category_color,
      categoryIcon: row.category_icon
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

export default router;