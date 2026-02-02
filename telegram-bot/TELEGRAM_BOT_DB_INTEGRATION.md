# Интеграция Telegram бота с базой данных

## ✅ Что было сделано

### 1. Обновлен `leadService.js`
Добавлены функции для отслеживания активности лидов:
- `incrementAIUsage()` - использование ИИ-советника
- `updatePresentationRequested()` - запрос презентации
- `updateDemoScheduled()` - запись на демо
- `incrementDemoViews()` - просмотры демо модулей (benefits, ai, gamification, analytics)
- `updateWebsiteClick()` - клики по ссылке на сайт
- `updateLastBotActivity()` - обновление последней активности

### 2. Обновлен `config.js`
Теперь поддерживает те же переменные окружения, что и основной сервер:
- `PG_CONNECTION_STRING` (приоритет)
- `DB_HOST` / `PGHOST`
- `DB_PORT` / `PGPORT`
- `DB_NAME` / `PGDATABASE`
- `DB_USER` / `PGUSER`
- `DB_PASSWORD` / `PGPASSWORD`

### 3. Обновлен `bot-simple.js`
Добавлено отслеживание активности:
- **Middleware** - автоматически обновляет `last_bot_activity` при каждом взаимодействии
- **ИИ-советник** - отслеживает использование через `incrementAIUsage()`
- **Демо модули** - отслеживает просмотры через `incrementDemoViews()`
- **Презентация** - отслеживает запросы через `updatePresentationRequested()`
- **Запись на демо** - отслеживает через `updateDemoScheduled()`

## 🔧 Настройка

### 1. Проверьте переменные окружения в `.env`

Убедитесь, что в корневом `.env` файле есть переменные для подключения к БД:

```env
# Вариант 1: Использовать PG_CONNECTION_STRING (как основной сервер)
PG_CONNECTION_STRING=postgresql://USER:PASSWORD@HOST:5432/yoddle_db

# Или вариант 2: Отдельные переменные
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yoddle_db
DB_USER=yoddle_user
DB_PASSWORD=your_password_from_env

# Telegram бот
BOT_TOKEN=your_bot_token
```

### 2. Примените миграцию на сервере

Если миграция еще не применена:

```bash
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -f telegram-bot/migrations/add_telegram_activity_fields.sql
```

### 3. Проверьте подключение бота к БД

При запуске бота вы должны увидеть:
```
✅ Database connection verified
```

Если видите ошибку, проверьте:
- Правильность переменных окружения
- Доступность БД с сервера
- Права пользователя `yoddle_user` на таблицу `leads`

## 📊 Проверка работы

### Проверка таблицы leads

```sql
-- Посмотреть структуру таблицы
\d+ leads

-- Посмотреть все лиды из Telegram
SELECT 
  telegram_id, 
  telegram_username, 
  ai_advisor_uses, 
  demo_views_count,
  presentation_requested,
  demo_scheduled,
  last_bot_activity
FROM leads 
WHERE source = 'telegram' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Проверка представлений

```sql
-- Горячие лиды (высокая активность + конверсия)
SELECT * FROM telegram_hot_leads LIMIT 10;

-- Статистика активности за последние 30 дней
SELECT * FROM telegram_leads_activity_stats LIMIT 30;
```

### Тестирование отслеживания

1. **ИИ-советник**: Используйте `/start` → "Попробовать ИИ-советника" → заполните форму
   - Проверка: `SELECT ai_advisor_uses FROM leads WHERE telegram_id = YOUR_ID;`

2. **Демо модули**: Используйте "Посмотреть демо" → выберите любой модуль
   - Проверка: `SELECT demo_views_count, demo_benefits_views FROM leads WHERE telegram_id = YOUR_ID;`

3. **Презентация**: Используйте "Получить презентацию"
   - Проверка: `SELECT presentation_requested, presentation_requested_at FROM leads WHERE telegram_id = YOUR_ID;`

4. **Запись на демо**: Используйте "Записаться на демо"
   - Проверка: `SELECT demo_scheduled, demo_scheduled_at FROM leads WHERE telegram_id = YOUR_ID;`

## 🚀 Запуск бота

```bash
cd telegram-bot
npm install
node src/bot-simple.js
```

Или через PM2:

```bash
cd telegram-bot
pm2 start ecosystem.config.js --name telegram-bot
pm2 logs telegram-bot
```

## 📝 Примечания

- Все функции отслеживания работают асинхронно и не блокируют работу бота при ошибках БД
- Если БД недоступна, бот продолжит работать, но данные не будут сохраняться
- `last_bot_activity` обновляется автоматически при каждом взаимодействии через middleware
- `bot_messages_count` увеличивается при каждом действии, которое отслеживается

## 🔍 Отладка

Если данные не сохраняются:

1. Проверьте логи бота на наличие ошибок БД
2. Проверьте подключение к БД: `psql -h localhost -U yoddle_user -d yoddle_db`
3. Проверьте права пользователя: `\du yoddle_user`
4. Проверьте наличие таблицы: `\dt leads`

