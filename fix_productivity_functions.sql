-- =====================================================
-- ОБЩИЙ РЕЙТИНГ ПРОДУКТИВНОСТИ ЗА ВСЕ ВРЕМЯ
-- =====================================================

-- 0. Удаляем старую функцию с неправильной структурой
DROP FUNCTION IF EXISTS get_user_productivity_stats(integer);

-- 1. Функция для расчета общего рейтинга продуктивности (ИСПРАВЛЕНО)
CREATE OR REPLACE FUNCTION calculate_simple_productivity_rating(p_user_id INTEGER, p_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_mood_score DECIMAL(5,2) := 0;
    v_activity_score DECIMAL(5,2) := 0;
    v_final_rating DECIMAL(5,2) := 0;
    v_mood_count INTEGER := 0;
    v_activity_count INTEGER := 0;
BEGIN
    -- Получаем среднее настроение за ВСЕ ВРЕМЯ (убираем ограничение по дате)
    SELECT 
        COALESCE(AVG(mood_rating), 0),
        COUNT(*)
    INTO v_mood_score, v_mood_count
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type = 'mood'
    AND mood_rating IS NOT NULL;

    -- Получаем среднюю активность за ВСЕ ВРЕМЯ (убираем ограничение по дате)
    SELECT 
        COALESCE(AVG(success_rating), 0),
        COUNT(*)
    INTO v_activity_score, v_activity_count
    FROM ai_signals
    WHERE user_id = p_user_id
    AND type = 'activity'
    AND success_rating IS NOT NULL;

    -- ФОРМУЛА: (среднее всех настроений + среднее всех активностей) / 2
    IF v_mood_count > 0 OR v_activity_count > 0 THEN
        v_final_rating := (v_mood_score + v_activity_score) / 2;
    ELSE
        v_final_rating := 0;
    END IF;

    RETURN ROUND(v_final_rating, 2);
END;
$$ LANGUAGE plpgsql;

-- 2. Функция для подсчета общего количества записей
CREATE OR REPLACE FUNCTION count_total_records(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_total_count INTEGER := 0;
BEGIN
    SELECT COUNT(*)
    INTO v_total_count
    FROM ai_signals
    WHERE user_id = p_user_id;
    
    RETURN v_total_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Функция для получения общего рейтинга продуктивности
CREATE OR REPLACE FUNCTION get_user_productivity_stats(p_user_id INTEGER)
RETURNS TABLE(
    overall_rating DECIMAL(5,2),
    total_records INTEGER,
    mood_average DECIMAL(5,2),
    activity_average DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        calculate_simple_productivity_rating(p_user_id) as overall_rating,
        count_total_records(p_user_id) as total_records,
        (SELECT COALESCE(AVG(mood_rating), 0) FROM ai_signals WHERE user_id = p_user_id AND type = 'mood' AND mood_rating IS NOT NULL) as mood_average,
        (SELECT COALESCE(AVG(success_rating), 0) FROM ai_signals WHERE user_id = p_user_id AND type = 'activity' AND success_rating IS NOT NULL) as activity_average;
END;
$$ LANGUAGE plpgsql;

-- 4. Тестируем функции
SELECT 'Функции общего рейтинга созданы успешно!' as status;

-- 5. Проверяем работу для пользователя 1
SELECT * FROM get_user_productivity_stats(1);

-- 6. Проверяем отдельные функции
SELECT 
    'Общий рейтинг' as metric,
    calculate_simple_productivity_rating(1)::text as value
UNION ALL
SELECT 
    'Всего записей' as metric,
    count_total_records(1)::text as value;
