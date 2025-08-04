import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Функция для создания клиента БД
function createDbClient() {
  const connectionString = process.env.PG_CONNECTION_STRING || 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';
  
  return new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

async function checkDbFixes() {
  const client = createDbClient();
  
  try {
    await client.connect();
    console.log('🔍 ПРОВЕРКА ПРИМЕНЕНИЯ БД ИСПРАВЛЕНИЙ\n');
    
    // Проверяем индексы
    console.log('📊 ПРОВЕРКА ИНДЕКСОВ:');
    
    const indexQueries = [
      { name: 'activity_log_user_date', query: "SELECT indexname FROM pg_indexes WHERE indexname = 'idx_activity_log_user_date'" },
      { name: 'user_achievements_user_id', query: "SELECT indexname FROM pg_indexes WHERE indexname = 'idx_user_achievements_user_id'" },
      { name: 'notifications_user_read', query: "SELECT indexname FROM pg_indexes WHERE indexname = 'idx_notifications_user_read'" },
      { name: 'enter_login', query: "SELECT indexname FROM pg_indexes WHERE indexname = 'idx_enter_login'" }
    ];
    
    for (const index of indexQueries) {
      try {
        const result = await client.query(index.query);
        if (result.rows.length > 0) {
          console.log(`✅ ${index.name}: СОЗДАН`);
        } else {
          console.log(`❌ ${index.name}: НЕ СОЗДАН`);
        }
      } catch (error) {
        console.log(`❌ ${index.name}: ОШИБКА - ${error.message}`);
      }
    }
    
    console.log('\n🔧 ПРОВЕРКА ФУНКЦИЙ:');
    
    const functionQueries = [
      { name: 'get_user_activity', query: "SELECT proname FROM pg_proc WHERE proname = 'get_user_activity'" },
      { name: 'get_user_achievements', query: "SELECT proname FROM pg_proc WHERE proname = 'get_user_achievements'" },
      { name: 'get_unread_notifications', query: "SELECT proname FROM pg_proc WHERE proname = 'get_unread_notifications'" }
    ];
    
    for (const func of functionQueries) {
      try {
        const result = await client.query(func.query);
        if (result.rows.length > 0) {
          console.log(`✅ ${func.name}: СОЗДАНА`);
        } else {
          console.log(`❌ ${func.name}: НЕ СОЗДАНА`);
        }
      } catch (error) {
        console.log(`❌ ${func.name}: ОШИБКА - ${error.message}`);
      }
    }
    
    console.log('\n📈 ПРОВЕРКА ПРЕДСТАВЛЕНИЙ:');
    
    const viewQueries = [
      { name: 'activity_stats', query: "SELECT viewname FROM pg_views WHERE viewname = 'activity_stats'" },
      { name: 'achievement_stats', query: "SELECT viewname FROM pg_views WHERE viewname = 'achievement_stats'" },
      { name: 'benefit_stats', query: "SELECT viewname FROM pg_views WHERE viewname = 'benefit_stats'" }
    ];
    
    for (const view of viewQueries) {
      try {
        const result = await client.query(view.query);
        if (result.rows.length > 0) {
          console.log(`✅ ${view.name}: СОЗДАНО`);
        } else {
          console.log(`❌ ${view.name}: НЕ СОЗДАНО`);
        }
      } catch (error) {
        console.log(`❌ ${view.name}: ОШИБКА - ${error.message}`);
      }
    }
    
    // Тестируем функции
    console.log('\n🧪 ТЕСТИРОВАНИЕ ФУНКЦИЙ:');
    
    try {
      const activityResult = await client.query('SELECT * FROM get_user_activity(1, 2024, 12) LIMIT 1');
      console.log(`✅ get_user_activity: РАБОТАЕТ (${activityResult.rows.length} результатов)`);
    } catch (error) {
      console.log(`❌ get_user_activity: ОШИБКА - ${error.message}`);
    }
    
    try {
      const achievementsResult = await client.query('SELECT * FROM get_user_achievements(1) LIMIT 1');
      console.log(`✅ get_user_achievements: РАБОТАЕТ (${achievementsResult.rows.length} результатов)`);
    } catch (error) {
      console.log(`❌ get_user_achievements: ОШИБКА - ${error.message}`);
    }
    
    console.log('\n📋 РЕКОМЕНДАЦИИ:');
    console.log('- Если индексы не созданы: выполните CREATE INDEX команды');
    console.log('- Если функции не созданы: выполните CREATE FUNCTION команды');
    console.log('- Если представления не созданы: выполните CREATE VIEW команды');
    
  } catch (error) {
    console.error('Ошибка при проверке БД:', error);
  } finally {
    await client.end();
  }
}

// Запуск проверки
checkDbFixes().catch(console.error); 