-- ===================================================================
-- ДОБАВЛЕНИЕ РЕАЛИСТИЧНЫХ ТЕСТОВЫХ ДАННЫХ ДЛЯ ПОЛЬЗОВАТЕЛЯ ID 4
-- ===================================================================
-- Добавляем разнообразные данные: хорошие и плохие дни
-- Настроение: максимум 3 в день (можно меньше)
-- Активности: максимум 2 в день (можно меньше)
-- Учитываем activity_log (входы на платформу)
-- ===================================================================

DO $$
DECLARE
    test_user_id INTEGER := 4;
    current_date_val DATE := CURRENT_DATE;
BEGIN
    -- Удаляем старые тестовые данные за последние 14 дней
    DELETE FROM ai_signals 
    WHERE user_id = test_user_id 
    AND timestamp >= current_date_val - INTERVAL '14 days';
    
    DELETE FROM activity_log
    WHERE user_id = test_user_id 
    AND DATE(created_at) >= current_date_val - INTERVAL '14 days';
    
    RAISE NOTICE 'Удалены старые тестовые данные';
    
    -- ===================================================================
    -- ДЕНЬ 1 (сегодня - 13 дней назад): ПЛОХОЙ ДЕНЬ
    -- ===================================================================
    -- Настроение: низкое
    INSERT INTO ai_signals (user_id, type, data, mood_rating, energy_rating, stress_rating, timestamp)
    VALUES 
        (test_user_id, 'mood', '{"mood": 4, "energy": 3, "stress": 7, "notes": "Устал, плохое настроение"}'::jsonb, 4, 3, 7, current_date_val - INTERVAL '13 days' + INTERVAL '9 hours'),
        (test_user_id, 'mood', '{"mood": 5, "energy": 4, "stress": 6, "notes": "Немного лучше"}'::jsonb, 5, 4, 6, current_date_val - INTERVAL '13 days' + INTERVAL '15 hours');
    
    -- Активности: неуспешные
    INSERT INTO ai_signals (user_id, type, data, activity_category, duration_minutes, success_rating, quality_score, notes, timestamp)
    VALUES 
        (test_user_id, 'activity', '{"activity": "Тренировка", "category": "health", "duration": 30, "success": false}'::jsonb, 'health', 30, 5, 0.6, 'Не смог закончить тренировку', current_date_val - INTERVAL '13 days' + INTERVAL '18 hours');
    
    -- Activity log: мало действий
    INSERT INTO activity_log (user_id, action, description, xp_earned, created_at)
    VALUES 
        (test_user_id, 'login', 'Вход в систему', 0, current_date_val - INTERVAL '13 days' + INTERVAL '9 hours');
    
    -- ===================================================================
    -- ДЕНЬ 2 (сегодня - 12 дней назад): СРЕДНИЙ ДЕНЬ
    -- ===================================================================
    INSERT INTO ai_signals (user_id, type, data, mood_rating, energy_rating, stress_rating, timestamp)
    VALUES 
        (test_user_id, 'mood', '{"mood": 6, "energy": 6, "stress": 5, "notes": "Обычный день"}'::jsonb, 6, 6, 5, current_date_val - INTERVAL '12 days' + INTERVAL '10 hours');
    
    INSERT INTO ai_signals (user_id, type, data, activity_category, duration_minutes, success_rating, quality_score, notes, timestamp)
    VALUES 
        (test_user_id, 'activity', '{"activity": "Работа над проектом", "category": "work", "duration": 90, "success": true}'::jsonb, 'work', 90, 7, 0.8, 'Хорошо поработал над задачей', current_date_val - INTERVAL '12 days' + INTERVAL '14 hours');
    
    INSERT INTO activity_log (user_id, action, description, xp_earned, created_at)
    VALUES 
        (test_user_id, 'login', 'Вход в систему', 0, current_date_val - INTERVAL '12 days' + INTERVAL '10 hours'),
        (test_user_id, 'page_view', 'Просмотр страницы продуктивности', 0, current_date_val - INTERVAL '12 days' + INTERVAL '11 hours');
    
    -- ===================================================================
    -- ДЕНЬ 3 (сегодня - 11 дней назад): ХОРОШИЙ ДЕНЬ
    -- ===================================================================
    INSERT INTO ai_signals (user_id, type, data, mood_rating, energy_rating, stress_rating, timestamp)
    VALUES 
        (test_user_id, 'mood', '{"mood": 8, "energy": 9, "stress": 2, "notes": "Отличное настроение, много энергии, чувствую себя прекрасно!"}'::jsonb, 8, 9, 2, current_date_val - INTERVAL '11 days' + INTERVAL '8 hours'),
        (test_user_id, 'mood', '{"mood": 9, "energy": 8, "stress": 1, "notes": "Еще лучше, продуктивный день"}'::jsonb, 9, 8, 1, current_date_val - INTERVAL '11 days' + INTERVAL '16 hours'),
        (test_user_id, 'mood', '{"mood": 8, "energy": 7, "stress": 2, "notes": "Вечером немного устал, но день был отличный"}'::jsonb, 8, 7, 2, current_date_val - INTERVAL '11 days' + INTERVAL '20 hours');
    
    INSERT INTO ai_signals (user_id, type, data, activity_category, duration_minutes, success_rating, quality_score, notes, timestamp)
    VALUES 
        (test_user_id, 'activity', '{"activity": "Тренировка в зале", "category": "health", "duration": 120, "success": true}'::jsonb, 'health', 120, 9, 1.0, 'Отличная тренировка, выполнил все упражнения, чувствую себя сильным и энергичным!', current_date_val - INTERVAL '11 days' + INTERVAL '19 hours'),
        (test_user_id, 'activity', '{"activity": "Изучение нового материала", "category": "work", "duration": 180, "success": true}'::jsonb, 'work', 180, 10, 1.0, 'Изучил много нового, сделал заметки, очень продуктивно провел время за обучением', current_date_val - INTERVAL '11 days' + INTERVAL '15 hours');
    
    INSERT INTO activity_log (user_id, action, description, xp_earned, created_at)
    VALUES 
        (test_user_id, 'login', 'Вход в систему', 0, current_date_val - INTERVAL '11 days' + INTERVAL '8 hours'),
        (test_user_id, 'page_view', 'Просмотр дашборда', 0, current_date_val - INTERVAL '11 days' + INTERVAL '9 hours'),
        (test_user_id, 'mood_logged', 'Запись настроения', 10, current_date_val - INTERVAL '11 days' + INTERVAL '8 hours'),
        (test_user_id, 'activity_logged', 'Запись активности', 20, current_date_val - INTERVAL '11 days' + INTERVAL '15 hours'),
        (test_user_id, 'page_view', 'Просмотр продуктивности', 0, current_date_val - INTERVAL '11 days' + INTERVAL '20 hours');
    
    -- ===================================================================
    -- ДЕНЬ 4 (сегодня - 10 дней назад): ПЛОХОЙ ДЕНЬ
    -- ===================================================================
    INSERT INTO ai_signals (user_id, type, data, mood_rating, energy_rating, stress_rating, timestamp)
    VALUES 
        (test_user_id, 'mood', '{"mood": 3, "energy": 2, "stress": 9, "notes": "Очень плохо, стресс, нет энергии"}'::jsonb, 3, 2, 9, current_date_val - INTERVAL '10 days' + INTERVAL '10 hours');
    
    INSERT INTO ai_signals (user_id, type, data, activity_category, duration_minutes, success_rating, quality_score, notes, timestamp)
    VALUES 
        (test_user_id, 'activity', '{"activity": "Попытка работы", "category": "work", "duration": 45, "success": false}'::jsonb, 'work', 45, 4, 0.4, 'Не смог сконцентрироваться', current_date_val - INTERVAL '10 days' + INTERVAL '14 hours'),
        (test_user_id, 'activity', '{"activity": "Прогулка", "category": "health", "duration": 20, "success": false}'::jsonb, 'health', 20, 3, 0.4, 'Короткая прогулка, не помогла', current_date_val - INTERVAL '10 days' + INTERVAL '18 hours');
    
    INSERT INTO activity_log (user_id, action, description, xp_earned, created_at)
    VALUES 
        (test_user_id, 'login', 'Вход в систему', 0, current_date_val - INTERVAL '10 days' + INTERVAL '10 hours');
    
    -- ===================================================================
    -- ДЕНЬ 5 (сегодня - 9 дней назад): ОТЛИЧНЫЙ ДЕНЬ
    -- ===================================================================
    INSERT INTO ai_signals (user_id, type, data, mood_rating, energy_rating, stress_rating, timestamp)
    VALUES 
        (test_user_id, 'mood', '{"mood": 10, "energy": 10, "stress": 1, "notes": "Идеальный день! Полон энергии и позитива, почти нет стресса, готов к любым вызовам!"}'::jsonb, 10, 10, 1, current_date_val - INTERVAL '9 days' + INTERVAL '7 hours'),
        (test_user_id, 'mood', '{"mood": 9, "energy": 9, "stress": 1, "notes": "Продолжаю чувствовать себя отлично, продуктивность на высоте"}'::jsonb, 9, 9, 1, current_date_val - INTERVAL '9 days' + INTERVAL '14 hours');
    
    INSERT INTO ai_signals (user_id, type, data, activity_category, duration_minutes, success_rating, quality_score, notes, timestamp)
    VALUES 
        (test_user_id, 'activity', '{"activity": "Утренняя пробежка", "category": "health", "duration": 60, "success": true}'::jsonb, 'health', 60, 10, 1.0, 'Отличная пробежка на 5 км, чувствую себя бодрым и здоровым, настроение прекрасное!', current_date_val - INTERVAL '9 days' + INTERVAL '8 hours'),
        (test_user_id, 'activity', '{"activity": "Важный проект", "category": "work", "duration": 240, "success": true}'::jsonb, 'work', 240, 10, 1.0, 'Завершил важный проект, все задачи выполнены, клиент доволен, получил похвалу от начальства!', current_date_val - INTERVAL '9 days' + INTERVAL '16 hours');
    
    INSERT INTO activity_log (user_id, action, description, xp_earned, created_at)
    VALUES 
        (test_user_id, 'login', 'Вход в систему', 0, current_date_val - INTERVAL '9 days' + INTERVAL '7 hours'),
        (test_user_id, 'first_login_today', 'Первый вход за день', 5, current_date_val - INTERVAL '9 days' + INTERVAL '7 hours'),
        (test_user_id, 'mood_logged', 'Запись настроения', 10, current_date_val - INTERVAL '9 days' + INTERVAL '7 hours'),
        (test_user_id, 'activity_logged', 'Запись активности', 20, current_date_val - INTERVAL '9 days' + INTERVAL '8 hours'),
        (test_user_id, 'page_view', 'Просмотр статистики', 0, current_date_val - INTERVAL '9 days' + INTERVAL '9 hours'),
        (test_user_id, 'mood_logged', 'Запись настроения', 10, current_date_val - INTERVAL '9 days' + INTERVAL '14 hours'),
        (test_user_id, 'activity_logged', 'Запись активности', 20, current_date_val - INTERVAL '9 days' + INTERVAL '16 hours');
    
    -- ===================================================================
    -- ДЕНЬ 6 (сегодня - 8 дней назад): СРЕДНИЙ ДЕНЬ
    -- ===================================================================
    INSERT INTO ai_signals (user_id, type, data, mood_rating, energy_rating, stress_rating, timestamp)
    VALUES 
        (test_user_id, 'mood', '{"mood": 7, "energy": 6, "stress": 4, "notes": "Нормальный рабочий день"}'::jsonb, 7, 6, 4, current_date_val - INTERVAL '8 days' + INTERVAL '11 hours');
    
    INSERT INTO activity_log (user_id, action, description, xp_earned, created_at)
    VALUES 
        (test_user_id, 'login', 'Вход в систему', 0, current_date_val - INTERVAL '8 days' + INTERVAL '11 hours'),
        (test_user_id, 'page_view', 'Просмотр дашборда', 0, current_date_val - INTERVAL '8 days' + INTERVAL '12 hours');
    
    -- ===================================================================
    -- ДЕНЬ 7 (сегодня - 7 дней назад): ХОРОШИЙ ДЕНЬ
    -- ===================================================================
    INSERT INTO ai_signals (user_id, type, data, mood_rating, energy_rating, stress_rating, timestamp)
    VALUES 
        (test_user_id, 'mood', '{"mood": 8, "energy": 7, "stress": 3, "notes": "Хороший день, продуктивно поработал"}'::jsonb, 8, 7, 3, current_date_val - INTERVAL '7 days' + INTERVAL '9 hours'),
        (test_user_id, 'mood', '{"mood": 7, "energy": 8, "stress": 2, "notes": "Вечером чувствую себя хорошо"}'::jsonb, 7, 8, 2, current_date_val - INTERVAL '7 days' + INTERVAL '17 hours');
    
    INSERT INTO ai_signals (user_id, type, data, activity_category, duration_minutes, success_rating, quality_score, notes, timestamp)
    VALUES 
        (test_user_id, 'activity', '{"activity": "Йога", "category": "health", "duration": 45, "success": true}'::jsonb, 'health', 45, 8, 0.8, 'Хорошая сессия йоги, расслабился', current_date_val - INTERVAL '7 days' + INTERVAL '19 hours');
    
    INSERT INTO activity_log (user_id, action, description, xp_earned, created_at)
    VALUES 
        (test_user_id, 'login', 'Вход в систему', 0, current_date_val - INTERVAL '7 days' + INTERVAL '9 hours'),
        (test_user_id, 'mood_logged', 'Запись настроения', 10, current_date_val - INTERVAL '7 days' + INTERVAL '9 hours'),
        (test_user_id, 'activity_logged', 'Запись активности', 20, current_date_val - INTERVAL '7 days' + INTERVAL '19 hours');
    
    -- ===================================================================
    -- ДЕНЬ 8 (сегодня - 6 дней назад): ПЛОХОЙ ДЕНЬ
    -- ===================================================================
    INSERT INTO ai_signals (user_id, type, data, mood_rating, energy_rating, stress_rating, timestamp)
    VALUES 
        (test_user_id, 'mood', '{"mood": 4, "energy": 5, "stress": 8, "notes": "Стрессовый день, много работы"}'::jsonb, 4, 5, 8, current_date_val - INTERVAL '6 days' + INTERVAL '10 hours');
    
    INSERT INTO activity_log (user_id, action, description, xp_earned, created_at)
    VALUES 
        (test_user_id, 'login', 'Вход в систему', 0, current_date_val - INTERVAL '6 days' + INTERVAL '10 hours');
    
    -- ===================================================================
    -- ДЕНЬ 9 (сегодня - 5 дней назад): ОТЛИЧНЫЙ ДЕНЬ
    -- ===================================================================
    INSERT INTO ai_signals (user_id, type, data, mood_rating, energy_rating, stress_rating, timestamp)
    VALUES 
        (test_user_id, 'mood', '{"mood": 9, "energy": 9, "stress": 1, "notes": "Прекрасный день, много достижений"}'::jsonb, 9, 9, 1, current_date_val - INTERVAL '5 days' + INTERVAL '8 hours'),
        (test_user_id, 'mood', '{"mood": 10, "energy": 8, "stress": 1, "notes": "Идеальное настроение продолжается!"}'::jsonb, 10, 8, 1, current_date_val - INTERVAL '5 days' + INTERVAL '15 hours');
    
    INSERT INTO ai_signals (user_id, type, data, activity_category, duration_minutes, success_rating, quality_score, notes, timestamp)
    VALUES 
        (test_user_id, 'activity', '{"activity": "Тренировка", "category": "health", "duration": 90, "success": true}'::jsonb, 'health', 90, 9, 1.0, 'Отличная тренировка, выполнил все упражнения с хорошей техникой, чувствую прогресс!', current_date_val - INTERVAL '5 days' + INTERVAL '20 hours');
    
    INSERT INTO activity_log (user_id, action, description, xp_earned, created_at)
    VALUES 
        (test_user_id, 'login', 'Вход в систему', 0, current_date_val - INTERVAL '5 days' + INTERVAL '8 hours'),
        (test_user_id, 'first_login_today', 'Первый вход за день', 5, current_date_val - INTERVAL '5 days' + INTERVAL '8 hours'),
        (test_user_id, 'mood_logged', 'Запись настроения', 10, current_date_val - INTERVAL '5 days' + INTERVAL '8 hours'),
        (test_user_id, 'mood_logged', 'Запись настроения', 10, current_date_val - INTERVAL '5 days' + INTERVAL '15 hours'),
        (test_user_id, 'activity_logged', 'Запись активности', 20, current_date_val - INTERVAL '5 days' + INTERVAL '20 hours'),
        (test_user_id, 'page_view', 'Просмотр продуктивности', 0, current_date_val - INTERVAL '5 days' + INTERVAL '21 hours');
    
    -- ===================================================================
    -- ДЕНЬ 10 (сегодня - 4 дня назад): СРЕДНИЙ ДЕНЬ
    -- ===================================================================
    INSERT INTO ai_signals (user_id, type, data, mood_rating, energy_rating, stress_rating, timestamp)
    VALUES 
        (test_user_id, 'mood', '{"mood": 6, "energy": 7, "stress": 5, "notes": "Обычный день"}'::jsonb, 6, 7, 5, current_date_val - INTERVAL '4 days' + INTERVAL '12 hours');
    
    INSERT INTO activity_log (user_id, action, description, xp_earned, created_at)
    VALUES 
        (test_user_id, 'login', 'Вход в систему', 0, current_date_val - INTERVAL '4 days' + INTERVAL '12 hours');
    
    -- ===================================================================
    -- ДЕНЬ 11 (сегодня - 3 дня назад): ХОРОШИЙ ДЕНЬ
    -- ===================================================================
    INSERT INTO ai_signals (user_id, type, data, mood_rating, energy_rating, stress_rating, timestamp)
    VALUES 
        (test_user_id, 'mood', '{"mood": 8, "energy": 7, "stress": 3, "notes": "Хороший рабочий день"}'::jsonb, 8, 7, 3, current_date_val - INTERVAL '3 days' + INTERVAL '10 hours');
    
    INSERT INTO ai_signals (user_id, type, data, activity_category, duration_minutes, success_rating, quality_score, notes, timestamp)
    VALUES 
        (test_user_id, 'activity', '{"activity": "Медитация", "category": "health", "duration": 30, "success": true}'::jsonb, 'health', 30, 8, 0.8, 'Хорошая медитация, расслабился', current_date_val - INTERVAL '3 days' + INTERVAL '21 hours');
    
    INSERT INTO activity_log (user_id, action, description, xp_earned, created_at)
    VALUES 
        (test_user_id, 'login', 'Вход в систему', 0, current_date_val - INTERVAL '3 days' + INTERVAL '10 hours'),
        (test_user_id, 'mood_logged', 'Запись настроения', 10, current_date_val - INTERVAL '3 days' + INTERVAL '10 hours'),
        (test_user_id, 'activity_logged', 'Запись активности', 20, current_date_val - INTERVAL '3 days' + INTERVAL '21 hours');
    
    -- ===================================================================
    -- ДЕНЬ 12 (сегодня - 2 дня назад): ПЛОХОЙ ДЕНЬ
    -- ===================================================================
    INSERT INTO ai_signals (user_id, type, data, mood_rating, energy_rating, stress_rating, timestamp)
    VALUES 
        (test_user_id, 'mood', '{"mood": 5, "energy": 4, "stress": 7, "notes": "Тяжелый день"}'::jsonb, 5, 4, 7, current_date_val - INTERVAL '2 days' + INTERVAL '11 hours');
    
    INSERT INTO ai_signals (user_id, type, data, activity_category, duration_minutes, success_rating, quality_score, notes, timestamp)
    VALUES 
        (test_user_id, 'activity', '{"activity": "Попытка работы", "category": "work", "duration": 60, "success": false}'::jsonb, 'work', 60, 5, 0.5, 'Не смог сосредоточиться', current_date_val - INTERVAL '2 days' + INTERVAL '14 hours');
    
    INSERT INTO activity_log (user_id, action, description, xp_earned, created_at)
    VALUES 
        (test_user_id, 'login', 'Вход в систему', 0, current_date_val - INTERVAL '2 days' + INTERVAL '11 hours');
    
    -- ===================================================================
    -- ДЕНЬ 13 (сегодня - 1 день назад): ОТЛИЧНЫЙ ДЕНЬ
    -- ===================================================================
    INSERT INTO ai_signals (user_id, type, data, mood_rating, energy_rating, stress_rating, timestamp)
    VALUES 
        (test_user_id, 'mood', '{"mood": 9, "energy": 9, "stress": 1, "notes": "Отличный день, много энергии и позитива!"}'::jsonb, 9, 9, 1, current_date_val - INTERVAL '1 day' + INTERVAL '9 hours'),
        (test_user_id, 'mood', '{"mood": 8, "energy": 8, "stress": 2, "notes": "Продолжаю чувствовать себя хорошо"}'::jsonb, 8, 8, 2, current_date_val - INTERVAL '1 day' + INTERVAL '16 hours');
    
    INSERT INTO ai_signals (user_id, type, data, activity_category, duration_minutes, success_rating, quality_score, notes, timestamp)
    VALUES 
        (test_user_id, 'activity', '{"activity": "Тренировка", "category": "health", "duration": 120, "success": true}'::jsonb, 'health', 120, 9, 1.0, 'Отличная тренировка, выполнил все упражнения, чувствую себя сильным!', current_date_val - INTERVAL '1 day' + INTERVAL '19 hours'),
        (test_user_id, 'activity', '{"activity": "Работа над проектом", "category": "work", "duration": 180, "success": true}'::jsonb, 'work', 180, 10, 1.0, 'Завершил важную часть проекта, все задачи выполнены качественно и в срок!', current_date_val - INTERVAL '1 day' + INTERVAL '15 hours');
    
    INSERT INTO activity_log (user_id, action, description, xp_earned, created_at)
    VALUES 
        (test_user_id, 'login', 'Вход в систему', 0, current_date_val - INTERVAL '1 day' + INTERVAL '9 hours'),
        (test_user_id, 'first_login_today', 'Первый вход за день', 5, current_date_val - INTERVAL '1 day' + INTERVAL '9 hours'),
        (test_user_id, 'mood_logged', 'Запись настроения', 10, current_date_val - INTERVAL '1 day' + INTERVAL '9 hours'),
        (test_user_id, 'activity_logged', 'Запись активности', 20, current_date_val - INTERVAL '1 day' + INTERVAL '15 hours'),
        (test_user_id, 'mood_logged', 'Запись настроения', 10, current_date_val - INTERVAL '1 day' + INTERVAL '16 hours'),
        (test_user_id, 'activity_logged', 'Запись активности', 20, current_date_val - INTERVAL '1 day' + INTERVAL '19 hours'),
        (test_user_id, 'page_view', 'Просмотр статистики', 0, current_date_val - INTERVAL '1 day' + INTERVAL '20 hours');
    
    -- ===================================================================
    -- ДЕНЬ 14 (СЕГОДНЯ): ТЕКУЩИЕ ДАННЫЕ (уже есть, не трогаем)
    -- ===================================================================
    
    RAISE NOTICE '✅ Добавлены реалистичные тестовые данные за 13 дней';
    RAISE NOTICE '   - Плохие дни: 4 дня';
    RAISE NOTICE '   - Средние дни: 4 дня';
    RAISE NOTICE '   - Хорошие дни: 5 дней';
    RAISE NOTICE '   - Всего записей настроения: ~18';
    RAISE NOTICE '   - Всего активностей: ~10';
    RAISE NOTICE '   - Всего действий в activity_log: ~25';
END $$;

-- Пересчитываем рейтинги для всех дней
SELECT 
    'Пересчет рейтингов для всех дней' as info,
    day_date::date as date,
    calculate_productivity_score(4, day_date::date) as rating
FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day'::interval) as day_date
ORDER BY day_date DESC;

-- Проверяем итоговую статистику
SELECT 
    'Итоговая статистика' as info,
    * 
FROM get_user_productivity_stats(4);
