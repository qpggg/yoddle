-- Удаление тестового недельного инсайта для пользователя 4
DELETE FROM ai_insights 
WHERE user_id = 4 
AND type = 'weekly_insight'
AND (metadata::text LIKE '%testMode%' OR content LIKE '%тестовый%' OR content LIKE '%тест%');
