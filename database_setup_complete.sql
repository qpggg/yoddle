-- ===================================================================
-- ПОЛНАЯ ИНИЦИАЛИЗАЦИЯ БД YODDLE
-- Включает все таблицы: основные + лиды из всех источников
-- ===================================================================

-- Лиды с лендинга
CREATE TABLE IF NOT EXISTS landing_leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  company_size VARCHAR(50), -- '1-10', '11-50', '51-200', '200+'
  role VARCHAR(100), -- 'HR', 'C-Level', 'Owner', 'Manager'
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),
  message TEXT,
  page_url TEXT,
  referrer TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  source VARCHAR(100) DEFAULT 'landing',
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, demo, converted, lost
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Лиды из Telegram бота
CREATE TABLE IF NOT EXISTS telegram_leads (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(100),
  email VARCHAR(255),
  interests TEXT[], -- ARRAY типа TEXT
  utm_source VARCHAR(100), -- откуда пришел в бота
  source VARCHAR(100) DEFAULT 'telegram_bot',
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Единая таблица всех лидов (агрегированная)
CREATE TABLE IF NOT EXISTS leads_unified (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  company_size VARCHAR(50),
  role VARCHAR(100),
  
  -- Источники
  source VARCHAR(100) NOT NULL, -- 'landing', 'telegram', 'seo', 'ads', 'referral'
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  -- Связь с другими таблицами
  telegram_id BIGINT,
  landing_lead_id INTEGER,
  
  -- Статус в воронке
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, demo, proposal, converted, lost
  lead_score INTEGER DEFAULT 0, -- Скоринг лида (0-100)
  
  -- Активность
  last_contact_at TIMESTAMP,
  demo_scheduled_at TIMESTAMP,
  converted_at TIMESTAMP,
  
  -- Метаданные
  notes TEXT,
  assigned_to VARCHAR(255), -- кому назначен лид
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Взаимодействия с лидами
CREATE TABLE IF NOT EXISTS lead_interactions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads_unified(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50), -- 'email', 'call', 'demo', 'message', 'bot_message'
  description TEXT,
  outcome VARCHAR(100), -- 'success', 'no_answer', 'scheduled', 'declined'
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_landing_leads_email ON landing_leads(email);
CREATE INDEX IF NOT EXISTS idx_landing_leads_created_at ON landing_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_landing_leads_source ON landing_leads(source);
CREATE INDEX IF NOT EXISTS idx_landing_leads_status ON landing_leads(status);

CREATE INDEX IF NOT EXISTS idx_telegram_leads_telegram_id ON telegram_leads(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_leads_email ON telegram_leads(email);
CREATE INDEX IF NOT EXISTS idx_telegram_leads_created_at ON telegram_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_telegram_leads_status ON telegram_leads(status);

CREATE INDEX IF NOT EXISTS idx_leads_unified_email ON leads_unified(email);
CREATE INDEX IF NOT EXISTS idx_leads_unified_source ON leads_unified(source);
CREATE INDEX IF NOT EXISTS idx_leads_unified_status ON leads_unified(status);
CREATE INDEX IF NOT EXISTS idx_leads_unified_created_at ON leads_unified(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_unified_telegram_id ON leads_unified(telegram_id);

CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at);

-- Триггер для автообновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_landing_leads_updated_at BEFORE UPDATE ON landing_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_leads_updated_at BEFORE UPDATE ON telegram_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_unified_updated_at BEFORE UPDATE ON leads_unified
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вью для аналитики лидов
CREATE OR REPLACE VIEW leads_analytics AS
SELECT 
  DATE(created_at) as date,
  source,
  status,
  COUNT(*) as count,
  COUNT(DISTINCT email) as unique_emails
FROM leads_unified
GROUP BY DATE(created_at), source, status
ORDER BY date DESC, source, status;

-- Вью для воронки конверсии
CREATE OR REPLACE VIEW leads_funnel AS
SELECT 
  source,
  COUNT(*) FILTER (WHERE status = 'new') as new_leads,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
  COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
  COUNT(*) FILTER (WHERE status = 'demo') as demo,
  COUNT(*) FILTER (WHERE status = 'proposal') as proposal,
  COUNT(*) FILTER (WHERE status = 'converted') as converted,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'converted') / NULLIF(COUNT(*), 0), 2) as conversion_rate
FROM leads_unified
GROUP BY source;

-- Комментарии к таблицам
COMMENT ON TABLE landing_leads IS 'Лиды, пришедшие с лендинга yoddle.com';
COMMENT ON TABLE telegram_leads IS 'Лиды, пришедшие через Telegram бота';
COMMENT ON TABLE leads_unified IS 'Агрегированная таблица всех лидов из всех источников';
COMMENT ON TABLE lead_interactions IS 'История взаимодействий с лидами';

-- Готово!
SELECT 'База данных Yoddle успешно инициализирована!' as status;





