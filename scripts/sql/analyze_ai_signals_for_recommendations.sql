-- Анализ ai_signals для эндпоинта generate-personal-recommendations.
-- Запуск: docker exec -i <postgres_container> psql -U <user> -d <db> -v user_id=4 -f scripts/sql/analyze_ai_signals_for_recommendations.sql
-- Или из корня: (. ./.env 2>/dev/null; docker run --rm -e PGHOST -e PGPORT -e PGUSER -e PGPASSWORD -e PGDATABASE postgres:15 psql -h "$PGHOST" -p "${PGPORT:-5432}" -U "$PGUSER" -d "$PGDATABASE" -v user_id=4 -f -) < scripts/sql/analyze_ai_signals_for_recommendations.sql

\echo '=== ai_signals: структура и данные для user_id =' :user_id '==='
\echo ''

\echo '1) Колонки ai_signals:'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_signals' 
ORDER BY ordinal_position;

\echo ''
\echo '2) Количество записей по type для user_id =' :user_id
SELECT type, COUNT(*) AS cnt 
FROM ai_signals 
WHERE user_id = :user_id
GROUP BY type 
ORDER BY cnt DESC;

\echo ''
\echo '3) Последние 50 записей (как в коде): type, data есть?, mood_rating, stress_rating, success_rating'
SELECT id, type, 
       (data IS NOT NULL AND data::text != '{}') AS has_data,
       mood_rating, stress_rating, success_rating,
       LEFT(data::text, 60) AS data_preview,
       timestamp
FROM ai_signals 
WHERE user_id = :user_id
ORDER BY timestamp DESC 
LIMIT 50;

\echo ''
\echo '4) Что видит код: только type IN (mood, activity), читает row.data'
\echo '   Записей type=mood:'
SELECT COUNT(*) FROM ai_signals WHERE user_id = :user_id AND type = 'mood';
\echo '   Записей type=activity:'
SELECT COUNT(*) FROM ai_signals WHERE user_id = :user_id AND type = 'activity';
\echo '   Записей type=daily_mood_check (НЕ читаются кодом):'
SELECT COUNT(*) FROM ai_signals WHERE user_id = :user_id AND type = 'daily_mood_check';
\echo '   Записей type=activity_analysis (НЕ читаются кодом):'
SELECT COUNT(*) FROM ai_signals WHERE user_id = :user_id AND type = 'activity_analysis';

\echo ''
\echo '5) Фактические данные настроения (daily_mood_check + mood) — колонки mood_rating, stress_rating:'
SELECT mood_rating, stress_rating, type, timestamp 
FROM ai_signals 
WHERE user_id = :user_id AND type IN ('mood', 'daily_mood_check') 
ORDER BY timestamp DESC 
LIMIT 30;

\echo ''
\echo '6) Фактические активности (activity_analysis + activity) — success_rating:'
SELECT success_rating, type, notes, activity_category, timestamp 
FROM ai_signals 
WHERE user_id = :user_id AND type IN ('activity', 'activity_analysis') 
ORDER BY timestamp DESC 
LIMIT 30;

\echo ''
\echo '7) Сводка: среднее настроение и стресс по ВСЕМ типам настроения; доля успешных активностей:'
SELECT 
  (SELECT ROUND(AVG(mood_rating)::numeric, 2) FROM ai_signals WHERE user_id = :user_id AND type IN ('mood', 'daily_mood_check') AND mood_rating IS NOT NULL) AS avg_mood,
  (SELECT ROUND(AVG(stress_rating)::numeric, 2) FROM ai_signals WHERE user_id = :user_id AND type IN ('mood', 'daily_mood_check') AND stress_rating IS NOT NULL) AS avg_stress,
  (SELECT COUNT(*) FROM ai_signals WHERE user_id = :user_id AND type IN ('activity', 'activity_analysis') AND success_rating IS NOT NULL AND success_rating >= 5) AS successful_activities,
  (SELECT COUNT(*) FROM ai_signals WHERE user_id = :user_id AND type IN ('activity', 'activity_analysis')) AS total_activities;
