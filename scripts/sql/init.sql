-- Создание основных таблиц
CREATE TABLE IF NOT EXISTS enter (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    login VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(20),
    position VARCHAR(100),
    avatar_url TEXT
);

-- Таблица активности
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES enter(id),
    action VARCHAR(50),
    xp_earned INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица прогресса
CREATE TABLE IF NOT EXISTS user_progress (
    user_id INTEGER PRIMARY KEY REFERENCES enter(id),
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    login_streak INTEGER DEFAULT 0,
    days_active INTEGER DEFAULT 0,
    benefits_used INTEGER DEFAULT 0,
    profile_completion INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица льгот
CREATE TABLE IF NOT EXISTS benefits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    category VARCHAR(50)
);

-- Таблица рекомендаций
CREATE TABLE IF NOT EXISTS benefit_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES enter(id),
    benefit_id INTEGER REFERENCES benefits(id),
    priority INTEGER,
    answers JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестовый пользователь для разработки
INSERT INTO enter (name, login, password, position) 
VALUES ('Test User', 'test@example.com', 'password', 'Developer')
ON CONFLICT (login) DO NOTHING;

