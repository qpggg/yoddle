-- AI Database Setup для Yoddle
-- Создание таблиц для AI системы продуктивности

-- 1. Таблица для AI сигналов от пользователей
CREATE TABLE IF NOT EXISTS ai_signals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES enter(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('mood', 'activity', 'stress', 'goal', 'achievement')),
    data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Таблица для AI инсайтов
CREATE TABLE IF NOT EXISTS ai_insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES enter(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE NULL
);

-- 3. Таблица для AI рекомендаций
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES enter(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    action_taken BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NULL
);

-- 4. Таблица для AI настроек пользователя
CREATE TABLE IF NOT EXISTS ai_user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES enter(id) ON DELETE CASCADE,
    analysis_frequency VARCHAR(20) DEFAULT 'daily' CHECK (analysis_frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
    privacy_level VARCHAR(20) DEFAULT 'standard' CHECK (privacy_level IN ('minimal', 'standard', 'detailed')),
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "in_app": true}',
    ai_personality VARCHAR(50) DEFAULT 'supportive' CHECK (ai_personality IN ('supportive', 'motivational', 'analytical', 'friendly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Таблица для AI метрик и статистики
CREATE TABLE IF NOT EXISTS ai_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES enter(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_date DATE NOT NULL,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_ai_signals_user_id ON ai_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_signals_type ON ai_signals(type);
CREATE INDEX IF NOT EXISTS idx_ai_signals_timestamp ON ai_signals(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_signals_user_type ON ai_signals(user_id, type);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_priority ON ai_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_category ON ai_recommendations(category);

CREATE INDEX IF NOT EXISTS idx_ai_metrics_user_id ON ai_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_date ON ai_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_type ON ai_metrics(metric_type);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_user_preferences_updated_at 
    BEFORE UPDATE ON ai_user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставка базовых настроек для существующих пользователей
INSERT INTO ai_user_preferences (user_id, analysis_frequency, privacy_level, ai_personality)
SELECT id, 'daily', 'standard', 'supportive'
FROM enter
WHERE id NOT IN (SELECT user_id FROM ai_user_preferences);

-- Комментарии к таблицам
COMMENT ON TABLE ai_signals IS 'AI сигналы от пользователей (настроение, активность, стресс)';
COMMENT ON TABLE ai_insights IS 'AI инсайты и анализ для пользователей';
COMMENT ON TABLE ai_recommendations IS 'AI рекомендации и советы';
COMMENT ON TABLE ai_user_preferences IS 'Настройки AI для каждого пользователя';
COMMENT ON TABLE ai_metrics IS 'Метрики и статистика для AI анализа';

-- Проверка создания таблиц
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count
FROM information_schema.tables t
WHERE table_name LIKE 'ai_%'
ORDER BY table_name;

-- ========================================
-- 🧪 ТЕСТОВЫЕ ДАННЫЕ ДЛЯ AI СИСТЕМЫ
-- ========================================

-- 1. Тестовый пользователь уже существует в таблице enter
-- Пропускаем создание пользователя

-- 2. Тестовые данные для ai_signals
INSERT INTO ai_signals (user_id, type, data, timestamp) VALUES
-- Пользователь 1 - последние 7 дней
(1, 'mood', '{"mood": 8, "activities": ["работа", "спорт"], "notes": "Отличный день! Завершил проект", "stressLevel": 2}', NOW()),
(1, 'activity', '{"activity": "Завершение проекта", "category": "работа", "duration": 180, "success": true, "notes": "Проект сдан в срок"}', NOW()),
(1, 'stress', '{"stressLevel": 2, "source": "работа", "notes": "Чувствую удовлетворение"}', NOW()),

-- День 2 (вчера)
(1, 'mood', '{"mood": 6, "activities": ["работа", "чтение"], "notes": "Обычный день, немного устал", "stressLevel": 4}', NOW() - INTERVAL '1 day'),
(1, 'activity', '{"activity": "Чтение технической литературы", "category": "обучение", "duration": 60, "success": true, "notes": "Прочитал 2 главы"}', NOW() - INTERVAL '1 day'),

-- День 3
(1, 'mood', '{"mood": 9, "activities": ["спорт", "встреча с друзьями"], "notes": "Отличный выходной!", "stressLevel": 1}', NOW() - INTERVAL '2 days'),
(1, 'activity', '{"activity": "Тренировка в зале", "category": "спорт", "duration": 90, "success": true, "notes": "Интенсивная тренировка"}', NOW() - INTERVAL '2 days'),

-- День 4
(1, 'mood', '{"mood": 5, "activities": ["работа"], "notes": "Сложный день на работе", "stressLevel": 7}', NOW() - INTERVAL '3 days'),
(1, 'activity', '{"activity": "Решение проблем на проекте", "category": "работа", "duration": 240, "success": false, "notes": "Не удалось решить все проблемы"}', NOW() - INTERVAL '3 days'),

-- День 5
(1, 'mood', '{"mood": 7, "activities": ["работа", "музыка"], "notes": "Лучше чем вчера", "stressLevel": 3}', NOW() - INTERVAL '4 days'),
(1, 'activity', '{"activity": "Игра на гитаре", "category": "хобби", "duration": 45, "success": true, "notes": "Разучил новую песню"}', NOW() - INTERVAL '4 days'),

-- День 6
(1, 'mood', '{"mood": 8, "activities": ["работа", "спорт"], "notes": "Продуктивный день", "stressLevel": 2}', NOW() - INTERVAL '5 days'),
(1, 'activity', '{"activity": "Пробежка", "category": "спорт", "duration": 30, "success": true, "notes": "5 км за 25 минут"}', NOW() - INTERVAL '5 days'),

-- День 7
(1, 'mood', '{"mood": 6, "activities": ["работа"], "notes": "Начало недели", "stressLevel": 5}', NOW() - INTERVAL '6 days'),
(1, 'activity', '{"activity": "Планирование недели", "category": "работа", "duration": 120, "success": true, "notes": "Составил план задач"}', NOW() - INTERVAL '6 days');

-- 3. Тестовые данные для ai_insights
INSERT INTO ai_insights (user_id, type, content, metadata, created_at) VALUES
-- AI инсайты для пользователя 1
(1, 'mood_analysis', 'Ваше настроение сегодня отличное (8/10)! Вы завершили важный проект и занимались спортом, что положительно влияет на ваше состояние. Уровень стресса низкий (2/10), что говорит о хорошем балансе работы и отдыха. Рекомендую продолжать в том же духе и не забывать про физическую активность.', '{"mood": 8, "activities": ["работа", "спорт"], "stressLevel": 2}', NOW()),
(1, 'weekly_insight', 'За неделю вы показали отличную динамику! Ваше настроение стабильно высокое (среднее 7.1/10), с пиками в выходные дни. Вы активно занимаетесь спортом, что помогает снижать стресс. На работе есть как успехи, так и сложности - это нормально. Рекомендую продолжать спортивные тренировки и планировать сложные задачи на начало недели.', '{"weekStart": "2024-12-14", "weekEnd": "2024-12-20", "dataPoints": 21}', NOW() - INTERVAL '1 day'),
(1, 'activity_review', 'Ваша активность "Завершение проекта" была очень успешной! Вы потратили 3 часа и достигли результата. Это показывает вашу целеустремленность и навыки управления временем. Продолжайте в том же духе!', '{"activity": "Завершение проекта", "duration": 180, "success": true}', NOW() - INTERVAL '2 days');

-- 4. Тестовые данные для ai_recommendations
INSERT INTO ai_recommendations (user_id, category, message, priority, created_at) VALUES
-- Рекомендации для пользователя 1
(1, 'спорт', 'Продолжайте заниматься спортом 3-4 раза в неделю. Это помогает поддерживать высокое настроение и снижать стресс.', 'low', NOW()),
(1, 'работа', 'Планируйте сложные задачи на начало недели, когда у вас больше энергии. Используйте выходные для отдыха и восстановления.', 'medium', NOW()),
(1, 'здоровье', 'Добавьте медитацию 10-15 минут в день для лучшего управления стрессом.', 'medium', NOW() - INTERVAL '1 day'),
(1, 'продуктивность', 'Ведите дневник достижений. Записывайте 3 успеха каждый день для поддержания мотивации.', 'low', NOW() - INTERVAL '2 days');

-- 5. Тестовые данные для ai_user_preferences
INSERT INTO ai_user_preferences (user_id, analysis_frequency, privacy_level, ai_personality, notification_preferences, created_at, updated_at) VALUES
(1, 'daily', 'standard', 'supportive', '{"email": true, "push": true, "in_app": true}', NOW(), NOW());

-- 6. Тестовые данные для ai_metrics
INSERT INTO ai_metrics (user_id, metric_type, metric_value, metric_date, context, created_at) VALUES
-- Метрики для пользователя 1
(1, 'average_mood', 7.1, CURRENT_DATE, '{"period": "7_days", "data_points": 21}', NOW()),
(1, 'stress_reduction', 0.6, CURRENT_DATE, '{"baseline": 5.0, "current": 2.0}', NOW()),
(1, 'activity_success_rate', 85.7, CURRENT_DATE, '{"successful": 6, "total": 7}', NOW()),
(1, 'sport_frequency', 3.0, CURRENT_DATE, '{"activities": 3, "days": 7}', NOW());

-- ========================================
-- 📊 ПРОВЕРКА СОЗДАННЫХ ДАННЫХ
-- ========================================

-- Проверка количества записей в каждой таблице
SELECT 'ai_signals' as table_name, COUNT(*) as count FROM ai_signals
UNION ALL
SELECT 'ai_insights', COUNT(*) FROM ai_insights
UNION ALL
SELECT 'ai_recommendations', COUNT(*) FROM ai_recommendations
UNION ALL
SELECT 'ai_user_preferences', COUNT(*) FROM ai_user_preferences
UNION ALL
SELECT 'ai_metrics', COUNT(*) FROM ai_metrics;

-- Проверка последних сигналов пользователя 1
SELECT 'Последние сигналы пользователя 1:' as info;
SELECT type, data, timestamp FROM ai_signals WHERE user_id = 1 ORDER BY timestamp DESC LIMIT 3;

-- Проверка последних инсайтов
SELECT 'Последние AI инсайты:' as info;
SELECT user_id, type, LEFT(content, 100) || '...' as content_preview, created_at FROM ai_insights ORDER BY created_at DESC LIMIT 3;

-- Проверка рекомендаций по приоритету
SELECT 'Рекомендации по приоритету:' as info;
SELECT user_id, category, priority, LEFT(message, 80) || '...' as message_preview FROM ai_recommendations ORDER BY priority DESC, created_at DESC LIMIT 5;

-- Проверка настроек пользователей
SELECT 'Настройки AI пользователей:' as info;
SELECT user_id, analysis_frequency, privacy_level, ai_personality FROM ai_user_preferences ORDER BY user_id;

-- Проверка метрик
SELECT 'AI метрики:' as info;
SELECT user_id, metric_type, metric_value, metric_date FROM ai_metrics ORDER BY user_id, metric_type;
