const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const validator = require('validator');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'yoddle_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// =====================================================
// POST /api/landing/submit - Сохранение лида с лендинга
// =====================================================
router.post('/submit', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      company_size,
      role,
      message,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      page_url,
      referrer
    } = req.body;

    // Валидация
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный email'
      });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Укажите ваше имя'
      });
    }

    // IP адрес
    const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];

    // Сохранение в единую таблицу leads
    const leadResult = await pool.query(
      `INSERT INTO leads (
        name, email, phone, company, company_size, role, message,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        page_url, referrer, ip_address, user_agent, 
        source, status, lead_score
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (email) 
      DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        company = EXCLUDED.company,
        company_size = EXCLUDED.company_size,
        role = EXCLUDED.role,
        message = EXCLUDED.message,
        utm_source = EXCLUDED.utm_source,
        utm_medium = EXCLUDED.utm_medium,
        utm_campaign = EXCLUDED.utm_campaign,
        lead_score = leads.lead_score + 10,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        name, email, phone || null, company || null, company_size || null,
        role || null, message || null,
        utm_source || null, utm_medium || null, utm_campaign || null,
        utm_content || null, utm_term || null,
        page_url || null, referrer || null, ip_address, user_agent,
        'landing', 'new', 50 // начальный lead_score 50 для лендинга
      ]
    );

    const lead = leadResult.rows[0];

    // Уведомление админу (если настроено)
    if (process.env.ADMIN_EMAIL) {
      // TODO: Отправить email уведомление
    }

    // Ответ
    res.json({
      success: true,
      message: 'Спасибо! Мы свяжемся с вами в ближайшее время.',
      lead_id: lead.id,
      telegram_bot_url: `https://t.me/${process.env.BOT_USERNAME || 'YoddleBot'}?start=landing_${lead.id}`
    });

  } catch (error) {
    console.error('Error saving landing lead:', error);
    
    if (error.code === '23505') { // Duplicate email
      return res.status(409).json({
        success: false,
        error: 'Этот email уже зарегистрирован'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Ошибка сервера. Попробуйте позже.'
    });
  }
});

// =====================================================
// GET /api/landing/stats - Статистика лидов с лендинга
// =====================================================
router.get('/stats', async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
    if (period === '30d') dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
    if (period === '90d') dateFilter = "created_at >= NOW() - INTERVAL '90 days'";

    // Общая статистика для лендинга
    const totalResult = await pool.query(
      `SELECT 
        COUNT(*) as total_leads,
        COUNT(DISTINCT email) as unique_emails,
        COUNT(*) FILTER (WHERE status = 'converted') as converted,
        ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'converted') / NULLIF(COUNT(*), 0), 2) as conversion_rate
      FROM leads
      WHERE source = 'landing' AND ${dateFilter}`
    );

    // По источникам (UTM)
    const bySourceResult = await pool.query(
      `SELECT 
        COALESCE(utm_source, 'direct') as utm_source,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'converted') as converted
      FROM leads
      WHERE source = 'landing' AND ${dateFilter}
      GROUP BY utm_source
      ORDER BY count DESC`
    );

    // По дням
    const byDayResult = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM leads
      WHERE source = 'landing' AND ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC`
    );

    res.json({
      success: true,
      period,
      total: totalResult.rows[0],
      by_source: bySourceResult.rows,
      by_day: byDayResult.rows
    });

  } catch (error) {
    console.error('Error getting landing stats:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

// =====================================================
// GET /api/landing/leads - Список лидов (для админки)
// =====================================================
router.get('/leads', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, source } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (source) {
      whereConditions.push(`utm_source = $${paramIndex}`);
      params.push(source);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    params.push(parseInt(limit), parseInt(offset));

    // Добавляем фильтр по source = 'landing'
    whereConditions.push(`source = 'landing'`);
    const whereClause2 = 'WHERE ' + whereConditions.join(' AND ');

    const result = await pool.query(
      `SELECT 
        id, name, email, phone, company, company_size, role,
        utm_source, utm_medium, utm_campaign,
        status, lead_score, created_at
      FROM leads
      ${whereClause2}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    // Общее количество
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM leads ${whereClause2}`,
      params.slice(0, -2)
    );

    res.json({
      success: true,
      leads: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error getting leads:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

module.exports = router;

