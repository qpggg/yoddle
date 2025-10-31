-- SQL команды для расширения БД под умные рекомендации
-- Применять вручную в PostgreSQL

-- 1. Создать таблицу для фидбека по карточкам льгот
CREATE TABLE IF NOT EXISTS ai_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  benefit_id BIGINT,
  label TEXT NOT NULL,             -- 'useful' | 'not_useful' | 'added' | 'ignored'
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS ai_feedback_user_idx ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS ai_feedback_benefit_idx ON ai_feedback(benefit_id);
CREATE INDEX IF NOT EXISTS ai_feedback_created_idx ON ai_feedback(created_at);

-- 2. Расширить таблицу benefit_recommendations для объяснимости и метрик
ALTER TABLE benefit_recommendations
  ADD COLUMN IF NOT EXISTS explanations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS confidence DOUBLE PRECISION DEFAULT 0.6,
  ADD COLUMN IF NOT EXISTS algorithm_variant TEXT DEFAULT 'static',
  ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}'::jsonb;

-- Проверить результат
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'benefit_recommendations';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ai_feedback';















