import express from 'express';
import cors from 'cors';
import { Client, Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import newsRouter from './api/news.js';
import { validateLogin, validateUser, validateProgress, validateActivityParams, validateClient, rateLimit } from './middleware/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// 🔍 ОТЛАДКА: Проверяем загрузку .env
console.log('🔍 DEBUG: .env loaded, PG_CONNECTION_STRING =', process.env.PG_CONNECTION_STRING);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// === Раздача статики фронта ===
import path from 'path';
app.use(express.static(path.join(__dirname, 'dist')));

// Для SPA: отдавать index.html на все не-API запросы
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 🚀 ОПТИМИЗИРОВАННЫЙ ПУЛ СОЕДИНЕНИЙ БД
let dbPool = null;

function createDbPool() {
  if (!dbPool) {
    const connectionString = process.env.PG_CONNECTION_STRING || 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';
    
    // 🔍 ОТЛАДКА: Показываем какую строку подключения используем
    console.log('🔍 DEBUG: PG_CONNECTION_STRING =', process.env.PG_CONNECTION_STRING);
    console.log('🔍 DEBUG: Using connection string =', connectionString);
    
    // Для локальной БД не нужен SSL
    const isLocalDb = connectionString.includes('localhost');
    console.log('🔍 DEBUG: isLocalDb =', isLocalDb);
    
    dbPool = new Pool({
      connectionString,
      ssl: isLocalDb ? false : { rejectUnauthorized: false },
      max: 20, // Максимум соединений
      idleTimeoutMillis: 30000, // Время жизни неактивного соединения
      connectionTimeoutMillis: 2000 // Таймаут подключения
    });
  }
  return dbPool;
}

// 🚀 КЭШ ПОЛЬЗОВАТЕЛЕЙ ДЛЯ БЫСТРОГО ВХОДА
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

function getUserFromCache(login) {
  const cached = userCache.get(login);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }
  return null;
}

function setUserInCache(login, user) {
  userCache.set(login, {
    user: { ...user },
    timestamp: Date.now()
  });
}

function setUserWithPasswordInCache(login, user) {
  userCache.set(login, {
    user: { ...user },
    timestamp: Date.now()
  });
}

// Базовая функция для создания клиента БД - используем переменную окружения
function createDbClient() {
  return createDbPool();
}

// POST /api/login - безопасная аутентификация
app.post('/api/login', rateLimit, validateLogin, async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password required' });
  }

  const client = createDbClient();

  try {
    // 🚀 Проверяем кэш сначала
    let user = getUserFromCache(login);
    
    if (!user) {
      // Если нет в кэше, запрашиваем из БД
      const userResult = await client.query(
        'SELECT id, name, login, phone, position, avatar_url, password FROM enter WHERE login = $1',
        [login]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid login or password' });
      }

      user = userResult.rows[0];
      // Сохраняем в кэш с паролем для быстрой проверки
      setUserWithPasswordInCache(login, user);
    }
    
    // Проверяем пароль (поддержка как хешированных, так и открытых паролей для миграции)
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
});

// POST /api/gamification/login - оптимизированная геймификация входа
app.post('/api/gamification/login', async (req, res) => {
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  const client = createDbClient();

  try {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
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
    
    // Обновляем streak параллельно
    promises.push(
      client.query(
        'UPDATE user_progress SET login_streak = login_streak + 1, last_activity = CURRENT_TIMESTAMP WHERE user_id = $1',
        [user_id]
      )
    );
    
    // Ждем завершения всех операций
    await Promise.all(promises);
    
    // Подсчитываем общий XP
    const totalXP = actions.reduce((sum, action) => sum + action.xp_earned, 0);
    
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
    return res.status(500).json({ error: 'Gamification error' });
  }
});

