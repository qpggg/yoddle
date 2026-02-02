# 📊 Архитектура базы данных для Telegram бота Yoddle

## 🔗 Подключение к базе данных

### Единая строка подключения для всего проекта

**Основной сайт** (`server.js` → `db.js`):
- Использует `PG_CONNECTION_STRING` из `.env`
- Формат: `postgresql://user:password@host:port/database`

**Telegram бот** (`telegram-bot/src/config.js` → `telegram-bot/src/services/leadService.js`):
- Использует ту же переменную `PG_CONNECTION_STRING` из корневого `.env`
- Приоритет: `PG_CONNECTION_STRING` > `DB_*` > `PG*` > дефолты
- Создает отдельный Pool соединений для бота

**Пример `.env` на сервере:**
```env
PG_CONNECTION_STRING=postgresql://USER:PASSWORD@HOST:5432/yoddle_db
BOT_TOKEN=your_telegram_bot_token
```

---

## 📋 Архитектура таблицы `leads`

### Основная таблица для всех лидов

Таблица `leads` используется для хранения лидов из **всех источников**:
- Telegram бот
- Landing страница
- Форум
- SEO/реклама
- Рефералы
- События

### Структура таблицы

#### 1. Основная информация о лиде

| Поле | Тип | Описание | Пример |
|------|-----|----------|--------|
| `id` | SERIAL PRIMARY KEY | Уникальный ID лида | `1` |
| `name` | VARCHAR(255) | Имя лида | `"Иван Иванов"` |
| `email` | VARCHAR(255) UNIQUE | Email (уникальный) | `"ivan@company.ru"` |
| `phone` | VARCHAR(50) | Телефон | `"+79991234567"` |
| `company` | VARCHAR(255) | Название компании | `"ООО Рога и Копыта"` |
| `company_size` | VARCHAR(50) | Размер компании | `"11-50"`, `"51-200"`, `"200+"` |
| `role` | VARCHAR(100) | Роль в компании | `"HR"`, `"C-Level"`, `"Owner"`, `"Manager"` |

#### 2. Источник и UTM параметры

| Поле | Тип | Описание | Пример |
|------|-----|----------|--------|
| `source` | VARCHAR(100) NOT NULL | Источник лида | `"telegram"`, `"landing"`, `"seo"` |
| `utm_source` | VARCHAR(100) | UTM source | `"google"`, `"yandex"` |
| `utm_medium` | VARCHAR(100) | UTM medium | `"cpc"`, `"organic"` |
| `utm_campaign` | VARCHAR(100) | UTM campaign | `"summer2024"` |
| `utm_content` | VARCHAR(100) | UTM content | `"banner_top"` |
| `utm_term` | VARCHAR(100) | UTM term | `"hr платформа"` |

#### 3. Telegram-специфичные данные

| Поле | Тип | Описание | Пример |
|------|-----|----------|--------|
| `telegram_id` | BIGINT UNIQUE | Telegram User ID | `123456789` |
| `telegram_username` | VARCHAR(255) | Telegram username | `"@ivan_hr"` |
| `telegram_first_name` | VARCHAR(255) | Имя из Telegram | `"Иван"` |
| `telegram_last_name` | VARCHAR(255) | Фамилия из Telegram | `"Иванов"` |

#### 4. Интересы и данные

| Поле | Тип | Описание | Пример |
|------|-----|----------|--------|
| `interests` | TEXT[] | Массив интересов | `["benefits", "ai", "gamification"]` |
| `message` | TEXT | Комментарий/сообщение | `"Интересует геймификация"` |

#### 5. Метаданные

| Поле | Тип | Описание | Пример |
|------|-----|----------|--------|
| `page_url` | TEXT | URL страницы | `"https://yoddle.ru/demo"` |
| `referrer` | TEXT | Реферер | `"https://google.com"` |
| `ip_address` | VARCHAR(50) | IP адрес | пример: `"192.168.1.1"` |
| `user_agent` | TEXT | User Agent | `"Mozilla/5.0..."` |

#### 6. Статус в воронке продаж

| Поле | Тип | Описание | Возможные значения |
|------|-----|----------|---------------------|
| `status` | VARCHAR(50) DEFAULT 'new' | Статус лида в воронке | `"new"`, `"contacted"`, `"qualified"`, `"demo"`, `"proposal"`, `"converted"`, `"lost"` |
| `lead_score` | INTEGER DEFAULT 0 | Скоринг качества лида (0-100) | `60`, `75`, `90` |
| `client_id` | INTEGER | ID клиента (если конвертировался) | `42` |

