-- ===================================================================
-- ПОЛНЫЙ РАЗБОР ДАННЫХ ПОЛЬЗОВАТЕЛЯ 4 И РУЧНОЙ РАСЧЕТ РЕЙТИНГА
-- Запусти в DBeaver/psql и пришли вывод — по нему скорректируем формулу
-- ===================================================================

-- 1. ВСЕ ЗАПИСИ НАСТРОЕНИЯ (mood, daily_mood_check) user_id=4
SELECT '=== 1. ЗАПИСИ НАСТРОЕНИЯ user_id=4 ===' AS section;
SELECT id, type, mood_rating, energy_rating, stress_rating,
       COALESCE(mood_rating,0) + COALESCE(energy_rating,0) + (10 - COALESCE(stress_rating,5)) AS row_score,
       DATE(timestamp) AS date, timestamp
FROM ai_signals
WHERE user_id = 4 AND type IN ('mood', 'daily_mood_check')
ORDER BY timestamp;

-- 2. СВОДКА ПО НАСТРОЕНИЮ (вход в формулу)
SELECT '=== 2. СВОДКА НАСТРОЕНИЯ ===' AS section;
SELECT
  COUNT(*) AS mood_entries,
  COALESCE(SUM(COALESCE(mood_rating,0) + COALESCE(energy_rating,0) + (10 - COALESCE(stress_rating,5))), 0) AS mood_score_sum,
  ROUND((COALESCE(SUM(COALESCE(mood_rating,0) + COALESCE(energy_rating,0) + (10 - COALESCE(stress_rating,5))), 0)::numeric / NULLIF(COUNT(*), 0) / 3.0), 4) AS avg_mood_component
FROM ai_signals
WHERE user_id = 4 AND type IN ('mood', 'daily_mood_check')
  AND DATE(timestamp) <= CURRENT_DATE;

-- 3. ВСЕ ЗАПИСИ АКТИВНОСТЕЙ (activity, activity_analysis) user_id=4
SELECT '=== 3. ЗАПИСИ АКТИВНОСТЕЙ user_id=4 ===' AS section;
SELECT id, type, success_rating,
       CASE WHEN success_rating >= 5 THEN 1 ELSE 0 END AS counts_as_success,
       DATE(timestamp) AS date, timestamp
FROM ai_signals
WHERE user_id = 4 AND type IN ('activity', 'activity_analysis')
ORDER BY timestamp;

-- 4. СВОДКА ПО АКТИВНОСТЯМ (вход в формулу)
SELECT '=== 4. СВОДКА АКТИВНОСТЕЙ ===' AS section;
SELECT
  COUNT(*) FILTER (WHERE success_rating >= 5) AS successful_activities,
  COUNT(*) FILTER (WHERE success_rating < 5 OR success_rating IS NULL) AS failed_activities,
  (COUNT(*) FILTER (WHERE success_rating >= 5) * 0.5) + (COUNT(*) FILTER (WHERE success_rating < 5 OR success_rating IS NULL) * (-0.5)) AS activity_component_raw
FROM ai_signals
WHERE user_id = 4 AND type IN ('activity', 'activity_analysis')
  AND DATE(timestamp) <= CURRENT_DATE;

-- 5. КОЭФФИЦИЕНТ K (платформа) — дни и действия
SELECT '=== 5. КОЭФФИЦИЕНТ K ===' AS section;
WITH daily AS (
  SELECT DATE(COALESCE(timestamp, created_at)) AS action_date, COUNT(*) AS cnt
  FROM (
    SELECT timestamp, NULL::timestamp AS created_at FROM ai_signals WHERE user_id = 4 AND DATE(timestamp) <= CURRENT_DATE
    UNION ALL
    SELECT NULL::timestamp, created_at FROM activity_log WHERE user_id = 4 AND DATE(created_at) <= CURRENT_DATE
  ) AS t
  WHERE COALESCE(timestamp, created_at) IS NOT NULL
  GROUP BY DATE(COALESCE(timestamp, created_at))
)
SELECT
  COUNT(*) AS days_with_actions,
  ROUND(AVG(cnt)::numeric, 2) AS avg_actions_per_day,
  ROUND(GREATEST(0.6, LEAST(COALESCE(AVG(cnt)::numeric / 10.0, 0.6), 1.0))::numeric, 4) AS platform_coefficient_K
