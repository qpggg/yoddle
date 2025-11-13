const path = require('path');

// Загружаем .env из корня проекта (yoddle1/.env)
require('dotenv').config({ 
  path: path.join(__dirname, '..', '..', '.env') 
});

// Пробуем также загрузить локальный .env если он есть
require('dotenv').config({ 
  path: path.join(__dirname, '..', '.env'),
  override: false // Не перезаписывать переменные из корневого .env
});

module.exports = {
  // Telegram
  botToken: process.env.BOT_TOKEN,
  adminChatId: process.env.ADMIN_CHAT_ID,

  // Database
  // Поддерживаем как PG_CONNECTION_STRING, так и отдельные переменные
  // Приоритет: PG_CONNECTION_STRING > DB_* > PG* > дефолты
  db: (() => {
    // Если есть PG_CONNECTION_STRING, используем его
    if (process.env.PG_CONNECTION_STRING) {
      console.log('✅ Telegram bot DB: Using PG_CONNECTION_STRING');
      return {
        connectionString: process.env.PG_CONNECTION_STRING
      };
    }
    
    // Иначе используем отдельные переменные (DB_* или PG*)
    const dbConfig = {
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
      database: process.env.DB_NAME || process.env.PGDATABASE || 'yoddle_db',
      user: process.env.DB_USER || process.env.PGUSER || 'yoddle_user', // Изменено с 'postgres' на 'yoddle_user'
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
    };
    
    // Предупреждение если используется дефолтный пользователь без пароля
    if (!process.env.DB_USER && !process.env.PGUSER && !process.env.DB_PASSWORD && !process.env.PGPASSWORD) {
      console.warn('⚠️ Telegram bot DB: Using default config. Set PG_CONNECTION_STRING or DB_*/PG* variables!');
    } else {
      console.log(`✅ Telegram bot DB: Using separate config (user: ${dbConfig.user}, host: ${dbConfig.host}, db: ${dbConfig.database})`);
    }
    
    return dbConfig;
  })(),

  // API
  // На продакшене должен быть реальный URL, не localhost
  apiBaseUrl: process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://yoddle.ru' : 'http://localhost:3000'),
  webUrl: process.env.YODDLE_WEB_URL || 'https://yoddle.ru',

  // Presentation
  presentationUrl: process.env.PRESENTATION_URL || 'https://yoddle.ru/yoddle.pdf',
  presentationLocalPath: process.env.PRESENTATION_LOCAL_PATH || null, // Путь к локальному файлу (для разработки)

  // AI
  claudeApiKey: process.env.CLAUDE_API_KEY,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
};

// Диагностика: проверяем наличие AI ключей
console.log('🔍 Telegram Bot AI Config:');
console.log('  CLAUDE_API_KEY:', module.exports.claudeApiKey ? `✅ Set (${module.exports.claudeApiKey.substring(0, 10)}...)` : '❌ Missing');
console.log('  OPENROUTER_API_KEY:', module.exports.openRouterApiKey ? `✅ Set (${module.exports.openRouterApiKey.substring(0, 10)}...)` : '❌ Missing');

if (!module.exports.claudeApiKey && !module.exports.openRouterApiKey) {
  console.error('⚠️ ВНИМАНИЕ: Ни один AI API ключ не установлен! Telegram бот будет использовать только rule-based ответы.');
  console.error('💡 Установите CLAUDE_API_KEY или OPENROUTER_API_KEY в переменных окружения.');
}

