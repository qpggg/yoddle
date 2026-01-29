-- ===================================================================
-- ОБНОВЛЕНИЕ ПАРОЛЯ ТЕСТОВОГО ПОЛЬЗОВАТЕЛЯ
-- ===================================================================
-- Обновляет пароль для test_productivity@yoddle.test на test123
-- ===================================================================

-- Обновляем пароль тестового пользователя
-- Используем простой пароль для тестирования (система поддерживает открытые пароли)
UPDATE enter
SET password = 'test123'
WHERE login = 'test_productivity@yoddle.test';

-- Проверяем результат
SELECT 
    id,
    name,
    login,
    CASE 
        WHEN password LIKE '$2a$10$%' THEN 'Пароль хеширован (bcrypt)'
        ELSE 'Пароль в открытом виде'
    END as password_status
FROM enter
WHERE login = 'test_productivity@yoddle.test';
