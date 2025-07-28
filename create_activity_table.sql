-- Создание таблицы для логирования активности пользователей
CREATE TABLE IF NOT EXISTS user_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);

-- Добавление комментариев
COMMENT ON TABLE user_activity IS 'Таблица для логирования активности пользователей';
COMMENT ON COLUMN user_activity.action IS 'Тип действия (login, logout, benefit_added, etc.)';
COMMENT ON COLUMN user_activity.details IS 'Дополнительная информация о действии'; 