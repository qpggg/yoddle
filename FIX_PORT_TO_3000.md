# 🔧 ИСПРАВЛЕНИЕ: Приложение должно работать на порту 3000

## ❌ Проблема:

В nginx конфиге:
- Основной сайт (yoddle.ru) проксирует на **порт 3000** ✅
- Но есть лишний блок, который слушает на **порту 3001** ❌
- Приложение настроено на **порт 3001**, но nginx уже занял этот порт

## ✅ РЕШЕНИЕ:

### ШАГ 1: Измените порт приложения на 3000

```bash
cd /root/yoddle
nano ecosystem.config.cjs
```

Измените:
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3000  // Было 3001, меняем на 3000
},
```

### ШАГ 2: Проверьте .env файл

```bash
nano .env
```

Убедитесь, что там:
```env
PORT=3000
```

Если там `PORT=3001`, измените на `PORT=3000`.

### ШАГ 3: Удалите лишний блок из nginx конфига

```bash
nano /etc/nginx/sites-enabled/yoddle
```

**УДАЛИТЕ** весь блок:
```nginx
server {
    listen 3001;
    server_name 185.185.69.254;
    ...
}
```

**ОСТАВЬТЕ ТОЛЬКО:**
```nginx
# HTTPS блок (основной сайт)
server {
    server_name yoddle.ru www.yoddle.ru;
    location / {
        proxy_pass http://127.0.0.1:3000;  # Уже правильно!
        proxy_set_header Host $host;
    }
    listen 443 ssl;
    # ... остальное
}

# HTTP → HTTPS редирект
server {
    if ($host = www.yoddle.ru) {
        return 301 https://$host$request_uri;
    }
    if ($host = yoddle.ru) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name yoddle.ru www.yoddle.ru;
    return 404;
}
```

### ШАГ 4: Проверьте конфигурацию nginx

```bash
nginx -t
```

Должно быть: `syntax is ok` и `test is successful`

### ШАГ 5: Перезагрузите nginx

```bash
systemctl reload nginx
```

### ШАГ 6: Проверьте, что порт 3001 свободен

```bash
lsof -i :3001
```

Должно быть пусто (nginx больше не должен слушать на 3001).

### ШАГ 7: Остановите старые процессы PM2

```bash
pm2 stop all
pm2 delete all
```

### ШАГ 8: Запустите приложение на порту 3000

```bash
cd /root/yoddle
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs yoddle-api --lines 30
```

---

## 🎯 БЫСТРОЕ РЕШЕНИЕ (все команды):

```bash
# 1. Измените порт в ecosystem.config.cjs
cd /root/yoddle
sed -i 's/PORT: 3001/PORT: 3000/' ecosystem.config.cjs

# 2. Измените порт в .env (если там 3001)
sed -i 's/^PORT=3001$/PORT=3000/' .env

# 3. Удалите блок listen 3001 из nginx
# (откройте файл и удалите блок вручную)
nano /etc/nginx/sites-enabled/yoddle

# 4. Проверьте и перезагрузите nginx
nginx -t
systemctl reload nginx

# 5. Убейте процессы nginx на 3001 (если остались)
kill -9 712 713 714 2>/dev/null || true

# 6. Проверьте порты
lsof -i :3001  # должно быть пусто
lsof -i :3000  # должен быть Node.js процесс

# 7. Перезапустите приложение
pm2 stop all
pm2 delete all
pm2 start ecosystem.config.cjs
pm2 status
```

---

## 📋 ЧЕКЛИСТ:

- [ ] Порт в `ecosystem.config.cjs` изменен на 3000
- [ ] Порт в `.env` изменен на 3000 (если там был 3001)
- [ ] Удален блок `server { listen 3001; ... }` из nginx
- [ ] Конфигурация nginx проверена (`nginx -t`)
- [ ] Nginx перезагружен
- [ ] Порт 3001 свободен
- [ ] Приложение запущено на порту 3000
- [ ] Сайт работает через nginx на 80/443

Выполните команды и сообщите результат!

