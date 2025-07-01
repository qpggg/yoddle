-- =====================================================
-- YODDLE NEWS SYSTEM FOR POSTGRESQL (SUPABASE)
-- =====================================================

-- Создание таблицы категорий новостей
CREATE TABLE IF NOT EXISTS news_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color_code VARCHAR(7) NOT NULL, -- HEX цвет для UI
    icon VARCHAR(50), -- иконка для категории
    sort_order INTEGER DEFAULT 0, -- порядок сортировки
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы новостей
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(500), -- краткое описание для превью
    category_id INTEGER NOT NULL REFERENCES news_categories(id) ON DELETE RESTRICT,
    author VARCHAR(100) NOT NULL,
    image_url VARCHAR(500), -- URL изображения
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE, -- для выделения важных новостей
    publish_date TIMESTAMP WITH TIME ZONE, -- дата публикации
    views_count INTEGER DEFAULT 0, -- счетчик просмотров
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category_id);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_news_publish_date ON news(publish_date);
CREATE INDEX IF NOT EXISTS idx_news_featured ON news(is_featured);
CREATE INDEX IF NOT EXISTS idx_news_status_date ON news(status, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_featured_date ON news(is_featured, publish_date DESC);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_news_categories_updated_at 
    BEFORE UPDATE ON news_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at 
    BEFORE UPDATE ON news 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- =====================================================

-- Вставка категорий новостей
INSERT INTO news_categories (name, description, color_code, icon, sort_order) VALUES
('Продукт', 'Обновления продукта и новые функции', '#750000', 'package', 1),
('Интеграция', 'Интеграции с внешними сервисами', '#2E8B57', 'link', 2),
('Геймификация', 'Обновления системы достижений и наград', '#FF6347', 'trophy', 3),
('Партнерства', 'Новые партнеры и сотрудничество', '#4682B4', 'handshake', 4),
('Анонс', 'Анонсы предстоящих функций', '#9370DB', 'megaphone', 5),
('Компания', 'Новости о компании и команде', '#FF8C00', 'building', 6)
ON CONFLICT (name) DO NOTHING;

-- Вставка тестовых новостей
INSERT INTO news (title, content, excerpt, category_id, author, status, is_featured, publish_date) 
SELECT 
    title, content, excerpt, 
    (SELECT id FROM news_categories WHERE name = category_name),
    author, status, is_featured, publish_date
FROM (VALUES
    -- Продукт
    (
        'Новая функция: ИИ-рекомендации льгот',
        'Мы запустили систему искусственного интеллекта, которая анализирует предпочтения сотрудников и предлагает персонализированные льготы. Система учитывает историю использования льгот, профиль сотрудника и его активность в системе.

Новые возможности:
• Персонализированные рекомендации на основе ИИ
• Анализ эффективности льгот для каждого сотрудника
• Автоматические уведомления о подходящих предложениях
• Интеллектуальная оптимизация бюджета на льготы

Теперь каждый сотрудник получает рекомендации, основанные на его уникальных потребностях и предпочтениях.',
        'Запущена ИИ-система для персонализированных рекомендаций льгот сотрудникам',
        'Продукт',
        'Команда Yoddle',
        'published',
        TRUE,
        '2024-12-19 10:00:00+00'::TIMESTAMP WITH TIME ZONE
    ),
    
    -- Интеграция
    (
        'Интеграция с государственными сервисами',
        'Yoddle теперь полностью интегрирован с порталом Госуслуги! Это революционное обновление позволяет оформлять многие льготы прямо через нашу платформу.

Доступные интеграции:
• Оформление больничных листов
• Подача заявлений на социальные льготы
• Получение справок и документов
• Запись к врачам через ОМС
• Оформление детских пособий

Больше никаких походов в офисы и очередей! Экономьте время и оформляйте документы в несколько кликов.',
        'Полная интеграция с Госуслугами для быстрого оформления льгот и документов',
        'Интеграция',
        'Отдел разработки',
        'published',
        FALSE,
        '2024-12-15 14:30:00+00'::TIMESTAMP WITH TIME ZONE
    ),
    
    -- Геймификация
    (
        'Gamification 2.0: Новые достижения и ранги',
        'Представляем обновленную систему достижений Yoddle! Теперь доступны новые ранги и эксклюзивные награды.

Новые ранги:
• HR Гуру - для экспертов по кадровому делу (от 2000 XP)
• Wellness Champion - для любителей здорового образа жизни (от 1500 XP)  
• Benefits Master - для активных пользователей льгот (от 1000 XP)
• Social Butterfly - для активных в корпоративных мероприятиях (от 800 XP)

Новые достижения:
• "Первопроходец" - первый в компании попробовал новую льготу
• "Наставник" - помог коллегам освоить систему
• "Эко-герой" - активно использует экологические льготы
• "Спортсмен года" - максимальное использование спортивных льгот

Каждое достижение приносит не только XP, но и реальные бонусы!',
        'Обновленная система достижений с новыми рангами и эксклюзивными наградами',
        'Геймификация',
        'Product Team',
        'published',
        FALSE,
        '2024-12-10 16:15:00+00'::TIMESTAMP WITH TIME ZONE
    ),
    
    -- Партнерства
    (
        'Wellness программы: +50 новых партнеров',
        'Мы значительно расширили сеть wellness партнеров! Теперь в каталоге доступно более 200 услуг для здоровья и красоты.

Новые партнеры:
• World Class - сеть премиум фитнес-клубов
• Dr.Loder - медицинские центры и диагностика  
• Санаторий "Подмосковье" - оздоровительные программы
• Beauty SPA - косметологические услуги
• Yoga Journal - студии йоги и медитации

Специальные предложения:
• Скидка 30% на годовые абонементы в фитнес-клубы
• Бесплатная консультация врача при первом визите
• Комплексные wellness программы со скидкой до 50%
• Корпоративные тарифы для команд от 10 человек

Заботьтесь о здоровье выгодно!',
        'Расширение wellness каталога: 50+ новых партнеров и эксклюзивные предложения',
        'Партнерства',
        'Отдел партнерств',
        'published',
        FALSE,
        '2024-12-05 11:20:00+00'::TIMESTAMP WITH TIME ZONE
    ),
    
    -- Анонс
    (
        'Мобильное приложение Yoddle скоро в App Store',
        'Разработка мобильного приложения Yoddle выходит на финишную прямую! Уже в январе 2025 года вы сможете управлять льготами прямо со смартфона.

Возможности мобильного приложения:
• Быстрый доступ к каталогу льгот
• Push-уведомления о новых предложениях  
• Отслеживание прогресса и достижений
• QR-коды для быстрого получения льгот
• Оффлайн режим для просмотра избранного

Beta-тестирование:
Мы ищем активных пользователей для участия в beta-тестировании! Регистрация уже открыта в личном кабинете. Участники получат:
• Ранний доступ к приложению
• Эксклюзивный статус "Beta Tester"  
• 500 бонусных XP
• Возможность влиять на финальный функционал

Следите за обновлениями!',
        'Анонс мобильного приложения Yoddle и запуск программы beta-тестирования',
        'Анонс',
        'Mobile Team',
        'published',
        TRUE,
        '2024-12-01 09:45:00+00'::TIMESTAMP WITH TIME ZONE
    ),
    
    -- Компания
    (
        'Команда Yoddle выросла до 25 человек',
        'Мы рады сообщить о значительном росте нашей команды! За последние 3 месяца к Yoddle присоединились 10 новых специалистов.

Новые участники команды:
• 3 разработчика (frontend, backend, mobile)
• 2 дизайнера (UI/UX, графический дизайн)
• 2 специалиста по продажам
• 1 маркетолог
• 1 аналитик данных  
• 1 специалист по партнерствам

Это позволит нам:
• Быстрее разрабатывать новые функции
• Улучшить качество пользовательского опыта
• Расширить географию присутствия
• Увеличить количество партнеров

Растем вместе с нашими пользователями!',
        'Команда Yoddle увеличилась до 25 специалистов для ускорения развития продукта',
        'Компания',
        'HR департамент',
        'published',
        FALSE,
        '2024-11-28 13:00:00+00'::TIMESTAMP WITH TIME ZONE
    )
) AS t(title, content, excerpt, category_name, author, status, is_featured, publish_date)
WHERE NOT EXISTS (SELECT 1 FROM news WHERE news.title = t.title);

-- =====================================================
-- СОЗДАНИЕ ПРЕДСТАВЛЕНИЙ ДЛЯ УДОБСТВА
-- =====================================================

-- Представление для получения новостей с категориями
CREATE OR REPLACE VIEW news_with_categories AS
SELECT 
    n.id,
    n.title,
    n.content,
    n.excerpt,
    n.author,
    n.image_url,
    n.status,
    n.is_featured,
    n.publish_date,
    n.views_count,
    n.created_at,
    n.updated_at,
    nc.name as category_name,
    nc.color_code as category_color,
    nc.icon as category_icon
FROM news n
JOIN news_categories nc ON n.category_id = nc.id
WHERE n.status = 'published'
ORDER BY n.is_featured DESC, n.publish_date DESC;

-- Представление для статистики по категориям
CREATE OR REPLACE VIEW category_stats AS
SELECT 
    nc.id,
    nc.name,
    nc.color_code,
    nc.icon,
    COALESCE(COUNT(n.id), 0) as news_count,
    COALESCE(SUM(n.views_count), 0) as total_views
FROM news_categories nc
LEFT JOIN news n ON nc.id = n.category_id AND n.status = 'published'
WHERE nc.is_active = TRUE
GROUP BY nc.id, nc.name, nc.color_code, nc.icon
ORDER BY nc.sort_order;

-- =====================================================
-- ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ НОВОСТЯМИ
-- =====================================================

-- Функция для увеличения счетчика просмотров
CREATE OR REPLACE FUNCTION increment_news_views(news_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE news 
    SET views_count = views_count + 1 
    WHERE id = news_id_param AND status = 'published';
END;
$$ LANGUAGE plpgsql;

-- Функция для получения новостей по категории
CREATE OR REPLACE FUNCTION get_news_by_category(category_name_param VARCHAR(100), limit_count INTEGER)
RETURNS TABLE(
    id INTEGER,
    title VARCHAR(255),
    content TEXT,
    excerpt VARCHAR(500),
    author VARCHAR(100),
    image_url VARCHAR(500),
    status VARCHAR(20),
    is_featured BOOLEAN,
    publish_date TIMESTAMP WITH TIME ZONE,
    views_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    category_name VARCHAR(100),
    category_color VARCHAR(7)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id, n.title, n.content, n.excerpt, n.author, n.image_url,
        n.status, n.is_featured, n.publish_date, n.views_count,
        n.created_at, n.updated_at,
        nc.name as category_name, nc.color_code as category_color
    FROM news n
    JOIN news_categories nc ON n.category_id = nc.id
    WHERE nc.name = category_name_param AND n.status = 'published'
    ORDER BY n.is_featured DESC, n.publish_date DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- НАСТРОЙКИ БЕЗОПАСНОСТИ RLS (Row Level Security)
-- =====================================================

-- Включаем RLS для таблиц (опционально, если нужны ограничения доступа)
-- ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Политики безопасности (примеры)
-- CREATE POLICY "Public read access for published news" ON news
--     FOR SELECT USING (status = 'published');

-- CREATE POLICY "Admin full access" ON news
--     FOR ALL USING (auth.role() = 'admin');

-- =====================================================
-- ПРИМЕР ЗАПРОСОВ ДЛЯ API
-- =====================================================

/*
-- Получить все опубликованные новости с категориями
SELECT * FROM news_with_categories LIMIT 10;

-- Получить новости определенной категории
SELECT * FROM get_news_by_category('Продукт', 5);

-- Получить статистику по категориям
SELECT * FROM category_stats;

-- Найти новости по ключевому слову (полнотекстовый поиск)
SELECT * FROM news_with_categories 
WHERE to_tsvector('russian', title || ' ' || content || ' ' || excerpt) @@ plainto_tsquery('russian', 'ИИ льготы');

-- Увеличить счетчик просмотров
SELECT increment_news_views(1);

-- Получить топ новостей по просмотрам
SELECT n.*, nc.name as category_name, nc.color_code 
FROM news n
JOIN news_categories nc ON n.category_id = nc.id
WHERE n.status = 'published'
ORDER BY n.views_count DESC
LIMIT 10;
*/ 