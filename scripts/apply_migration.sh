#!/bin/bash
# Скрипт для применения миграции онбординга (запуск из корня проекта)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"
[ -f .env ] && source .env 2>/dev/null || true

if [ -z "$PGHOST" ] || [ -z "$PGPASSWORD" ]; then
  echo "Задайте PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD в .env"
  exit 1
fi
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-yoddle_db}"
PGUSER="${PGUSER:-yoddle_user}"

# Путь к SQL файлу миграции
MIGRATION_FILE="scripts/sql/add_onboarding_fields.sql"

echo "🔧 Применение миграции онбординга..."
echo "📊 База данных: $PGDATABASE на $PGHOST:$PGPORT"
echo ""

# Применяем миграцию
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Миграция успешно применена!"
    echo ""
    echo "Проверка новых полей:"
    PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "\d user_progress" | grep -E "(onboarding|tour)"
else
    echo ""
    echo "❌ Ошибка при применении миграции"
    exit 1
fi
