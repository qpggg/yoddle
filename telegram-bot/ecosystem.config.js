module.exports = {
  apps: [
    {
      name: 'yoddle-tg',
      script: './src/bot-simple.js', // Используйте bot.js для полного функционала со Scenes
      // cwd будет автоматически установлен в папку, где находится ecosystem.config.js
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      // Логи сохраняются в текущей папке или в ~/.pm2/logs/
      // Для кастомного пути раскомментируйте строки ниже:
      // error_file: '/var/log/pm2/telegram-bot-error.log',
      // out_file: '/var/log/pm2/telegram-bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      // Важно: PM2 автоматически загружает .env из текущей директории,
      // но бот также ищет .env в корне проекта (на два уровня выше)
      // Убедитесь, что .env файл существует в корне проекта (yoddle1/.env)
    }
  ]
};

