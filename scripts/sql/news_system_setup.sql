-- =====================================================
-- YODDLE NEWS SYSTEM DATABASE SETUP
-- =====================================================

-- Создание таблицы категорий новостей
CREATE TABLE IF NOT EXISTS news_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color_code VARCHAR(7) NOT NULL, -- HEX цвет для UI
    icon VARCHAR(50), -- иконка для категории
    sort_order INT DEFAULT 0, -- порядок сортировки
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Создание таблицы новостей
CREATE TABLE IF NOT EXISTS news (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(500), -- краткое описание для превью
    category_id INT NOT NULL,
    author VARCHAR(100) NOT NULL,
    image_url VARCHAR(500), -- URL изображения
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE, -- для выделения важных новостей
    publish_date DATETIME, -- дата публикации
    views_count INT DEFAULT 0, -- счетчик просмотров
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Внешний ключ на категории
    FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE RESTRICT,
    
    -- Индексы для оптимизации
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_publish_date (publish_date),
    INDEX idx_featured (is_featured)
);

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
('Компания', 'Новости о компании и команде', '#FF8C00', 'building', 6);

-- Вставка тестовых новостей
INSERT INTO news (title, content, excerpt, category_id, author, status, is_featured, publish_date) VALUES

-- Продукт
('Новая функция: ИИ-рекомендации льгот', 
'Мы запустили систему искусственного интеллекта, которая анализирует предпочтения сотрудников и предлагает персонализированные льготы. Система учитывает историю использования льгот, профиль сотрудника и его активность в системе.

Новые возможности:
• Персонализированные рекомендации на основе ИИ
• Анализ эффективности льгот для каждого сотрудника
• Автоматические уведомления о подходящих предложениях
• Интеллектуальная оптимизация бюджета на льготы

Теперь каждый сотрудник получает рекомендации, основанные на его уникальных потребностях и предпочтениях.', 
'Запущена ИИ-система для персонализированных рекомендаций льгот сотрудникам', 
1, 'Команда Yoddle', 'published', TRUE, '2024-12-19 10:00:00'),

-- Интеграция  
('Интеграция с государственными сервисами',
'Yoddle теперь полностью интегрирован с порталом Госуслуги! Это революционное обновление позволяет оформлять многие льготы прямо через нашу платформу.

Доступные интеграции:
• Оформление больничных листов
• Подача заявлений на социальные льготы
• Получение справок и документов
• Запись к врачам через ОМС
• Оформление детских пособий

Больше никаких походов в офисы и очередей! Экономьте время и оформляйте документы в несколько кликов.',
'Полная интеграция с Госуслугами для быстрого оформления льгот и документов',
2, 'Отдел разработки', 'published', FALSE, '2024-12-15 14:30:00'),

-- Геймификация
('Gamification 2.0: Новые достижения и ранги',
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
3, 'Product Team', 'published', FALSE, '2024-12-10 16:15:00'),

-- Партнерства
('Wellness программы: +50 новых партнеров',
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
4, 'Отдел партнерств', 'published', FALSE, '2024-12-05 11:20:00'),

-- Анонс
('Мобильное приложение Yoddle скоро в App Store',
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
5, 'Mobile Team', 'published', TRUE, '2024-12-01 09:45:00'),

-- Компания
('Команда Yoddle выросла до 25 человек',
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
6, 'HR департамент', 'published', FALSE, '2024-11-28 13:00:00');

-- =====================================================
-- СОЗДАНИЕ API ПРЕДСТАВЛЕНИЙ ДЛЯ УДОБСТВА
-- =====================================================

-- Представление для получения новостей с категориями
CREATE VIEW news_with_categories AS
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
CREATE VIEW category_stats AS
SELECT 
    nc.id,
    nc.name,
    nc.color_code,
    nc.icon,
    COUNT(n.id) as news_count,
    SUM(n.views_count) as total_views
FROM news_categories nc
LEFT JOIN news n ON nc.id = n.category_id AND n.status = 'published'
WHERE nc.is_active = TRUE
GROUP BY nc.id, nc.name, nc.color_code, nc.icon
ORDER BY nc.sort_order;

-- =====================================================
-- ПРОЦЕДУРЫ ДЛЯ УПРАВЛЕНИЯ НОВОСТЯМИ
-- =====================================================

DELIMITER //

-- Процедура для увеличения счетчика просмотров
CREATE PROCEDURE IncrementNewsViews(IN news_id INT)
BEGIN
    UPDATE news 
    SET views_count = views_count + 1 
    WHERE id = news_id AND status = 'published';
END //

-- Процедура для получения новостей по категории
CREATE PROCEDURE GetNewsByCategory(IN category_name VARCHAR(100), IN limit_count INT)
BEGIN
    SELECT n.*, nc.name as category_name, nc.color_code as category_color
    FROM news n
    JOIN news_categories nc ON n.category_id = nc.id
    WHERE nc.name = category_name AND n.status = 'published'
    ORDER BY n.is_featured DESC, n.publish_date DESC
    LIMIT limit_count;
END //

DELIMITER ;

-- =====================================================
-- ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
-- =====================================================

-- Составной индекс для частых запросов
CREATE INDEX idx_news_status_date ON news(status, publish_date DESC);
CREATE INDEX idx_news_featured_date ON news(is_featured, publish_date DESC);

-- Полнотекстовый поиск
ALTER TABLE news ADD FULLTEXT(title, content, excerpt);

-- =====================================================
-- ПРИМЕР ЗАПРОСОВ ДЛЯ API
-- =====================================================

/*
-- Получить все опубликованные новости с категориями
SELECT * FROM news_with_categories LIMIT 10;

-- Получить новости определенной категории
CALL GetNewsByCategory('Продукт', 5);

-- Получить статистику по категориям
SELECT * FROM category_stats;

-- Найти новости по ключевому слову
SELECT * FROM news 
WHERE MATCH(title, content, excerpt) AGAINST('ИИ льготы' IN NATURAL LANGUAGE MODE)
AND status = 'published';

-- Увеличить счетчик просмотров
CALL IncrementNewsViews(1);
*/

-- =====================================================
-- НАСТРОЙКИ БЕЗОПАСНОСТИ
-- =====================================================

-- Создание пользователя для API (опционально)
-- CREATE USER 'yoddle_news_api'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE ON yoddle.news TO 'yoddle_news_api'@'localhost';
-- GRANT SELECT ON yoddle.news_categories TO 'yoddle_news_api'@'localhost';
-- GRANT EXECUTE ON PROCEDURE yoddle.IncrementNewsViews TO 'yoddle_news_api'@'localhost';
-- GRANT EXECUTE ON PROCEDURE yoddle.GetNewsByCategory TO 'yoddle_news_api'@'localhost'; 