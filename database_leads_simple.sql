-- ===================================================================
-- УПРОЩЕННАЯ СТРУКТУРА ЛИДОВ ДЛЯ YODDLE
-- Одна таблица для всех источников лидов
-- ===================================================================

-- Единая таблица лидов
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  
  -- Основная информация
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  company VARCHAR(255),
  company_size VARCHAR(50), -- '1-10', '11-50', '51-200', '200+'
  role VARCHAR(100), -- 'HR', 'C-Level', 'Owner', 'Manager'
  
  -- Источник лида
  source VARCHAR(100) NOT NULL, -- 'landing', 'telegram', 'forum', 'seo', 'ads', 'referral', 'event'
  
  -- UTM параметры (для всех источников)
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),
  
  -- Telegram специфика (если источник telegram)
  telegram_id BIGINT UNIQUE,
  telegram_username VARCHAR(255),
  telegram_first_name VARCHAR(255),
  telegram_last_name VARCHAR(255),
  
  -- Интересы и данные
  interests TEXT[], -- для telegram: ['benefits', 'ai', 'gamification']
  message TEXT, -- для landing: комментарий из формы
  
  -- Метаданные
  page_url TEXT,
  referrer TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  
  -- Статус в воронке
  status VARCHAR(50) DEFAULT 'new', 
  -- 'new', 'contacted', 'qualified', 'demo', 'proposal', 'converted', 'lost'
  
  lead_score INTEGER DEFAULT 0, -- 0-100, скоринг качества лида
  
  -- Связь с клиентами (если конвертировался)
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Менеджмент
  assigned_to VARCHAR(255), -- кому назначен лид
  last_contact_at TIMESTAMP,
  demo_scheduled_at TIMESTAMP,
  converted_at TIMESTAMP,
  notes TEXT,
  
  -- Временные метки
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_telegram_id ON leads(telegram_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);

-- Триггер для автообновления updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_timestamp 
BEFORE UPDATE ON leads
FOR EACH ROW 
EXECUTE FUNCTION update_leads_updated_at();

-- История взаимодействий с лидами
CREATE TABLE IF NOT EXISTS lead_interactions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50), -- 'email', 'call', 'demo', 'message', 'bot_interaction'
  description TEXT,
  outcome VARCHAR(100), -- 'success', 'no_answer', 'scheduled', 'declined'
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at);

-- View для аналитики по источникам
CREATE OR REPLACE VIEW leads_by_source AS
SELECT 
  source,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'new') as new,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
  COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
  COUNT(*) FILTER (WHERE status = 'demo') as demo,
  COUNT(*) FILTER (WHERE status = 'converted') as converted,
  COUNT(*) FILTER (WHERE status = 'lost') as lost,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'converted') / NULLIF(COUNT(*), 0), 2) as conversion_rate,
  AVG(lead_score) as avg_score
FROM leads
GROUP BY source
ORDER BY total DESC;

-- View для воронки конверсии
CREATE OR REPLACE VIEW leads_funnel AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  source,
  COUNT(*) as leads_count,
  COUNT(*) FILTER (WHERE status IN ('demo', 'proposal', 'converted')) as qualified_count,
  COUNT(*) FILTER (WHERE status = 'converted') as converted_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'converted') / NULLIF(COUNT(*), 0), 2) as conversion_rate
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), source
ORDER BY date DESC, source;

-- View для активных лидов (требуют внимания)
CREATE OR REPLACE VIEW leads_active AS
SELECT 
  id,
  name,
  email,
  phone,
  company,
  source,
  status,
  lead_score,
  assigned_to,
  last_contact_at,
  demo_scheduled_at,
  CASE 
    WHEN demo_scheduled_at IS NOT NULL AND demo_scheduled_at > NOW() 
      THEN 'demo_scheduled'
    WHEN last_contact_at IS NULL 
      THEN 'needs_first_contact'
    WHEN last_contact_at < NOW() - INTERVAL '7 days' 
      THEN 'needs_follow_up'
    ELSE 'in_progress'
  END as action_needed,
  created_at
FROM leads
WHERE status NOT IN ('converted', 'lost')
ORDER BY 
  CASE 
    WHEN demo_scheduled_at IS NOT NULL AND demo_scheduled_at > NOW() THEN 1
    WHEN last_contact_at IS NULL THEN 2
    WHEN last_contact_at < NOW() - INTERVAL '7 days' THEN 3
    ELSE 4
  END,
  created_at DESC;

-- Комментарии к таблице
COMMENT ON TABLE leads IS 'Единая таблица всех лидов из всех источников (лендинг, telegram, форум, сетка, SEO, реклама и т.д.)';
COMMENT ON COLUMN leads.source IS 'Источник лида: landing, telegram, forum, seo, ads, referral, event';
COMMENT ON COLUMN leads.status IS 'Статус в воронке: new, contacted, qualified, demo, proposal, converted, lost';
COMMENT ON COLUMN leads.lead_score IS 'Качество лида 0-100: учитывает полноту данных, активность, источник';
COMMENT ON COLUMN leads.client_id IS 'ID клиента из таблицы clients, если лид конвертировался';

-- Готово!
SELECT 'Упрощенная структура лидов создана!' as status;

-- Примеры использования:

-- Добавить лида с лендинга:
-- INSERT INTO leads (name, email, phone, company, company_size, role, source, utm_source, message)
-- VALUES ('Иван Иванов', 'ivan@example.com', '+79991234567', 'Рога и Копыта', '51-200', 'HR', 'landing', 'google', 'Хочу демо');

-- Добавить лида из Telegram:
-- INSERT INTO leads (name, email, telegram_id, telegram_username, telegram_first_name, role, source, interests)
-- VALUES ('Петр', 'petr@example.com', 123456789, 'petrov', 'Петр', 'C-Level', 'telegram', ARRAY['benefits', 'ai']);

-- Добавить лида с форума:
-- INSERT INTO leads (name, email, source, utm_source)
-- VALUES ('Мария', 'maria@example.com', 'forum', 'vc_ru');

-- Посмотреть статистику по источникам:
-- SELECT * FROM leads_by_source;

-- Посмотреть активные лиды:
-- SELECT * FROM leads_active LIMIT 20;





