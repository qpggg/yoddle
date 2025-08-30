-- =====================================================
-- ДОБАВЛЕНИЕ НЕДОСТАЮЩИХ ДНЕЙ ТЕСТОВЫХ ДАННЫХ
-- Пользователь ID = 3
-- =====================================================

-- Проверяем какие дни уже есть
SELECT 'Дни с данными в ai_signals:' as info;
SELECT DISTINCT DATE(timestamp) as date
FROM ai_signals 
WHERE user_id = 3 
ORDER BY date;

-- Проверяем какие дни уже есть в activity_log
SELECT 'Дни с данными в activity_log:' as info;
SELECT DISTINCT DATE(created_at) as date
FROM activity_log 
WHERE user_id = 3 
ORDER BY date;

-- =====================================================
-- ДОБАВЛЯЕМ НЕДОСТАЮЩИЕ ДНИ
-- =====================================================

-- ПОНЕДЕЛЬНИК (если нет)
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 8, "energy": 7, "stress": 2, "notes": "Хорошее настроение утром", "activities": ["daily_mood_check"], "stressLevel": 2}', CURRENT_DATE - INTERVAL '6 days' + INTERVAL '09:00', CURRENT_DATE - INTERVAL '6 days' + INTERVAL '09:00', 8, 7, 2, 1.00, 'Хорошее настроение утром', 'mood_check', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '6 days'
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 7, "energy": 6, "stress": 3, "notes": "Вечерний отчет настроения", "activities": ["daily_mood_report"], "stressLevel": 3}', CURRENT_DATE - INTERVAL '6 days' + INTERVAL '18:00', CURRENT_DATE - INTERVAL '6 days' + INTERVAL '18:00', 7, 6, 3, 1.00, 'Вечерний отчет настроения', 'daily_report', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '6 days' AND type = 'mood' AND notes LIKE '%Вечерний%'
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Завершил важную задачу", "activities": ["daily_activity_report"], "stressLevel": 1, "success": true}', CURRENT_DATE - INTERVAL '6 days' + INTERVAL '18:00', CURRENT_DATE - INTERVAL '6 days' + INTERVAL '18:00', NULL, NULL, NULL, 1.00, 'Завершил важную задачу', 'task_completion', 120, 9
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '6 days' AND type = 'activity'
);

-- ВТОРНИК (если нет)
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 9, "energy": 8, "stress": 1, "notes": "Отличное настроение", "activities": ["daily_mood_check"], "stressLevel": 1}', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '08:30', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '08:30', 9, 8, 1, 1.00, 'Отличное настроение', 'mood_check', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '5 days'
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 8, "energy": 7, "stress": 2, "notes": "Вечерний отчет", "activities": ["daily_mood_report"], "stressLevel": 2}', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '17:30', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '17:30', 8, 7, 2, 1.00, 'Вечерний отчет', 'daily_report', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '5 days' AND type = 'mood' AND notes LIKE '%Вечерний%'
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Достиг вехи проекта", "activities": ["daily_activity_report"], "stressLevel": 1, "success": true}', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '17:30', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '17:30', NULL, NULL, NULL, 1.00, 'Достиг вехи проекта', 'project_milestone', 180, 10
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '5 days' AND type = 'activity'
);

-- СРЕДА (если нет)
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 6, "energy": 5, "stress": 4, "notes": "Устал, но держусь", "activities": ["daily_mood_check"], "stressLevel": 4}', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '09:15', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '09:15', 6, 5, 4, 1.00, 'Устал, но держусь', 'mood_check', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '4 days'
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 6, "energy": 5, "stress": 3, "notes": "Вечерний отчет", "activities": ["daily_mood_report"], "stressLevel": 3}', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '18:15', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '18:15', 6, 5, 3, 1.00, 'Вечерний отчет', 'daily_report', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '4 days' AND type = 'mood' AND notes LIKE '%Вечерний%'
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Исправил баг", "activities": ["daily_activity_report"], "stressLevel": 2, "success": true}', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '18:15', CURRENT_DATE - INTERVAL '4 days' + INTERVAL '18:15', NULL, NULL, NULL, 1.00, 'Исправил баг', 'bug_fix', 90, 8
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '4 days' AND type = 'activity'
);

-- ЧЕТВЕРГ (если нет)
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 7, "energy": 6, "stress": 3, "notes": "Нормальное настроение", "activities": ["daily_mood_check"], "stressLevel": 3}', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '08:45', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '08:45', 7, 6, 3, 1.00, 'Нормальное настроение', 'mood_check', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '3 days'
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 7, "energy": 6, "stress": 2, "notes": "Вечерний отчет", "activities": ["daily_mood_report"], "stressLevel": 2}', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '17:45', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '17:45', 7, 6, 2, 1.00, 'Вечерний отчет', 'daily_report', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '3 days' AND type = 'mood' AND notes LIKE '%Вечерний%'
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Командная работа", "activities": ["daily_activity_report"], "stressLevel": 2, "success": true}', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '17:45', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '17:45', NULL, NULL, NULL, 1.00, 'Командная работа', 'team_collaboration', 150, 8
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '3 days' AND type = 'activity'
);