#### 7. Менеджмент

| Поле | Тип | Описание | Пример |
|------|-----|----------|--------|
| `assigned_to` | VARCHAR(255) | Кому назначен лид | `"sales@yoddle.ru"` |
| `last_contact_at` | TIMESTAMP | Последний контакт | `2024-11-07 12:00:00` |
| `demo_scheduled_at` | TIMESTAMP | Время записи на демо | `2024-11-10 14:00:00` |
| `converted_at` | TIMESTAMP | Время конверсии | `2024-11-15 10:00:00` |
| `notes` | TEXT | Заметки менеджера | `"Интересуется геймификацией"` |

#### 8. События конверсии (новые поля)

| Поле | Тип | Описание | Пример |
|------|-----|----------|--------|
| `presentation_requested` | BOOLEAN DEFAULT FALSE | Запросил презентацию | `true` |
| `presentation_requested_at` | TIMESTAMP | Когда запросил презентацию | `2024-11-07 12:30:00` |
| `demo_scheduled` | BOOLEAN DEFAULT FALSE | Записался на демо | `true` |
| `demo_scheduled_at` | TIMESTAMP | Когда записался на демо | `2024-11-07 13:00:00` |
| `website_clicks` | INTEGER DEFAULT 0 | Количество кликов по ссылке на сайт | `3` |
| `website_last_click_at` | TIMESTAMP | Последний клик по сайту | `2024-11-07 14:00:00` |

#### 9. Активность в боте (новые поля)

| Поле | Тип | Описание | Пример |
|------|-----|----------|--------|
| `ai_advisor_uses` | INTEGER DEFAULT 0 | Количество использований ИИ-советника | `5` |
| `ai_advisor_last_used_at` | TIMESTAMP | Последнее использование ИИ | `2024-11-07 15:00:00` |
| `demo_views_count` | INTEGER DEFAULT 0 | Общее количество просмотров демо | `8` |
| `demo_benefits_views` | INTEGER DEFAULT 0 | Просмотры модуля "Льготы" | `2` |
| `demo_ai_views` | INTEGER DEFAULT 0 | Просмотры модуля "ИИ-советник" | `3` |
| `demo_gamification_views` | INTEGER DEFAULT 0 | Просмотры модуля "Геймификация" | `2` |
| `demo_analytics_views` | INTEGER DEFAULT 0 | Просмотры модуля "Аналитика" | `1` |
| `last_bot_activity` | TIMESTAMP | Последняя активность в боте | `2024-11-07 16:00:00` |
| `bot_messages_count` | INTEGER DEFAULT 0 | Общее количество взаимодействий | `25` |

#### 10. Временные метки

| Поле | Тип | Описание | Пример |
|------|-----|----------|--------|
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | Дата создания | `2024-11-07 10:00:00` |
| `updated_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | Дата обновления (автообновление через триггер) | `2024-11-07 16:00:00` |

---

## 🔄 Взаимодействие пользователя с ботом

### Сценарий 1: Первый запуск бота (`/start`)

```
1. Пользователь → /start
   ↓
2. Бот проверяет БД: есть ли лид с этим telegram_id?
   ↓
3. Если НЕТ → Показывает приветствие с кнопкой "Начать знакомство"
   ↓
4. Пользователь → "Начать знакомство"
   ↓
5. Онбординг:
   - Выбор роли (HR, C-Level, Owner, Manager)
   - Ввод email
   - Выбор интересов (benefits, ai, gamification, analytics)
   ↓
6. Бот сохраняет в БД через saveLead():
   - telegram_id, telegram_username, telegram_first_name, telegram_last_name
   - role, email, interests
   - source = 'telegram'
   - status = 'new'
   - lead_score = 60 (начальный для telegram лидов)
   ↓
