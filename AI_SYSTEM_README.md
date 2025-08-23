# 🤖 AI Система Продуктивности Yoddle

## 📋 Обзор

AI система продуктивности Yoddle использует Claude API для анализа настроения, активности и генерации персональных рекомендаций. Система накапливает данные о пользователе и становится умнее с течением времени.

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
npm install @anthropic-ai/sdk
```

### 2. Настройка переменных окружения
Скопируйте `env.example` в `.env` и заполните:
```bash
# Claude API
CLAUDE_API_KEY=your_claude_api_key_here

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/yoddle_db
```

### 3. Создание базы данных
```bash
psql -d yoddle_db -f ai_database_setup.sql
```

### 4. Запуск сервера
```bash
npm run dev:server
```

## 🔧 API Endpoints

### POST /api/ai/analyze-mood
Анализ настроения пользователя с AI рекомендациями.

**Request Body:**
```json
{
  "mood": 8,
  "activities": ["работа", "спорт"],
  "notes": "Хороший день",
  "stressLevel": 3
}
```

**Response:**
```json
{
  "success": true,
  "analysis": "AI анализ настроения...",
  "recommendations": ["Рекомендация 1", "Рекомендация 2"],
  "moodTrend": "улучшается"
}
```

### POST /api/ai/log-activity
Логирование активности с AI обратной связью.

**Request Body:**
```json
{
  "activity": "Завершение проекта",
  "category": "работа",
  "duration": 120,
  "success": true,
  "notes": "Проект сдан в срок"
}
```

### GET /api/ai/insights/:userId
Получение персональных AI инсайтов пользователя.

### GET /api/ai/recommendations
Получение персонализированных рекомендаций.

### POST /api/ai/generate-daily-insight
Генерация еженедельного AI инсайта.

## 🗄️ Структура базы данных

### ai_signals
Сигналы от пользователей (настроение, активность, стресс).
```sql
CREATE TABLE ai_signals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50), -- mood, activity, stress, goal, achievement
    data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE
);
```

### ai_insights
AI инсайты и анализ.
```sql
CREATE TABLE ai_insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(100),
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
);
```

### ai_recommendations
AI рекомендации и советы.
```sql
CREATE TABLE ai_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    category VARCHAR(100),
    message TEXT,
    priority VARCHAR(20), -- low, medium, high, urgent
    action_taken BOOLEAN DEFAULT FALSE
);
```

### ai_user_preferences
Настройки AI для каждого пользователя.
```sql
CREATE TABLE ai_user_preferences (
    user_id INTEGER UNIQUE REFERENCES users(id),
    analysis_frequency VARCHAR(20), -- hourly, daily, weekly, monthly
    privacy_level VARCHAR(20), -- minimal, standard, detailed
    ai_personality VARCHAR(50), -- supportive, motivational, analytical, friendly
    notification_preferences JSONB
);
```

## 🧠 AI Модели и промпты

### Анализ настроения
Система анализирует:
- Текущее настроение (1-10)
- Активности за день
- Уровень стресса
- Историю настроения за неделю

**Промпт:**
```
Поддерживающе проанализируй настроение пользователя и дай персональные рекомендации:

Текущее настроение: 7/10
Активности: работа, спорт, чтение
Заметки: Хороший день, но устал
Уровень стресса: 4/10

История настроения (последние 7 дней): 6, 8, 7, 9, 6, 7, 7

Дай:
1. Краткий анализ текущего состояния (2-3 предложения)
2. 3 конкретных рекомендации для улучшения настроения
3. Прогноз на завтра с учетом паттернов
4. Мотивационное сообщение

Тон: Поддерживающе, дружелюбный, поддерживающий. Ответ на русском языке.
```

### Еженедельный инсайт
Анализ паттернов за неделю с рекомендациями.

### Анализ активности
Мотивационная обратная связь для каждой активности.

## ⚙️ Настройка AI

### Частота анализа
- **hourly**: Каждый час
- **daily**: Ежедневно (по умолчанию)
- **weekly**: Еженедельно
- **monthly**: Ежемесячно

### Уровень приватности
- **minimal**: Только базовые данные
- **standard**: Стандартный анализ (по умолчанию)
- **detailed**: Детальный анализ

### Личность AI
- **supportive**: Поддерживающий (по умолчанию)
- **motivational**: Мотивационный
- **analytical**: Аналитический
- **friendly**: Дружелюбный

## 🧪 Тестирование

### Запуск тестов
```bash
node test_ai_system.js
```

### Проверка endpoints
```bash
# Тест анализа настроения
curl -X POST http://localhost:3001/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"mood": 8, "activities": ["работа"], "notes": "Тест", "stressLevel": 3}'
```

## 📊 Мониторинг и метрики

### AI метрики
- Количество запросов к API
- Время ответа AI
- Качество рекомендаций
- Пользовательская обратная связь

### Логирование
```javascript
// Включение логирования AI запросов
AI_LOG_REQUESTS=true
LOG_LEVEL=info
```

## 🔒 Безопасность

### Аутентификация
Все AI endpoints требуют JWT токен в заголовке `Authorization`.

### Приватность данных
- Данные пользователей изолированы
- Настройки приватности контролируются пользователем
- Логи не содержат персональных данных

### Rate Limiting
```javascript
AI_RATE_LIMIT_WINDOW=900000 // 15 минут
AI_RATE_LIMIT_MAX_REQUESTS=100 // Максимум запросов
```

## 🚀 Производительность

### Оптимизация
- Индексы на часто используемых полях
- Кэширование AI ответов
- Асинхронная обработка

### Масштабирование
- Поддержка до 20,000 пользователей
- Гибридный подход (Haiku + Sonnet)
- Очереди для тяжелых задач

## 🐛 Устранение неполадок

### Частые ошибки

#### 1. "CLAUDE_API_KEY not set"
```bash
# Проверьте .env файл
echo $CLAUDE_API_KEY
```

#### 2. "Database connection failed"
```bash
# Проверьте подключение к БД
psql -d yoddle_db -c "SELECT 1"
```

#### 3. "AI model not available"
```bash
# Проверьте доступность Claude API
curl -H "x-api-key: YOUR_KEY" https://api.anthropic.com/v1/models
```

### Логи
```bash
# Просмотр логов сервера
npm run dev:server

# Просмотр AI логов
grep "AI" server.log
```

## 📚 Дополнительные ресурсы

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Claude Pricing](https://www.anthropic.com/pricing)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Express.js Middleware](https://expressjs.com/en/guide/using-middleware.html)

## 🤝 Поддержка

При возникновении проблем:
1. Проверьте логи сервера
2. Убедитесь в корректности настроек
3. Проверьте доступность Claude API
4. Создайте issue в репозитории

---

**Версия**: 1.0.0  
**Дата**: 20.12.2024  
**Автор**: Yoddle Team
