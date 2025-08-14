import { Pool } from 'pg';
import dotenv from 'dotenv';

// Ensure environment variables from .env are loaded before we access them
// This is important when this module is imported before the main server calls dotenv.config()
dotenv.config({ override: false });

// Accept either a single DSN or discrete PG* variables
function buildConnectionStringFromEnv() {
  const host = process.env.PGHOST;
  const port = process.env.PGPORT || '5432';
  const database = process.env.PGDATABASE;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  if (!host || !database || !user || typeof password === 'undefined') {
    return null;
  }
  const encodedPassword = encodeURIComponent(password);
  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${database}`;
}

if (!process.env.PG_CONNECTION_STRING) {
  const fromEnv = buildConnectionStringFromEnv();
  if (fromEnv) {
    process.env.PG_CONNECTION_STRING = fromEnv;
  } else {
    throw new Error('PG_CONNECTION_STRING is not set. Please set it in .env or provide PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD');
  }
}

// Автоматический выбор SSL:
// - если явно указан sslmode=disable → без SSL
// - если sslmode=require или это Supabase → c SSL
// - иначе без SSL
const dsn = process.env.PG_CONNECTION_STRING;
let sslOption = false;
try {
  const url = new URL(dsn);
  const sslMode = url.searchParams.get('sslmode');
  const isSupabase = /supabase\.com$/i.test(url.hostname);
  if (sslMode === 'disable') {
    sslOption = false;
  } else if (sslMode === 'require' || isSupabase) {
    sslOption = true;
  } else {
    sslOption = false;
  }
} catch {
  // Если парсинг не удался, оставим conservative: без SSL
  sslOption = false;
}

const pool = new Pool({
  connectionString: dsn,
  ssl: sslOption ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  allowExitOnIdle: true
});

// Обработка ошибок пула
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export function createDbClient() {
  return {
    connect: async () => {}, // Пустая функция для обратной совместимости
    query: (...args) => pool.query(...args),
    end: async () => {} // Пустая функция для обратной совместимости
  };
}

// Выдать pooled client для транзакций (BEGIN/COMMIT/ROLLBACK в рамках одного соединения)
export async function getDbClient() {
  return await pool.connect();
}

// Функция для закрытия пула при завершении работы приложения
export async function closePool() {
  await pool.end();
}

process.on('SIGTERM', () => {
  closePool().then(() => process.exit(0));
});

process.on('SIGINT', () => {
  closePool().then(() => process.exit(0));
});