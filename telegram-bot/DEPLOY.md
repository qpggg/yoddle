# 🚀 Инструкция по развертыванию Telegram бота на сервере

## ✅ Подготовка

Убедитесь, что на сервере установлены:
- Node.js (версия 14+)
- npm
- PM2 (глобально): `npm install -g pm2`
- Git

## 📋 Структура проектов

Проект разделен на два независимых процесса PM2:

1. **`yoddle-api`** — основной сайт и API (файл `ecosystem.config.js` в корне проекта)
2. **`yoddle-telegram-bot`** — Telegram бот (файл `telegram-bot/ecosystem.config.js`)

Каждый процесс запускается **независимо** из своей папки с отдельным конфигом.

**⚠️ Важно:** Главная ветка проекта — **`stable`**. Все изменения деплоятся из этой ветки.

## 📋 Шаги развертывания

### 1. Обновление кода

```bash
# Зайдите в корневую папку проекта
cd /path/to/yoddle1

# Убедитесь, что вы на ветке stable (главная ветка)
git checkout stable

# Обновите код из репозитория
git pull origin stable
```

### 2. Развертывание основного сайта (yoddle-api)

```bash
# Оставайтесь в корневой папке проекта
cd /path/to/yoddle1

# Установите зависимости (если нужно)
npm install

# Остановите старый процесс (если запущен)
pm2 stop yoddle-api
pm2 delete yoddle-api

# Запустите основной сайт
pm2 start ecosystem.config.js

# Проверьте статус
pm2 status
pm2 logs yoddle-api
```

### 3. Развертывание Telegram бота

```bash
# Перейдите в папку с ботом
cd /path/to/yoddle1/telegram-bot

# Установите зависимости бота (если еще не установлены)
npm install

# Остановите старый процесс бота (если запущен)
pm2 stop yoddle-telegram-bot
pm2 delete yoddle-telegram-bot

# Запустите бота с конфигурацией
pm2 start ecosystem.config.js

# Проверьте статус
pm2 status
pm2 logs yoddle-telegram-bot
```

### 4. Проверка настроек

Убедитесь, что файл `.env` в корне проекта (`yoddle1/.env`) содержит необходимые переменные:

```env
BOT_TOKEN=ваш_токен_от_botfather
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yoddle_db
DB_USER=postgres
DB_PASSWORD=ваш_пароль
CLAUDE_API_KEY=ваш_ключ_claude_api
ADMIN_CHAT_ID=ваш_telegram_id
API_BASE_URL=http://localhost:3000
YODDLE_WEB_URL=https://yoddle.ru
```

### 5. Альтернативный способ запуска (без ecosystem.config.js)

Если хотите запустить напрямую без конфига:

```bash
# Для основного сайта (из корневой папки)
cd /path/to/yoddle1
pm2 start server.js --name yoddle-api

# Для Telegram бота (из папки telegram-bot)
cd /path/to/yoddle1/telegram-bot
pm2 start src/bot-simple.js --name yoddle-telegram-bot
```

### 6. Настройка автозапуска (если еще не настроено)

```bash
# Сохраните список всех процессов PM2
pm2 save

# Настройте автозапуск при перезагрузке системы (выполните команду, которую выведет PM2)
pm2 startup
```

### 7. Проверка статуса

```bash
# Проверьте статус всех процессов
pm2 status

# Посмотрите логи основного сайта
pm2 logs yoddle-api

# Посмотрите логи Telegram бота
pm2 logs yoddle-telegram-bot

# Логи всех процессов
pm2 logs
```

## 🔄 Обновление проектов

### Обновление основного сайта (yoddle-api)

```bash
# 1. Обновите код из ветки stable
cd /path/to/yoddle1
git checkout stable
git pull origin stable

# 2. Переустановите зависимости (если нужно)
npm install

# 3. Перезапустите сайт
pm2 restart yoddle-api
```

### Обновление Telegram бота

