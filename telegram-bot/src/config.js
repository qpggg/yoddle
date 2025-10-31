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
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'yoddle_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  },

  // API
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
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

