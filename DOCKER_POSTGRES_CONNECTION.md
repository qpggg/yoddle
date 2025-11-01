# 🔧 ПОДКЛЮЧЕНИЕ К POSTGRESQL В DOCKER КОНТЕЙНЕРЕ

## Проблема: роль "postgres" не существует

В вашем контейнере PostgreSQL может быть настроен другой пользователь или использоваться другая аутентификация.

## Решения:

### Вариант 1: Подключение через порт хоста (6543)

```bash
# Подключитесь с вашего компьютера через порт 6543
psql -h localhost -p 6543 -U postgres -d yoddle_db

# Если запрашивает пароль, попробуйте стандартные:
# - postgres
# - password
# - пустой пароль
```

### Вариант 2: Использование pg_dump через порт хоста

```bash
# Экспорт БД через порт хоста (6543)
pg_dump -h localhost -p 6543 -U postgres -d yoddle_db > backup.sql

# Если нужно указать пароль
PGPASSWORD=postgres pg_dump -h localhost -p 6543 -U postgres -d yoddle_db > backup.sql
```

### Вариант 3: Создание пользователя postgres в контейнере

```bash
# Подключитесь к контейнеру как root
docker exec -it --user root yoddle-pg bash

# Внутри контейнера создайте пользователя postgres
su - postgres
psql
CREATE USER postgres WITH SUPERUSER PASSWORD 'postgres';
\q
exit
exit
```

### Вариант 4: Подключение через TCP с хоста

```bash
# Найдите пользователя из строки подключения вашего приложения
# Проверьте .env файл или переменные окружения

# Используйте строку подключения из .env
# Например: postgresql://user:password@localhost:6543/database

# Экспорт через pg_dump с полной строкой подключения
pg_dump "postgresql://user:password@localhost:6543/yoddle_db" > backup.sql
```

### Вариант 5: Проверка через приложение

```bash
# Поскольку ваше приложение работает, используйте его строку подключения
# Проверьте .env файл или переменные окружения приложения

# Затем используйте те же параметры для экспорта
```

## Рекомендуемый способ:

1. **Найдите строку подключения в вашем приложении:**
   - Проверьте `.env` файл в проекте
   - Или переменные окружения Docker контейнера `yoddle1-app-1`

2. **Используйте те же параметры для экспорта:**

```bash
# Пример с параметрами из .env
pg_dump -h localhost -p 6543 -U ваш_пользователь -d yoddle_db > backup.sql
```

## Быстрая проверка подключения:

```bash
# Попробуйте разные варианты:
psql -h localhost -p 6543 -U postgres -d yoddle_db
psql -h localhost -p 6543 -U yoddle_user -d yoddle_db
psql -h localhost -p 6543 -U postgres -d postgres
```

Если ни один вариант не работает, проверьте логи контейнера для понимания, какой пользователь был создан при инициализации.

