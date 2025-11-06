-- ===================================================================
-- МИГРАЦИЯ: Добавление полей для Telegram активности и конверсии
-- Применяется к существующей таблице leads
-- ===================================================================

-- Добавляем поля для событий конверсии
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS presentation_requested BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS presentation_requested_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS demo_scheduled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS demo_scheduled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS website_clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS website_last_click_at TIMESTAMP;

-- Добавляем поля для активности в боте
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

-- Добавляем индексы для быстрого поиска активных лидов
CREATE INDEX IF NOT EXISTS idx_leads_presentation_requested ON leads(presentation_requested) 
  WHERE presentation_requested = TRUE;
CREATE INDEX IF NOT EXISTS idx_leads_demo_scheduled ON leads(demo_scheduled) 
  WHERE demo_scheduled = TRUE;
CREATE INDEX IF NOT EXISTS idx_leads_last_bot_activity ON leads(last_bot_activity) 
  WHERE last_bot_activity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_ai_advisor_uses ON leads(ai_advisor_uses) 
  WHERE ai_advisor_uses > 0;

-- Обновляем функцию для автоматического обновления last_bot_activity
-- (можно вызывать из бота при каждом взаимодействии)

-- View для горячих лидов (высокая активность + конверсия)
CREATE OR REPLACE VIEW telegram_hot_leads AS
SELECT 
  id,
  name,
  email,
  telegram_username,
  role,
  interests,
  status,
  lead_score,
  -- Активность
  ai_advisor_uses,
  demo_views_count,
  bot_messages_count,
  last_bot_activity,
  -- Конверсия
  presentation_requested,
  presentation_requested_at,
  demo_scheduled,
  demo_scheduled_at,
  website_clicks,
  -- Расчет горячести
  CASE 
    WHEN demo_scheduled = TRUE THEN 'hot'
    WHEN presentation_requested = TRUE AND ai_advisor_uses > 2 THEN 'warm'
    WHEN ai_advisor_uses > 0 AND demo_views_count > 2 THEN 'warm'
    WHEN last_bot_activity > NOW() - INTERVAL '24 hours' THEN 'active'
    ELSE 'cold'
  END as lead_temperature,
  created_at
FROM leads
WHERE source = 'telegram' OR source = 'telegram_bot'
ORDER BY 
  CASE 
    WHEN demo_scheduled = TRUE THEN 1
    WHEN presentation_requested = TRUE THEN 2
    WHEN ai_advisor_uses > 0 OR demo_views_count > 0 THEN 3
    ELSE 4
  END,
  last_bot_activity DESC NULLS LAST;

-- View для статистики по активности Telegram лидов
CREATE OR REPLACE VIEW telegram_leads_activity_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE ai_advisor_uses > 0) as ai_users,
  COUNT(*) FILTER (WHERE demo_views_count > 0) as demo_viewers,
  COUNT(*) FILTER (WHERE presentation_requested = TRUE) as presentation_requests,
  COUNT(*) FILTER (WHERE demo_scheduled = TRUE) as demo_scheduled_count,
  COUNT(*) FILTER (WHERE website_clicks > 0) as website_visitors,
  AVG(ai_advisor_uses) as avg_ai_uses,
  AVG(demo_views_count) as avg_demo_views,
  AVG(website_clicks) as avg_website_clicks,
  COUNT(*) FILTER (WHERE last_bot_activity > NOW() - INTERVAL '7 days') as active_last_7_days
FROM leads
WHERE (source = 'telegram' OR source = 'telegram_bot')
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Комментарии к новым полям
COMMENT ON COLUMN leads.presentation_requested IS 'Запросил ли лид презентацию через бота';
COMMENT ON COLUMN leads.demo_scheduled IS 'Записался ли лид на демо через бота';
COMMENT ON COLUMN leads.website_clicks IS 'Количество кликов по ссылке на сайт';
COMMENT ON COLUMN leads.ai_advisor_uses IS 'Количество использований ИИ-советника';
COMMENT ON COLUMN leads.demo_views_count IS 'Общее количество просмотров демо модулей';
COMMENT ON COLUMN leads.last_bot_activity IS 'Последняя активность в боте';

-- Готово!
SELECT 'Миграция завершена! Добавлены поля для Telegram активности и конверсии.' as status;

