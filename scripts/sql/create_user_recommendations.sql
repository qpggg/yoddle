-- Создание таблицы пользовательских рекомендаций
CREATE TABLE IF NOT EXISTS user_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES enter(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 1,
    test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answers JSON
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_category ON user_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_test_date ON user_recommendations(test_date);

-- Комментарии к таблице
COMMENT ON TABLE user_recommendations IS 'Таблица хранения результатов теста на льготы';
COMMENT ON COLUMN user_recommendations.user_id IS 'ID пользователя из таблицы enter';
COMMENT ON COLUMN user_recommendations.category IS 'Категория рекомендуемых льгот (health, education, sports, etc.)';
COMMENT ON COLUMN user_recommendations.priority IS 'Приоритет рекомендации (1=высший, 2=средний, 3=низкий)';
COMMENT ON COLUMN user_recommendations.test_date IS 'Дата прохождения теста';
COMMENT ON COLUMN user_recommendations.answers IS 'JSON массив ответов пользователя для аналитики'; 