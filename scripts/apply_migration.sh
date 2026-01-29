#!/bin/bash
# Скрипт для применения миграции онбординга

# Параметры подключения из .env
PGHOST="${PGHOST:-185.185.69.254}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-yoddle_db}"
PGUSER="${PGUSER:-yoddle_user}"
PGPASSWORD="${PGPASSWORD:-1WIzL7aP_F}"

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