7. Показывается главное меню
```

**SQL запрос при сохранении:**
```sql
INSERT INTO leads (
  name, email, telegram_id, telegram_username, 
  telegram_first_name, telegram_last_name,
  role, interests, source, utm_source, 
  status, lead_score
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
ON CONFLICT (telegram_id) 
DO UPDATE SET
  telegram_username = EXCLUDED.telegram_username,
  telegram_first_name = EXCLUDED.telegram_first_name,
  telegram_last_name = EXCLUDED.telegram_last_name,
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  interests = EXCLUDED.interests,
  updated_at = CURRENT_TIMESTAMP
RETURNING *;
```

### Сценарий 2: Повторный запуск (`/start`)

```
1. Пользователь → /start
   ↓
2. Бот проверяет БД: есть ли лид с этим telegram_id?
   ↓
3. Если ДА → Показывает главное меню сразу
   ↓
4. Обновляется last_bot_activity через middleware
```

**SQL запрос:**
```sql
SELECT * FROM leads WHERE telegram_id = $1;
-- Если найден → показываем меню
-- Обновляем last_bot_activity через middleware
```

### Сценарий 3: Использование ИИ-советника

```
1. Пользователь → "Попробовать ИИ-советника"
   ↓
2. Бот показывает форму:
   - Настроение (1-10)
   - Энергия (1-10)
   - Стресс (1-10)
   - Заметки (опционально)
   ↓
3. Пользователь заполняет форму
   ↓
4. Бот отправляет данные на API: POST /api/ai/analyze-mood
   ↓
5. API обрабатывает и возвращает рекомендации
   ↓
6. Бот показывает рекомендации
   ↓
7. Бот обновляет БД через incrementAIUsage():
   - ai_advisor_uses += 1
   - ai_advisor_last_used_at = NOW()
   - last_bot_activity = NOW()
   - bot_messages_count += 1
```

**SQL запрос:**
```sql
UPDATE leads 
SET 
  ai_advisor_uses = COALESCE(ai_advisor_uses, 0) + 1,
  ai_advisor_last_used_at = CURRENT_TIMESTAMP,
  last_bot_activity = CURRENT_TIMESTAMP,
  bot_messages_count = COALESCE(bot_messages_count, 0) + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE telegram_id = $1
RETURNING ai_advisor_uses;
```

### Сценарий 4: Просмотр демо модулей

```
1. Пользователь → "Посмотреть демо"
   ↓
2. Бот показывает список модулей:
   - Льготы
   - ИИ-советник
   - Геймификация
   - Аналитика
   ↓
3. Пользователь выбирает модуль (например, "Льготы")
   ↓
4. Бот показывает описание модуля + скриншот
   ↓
5. Бот обновляет БД через incrementDemoViews('benefits'):
   - demo_benefits_views += 1
   - demo_views_count += 1
   - last_bot_activity = NOW()
   - bot_messages_count += 1
```

**SQL запрос:**
```sql
UPDATE leads 
SET 
  demo_benefits_views = COALESCE(demo_benefits_views, 0) + 1,
  demo_views_count = COALESCE(demo_views_count, 0) + 1,
  last_bot_activity = CURRENT_TIMESTAMP,
  bot_messages_count = COALESCE(bot_messages_count, 0) + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE telegram_id = $1
RETURNING demo_benefits_views;
```

### Сценарий 5: Запрос презентации

```
1. Пользователь → "Получить презентацию"
   ↓
2. Бот отправляет PDF файл
   ↓
3. Бот обновляет БД через updatePresentationRequested():
   - presentation_requested = TRUE
   - presentation_requested_at = NOW()
   - last_bot_activity = NOW()
   - bot_messages_count += 1
```

**SQL запрос:**
```sql
UPDATE leads 
SET 
  presentation_requested = TRUE,
  presentation_requested_at = CURRENT_TIMESTAMP,
  last_bot_activity = CURRENT_TIMESTAMP,
  bot_messages_count = COALESCE(bot_messages_count, 0) + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE telegram_id = $1
RETURNING id;
```

### Сценарий 6: Запись на демо

```
1. Пользователь → "Записаться на демо"
   ↓
2. Бот показывает календарь и просит email
   ↓
3. Бот обновляет БД через updateDemoScheduled():
   - demo_scheduled = TRUE
   - demo_scheduled_at = NOW()
   - status = 'demo' (если был 'new')
   - last_bot_activity = NOW()
   - bot_messages_count += 1
```

**SQL запрос:**
```sql
UPDATE leads 
SET 
  demo_scheduled = TRUE,
  demo_scheduled_at = CURRENT_TIMESTAMP,
  last_bot_activity = CURRENT_TIMESTAMP,
  bot_messages_count = COALESCE(bot_messages_count, 0) + 1,
  updated_at = CURRENT_TIMESTAMP,
  status = CASE 
    WHEN status = 'new' THEN 'demo'
    ELSE status
  END
WHERE telegram_id = $1
RETURNING id;
```

### Сценарий 7: Любое взаимодействие (middleware)

```
1. Пользователь выполняет ЛЮБОЕ действие в боте
   ↓
2. Middleware автоматически обновляет БД через updateLastBotActivity():
   - last_bot_activity = NOW()
   - bot_messages_count += 1
   - updated_at = NOW()
```

**SQL запрос (выполняется при каждом действии):**
```sql
UPDATE leads 
SET 
  last_bot_activity = CURRENT_TIMESTAMP,
  bot_messages_count = COALESCE(bot_messages_count, 0) + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE telegram_id = $1
RETURNING id;
```

---

## 📊 Представления (Views) для аналитики

### 1. `telegram_hot_leads` - Горячие лиды

Показывает Telegram лидов с высокой активностью и конверсией, отсортированных по приоритету.

**Поля:**
- Основная информация (id, name, email, telegram_username, role, interests, status, lead_score)
- Активность (ai_advisor_uses, demo_views_count, bot_messages_count, last_bot_activity)
- Конверсия (presentation_requested, presentation_requested_at, demo_scheduled, demo_scheduled_at, website_clicks)
- **lead_temperature** - расчетная "температура" лида:
  - `'hot'` - записался на демо
  - `'warm'` - запросил презентацию + использовал ИИ > 2 раз ИЛИ использовал ИИ + просмотрел демо > 2 раза
  - `'active'` - активен за последние 24 часа
  - `'cold'` - остальные

**Использование:**
```sql
SELECT * FROM telegram_hot_leads 
WHERE lead_temperature IN ('hot', 'warm')
ORDER BY last_bot_activity DESC;
```

### 2. `telegram_leads_activity_stats` - Статистика активности

Показывает статистику по активности Telegram лидов за последние 30 дней, сгруппированную по дням.

**Поля:**
- `date` - дата
- `total_leads` - всего лидов за день
- `ai_users` - лидов, использовавших ИИ
- `demo_viewers` - лидов, просмотревших демо
- `presentation_requests` - запросов презентации
- `demo_scheduled_count` - записей на демо
- `website_visitors` - лидов, кликнувших на сайт
- `avg_ai_uses` - среднее использование ИИ
- `avg_demo_views` - средние просмотры демо
- `avg_website_clicks` - средние клики по сайту
- `active_last_7_days` - активных за последние 7 дней

**Использование:**
```sql
SELECT * FROM telegram_leads_activity_stats 
ORDER BY date DESC 
LIMIT 7; -- Последняя неделя
```

---

## 🔍 Индексы для быстрого поиска

```sql
-- Основные индексы
idx_leads_email              -- Поиск по email
idx_leads_source             -- Фильтрация по источнику
idx_leads_status             -- Фильтрация по статусу
idx_leads_telegram_id        -- Поиск по Telegram ID (UNIQUE)
idx_leads_created_at         -- Сортировка по дате создания

-- Индексы для активных лидов (частичные)
idx_leads_presentation_requested  -- WHERE presentation_requested = TRUE
idx_leads_demo_scheduled         -- WHERE demo_scheduled = TRUE
idx_leads_last_bot_activity      -- WHERE last_bot_activity IS NOT NULL
idx_leads_ai_advisor_uses        -- WHERE ai_advisor_uses > 0
```

---

## 🔐 Права доступа

Пользователь `yoddle_user` должен иметь права:
```sql
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;
```

---

## 📈 Метрики и аналитика

### Ключевые метрики для отслеживания:

1. **Конверсия в демо:**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE demo_scheduled = TRUE) * 100.0 / COUNT(*) as conversion_rate
   FROM leads 
   WHERE source = 'telegram';
   ```

2. **Средняя активность лида:**
   ```sql
   SELECT 
     AVG(ai_advisor_uses) as avg_ai_uses,
     AVG(demo_views_count) as avg_demo_views,
     AVG(bot_messages_count) as avg_interactions
   FROM leads 
   WHERE source = 'telegram';
   ```

3. **Топ активных лидов:**
   ```sql
   SELECT 
     telegram_username,
     ai_advisor_uses,
     demo_views_count,
     presentation_requested,
     demo_scheduled,
     last_bot_activity
   FROM leads 
   WHERE source = 'telegram'
   ORDER BY last_bot_activity DESC 
   LIMIT 10;
   ```

---

## 🚀 Рекомендации по использованию

1. **Всегда используйте `ON CONFLICT (telegram_id)`** при сохранении лидов, чтобы избежать дубликатов
2. **Обновляйте `last_bot_activity`** при каждом взаимодействии через middleware
3. **Используйте представления** для аналитики вместо прямых запросов к таблице
4. **Мониторьте индексы** - при большом количестве данных может потребоваться оптимизация
5. **Регулярно проверяйте** представления `telegram_hot_leads` для выявления горячих лидов

