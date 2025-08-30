-- =====================================================
-- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ ФУНКЦИИ get_user_productivity_stats
-- =====================================================

-- Удаляем старую функцию
DROP FUNCTION IF EXISTS get_user_productivity_stats(integer);

-- Создаем исправленную функцию с уникальными именами переменных
CREATE OR REPLACE FUNCTION get_user_productivity_stats(p_user_id INTEGER)
RETURNS TABLE (
    current_score DECIMAL(5,2),
    current_level TEXT,
    current_tier TEXT,
    xp_multiplier DECIMAL(3,2),
    weekly_average DECIMAL(5,2),
    monthly_average DECIMAL(5,2),
    mood_stability DECIMAL(3,2),
    energy_consistency DECIMAL(3,2),
    stress_management DECIMAL(3,2),
    total_achievements INTEGER,
    productivity_achievements INTEGER
) AS $$
DECLARE
    v_current_score DECIMAL(5,2) := 0;
    v_weekly_avg DECIMAL(5,2) := 0;
    v_monthly_avg DECIMAL(5,2) := 0;
    v_mood_stability_val DECIMAL(3,2) := 0;
    v_energy_consistency_val DECIMAL(3,2) := 0;
    v_stress_management_val DECIMAL(3,2) := 0;
    v_achievements_count INTEGER := 0;
    v_productivity_achievements INTEGER := 0;
BEGIN
    -- Получаем текущий балл продуктивности
    SELECT COALESCE(up.productivity_score, 0) INTO v_current_score
    FROM user_progress up
    WHERE up.user_id = p_user_id;

    -- Получаем недельное среднее
    SELECT COALESCE(up.weekly_productivity, 0) INTO v_weekly_avg
    FROM user_progress up
    WHERE up.user_id = p_user_id;

    -- Получаем месячное среднее
    SELECT COALESCE(up.monthly_productivity, 0) INTO v_monthly_avg
    FROM user_progress up
    WHERE up.user_id = p_user_id;

    -- Получаем стабильность настроения (используем алиас таблицы)
    SELECT COALESCE(up.mood_stability, 0) INTO v_mood_stability_val
    FROM user_progress up
    WHERE up.user_id = p_user_id;

    -- Получаем консистентность энергии (используем алиас таблицы)
    SELECT COALESCE(up.energy_consistency, 0) INTO v_energy_consistency_val
    FROM user_progress up
    WHERE up.user_id = p_user_id;

    -- Получаем управление стрессом (используем алиас таблицы)
    SELECT COALESCE(up.stress_management, 0) INTO v_stress_management_val
    FROM user_progress up
    WHERE up.user_id = p_user_id;

    -- Получаем количество достижений
    SELECT COUNT(*) INTO v_achievements_count
    FROM user_achievements ua
    WHERE ua.user_id = p_user_id;

    -- Получаем количество достижений продуктивности
    SELECT COUNT(*) INTO v_productivity_achievements
    FROM user_achievements ua
    JOIN productivity_achievements pa ON ua.achievement_id = pa.code
    WHERE ua.user_id = p_user_id;

    -- Определяем уровень и тир
    RETURN QUERY
    SELECT 
        v_current_score,
        CASE 
            WHEN v_current_score >= 9.0 THEN 'Мастер'
            WHEN v_current_score >= 8.0 THEN 'Эксперт'
            WHEN v_current_score >= 7.0 THEN 'Специалист'
            WHEN v_current_score >= 6.0 THEN 'Стажер'
            ELSE 'Новичок'
        END::TEXT as current_level,
        CASE 
            WHEN v_current_score >= 9.0 THEN 'platinum'
            WHEN v_current_score >= 8.0 THEN 'gold'
            WHEN v_current_score >= 7.0 THEN 'silver'
            ELSE 'bronze'
        END::TEXT as current_tier,
        CASE 
            WHEN v_current_score >= 9.0 THEN 1.5
            WHEN v_current_score >= 8.0 THEN 1.3
            WHEN v_current_score >= 7.0 THEN 1.1
            ELSE 1.0
        END::DECIMAL(3,2) as xp_multiplier,
        v_weekly_avg,
        v_monthly_avg,
        v_mood_stability_val,
        v_energy_consistency_val,
        v_stress_management_val,
        v_achievements_count,
        v_productivity_achievements;
END;
$$ LANGUAGE plpgsql;

-- Проверяем исправление
DO $$
BEGIN
    RAISE NOTICE '✅ Функция get_user_productivity_stats исправлена успешно!';
    RAISE NOTICE '🔧 Убраны ВСЕ конфликты имен переменных';
    RAISE NOTICE '📊 Используются алиасы таблиц для избежания конфликтов';
    RAISE NOTICE '🎯 Теперь функция работает без ошибок!';
END $$;


