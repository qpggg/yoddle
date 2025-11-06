# 🚀 СОЗДАНИЕ БД НА СЕРВЕРЕ И ИМПОРТ БЭКАПА

## ✅ Преимущества этого подхода:

- ✅ БД на том же сервере (`localhost`)
- ✅ Полный контроль над БД
- ✅ Не нужно искать параметры подключения
- ✅ Быстрое подключение (без задержек сети)

---

## 📋 ШАГ 1: Установка PostgreSQL на сервере

### Проверка текущего состояния:

```bash
# Проверьте, установлен ли PostgreSQL
systemctl status postgresql
psql --version
id postgres
```

### Если PostgreSQL НЕ установлен (ваш случай):

```bash
# Обновите список пакетов
apt update

# Установите PostgreSQL сервер и клиент
apt install -y postgresql postgresql-contrib

# Запустите PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Проверьте статус
systemctl status postgresql

# Проверьте версию
psql --version

# Проверьте, что пользователь postgres создан
id postgres
```

После установки пользователь `postgres` должен быть создан автоматически.

---

## 🔧 ШАГ 2: Создание базы данных и пользователя

### Вариант A: Если пользователь postgres существует (стандартный способ)

```bash
# Переключитесь на пользователя postgres
sudo -u postgres psql

# В psql выполните следующие команды:
```

### Вариант B: Если пользователь postgres НЕ существует (используйте root)

```bash
# Подключитесь к PostgreSQL от имени root
psql postgres

# ИЛИ если нужно указать пользователя явно:
psql -U postgres -d postgres

# ИЛИ если PostgreSQL настроен на работу от root:
psql
```

### SQL команды для создания БД (одинаковые для обоих вариантов):

```sql
-- Создайте базу данных
CREATE DATABASE yoddle_db;

-- Создайте пользователя с паролем
CREATE USER yoddle_user WITH ENCRYPTED PASSWORD 'ваш_надежный_пароль';

-- Дайте права на базу данных
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;

-- Подключитесь к созданной БД
\c yoddle_db

-- Дайте права на схему public
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;

-- Выйдите из psql
\q
```

### Или одной командой (без входа в psql):

#### Если пользователь postgres существует:
```bash
sudo -u postgres psql << EOF
CREATE DATABASE yoddle_db;
CREATE USER yoddle_user WITH ENCRYPTED PASSWORD 'ваш_надежный_пароль';
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;
\c yoddle_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;
\q
EOF
```

#### Если пользователь postgres НЕ существует (используйте root):
```bash
psql postgres << EOF
CREATE DATABASE yoddle_db;
CREATE USER yoddle_user WITH ENCRYPTED PASSWORD 'ваш_надежный_пароль';
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;
\c yoddle_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;
\q
EOF
```

**Замените `ваш_надежный_пароль`** на реальный пароль (запомните его!)

---

## ✅ ШАГ 3: Проверка создания БД

```bash
# Проверьте подключение к новой БД
# Замените YOUR_PASSWORD на пароль, который вы указали
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT version();"

# Проверьте список баз данных
sudo -u postgres psql -c "\l" | grep yoddle_db
```

---

## 📤 ШАГ 4: Получение файла бэкапа на сервере

```bash
# Перейдите в папку проекта
cd /root/yoddle  # или /root/yoddle1

# Обновите код из репозитория (файл backup_full1.sql будет в public/)
git checkout stable
git pull origin stable

# Проверьте наличие файла
ls -lh public/backup_full1.sql
```

---

## 📥 ШАГ 5: Импорт бэкапа в новую БД

```bash
# Импортируйте бэкап
# Замените YOUR_PASSWORD на пароль, который вы указали при создании пользователя
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U yoddle_user -d yoddle_db -f public/backup_full1.sql

# ИЛИ с выводом ошибок в файл (рекомендуется):
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U yoddle_user -d yoddle_db -f public/backup_full1.sql 2>&1 | tee import_log_$(date +%Y%m%d_%H%M%S).log
```

**Пример:**
```bash
# Если пароль: mypassword123
PGPASSWORD=mypassword123 psql -h localhost -U yoddle_user -d yoddle_db -f public/backup_full1.sql 2>&1 | tee import_log_$(date +%Y%m%d_%H%M%S).log
```

---

## ✅ ШАГ 6: Проверка импорта

