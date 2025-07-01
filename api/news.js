import express from 'express';
import { Client } from 'pg';

const router = express.Router();

// Функция для создания клиента БД (как в server.js)
function createDbClient() {
  const connectionString = 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';
  
  return new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

// =====================================================
// ENDPOINTS ДЛЯ КАТЕГОРИЙ НОВОСТЕЙ
// =====================================================

// Получить все категории
router.get('/categories', async (req, res) => {
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
});

// =====================================================
// ENDPOINTS ДЛЯ НОВОСТЕЙ
// =====================================================

// Получить все новости с фильтрацией и пагинацией
router.get('/', async (req, res) => {
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

    // Поиск по тексту (PostgreSQL полнотекстовый поиск)
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
});

// Получить новость по ID
router.get('/:id', async (req, res) => {
  const client = createDbClient();
  try {
    await client.connect();
    
    const { id } = req.params;
    const { increment_views = 'true' } = req.query;

    const result = await client.query(`
      SELECT 
        n.id,
        n.title,
        n.content,
        n.excerpt,
        n.author,
        n.image_url,
        n.status,
        n.is_featured,
        n.publish_date,
        n.views_count,
        n.created_at,
        n.updated_at,
        nc.name as category_name,
        nc.color_code as category_color,
        nc.icon as category_icon
      FROM news n
      JOIN news_categories nc ON n.category_id = nc.id
      WHERE n.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      await client.end();
      return res.status(404).json({
        success: false,
        error: 'Новость не найдена'
      });
    }

    // Увеличиваем счетчик просмотров
    if (increment_views === 'true' && result.rows[0].status === 'published') {
      await client.query('SELECT increment_news_views($1)', [id]);
      result.rows[0].views_count += 1;
    }

    await client.end();

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching news by ID:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении новости'
    });
  }
});

// Получить новости по категории
router.get('/category/:categoryName', async (req, res) => {
  const client = createDbClient();
  try {
    await client.connect();
    
    const { categoryName } = req.params;
    const { limit = 5 } = req.query;

    const result = await client.query('SELECT * FROM get_news_by_category($1, $2)', [categoryName, parseInt(limit)]);

    await client.end();

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching news by category:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении новостей категории'
    });
  }
});

// Получить рекомендуемые новости
router.get('/featured/recommendations', async (req, res) => {
  const client = createDbClient();
  try {
    await client.connect();
    
    const { limit = 3 } = req.query;

    const result = await client.query(`
      SELECT 
        n.id,
        n.title,
        n.excerpt,
        n.image_url,
        n.publish_date,
        nc.name as category_name,
        nc.color_code as category_color,
        nc.icon as category_icon
      FROM news n
      JOIN news_categories nc ON n.category_id = nc.id
      WHERE n.status = 'published' AND n.is_featured = TRUE
      ORDER BY n.publish_date DESC
      LIMIT $1
    `, [parseInt(limit)]);

    await client.end();

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching featured news:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении рекомендуемых новостей'
    });
  }
});

// =====================================================
// АДМИНИСТРАТИВНЫЕ ENDPOINTS (требуют авторизации)
// =====================================================

// Middleware для проверки admin прав
const requireAdmin = (req, res, next) => {
  // TODO: Реализовать проверку JWT токена и admin роли
  // Пока что пропускаем для development
  next();
};

// Создать новость
router.post('/', requireAdmin, async (req, res) => {
  const client = createDbClient();
  try {
    await client.connect();
    
    const {
      title,
      content,
      excerpt,
      category_id,
      author,
      image_url,
      status = 'draft',
      is_featured = false,
      publish_date
    } = req.body;

    // Валидация обязательных полей
    if (!title || !content || !category_id || !author) {
      await client.end();
      return res.status(400).json({
        success: false,
        error: 'Не заполнены обязательные поля: title, content, category_id, author'
      });
    }

    const result = await client.query(`
      INSERT INTO news (title, content, excerpt, category_id, author, image_url, status, is_featured, publish_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [title, content, excerpt, category_id, author, image_url, status, is_featured, publish_date]);

    // Получаем созданную новость
    const newNewsResult = await client.query(`
      SELECT 
        n.*,
        nc.name as category_name,
        nc.color_code as category_color
      FROM news n
      JOIN news_categories nc ON n.category_id = nc.id
      WHERE n.id = $1
    `, [result.rows[0].id]);

    await client.end();

    res.status(201).json({
      success: true,
      data: newNewsResult.rows[0],
      message: 'Новость успешно создана'
    });

  } catch (error) {
    console.error('Error creating news:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании новости'
    });
  }
});

// Обновить новость
router.put('/:id', requireAdmin, async (req, res) => {
  const client = createDbClient();
  try {
    await client.connect();
    
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      category_id,
      author,
      image_url,
      status,
      is_featured,
      publish_date
    } = req.body;

    // Проверяем существование новости
    const existing = await client.query('SELECT id FROM news WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.end();
      return res.status(404).json({
        success: false,
        error: 'Новость не найдена'
      });
    }

    await client.query(`
      UPDATE news 
      SET title = $1, content = $2, excerpt = $3, category_id = $4, 
          author = $5, image_url = $6, status = $7, is_featured = $8, 
          publish_date = $9, updated_at = NOW()
      WHERE id = $10
    `, [title, content, excerpt, category_id, author, image_url, status, is_featured, publish_date, id]);

    // Получаем обновленную новость
    const updatedNewsResult = await client.query(`
      SELECT 
        n.*,
        nc.name as category_name,
        nc.color_code as category_color
      FROM news n
      JOIN news_categories nc ON n.category_id = nc.id
      WHERE n.id = $1
    `, [id]);

    await client.end();

    res.json({
      success: true,
      data: updatedNewsResult.rows[0],
      message: 'Новость успешно обновлена'
    });

  } catch (error) {
    console.error('Error updating news:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении новости'
    });
  }
});

