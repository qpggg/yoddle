-- Добавляем тестовые данные активности для текущего месяца
-- Предполагаем, что у нас есть пользователь с ID 1

-- Сначала проверим какие пользователи есть в системе
SELECT id, name, email FROM users LIMIT 5;

-- Очищаем старые тестовые данные для всех пользователей
DELETE FROM activity_log WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- Добавляем разнообразные действия за текущий месяц
-- Симулируем активность пользователя: входы в систему, обновления профиля и др.

-- Добавляем данные для всех существующих пользователей
INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT 
  u.id as user_id,
  'login' as action,
  10 as xp_earned,
  'Ежедневный вход в систему' as description,
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '0 days 09:00' as created_at
FROM users u
LIMIT 10;

-- Добавляем дополнительные данные для user_id = 1 (если существует)
INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) VALUES
-- День 1 - 2 действия  
(1, 'profile_update', 25, 'Обновление профиля', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '0 days 14:30'),

-- День 3 - 1 действие
(1, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 days 08:45'),

-- День 5 - 3 действия
(1, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '4 days 09:15'),
(1, 'benefit_added', 50, 'Добавление льготы', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '4 days 11:20'),
(1, 'profile_update', 25, 'Обновление профиля', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '4 days 16:45'),

-- День 7 - 1 действие
(1, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '6 days 10:30'),

-- День 9 - 2 действия
(1, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '8 days 08:20'),
(1, 'benefit_added', 50, 'Добавление льготы', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '8 days 15:10'),

-- День 12 - 4 действия (самый активный день)
(1, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '11 days 08:00'),
(1, 'profile_update', 25, 'Обновление профиля', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '11 days 10:30'),
(1, 'benefit_added', 50, 'Добавление льготы', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '11 days 13:15'),
(1, 'login', 10, 'Вечерний вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '11 days 18:45'),

-- День 15 - 2 действия
(1, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '14 days 09:30'),
(1, 'profile_update', 25, 'Обновление профиля', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '14 days 12:00'),

-- День 18 - 1 действие
(1, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '17 days 08:15'),

-- День 20 - 3 действия
(1, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '19 days 09:00'),
(1, 'benefit_added', 50, 'Добавление льготы', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '19 days 14:20'),
(1, 'profile_update', 25, 'Обновление профиля', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '19 days 17:30'),

-- День 22 - 1 действие
(1, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '21 days 10:45'),

-- День 25 - 2 действия
(1, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '24 days 08:30'),
(1, 'profile_update', 25, 'Обновление профиля', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '24 days 16:15'),

-- День 27 - 1 действие
(1, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '26 days 09:20'),

-- Сегодняшний день (если это не последний день месяца) - 2 действия
(1, 'login', 10, 'Вход в систему сегодня', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(1, 'profile_update', 25, 'Обновление профиля сегодня', CURRENT_TIMESTAMP - INTERVAL '30 minutes');

-- Выводим информацию о добавленных данных
SELECT 
  DATE(created_at) as activity_date,
  COUNT(*) as actions_count,
  SUM(xp_earned) as total_xp
FROM activity_log 
WHERE user_id = 1 
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY DATE(created_at)
ORDER BY activity_date; 