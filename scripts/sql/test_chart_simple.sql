SELECT date::text, rating::numeric FROM get_rating_vs_activities_chart(4, 3) ORDER BY date LIMIT 3;
