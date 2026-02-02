/**
 * Создаёт пользователя HR-админа в БД (enter + user_roles).
 * Строка подключения берётся из .env: PG_CONNECTION_STRING или PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD.
 * Запуск из корня проекта: node scripts/run_create_admin.js
 */
import { getDbClient } from '../db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, 'sql', 'create_admin_user.sql');

async function main() {
  const sql = readFileSync(sqlPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.replace(/--[^\n]*/g, '').trim())
    .filter((s) => s.length > 0);

  const client = await getDbClient();
  try {
    for (const statement of statements) {
      await client.query(statement + ';');
    }
    console.log('Готово. Логин: hr_admin  Пароль: admin123');
  } finally {
    client.release();
    const { closePool } = await import('../db.js');
    await closePool();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