// Удалить новость
router.delete('/:id', requireAdmin, async (req, res) => {
  const client = createDbClient();
  try {
    await client.connect();
    
    const { id } = req.params;

    // Проверяем существование новости
    const existing = await client.query('SELECT id FROM news WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.end();
      return res.status(404).json({
        success: false,
        error: 'Новость не найдена'
      });
    }

    await client.query('DELETE FROM news WHERE id = $1', [id]);
    await client.end();

    res.json({
      success: true,
      message: 'Новость успешно удалена'
    });

  } catch (error) {
    console.error('Error deleting news:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при удалении новости'
    });
  }
});

// =====================================================
// АНАЛИТИКА И СТАТИСТИКА
// =====================================================

// Получить статистику новостей
router.get('/analytics/stats', async (req, res) => {
  const client = createDbClient();
  try {
    await client.connect();
    
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_news,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_news,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_news,
        COUNT(CASE WHEN is_featured = TRUE THEN 1 END) as featured_news,
        COALESCE(SUM(views_count), 0) as total_views,
        COALESCE(AVG(views_count), 0) as avg_views
      FROM news
    `);

    const categoryStatsResult = await client.query('SELECT * FROM category_stats');

    await client.end();

    res.json({
      success: true,
      data: {
        overall: statsResult.rows[0],
        by_category: categoryStatsResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching news analytics:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении аналитики'
    });
  }
});

// Получить топ новостей по просмотрам
router.get('/analytics/top-viewed', async (req, res) => {
  const client = createDbClient();
  try {
    await client.connect();
    
    const { limit = 10 } = req.query;

    const result = await client.query(`
      SELECT 
        n.id,
        n.title,
        n.views_count,
        n.publish_date,
        nc.name as category_name,
        nc.color_code as category_color
      FROM news n
      JOIN news_categories nc ON n.category_id = nc.id
      WHERE n.status = 'published'
      ORDER BY n.views_count DESC
      LIMIT $1
    `, [parseInt(limit)]);

    await client.end();

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching top viewed news:', error);
    await client.end();
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении популярных новостей'
    });
  }
});

// =====================================================
// ENDPOINT ДЛЯ FRONTEND
// =====================================================

// Endpoint для получения данных для NewsModal
router.get('/frontend/modal-data', async (req, res) => {
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
      date: row.date ? row.date.toISOString().split('T')[0] : null, // YYYY-MM-DD format
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
});

export default router; 