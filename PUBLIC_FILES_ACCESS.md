# 📁 Доступ к файлам из папки public

## Проблема:
Файлы из папки `public` не отображаются на сервере.

## Решение:

### ✅ Что было сделано:

1. **Добавлен маршрут для public файлов** в `server.js`:
   ```javascript
   app.use('/public', express.static(path.join(__dirname, 'public')));
   ```

2. **Теперь файлы доступны по URL**:
   - `http://your-server/public/backup_full1.sql`
   - `http://your-server/public/Yoddle.pdf`
   - и т.д.

---

## 🔧 Как это работает:

### В режиме разработки (dev):
- Vite автоматически обслуживает файлы из `public` по корневому пути
- Например: `http://localhost:5173/backup_full1.sql`

### В продакшене:

**Вариант 1: Через собранный проект**
```bash
# 1. Соберите проект
npm run build

# 2. Vite скопирует все файлы из public в dist
# 3. Express отдает файлы из dist по корневому пути
# Например: http://your-server/backup_full1.sql
```

**Вариант 2: Через маршрут /public (НОВОЕ)**
```bash
# Файлы доступны напрямую из папки public
# Например: http://your-server/public/backup_full1.sql
```

---

## 📝 Для импорта БД на сервере:

Файл `backup_full1.sql` будет доступен по адресу:
```
http://your-server/public/backup_full1.sql
```

Или можно использовать напрямую из файловой системы:
```bash
cd /root/yoddle
psql -U yoddle_user -d yoddle_db -h localhost -f public/backup_full1.sql
```

---

## ⚠️ Важно:

1. **В продакшене обязательно соберите проект:**
   ```bash
   npm run build
   ```

2. **После сборки файлы из `public` будут в `dist`:**
   - `dist/backup_full1.sql`
   - `dist/Yoddle.pdf`
   - и т.д.

3. **Маршрут `/public` работает независимо от сборки:**
   - Прямой доступ к файлам из папки `public`
   - Удобно для скачивания backup файлов

---

## 🚀 После деплоя на сервер:

```bash
# На сервере
cd /root/yoddle
git pull origin stable

# Соберите проект
npm run build

# Перезапустите сервер
pm2 restart yoddle-api

# Теперь файлы доступны:
# - http://your-server/backup_full1.sql (из dist)
# - http://your-server/public/backup_full1.sql (из public)
```

