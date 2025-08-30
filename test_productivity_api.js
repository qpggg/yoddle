const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'yoddle',
  user: 'postgres',
  password: 'postgres'
});

async function testProductivityAPI() {
  try {
    console.log('🔍 Тестирую API продуктивности...');
    
    // Тест 1: Проверяю функцию БД
    console.log('\n📊 Тест 1: Функция get_user_productivity_stats(3)');
    const dbResult = await pool.query('SELECT * FROM get_user_productivity_stats(3)');
    console.log('✅ Результат БД:', JSON.stringify(dbResult.rows[0], null, 2));
    
    // Тест 2: Проверяю API endpoint
    console.log('\n🌐 Тест 2: API /api/productivity/stats/3');
    
    // Имитирую API вызов
    const stats = dbResult.rows[0];
    const apiResponse = {
      success: true,
      stats: {
        current_rating: stats?.overall_rating || 0,
        weekly_rating: stats?.overall_rating || 0,
        monthly_rating: stats?.overall_rating || 0,
        tracked_days: stats?.total_records || 0,
        achievements_count: 0
      }
    };
    
    console.log('✅ API Response:', JSON.stringify(apiResponse, null, 2));
    
    // Тест 3: Проверяю фронтенд структуру
    console.log('\n🎨 Тест 3: Структура для фронтенда');
    const frontendData = {
      current_rating: apiResponse.stats.current_rating,
      weekly_rating: apiResponse.stats.weekly_rating,
      monthly_rating: apiResponse.stats.monthly_rating,
      tracked_days: apiResponse.stats.tracked_days,
      achievements_count: apiResponse.stats.achievements_count
    };
    
    console.log('✅ Frontend Data:', JSON.stringify(frontendData, null, 2));
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

testProductivityAPI();
