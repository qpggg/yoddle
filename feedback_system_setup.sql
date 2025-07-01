-- Создание таблицы отзывов сотрудников
-- Для PostgreSQL/Supabase

-- Создаем таблицу feedback для хранения отзывов
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Индекс для быстрого поиска по пользователю
    UNIQUE(user_id)
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- Добавляем комментарии к таблице и колонкам
COMMENT ON TABLE feedback IS 'Отзывы сотрудников о работе в компании';
COMMENT ON COLUMN feedback.id IS 'Уникальный идентификатор отзыва';
COMMENT ON COLUMN feedback.user_id IS 'ID пользователя (связь с таблицей users)';
COMMENT ON COLUMN feedback.rating IS 'Рейтинг от 1 до 5 звезд';
COMMENT ON COLUMN feedback.comment IS 'Текст отзыва';
COMMENT ON COLUMN feedback.created_at IS 'Дата и время создания отзыва';

-- Вставляем тестовые данные для демонстрации
INSERT INTO feedback (user_id, rating, comment, created_at) VALUES 
(
    'test-user-1', 
    5, 
    'Отличная компания! Хорошие условия работы, дружный коллектив и интересные проекты. Рекомендую всем!',
    NOW() - INTERVAL '2 days'
),
(
    'test-user-2', 
    4, 
    'В целом доволен работой. Есть возможности для профессионального роста, но хотелось бы больше гибкости в графике.',
    NOW() - INTERVAL '5 days'
),
(
    'test-user-3', 
    5, 
    'Прекрасная атмосфера в офисе! Руководство всегда поддерживает инициативы сотрудников. Благодарен за возможность работать здесь.',
    NOW() - INTERVAL '1 week'
),
(
    'test-user-4', 
    3, 
    'Средняя компания. Есть как плюсы, так и минусы. Зарплата выплачивается вовремя, но не хватает корпоративных мероприятий.',
    NOW() - INTERVAL '10 days'
),
(
    'test-user-5', 
    4, 
    'Хорошие льготы и социальные гарантии. Особенно понравилась программа медицинского страхования. Однако офис мог бы быть побольше.',
    NOW() - INTERVAL '2 weeks'
)
ON CONFLICT (user_id) DO NOTHING;

-- Создаем функцию для получения средней оценки
CREATE OR REPLACE FUNCTION get_average_rating()
RETURNS DECIMAL(3,2) AS $$
BEGIN
    RETURN (
        SELECT COALESCE(ROUND(AVG(rating), 2), 0)
        FROM feedback
    );
END;
$$ LANGUAGE plpgsql;

-- Создаем функцию для получения статистики отзывов
CREATE OR REPLACE FUNCTION get_feedback_stats()
RETURNS TABLE (
    total_feedback INTEGER,
    average_rating DECIMAL(3,2),
    rating_5_count INTEGER,
    rating_4_count INTEGER,
    rating_3_count INTEGER,
    rating_2_count INTEGER,
    rating_1_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_feedback,
        COALESCE(ROUND(AVG(f.rating), 2), 0) as average_rating,
        COUNT(CASE WHEN f.rating = 5 THEN 1 END)::INTEGER as rating_5_count,
        COUNT(CASE WHEN f.rating = 4 THEN 1 END)::INTEGER as rating_4_count,
        COUNT(CASE WHEN f.rating = 3 THEN 1 END)::INTEGER as rating_3_count,
        COUNT(CASE WHEN f.rating = 2 THEN 1 END)::INTEGER as rating_2_count,
        COUNT(CASE WHEN f.rating = 1 THEN 1 END)::INTEGER as rating_1_count
    FROM feedback f;
END;
$$ LANGUAGE plpgsql;

-- Создаем представление (view) для отзывов с информацией о пользователях
CREATE OR REPLACE VIEW feedback_with_users AS
SELECT 
    f.id,
    f.user_id,
    f.rating,
    f.comment,
    f.created_at,
    u.name as user_name,
    u.email as user_email,
    u.position,
    u.avatar,
    u.created_at as user_created_at
FROM feedback f
LEFT JOIN users u ON f.user_id = u.id
ORDER BY f.created_at DESC;

-- Добавляем RLS (Row Level Security) политики для безопасности
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут читать все отзывы
CREATE POLICY "Пользователи могут читать все отзывы" ON feedback
    FOR SELECT USING (true);

-- Политика: пользователи могут создавать только свои отзывы
CREATE POLICY "Пользователи могут создавать только свои отзывы" ON feedback
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Политика: пользователи могут обновлять только свои отзывы
CREATE POLICY "Пользователи могут обновлять только свои отзывы" ON feedback
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Политика: пользователи могут удалять только свои отзывы
CREATE POLICY "Пользователи могут удалять только свои отзывы" ON feedback
    FOR DELETE USING (auth.uid()::text = user_id);

-- Выводим информацию о созданных объектах
SELECT 'Таблица feedback создана успешно!' as status;
SELECT 'Тестовые данные добавлены!' as status;
SELECT 'Функции для статистики созданы!' as status;
SELECT 'Представление feedback_with_users создано!' as status;
SELECT 'Политики безопасности настроены!' as status;

-- Проверяем созданные данные
SELECT 
    'Общая статистика:' as info,
    (SELECT get_average_rating()) as average_rating,
    COUNT(*) as total_feedback
FROM feedback;

-- Показываем последние отзывы
SELECT 
    id,
    rating,
    LEFT(comment, 50) || '...' as comment_preview,
    created_at
FROM feedback 
ORDER BY created_at DESC 
LIMIT 5; 