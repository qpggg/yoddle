import { Client } from 'pg';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Проверяем, это геймификация или обычный логин
  const { login, password, user_id, gamification } = req.body;
  
  // Если это запрос геймификации
  if (gamification && user_id) {
    return handleGamification(req, res, user_id);
  }
  
  // Обычный логин
  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password required' });
  }
  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password required' });
  }

  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Сначала получаем пользователя по логину
    const userResult = await client.query(
      'SELECT id, name, login AS email, phone, position, avatar_url AS avatar, password FROM enter WHERE login = $1',
      [login]
    );
    
    await client.end();

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login or password' });
    }

    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid login or password' });
    }
    
    // Проверяем пароль (если он хеширован) или сравниваем напрямую (временно)
    let passwordValid = false;
    
    if (user.password && user.password.startsWith('$2')) {
      // Пароль хеширован с bcrypt
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      // Пароль в открытом виде (временно для совместимости)
      passwordValid = password === user.password;
    }

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid login or password' });
    }

    // Удаляем пароль из ответа
    delete user.password;
    
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Database connection error' });
  }
}

// Функция геймификации
async function handleGamification(req, res, user_id) {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // 🎯 ПРОВЕРЯЕМ УЖЕ ПОЛУЧЕННЫЕ ДОСТИЖЕНИЯ
    const existingAchievements = await client.query(
      'SELECT action FROM activity_log WHERE user_id = $1 AND action IN ($2, $3, $4) AND DATE(created_at) = CURRENT_DATE',
      [user_id, 'login', 'first_login_today', 'streak_milestone']
    );
    
    const existingActions = existingAchievements.rows.map(row => row.action);
    
    // Создаем действия согласно таблице
    const actions = [];
    
    // 🔒 Вход в систему (10 XP) - всегда
    actions.push({
      action: 'login',
      xp_earned: 10,
      description: 'Вход в систему'
    });
    
    // 🌈 Первый вход за день (15 XP) - только если еще не получено сегодня
    const todayLogin = existingAchievements.rows.find(row => row.action === 'first_login_today');
    if (!todayLogin) {
      actions.push({
        action: 'first_login_today',
        xp_earned: 15,
        description: 'Первый вход за день'
      });
    }
    
    // 🔥 Серия входов (50 XP) - проверяем streak
    const progressResult = await client.query(
      'SELECT login_streak FROM user_progress WHERE user_id = $1',
      [user_id]
    );
    
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
    
    // 🚀 ВЫПОЛНЯЕМ ВСЕ ПАРАЛЛЕЛЬНО
    const promises = actions.map(action =>
      client.query(
        'INSERT INTO activity_log (user_id, action, xp_earned, description) VALUES ($1, $2, $3, $4)',
        [user_id, action.action, action.xp_earned, action.description]
      )
    );
    
    // Ждем завершения всех операций
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
      [user_id, totalXP]
    );
    
    await client.end();
    
    return res.status(200).json({ 
      success: true, 
      totalXP,
      actions: actions.length,
      bonuses: actions.filter(a => a.action !== 'login').length,
      newStreak,
      achievements: actions.map(a => a.action)
    });
    
  } catch (error) {
    console.error('Gamification error:', error);
    await client.end();
    return res.status(500).json({ error: 'Gamification error' });
  }
} 