# ✅ Полные команды для тестирования API

## 🔍 Health Endpoint - что это?

**`/health`** - это простой endpoint для проверки что сервер работает.

**Что он делает:**
- Проверяет что сервер запущен и отвечает
- Возвращает статус, время и время работы (uptime)
- Используется для мониторинга и проверки доступности

**Пример ответа:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-11T19:47:39.459Z",
  "uptime": 12345.67
}
```

**Использование:**
- Мониторинг сервера
- Проверка что сервер запущен перед тестами
- Health checks для балансировщиков нагрузки

---

## 📝 Полный curl запрос для ИИ API

### ❌ Неполный (как вы показали):

```bash
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 8,
    "energy": 7,
    "stressLevel": 3
```

**Проблемы:**
- Нет закрывающей скобки `}`
- Нет `userId` (обязательный параметр)
- Нет закрывающей кавычки

### ✅ Полный правильный запрос:

#### Для Telegram пользователя:

```bash
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 8,
    "energy": 7,
    "stressLevel": 3,
    "notes": "",
    "activities": [],
    "userId": 896466896
  }'
```

#### Для обычного пользователя сайта:

```bash
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 8,
    "energy": 7,
    "stressLevel": 3,
    "notes": "Хороший день",
    "activities": ["работа", "спорт"],
    "userId": 1
  }'
```

---

## 📋 Все обязательные параметры:

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `mood` | number | ✅ Да | Настроение от 1 до 10 |
| `energy` | number | ✅ Да | Энергия от 1 до 10 |
| `stressLevel` | number | ✅ Да | Стресс от 1 до 10 |
| `notes` | string | ❌ Нет | Заметки пользователя |
| `activities` | array | ❌ Нет | Массив активностей |
| `userId` | number | ✅ Да | ID пользователя (или telegram_id) |

---

## 🧪 Примеры тестирования:

### 1. Проверка health:

```bash
curl http://localhost:3000/health
```

**Ожидаемый ответ:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-11T20:00:00.000Z",
  "uptime": 3600.5
}
```

### 2. Тест ИИ API (минимальный):

```bash
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{"mood": 8, "energy": 7, "stressLevel": 3, "userId": 896466896}'
```

### 3. Тест ИИ API (полный):

```bash
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 10,
    "energy": 10,
    "stressLevel": 2,
    "notes": "Отличный день!",
    "activities": ["работа", "спорт"],
    "userId": 896466896
  }'
```

### 4. Красивый вывод (с jq):

```bash
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{"mood": 8, "energy": 7, "stressLevel": 3, "userId": 896466896}' \
  | jq .
```

---

## 🔧 Проверка работы через команды:

### Полный тест (последовательность):

```bash
# 1. Проверка health
echo "🔍 Тест 1: Health check"
curl -s http://localhost:3000/health | jq .

# 2. Тест ИИ API
echo ""
echo "🔍 Тест 2: ИИ API"
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 8,
    "energy": 7,
    "stressLevel": 3,
    "notes": "Тест",
    "activities": [],
    "userId": 896466896
  }' | jq .

# 3. Проверка сохранения в БД
echo ""
echo "🔍 Тест 3: Проверка БД"
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
SELECT 
  id, 
  user_id, 
  data->>'telegram_id' as telegram_id,
  data->>'mood' as mood,
  timestamp 
FROM ai_signals 
ORDER BY timestamp DESC 
LIMIT 3;
"
```

---

## ⚠️ Частые ошибки:

### Ошибка: `Unexpected token } in JSON`
**Причина:** Неправильный JSON (лишние запятые, незакрытые скобки)
**Решение:** Проверьте синтаксис JSON

### Ошибка: `userId is required`
**Причина:** Не указан `userId`
**Решение:** Добавьте `"userId": 896466896` в запрос

### Ошибка: `Connection refused`
**Причина:** Сервер не запущен
**Решение:** `pm2 start server` или `pm2 restart server`

### Ошибка: `500 Internal Server Error`
**Причина:** Ошибка на сервере
**Решение:** Проверьте логи `pm2 logs server --lines 50`

