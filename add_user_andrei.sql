-- Добавляем пользователя Андрей
INSERT INTO enter (name, login, phone, position, password) 
VALUES (
    'Андрей', 
    'andrei@gmail.com', 
    '+7-999-123-45-67', 
    'Разработчик', 
    '$2a$10$YxGTdYOJ0hOfDNQ/.sUQGwXosi'
)
ON CONFLICT (login) DO UPDATE SET 
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    position = EXCLUDED.position,
    password = EXCLUDED.password;

-- Создаем запись в user_progress для Андрея
INSERT INTO user_progress (user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, last_activity) 
SELECT 
    id, 
    0, 
    1, 
    0, 
    0, 
    0, 
    0, 
    CURRENT_TIMESTAMP
FROM enter 
WHERE login = 'andrei@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Проверяем, что пользователь создан
SELECT 
    id,
    name,
    login,
    phone,
    position,
    CASE 
        WHEN password LIKE '$2%' THEN 'Зашифрован ✅'
        ELSE 'Не зашифрован ❌'
    END as password_status
FROM enter 
WHERE login = 'andrei@gmail.com'; 