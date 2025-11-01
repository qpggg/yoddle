# 🚀 ЭКСПОРТ БД ИЗ DOCKER КОНТЕЙНЕРА yoddle-pg

## ✅ Найденные параметры подключения:

- **Пользователь**: `f1111323_yoddle`
- **Пароль**: `Nei3wmOK`
- **База данных**: `supa_full`
- **Порт хоста**: `6543`
- **Порт в контейнере**: `5432`

---

## 📤 Команды для экспорта БД:

### Вариант 1: Экспорт через порт хоста (рекомендуется)

```bash
# Полный экспорт (схема + данные)
pg_dump -h localhost -p 6543 -U f1111323_yoddle -d supa_full > backup_full.sql

# С указанием пароля в переменной окружения
$env:PGPASSWORD="Nei3wmOK"; pg_dump -h localhost -p 6543 -U f1111323_yoddle -d supa_full > backup_full.sql

# Сжатый вариант (рекомендуется для больших БД)
$env:PGPASSWORD="Nei3wmOK"; pg_dump -h localhost -p 6543 -U f1111323_yoddle -d supa_full | gzip > backup_full.sql.gz
```

### Вариант 2: Экспорт через строку подключения

```bash
# Используйте полную строку подключения
pg_dump "postgresql://f1111323_yoddle:Nei3wmOK@localhost:6543/supa_full" > backup_full.sql

# Сжатый вариант
pg_dump "postgresql://f1111323_yoddle:Nei3wmOK@localhost:6543/supa_full" | gzip > backup_full.sql.gz
```

### Вариант 3: Экспорт изнутри контейнера (через TCP)

```bash
# Через TCP соединение внутри контейнера
docker exec -t yoddle-pg sh -c "PGPASSWORD=Nei3wmOK psql -h localhost -U f1111323_yoddle -d supa_full -c '\dt'" > tables_list.txt

# Экспорт БД
docker exec -t yoddle-pg sh -c "PGPASSWORD=Nei3wmOK pg_dump -h localhost -U f1111323_yoddle -d supa_full" > backup_full.sql
```

---

## 🔍 Быстрая проверка БД перед экспортом:

```bash
# Подключитесь к БД для проверки
$env:PGPASSWORD="Nei3wmOK"; psql -h localhost -p 6543 -U f1111323_yoddle -d supa_full

# В psql выполните проверочные запросы:
SELECT COUNT(*) FROM enter;
SELECT COUNT(*) FROM benefits;
SELECT COUNT(*) FROM telegram_leads;
SELECT COUNT(*) FROM user_progress;

# Проверьте список таблиц
\dt

# Выйдите
\q
```

---

## 📊 Использование скрипта проверки:

```bash
# После экспорта, на сервере загрузите backup_full.sql
# Затем запустите скрипт проверки:
psql -U yoddle_user -d yoddle_db -h localhost -f check_database_health.sql
```

---

## ⚡ Самый быстрый способ (одна команда):

```bash
# Экспорт + загрузка на сервер одной командой
$env:PGPASSWORD="Nei3wmOK"; pg_dump -h localhost -p 6543 -U f1111323_yoddle -d supa_full | ssh root@your_server_ip "sudo -u postgres psql yoddle_db"
```

---

## 📝 Примечания:

- **Имя БД в Docker**: `supa_full` (не `yoddle_db`)
- **Пользователь**: `f1111323_yoddle` (не `postgres`)
- **Порт на хосте**: `6543` (внутри контейнера `5432`)

После импорта на сервере база данных будет называться `yoddle_db`, но данные будут перенесены.
