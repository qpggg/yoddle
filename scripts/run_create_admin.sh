#!/bin/bash
# Создание HR-админа через Docker (без Node). Образ postgres с psql.
# Учётные данные только из .env (PG_CONNECTION_STRING или PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD).
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "Файл .env не найден. Задайте PG_CONNECTION_STRING или PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD."
  exit 1
fi
set -a
source .env 2>/dev/null || true
set +a

if [ -n "$PG_CONNECTION_STRING" ]; then
  docker run --rm -i --env-file .env postgres:16-alpine sh -c 'psql "$PG_CONNECTION_STRING" -f -' < scripts/sql/create_admin_user.sql
else
  if [ -z "$PGHOST" ] || [ -z "$PGPASSWORD" ]; then
    echo "Задайте в .env: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD"
    exit 1
  fi
  PGPORT="${PGPORT:-5432}"
  PGDATABASE="${PGDATABASE:-yoddle_db}"
  PGUSER="${PGUSER:-yoddle_user}"
  docker run --rm -i -e PGHOST -e PGPORT -e PGDATABASE -e PGUSER -e PGPASSWORD postgres:16-alpine sh -c 'psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f -' < scripts/sql/create_admin_user.sql
fi

echo "Готово. Логин: hr_admin  Пароль: admin123"
