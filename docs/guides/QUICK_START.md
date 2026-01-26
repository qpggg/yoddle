# 🚀 Быстрый старт локальной разработки

## 1️⃣ Создайте файл `.env`

```bash
cp .env.example .env
```

## 2️⃣ Настройте подключение к БД

Откройте `.env` и укажите строку подключения к вашей удаленной БД:

```env
PG_CONNECTION_STRING=postgresql://username:password@host:port/database
```

**Для Supabase:**
```env
PG_CONNECTION_STRING=postgresql://postgres.xxxxx:password@aws-0-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require
```

## 3️⃣ Добавьте API ключи

```env
CLAUDE_API_KEY=your_claude_api_key
RESEND_API_KEY=your_resend_api_key
JWT_SECRET=your_jwt_secret
```

## 4️⃣ Проверьте подключение

```bash
npm run check-db-connection
```

## 5️⃣ Запустите проект

**Терминал 1 (фронтенд):**
```bash
npm run dev
```

**Терминал 2 (бэкенд):**
```bash
npm run dev:server
```

## ✅ Готово!

- Фронтенд: http://localhost:5173
- Бэкенд: http://localhost:3001

---

📚 **Подробная документация:** [docs/НАСТРОЙКА_ЛОКАЛЬНОЙ_РАЗРАБОТКИ.md](docs/НАСТРОЙКА_ЛОКАЛЬНОЙ_РАЗРАБОТКИ.md)
