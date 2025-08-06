// Прямой тест подключения к Supabase без .env
import { Pool } from 'pg';

async function testDirectConnection() {
  console.log('🔍 Тестируем прямое подключение к Supabase...');
  
  const connectionString = 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📡 Подключаемся к:', connectionString.replace(/:[^:]*@/, ':***@'));
    
    const client = await pool.connect();
    console.log('✅ Подключение успешно!');
    
    // Тестируем простой запрос
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Текущее время:', result.rows[0].current_time);
    console.log('✅ Версия PostgreSQL:', result.rows[0].pg_version);
    
    // Проверяем таблицы
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Доступные таблицы:');
    tables.rows.forEach(row => {
      console.log('  -', row.table_name);
    });
    
    // Проверяем таблицу enter
    try {
      const enterCount = await client.query('SELECT COUNT(*) as count FROM enter');
      console.log('👤 Пользователей в enter:', enterCount.rows[0].count);
    } catch (err) {
      console.log('⚠️ Таблица enter недоступна:', err.message);
    }
    
    client.release();
    console.log('🎉 Тест завершен успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.code, error.message);
    if (error.code === 'ENOTFOUND') {
      console.log('🌐 Проверьте интернет-соединение');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔒 Сервер отклонил подключение');
    }
  } finally {
    await pool.end();
  }
}

testDirectConnection();