# 🚀 НАСТРОЙКА ЛОКАЛЬНОЙ БД ДЛЯ РАЗРАБОТКИ

## 📋 Что это даст:
- ✅ **Быстрая разработка** (50-100ms вместо 800ms)
- ✅ **Независимость от интернета**
- ✅ **Безопасность** (данные локально)
- ✅ **Простота тестирования**

## 🔧 Шаги настройки:

### 1. Установить PostgreSQL
```bash
# Windows (через chocolatey)
choco install postgresql

# Или скачать с официального сайта
# https://www.postgresql.org/download/windows/
```

### 2. Создать БД
```sql
CREATE DATABASE yoddle_dev;
CREATE USER yoddle_user WITH PASSWORD 'yoddle123';
GRANT ALL PRIVILEGES ON DATABASE yoddle_dev TO yoddle_user;
```

### 3. Настроить .env
```env
# Локальная разработка
PG_CONNECTION_STRING=postgresql://yoddle_user:yoddle123@localhost:5432/yoddle_dev

# Продакшн (закомментировать)
# PG_CONNECTION_STRING=postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres
```

### 4. Синхронизировать схему
```bash
# Скопировать схему из Supabase
npm run sync-schema
```

## 🎯 Результат:
- **Вход**: 50-100ms (вместо 1.6 секунды)
- **Тесты**: мгновенные
- **Разработка**: без задержек

## 🔄 Синхронизация с продакшн:
```bash
# Экспорт данных из Supabase
npm run export-data

# Импорт в локальную БД
npm run import-data
```

**Хотите настроить локальную БД?** 🚀 