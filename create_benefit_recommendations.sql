-- Создание таблицы для связи пользователей с рекомендованными льготами
CREATE TABLE IF NOT EXISTS benefit_recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  benefit_id INTEGER NOT NULL,
  priority INTEGER NOT NULL, -- 1, 2, 3 (порядок рекомендации)
  answers JSONB, -- сохраняем ответы теста для анализа
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE,
  FOREIGN KEY (benefit_id) REFERENCES benefits(id) ON DELETE CASCADE,
  UNIQUE(user_id, benefit_id) -- один пользователь не может иметь одну льготу дважды в рекомендациях
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_benefit_recommendations_user_id ON benefit_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_benefit_recommendations_benefit_id ON benefit_recommendations(benefit_id); 