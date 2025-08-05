-- Проверяем пользователя Андрея
SELECT 
    id,
    name,
    login,
    phone,
    position,
    password,
    CASE 
        WHEN password LIKE '$2%' THEN 'Зашифрован ✅'
        ELSE 'Не зашифрован ❌'
    END as password_status,
    LENGTH(password) as password_length
FROM enter 
WHERE login = 'andrei@gmail.com';

-- Проверяем user_progress
SELECT 
    user_id,
    xp,
    level,
    login_streak,
    last_activity
FROM user_progress up
JOIN enter e ON up.user_id = e.id
WHERE e.login = 'andrei@gmail.com'; 