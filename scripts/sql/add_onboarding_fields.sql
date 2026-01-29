-- ===================================================================
-- МИГРАЦИЯ: Добавление полей онбординга в user_progress
-- ===================================================================
-- Описание: Добавляет поля для отслеживания статуса онбординга
-- и приветственного тура пользователя
-- Дата: 2026-01-23
-- ===================================================================

-- Добавление поля onboarding_completed (статус завершения онбординга QuickStartCard)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' 
        AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE user_progress 
        ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN user_progress.onboarding_completed IS 
        'Статус завершения онбординга (QuickStartCard). TRUE - пользователь завершил все шаги онбординга';
    END IF;
END $$;

-- Добавление поля tour_completed (статус завершения Welcome Tour)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' 
        AND column_name = 'tour_completed'
    ) THEN
        ALTER TABLE user_progress 
        ADD COLUMN tour_completed BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN user_progress.tour_completed IS 
        'Статус завершения приветственного тура (Welcome Tour). TRUE - пользователь просмотрел тур';
    END IF;
END $$;

-- Добавление поля onboarding_completed_at (дата завершения онбординга)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' 
        AND column_name = 'onboarding_completed_at'
    ) THEN
        ALTER TABLE user_progress 
        ADD COLUMN onboarding_completed_at TIMESTAMP NULL;
        
        COMMENT ON COLUMN user_progress.onboarding_completed_at IS 
        'Дата и время завершения онбординга';
    END IF;
END $$;

-- Добавление поля tour_completed_at (дата завершения тура)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' 
        AND column_name = 'tour_completed_at'
    ) THEN
        ALTER TABLE user_progress 
        ADD COLUMN tour_completed_at TIMESTAMP NULL;
        
        COMMENT ON COLUMN user_progress.tour_completed_at IS 
        'Дата и время завершения приветственного тура';
    END IF;
END $$;

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_user_progress_onboarding_completed 
ON user_progress(onboarding_completed) 
WHERE onboarding_completed = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_progress_tour_completed 
ON user_progress(tour_completed) 
WHERE tour_completed = TRUE;

-- Вывод информации о выполненной миграции
DO $$ 
BEGIN
    RAISE NOTICE 'Миграция завершена: добавлены поля онбординга в user_progress';
    RAISE NOTICE 'Добавленные поля: onboarding_completed, tour_completed, onboarding_completed_at, tour_completed_at';
END $$;
