-- Добавление внешних ключей для таблиц геймификации

-- 1. Связь user_progress с таблицей пользователей (enter)
ALTER TABLE user_progress 
ADD CONSTRAINT fk_user_progress_user_id 
FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;

-- 2. Связь user_achievements с таблицей пользователей (enter)
ALTER TABLE user_achievements 
ADD CONSTRAINT fk_user_achievements_user_id 
FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;

-- 3. Связь activity_log с таблицей пользователей (enter)
ALTER TABLE activity_log 
ADD CONSTRAINT fk_activity_log_user_id 
FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;

-- 4. Проверим и добавим связь для user_benefits если ее нет
-- Связь с пользователем
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_benefits_user_id' 
        AND table_name = 'user_benefits'
    ) THEN
        ALTER TABLE user_benefits 
        ADD CONSTRAINT fk_user_benefits_user_id 
        FOREIGN KEY (user_id) REFERENCES enter(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Связь с льготами  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_benefits_benefit_id' 
        AND table_name = 'user_benefits'
    ) THEN
        ALTER TABLE user_benefits 
        ADD CONSTRAINT fk_user_benefits_benefit_id 
        FOREIGN KEY (benefit_id) REFERENCES benefits(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Проверка всех созданных связей
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('user_progress', 'user_achievements', 'activity_log', 'user_benefits')
ORDER BY tc.table_name, tc.constraint_name; 