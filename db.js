import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING || 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
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