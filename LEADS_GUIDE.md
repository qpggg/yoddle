# 📊 Работа с лидами Yoddle

## 🎯 Упрощенная структура

Одна таблица `leads` для всех источников лидов. Поле `source` определяет откуда пришел лид.

## 📋 Источники лидов (source)

| Source | Описание | Откуда |
|--------|----------|--------|
| `landing` | Лендинг | Форма на yoddle.ru |
| `telegram` | Telegram бот | @YoddleBot |
| `forum` | Форумы | VC.ru, Habr, Reddit |
| `seo` | Органический поиск | Google, Yandex |
| `ads` | Реклама | Яндекс.Директ, VK Ads |
| `referral` | Рекомендации | От клиентов |
| `event` | Мероприятия | Конференции, QR-коды |
| `seo` | SEO | Органика |

## 🔄 Статусы лида (status)

```
new → contacted → qualified → demo → proposal → converted
  ↓
 lost
```

- `new` - Новый лид, требует первого контакта
- `contacted` - Связались, в процессе квалификации
- `qualified` - Квалифицированный, подходит под ICP
- `demo` - Запланировано/проведено демо
- `proposal` - Отправлено коммерческое предложение
- `converted` - Конвертировался в клиента (записался в `clients`)
- `lost` - Потерян (не отвечает, не подходит, отказался)

## 💯 Lead Score (качество лида)

0-100 баллов, автоматически рассчитывается:

- **Telegram**: начальный скор 60 (активный, прошел онбординг)
- **Landing**: начальный скор 50 (заполнил форму)
- **+10** за повторное взаимодействие
- **+5** за каждое обновление данных

## 📝 Примеры использования

### Добавить лида с лендинга
```sql
INSERT INTO leads (name, email, phone, company, role, source, utm_source, message)
VALUES ('Иван Петров', 'ivan@company.ru', '+79991234567', 'ООО Компания', 
        'HR', 'landing', 'google', 'Хочу посмотреть демо');
```

### Добавить лида из Telegram
```sql
INSERT INTO leads (
  name, email, telegram_id, telegram_username, 
  telegram_first_name, role, source, interests
)
VALUES (
  'Мария', 'maria@company.ru', 123456789, 'maria_hr', 
  'Мария', 'HR', 'telegram', ARRAY['benefits', 'ai', 'gamification']
);
```

### Добавить лида с форума
```sql
INSERT INTO leads (name, email, source, utm_source, utm_campaign)
VALUES ('Петр', 'petr@startup.ru', 'forum', 'vc_ru', 'hr_tech_discussion');
```

### Добавить лида с события
```sql
INSERT INTO leads (name, email, phone, source, utm_source, utm_campaign)
VALUES ('Анна', 'anna@corp.ru', '+79991234567', 'event', 'innovation_forum', 'qr_code_stand');
```

### Посмотреть статистику по источникам
```sql
SELECT * FROM leads_by_source;
```

Результат:
```
 source   | total | new | contacted | qualified | demo | converted | lost | conversion_rate | avg_score 
----------+-------+-----+-----------+-----------+------+-----------+------+----------------+-----------
 telegram |   45  | 10  |    15     |     8     |  7   |     5     |  0   |     11.11      |   65.5
 landing  |   32  |  8  |    12     |     6     |  3   |     3     |  0   |     9.38       |   58.2
 forum    |   18  |  5  |     7     |     3     |  2   |     1     |  0   |     5.56       |   52.0
```

### Посмотреть активные лиды (требуют внимания)
```sql
SELECT * FROM leads_active LIMIT 10;
```

Результат:
```
 name         | email              | source   | status    | action_needed       
--------------+--------------------+----------+-----------+--------------------
 Иван Петров  | ivan@company.ru    | landing  | new       | needs_first_contact
 Мария        | maria@company.ru   | telegram | contacted | needs_follow_up
```

### Обновить статус лида
```sql
UPDATE leads 
SET status = 'contacted', 
    last_contact_at = NOW(),
    assigned_to = 'sales_manager_1'
WHERE email = 'ivan@company.ru';
```

### Конвертировать лида в клиента
```sql
-- Сначала создайте клиента в таблице clients
INSERT INTO clients (company_name, contact_person, email, ...)
VALUES ('ООО Компания', 'Иван Петров', 'ivan@company.ru', ...)
RETURNING id;

-- Затем обновите лид
UPDATE leads 
SET status = 'converted',
    client_id = 123, -- ID созданного клиента
    converted_at = NOW()
WHERE email = 'ivan@company.ru';
```

