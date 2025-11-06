# 📊 ГАЙД: Добавление полей для Telegram активности в БД

## 🎯 Что делаем:

Добавляем в таблицу `leads` новые поля для отслеживания:
- **События конверсии**: запрос презентации, запись на демо, клики по сайту
- **Активность в боте**: использование ИИ-советника, просмотры демо модулей, общая активность

## ✅ ПОДГОТОВКА:

### 1. Проверьте подключение к БД на сервере

```bash
# Подключитесь к серверу
ssh root@your_server

# Проверьте подключение к БД
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT version();"
```

### 2. Сделайте резервную копию БД (на всякий случай)

```bash
# Создайте бэкап таблицы leads
PGPASSWORD=1WIzL7aP_F pg_dump -h localhost -U yoddle_user -d yoddle_db -t leads > backup_leads_$(date +%Y%m%d_%H%M%S).sql

# Или полный бэкап
PGPASSWORD=1WIzL7aP_F pg_dump -h localhost -U yoddle_user -d yoddle_db > backup_full_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🚀 ПРИМЕНЕНИЕ МИГРАЦИИ:

### Способ 1: Через git pull (рекомендуется)

```bash
# 1. Обновите код на сервере
cd /root/yoddle
git pull origin stable

# 2. Примените миграцию
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -f telegram-bot/migrations/add_telegram_activity_fields.sql

# 3. Проверьте, что поля добавлены
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\d leads"
```

### Способ 2: Вручную через psql

```bash
# 1. Подключитесь к БД
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db

# 2. Скопируйте и вставьте содержимое файла add_telegram_activity_fields.sql
# Или выполните команды вручную:

-- События конверсии
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS presentation_requested BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS presentation_requested_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS demo_scheduled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS demo_scheduled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS website_clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS website_last_click_at TIMESTAMP;

-- Активность в боте
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS ai_advisor_uses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_advisor_last_used_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS demo_views_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS demo_benefits_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS demo_ai_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS demo_gamification_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS demo_analytics_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_bot_activity TIMESTAMP,
  ADD COLUMN IF NOT EXISTS bot_messages_count INTEGER DEFAULT 0;

# 3. Выйдите из psql
\q
```

---

## ✅ ПРОВЕРКА:

```bash
# 1. Проверьте структуру таблицы
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\d leads"

# Должны появиться новые поля:
# - presentation_requested
# - demo_scheduled
# - website_clicks
# - ai_advisor_uses
# - demo_views_count
# - last_bot_activity
# и т.д.

# 2. Проверьте view для горячих лидов
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT * FROM telegram_hot_leads LIMIT 5;"

# 3. Проверьте статистику активности
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT * FROM telegram_leads_activity_stats;"
```

---

## 🔧 ОТКАТ (если что-то пошло не так):

```bash
# Если нужно откатить изменения, выполните:

PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db << EOF

-- Удаляем view
DROP VIEW IF EXISTS telegram_hot_leads;
DROP VIEW IF EXISTS telegram_leads_activity_stats;

-- Удаляем индексы
DROP INDEX IF EXISTS idx_leads_presentation_requested;
DROP INDEX IF EXISTS idx_leads_demo_scheduled;
DROP INDEX IF EXISTS idx_leads_last_bot_activity;
DROP INDEX IF EXISTS idx_leads_ai_advisor_uses;

-- Удаляем поля (осторожно! данные будут потеряны)
ALTER TABLE leads 
  DROP COLUMN IF EXISTS presentation_requested,
  DROP COLUMN IF EXISTS presentation_requested_at,
  DROP COLUMN IF EXISTS demo_scheduled,
  DROP COLUMN IF EXISTS demo_scheduled_at,
  DROP COLUMN IF EXISTS website_clicks,
  DROP COLUMN IF EXISTS website_last_click_at,
  DROP COLUMN IF EXISTS ai_advisor_uses,
  DROP COLUMN IF EXISTS ai_advisor_last_used_at,
  DROP COLUMN IF EXISTS demo_views_count,
  DROP COLUMN IF EXISTS demo_benefits_views,
  DROP COLUMN IF EXISTS demo_ai_views,
  DROP COLUMN IF EXISTS demo_gamification_views,
  DROP COLUMN IF EXISTS demo_analytics_views,
  DROP COLUMN IF EXISTS last_bot_activity,
  DROP COLUMN IF EXISTS bot_messages_count;

EOF
```

---

## 📋 ЧЕКЛИСТ:

- [ ] Создан бэкап БД
- [ ] Код обновлен на сервере (`git pull`)
- [ ] Миграция применена
- [ ] Проверена структура таблицы `leads`
- [ ] Проверены новые view (`telegram_hot_leads`, `telegram_leads_activity_stats`)
- [ ] Бот перезапущен (если нужно)

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ:

После применения миграции нужно обновить код бота, чтобы он записывал данные в новые поля:
1. Обновить `telegram-bot/src/services/leadService.js` для записи событий
2. Добавить отслеживание событий в обработчики бота
3. Обновить функции для увеличения счетчиков активности

Выполните команды и сообщите результат!