-- ПЯТНИЦА (если нет)
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 8, "energy": 7, "stress": 2, "notes": "Хорошее настроение", "activities": ["daily_mood_check"], "stressLevel": 2}', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '09:00', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '09:00', 8, 7, 2, 1.00, 'Хорошее настроение', 'mood_check', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '2 days'
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 8, "energy": 7, "stress": 2, "notes": "Вечерний отчет", "activities": ["daily_mood_report"], "stressLevel": 2}', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '17:00', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '17:00', 8, 7, 2, 1.00, 'Вечерний отчет', 'daily_report', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '2 days' AND type = 'mood' AND notes LIKE '%Вечерний%'
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Деплой проекта", "activities": ["daily_activity_report"], "stressLevel": 1, "success": true}', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '17:00', CURRENT_DATE - INTERVAL '2 days' + INTERVAL '17:00', NULL, NULL, NULL, 1.00, 'Деплой проекта', 'deployment', 60, 9
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '2 days' AND type = 'activity'
);

-- СУББОТА (если нет)
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 9, "energy": 8, "stress": 1, "notes": "Отличный день", "activities": ["daily_mood_check"], "stressLevel": 1}', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '10:00', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '10:00', 9, 8, 1, 1.00, 'Отличный день', 'mood_check', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day'
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 9, "energy": 8, "stress": 1, "notes": "Вечерний отчет", "activities": ["daily_mood_report"], "stressLevel": 1}', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '18:00', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '18:00', 9, 8, 1, 1.00, 'Вечерний отчет', 'daily_report', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day' AND type = 'mood' AND notes LIKE '%Вечерний%'
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Личный проект", "activities": ["daily_activity_report"], "stressLevel": 1, "success": true}', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '18:00', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '18:00', NULL, NULL, NULL, 1.00, 'Личный проект', 'personal_project', 240, 10
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day' AND type = 'activity'
);

-- ВОСКРЕСЕНЬЕ (если нет)
INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 7, "energy": 6, "stress": 3, "notes": "Нормальное утро", "activities": ["daily_mood_check"], "stressLevel": 3}', CURRENT_DATE + INTERVAL '09:30', CURRENT_DATE + INTERVAL '09:30', 7, 6, 3, 1.00, 'Нормальное утро', 'mood_check', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'mood', '{"mood": 7, "energy": 6, "stress": 2, "notes": "Вечерний отчет", "activities": ["daily_mood_report"], "stressLevel": 2}', CURRENT_DATE + INTERVAL '17:30', CURRENT_DATE + INTERVAL '17:30', 7, 6, 2, 1.00, 'Вечерний отчет', 'daily_report', NULL, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE AND type = 'mood' AND notes LIKE '%Вечерний%'
);

INSERT INTO ai_signals (user_id, type, data, timestamp, created_at, mood_rating, energy_rating, stress_rating, quality_score, notes, activity_category, duration_minutes, success_rating)
SELECT 3, 'activity', '{"mood": 0, "energy": 0, "stress": 0, "notes": "Планирование недели", "activities": ["daily_activity_report"], "stressLevel": 1, "success": true}', CURRENT_DATE + INTERVAL '17:30', CURRENT_DATE + INTERVAL '17:30', NULL, NULL, NULL, 1.00, 'Планирование недели', 'planning', 45, 8
WHERE NOT EXISTS (
    SELECT 1 FROM ai_signals 
    WHERE user_id = 3 AND DATE(timestamp) = CURRENT_DATE AND type = 'activity'
);

-- =====================================================
-- ПРОВЕРКА РЕЗУЛЬТАТА
-- =====================================================

-- Проверяем все дни
SELECT 'Все дни с данными в ai_signals:' as info;
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as records_count,
    STRING_AGG(type, ', ' ORDER BY type) as types
FROM ai_signals 
WHERE user_id = 3 
    AND timestamp >= CURRENT_DATE - INTERVAL '6 days'
    AND timestamp <= CURRENT_DATE + INTERVAL '1 day'
GROUP BY DATE(timestamp)
ORDER BY date;

-- Проверяем функции продуктивности
SELECT 'Тестирование функций продуктивности:' as info;
SELECT 'Настроение сегодня:', calculate_mood_percentage(3, CURRENT_DATE) as mood_today;
SELECT 'Энергия сегодня:', calculate_energy_percentage(3, CURRENT_DATE) as energy_today;
SELECT 'Спокойствие сегодня:', calculate_calmness_percentage(3, CURRENT_DATE) as calmness_today;

SELECT '✅ Недостающие дни добавлены успешно!' as status;


