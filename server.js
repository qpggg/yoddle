import express from 'express';
import cors from 'cors';
import { Client } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import newsRouter from './api/news.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3000;

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

// Базовая функция для создания клиента БД - хардкод для избежания проблем с .env
function createDbClient() {
  const connectionString = 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';
  
  return new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

// POST /api/login - точно как в api/login.js
app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password required' });
  }

  const client = createDbClient();

  try {
    await client.connect();
    const result = await client.query(
      'SELECT * FROM enter WHERE login = $1 AND password = $2',
      [login, password]
    );
    await client.end();

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login or password' });
    }

    return res.status(200).json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Database connection error' });
  }
});

// GET /api/activity - точно как в api/activity.js
app.get('/api/activity', async (req, res) => {
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

    // Получаем данные активности из базы данных
    const query = `
      SELECT 
        EXTRACT(DAY FROM created_at) as day,
        COUNT(*) as total_actions
      FROM activity_log 
      WHERE user_id = $1 
        AND EXTRACT(YEAR FROM created_at) = $2 
        AND EXTRACT(MONTH FROM created_at) = $3
      GROUP BY EXTRACT(DAY FROM created_at)
      ORDER BY day;
    `;

    const result = await client.query(query, [user_id, targetYear, targetMonth]);

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

    await client.end();

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

// GET/POST/PATCH /api/progress - точно как в api/progress.js
app.get('/api/progress', async (req, res) => {
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
    
    // Получаем ВСЕ достижения из БД с информацией о том, какие разблокированы
    const achievementsResult = await client.query(`
      SELECT 
        a.code as id,
        a.name as title,
        a.description,
        a.icon,
        a.xp_reward as points,
        a.tier,
        a.requirement_type,
        a.requirement_value,
        a.requirement_action,
        CASE WHEN ua.achievement_id IS NOT NULL THEN true ELSE false END as unlocked,
        ua.unlocked_at
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.code = ua.achievement_id AND ua.user_id = $1
      WHERE a.is_active = true
      ORDER BY a.tier ASC, a.xp_reward ASC
    `, [user_id]);
    
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
    await client.end();
    return res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/progress', async (req, res) => {
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
    
    await client.query(
      `UPDATE user_progress SET ${field} = $2, last_activity = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [user_id, value]
    );
    
    await client.end();
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Database error:', error);
    await client.end();
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
    await client.end();
    return res.status(200).json({ benefits: result.rows });
  } catch (error) {
    await client.end();
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
    await client.end();
    return res.status(200).json({ success: true });
  } catch (error) {
    await client.end();
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
    await client.end();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ошибка базы данных:', error);
    await client.end();
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

// Подключаем API новостей
app.use('/api/news', newsRouter);

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Local backend server running on http://localhost:${PORT}`);
  console.log(`📊 Database: Connected to Supabase`);
  console.log(`📰 News API: Available at /api/news`);
  console.log(`👤 Profile API: Available at /api/profile`);
  console.log(`📢 Notifications API: Available at /api/notifications`);
  console.log(`🎯 Recommendations API: Available at /api/user-recommendations`);
}); 