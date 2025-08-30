-- =====================================================
-- ТЕСТОВЫЕ ДАННЫЕ ДЛЯ ПРОВЕРКИ СИСТЕМЫ ПРОДУКТИВНОСТИ
-- Пользователь ID = 3
-- =====================================================

-- Очищаем старые тестовые данные (если есть)
DELETE FROM ai_signals WHERE user_id = 3 AND timestamp >= CURRENT_DATE - INTERVAL '7 days';
DELETE FROM activity_log WHERE user_id = 3 AND created_at >= CURRENT_DATE - INTERVAL '7 days';

-- =====================================================
-- ДАННЫЕ ЗА ПОСЛЕДНЮЮ НЕДЕЛЮ (ПОНЕДЕЛЬНИК - ВОСКРЕСЕНЬЕ)
-- =====================================================

-- ПОНЕДЕЛЬНИК (CURRENT_DATE - 6)
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating) VALUES
(3, 'mood', '{"mood": 8, "energy": 7, "stress": 2, "notes": "Хорошее настроение утром", "activities": ["daily_mood_check"], "stressLevel": 2}', CURRENT_DATE - INTERVAL '6 days' + INTERVAL '09:00', CURRENT_DATE - INTERVAL '6 days' + INTERVAL '09:00', 8, 7, 2, 1.00, 'Хорошее настроение утром', 'mood_check', NULL, NULL),
(3, 'mood', '{"mood": 7, "energy": 6, "stress": 3, "notes": "Вечерний отчет настроения", "activities": ["daily_mood_report"], "stressLevel": 3}', CURRENT_DATE - INTERVAL '6 days' + INTERVAL '18:00', CURRENT_DATE - INTERVAL '6 days' + INTERVAL '18:00', 7, 6, 3, 1.00, 'Вечерний отчет настроения', 'daily_report', NULL, NULL),
(3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Завершил важную задачу", "activities": ["daily_activity_report"], "stressLevel": 1, "success": true}', CURRENT_DATE - INTERVAL '6 days' + INTERVAL '18:00', CURRENT_DATE - INTERVAL '6 days' + INTERVAL '18:00', NULL, NULL, NULL, 1.00, 'Завершил важную задачу', 'task_completion', 120, 9);

INSERT INTO activity_log (user_id, action, xp_earned, created_at) VALUES
(3, 'daily_mood_report', 25, CURRENT_DATE - INTERVAL '6 days' + INTERVAL '18:00'),
(3, 'daily_activity_report', 30, CURRENT_DATE - INTERVAL '6 days' + INTERVAL '18:00'),
(3, 'task_completed', 15, CURRENT_DATE - INTERVAL '6 days' + INTERVAL '10:30'),
(3, 'meeting_attended', 20, CURRENT_DATE - INTERVAL '6 days' + INTERVAL '14:00');

-- ВТОРНИК (CURRENT_DATE - 5)
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating) VALUES
(3, 'mood', '{"mood": 9, "energy": 8, "stress": 1, "notes": "Отличное настроение", "activities": ["daily_mood_check"], "stressLevel": 1}', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '08:30', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '08:30', 9, 8, 1, 1.00, 'Отличное настроение', 'mood_check', NULL, NULL),
(3, 'mood', '{"mood": 8, "energy": 7, "stress": 2, "notes": "Вечерний отчет", "activities": ["daily_mood_report"], "stressLevel": 2}', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '17:30', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '17:30', 8, 7, 2, 1.00, 'Вечерний отчет', 'daily_report', NULL, NULL),
(3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Достиг вехи проекта", "activities": ["daily_activity_report"], "stressLevel": 1, "success": true}', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '17:30', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '17:30', NULL, NULL, NULL, 1.00, 'Достиг вехи проекта', 'project_milestone', 180, 10);

INSERT INTO activity_log (user_id, action, xp_earned, created_at) VALUES
(3, 'daily_mood_report', 25, CURRENT_DATE - INTERVAL '5 days' + INTERVAL '17:30'),
(3, 'daily_activity_report', 30, CURRENT_DATE - INTERVAL '5 days' + INTERVAL '17:30'),
(3, 'project_milestone', 25, CURRENT_DATE - INTERVAL '5 days' + INTERVAL '11:00'),
(3, 'code_review', 15, CURRENT_DATE - INTERVAL '5 days' + INTERVAL '15:30');

-- СРЕДА (CURRENT_DATE - 4)
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating) VALUES
(3, 'mood', '{"mood": 6, "energy": 5, "stress": 4, "notes": "Устал, но держусь", "activities": ["daily_mood_check"], "stressLevel": 4}', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '09:15', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '09:15', 6, 5, 4, 1.00, 'Устал, но держусь', 'mood_check', NULL, NULL),
(3, 'mood', '{"mood": 6, "energy": 5, "stress": 3, "notes": "Вечерний отчет", "activities": ["daily_mood_report"], "stressLevel": 3}', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '18:15', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '18:15', 6, 5, 3, 1.00, 'Вечерний отчет', 'daily_report', NULL, NULL),
(3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Исправил баг", "activities": ["daily_activity_report"], "stressLevel": 2, "success": true}', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '18:15', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '18:15', NULL, NULL, NULL, 1.00, 'Исправил баг', 'bug_fix', 90, 8);

INSERT INTO activity_log (user_id, action, xp_earned, created_at) VALUES
(3, 'daily_mood_report', 25, CURRENT_DATE - INTERVAL '4 days' + INTERVAL '18:15'),
(3, 'daily_activity_report', 30, CURRENT_DATE - INTERVAL '4 days' + INTERVAL '18:15'),
(3, 'bug_fix', 20, CURRENT_DATE - INTERVAL '4 days' + INTERVAL '13:45'),
(3, 'documentation', 10, CURRENT_DATE - INTERVAL '4 days' + INTERVAL '16:20');

-- ЧЕТВЕРГ (CURRENT_DATE - 3)
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating) VALUES
(3, 'mood', '{"mood": 7, "energy": 6, "stress": 3, "notes": "Нормальное настроение", "activities": ["daily_mood_check"], "stressLevel": 3}', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '08:45', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '08:45', 7, 6, 3, 1.00, 'Нормальное настроение', 'mood_check', NULL, NULL),
(3, 'mood', '{"mood": 7, "energy": 6, "stress": 2, "notes": "Вечерний отчет", "activities": ["daily_mood_report"], "stressLevel": 2}', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '17:45', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '17:45', 7, 6, 2, 1.00, 'Вечерний отчет', 'daily_report', NULL, NULL),
(3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Командная работа", "activities": ["daily_activity_report"], "stressLevel": 2, "success": true}', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '17:45', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '17:45', NULL, NULL, NULL, 1.00, 'Командная работа', 'team_collaboration', 150, 8);

INSERT INTO activity_log (user_id, action, xp_earned, created_at) VALUES
(3, 'daily_mood_report', 25, CURRENT_DATE - INTERVAL '3 days' + INTERVAL '17:45'),
(3, 'daily_activity_report', 30, CURRENT_DATE - INTERVAL '3 days' + INTERVAL '17:45'),
(3, 'team_collaboration', 18, CURRENT_DATE - INTERVAL '3 days' + INTERVAL '10:15'),
(3, 'learning_session', 22, CURRENT_DATE - INTERVAL '3 days' + INTERVAL '14:30');

-- ПЯТНИЦА (CURRENT_DATE - 2)
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating) VALUES
(3, 'mood', '{"mood": 8, "energy": 7, "stress": 2, "notes": "Хорошее настроение", "activities": ["daily_mood_check"], "stressLevel": 2}', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '09:00', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '09:00', 8, 7, 2, 1.00, 'Хорошее настроение', 'mood_check', NULL, NULL),
(3, 'mood', '{"mood": 8, "energy": 7, "stress": 2, "notes": "Вечерний отчет", "activities": ["daily_mood_report"], "stressLevel": 2}', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '17:00', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '17:00', 8, 7, 2, 1.00, 'Вечерний отчет', 'daily_report', NULL, NULL),
(3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Деплой проекта", "activities": ["daily_activity_report"], "stressLevel": 1, "success": true}', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '17:00', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '17:00', NULL, NULL, NULL, 1.00, 'Деплой проекта', 'deployment', 60, 9);

INSERT INTO activity_log (user_id, action, xp_earned, created_at) VALUES
(3, 'daily_mood_report', 25, CURRENT_DATE - INTERVAL '2 days' + INTERVAL '17:00'),
(3, 'daily_activity_report', 30, CURRENT_DATE - INTERVAL '2 days' + INTERVAL '17:00'),
(3, 'deployment', 30, CURRENT_DATE - INTERVAL '2 days' + INTERVAL '11:45'),
(3, 'testing', 15, CURRENT_DATE - INTERVAL '2 days' + INTERVAL '15:00');

-- СУББОТА (CURRENT_DATE - 1)
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating) VALUES
(3, 'mood', '{"mood": 9, "energy": 8, "stress": 1, "notes": "Отличный день", "activities": ["daily_mood_check"], "stressLevel": 1}', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '10:00', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '10:00', 9, 8, 1, 1.00, 'Отличный день', 'mood_check', NULL, NULL),
(3, 'mood', '{"mood": 9, "energy": 8, "stress": 1, "notes": "Вечерний отчет", "activities": ["daily_mood_report"], "stressLevel": 1}', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '18:00', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '18:00', 9, 8, 1, 1.00, 'Вечерний отчет', 'daily_report', NULL, NULL),
(3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Личный проект", "activities": ["daily_activity_report"], "stressLevel": 1, "success": true}', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '18:00', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '18:00', NULL, NULL, NULL, 1.00, 'Личный проект', 'personal_project', 240, 10);

INSERT INTO activity_log (user_id, action, xp_earned, created_at) VALUES
(3, 'daily_mood_report', 25, CURRENT_DATE - INTERVAL '1 day' + INTERVAL '18:00'),
(3, 'daily_activity_report', 30, CURRENT_DATE - INTERVAL '1 day' + INTERVAL '18:00'),
(3, 'personal_project', 25, CURRENT_DATE - INTERVAL '1 day' + INTERVAL '12:30'),
(3, 'skill_practice', 20, CURRENT_DATE - INTERVAL '1 day' + INTERVAL '16:00);

-- ВОСКРЕСЕНЬЕ (CURRENT_DATE) - СЕГОДНЯ
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating) VALUES
(3, 'mood', '{"mood": 7, "energy": 6, "stress": 3, "notes": "Нормальное утро", "activities": ["daily_mood_check"], "stressLevel": 3}', CURRENT_DATE + INTERVAL '09:30', CURRENT_DATE + INTERVAL '09:30', 7, 6, 3, 1.00, 'Нормальное утро', 'mood_check', NULL, NULL),
(3, 'mood', '{"mood": 7, "energy": 6, "stress": 2, "notes": "Вечерний отчет", "activities": ["daily_mood_report"], "stressLevel": 2}', CURRENT_DATE + INTERVAL '17:30', CURRENT_DATE + INTERVAL '17:30', 7, 6, 2, 1.00, 'Вечерний отчет', 'daily_report', NULL, NULL),
(3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Планирование недели", "activities": ["daily_activity_report"], "stressLevel": 1, "success": true}', CURRENT_DATE + INTERVAL '17:30', CURRENT_DATE + INTERVAL '17:30', NULL, NULL, NULL, 1.00, 'Планирование недели', 'planning', 45, 8);

INSERT INTO activity_log (user_id, action, xp_earned, created_at) VALUES
(3, 'daily_mood_report', 25, CURRENT_DATE + INTERVAL '17:30'),
(3, 'daily_activity_report', 30, CURRENT_DATE + INTERVAL '17:30'),
(3, 'planning', 15, CURRENT_DATE + INTERVAL '10:00'),
(3, 'research', 18, CURRENT_DATE + INTERVAL '14:15);

-- =====================================================
-- ПРОВЕРКА ДАННЫХ
-- =====================================================

-- Проверяем количество записей в обеих таблицах
SELECT 
    'ai_signals' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT DATE(timestamp)) as days_with_data
FROM ai_signals 
WHERE user_id = 3 AND timestamp >= CURRENT_DATE - INTERVAL '7 days'

UNION ALL

SELECT 
    'activity_log' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT DATE(created_at)) as days_with_data
FROM activity_log 
WHERE user_id = 3 AND created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Проверяем отчеты за каждый день
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as ai_signals_count,
    (SELECT COUNT(*) FROM activity_log 
     WHERE user_id = 3 AND DATE(created_at) = DATE(timestamp)) as activity_log_count
FROM ai_signals 
WHERE user_id = 3 
    AND type IN ('mood', 'activity')
    AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date;

-- Проверяем функции продуктивности
SELECT 'Тестирование функций продуктивности:' as info;
SELECT 'Настроение сегодня:', calculate_mood_percentage(3, CURRENT_DATE) as mood_today;
SELECT 'Энергия сегодня:', calculate_energy_percentage(3, CURRENT_DATE) as energy_today;
SELECT 'Спокойствие сегодня:', calculate_calmness_percentage(3, CURRENT_DATE) as calmness_today;

SELECT '✅ Тестовые данные для пользователя ID=3 загружены успешно!' as status;