### Добавить заметку о взаимодействии
```sql
INSERT INTO lead_interactions (lead_id, interaction_type, description, outcome)
VALUES (
  (SELECT id FROM leads WHERE email = 'ivan@company.ru'),
  'call',
  'Созвон по демо, обсудили возможности платформы',
  'scheduled'
);
```

### Найти лидов по UTM кампании
```sql
SELECT name, email, company, source, created_at
FROM leads
WHERE utm_campaign = 'hr_tech_2024'
ORDER BY created_at DESC;
```

### Посмотреть воронку конверсии за последние 30 дней
```sql
SELECT * FROM leads_funnel;
```

### Найти горячие лиды (высокий скор, активные)
```sql
SELECT name, email, company, source, lead_score, status
FROM leads
WHERE lead_score > 70
  AND status IN ('contacted', 'qualified', 'demo')
  AND last_contact_at >= NOW() - INTERVAL '7 days'
ORDER BY lead_score DESC;
```

### Найти холодные лиды (требуют реактивации)
```sql
SELECT name, email, source, status, last_contact_at
FROM leads
WHERE status NOT IN ('converted', 'lost')
  AND (last_contact_at IS NULL OR last_contact_at < NOW() - INTERVAL '14 days')
ORDER BY created_at DESC;
```

## 🔗 Связь с существующей таблицей clients

Когда лид конвертируется в клиента:

1. Создаете запись в `clients` (ваша существующая таблица)
2. Обновляете `leads.client_id` на ID созданного клиента
3. Меняете `leads.status` на `'converted'`
4. Ставите `leads.converted_at = NOW()`

```sql
-- Пример полной конверсии
BEGIN;

-- 1. Создать клиента
INSERT INTO clients (company_name, contact_person, email, phone, ...)
VALUES ('ООО Компания', 'Иван Петров', 'ivan@company.ru', '+79991234567', ...)
RETURNING id INTO client_id_var;

-- 2. Обновить лид
UPDATE leads 
SET status = 'converted',
    client_id = client_id_var,
    converted_at = NOW()
WHERE email = 'ivan@company.ru';

-- 3. Добавить заметку
INSERT INTO lead_interactions (
  lead_id, 
  interaction_type, 
  description, 
  outcome
)
VALUES (
  (SELECT id FROM leads WHERE email = 'ivan@company.ru'),
  'demo',
  'Успешное демо, клиент подписал договор',
  'success'
);

COMMIT;
```

## 📊 Полезные запросы для аналитики

### Конверсия по источникам за месяц
```sql
SELECT 
  source,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'converted') as converted,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'converted') / COUNT(*), 2) as conversion_rate
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY source
ORDER BY conversion_rate DESC;
```

### ТОП UTM кампаний по конверсии
```sql
SELECT 
  utm_campaign,
  utm_source,
  COUNT(*) as leads,
  COUNT(*) FILTER (WHERE status = 'converted') as converted,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'converted') / COUNT(*), 2) as conversion_rate
FROM leads
WHERE utm_campaign IS NOT NULL
GROUP BY utm_campaign, utm_source
HAVING COUNT(*) >= 5
ORDER BY conversion_rate DESC
LIMIT 10;
```

### Динамика лидов по дням
```sql
SELECT 
  DATE(created_at) as date,
  source,
  COUNT(*) as leads_count
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), source
ORDER BY date DESC, leads_count DESC;
```

### Средний путь до конверсии
```sql
SELECT 
  source,
  AVG(EXTRACT(EPOCH FROM (converted_at - created_at))/86400) as avg_days_to_convert,
  COUNT(*) as converted_count
FROM leads
WHERE status = 'converted'
GROUP BY source
ORDER BY avg_days_to_convert;
```

---

## 🎯 Best Practices

1. **Всегда указывайте source** при создании лида
2. **Используйте UTM метки** для отслеживания эффективности каналов
3. **Обновляйте last_contact_at** после каждого касания
4. **Добавляйте notes** для важной информации
5. **Используйте lead_interactions** для истории общения
6. **Регулярно чистите холодные лиды** (меняйте на `lost`)
7. **Связывайте с clients** при конверсии

---

**Простая и эффективная система лидов! 🚀**