```bash
# 1. Обновите код из ветки stable (если еще не обновили)
cd /path/to/yoddle1
git checkout stable
git pull origin stable

# 2. Переустановите зависимости бота (если нужно)
cd telegram-bot
npm install

# 3. Перезапустите бота
pm2 restart yoddle-telegram-bot
```

### Обновление обоих проектов одновременно

```bash
# 1. Обновите код из ветки stable
cd /path/to/yoddle1
git checkout stable
git pull origin stable

# 2. Переустановите зависимости основного сайта
npm install

# 3. Переустановите зависимости бота
cd telegram-bot
npm install

# 4. Перезапустите оба процесса
pm2 restart yoddle-api
pm2 restart yoddle-telegram-bot
```

## 📊 Полезные команды PM2

### Управление основным сайтом (yoddle-api)

```bash
# Остановить сайт
pm2 stop yoddle-api

# Перезапустить сайт
pm2 restart yoddle-api

# Удалить процесс сайта
pm2 delete yoddle-api

# Логи сайта
pm2 logs yoddle-api
```

### Управление Telegram ботом

```bash
# Остановить бота
pm2 stop yoddle-telegram-bot

# Перезапустить бота
pm2 restart yoddle-telegram-bot

# Удалить процесс бота
pm2 delete yoddle-telegram-bot

# Логи бота
pm2 logs yoddle-telegram-bot
```

### Общие команды

```bash
# Список всех процессов
pm2 list

# Статус всех процессов
pm2 status

# Логи всех процессов
pm2 logs

# Логи конкретного процесса за последние 100 строк
pm2 logs yoddle-api --lines 100
pm2 logs yoddle-telegram-bot --lines 100

# Мониторинг (CPU, память) всех процессов
pm2 monit

# Перезагрузить все процессы PM2
pm2 reload all

# Остановить все процессы
pm2 stop all

# Перезапустить все процессы
pm2 restart all
```

## 🐛 Отладка

### Если сайт не запускается:

1. **Проверьте логи:**
   ```bash
   pm2 logs yoddle-api --lines 50
   ```

2. **Запустите сайт напрямую (без PM2) для отладки:**
   ```bash
   cd /path/to/yoddle1
   node server.js
   ```

### Если бот не запускается:

1. **Проверьте логи:**
   ```bash
   pm2 logs yoddle-telegram-bot --lines 50
   ```

2. **Проверьте переменные окружения:**
   ```bash
   # Убедитесь, что .env файл существует и содержит BOT_TOKEN
   cat /path/to/yoddle1/.env | grep BOT_TOKEN
   ```

3. **Проверьте подключение к базе данных:**
   - Убедитесь, что PostgreSQL запущен
   - Проверьте настройки подключения в `.env`

4. **Запустите бота напрямую (без PM2) для отладки:**
   ```bash
   cd /path/to/yoddle1/telegram-bot
   node src/bot-simple.js
   # или
   node src/bot.js
   ```

## 📝 Примечания

- **Главная ветка:** Все изменения деплоятся из ветки **`stable`** (не `master` или `main`)
- **Независимые процессы:** Сайт и бот работают как отдельные процессы PM2 с разными именами
- **Конфигурации:** 
  - Основной сайт использует `ecosystem.config.js` в корне проекта
  - Telegram бот использует `telegram-bot/ecosystem.config.js`
- **Общие настройки:** Оба процесса используют `.env` файл из корневой папки проекта (`yoddle1/.env`)
- **Логи:** PM2 сохраняет логи в `~/.pm2/logs/` по умолчанию (или в `/var/log/pm2/` если настроено в конфигах)
- **Версии бота:** 
  - Для продакшена рекомендуется `bot-simple.js` (упрощенная версия без Scenes)
  - Для полного функционала используйте `bot.js` (с Scenes и расширенными возможностями)

## ✅ Проверка работоспособности

После запуска:

1. Найдите вашего бота в Telegram
2. Отправьте команду `/start`
3. Проверьте, что бот отвечает

Если бот не отвечает, проверьте логи через `pm2 logs`.
