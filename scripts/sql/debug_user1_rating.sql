-- Детальная диагностика почему рейтинг = 0 для пользователя 1

-- Проверяем данные для расчета рейтинга
WITH user_data AS (
  SELECT 
    user_id,
    COUNT(*) FILTER (WHERE type IN ('mood', 'daily_mood_check')) as mood_count,
    COUNT(*) FILTER (WHERE type IN ('activity', 'activity_analysis')) as activity_count,
    AVG(mood_rating) FILTER (WHERE type IN ('mood', 'daily_mood_check')) as avg_mood,
    AVG(energy_rating) FILTER (WHERE type IN ('mood', 'daily_mood_check')) as avg_energy,
    AVG(stress_rating) FILTER (WHERE type IN ('mood', 'daily_mood_check')) as avg_stress,
    COUNT(*) FILTER (WHERE type IN ('activity', 'activity_analysis') AND success_rating >= 5) as successful_activities,
    COUNT(*) FILTER (WHERE type IN ('activity', 'activity_analysis') AND success_rating < 5) as failed_activities
  FROM ai_signals
  WHERE user_id = 1
  GROUP BY user_id
),
platform_activity AS (
  SELECT 
    COUNT(*) as total_actions,
    COUNT(*)::numeric / GREATEST(EXTRACT(EPOCH FROM (CURRENT_DATE - MIN(DATE(timestamp)))) / 86400, 1) as avg_actions_per_day
  FROM activity_log
  WHERE user_id = 1
)
SELECT 
  ud.*,
  pa.total_actions,
  pa.avg_actions_per_day,
  GREATEST(0.6, LEAST(pa.avg_actions_per_day / 10.0, 1.0)) as k_coefficient,
  calculate_productivity_score(1, CURRENT_DATE) as calculated_rating
FROM user_data ud
CROSS JOIN platform_activity pa;

-- Проверяем activity_log для пользователя 1
SELECT COUNT(*) as activity_log_count FROM activity_log WHERE user_id = 1;

-- Проверяем структуру данных настроения
SELECT 
  type,
  COUNT(*) as count,
  AVG(mood_rating) as avg_mood,
  AVG(energy_rating) as avg_energy,
  AVG(stress_rating) as avg_stress
FROM ai_signals
WHERE user_id = 1
AND type IN ('mood', 'daily_mood_check')
GROUP BY type;
