# 🔧 РЕШЕНИЕ: Nginx слушает на порту 3001 (неправильная конфигурация)

## ❌ Проблема:

Nginx процессы (PIDs: 712, 713, 714) слушают на порту 3001, что блокирует запуск Node.js приложения.

**Правильная архитектура:**
- Nginx слушает на портах **80/443** (HTTP/HTTPS)
- Node.js приложение слушает на порту **3001** (внутренний)
- Nginx проксирует запросы с 80/443 → 3001

## ✅ РЕШЕНИЕ:

### ШАГ 1: Проверьте текущую конфигурацию Nginx

```bash
# Найдите конфигурационные файлы
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/sites-available/

# Проверьте основной конфиг
cat /etc/nginx/sites-enabled/default
# или
cat /etc/nginx/sites-enabled/yoddle
```

### ШАГ 2: Исправьте конфигурацию Nginx

Отредактируйте конфигурационный файл:

```bash
nano /etc/nginx/sites-enabled/yoddle
# или
nano /etc/nginx/sites-enabled/default
```

**Правильная конфигурация должна выглядеть так:**

```nginx
# HTTP → HTTPS редирект (если есть SSL)
server {
    listen 80;
    server_name yoddle.ru www.yoddle.ru;
    
    # Если есть SSL, раскомментируйте:
    # return 301 https://$server_name$request_uri;
    
    # Или просто проксируйте на приложение:
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTPS (если настроен SSL)
server {
    listen 443 ssl http2;
    server_name yoddle.ru www.yoddle.ru;

    # SSL сертификаты (если есть)
    # ssl_certificate /etc/letsencrypt/live/yoddle.ru/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yoddle.ru/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**ВАЖНО:** Убедитесь, что в конфиге НЕТ строки `listen 3001;` - это неправильно!

### ШАГ 3: Проверьте конфигурацию

```bash
nginx -t
```

Должно быть: `syntax is ok` и `test is successful`

### ШАГ 4: Перезагрузите Nginx

```bash
systemctl reload nginx
# или
systemctl restart nginx
```

### ШАГ 5: Проверьте, что порт 3001 свободен

```bash
lsof -i :3001
```

Должно быть пусто (nginx больше не должен слушать на 3001).

### ШАГ 6: Проверьте, что Nginx слушает на правильных портах

```bash
lsof -i :80
lsof -i :443
```

Должны быть процессы nginx.

### ШАГ 7: Запустите Node.js приложение

```bash
cd /root/yoddle
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs yoddle-api --lines 30
```

---

## 🎯 БЫСТРОЕ РЕШЕНИЕ (если уверены):

```bash
# 1. Остановите nginx
systemctl stop nginx

# 2. Убейте процессы nginx на порту 3001
kill -9 712 713 714

# 3. Проверьте конфигурацию nginx
nginx -t

# 4. Если конфиг правильный, запустите nginx
systemctl start nginx

# 5. Проверьте порты
lsof -i :3001  # должно быть пусто
lsof -i :80    # должен быть nginx

# 6. Запустите приложение
cd /root/yoddle
pm2 start ecosystem.config.cjs
```

---

## 📋 ЧЕКЛИСТ:

- [ ] Проверена конфигурация nginx (`cat /etc/nginx/sites-enabled/yoddle`)
- [ ] Удалена строка `listen 3001;` из конфига nginx
- [ ] Nginx настроен на проксирование с 80/443 → 3001
- [ ] Конфигурация проверена (`nginx -t`)
- [ ] Nginx перезагружен (`systemctl reload nginx`)
- [ ] Порт 3001 свободен (`lsof -i :3001`)
- [ ] Nginx слушает на 80/443 (`lsof -i :80`)
- [ ] Node.js приложение запущено (`pm2 start ecosystem.config.cjs`)

Выполните команды и сообщите результат!




