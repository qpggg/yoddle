# 📦 Нужна ли сборка после git pull?

## 🎯 Короткий ответ:

**НЕ всегда!** Сборка нужна только если изменился **фронтенд** (папка `src/`).

## 📋 Когда нужна сборка:

### ✅ Сборка ОБЯЗАТЕЛЬНА если изменилось:

1. **Фронтенд код** (папка `src/`):
   - `src/**/*.tsx`, `src/**/*.ts`
   - Компоненты React, хуки, страницы
   - **Команда:** `npm run build`

2. **Конфигурация сборки**:
   - `vite.config.ts`
   - `tsconfig.json`
   - **Команда:** `npm run build`

### ❌ Сборка НЕ нужна если изменилось:

1. **Backend код** (чистый JavaScript):
   - `server.js`
   - `api/**/*.js`
   - `db.js`
   - **Достаточно:** `pm2 restart server`

2. **Telegram бот**:
   - `telegram-bot/src/**/*.js`
   - **Достаточно:** `pm2 restart yoddle-tg`

3. **SQL миграции**:
   - `*.sql` файлы
   - **Достаточно:** применить через `psql`

4. **Документация**:
   - `*.md` файлы
   - **Ничего не нужно**

## 🔍 Как проверить что изменилось:

### После `git pull` проверьте:

```bash
# Посмотреть что изменилось
git diff HEAD~1 HEAD --name-only

# Или посмотреть последний коммит
git show --name-only HEAD
```

### Если изменились файлы из `src/` → нужна сборка:

```bash
npm run build
pm2 restart server
```

### Если изменились только backend файлы → сборка НЕ нужна:

```bash
# Просто перезапустите сервер
pm2 restart server

# Или бота
pm2 restart yoddle-tg
```

## 📊 Структура проекта:

```
yoddle/
├── src/              ← Фронтенд (TypeScript) - НУЖНА СБОРКА
│   ├── *.tsx
│   └── *.ts
├── server.js         ← Backend (JavaScript) - НЕ НУЖНА СБОРКА
├── api/              ← Backend API (JavaScript) - НЕ НУЖНА СБОРКА
├── telegram-bot/     ← Бот (JavaScript) - НЕ НУЖНА СБОРКА
└── dist/             ← Результат сборки фронтенда
```

## 🚀 Рекомендуемый workflow:

### Вариант 1: Быстрый (если знаете что изменилось)

```bash
cd /root/yoddle
git pull origin stable

# Если изменился фронтенд
npm run build
pm2 restart server

# Если изменился только backend
pm2 restart server
```

### Вариант 2: Безопасный (всегда работает)

```bash
cd /root/yoddle
git pull origin stable

# Проверьте что изменилось
git diff HEAD~1 HEAD --name-only | grep -E "^src/|vite.config|tsconfig"

# Если есть изменения в src/ - соберите
if git diff HEAD~1 HEAD --name-only | grep -q "^src/"; then
  echo "🔨 Сборка фронтенда..."
  npm run build
fi

# Перезапустите серверы
pm2 restart server
pm2 restart yoddle-tg
```

### Вариант 3: Универсальный (всегда собирает, но медленнее)

```bash
cd /root/yoddle
git pull origin stable
npm install          # Только если изменился package.json
npm run build        # Всегда собирает (медленнее, но безопасно)
pm2 restart server
pm2 restart yoddle-tg
```

## ⚡ Оптимизация:

### Если изменился только backend:

```bash
# Быстрый перезапуск без сборки
git pull origin stable
pm2 restart server
pm2 restart yoddle-tg
# Готово! (~5 секунд)
```

### Если изменился фронтенд:

```bash
# Полная сборка
git pull origin stable
npm run build        # Это займет 30-60 секунд
pm2 restart server
# Готово! (~1 минута)
```

## 🔍 Проверка нужна ли сборка:

```bash
# После git pull проверьте:
git diff HEAD~1 HEAD --name-only | grep -E "^src/|^dist/"

# Если вывод пустой - сборка НЕ нужна
# Если есть файлы из src/ - сборка нужна
```

## 💡 Рекомендация:

**Используйте Вариант 1** (быстрый) если уверены что изменилось.  
**Используйте Вариант 2** (безопасный) если не уверены.  
**Используйте Вариант 3** (универсальный) если хотите быть на 100% уверены.

## ⚠️ Важно:

- **Сборка нужна только для фронтенда** (`src/` → `dist/`)
- **Backend и бот** работают напрямую с исходным кодом
- **После сборки** сервер раздает статику из `dist/`
- **Без сборки** фронтенд не обновится, но backend будет работать

