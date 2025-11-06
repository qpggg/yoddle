# 🔧 УСТАНОВКА POSTGRESQL КЛИЕНТА НА СЕРВЕРЕ

## ❌ Ошибка:

```
Error: You must install at least one postgresql-client-<version> package
```

## ✅ Решение:

### Шаг 1: Обновите список пакетов

```bash
apt update
```

### Шаг 2: Установите PostgreSQL клиент

#### Вариант A: Установка конкретной версии (рекомендуется)

```bash
# PostgreSQL 15 (современная стабильная версия)
apt install -y postgresql-client-15

# ИЛИ PostgreSQL 14
apt install -y postgresql-client-14

# ИЛИ PostgreSQL 16 (если доступна)
apt install -y postgresql-client-16
```

#### Вариант B: Установка последней доступной версии

```bash
apt install -y postgresql-client
```

### Шаг 3: Проверьте установку

```bash
# Проверьте версию
psql --version

# Должно вывести что-то вроде:
# psql (PostgreSQL) 15.x
```

### Шаг 4: Проверьте подключение к БД

```bash
# Теперь попробуйте подключиться снова
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT version();"
```

---

## 🔍 Если установка не удалась:

### Проверьте доступные версии:

```bash
# Посмотрите доступные версии PostgreSQL клиента
apt-cache search postgresql-client

# Вы увидите список типа:
# postgresql-client-15
# postgresql-client-14
# postgresql-client-16
```

### Установите нужную версию из списка

```bash
apt install -y postgresql-client-<номер_версии>
```

---

## 📝 После успешной установки:

Теперь вы можете использовать все команды из `QUICK_CONNECT_DB.md` и `IMPORT_DB_TO_SERVER.md`:

```bash
# Проверка подключения
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "SELECT version();"

# Просмотр таблиц
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -c "\dt"

# Импорт БД
PGPASSWORD=lJS2b1O3 psql -h localhost -U f1111323_base -d f1111323_base -f public/backup_full1.sql
```

