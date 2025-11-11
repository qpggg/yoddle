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
2. **`yoddle-tg`** — Telegram бот (файл `telegram-bot/ecosystem.config.js`)

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
pm2 stop yoddle-tg
pm2 delete yoddle-tg

# Запустите бота с конфигурацией
pm2 start ecosystem.config.js

# Проверьте статус
pm2 status
pm2 logs yoddle-tg
```

### 4. Проверка настроек

**⚠️ ВАЖНО:** Файл `.env` не включен в Git репозиторий (он в `.gitignore`). 
Его нужно создать вручную на сервере.

#### Создание .env файла на сервере:

```bash
# 1. Перейдите в корневую папку проекта
cd /root/yoddle  # или /root/yoddle1 (в зависимости от вашего пути)

# 2. Скопируйте шаблон .env.example в .env
cp .env.example .env

# 3. Отредактируйте .env файл и заполните реальные значения:
nano .env

# 4. Минимально необходимые переменные:
#    BOT_TOKEN=ваш_токен_от_botfather
#    DB_HOST=localhost
#    DB_PORT=5432
#    DB_NAME=yoddle_db
#    DB_USER=postgres
#    DB_PASSWORD=ваш_пароль
#    API_BASE_URL=http://localhost:3000
#    YODDLE_WEB_URL=https://yoddle.ru

# 5. Сохраните файл (Ctrl+O, Enter, Ctrl+X)

# 6. Установите правильные права доступа (безопасность)
chmod 600 .env

# 7. Проверьте, что файл создан:
ls -la .env
cat .env | grep BOT_TOKEN
```

Убедитесь, что файл `.env` в корне проекта содержит необходимые переменные:

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
pm2 start src/bot-simple.js --name yoddle-tg
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
pm2 logs yoddle-tg

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
pm2 restart yoddle-tg
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
pm2 restart yoddle-tg
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
pm2 stop yoddle-tg

# Перезапустить бота
pm2 restart yoddle-tg

# Удалить процесс бота
pm2 delete yoddle-tg

# Логи бота
pm2 logs yoddle-tg
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
pm2 logs yoddle-tg --lines 100

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
   pm2 logs yoddle-tg --lines 50
   ```

2. **Проверьте наличие и содержимое .env файла:**
```bash
   # Убедитесь, что .env файл существует в корне проекта
   ls -la /path/to/yoddle1/.env
   
   # Проверьте, что BOT_TOKEN указан (НЕ показывайте токен в логах!)
   grep -q "BOT_TOKEN=" /path/to/yoddle1/.env && echo "✅ BOT_TOKEN найден" || echo "❌ BOT_TOKEN отсутствует"
   
   # Проверьте полный путь (замените /path/to/yoddle1 на реальный путь)
   echo "Путь к .env должен быть: /root/yoddle1/.env или /var/www/yoddle/.env"
   ```

3. **Если .env файл отсутствует или BOT_TOKEN не настроен:**
```bash
   # Создайте или отредактируйте .env файл
   cd /path/to/yoddle1
   nano .env
   
   # Добавьте обязательные переменные:
   # BOT_TOKEN=ваш_токен_от_botfather
   # DB_HOST=localhost
   # DB_PORT=5432
   # DB_NAME=yoddle_db
   # DB_USER=postgres
   # DB_PASSWORD=ваш_пароль
   # API_BASE_URL=http://localhost:3000
   # YODDLE_WEB_URL=https://yoddle.ru
   ```

4. **Если бот постоянно перезапускается:**
   ```bash
   # Остановите бота временно
   pm2 stop yoddle-tg
   
   # Проверьте логи для диагностики
   pm2 logs yoddle-tg --lines 100
   
   # Исправьте проблему (обычно это отсутствие BOT_TOKEN в .env)
   # Затем запустите снова
   pm2 restart yoddle-tg
   ```

5. **Проверьте подключение к базе данных:**
   - Убедитесь, что PostgreSQL запущен
   - Проверьте настройки подключения в `.env`

6. **Запустите бота напрямую (без PM2) для отладки:**
```bash
   cd /path/to/yoddle1/telegram-bot
   node src/bot-simple.js
   # или
   node src/bot.js
   ```
   
   Если бот запускается напрямую, но не через PM2, проблема может быть в:
   - Неправильном пути к `.env` (PM2 запускается из другой директории)
   - Переменных окружения PM2 (используйте `env_file` в ecosystem.config.js или передайте env через PM2)

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
