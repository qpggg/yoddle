-- Создание таблицы льгот
CREATE TABLE IF NOT EXISTS benefits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы пользовательских льгот
CREATE TABLE IF NOT EXISTS user_benefits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    benefit_id INTEGER NOT NULL REFERENCES benefits(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, benefit_id)
);

-- Добавление данных о льготах
INSERT INTO benefits (name, description, category) VALUES
('Льготы на проезд', 'Скидки на общественный транспорт для пенсионеров и инвалидов', 'Транспорт'),
('Льготы на лекарства', 'Бесплатные или льготные лекарства по рецепту врача', 'Здравоохранение'),
('Льготы на ЖКХ', 'Скидки на оплату коммунальных услуг', 'ЖКХ'),
('Льготы на образование', 'Бесплатное или льготное образование для детей', 'Образование'),
('Льготы на отдых', 'Скидки на санаторно-курортное лечение', 'Отдых'),
('Льготы на налоги', 'Налоговые льготы для определенных категорий граждан', 'Налоги'),
('Льготы на связь', 'Скидки на услуги связи для пенсионеров', 'Связь'),
('Льготы на культуру', 'Бесплатное посещение музеев и театров', 'Культура'),
('Льготы на спорт', 'Бесплатные занятия спортом для детей и пенсионеров', 'Спорт'),
('Льготы на питание', 'Бесплатное питание в школах для детей из малообеспеченных семей', 'Питание'),
('Льготы на протезирование', 'Бесплатное зубное протезирование для пенсионеров', 'Здравоохранение'),
('Льготы на похороны', 'Компенсация расходов на погребение', 'Социальная поддержка');

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_user_benefits_user_id ON user_benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_benefits_benefit_id ON user_benefits(benefit_id);
CREATE INDEX IF NOT EXISTS idx_benefits_category ON benefits(category); 