# 🚀 БЫСТРЫЙ ПЕРЕНОС БД С DOCKER НА СЕРВЕР

## ⚡ Быстрый способ (если БД уже работает на сервере)

### Шаг 1: Экспорт из Docker (локально)

```bash
# Найдите контейнер PostgreSQL
docker ps | grep postgres

# Экспорт БД (замените CONTAINER_NAME)
docker exec -t CONTAINER_NAME pg_dump -U postgres -d yoddle_db > backup.sql

# ИЛИ если PostgreSQL локально:
pg_dump -U postgres -d yoddle_db > backup.sql
```

### Шаг 2: Загрузка на сервер

```bash
# Загрузите файл на сервер
scp backup.sql root@your_server_ip:/tmp/
```

### Шаг 3: Импорт на сервере

```bash
# Подключитесь к серверу
ssh root@your_server_ip

# Импортируйте БД
sudo -u postgres psql yoddle_db < /tmp/backup.sql

# ИЛИ через пользователя yoddle_user:
psql -U yoddle_user -d yoddle_db -h localhost -f /tmp/backup.sql
```

### Шаг 4: Проверка работоспособности

```bash
# Запустите скрипт проверки
psql -U yoddle_user -d yoddle_db -h localhost -f check_database_health.sql

# ИЛИ быстрая проверка:
psql -U yoddle_user -d yoddle_db -h localhost -c "SELECT COUNT(*) FROM enter;"
```

---

## 🔍 Проверка БД перед переносом

### Быстрая проверка (локально в Docker):

```bash
# Подключитесь к БД в Docker
docker exec -it CONTAINER_NAME psql -U postgres -d yoddle_db

# Выполните проверочные запросы:
SELECT COUNT(*) FROM enter;
SELECT COUNT(*) FROM benefits;
SELECT COUNT(*) FROM telegram_leads;
\q
```

### Проверка после переноса (на сервере):

```bash
# Подключитесь к БД на сервере
psql -U yoddle_user -d yoddle_db -h localhost

# Выполните проверочные запросы:
SELECT COUNT(*) FROM enter;
SELECT COUNT(*) FROM benefits;
SELECT COUNT(*) FROM telegram_leads;
\q
```

---

## 📊 Использование скрипта проверки

```bash
# На сервере, после импорта БД:
cd /root/yoddle
psql -U yoddle_user -d yoddle_db -h localhost -f check_database_health.sql

# Скрипт покажет:
# - Версию PostgreSQL
# - Список всех таблиц
# - Количество записей в каждой таблице
# - Статистику по пользователям, льготам, лидам
# - Размер БД
# - Примеры данных
```

---

## 🎯 Минимальный чеклист быстрого переноса

- [ ] БД экспортирована из Docker → `backup.sql`
- [ ] Файл загружен на сервер → `/tmp/backup.sql`
- [ ] БД импортирована на сервере
- [ ] Проверка выполнена → `check_database_health.sql`
- [ ] Количество записей совпадает
- [ ] Приложение подключается к БД
- [ ] Логин работает
- [ ] Telegram бот работает

---

## ⚠️ Важно

1. **Сделайте бэкап перед импортом** (если БД уже была на сервере)
2. **Проверьте права доступа** пользователя `yoddle_user`
3. **Убедитесь, что .env файл настроен** с правильными параметрами БД