FROM daily;

-- 6. РУЧНОЙ РАСЧЕТ ПО ТЕКУЩЕЙ ФОРМУЛЕ (после правки: активность нормализована по дням)
SELECT '=== 6. РУЧНОЙ РАСЧЕТ (с нормализацией активностей по дням) ===' AS section;
WITH mood_data AS (
  SELECT
    COUNT(*) AS n,
    COALESCE(SUM(COALESCE(mood_rating,0) + COALESCE(energy_rating,0) + (10 - COALESCE(stress_rating,5))), 0) AS total
  FROM ai_signals
  WHERE user_id = 4 AND type IN ('mood', 'daily_mood_check') AND DATE(timestamp) <= CURRENT_DATE
),
activity_data AS (
  SELECT
    COUNT(*) FILTER (WHERE success_rating >= 5) AS ok,
    COUNT(*) FILTER (WHERE success_rating < 5 OR success_rating IS NULL) AS fail
  FROM ai_signals
  WHERE user_id = 4 AND type IN ('activity', 'activity_analysis') AND DATE(timestamp) <= CURRENT_DATE
),
k_data AS (
  SELECT COALESCE(AVG(cnt), 10) * 0.1 AS k
  FROM (
    SELECT DATE(COALESCE(timestamp, created_at)) AS d, COUNT(*) AS cnt
    FROM (
      SELECT timestamp, NULL::timestamp AS created_at FROM ai_signals WHERE user_id = 4 AND DATE(timestamp) <= CURRENT_DATE
      UNION ALL
      SELECT NULL, created_at FROM activity_log WHERE user_id = 4 AND DATE(created_at) <= CURRENT_DATE
    ) t
    WHERE COALESCE(timestamp, created_at) IS NOT NULL
    GROUP BY DATE(COALESCE(timestamp, created_at))
  ) daily
),
days_data AS (
  SELECT COUNT(DISTINCT action_date) AS days_with_data
  FROM (
    SELECT DATE(timestamp) AS action_date FROM ai_signals WHERE user_id = 4 AND DATE(timestamp) <= CURRENT_DATE
    UNION
    SELECT DATE(created_at) FROM activity_log WHERE user_id = 4 AND DATE(created_at) <= CURRENT_DATE
  ) t
)
SELECT
  m.n AS mood_entries,
  ROUND((m.total::numeric / NULLIF(m.n, 0) / 3.0), 4) AS avg_mood_component,
  a.ok AS successful_activities,
  a.fail AS failed_activities,
  GREATEST(1, d.days_with_data) AS days_with_data,
  ROUND(LEAST(10.0, GREATEST(0.0, (a.ok * 0.5 + a.fail * (-0.5)) / GREATEST(d.days_with_data, 1))), 4) AS activity_component_normalized,
  ROUND(GREATEST(0.6, LEAST(COALESCE(k.k, 0.6), 1.0))::numeric, 4) AS K,
  ROUND(LEAST(10.0, GREATEST(0.0, (
    (CASE WHEN m.n > 0 THEN m.total::numeric / m.n / 3.0 ELSE 0 END) +
    LEAST(10.0, GREATEST(0.0, (a.ok * 0.5 + a.fail * (-0.5)) / GREATEST(d.days_with_data, 1)))
  ) * 1.2 * GREATEST(0.6, LEAST(COALESCE(k.k, 0.6), 1.0)))), 2) AS final_rating_capped
FROM mood_data m, activity_data a, k_data k, days_data d;

-- 7. ЧТО ВОЗВРАЩАЕТ ФУНКЦИЯ (после применения fix_cumulative_rating.sql)
SELECT '=== 7. РЕЗУЛЬТАТ ФУНКЦИИ ===' AS section;
SELECT calculate_productivity_score(4, CURRENT_DATE) AS function_rating;
