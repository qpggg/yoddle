// Проверка SQL функций в Supabase
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function checkFunctions() {
  console.log('🔍 Проверяем SQL функции в Supabase...');
  
  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    // Проверяем существующие функции
    const functions = await client.query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE '%coin%'
      ORDER BY routine_name
    `);
    
    console.log('📋 SQL функции с "coin" в названии:');
    if (functions.rows.length === 0) {
      console.log('  ❌ Функции не найдены!');
    } else {
      functions.rows.forEach(row => {
        console.log(`  - ${row.routine_name} (${row.routine_type})`);
      });
    }
    
    // Проверяем таблицы user_balance
    const userBalance = await client.query('SELECT COUNT(*) as count FROM user_balance');
    console.log(`👤 Записей в user_balance: ${userBalance.rows[0].count}`);
    
    // Проверяем структуру таблицы
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_balance'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Структура user_balance:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkFunctions();