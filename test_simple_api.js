// Простой тест подключения к БД и API
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testDb() {
  console.log('🔍 Тестируем подключение к БД...');
  
  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: process.env.PG_CONNECTION_STRING?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Подключение к БД успешно');
    
    // Тестируем простой запрос
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Тестовый запрос выполнен:', result.rows[0]);
    
    // Проверяем таблицу enter
    const enterCheck = await client.query('SELECT COUNT(*) as user_count FROM enter');
    console.log('✅ Таблица enter:', enterCheck.rows[0]);
    
    // Проверяем таблицу user_balance
    try {
      const balanceCheck = await client.query('SELECT COUNT(*) as balance_count FROM user_balance');
      console.log('✅ Таблица user_balance:', balanceCheck.rows[0]);
    } catch (err) {
      console.log('⚠️ Таблица user_balance не найдена:', err.message);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Ошибка подключения к БД:', error.message);
  } finally {
    await pool.end();
  }
}

async function testApi() {
  console.log('\n🌐 Тестируем API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/balance?user_id=1&action=balance');
    const text = await response.text();
    console.log('📝 Ответ API:', text);
    
    if (response.ok) {
      console.log('✅ API работает');
    } else {
      console.log('❌ API вернул ошибку:', response.status);
    }
  } catch (error) {
    console.error('❌ Ошибка запроса к API:', error.message);
  }
}

testDb().then(() => testApi());