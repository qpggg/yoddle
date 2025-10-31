const { Pool } = require('pg');
const config = require('../config');

// Создаем pool с обработкой ошибок подключения
let pool;
try {
  pool = new Pool(config.db);
  
  // Обработка ошибок подключения pool
  pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle database client:', err);
  });
} catch (error) {
  console.error('❌ Error creating database pool:', error);
  pool = null;
}

// Инициализация таблицы для лидов (упрощенная версия)
async function initDatabase() {
  if (!pool) {
    console.warn('⚠️ Database pool not available, skipping initialization');
    return false;
  }

  // Таблица создается через database_leads_simple.sql
  // Эта функция просто проверяет подключение
  try {
    await pool.query('SELECT 1 FROM leads LIMIT 1');
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    console.log('💡 Run: psql -f database_leads_simple.sql');
    console.log('⚠️ Bot will continue without database connection');
    // Не бросаем ошибку, чтобы бот мог работать без БД
    return false;
  }
}

// Сохранение лида (упрощенная версия - одна таблица)
async function saveLead(leadData) {
  if (!pool) {
    console.warn('⚠️ Database pool not available, skipping save');
    return null;
  }

  const {
    telegram_id,
    username,
    first_name,
    last_name,
    role,
    email,
    interests,
    utm_source
  } = leadData;

  // Формируем имя из telegram данных
  const name = [first_name, last_name].filter(Boolean).join(' ') || first_name;

  const query = `
    INSERT INTO leads (
      name, email, telegram_id, telegram_username, 
      telegram_first_name, telegram_last_name,
      role, interests, source, utm_source, 
      status, lead_score
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (telegram_id) 
    DO UPDATE SET
      telegram_username = EXCLUDED.telegram_username,
      telegram_first_name = EXCLUDED.telegram_first_name,
      telegram_last_name = EXCLUDED.telegram_last_name,
      role = EXCLUDED.role,
      email = EXCLUDED.email,
      interests = EXCLUDED.interests,
      utm_source = EXCLUDED.utm_source,
      lead_score = leads.lead_score + 5,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [
      name,
      email,
      telegram_id,
      username,
      first_name,
      last_name,
      role,
      interests || [],
      'telegram', // source
      utm_source || 'telegram_direct',
      'new', // status
      60 // начальный lead_score для telegram лидов
    ]);

    console.log('✅ Lead saved:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error saving lead:', error.message);
    // Не бросаем ошибку, чтобы бот продолжал работать
    return null;
  }
}

// Получение лида по telegram_id
async function getLeadByTelegramId(telegramId) {
  if (!pool) {
    console.warn('⚠️ Database pool not available, returning null');
    return null;
  }

  const query = 'SELECT * FROM leads WHERE telegram_id = $1';
  
  try {
    const result = await pool.query(query, [telegramId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error getting lead:', error.message);
    // Не бросаем ошибку, возвращаем null чтобы бот продолжал работать
    return null;
  }
}

// Получение всех лидов из telegram
async function getAllLeads() {
  if (!pool) {
    console.warn('⚠️ Database pool not available, returning empty array');
    return [];
  }

  const query = "SELECT * FROM leads WHERE source = 'telegram' ORDER BY created_at DESC";
  
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('❌ Error getting leads:', error.message);
    // Не бросаем ошибку, возвращаем пустой массив
    return [];
  }
}

// Проверка лимита использования ИИ-советника (3 раза в день для обычных пользователей)
async function checkAIUsageLimit(telegramId, isAdmin = false) {
  // Всегда возвращаем объект, даже при ошибке
  const defaultResult = { allowed: true, count: 0, limit: 3 };
  
  if (isAdmin) {
    return { allowed: true, count: 0, limit: Infinity };
  }

  if (!pool) {
    // Если БД недоступна, используем session как fallback
    return defaultResult;
  }

  try {
    // Получаем количество использований за сегодня
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const query = `
      SELECT COUNT(*) as count 
      FROM ai_signals 
      WHERE user_id = $1 
      AND type = 'mood' 
      AND timestamp >= $2
    `;
    
    const result = await pool.query(query, [telegramId, today]);
    
    if (!result || !result.rows || !result.rows[0]) {
      return defaultResult;
    }
    
    const count = parseInt(result.rows[0].count) || 0;
    const limit = 3;
    
    return {
      allowed: count < limit,
      count: count,
      limit: limit
    };
  } catch (error) {
    // Логируем только сообщение ошибки, без полного объекта
    // Используем безопасное преобразование для избежания проблем с кодировкой
    let errorMessage = 'Неизвестная ошибка';
    try {
      if (error?.message) {
        errorMessage = String(error.message).substring(0, 200);
      } else if (typeof error === 'string') {
        errorMessage = error.substring(0, 200);
      } else {
        errorMessage = String(error).substring(0, 200);
      }
    } catch (e) {
      errorMessage = 'Ошибка при обработке сообщения об ошибке';
    }
    
    console.error('❌ Error checking AI usage limit:', errorMessage);
    // В случае ошибки разрешаем использование (лучше позволить использовать, чем заблокировать из-за ошибки БД)
    return defaultResult;
  }
}

// Увеличение счетчика использования ИИ-советника
async function incrementAIUsage(telegramId) {
  if (!pool) {
    return false;
  }

  try {
    // Счетчик увеличивается автоматически при создании записи в ai_signals через API
    // Но мы можем добавить отдельную таблицу для счетчиков, если нужно
    return true;
  } catch (error) {
    console.error('❌ Error incrementing AI usage:', error.message);
    return false;
  }
}

module.exports = {
  initDatabase,
  saveLead,
  getLeadByTelegramId,
  getAllLeads,
  checkAIUsageLimit,
  incrementAIUsage
};

