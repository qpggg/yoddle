# 🔍 Быстрая диагностика ошибки AI API

## ⚡ Первое что нужно сделать - проверить логи:

```bash
pm2 logs server --lines 50
```

Это покажет точную причину ошибки. Ищите строки с `AI mood analysis error:`.

---

## 🔧 Возможные причины и решения:

### 1. Нет user_id = 1 в таблице enter

**Проверка:**
```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT id FROM enter WHERE id = 1;"
```

**Если пусто - создайте:**
```bash
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "
INSERT INTO enter (id, email, name, created_at) 
VALUES (1, 'telegram@yoddle.ru', 'Telegram Users', NOW())
ON CONFLICT (id) DO NOTHING;
"
```

### 2. Нет CLAUDE_API_KEY

**Проверка:**
```bash
pm2 env 0 | grep CLAUDE_API_KEY
```

**Если пусто - добавьте в .env:**
```bash
nano .env
# Добавьте: CLAUDE_API_KEY=your_key_here
pm2 restart server
```

### 3. Проблема с Claude API

**Проверьте логи** - там будет детальная ошибка от Claude API.

---

## 📋 Полная диагностика (скопируйте и выполните):

```bash
echo "=== 1. Логи сервера ==="
pm2 logs server --lines 30 --nostream | grep -A 5 "AI mood analysis error"

echo ""
echo "=== 2. Проверка user_id = 1 ==="
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT id, email FROM enter WHERE id = 1;"

echo ""
echo "=== 3. Проверка переменных окружения ==="
pm2 env 0 | grep -E "CLAUDE_API_KEY|CLAUDE_BASE_URL" | sed 's/=.*/=***/'

echo ""
echo "=== 4. Тест API ==="
curl -X POST http://localhost:3000/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -d '{"mood": 8, "energy": 7, "stressLevel": 3, "userId": 896466896}' \
  2>&1
```

---

**После выполнения команд - отправьте вывод, особенно логи сервера!**

