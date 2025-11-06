module.exports = {
  apps: [
    {
      name: 'yoddle-api',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001  // Должен совпадать с PORT в .env
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // PM2 будет ждать, пока приложение полностью запустится
      wait_ready: true,
      listen_timeout: 10000, // 10 секунд на запуск
      kill_timeout: 5000, // 5 секунд на graceful shutdown
      // Для кастомного пути к логам раскомментируйте строки ниже:
      // error_file: '/var/log/pm2/yoddle-api-error.log',
      // out_file: '/var/log/pm2/yoddle-api-out.log',
    }
  ]
};

