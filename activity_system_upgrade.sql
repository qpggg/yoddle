-- МОДЕРНИЗАЦИЯ СИСТЕМЫ АКТИВНОСТИ И ДОСТИЖЕНИЙ
-- Создание нормализованной структуры БД

-- 1. СПРАВОЧНИК ТИПОВ АКТИВНОСТИ
CREATE TABLE IF NOT EXISTS activity_types (
    id SERIAL PRIMARY KEY,
    action_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    xp_reward INTEGER DEFAULT 0,
    icon VARCHAR(50),
    category VARCHAR(50), -- 'system', 'user', 'achievement'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. СПРАВОЧНИК ДОСТИЖЕНИЙ
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    xp_reward INTEGER DEFAULT 0,
    requirement_type VARCHAR(50), -- 'count', 'streak', 'total_xp', 'login_days', etc.
    requirement_value INTEGER,
    requirement_action VARCHAR(50), -- для requirement_type = 'count'
    tier INTEGER DEFAULT 1, -- уровень достижения (1-базовый, 2-продвинутый, 3-мастер)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ДОБАВЛЕНИЕ СВЯЗИ В ACTIVITY_LOG
ALTER TABLE activity_log 
ADD COLUMN IF NOT EXISTS activity_type_id INTEGER REFERENCES activity_types(id);

-- 4. ЗАПОЛНЕНИЕ СПРАВОЧНИКА ТИПОВ АКТИВНОСТИ
INSERT INTO activity_types (action_code, name, description, xp_reward, icon, category) VALUES
-- Системные действия
('login', 'Вход в систему', 'Ежедневный вход в платформу', 10, '🔐', 'system'),
('first_login_today', 'Первый вход за день', 'Бонус за первый вход в течение дня', 15, '🌅', 'system'),
('profile_update', 'Обновление профиля', 'Изменение данных профиля', 25, '👤', 'user'),
('avatar_upload', 'Загрузка аватара', 'Добавление фотографии профиля', 30, '📸', 'user'),

-- Льготы и преференции  
('benefit_added', 'Добавление льготы', 'Подключение новой льготы', 50, '🎁', 'user'),
('benefit_used', 'Использование льготы', 'Применение активированной льготы', 25, '✨', 'user'),
('preferences_test', 'Тест предпочтений', 'Прохождение теста для получения рекомендаций', 75, '📋', 'user'),
('recommendations_received', 'Получение рекомендаций', 'Система выдала персональные рекомендации', 20, '🎯', 'system'),

-- Прогресс и активность
('progress_view', 'Просмотр прогресса', 'Открытие страницы аналитики', 5, '📊', 'user'),
('level_up', 'Повышение уровня', 'Достижение нового уровня', 100, '⬆️', 'achievement'),
('streak_milestone', 'Серия входов', 'Достижение серии ежедневных входов', 50, '🔥', 'achievement')

ON CONFLICT (action_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    xp_reward = EXCLUDED.xp_reward,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category;

-- 5. ЗАПОЛНЕНИЕ СПРАВОЧНИКА ДОСТИЖЕНИЙ  
INSERT INTO achievements (code, name, description, icon, xp_reward, requirement_type, requirement_value, requirement_action, tier) VALUES
-- Достижения за входы
('first_login', 'Добро пожаловать!', 'Первый вход в систему', '👋', 25, 'count', 1, 'login', 1),
('login_streak_3', 'Постоянство', '3 дня подряд в системе', '🔥', 50, 'streak', 3, 'login', 1),
('login_streak_7', 'Привычка', '7 дней подряд в системе', '⭐', 100, 'streak', 7, 'login', 2),
('login_streak_30', 'Преданность', '30 дней подряд в системе', '👑', 300, 'streak', 30, 'login', 3),

-- Достижения за активность
('profile_complete', 'Готов к работе!', 'Полностью заполненный профиль', '✅', 75, 'custom', 100, 'profile_completion', 1),
('first_benefit', 'Первые шаги', 'Добавлена первая льгота', '🎁', 50, 'count', 1, 'benefit_added', 1),
('benefit_collector', 'Коллекционер', 'Добавлено 5 льгот', '🏆', 150, 'count', 5, 'benefit_added', 2),
('benefit_master', 'Мастер льгот', 'Добавлено 10 льгот', '💎', 300, 'count', 10, 'benefit_added', 3),

-- Достижения за XP
('xp_100', 'Новичок', 'Набрано 100 XP', '🌱', 25, 'total_xp', 100, NULL, 1),
('xp_500', 'Активист', 'Набрано 500 XP', '🚀', 75, 'total_xp', 500, NULL, 2),
('xp_1000', 'Эксперт', 'Набрано 1000 XP', '⚡', 150, 'total_xp', 1000, NULL, 3),
('xp_2500', 'Чемпион', 'Набрано 2500 XP', '🏅', 300, 'total_xp', 2500, NULL, 3),

-- Специальные достижения
('early_bird', 'Ранняя пташка', 'Вход в систему до 9:00', '🐦', 30, 'custom', 1, 'early_login', 1),
('night_owl', 'Сова', 'Вход в систему после 22:00', '🦉', 30, 'custom', 1, 'late_login', 1),
('weekend_warrior', 'Воин выходных', 'Активность в выходные дни', '⚔️', 40, 'custom', 1, 'weekend_activity', 2)

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    xp_reward = EXCLUDED.xp_reward,
    requirement_type = EXCLUDED.requirement_type,
    requirement_value = EXCLUDED.requirement_value,
    requirement_action = EXCLUDED.requirement_action,
    tier = EXCLUDED.tier;

-- 6. ОБНОВЛЕНИЕ СВЯЗЕЙ В СУЩЕСТВУЮЩИХ ДАННЫХ
-- Связываем существующие записи activity_log с новыми типами активности
UPDATE activity_log 
SET activity_type_id = (
    SELECT id FROM activity_types 
    WHERE activity_types.action_code = activity_log.action
)
WHERE activity_type_id IS NULL;

-- 7. СОЗДАНИЕ ИНДЕКСОВ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
CREATE INDEX IF NOT EXISTS idx_activity_types_action_code ON activity_types(action_code);
CREATE INDEX IF NOT EXISTS idx_activity_types_category ON activity_types(category);
CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code);
CREATE INDEX IF NOT EXISTS idx_achievements_requirement_type ON achievements(requirement_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_activity_type_id ON activity_log(activity_type_id);

-- 8. СОЗДАНИЕ ПРЕДСТАВЛЕНИЯ ДЛЯ УДОБНЫХ ЗАПРОСОВ
CREATE OR REPLACE VIEW activity_log_detailed AS
SELECT 
    al.id,
    al.user_id,
    al.action,
    at.name as action_name,
    at.description as action_description,
    at.icon as action_icon,
    at.category,
    al.xp_earned,
    at.xp_reward as default_xp_reward,
    al.description,
    al.created_at
FROM activity_log al
LEFT JOIN activity_types at ON al.activity_type_id = at.id
ORDER BY al.created_at DESC;

-- 9. ВЫВОД ИНФОРМАЦИИ О СОЗДАННЫХ ОБЪЕКТАХ
SELECT 'Создано типов активности: ' || COUNT(*) as info FROM activity_types;
SELECT 'Создано достижений: ' || COUNT(*) as info FROM achievements;
SELECT 'Обновлено записей активности: ' || COUNT(*) as info FROM activity_log WHERE activity_type_id IS NOT NULL; 