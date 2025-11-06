# ✅ ПРОВЕРКА ФУНКЦИЙ И ФИНАЛЬНАЯ НАСТРОЙКА

## ✅ Хорошие новости:

39 функций импортированы! Это означает, что функции создались, несмотря на ошибки про роль.

---

## 🔍 ШАГ 1: Проверьте критичные функции

Проверьте наличие важных функций, которые упоминались в ошибках:

```bash
# Проверьте функции продуктивности
sudo -u postgres psql yoddle_db -c "SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%productivity%' OR routine_name LIKE '%calculate%' OR routine_name LIKE '%check%' ORDER BY routine_name;"

# Проверьте конкретные функции из ошибок
sudo -u postgres psql yoddle_db -c "SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('calculate_productivity_score', 'check_productivity_achievements', 'get_productivity_level');"
```

---

## ✅ ШАГ 2: Дайте права пользователю yoddle_user

```bash
sudo -u postgres psql yoddle_db << EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yoddle_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yoddle_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO yoddle_user;
\q
EOF
```

---

## ✅ ШАГ 3: Проверьте работоспособность функций

```bash
# Проверьте, что пользователь yoddle_user может вызывать функции
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' LIMIT 5;"

# Попробуйте вызвать одну из функций (если есть тестовые данные)
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT get_productivity_level(50);" 2>&1
```

---

## ✅ ШАГ 4: Проверьте таблицы и данные

```bash
# Проверьте таблицы
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "\dt"

# Проверьте данные
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM enter;"
PGPASSWORD=1WIzL7aP_F psql -h localhost -U yoddle_user -d yoddle_db -c "SELECT COUNT(*) FROM benefits;"
```

---

## 🔧 ШАГ 5: Обновите .env файл

```bash
cd /root/yoddle
nano .env
```

Добавьте:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yoddle_db
DB_USER=yoddle_user
DB_PASSWORD=1WIzL7aP_F

PG_CONNECTION_STRING=postgresql://yoddle_user:1WIzL7aP_F@localhost:5432/yoddle_db
```

---

## 🔄 ШАГ 6: Перезапустите приложения

```bash
pm2 restart yoddle-api
pm2 restart yoddle-tg

# Проверьте логи
pm2 logs yoddle-api --lines 30
pm2 logs yoddle-tg --lines 30
```

---

## 📋 ИТОГОВЫЙ ЧЕКЛИСТ:

- [x] БД создана
- [x] Таблицы импортированы
- [x] Данные импортированы (COPY операции успешны)
- [x] 39 функций импортированы
- [ ] Проверены критичные функции
- [ ] Права выданы пользователю yoddle_user
- [ ] .env файл обновлен
- [ ] Приложения перезапущены
- [ ] Логи показывают успешное подключение

---

## 💡 Примечание:

Ошибки про роль `f1111323_yoddle` были связаны с тем, что в бэкапе функции были привязаны к этой роли. Но функции все равно создались, просто с владельцем `postgres` вместо `f1111323_yoddle`. Это нормально и не влияет на работу.

Если все функции на месте и работают - можно продолжать!

