// Проверка constraints в таблице coin_transactions
import { Pool } from 'pg';

async function checkConstraints() {
  console.log('🔍 Проверяем constraints таблицы coin_transactions...');
  
  const pool = new Pool({
    connectionString: 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    // Проверяем constraints
    const constraints = await client.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%transaction_type%'
    `);
    
    console.log('📋 Check constraints:');
    constraints.rows.forEach(row => {
      console.log(`  - ${row.constraint_name}: ${row.check_clause}`);
    });
    
    // Проверяем структуру таблицы
    const columns = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'coin_transactions'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Структура coin_transactions:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable}) ${row.column_default || ''}`);
    });
    
    // Проверяем существующие записи
    const existing = await client.query('SELECT DISTINCT transaction_type FROM coin_transactions LIMIT 10');
    console.log('\n🗃️ Существующие типы транзакций:');
    if (existing.rows.length === 0) {
      console.log('  (пусто)');
    } else {
      existing.rows.forEach(row => {
        console.log(`  - "${row.transaction_type}"`);
      });
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkConstraints();