-- =====================================================
-- ИСПРАВЛЕНИЕ ТАБЛИЦЫ ACHIEVEMENTS
-- =====================================================
-- Этот скрипт добавляет недостающие достижения в таблицу achievements

-- 1. Проверяем текущую структуру таблицы achievements
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'achievements' 
ORDER BY ordinal_position;

-- 2. Проверяем существующие записи
SELECT * FROM achievements ORDER BY id;

-- 3. Создаем таблицу achievements если её нет
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50),
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Добавляем недостающие достижения для продуктивности
INSERT INTO achievements (code, name, description, icon, xp_reward, requirement_type, requirement_value, requirement_action, tier, is_active, productivity_related, productivity_category) VALUES
    ('FIRST_MOOD', 'Первое настроение', 'Пользователь впервые записал свое настроение', '😊', 10, 'count', 1, 'mood_logged', 1, true, true, 'mood'),
    ('FIRST_ACTIVITY', 'Первая активность', 'Пользователь впервые записал активность', '🏃', 15, 'count', 1, 'activity_logged', 1, true, true, 'activity'),
    ('MOOD_STREAK_3', 'Серия настроения', '3 дня подряд записывал настроение', '🔥', 25, 'streak', 3, 'mood_logged', 1, true, true, 'consistency'),
    ('MOOD_STREAK_7', 'Неделя настроения', '7 дней подряд записывал настроение', '🌟', 50, 'streak', 7, 'mood_logged', 2, true, true, 'consistency'),
    ('ACTIVITY_STREAK_3', 'Серия активности', '3 дня подряд записывал активности', '💪', 30, 'streak', 3, 'activity_logged', 1, true, true, 'consistency'),
    ('ACTIVITY_STREAK_7', 'Неделя активности', '7 дней подряд записывал активности', '🚀', 75, 'streak', 7, 'activity_logged', 2, true, true, 'consistency'),
    ('HIGH_MOOD', 'Отличное настроение', 'Среднее настроение за неделю выше 8', '😄', 40, 'custom', 8, 'average_mood_week', 2, true, true, 'mood'),
    ('LOW_STRESS', 'Низкий стресс', 'Средний стресс за неделю ниже 3', '😌', 35, 'custom', 3, 'average_stress_week', 2, true, true, 'stress'),
    ('PRODUCTIVE_DAY', 'Продуктивный день', 'Выполнил 5+ активностей за день', '📈', 45, 'custom', 5, 'daily_activities', 2, true, true, 'productivity'),
    ('QUALITY_NOTES', 'Качественные заметки', 'Написал заметки длиной 50+ символов', '✍️', 20, 'custom', 50, 'note_length', 1, true, true, 'quality'),
    ('VARIETY_ACTIVITIES', 'Разнообразие', 'Записал активности из 3+ разных категорий', '🎯', 30, 'custom', 3, 'activity_categories', 2, true, true, 'variety'),
    ('CONSISTENT_WEEK', 'Стабильная неделя', 'Каждый день недели записывал данные', '📅', 100, 'custom', 7, 'daily_logging', 3, true, true, 'consistency')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    xp_reward = EXCLUDED.xp_reward,
    requirement_type = EXCLUDED.requirement_type,
    requirement_value = EXCLUDED.requirement_value,
    requirement_action = EXCLUDED.requirement_action,
    tier = EXCLUDED.tier,
    is_active = EXCLUDED.is_active,
    productivity_related = EXCLUDED.productivity_related,
    productivity_category = EXCLUDED.productivity_category;

-- 5. Проверяем, что все достижения добавлены
SELECT 
    code,
    name,
    productivity_category,
    xp_reward
FROM achievements 
WHERE productivity_related = true
ORDER BY xp_reward;

-- 6. Проверяем, что триггер работает
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'ai_signals';

-- 7. Тестируем вставку в ai_signals (должно работать без ошибок)
-- INSERT INTO ai_signals (user_id, type, data, timestamp) 
-- VALUES (1, 'test', '{"test": true}', NOW());
