-- Удаляем старого пользователя Андрея
DELETE FROM user_progress WHERE user_id = (SELECT id FROM enter WHERE login = 'andrei@gmail.com');
DELETE FROM enter WHERE login = 'andrei@gmail.com';

-- Создаем нового пользователя Андрея с правильным паролем
INSERT INTO enter (name, login, phone, position, password) 
VALUES (
    'Андрей', 
    'andrei@gmail.com', 
    '+7-999-123-45-67', 
    'Разработчик', 
    '$2a$10$yszteIbs3Oj5JveNbBgTUuqwsTEGbYbAu8obmREOTNZ.27Ey2Z7xO'
);

-- Создаем запись в user_progress
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
WHERE login = 'andrei@gmail.com';

-- Проверяем результат
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