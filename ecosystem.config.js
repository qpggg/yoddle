module.exports = {
  apps: [
    {
      name: 'yoddle-api',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // Для кастомного пути к логам раскомментируйте строки ниже:
      // error_file: '/var/log/pm2/yoddle-api-error.log',
      // out_file: '/var/log/pm2/yoddle-api-out.log',
    }
  ]
};

