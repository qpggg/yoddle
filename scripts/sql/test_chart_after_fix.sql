-- Проверка функции после исправления
SELECT date, rating, total_activities, successful_activities 
FROM get_rating_vs_activities_chart(4, 14) 
ORDER BY date ASC 
LIMIT 5;