// GET /api/activity - оптимизированный endpoint
app.get('/api/activity', rateLimit, validateActivityParams, async (req, res) => {
  const { user_id, year, month } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  const client = createDbClient();

  try {
    await client.connect();
    
    // Определяем текущий месяц и год, если не переданы
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    console.log('Activity API: user_id =', user_id, 'year =', targetYear, 'month =', targetMonth);

    // Получаем количество дней в месяце
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    
    // Создаем массив для всех дней месяца
    const dailyActivity = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      actions: 0
    }));

    // Получаем данные активности через оптимизированную функцию
    const result = await client.query(
      'SELECT * FROM get_user_activity($1, $2, $3)',
      [user_id, targetYear, targetMonth]
    );

    console.log('Activity API: Результат запроса:', result.rows);

    // Заполняем данные активности
    result.rows.forEach(row => {
      const dayIndex = parseInt(row.day) - 1;
      if (dayIndex >= 0 && dayIndex < daysInMonth) {
        dailyActivity[dayIndex].actions = parseInt(row.total_actions);
      }
    });

    // Получаем название месяца
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    res.status(200).json({
      success: true,
      data: dailyActivity,
      month: monthNames[targetMonth - 1],
      year: targetYear,
      totalActions: dailyActivity.reduce((sum, day) => sum + day.actions, 0)
    });

  } catch (error) {
    console.error('Ошибка получения данных активности:', error);
    await client.end();
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/benefits - точно как в api/benefits.js
app.get('/api/benefits', async (req, res) => {
  const client = createDbClient();

  try {
    await client.connect();
    const result = await client.query('SELECT id, name, description, category FROM benefits ORDER BY category, name');
    await client.end();
    return res.status(200).json({ benefits: result.rows });
  } catch (error) {
    console.error('Database error:', error);
    await client.end();
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET/POST/PATCH /api/progress - оптимизированные endpoints
app.get('/api/progress', rateLimit, validateUser, async (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  const client = createDbClient();

  try {
    await client.connect();
    
    // Получаем прогресс пользователя
    const progressResult = await client.query(
      'SELECT * FROM user_progress WHERE user_id = $1',
      [user_id]
    );
    
    // Получаем достижения пользователя через оптимизированную функцию
    const achievementsResult = await client.query(
      'SELECT * FROM get_user_achievements($1)',
      [user_id]
    );
    
    // Если прогресса нет, создаем базовый
    let progress = progressResult.rows[0];
    if (!progress) {
      await client.query(
        'INSERT INTO user_progress (user_id, xp, level, login_streak, days_active, benefits_used, profile_completion) VALUES ($1, 25, 1, 1, 1, 0, 50)',
        [user_id]
      );
      
      // Добавляем достижение "Первые шаги"
      await client.query(
        'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user_id, 'first_login']
      );
      
      progress = {
        user_id,
        xp: 25,
        level: 1,
        login_streak: 1,
        days_active: 1,
        benefits_used: 0,
        profile_completion: 50
      };
    }
    
    await client.end();
    
    return res.status(200).json({ 
      progress,
      achievements: achievementsResult.rows,
      unlockedAchievements: achievementsResult.rows.filter(a => a.unlocked).map(a => a.id)
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/progress', rateLimit, validateProgress, async (req, res) => {
  const { user_id, xp_to_add, action } = req.body;
  
  if (!user_id || !xp_to_add) {
    return res.status(400).json({ error: 'user_id and xp_to_add required' });
  }

  const client = createDbClient();

  try {
    await client.connect();
    
    // Получаем текущий прогресс
    const currentProgressResult = await client.query(
      'SELECT * FROM user_progress WHERE user_id = $1',
      [user_id]
    );
    
    let currentProgress = currentProgressResult.rows[0];
    
    if (!currentProgress) {
      // Создаем начальный прогресс
      await client.query(
        'INSERT INTO user_progress (user_id, xp, level, login_streak, days_active, benefits_used, profile_completion) VALUES ($1, $2, 1, 1, 1, 0, 50)',
        [user_id, xp_to_add]
      );
      currentProgress = { xp: xp_to_add, level: 1 };
    } else {
      // Обновляем опыт
      const newXP = currentProgress.xp + xp_to_add;
      
      // Рассчитываем новый уровень
      let newLevel = 1;
      if (newXP >= 1001) newLevel = 5;
      else if (newXP >= 501) newLevel = 4;
      else if (newXP >= 301) newLevel = 3;
      else if (newXP >= 101) newLevel = 2;
      
      await client.query(
        'UPDATE user_progress SET xp = $2, level = $3, last_activity = CURRENT_TIMESTAMP WHERE user_id = $1',
        [user_id, newXP, newLevel]
      );
      
      currentProgress = { ...currentProgress, xp: newXP, level: newLevel };
    }
    
    // Проверяем и разблокируем достижения
    const achievementsToUnlock = [];
    
    // Логика достижений
    if (action === 'profile_complete' && !achievementsToUnlock.includes('profile_complete')) {
      achievementsToUnlock.push('profile_complete');
    }
    
    if (action === 'first_benefit' && !achievementsToUnlock.includes('first_benefit')) {
      achievementsToUnlock.push('first_benefit');
    }
    
    if (currentProgress.xp >= 300 && !achievementsToUnlock.includes('streak_week')) {
      achievementsToUnlock.push('streak_week');
    }
    
    // Разблокируем достижения
    for (const achievementId of achievementsToUnlock) {
      await client.query(
        'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user_id, achievementId]
      );
    }
    
    await client.end();
    
    return res.status(200).json({ 
      success: true, 
      newXP: currentProgress.xp,
      newLevel: currentProgress.level,
      unlockedAchievements: achievementsToUnlock
    });
    
  } catch (error) {
    console.error('Database error:', error);
    await client.end();
    return res.status(500).json({ error: 'Database error' });
  }
});

app.patch('/api/progress', async (req, res) => {
  const { user_id, field, value } = req.body;
  
  if (!user_id || !field) {
    return res.status(400).json({ error: 'user_id and field required' });
  }

  const client = createDbClient();

  try {
    await client.connect();
    
    const allowedFields = ['login_streak', 'days_active', 'benefits_used', 'profile_completion'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid field' });
    }
    
    // 🚀 Поддержка increment для увеличения значения на 1
    if (value === 'increment') {
      await client.query(
        `UPDATE user_progress SET ${field} = ${field} + 1, last_activity = CURRENT_TIMESTAMP WHERE user_id = $1`,
        [user_id]
      );
    } else {
      await client.query(
        `UPDATE user_progress SET ${field} = $2, last_activity = CURRENT_TIMESTAMP WHERE user_id = $1`,
        [user_id, value]
      );
    }
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET/POST /api/user-benefits - точно как в api/user-benefits.js
app.get('/api/user-benefits', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  
  const client = createDbClient();
  
  try {
    await client.connect();
    const result = await client.query(
      `SELECT b.id, b.name FROM user_benefits ub
       JOIN benefits b ON ub.benefit_id = b.id
       WHERE ub.user_id = $1`,
      [user_id]
    );
    return res.status(200).json({ benefits: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/user-benefits', async (req, res) => {
  const { user_id, benefit_id } = req.body;
  if (!user_id || !benefit_id) return res.status(400).json({ error: 'user_id and benefit_id required' });
  
  const client = createDbClient();
  
  try {
    await client.connect();
    await client.query(
      'INSERT INTO user_benefits (user_id, benefit_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user_id, benefit_id]
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/clients - точно как в api/clients.js
app.post('/api/clients', async (req, res) => {
  const { name, email, company, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Имя, email и сообщение обязательны' });
  }

  const client = createDbClient();

  try {
    await client.connect();
    await client.query(
      'INSERT INTO clients (name, email, company, message) VALUES ($1, $2, $3, $4)',
      [name, email, company, message]
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ошибка базы данных:', error);
    return res.status(500).json({ error: 'Ошибка базы данных' });
  }
});

// GET/PATCH /api/profile - точно как в api/profile.js
app.get('/api/profile', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });
  
  const client = createDbClient();
  
  try {
    await client.connect();
    const result = await client.query(
      'SELECT id, name, login AS email, phone, position, avatar_url AS avatar FROM enter WHERE id = $1',
      [id]
    );
    await client.end();
    return res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    await client.end();
    console.error('Profile GET error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.patch('/api/profile', async (req, res) => {
  const { id, name, email, phone, position, avatar } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  
  const client = createDbClient();
  
  try {
    await client.connect();
    await client.query(
      'UPDATE enter SET name = $2, login = $3, phone = $4, position = $5, avatar_url = $6 WHERE id = $1',
      [id, name, email, phone, position, avatar]
    );
    const result = await client.query(
      'SELECT id, name, login AS email, phone, position, avatar_url AS avatar FROM enter WHERE id = $1',
      [id]
    );
    await client.end();
    return res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    await client.end();
    console.error('Profile PATCH error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/notifications - система уведомлений
app.get('/api/notifications', async (req, res) => {
  const { action, user_id, limit } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }
  
  const client = createDbClient();
  
  try {
    await client.connect();
    
    if (action === 'count') {
      const result = await client.query(
        `SELECT COUNT(*) as count 
         FROM notifications 
         WHERE (user_id = $1 OR is_global = true) AND is_read = false`,
        [user_id]
      );
      await client.end();
      return res.status(200).json({
        success: true,
        count: parseInt(result.rows[0].count)
      });
    }
    
    if (action === 'unread') {
      const result = await client.query(
        `SELECT * FROM notifications 
         WHERE (user_id = $1 OR is_global = true) AND is_read = false
         ORDER BY created_at DESC`,
        [user_id]
      );
      await client.end();
      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    }
    
    // recent notifications
    const limitValue = parseInt(limit) || 10;
    const result = await client.query(
      `SELECT * FROM notifications
       WHERE (user_id = $1 OR is_global = true)
       ORDER BY created_at DESC
       LIMIT $2`,
      [user_id, limitValue]
    );
    await client.end();
    return res.status(200).json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    await client.end();
    console.error('Notifications error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET/POST/DELETE /api/user-recommendations
app.get('/api/user-recommendations', async (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  const client = createDbClient();
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT br.benefit_id, br.priority, b.name, b.description, b.category
      FROM benefit_recommendations br
      JOIN benefits b ON br.benefit_id = b.id
      WHERE br.user_id = $1
      ORDER BY br.priority ASC
    `, [user_id]);
    
    await client.end();
    
    console.log('Loaded recommendations for user', user_id, ':', result.rows);
    
    res.status(200).json({ 
      recommendations: result.rows,
      hasRecommendations: result.rows.length > 0 
    });
  } catch (error) {
    await client.end();
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

app.post('/api/user-recommendations', async (req, res) => {
  const { user_id, benefit_ids, answers } = req.body;
  
  if (!user_id || !benefit_ids || !Array.isArray(benefit_ids)) {
    return res.status(400).json({ error: 'Invalid data format. Expected user_id and benefit_ids array.' });
  }
  
  const client = createDbClient();
  
  try {
    await client.connect();
    
    // Удаляем старые рекомендации пользователя
    await client.query(
      'DELETE FROM benefit_recommendations WHERE user_id = $1',
      [user_id]
    );
    
    // Сохраняем новые рекомендации
    console.log('Saving benefit recommendations for user:', user_id);
    console.log('Benefit IDs array:', benefit_ids);
    
    for (let i = 0; i < benefit_ids.length; i++) {
      const benefitId = benefit_ids[i];
      
      console.log(`Saving recommendation ${i + 1}: benefit_id=${benefitId}, priority=${i + 1}`);
      
      await client.query(
        'INSERT INTO benefit_recommendations (user_id, benefit_id, priority, answers) VALUES ($1, $2, $3, $4)',
        [user_id, benefitId, i + 1, JSON.stringify(answers)]
      );
    }
    
    await client.end();
    console.log('All benefit recommendations saved successfully');
    
    res.status(200).json({ success: true });
  } catch (error) {
    await client.end();
    console.error('Error saving benefit recommendations:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

app.delete('/api/user-recommendations', async (req, res) => {
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  const client = createDbClient();
  
  try {
    await client.connect();
    await client.query(
      'DELETE FROM benefit_recommendations WHERE user_id = $1',
      [user_id]
    );
    await client.end();
    
    res.status(200).json({ success: true });
  } catch (error) {
    await client.end();
    console.error('Error deleting benefit recommendations:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// GET /api/check-password-hash - проверка статуса хеширования паролей
app.get('/api/check-password-hash', async (req, res) => {
  const { login } = req.query;
  
  if (!login) {
    return res.status(400).json({ error: 'login parameter required' });
  }

  const client = createDbClient();

  try {
    const result = await client.query(
      'SELECT password FROM enter WHERE login = $1',
      [login]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const password = result.rows[0].password;
    const isHashed = password && password.startsWith('$2');
    
    return res.status(200).json({ 
      isHashed,
      passwordLength: password ? password.length : 0,
      hashType: isHashed ? 'bcrypt' : 'plaintext'
    });
    
  } catch (error) {
    console.error('Password hash check error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Подключаем API новостей
app.use('/api/news', newsRouter);

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Local backend server running on http://localhost:${PORT}`);
  
  // 🔍 Показываем правильную информацию о подключении к БД
  const connectionString = process.env.PG_CONNECTION_STRING || 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';
  const isLocalDb = connectionString.includes('localhost');
  const dbName = isLocalDb ? 'Local PostgreSQL' : 'Supabase';
  console.log(`📊 Database: Connected to ${dbName}`);
  
  console.log(`📰 News API: Available at /api/news`);
  console.log(`👤 Profile API: Available at /api/profile`);
  console.log(`📢 Notifications API: Available at /api/notifications`);
  console.log(`🎯 Recommendations API: Available at /api/user-recommendations`);
}); 