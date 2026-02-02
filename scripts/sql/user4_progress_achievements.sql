-- Прогресс и достижения пользователя 4 (геймификация, XP, страница Прогресс)

\echo '========== 1. user_progress (user_id = 4) =========='
SELECT * FROM user_progress WHERE user_id = 4;

\echo ''
\echo '========== 2. user_achievements (разблокированные достижения) =========='
SELECT ua.id, ua.achievement_id, ua.unlocked_at
FROM user_achievements ua
WHERE ua.user_id = 4
ORDER BY ua.unlocked_at;

\echo ''
\echo '========== 3. Все достижения (achievements) и статус для user 4 =========='
SELECT
  a.code AS achievement_code,
  a.name AS title,
  a.requirement_type,
  a.requirement_value,
  a.requirement_action,
  a.xp_reward,
  a.tier,
  a.is_active,
  CASE WHEN ua.user_id IS NOT NULL THEN true ELSE false END AS unlocked_for_user4,
  ua.unlocked_at
FROM achievements a
LEFT JOIN user_achievements ua ON a.code = ua.achievement_id AND ua.user_id = 4
WHERE a.is_active = true
ORDER BY a.tier, a.xp_reward;

\echo ''
\echo '========== 4. activity_log для user 4 (источник XP, последние 50) =========='
SELECT id, action, xp_earned, description, created_at
FROM activity_log
WHERE user_id = 4
ORDER BY created_at DESC
LIMIT 50;

\echo ''
\echo '========== 5. Сводка XP по действиям (user 4) =========='
SELECT action, COUNT(*) AS cnt, SUM(xp_earned) AS total_xp
FROM activity_log
WHERE user_id = 4
GROUP BY action
ORDER BY total_xp DESC;

\echo ''
\echo '========== 6. Общий суммарный XP из activity_log (user 4) =========='
SELECT SUM(xp_earned) AS total_xp_from_activity_log FROM activity_log WHERE user_id = 4;
