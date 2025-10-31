module.exports = {
  apps: [
    {
      name: 'yoddle-telegram-bot',
      script: './src/bot-simple.js',
      cwd: '/var/www/yoddle/telegram-bot',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/telegram-bot-error.log',
      out_file: '/var/log/pm2/telegram-bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};

