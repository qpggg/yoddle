const { Pool } = require('pg');
const config = require('../config');

// Создаем pool с обработкой ошибок подключения
// Используем ту же строку подключения, что и основной сайт (PG_CONNECTION_STRING)
let pool;
try {
  // Pool автоматически поддерживает как connectionString, так и отдельные параметры
  pool = new Pool(config.db);
  
  // Логируем успешное подключение (без пароля)
  if (config.db.connectionString) {
    try {
      const url = new URL(config.db.connectionString);
      if (url.password) url.password = '****';
      console.log(`✅ Telegram bot DB: Connected using PG_CONNECTION_STRING`);
    } catch {
      console.log(`✅ Telegram bot DB: Connected using connectionString`);
    }
  } else {
    console.log(`✅ Telegram bot DB: Connected to ${config.db.host}:${config.db.port}/${config.db.database}`);
  }
  
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
    utm_source,
    source = 'telegram' // Используем переданное значение или 'telegram' по умолчанию
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
      source, // Используем переданное значение source
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

// Проверка лимита использования ИИ-советника (максимум 3 раза в день для обычных пользователей)
async function checkAIUsageLimit(telegramId, isAdmin = false) {
  // Лимит строго 3 запроса в день
  const MAX_REQUESTS_PER_DAY = 3;
  const defaultResult = { allowed: true, count: 0, limit: MAX_REQUESTS_PER_DAY };
  
  if (isAdmin) {
    return { allowed: true, count: 0, limit: Infinity };
  }

  if (!pool) {
    // Если БД недоступна, разрешаем использование (API также проверит лимит)
    return defaultResult;
  }

  try {
    // Получаем количество использований за сегодня
    // Используем ту же логику, что и в API: проверяем по telegram_id в поле data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const query = `
      SELECT COUNT(*) as count 
      FROM ai_signals 
      WHERE user_id = 1
      AND type = 'mood' 
      AND timestamp >= $1
      AND data->>'telegram_id' = $2
    `;
    
    const result = await pool.query(query, [today, String(telegramId)]);
    
    if (!result || !result.rows || !result.rows[0]) {
      return defaultResult;
    }
    
    const count = parseInt(result.rows[0].count) || 0;
    
    return {
      allowed: count < MAX_REQUESTS_PER_DAY,
      count: count,
      limit: MAX_REQUESTS_PER_DAY
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
    // В случае ошибки разрешаем использование (API также проверит лимит)
    return defaultResult;
  }
}

// Увеличение счетчика использования ИИ-советника
async function incrementAIUsage(telegramId) {
  if (!pool) {
    return false;
  }

  try {
    const query = `
      UPDATE leads 
      SET 
        ai_advisor_uses = COALESCE(ai_advisor_uses, 0) + 1,
        ai_advisor_last_used_at = CURRENT_TIMESTAMP,
        last_bot_activity = CURRENT_TIMESTAMP,
        bot_messages_count = COALESCE(bot_messages_count, 0) + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE telegram_id = $1
      RETURNING ai_advisor_uses;
    `;
    
    const result = await pool.query(query, [telegramId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Error incrementing AI usage:', error.message);
    return false;
  }
}

// Обновление запроса презентации
async function updatePresentationRequested(telegramId) {
  if (!pool) {
    return false;
  }

  try {
    const query = `
      UPDATE leads 
      SET 
        presentation_requested = TRUE,
        presentation_requested_at = CURRENT_TIMESTAMP,
        last_bot_activity = CURRENT_TIMESTAMP,
        bot_messages_count = COALESCE(bot_messages_count, 0) + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE telegram_id = $1
      RETURNING id;
    `;
    
    const result = await pool.query(query, [telegramId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Error updating presentation requested:', error.message);
    return false;
  }
}

// Обновление записи на демо
async function updateDemoScheduled(telegramId) {
  if (!pool) {
    return false;
  }

  try {
    const query = `
      UPDATE leads 
      SET 
        demo_scheduled = TRUE,
        demo_scheduled_at = CURRENT_TIMESTAMP,
        last_bot_activity = CURRENT_TIMESTAMP,
        bot_messages_count = COALESCE(bot_messages_count, 0) + 1,
        updated_at = CURRENT_TIMESTAMP,
        status = CASE 
          WHEN status = 'new' THEN 'demo'
          ELSE status
        END
      WHERE telegram_id = $1
      RETURNING id;
    `;
    
    const result = await pool.query(query, [telegramId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Error updating demo scheduled:', error.message);
    return false;
  }
}

// Увеличение счетчика просмотров демо модулей
async function incrementDemoViews(telegramId, moduleName) {
  if (!pool) {
    return false;
  }

  try {
    // Определяем какое поле обновлять в зависимости от модуля
    let fieldToUpdate = 'demo_views_count';
    
    switch (moduleName) {
      case 'benefits':
        fieldToUpdate = 'demo_benefits_views';
        break;
      case 'ai':
        fieldToUpdate = 'demo_ai_views';
        break;
      case 'gamification':
        fieldToUpdate = 'demo_gamification_views';
        break;
      case 'analytics':
        fieldToUpdate = 'demo_analytics_views';
        break;
    }

    const query = `
      UPDATE leads 
      SET 
        ${fieldToUpdate} = COALESCE(${fieldToUpdate}, 0) + 1,
        demo_views_count = COALESCE(demo_views_count, 0) + 1,
        last_bot_activity = CURRENT_TIMESTAMP,
        bot_messages_count = COALESCE(bot_messages_count, 0) + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE telegram_id = $1
      RETURNING ${fieldToUpdate};
    `;
    
    const result = await pool.query(query, [telegramId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Error incrementing demo views:', error.message);
    return false;
  }
}

// Обновление клика по ссылке на сайт
async function updateWebsiteClick(telegramId) {
  if (!pool) {
    return false;
  }

  try {
    const query = `
      UPDATE leads 
      SET 
        website_clicks = COALESCE(website_clicks, 0) + 1,
        website_last_click_at = CURRENT_TIMESTAMP,
        last_bot_activity = CURRENT_TIMESTAMP,
        bot_messages_count = COALESCE(bot_messages_count, 0) + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE telegram_id = $1
      RETURNING website_clicks;
    `;
    
    const result = await pool.query(query, [telegramId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Error updating website click:', error.message);
    return false;
  }
}

// Обновление последней активности в боте (при любом взаимодействии)
async function updateLastBotActivity(telegramId) {
  if (!pool) {
    return false;
  }

  try {
    const query = `
      UPDATE leads 
      SET 
        last_bot_activity = CURRENT_TIMESTAMP,
        bot_messages_count = COALESCE(bot_messages_count, 0) + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE telegram_id = $1
      RETURNING id;
    `;
    
    const result = await pool.query(query, [telegramId]);
    return result.rows.length > 0;
  } catch (error) {
    // Не логируем ошибку, чтобы не засорять логи при каждом сообщении
    return false;
  }
}

module.exports = {
  initDatabase,
  saveLead,
  getLeadByTelegramId,
  getAllLeads,
  checkAIUsageLimit,
  incrementAIUsage,
  updatePresentationRequested,
  updateDemoScheduled,
  incrementDemoViews,
  updateWebsiteClick,
  updateLastBotActivity
};

