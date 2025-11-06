# 🔧 ИСПРАВЛЕНИЕ NGINX: Убрать блок на порту 3001

## ❌ Проблема:

В конфигурации nginx есть блок, который слушает на порту 3001 для IP адреса:
```nginx
server {
    listen 3001;
    server_name 185.185.69.254;
    ...
}
```

Этот блок конфликтует с Node.js приложением, которое тоже пытается использовать порт 3001.

## ✅ РЕШЕНИЕ:

### Вариант 1: Удалить блок на порту 3001 (рекомендуется)

Если доступ по IP адресу не нужен, просто удалите этот блок:

```bash
# 1. Откройте конфиг nginx
nano /etc/nginx/sites-enabled/yoddle

# 2. Удалите весь блок:
# server {
#     listen 3001;
#     server_name 185.185.69.254;
#     ...
# }

# 3. Сохраните файл (Ctrl+O, Enter, Ctrl+X)

# 4. Проверьте конфигурацию
nginx -t

# 5. Перезагрузите nginx
systemctl reload nginx

# 6. Проверьте, что порт 3001 свободен
lsof -i :3001
# Должно быть пусто

# 7. Запустите приложение на порту 3000
cd /root/yoddle
pm2 start ecosystem.config.cjs
pm2 status
```

### Вариант 2: Изменить блок на порту 3001, чтобы проксировал на 3000

Если доступ по IP адресу нужен, измените блок так:

```nginx
server {
    listen 3001;
    server_name 185.185.69.254;

    # Увеличиваем размер заголовков
    large_client_header_buffers 4 32k;
    client_max_body_size 50M;

    location / {
        # Проксируем на порт 3000, где работает приложение
        proxy_pass http://127.0.0.1:3000;  # ИЗМЕНИТЬ С 3001 НА 3000!
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Увеличиваем буферы и таймауты
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }

    # Обработка статических файлов
    location ~* \.(ico|css|js|gif|jpe?g|png)$ {
        # Проксируем на порт 3000
        proxy_pass http://127.0.0.1:3000;  # ИЗМЕНИТЬ С 3001 НА 3000!
        
        expires max;
        add_header Pragma public;
        add_header Cache-Control "public, must-revalidate, proxy-revalidate";
    }
}
```

**Важно:** В обоих `proxy_pass` измените `http://127.0.0.1:3001` на `http://127.0.0.1:3000`

---

## 📋 ИТОГОВАЯ АРХИТЕКТУРА:

```
Пользователь → Nginx (порт 443/80) → Node.js (порт 3000)
              ↓
         Nginx (порт 3001 для IP) → Node.js (порт 3000)
```

**Все проксируют на один порт 3000!**

---

## 🎯 БЫСТРОЕ РЕШЕНИЕ:

```bash
# 1. Откройте конфиг
nano /etc/nginx/sites-enabled/yoddle

# 2. Найдите блок с "listen 3001;" и измените в нем:
#    proxy_pass http://127.0.0.1:3001; → proxy_pass http://127.0.0.1:3000;

# 3. Или удалите весь блок с "listen 3001;" если он не нужен

# 4. Проверьте и перезагрузите
nginx -t
systemctl reload nginx

# 5. Убейте процессы nginx на 3001 (если они остались)
kill -9 712 713 714

# 6. Запустите приложение
cd /root/yoddle
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs yoddle-api --lines 30
```

Выполните команды и сообщите результат!

