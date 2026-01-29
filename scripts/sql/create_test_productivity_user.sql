-- ===================================================================
-- СОЗДАНИЕ ТЕСТОВОГО ПОЛЬЗОВАТЕЛЯ ДЛЯ ОТЛАДКИ СИСТЕМЫ ПРОДУКТИВНОСТИ
-- ===================================================================
-- Этот скрипт создает нового пользователя с тестовыми данными
-- для проверки всех функций системы продуктивности
-- ===================================================================

-- Создаем тестового пользователя (или обновляем если существует)
DO $$
DECLARE
    test_user_id INTEGER;
BEGIN
    -- Проверяем, существует ли пользователь
    SELECT id INTO test_user_id
    FROM enter
    WHERE login = 'test_productivity@yoddle.test';
    
    IF test_user_id IS NULL THEN
        -- Создаем нового пользователя
        -- Создаем нового пользователя с правильным хешем пароля test123
        -- Хеш: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
        INSERT INTO enter (name, login, password, phone, position)
        VALUES (
            'Тест Продуктивности',
            'test_productivity@yoddle.test',
            '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- пароль: test123
            '+7-999-000-00-01',
            'Тестировщик'
        )
        RETURNING id INTO test_user_id;
        
        RAISE NOTICE 'Создан новый тестовый пользователь с ID: %', test_user_id;
    ELSE
        -- Обновляем существующего пользователя
        UPDATE enter
        SET name = 'Тест Продуктивности',
            phone = '+7-999-000-00-01',
            position = 'Тестировщик'
        WHERE id = test_user_id;
        
        RAISE NOTICE 'Обновлен существующий тестовый пользователь с ID: %', test_user_id;
    END IF;
END $$;

-- Получаем ID созданного пользователя
DO $$
DECLARE
    test_user_id INTEGER;
BEGIN
    -- Получаем ID тестового пользователя
    SELECT id INTO test_user_id
    FROM enter
    WHERE login = 'test_productivity@yoddle.test';
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'Не удалось создать тестового пользователя';
    END IF;
    
    RAISE NOTICE 'Тестовый пользователь создан с ID: %', test_user_id;
    
    -- Создаем или обновляем запись прогресса пользователя
    INSERT INTO user_progress (
        user_id,
        xp,
        level,
        login_streak,
        days_active,
        benefits_used,
        profile_completion,
        onboarding_completed,
        tour_completed
    )
    VALUES (
        test_user_id,
        0,  -- Начинаем с 0 XP
        1,  -- Уровень 1
        0,  -- Нет серии входов
        0,  -- Нет активных дней
        0,  -- Не использовано льгот
        0,  -- Профиль не заполнен
        false,  -- Онбординг не пройден
        false   -- Тур не пройден
    )
    ON CONFLICT (user_id) DO UPDATE
    SET xp = 0,
        level = 1,
        login_streak = 0,
        days_active = 0,
        benefits_used = 0,
        profile_completion = 0,
        onboarding_completed = false,
        tour_completed = false;
    
    -- Удаляем старые тестовые данные настроения для этого пользователя
    DELETE FROM ai_signals 
    WHERE user_id = test_user_id 
    AND type = 'mood' 
    AND timestamp >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Добавляем несколько тестовых записей настроения за последние дни
    -- (для тестирования расчета рейтинга)
    INSERT INTO ai_signals (
        user_id, 
        type, 
        data,
        mood_rating, 
        energy_rating, 
        stress_rating, 
        timestamp
    )
    VALUES
        (
            test_user_id, 
            'mood', 
            '{"mood": 7, "energy": 7, "stress": 3}'::jsonb,
            7, 
            7, 
            3, 
            CURRENT_DATE - INTERVAL '2 days'
        ),
        (
            test_user_id, 
            'mood', 
            '{"mood": 8, "energy": 8, "stress": 2}'::jsonb,
            8, 
            8, 
            2, 
            CURRENT_DATE - INTERVAL '1 day'
        ),
        (
            test_user_id, 
            'mood', 
            '{"mood": 6, "energy": 6, "stress": 4}'::jsonb,
            6, 
            6, 
            4, 
            CURRENT_DATE
        );
    
    -- Удаляем старые тестовые активности для этого пользователя
    DELETE FROM ai_signals 
    WHERE user_id = test_user_id 
    AND type = 'activity' 
    AND timestamp >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Добавляем несколько тестовых активностей
    INSERT INTO ai_signals (
        user_id,
        type,
        data,
        activity_category,
        duration_minutes,
        success_rating,
        quality_score,
        notes,
        timestamp
    )
    VALUES
        (
            test_user_id,
            'activity',
            '{"activity": "Тестовая активность 1", "category": "health", "duration": 60, "success": true}'::jsonb,
            'health',
            60,
            8,
            1.0,
            'Тестовая активность 1',
            CURRENT_DATE - INTERVAL '1 day'
        ),
        (
            test_user_id,
            'activity',
            '{"activity": "Тестовая активность 2", "category": "work", "duration": 120, "success": true}'::jsonb,
            'work',
            120,
            9,
            1.0,
            'Тестовая активность 2',
            CURRENT_DATE
        );
    
    RAISE NOTICE '✅ Тестовые данные настроения и активности добавлены';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Тестовый пользователь готов к использованию:';
    RAISE NOTICE 'Email: test_productivity@yoddle.test';
    RAISE NOTICE 'Пароль: test123';
    RAISE NOTICE 'ID пользователя: %', test_user_id;
    RAISE NOTICE '========================================';
END $$;

-- Проверяем создание пользователя
SELECT 
    e.id,
    e.name,
    e.login,
    e.position,
    COALESCE(up.xp, 0) as xp,
    COALESCE(up.level, 1) as level,
    (SELECT COUNT(*) FROM ai_signals WHERE user_id = e.id AND type = 'mood') as mood_records,
    (SELECT COUNT(*) FROM ai_signals WHERE user_id = e.id AND type = 'activity') as activity_records
FROM enter e
LEFT JOIN user_progress up ON up.user_id = e.id
WHERE e.login = 'test_productivity@yoddle.test';
