import { Client } from 'pg';

export default async function handler(req, res) {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  if (req.method === 'GET') {
    // Получить прогресс пользователя
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' });
    }

    try {
      await client.connect();
      
      // Получаем прогресс пользователя
      const progressResult = await client.query(
        'SELECT * FROM user_progress WHERE user_id = $1',
        [user_id]
      );
      
      // Получаем разблокированные достижения
      const achievementsResult = await client.query(
        'SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1',
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
        achievements: achievementsResult.rows.map(a => a.achievement_id)
      });
      
    } catch (error) {
      console.error('Database error:', error);
      await client.end();
      return res.status(500).json({ error: 'Database error' });
    }
  }

  if (req.method === 'POST') {
    // Добавить очки опыта
    const { user_id, xp_to_add, action } = req.body;
    
    if (!user_id || !xp_to_add) {
      return res.status(400).json({ error: 'user_id and xp_to_add required' });
    }

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
  }

  if (req.method === 'PATCH') {
    // Обновить специфичные статистики (например, при входе в систему)
    const { user_id, field, value } = req.body;
    
    if (!user_id || !field) {
      return res.status(400).json({ error: 'user_id and field required' });
    }

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
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 