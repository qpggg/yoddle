-- Создание таблицы прогресса пользователей
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    login_streak INTEGER DEFAULT 0,
    days_active INTEGER DEFAULT 0,
    benefits_used INTEGER DEFAULT 0,
    profile_completion INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Создание таблицы достижений пользователей
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    achievement_id VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Создание таблицы журнала активности (для отслеживания получения XP)
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_xp ON user_progress(xp);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- Добавление триггера для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_progress_updated_at 
    BEFORE UPDATE ON user_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Вставка базовых данных для тестирования
INSERT INTO user_progress (user_id, xp, level, login_streak, days_active, benefits_used, profile_completion) 
VALUES (1, 150, 2, 5, 12, 2, 75) 
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_achievements (user_id, achievement_id) 
VALUES 
    (1, 'first_login'),
    (1, 'first_benefit')
ON CONFLICT (user_id, achievement_id) DO NOTHING;

INSERT INTO activity_log (user_id, action, xp_earned, description) 
VALUES 
    (1, 'login', 10, 'Ежедневный вход в систему'),
    (1, 'benefit_selected', 50, 'Выбрана первая льгота'),
    (1, 'profile_update', 25, 'Обновление профиля'),
    (1, 'daily_login', 10, 'Ежедневный вход (день 2)'),
    (1, 'benefit_used', 25, 'Использование льготы')
ON CONFLICT DO NOTHING; 