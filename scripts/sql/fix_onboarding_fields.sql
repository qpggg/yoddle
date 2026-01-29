-- ===================================================================
-- ИСПРАВЛЕНИЕ: Проверка и исправление полей онбординга в user_progress
-- ===================================================================
-- Описание: Проверяет и исправляет тип данных для onboarding_completed и tour_completed
-- Дата: 2026-01-26
-- ===================================================================

-- Проверяем текущий тип данных полей
DO $$ 
DECLARE
    onboarding_type TEXT;
    tour_type TEXT;
BEGIN
    SELECT data_type INTO onboarding_type
    FROM information_schema.columns 
    WHERE table_name = 'user_progress' 
    AND column_name = 'onboarding_completed';
    
    SELECT data_type INTO tour_type
    FROM information_schema.columns 
    WHERE table_name = 'user_progress' 
    AND column_name = 'tour_completed';
    
    RAISE NOTICE 'Current type of onboarding_completed: %', onboarding_type;
    RAISE NOTICE 'Current type of tour_completed: %', tour_type;
    
    -- Если поля не существуют, создаем их
    IF onboarding_type IS NULL THEN
        ALTER TABLE user_progress 
        ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL;
        RAISE NOTICE 'Created onboarding_completed column';
    ELSIF onboarding_type != 'boolean' THEN
        -- Если тип неправильный, исправляем
        ALTER TABLE user_progress 
        ALTER COLUMN onboarding_completed TYPE BOOLEAN 
        USING CASE 
            WHEN onboarding_completed::text = 'true' OR onboarding_completed::text = 't' OR onboarding_completed::text = '1' THEN true
            WHEN onboarding_completed::text = 'false' OR onboarding_completed::text = 'f' OR onboarding_completed::text = '0' THEN false
            ELSE false
        END;
        ALTER TABLE user_progress 
        ALTER COLUMN onboarding_completed SET DEFAULT FALSE;
        ALTER TABLE user_progress 
        ALTER COLUMN onboarding_completed SET NOT NULL;
        RAISE NOTICE 'Fixed onboarding_completed column type to BOOLEAN';
    ELSE
        -- Убеждаемся что DEFAULT установлен
        ALTER TABLE user_progress 
        ALTER COLUMN onboarding_completed SET DEFAULT FALSE;
        -- Устанавливаем NOT NULL если поле может быть NULL
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_progress' 
            AND column_name = 'onboarding_completed'
            AND is_nullable = 'YES'
        ) THEN
            -- Обновляем NULL значения на FALSE
            UPDATE user_progress SET onboarding_completed = FALSE WHERE onboarding_completed IS NULL;
            ALTER TABLE user_progress 
            ALTER COLUMN onboarding_completed SET NOT NULL;
        END IF;
        RAISE NOTICE 'onboarding_completed column is correct';
    END IF;
    
    IF tour_type IS NULL THEN
        ALTER TABLE user_progress 
        ADD COLUMN tour_completed BOOLEAN DEFAULT FALSE NOT NULL;
        RAISE NOTICE 'Created tour_completed column';
    ELSIF tour_type != 'boolean' THEN
        -- Если тип неправильный, исправляем
        ALTER TABLE user_progress 
        ALTER COLUMN tour_completed TYPE BOOLEAN 
        USING CASE 
            WHEN tour_completed::text = 'true' OR tour_completed::text = 't' OR tour_completed::text = '1' THEN true
            WHEN tour_completed::text = 'false' OR tour_completed::text = 'f' OR tour_completed::text = '0' THEN false
            ELSE false
        END;
        ALTER TABLE user_progress 
        ALTER COLUMN tour_completed SET DEFAULT FALSE;
        ALTER TABLE user_progress 
        ALTER COLUMN tour_completed SET NOT NULL;
        RAISE NOTICE 'Fixed tour_completed column type to BOOLEAN';
    ELSE
        -- Убеждаемся что DEFAULT установлен
        ALTER TABLE user_progress 
        ALTER COLUMN tour_completed SET DEFAULT FALSE;
        -- Устанавливаем NOT NULL если поле может быть NULL
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_progress' 
            AND column_name = 'tour_completed'
            AND is_nullable = 'YES'
        ) THEN
            -- Обновляем NULL значения на FALSE
            UPDATE user_progress SET tour_completed = FALSE WHERE tour_completed IS NULL;
            ALTER TABLE user_progress 
            ALTER COLUMN tour_completed SET NOT NULL;
        END IF;
        RAISE NOTICE 'tour_completed column is correct';
    END IF;
END $$;

-- Проверяем и создаем поля для дат если их нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' 
        AND column_name = 'onboarding_completed_at'
    ) THEN
        ALTER TABLE user_progress 
        ADD COLUMN onboarding_completed_at TIMESTAMP NULL;
        RAISE NOTICE 'Created onboarding_completed_at column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' 
        AND column_name = 'tour_completed_at'
    ) THEN
        ALTER TABLE user_progress 
        ADD COLUMN tour_completed_at TIMESTAMP NULL;
        RAISE NOTICE 'Created tour_completed_at column';
    END IF;
END $$;

-- Выводим финальную информацию о схеме
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_progress' 
AND column_name IN ('onboarding_completed', 'tour_completed', 'onboarding_completed_at', 'tour_completed_at')
ORDER BY column_name;
