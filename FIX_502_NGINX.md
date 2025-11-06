# 🔧 РЕШЕНИЕ ОШИБКИ 502 NGINX

## ❌ Проблема:

502 Bad Gateway - Nginx не может подключиться к приложению.

## 🔍 ДИАГНОСТИКА:

### ШАГ 1: Проверьте статус процессов PM2

```bash
pm2 status
```

Должны быть запущены:
- `yoddle-api` - статус должен быть `online`
- `yoddle-tg` - статус должен быть `online`

### ШАГ 2: Проверьте логи приложения

```bash
# Логи основного приложения
pm2 logs yoddle-api --lines 50

# Логи бота
pm2 logs yoddle-tg --lines 50

# Или все логи сразу
pm2 logs --lines 50
```

Ищите ошибки:
- Ошибки подключения к БД
- Ошибки синтаксиса в .env
- Ошибки порта (PORT=3001 vs PORT=3000)

### ШАГ 3: Проверьте подключение к БД

```bash
# Проверьте, что БД доступна
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT version();"
```

### ШАГ 4: Проверьте, на каком порту работает приложение

```bash
# Проверьте, слушает ли приложение на порту
netstat -tlnp | grep :3001
# ИЛИ
netstat -tlnp | grep :3000
```

---

## ✅ РЕШЕНИЯ:

### Решение 1: Перезапустите приложения

```bash
# Остановите все процессы
pm2 stop all

# Удалите из PM2
pm2 delete all

# Запустите заново
cd /root/yoddle
pm2 start ecosystem.config.js

# ИЛИ если нет ecosystem.config.js в корне:
pm2 start server.js --name yoddle-api
cd telegram-bot
pm2 start ecosystem.config.js
```

### Решение 2: Проверьте .env файл на ошибки

```bash
# Проверьте синтаксис .env файла
cd /root/yoddle
cat .env | grep -v "^#" | grep -v "^$"

# Убедитесь, что нет лишних пробелов или кавычек
```

### Решение 3: Проверьте конфигурацию Nginx

```bash
# Проверьте конфигурацию Nginx
nginx -t

# Проверьте, на какой порт проксирует Nginx
cat /etc/nginx/sites-available/default | grep proxy_pass
# ИЛИ
cat /etc/nginx/sites-enabled/* | grep proxy_pass
```

Nginx должен проксировать на тот же порт, что указан в .env (PORT=3001 или PORT=3000).

### Решение 4: Проверьте, что приложение запускается вручную

```bash
# Попробуйте запустить приложение вручную для проверки ошибок
cd /root/yoddle
node server.js
```

Если есть ошибки - они будут видны в консоли.

---

## 🎯 БЫСТРОЕ РЕШЕНИЕ:

```bash
# 1. Проверьте статус
pm2 status

# 2. Перезапустите приложения
pm2 restart all

# 3. Проверьте логи
pm2 logs yoddle-api --lines 30

# 4. Если не помогло - перезапустите Nginx
systemctl restart nginx
```

---

## 📋 ЧЕКЛИСТ:

- [ ] PM2 процессы запущены (`pm2 status` показывает `online`)
- [ ] Нет ошибок в логах (`pm2 logs`)
- [ ] БД доступна (проверка подключения прошла)
- [ ] Порт в .env совпадает с портом в Nginx конфиге
- [ ] Nginx конфигурация правильная (`nginx -t`)

Выполните диагностику и сообщите результаты!

