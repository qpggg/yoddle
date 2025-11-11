# 🔍 Диагностика ошибки "Ошибка анализа настроения"

## 📋 Проблема:

При вызове `/api/ai/analyze-mood` возвращается:
```json
{"success":false,"error":"Ошибка анализа настроения"}
```

## 🔧 Шаг 1: Проверка логов сервера

**Самое важное!** Логи покажут точную причину ошибки:

```bash
# Посмотреть последние 50 строк логов
pm2 logs server --lines 50

# Или в реальном времени
pm2 logs server --lines 0
```

**Что искать в логах:**
- `AI mood analysis error:` - детали ошибки
- `Claude API error` - проблемы с Claude API
- `password authentication failed` - проблемы с БД
- `relation "enter" does not exist` - отсутствует таблица
- `Key (user_id)=(1) is not present` - нет user_id = 1

---

## 🔧 Шаг 2: Проверка наличия user_id = 1 в таблице enter

Для Telegram пользователей используется фиксированный `user_id = 1`. Проверьте что он существует:

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
SELECT id, email, name FROM enter WHERE id = 1;
"
```

**Если записи нет - создайте:**

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
INSERT INTO enter (id, email, name, created_at) 
VALUES (1, 'telegram@yoddle.ru', 'Telegram Users', NOW())
ON CONFLICT (id) DO NOTHING;
"
```

---

## 🔧 Шаг 3: Проверка переменных окружения

Проверьте что все нужные переменные установлены:

```bash
# Проверка .env файла
cat .env | grep -E "CLAUDE_API_KEY|CLAUDE_BASE_URL|PG_CONNECTION_STRING"

# Или через pm2
pm2 env 0 | grep -E "CLAUDE_API_KEY|CLAUDE_BASE_URL|PG_CONNECTION_STRING"
```

**Нужные переменные:**
- `CLAUDE_API_KEY` - ключ API Claude (обязательно)
- `CLAUDE_BASE_URL` - URL прокси Cloudflare (опционально, если используете прокси)
- `PG_CONNECTION_STRING` - строка подключения к БД

---

## 🔧 Шаг 4: Проверка подключения к Claude API

Проверьте что Claude API доступен:

```bash
# Тест через curl (если есть CLAUDE_API_KEY)
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "test"}]
  }'
```

**Или через прокси (если используете Cloudflare):**

```bash
curl -X POST YOUR_CLAUDE_BASE_URL/messages \
  -H "x-api-key: YOUR_CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "test"}]
  }'
```

---

## 🔧 Шаг 5: Проверка таблиц БД

Убедитесь что все нужные таблицы существуют:

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('enter', 'ai_signals', 'ai_insights')
ORDER BY table_name;
"
```

**Если таблиц нет - создайте:**

```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -f ai_database_setup.sql
```

---

## 🔧 Шаг 6: Проверка подключения к БД из приложения

Проверьте что приложение может подключиться к БД:

```bash
# Тест через Node.js
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL
});
pool.query('SELECT NOW()').then(r => {
  console.log('✅ БД подключена:', r.rows[0]);
  process.exit(0);
}).catch(e => {
  console.error('❌ Ошибка БД:', e.message);
  process.exit(1);
});
"
```

---

## 🔧 Шаг 7: Полный тест с детальным логированием

Временно добавьте больше логов в код (или проверьте существующие):

```bash
# Проверьте что логи выводятся
pm2 logs server --lines 100 | grep -E "Telegram пользователь|AI mood analysis|Claude API"
```

---

## 🎯 Быстрая диагностика (все команды сразу):

```bash
#!/bin/bash

echo "🔍 1. Проверка логов..."
pm2 logs server --lines 20 --nostream

echo ""
echo "🔍 2. Проверка user_id = 1..."
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
SELECT id, email FROM enter WHERE id = 1;
"

echo ""
echo "🔍 3. Проверка переменных окружения..."
pm2 env 0 | grep -E "CLAUDE_API_KEY|CLAUDE_BASE_URL|PG_CONNECTION_STRING" | sed 's/=.*/=***/'

echo ""
echo "🔍 4. Проверка таблиц..."
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('enter', 'ai_signals', 'ai_insights');
"

echo ""
echo "🔍 5. Тест API..."
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{"mood": 8, "energy": 7, "stressLevel": 3, "userId": 896466896}' \
  2>&1 | head -20
```

---

## 🛠️ Частые проблемы и решения:

### Проблема 1: `user_id = 1 не существует в таблице enter`

**Решение:**
```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
INSERT INTO enter (id, email, name, created_at) 
VALUES (1, 'telegram@yoddle.ru', 'Telegram Users', NOW())
ON CONFLICT (id) DO NOTHING;
"
```

### Проблема 2: `CLAUDE_API_KEY не установлен`

**Решение:**
```bash
# Отредактируйте .env
nano .env

# Добавьте:
CLAUDE_API_KEY=your_key_here

# Перезапустите сервер
pm2 restart server
```

### Проблема 3: `Claude API недоступен`

**Решение:**
- Проверьте интернет соединение
- Проверьте что `CLAUDE_BASE_URL` правильный (если используете прокси)
- Проверьте что `CLAUDE_API_KEY` валидный

### Проблема 4: `Ошибка подключения к БД`

**Решение:**
```bash
# Проверьте строку подключения
echo $PG_CONNECTION_STRING

# Проверьте что БД доступна
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT 1;"
```

---

## 📝 После исправления:

1. Перезапустите сервер:
```bash
pm2 restart server
```

2. Проверьте логи:
```bash
pm2 logs server --lines 20
```

3. Протестируйте API:
```bash
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{"mood": 8, "energy": 7, "stressLevel": 3, "userId": 896466896}'
```

---

## 🆘 Если ничего не помогло:

Отправьте вывод этих команд:

```bash
# 1. Логи сервера
pm2 logs server --lines 50 --nostream

# 2. Проверка БД
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
SELECT id FROM enter WHERE id = 1;
SELECT COUNT(*) FROM ai_signals;
"

# 3. Переменные окружения (без значений)
pm2 env 0 | grep -E "CLAUDE|PG_CONNECTION|DATABASE" | sed 's/=.*/=***/'
```

