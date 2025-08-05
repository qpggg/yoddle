const { Pool } = require('pg');

// 🔧 ПОДКЛЮЧЕНИЕ К SUPABASE
const supabaseConnectionString = 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: supabaseConnectionString,
  ssl: { rejectUnauthorized: false }
});

async function testSupabaseGamification() {
  console.log('🚀 ТЕСТ ГЕЙМИФИКАЦИИ НА SUPABASE');
  console.log('==================================');
  
  try {
    // 1. Проверяем подключение
    console.log('📡 Подключение к Supabase...');
    const client = await pool.connect();
    console.log('✅ Подключение успешно!');
    
    // 2. Проверяем пользователя
    console.log('\n👤 Проверяем пользователя...');
    const userResult = await client.query(
      'SELECT id, login, password FROM enter WHERE login = $1',
      ['test@gmail.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Пользователь test@gmail.com не найден в Supabase');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Пользователь найден: ${user.login} (ID: ${user.id})`);
    
    // 3. Проверяем текущие записи в activity_log
    console.log('\n📊 Проверяем activity_log...');
    const activityResult = await client.query(
      'SELECT COUNT(*) as count FROM activity_log WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE',
      [user.id]
    );
    
    const todayActivities = parseInt(activityResult.rows[0].count);
    console.log(`📈 Записей за сегодня: ${todayActivities}`);
    
    // 4. Проверяем user_progress
    console.log('\n🎯 Проверяем user_progress...');
    const progressResult = await client.query(
      'SELECT * FROM user_progress WHERE user_id = $1',
      [user.id]
    );
    
    if (progressResult.rows.length > 0) {
      const progress = progressResult.rows[0];
      console.log(`✅ Прогресс найден: XP=${progress.xp}, Streak=${progress.login_streak}`);
    } else {
      console.log('❌ Запись в user_progress не найдена');
    }
    
    // 5. Тестируем геймификацию
    console.log('\n🎮 Тестируем геймификацию...');
    
    // Проверяем существующие достижения за сегодня
    const existingAchievements = await client.query(
      'SELECT action FROM activity_log WHERE user_id = $1 AND action IN ($2, $3, $4) AND DATE(created_at) = CURRENT_DATE',
      [user.id, 'login', 'first_login_today', 'streak_milestone']
    );
    
    const existingActions = existingAchievements.rows.map(row => row.action);
    console.log(`📋 Существующие действия сегодня: ${existingActions.join(', ') || 'нет'}`);
    
    // Создаем действия
    const actions = [];
    
    // Вход в систему (10 XP) - всегда
    actions.push({
      action: 'login',
      xp_earned: 10,
      description: 'Вход в систему'
    });
    
    // Первый вход за день (15 XP) - только если еще не получено сегодня
    const todayLogin = existingAchievements.rows.find(row => row.action === 'first_login_today');
    if (!todayLogin) {
      actions.push({
        action: 'first_login_today',
        xp_earned: 15,
        description: 'Первый вход за день'
      });
    }
    
    // Серия входов (50 XP) - проверяем streak
    const currentStreak = progressResult.rows[0]?.login_streak || 0;
    const newStreak = currentStreak + 1;
    
    // Даем достижение за streak каждые 7 дней
    const streakMilestone = existingAchievements.rows.find(row => row.action === 'streak_milestone');
    if (newStreak % 7 === 0 && !streakMilestone) {
      actions.push({
        action: 'streak_milestone',
        xp_earned: 50,
        description: `Серия входов: ${newStreak} дней подряд`
      });
    }
    
    console.log(`🎯 Действий для выполнения: ${actions.length}`);
    actions.forEach(action => {
      console.log(`   - ${action.action}: ${action.xp_earned} XP`);
    });
    
    // 6. Выполняем геймификацию
    console.log('\n🚀 Выполняем геймификацию...');
    
    const promises = actions.map(action =>
      client.query(
        'INSERT INTO activity_log (user_id, action, xp_earned, description) VALUES ($1, $2, $3, $4)',
        [user.id, action.action, action.xp_earned, action.description]
      )
    );
    
    await Promise.all(promises);
    
    // Подсчитываем общий XP
    const totalXP = actions.reduce((sum, action) => sum + action.xp_earned, 0);
    
    // Обновляем или создаем запись в user_progress
    await client.query(
      `INSERT INTO user_progress (user_id, login_streak, last_activity, xp) 
       VALUES ($1, 1, CURRENT_TIMESTAMP, $2) 
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         login_streak = user_progress.login_streak + 1, 
         last_activity = CURRENT_TIMESTAMP,
         xp = user_progress.xp + $2`,
      [user.id, totalXP]
    );
    
    console.log(`✅ Геймификация выполнена!`);
    console.log(`🎯 Общий XP: ${totalXP}`);
    console.log(`📊 Действий: ${actions.length}`);
    console.log(`🔥 Новый streak: ${newStreak}`);
    
    // 7. Проверяем результат
    console.log('\n📊 Проверяем результат...');
    
    const newActivityResult = await client.query(
      'SELECT COUNT(*) as count FROM activity_log WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE',
      [user.id]
    );
    
    const newTodayActivities = parseInt(newActivityResult.rows[0].count);
    console.log(`📈 Записей за сегодня после геймификации: ${newTodayActivities}`);
    
    const newProgressResult = await client.query(
      'SELECT * FROM user_progress WHERE user_id = $1',
      [user.id]
    );
    
    if (newProgressResult.rows.length > 0) {
      const newProgress = newProgressResult.rows[0];
      console.log(`✅ Новый прогресс: XP=${newProgress.xp}, Streak=${newProgress.login_streak}`);
    }
    
    client.release();
    
    console.log('\n🎯 РЕЗУЛЬТАТ: Геймификация на Supabase работает!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

testSupabaseGamification(); 