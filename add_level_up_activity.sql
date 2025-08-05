-- Добавляем level_up в activity_types
INSERT INTO activity_types (action, short_description, description, xp_earned, icon) 
VALUES ('level_up', 'Повышение уровня', 'Достижение нового уровня в системе', 100, '⭐')
ON CONFLICT (action) DO UPDATE SET 
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  xp_earned = EXCLUDED.xp_earned,
  icon = EXCLUDED.icon; 