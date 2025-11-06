# 🔧 РЕШЕНИЕ ПОСТОЯННЫХ ПЕРЕЗАПУСКОВ

## ❌ Проблема:

Приложение постоянно перезапускается после успешного запуска. Получает SIGINT и падает.

## 🔍 ВОЗМОЖНЫЕ ПРИЧИНЫ:

1. **Несоответствие портов**: В `ecosystem.config.js` указан `PORT: 3000`, а в `.env` может быть `PORT=3001`
2. **Ошибка в `ensureWalletSchema`**: Функция вызывается при запросах и может падать
3. **Ошибка подключения к БД**: После запуска происходит ошибка подключения
4. **Неправильный процесс PM2**: Запущен процесс `server` вместо `yoddle-api`

---

## ✅ РЕШЕНИЕ:

### ШАГ 1: Проверьте, какой процесс запущен

```bash
pm2 list
pm2 describe server
pm2 describe yoddle-api
```

### ШАГ 2: Проверьте полные логи с ошибками

```bash
# Логи процесса server
pm2 logs server --lines 100 --err

# ИЛИ логи yoddle-api
pm2 logs yoddle-api --lines 100 --err

# Все ошибки
pm2 logs --err --lines 100
```

Ищите ошибки после строки "🎯 Recommendations API: Available at /api/user-recommendations"

### ШАГ 3: Проверьте несоответствие портов

```bash
# Проверьте порт в .env
grep PORT /root/yoddle/.env

# Проверьте порт в ecosystem.config.js
grep PORT /root/yoddle/ecosystem.config.js

# Проверьте, на каком порту проксирует Nginx
grep proxy_pass /etc/nginx/sites-enabled/*
```

**Порты должны совпадать!**

### ШАГ 4: Исправьте ecosystem.config.js

```bash
cd /root/yoddle
nano ecosystem.config.js
```

Убедитесь, что порт совпадает с .env:

```javascript
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
    }
  ]
};
```

### ШАГ 5: Остановите все процессы и запустите заново

```bash
# Остановите все процессы
pm2 stop all
pm2 delete all

# Запустите правильный процесс
cd /root/yoddle
pm2 start ecosystem.config.js

# Проверьте статус
pm2 status

# Проверьте логи
pm2 logs yoddle-api --lines 50
```

### ШАГ 6: Проверьте ошибки в ensureWalletSchema

Если ошибки связаны с БД, проверьте подключение:

```bash
# Проверьте подключение к БД
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT 1;"

# Проверьте таблицу user_balance
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\d user_balance"
```

---

## 🎯 БЫСТРОЕ РЕШЕНИЕ:

```bash
# 1. Остановите все
pm2 stop all
pm2 delete all

# 2. Проверьте порт в .env
grep PORT /root/yoddle/.env

# 3. Обновите ecosystem.config.js если нужно (PORT должен совпадать)

# 4. Запустите заново
cd /root/yoddle
pm2 start ecosystem.config.js

# 5. Проверьте логи
pm2 logs yoddle-api --lines 50 --err
```

---

## 📋 ЧЕКЛИСТ:

- [ ] Порты совпадают (.env и ecosystem.config.js)
- [ ] Запущен правильный процесс (yoddle-api, а не server)
- [ ] Нет ошибок в логах после запуска
- [ ] БД доступна
- [ ] Nginx проксирует на правильный порт

Выполните команды и сообщите результаты!

