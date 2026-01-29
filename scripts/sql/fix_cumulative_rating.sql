-- ===================================================================
-- ИСПРАВЛЕНИЕ: НАКОПИТЕЛЬНЫЙ (КУМУЛЯТИВНЫЙ) РЕЙТИНГ
-- ===================================================================
-- Рейтинг должен накапливать все исторические данные, а не считать по дням
-- Формула: сумма всех настроений + сумма всех активностей за всю историю
-- ===================================================================

DROP FUNCTION IF EXISTS calculate_productivity_score(INTEGER, DATE) CASCADE;

CREATE FUNCTION calculate_productivity_score(p_user_id INTEGER, p_date DATE DEFAULT CURRENT_DATE)
RETURNS NUMERIC AS $$
DECLARE
    v_mood_score DECIMAL(10,2) := 0;
    v_successful_activities INTEGER := 0;
    v_failed_activities INTEGER := 0;
    v_platform_coefficient DECIMAL(3,2) := 0.6;
    v_final_score DECIMAL(10,2) := 0;
    v_mood_entries INTEGER := 0;
    v_activity_entries INTEGER := 0;
    v_platform_actions INTEGER := 0;
    v_total_possible_actions INTEGER := 10; -- Для расчета коэффициента за день
    v_daily_platform_actions INTEGER := 0;
    v_days_with_data INTEGER := 1;         -- дней с хотя бы одной записью (для нормализации активностей)
    v_activity_component DECIMAL(10,2) := 0; -- компонент активностей, нормализованный 0..10
