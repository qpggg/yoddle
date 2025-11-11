# 📊 ОБСУЖДЕНИЕ: Данные для Telegram лидов

## 🎯 ТЕКУЩАЯ СИТУАЦИЯ:

Уже собирается:
- ✅ `telegram_id`, `telegram_username`, `telegram_first_name`, `telegram_last_name`
- ✅ `name`, `email`, `role`, `company`, `company_size`
- ✅ `interests` (массив)
- ✅ `utm_source`, `source`
- ✅ `status`, `lead_score`

---

## 💡 ЧТО МОЖНО ДОБАВИТЬ ДЛЯ ЛУЧШЕЙ АНАЛИТИКИ:

### 1. **Активность в боте** (важно для скоринга)
- Количество использований ИИ-советника
- Количество просмотров демо модулей
- Количество запросов презентации
- Количество кликов по ссылкам
- Последняя активность в боте
- Общее количество сообщений/взаимодействий

### 2. **События конверсии** (важно для воронки)
- Запросил презентацию (да/нет, когда)
- Записался на демо (да/нет, когда, ссылка на Calendly)
- Открыл сайт (количество раз)
- Подписался на обновления (да/нет)

### 3. **Дополнительная информация о пользователе**
- Язык пользователя (ru/en)
- Таймзона (для правильных уведомлений)
- Локация (страна/город, если можно определить)
- Телефон (если собираем в онбординге)

### 4. **Поведенческие метрики**
- Время первого взаимодействия (быстро = горячий лид)
- Время между этапами воронки
- Глубина погружения (сколько модулей просмотрел)
- Возвраты в бота (реингежджмент)

### 5. **Технические данные**
- Версия бота (если обновляем)
- Платформа (мобильное приложение / веб)
- Блокировки/отписки (если пользователь заблокировал бота)

---

## 🎨 ПРЕДЛАГАЕМАЯ СТРУКТУРА:

### Основная таблица `leads` (уже есть, можно дополнить):

```sql
-- Дополнительные поля для Telegram активности:
telegram_language VARCHAR(10), -- 'ru', 'en'
telegram_timezone VARCHAR(50), -- 'Europe/Moscow'
last_bot_activity TIMESTAMP, -- последняя активность в боте
bot_messages_count INTEGER DEFAULT 0, -- количество сообщений
ai_advisor_uses INTEGER DEFAULT 0, -- использование ИИ-советника
demo_views_count INTEGER DEFAULT 0, -- просмотры демо
presentation_requested BOOLEAN DEFAULT FALSE, -- запросил презентацию
presentation_requested_at TIMESTAMP, -- когда запросил
demo_scheduled BOOLEAN DEFAULT FALSE, -- записался на демо
demo_scheduled_at TIMESTAMP, -- когда записался
website_clicks INTEGER DEFAULT 0, -- клики по ссылке на сайт
subscribed_to_updates BOOLEAN DEFAULT FALSE, -- подписка на обновления
bot_blocked BOOLEAN DEFAULT FALSE, -- заблокировал бота
bot_blocked_at TIMESTAMP, -- когда заблокировал
```

### Таблица событий `telegram_lead_events` (новая):

```sql
CREATE TABLE telegram_lead_events (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  event_type VARCHAR(50), -- 'ai_advisor_used', 'demo_viewed', 'presentation_requested', 'demo_scheduled', 'website_clicked', 'message_sent'
  event_data JSONB, -- дополнительные данные события
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telegram_lead_events_lead_id ON telegram_lead_events(lead_id);
CREATE INDEX idx_telegram_lead_events_type ON telegram_lead_events(event_type);
CREATE INDEX idx_telegram_lead_events_created_at ON telegram_lead_events(created_at);
```

---

## 🤔 ВОПРОСЫ ДЛЯ ОБСУЖДЕНИЯ:

1. **Какие события отслеживать?**
   - Использование ИИ-советника?
   - Просмотры демо модулей?
   - Клики по ссылкам?
   - Запросы презентации/демо?

2. **Какой скоринг использовать?**
   - Базовая формула: email + роль + интересы = 60 баллов
   - Дополнительно: активность + конверсия события = +10-40 баллов
   - Итого: 0-100 баллов

3. **Нужна ли детальная история событий?**
   - Отдельная таблица `telegram_lead_events`?
   - Или достаточно счетчиков в основной таблице?

4. **Что приоритетно собирать?**
   - Минимальный набор (базовые данные + события конверсии)
   - Полный набор (все метрики активности)

---

## 🎯 РЕКОМЕНДАЦИЯ:

**Минимальный набор для начала:**
1. Базовые данные (уже есть)
2. Счетчики активности (использования ИИ, просмотры демо)
3. События конверсии (презентация, демо)
4. Последняя активность (для скоринга)

**Потом можно добавить:**
- Детальную историю событий
- Поведенческие метрики
- Геолокацию

Что думаешь? Что из этого приоритетно для твоей воронки?




