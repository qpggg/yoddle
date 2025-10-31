const { createDbClient } = require('./db.js');

async function checkProductivityTables() {
  const db = createDbClient();
  
  try {
    console.log('🔍 Проверяем существующие таблицы и функции продуктивности...\n');
    
    // 1. Проверяем существующие таблицы
    console.log('📋 СУЩЕСТВУЮЩИЕ ТАБЛИЦЫ:');
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%productivity%'
      ORDER BY table_name
    `);
    
    if (tables.rows.length === 0) {
      console.log('❌ Таблицы продуктивности НЕ НАЙДЕНЫ');
    } else {
      tables.rows.forEach(row => {
        console.log(`✅ ${row.table_name}`);
      });
    }
    
    // 2. Проверяем функции
    console.log('\n🔧 СУЩЕСТВУЮЩИЕ ФУНКЦИИ:');
    const functions = await db.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE '%productivity%'
      ORDER BY routine_name
    `);
    
    if (functions.rows.length === 0) {
      console.log('❌ Функции продуктивности НЕ НАЙДЕНЫ');
    } else {
      functions.rows.forEach(row => {
        console.log(`✅ ${row.routine_name}`);
      });
    }
    
    // 3. Проверяем колонки в ai_signals
    console.log('\n📊 КОЛОНКИ В ai_signals:');
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ai_signals' 
      ORDER BY ordinal_position
    `);
    
    columns.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    // 4. Проверяем колонки в user_progress
    console.log('\n📊 КОЛОНКИ В user_progress:');
    const progressColumns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_progress' 
      ORDER BY ordinal_position
    `);
    
    progressColumns.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    // 5. Проверяем представления
    console.log('\n👁️ СУЩЕСТВУЮЩИЕ ПРЕДСТАВЛЕНИЯ:');
    const views = await db.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%productivity%'
      ORDER BY table_name
    `);
    
    if (views.rows.length === 0) {
      console.log('❌ Представления продуктивности НЕ НАЙДЕНЫ');
    } else {
      views.rows.forEach(row => {
        console.log(`✅ ${row.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке:', error.message);
  } finally {
    await db.end();
  }
}

checkProductivityTables();