BEGIN
    -- ===================================================================
    -- НАКОПИТЕЛЬНЫЙ РАСЧЕТ: ВСЯ ИСТОРИЯ ДО УКАЗАННОЙ ДАТЫ (включительно)
    -- ===================================================================
    
    -- Расчет компонента настроения: СУММА ВСЕХ рейтингов за всю историю
    -- Исправлено: правильная обработка NULL значений
    SELECT 
        COALESCE(SUM(
            COALESCE(mood_rating, 0) + 
            COALESCE(energy_rating, 0) + 
            (10 - COALESCE(stress_rating, 5))
        ), 0),
        COUNT(*)
    INTO v_mood_score, v_mood_entries
    FROM ai_signals 
    WHERE user_id = p_user_id 
    AND type IN ('mood', 'daily_mood_check') 
    AND DATE(timestamp) <= p_date; -- ВСЯ история до этой даты
    
    -- Расчет количества успешных и неуспешных активностей: СУММА ВСЕХ за всю историю
    -- Исправлено: порог успешности >= 5 (вместо >= 7) для соответствия логике фронтенда
    SELECT 
        COUNT(*) FILTER (WHERE success_rating >= 5),
        COUNT(*) FILTER (WHERE success_rating < 5)
    INTO v_successful_activities, v_failed_activities
    FROM ai_signals 
    WHERE user_id = p_user_id 
    AND type IN ('activity', 'activity_analysis') 
    AND DATE(timestamp) <= p_date; -- ВСЯ история до этой даты
    
    -- Число дней с данными (для нормализации компонента активностей, чтобы рейтинг не улетал в 10)
    SELECT COUNT(DISTINCT action_date) INTO v_days_with_data
    FROM (
        SELECT DATE(timestamp) AS action_date FROM ai_signals WHERE user_id = p_user_id AND DATE(timestamp) <= p_date
        UNION
        SELECT DATE(created_at) FROM activity_log WHERE user_id = p_user_id AND DATE(created_at) <= p_date
    ) AS days_list;
    v_days_with_data := GREATEST(v_days_with_data, 1);
    
    -- Коэффициент K: насколько человек активен за день (0..7 действий, 7 = максимум).
    -- K за день = 0.6 + (действий_за_день / 7) * 0.4; итоговый K = среднее K по всем дням, границы [0.6, 1.0].
    SELECT 
        COALESCE(
            AVG(LEAST(1.0, 0.6 + (daily_actions_count::DECIMAL / 7.0) * 0.4)),
            0.6
        )
    INTO v_platform_coefficient
    FROM (
        SELECT 
            DATE(COALESCE(timestamp, created_at)) as action_date,
            COUNT(*) as daily_actions_count
        FROM (
            SELECT timestamp, NULL::timestamp as created_at
            FROM ai_signals 
            WHERE user_id = p_user_id 
            AND DATE(timestamp) <= p_date
            
            UNION ALL
            
            SELECT NULL::timestamp as timestamp, created_at
            FROM activity_log
            WHERE user_id = p_user_id 
            AND DATE(created_at) <= p_date
        ) AS all_actions
        WHERE COALESCE(timestamp, created_at) IS NOT NULL
        GROUP BY DATE(COALESCE(timestamp, created_at))
    ) AS daily_stats;
    
    -- Ограничения: минимум 0.6, максимум 1.0
    v_platform_coefficient := GREATEST(0.6, LEAST(COALESCE(v_platform_coefficient, 0.6), 1.0));
    
    -- ===================================================================
    -- НАКОПИТЕЛЬНАЯ ФОРМУЛА (с нормализацией активностей по дням):
    -- Настроение: среднее за все записи (0..10).
    -- Активности: (успешные×0.5 + неуспешные×(-0.5)) / дни_с_данными, ограничено 0..10.
    -- Итог: (настроение + активности) × 1.2 × K, cap 0..10.
    -- ===================================================================
    
    -- Среднее настроение за всю историю (шкала 0..10)
    DECLARE
        v_avg_mood_component DECIMAL(10,2) := 0;
    BEGIN
        IF v_mood_entries > 0 THEN
            v_avg_mood_component := v_mood_score / v_mood_entries / 3.0;
        END IF;
        
        -- Компонент активностей: нормализуем по дням, чтобы не улетать в 10 из-за большого числа записей
        v_activity_component := (
            (v_successful_activities * 0.5) + (v_failed_activities * (-0.5))
        ) / v_days_with_data::DECIMAL;
        v_activity_component := GREATEST(0.0, LEAST(10.0, v_activity_component));
        
        -- Накопительный рейтинг: настроение + нормализованные активности
        v_final_score := (
            v_avg_mood_component + v_activity_component
        ) * 1.2 * v_platform_coefficient;
    END;
    
    -- Если нет данных настроения, но есть активности - используем только активности (уже нормализованы)
    IF v_mood_entries = 0 AND (v_successful_activities > 0 OR v_failed_activities > 0) THEN
        v_final_score := v_activity_component * 1.2 * v_platform_coefficient;
    END IF;
    
    -- Ограничиваем рейтинг от 0 до 10
    v_final_score := GREATEST(0.0, LEAST(10.0, v_final_score));
    
    -- Сохраняем результат в таблицу productivity_scores
    INSERT INTO productivity_scores (
        user_id, date, daily_score, mood_component, activity_component,
        quality_multiplier, platform_activity_coefficient, final_score,
        mood_entries_count, activity_entries_count, quality_penalties
    ) VALUES (
        p_user_id, p_date, v_final_score, 
        CASE WHEN v_mood_entries > 0 THEN v_mood_score / v_mood_entries / 3.0 ELSE 0 END,
        v_activity_component,
        1.0, v_platform_coefficient, v_final_score,
        v_mood_entries, v_successful_activities + v_failed_activities, 0
    ) ON CONFLICT (user_id, date) DO UPDATE SET
        daily_score = EXCLUDED.daily_score,
        mood_component = EXCLUDED.mood_component,
        activity_component = EXCLUDED.activity_component,
        quality_multiplier = EXCLUDED.quality_multiplier,
        platform_activity_coefficient = EXCLUDED.platform_activity_coefficient,
        final_score = EXCLUDED.final_score,
        mood_entries_count = EXCLUDED.mood_entries_count,
        activity_entries_count = EXCLUDED.activity_entries_count,
        quality_penalties = EXCLUDED.quality_penalties,
        created_at = NOW();
    
    -- Обновляем user_progress
    UPDATE user_progress SET
        productivity_score = v_final_score,
        last_mood_check = NOW(),
        daily_entries_count = v_mood_entries + v_successful_activities + v_failed_activities,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN v_final_score;
END;
$$ LANGUAGE plpgsql;

-- Обновляем функцию get_user_productivity_stats для использования накопительного рейтинга
CREATE OR REPLACE FUNCTION get_user_productivity_stats(p_user_id INTEGER)
RETURNS TABLE(
    overall_rating NUMERIC,
    total_records INTEGER,
    mood_average NUMERIC,
    activity_average NUMERIC,
    mood_stability NUMERIC,
    energy_consistency NUMERIC,
    stress_management NUMERIC,
    xp_multiplier NUMERIC,
    total_achievements INTEGER,
    productivity_achievements INTEGER
) AS $$
DECLARE
    v_mood_stability NUMERIC;
    v_energy_consistency NUMERIC;
    v_stress_management NUMERIC;
    v_xp_multiplier NUMERIC;
    v_total_achievements INTEGER;
    v_productivity_achievements INTEGER;
    v_cumulative_rating NUMERIC;
BEGIN
    -- Рассчитываем накопительный рейтинг на основе ВСЕЙ истории
    SELECT calculate_productivity_score(p_user_id, CURRENT_DATE) INTO v_cumulative_rating;
    
    -- Стабильность настроения (стандартное отклонение, инвертированное)
    SELECT 
        CASE 
            WHEN COUNT(*) > 1 THEN 
                GREATEST(0, 10 - COALESCE(STDDEV(mood_rating) * 2, 0))
            ELSE 10
        END INTO v_mood_stability
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check')
    AND mood_rating IS NOT NULL
    AND timestamp >= CURRENT_DATE - INTERVAL '7 days';
    
    IF v_mood_stability IS NULL THEN
        v_mood_stability := 5.0;
    END IF;
    
    -- Стабильность энергии
    SELECT 
        CASE 
            WHEN COUNT(*) > 1 THEN 
                GREATEST(0, 10 - COALESCE(STDDEV(energy_rating) * 2, 0))
            ELSE 10
        END INTO v_energy_consistency
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check')
    AND energy_rating IS NOT NULL
    AND timestamp >= CURRENT_DATE - INTERVAL '7 days';
    
    IF v_energy_consistency IS NULL THEN
        v_energy_consistency := 5.0;
    END IF;
    
    -- Управление стрессом
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 
                GREATEST(0, 10 - COALESCE(AVG(stress_rating), 5))
            ELSE 5
        END INTO v_stress_management
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type IN ('mood', 'daily_mood_check')
    AND stress_rating IS NOT NULL
    AND timestamp >= CURRENT_DATE - INTERVAL '7 days';
    
    IF v_stress_management IS NULL THEN
        v_stress_management := 5.0;
    END IF;
    
    -- XP множитель на основе накопительного рейтинга
    SELECT 
        CASE 
            WHEN v_cumulative_rating >= 8 THEN 1.5
            WHEN v_cumulative_rating >= 6 THEN 1.2
            WHEN v_cumulative_rating >= 4 THEN 1.0
            ELSE 0.8
        END INTO v_xp_multiplier;
    
    -- Общее количество достижений
    SELECT COUNT(*) INTO v_total_achievements
    FROM user_achievements
    WHERE user_id = p_user_id;
    
    -- Достижения продуктивности
    SELECT COUNT(*) INTO v_productivity_achievements
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.code
    WHERE ua.user_id = p_user_id
    AND (a.code LIKE '%productivity%' OR a.code LIKE '%mood%' OR a.code LIKE '%activity%');
    
    RETURN QUERY
    SELECT 
        v_cumulative_rating as overall_rating,
        count_total_records(p_user_id) as total_records,
        (SELECT COALESCE(AVG(mood_rating), 0) 
         FROM ai_signals 
         WHERE user_id = p_user_id 
         AND type IN ('mood', 'daily_mood_check') 
         AND mood_rating IS NOT NULL) as mood_average,
        (SELECT COALESCE(AVG(success_rating), 0) 
         FROM ai_signals 
         WHERE user_id = p_user_id 
         AND type IN ('activity', 'activity_analysis') 
         AND success_rating IS NOT NULL) as activity_average,
        COALESCE(v_mood_stability, 5.0) as mood_stability,
        COALESCE(v_energy_consistency, 5.0) as energy_consistency,
        COALESCE(v_stress_management, 5.0) as stress_management,
        COALESCE(v_xp_multiplier, 1.0) as xp_multiplier,
        COALESCE(v_total_achievements, 0) as total_achievements,
        COALESCE(v_productivity_achievements, 0) as productivity_achievements;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения данных графика зависимости рейтинга от активностей
DROP FUNCTION IF EXISTS get_rating_vs_activities_chart(INTEGER, INTEGER) CASCADE;

CREATE FUNCTION get_rating_vs_activities_chart(p_user_id INTEGER, p_days INTEGER DEFAULT 14)
RETURNS TABLE(
    date DATE,
    rating NUMERIC,
    total_activities BIGINT,
    successful_activities BIGINT,
    failed_activities BIGINT,
    mood_records BIGINT,
    activity_log_actions BIGINT,
    cumulative_mood_score NUMERIC,
    cumulative_activity_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT day_date::date as date
        FROM generate_series(CURRENT_DATE - (p_days - 1), CURRENT_DATE, '1 day'::interval) as day_date
    ),
    daily_stats AS (
        SELECT 
            ds.date as stat_date,
            -- Статистика активностей за эту дату (приводим к BIGINT)
            COALESCE(COUNT(*) FILTER (WHERE ai.type IN ('activity', 'activity_analysis')), 0)::BIGINT as total_activities,
            COALESCE(COUNT(*) FILTER (WHERE ai.type IN ('activity', 'activity_analysis') AND ai.success_rating >= 7), 0)::BIGINT as successful_activities,
            COALESCE(COUNT(*) FILTER (WHERE ai.type IN ('activity', 'activity_analysis') AND ai.success_rating < 7), 0)::BIGINT as failed_activities,
            COALESCE(COUNT(*) FILTER (WHERE ai.type IN ('mood', 'daily_mood_check')), 0)::BIGINT as mood_records,
            COALESCE((SELECT COUNT(*) FROM activity_log WHERE user_id = p_user_id AND DATE(created_at) = ds.date), 0)::BIGINT as activity_log_actions,
            -- Накопительные суммы до этой даты
            COALESCE(SUM(ai.mood_rating + ai.energy_rating + (10 - ai.stress_rating)) FILTER (WHERE ai.type IN ('mood', 'daily_mood_check') AND DATE(ai.timestamp) <= ds.date), 0)::NUMERIC as cumulative_mood_score,
            COALESCE(
                ((COUNT(*) FILTER (WHERE ai.type IN ('activity', 'activity_analysis') AND ai.success_rating >= 7 AND DATE(ai.timestamp) <= ds.date) * 0.5) -
                 (COUNT(*) FILTER (WHERE ai.type IN ('activity', 'activity_analysis') AND ai.success_rating < 7 AND DATE(ai.timestamp) <= ds.date) * 0.5))::NUMERIC,
                0::NUMERIC
            ) as cumulative_activity_score
        FROM date_series ds
        LEFT JOIN ai_signals ai ON ai.user_id = p_user_id AND DATE(ai.timestamp) <= ds.date
        GROUP BY ds.date
        ORDER BY ds.date ASC
    )
    SELECT 
        ds.stat_date as date,
        calculate_productivity_score(p_user_id, ds.stat_date) as rating,
        ds.total_activities,
        ds.successful_activities,
        ds.failed_activities,
        ds.mood_records,
        ds.activity_log_actions,
        ds.cumulative_mood_score,
        ds.cumulative_activity_score
    FROM daily_stats ds;
END;
$$ LANGUAGE plpgsql;

-- Проверка обновления функций
SELECT 
    'Функции обновлены для накопительного рейтинга' as status,
    proname as function_name,
    pg_get_function_identity_arguments(oid) as signature
FROM pg_proc 
WHERE proname IN ('calculate_productivity_score', 'get_user_productivity_stats', 'get_rating_vs_activities_chart')
ORDER BY proname;

-- Тест: пересчитываем рейтинги для всех дней с новой логикой
SELECT 
    'Пересчет накопительных рейтингов' as info,
    day_date::date as date,
    calculate_productivity_score(4, day_date::date) as cumulative_rating
FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day'::interval) as day_date
ORDER BY day_date ASC;

-- Тест: данные для графика зависимости рейтинга от активностей
SELECT 
    'Данные для графика зависимости рейтинга от активностей' as info;
    
SELECT * FROM get_rating_vs_activities_chart(4, 14)
ORDER BY date ASC;
