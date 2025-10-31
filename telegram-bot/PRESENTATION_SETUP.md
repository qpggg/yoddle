# 📄 Настройка доступа к файлу презентации на сервере

## Проблема
Если файл находится просто в корне проекта (`/var/www/yoddle/presentation.pdf`), он **НЕ будет доступен** через веб без настройки Nginx.

## ✅ Решение 1: Положить файл в папку `public/` (рекомендуется)

### На сервере:
```bash
# Скопируйте файл в папку public
cp /var/www/yoddle/01.07_Yoddle.pdf /var/www/yoddle/public/presentation.pdf

# Или переименуйте существующий файл
mv /var/www/yoddle/01.07_Yoddle.pdf /var/www/yoddle/public/presentation.pdf
```

**Результат:** Файл будет доступен по URL: `https://yoddle.ru/presentation.pdf`

### В .env бота:
```env
PRESENTATION_URL=https://yoddle.ru/presentation.pdf
```

---

## ✅ Решение 2: Настроить Nginx для раздачи PDF из корня

Если хотите хранить файл в корне проекта, добавьте в конфигурацию Nginx:

```bash
sudo nano /etc/nginx/sites-available/yoddle
```

Добавьте в блок `server` (после location /api/):

```nginx
# Раздача PDF файлов из корня проекта
location ~* \.pdf$ {
    root /var/www/yoddle;
    expires 1d;
    add_header Cache-Control "public";
    add_header Content-Disposition "inline";
}
```

Или для конкретного файла:

```nginx
# Раздача конкретного файла презентации
location /presentation.pdf {
    alias /var/www/yoddle/presentation.pdf;
    add_header Content-Type "application/pdf";
    expires 1d;
    add_header Cache-Control "public";
}
```

После изменений:
```bash
# Проверьте конфигурацию
sudo nginx -t

# Перезагрузите Nginx
sudo systemctl reload nginx
```

---

## ✅ Решение 3: Использовать локальный путь (если файл только для бота)

Если файл нужен только для бота и не нужен публичный доступ:

### На сервере:
```bash
# Оставьте файл в корне проекта
# Например: /var/www/yoddle/presentation.pdf
```

### В .env бота:
```env
PRESENTATION_LOCAL_PATH=/var/www/yoddle/presentation.pdf
```

Бот будет использовать локальный файл напрямую без веб-доступа.

---

## 🎯 Рекомендация

**Лучший вариант:** Решение 1 - положить файл в `public/`

**Почему:**
- ✅ Просто и безопасно
- ✅ Файл доступен через веб
- ✅ Telegram Bot API может скачать файл по URL
- ✅ Если URL не работает, бот может использовать локальный файл как fallback

**Структура на сервере:**
```
/var/www/yoddle/
├── public/
│   ├── presentation.pdf  ← Здесь будет файл
│   ├── index.html
│   └── ...
├── telegram-bot/
│   └── src/
│       └── bot-simple.js
└── ...
```

**В .env бота:**
```env
PRESENTATION_URL=https://yoddle.ru/presentation.pdf
```

---

## 📝 Проверка доступа

После настройки проверьте доступность файла:

```bash
# Проверка через curl
curl -I https://yoddle.ru/presentation.pdf

# Должен вернуть:
# HTTP/1.1 200 OK
# Content-Type: application/pdf
```

Если файл доступен, бот сможет его отправлять через URL. Если нет - будет использовать локальный путь или fallback на текстовую ссылку.

