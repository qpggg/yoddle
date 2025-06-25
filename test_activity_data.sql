-- Добавляем тестовые данные активности для текущего месяца
-- Предполагаем, что у нас есть пользователь с ID 1

-- Сначала проверим какие пользователи есть в системе
SELECT id, name, login as email FROM enter LIMIT 5;

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
FROM enter u
LIMIT 10;

-- Добавляем дополнительные данные для всех пользователей (если существуют)
-- Используем подзапрос для получения ID всех пользователей из таблицы enter
INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT 
  u.id,
  'profile_update' as action,
  25 as xp_earned,
  'Обновление профиля' as description,
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '0 days 14:30' as created_at
FROM enter u;

-- День 3 - 1 действие для всех пользователей
INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT 
  u.id,
  'login' as action,
  10 as xp_earned,
  'Ежедневный вход в систему' as description,
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 days 08:45' as created_at
FROM enter u;

-- День 5 - 3 действия для всех пользователей
INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT 
  u.id,
  'login' as action,
  10 as xp_earned,
  'Ежедневный вход в систему' as description,
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '4 days 09:15' as created_at
FROM enter u;
-- Добавляем больше разнообразных данных для всех пользователей

-- День 7 - 1 действие для всех пользователей
INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT u.id, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '6 days 10:30'
FROM enter u;

-- День 9 - 2 действия для всех пользователей  
INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT u.id, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '8 days 08:20'
FROM enter u;

INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT u.id, 'benefit_added', 50, 'Добавление льготы', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '8 days 15:10'
FROM enter u;

-- День 12 - 4 действия (самый активный день) для всех пользователей
INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT u.id, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '11 days 08:00'
FROM enter u;

INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT u.id, 'profile_update', 25, 'Обновление профиля', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '11 days 10:30'
FROM enter u;

INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT u.id, 'benefit_added', 50, 'Добавление льготы', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '11 days 13:15'
FROM enter u;

INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT u.id, 'login', 10, 'Вечерний вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '11 days 18:45'
FROM enter u;

-- День 15 - 2 действия для всех пользователей
INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT u.id, 'login', 10, 'Ежедневный вход в систему', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '14 days 09:30'
FROM enter u;

INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT u.id, 'profile_update', 25, 'Обновление профиля', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '14 days 12:00'
FROM enter u;

-- Сегодняшний день - 2 действия для всех пользователей
INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT u.id, 'login', 10, 'Вход в систему сегодня', CURRENT_TIMESTAMP - INTERVAL '2 hours'
FROM enter u;

INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) 
SELECT u.id, 'profile_update', 25, 'Обновление профиля сегодня', CURRENT_TIMESTAMP - INTERVAL '30 minutes'
FROM enter u;

-- Выводим информацию о добавленных данных для всех пользователей
SELECT 
  user_id,
  DATE(created_at) as activity_date,
  COUNT(*) as actions_count,
  SUM(xp_earned) as total_xp
FROM activity_log 
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY user_id, DATE(created_at)
ORDER BY user_id, activity_date; 