```bash
# Проверьте список таблиц
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U yoddle_user -d yoddle_db -c "\dt"

# Проверьте количество записей в основных таблицах
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM enter;"
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM benefits;"
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM telegram_leads;"
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM user_progress;"
```

---

## 🔧 ШАГ 7: Настройка .env файла на сервере

```bash
# На сервере
cd /root/yoddle
nano .env
```

Добавьте параметры новой БД:

```env
# Параметры БД (локальная БД на сервере)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yoddle_db
DB_USER=yoddle_user
DB_PASSWORD=ваш_надежный_пароль

# Для db.js (альтернативный вариант)
PG_CONNECTION_STRING=postgresql://yoddle_user:ваш_надежный_пароль@localhost:5432/yoddle_db

# ИЛИ отдельные переменные для db.js
PGHOST=localhost
PGPORT=5432
PGDATABASE=yoddle_db
PGUSER=yoddle_user
PGPASSWORD=ваш_надежный_пароль
```

**Замените `ваш_надежный_пароль`** на реальный пароль!

Сохраните файл (Ctrl+O, Enter, Ctrl+X)

---

## 🔄 ШАГ 8: Перезапустите приложения

```bash
# Перезапустите приложения с новыми параметрами БД
pm2 restart yoddle-api
pm2 restart yoddle-tg

# Проверьте логи
pm2 logs yoddle-api --lines 20
pm2 logs yoddle-tg --lines 20

# Проверьте статус процессов
pm2 status
```

---

## 🔒 ШАГ 9: Настройка безопасности (опционально, но рекомендуется)

### Настройка pg_hba.conf для локальных подключений:

```bash
# Отредактируйте файл конфигурации
nano /etc/postgresql/*/main/pg_hba.conf

# Найдите строки с localhost и убедитесь, что есть:
host    yoddle_db    yoddle_user    127.0.0.1/32    md5

# Перезапустите PostgreSQL
systemctl restart postgresql
```

---

## 🎯 Чеклист:

- [ ] PostgreSQL установлен на сервере
- [ ] Создана БД `yoddle_db`
- [ ] Создан пользователь `yoddle_user` с паролем
- [ ] Пользователю выданы все необходимые права
- [ ] Проверено подключение к БД
- [ ] Файл `public/backup_full1.sql` присутствует на сервере
- [ ] Бэкап импортирован в новую БД без критических ошибок
- [ ] Проверено количество записей в таблицах
- [ ] Обновлен `.env` файл с параметрами новой БД
- [ ] Приложения перезапущены и подключаются к новой БД
- [ ] Логи показывают успешное подключение

---

## 🆘 Если возникли проблемы:

### Ошибка "permission denied"
- Убедитесь, что пользователь `yoddle_user` имеет права на создание таблиц
- Проверьте, что вы дали все необходимые права (см. Шаг 2)

### Ошибка "database does not exist"
- Проверьте имя БД: `sudo -u postgres psql -c "\l"`
- Убедитесь, что БД создана правильно

### Ошибки при импорте
- Проверьте логи импорта: `cat import_log_*.log | grep -i error`
- Некоторые ошибки (например, "relation already exists") можно игнорировать, если таблицы уже созданы

### PostgreSQL не запускается
```bash
# Проверьте статус
systemctl status postgresql

# Запустите службу
systemctl start postgresql

# Включите автозапуск
systemctl enable postgresql
```

---

## 💡 Преимущества локальной БД:

1. **Скорость** - подключение через localhost очень быстрое
2. **Простота** - не нужно настраивать удаленное подключение
3. **Контроль** - полный контроль над БД и данными
4. **Безопасность** - БД доступна только локально

---

## 📝 Пример полного процесса одной командой:

```bash
# 1. Установка PostgreSQL
apt update && apt install -y postgresql postgresql-contrib

# 2. Создание БД и пользователя (замените PASSWORD)
sudo -u postgres psql << EOF
CREATE DATABASE yoddle_db;
CREATE USER yoddle_user WITH ENCRYPTED PASSWORD 'PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE yoddle_db TO yoddle_user;
\c yoddle_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;
\q
EOF

# 3. Импорт бэкапа (замените PASSWORD)
cd /root/yoddle
git pull origin stable
PGPASSWORD=PASSWORD psql -h localhost -U yoddle_user -d yoddle_db -f public/backup_full1.sql
```

