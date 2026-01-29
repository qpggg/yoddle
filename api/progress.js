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
          'INSERT INTO user_progress (user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, onboarding_completed, tour_completed) VALUES ($1, 25, 1, 1, 1, 0, 50, false, false)',
          [user_id]
        );
        
        // Добавляем достижение "Первые шаги"
        await client.query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [user_id, 'first_login']
        );
        
        // Перезапрашиваем данные из БД, чтобы получить все поля включая onboarding_completed и tour_completed
        const newProgressResult = await client.query(
          'SELECT * FROM user_progress WHERE user_id = $1',
          [user_id]
        );
        progress = newProgressResult.rows[0];
      }
      
      // Гарантируем что boolean поля всегда имеют правильные значения (не NULL)
      if (progress) {
        progress.onboarding_completed = progress.onboarding_completed === true || progress.onboarding_completed === 'true' || progress.onboarding_completed === 1 || progress.onboarding_completed === 't' || progress.onboarding_completed === 'T';
        progress.tour_completed = progress.tour_completed === true || progress.tour_completed === 'true' || progress.tour_completed === 1 || progress.tour_completed === 't' || progress.tour_completed === 'T';
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
        
        // Проверяем, повысился ли уровень
        const oldLevel = currentProgress.level;
        const levelIncreased = newLevel > oldLevel;
        
        await client.query(
          'UPDATE user_progress SET xp = $2, level = $3, last_activity = CURRENT_TIMESTAMP WHERE user_id = $1',
          [user_id, newXP, newLevel]
        );
        
        currentProgress = { ...currentProgress, xp: newXP, level: newLevel };
        
        // 🎯 ЛОГИРОВАНИЕ ПОВЫШЕНИЯ УРОВНЯ
        if (levelIncreased) {
          // Получаем XP из activity_types для level_up
          const xpResult = await client.query(
            'SELECT xp_earned FROM activity_types WHERE action = $1',
            ['level_up']
          );
          
          const levelUpXP = xpResult.rows.length > 0 ? xpResult.rows[0].xp_earned : 100;
          
          // Логируем повышение уровня
          await client.query(
            'INSERT INTO activity_log (user_id, action, xp_earned, description) VALUES ($1, $2, $3, $4)',
            [user_id, 'level_up', levelUpXP, `Повышение уровня: ${oldLevel} → ${newLevel}`]
          );
          
          // Обновляем XP в user_progress (дополнительные XP за повышение уровня)
          await client.query(
            'UPDATE user_progress SET xp = xp + $2 WHERE user_id = $1',
            [user_id, levelUpXP]
          );
          
          // Обновляем currentProgress
          currentProgress.xp += levelUpXP;
          
          console.log(`🎉 Уровень повышен! ${oldLevel} → ${newLevel}. Начислено ${levelUpXP} XP`);
        }
      }
      
      // УЛУЧШЕННАЯ ЛОГИКА РАЗБЛОКИРОВКИ ДОСТИЖЕНИЙ
      const achievementsToUnlock = [];
      
      // Получаем все достижения с их требованиями
      const allAchievements = await client.query(`
        SELECT code, requirement_type, requirement_value, requirement_action
        FROM achievements 
        WHERE is_active = true
      `);
      
      // Получаем уже разблокированные достижения
      const unlockedAchievements = await client.query(
        'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
        [user_id]
      );
      const unlockedIds = unlockedAchievements.rows.map(row => row.achievement_id);
      
      // Проверяем каждое достижение
      for (const achievement of allAchievements.rows) {
        if (unlockedIds.includes(achievement.code)) continue; // Уже разблокировано
        
        let shouldUnlock = false;
        
        switch (achievement.requirement_type) {
          case 'total_xp':
            shouldUnlock = currentProgress.xp >= achievement.requirement_value;
            break;
            
          case 'count':
            if (achievement.requirement_action === 'benefit_added' && action === 'benefit_added') {
              // Подсчитываем количество льгот пользователя
              const benefitsCount = await client.query(
                'SELECT COUNT(*) FROM user_benefits WHERE user_id = $1',
                [user_id]
              );
              shouldUnlock = parseInt(benefitsCount.rows[0].count) >= achievement.requirement_value;
            }
            break;
            
          case 'streak':
            if (achievement.requirement_action === 'login') {
              shouldUnlock = currentProgress.login_streak >= achievement.requirement_value;
            }
            break;
            
          case 'custom':
            if (achievement.code === 'profile_complete' && action === 'profile_update') {
              shouldUnlock = currentProgress.profile_completion >= achievement.requirement_value;
            }
            break;
        }
        
        if (shouldUnlock) {
          achievementsToUnlock.push(achievement.code);
        }
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
      
      const allowedFields = ['login_streak', 'days_active', 'benefits_used', 'profile_completion', 'onboarding_completed', 'tour_completed'];
      if (!allowedFields.includes(field)) {
        return res.status(400).json({ error: 'Invalid field' });
      }
      
      // Проверяем существует ли запись user_progress для этого пользователя
      const checkProgressResult = await client.query(
        'SELECT * FROM user_progress WHERE user_id = $1',
        [user_id]
      );
      
      // Если записи нет, создаем базовую запись (как в GET)
      if (checkProgressResult.rows.length === 0) {
        await client.query(
          'INSERT INTO user_progress (user_id, xp, level, login_streak, days_active, benefits_used, profile_completion, onboarding_completed, tour_completed) VALUES ($1, 25, 1, 1, 1, 0, 50, false, false)',
          [user_id]
        );
        console.log(`📝 Created user_progress record for user ${user_id}`);
      }
      
      // Приводим значение к правильному типу для boolean полей
      let finalValue = value;
      if (field === 'onboarding_completed' || field === 'tour_completed') {
        // Явно приводим к boolean
        finalValue = value === true || value === 'true' || value === 1 || value === '1';
      }
      
      // Для boolean полей используем явное приведение типа в PostgreSQL
      let updateQuery;
      if (field === 'onboarding_completed' || field === 'tour_completed') {
        // Явно приводим к boolean типу в PostgreSQL
        updateQuery = `UPDATE user_progress SET ${field} = $2::boolean, last_activity = CURRENT_TIMESTAMP`;
      } else {
        updateQuery = `UPDATE user_progress SET ${field} = $2, last_activity = CURRENT_TIMESTAMP`;
      }
      const queryParams = [user_id, finalValue];
      
      if (field === 'onboarding_completed' && finalValue === true) {
        updateQuery += ', onboarding_completed_at = CURRENT_TIMESTAMP';
      }
      if (field === 'tour_completed' && finalValue === true) {
        updateQuery += ', tour_completed_at = CURRENT_TIMESTAMP';
      }
      
      updateQuery += ' WHERE user_id = $1';
      
      console.log(`🔄 Executing query: ${updateQuery} with params: [${user_id}, ${finalValue} (${typeof finalValue})]`);
      const result = await client.query(updateQuery, queryParams);
      
      // Проверяем что обновление прошло успешно
      if (result.rowCount === 0) {
        await client.end();
        return res.status(500).json({ error: 'Failed to update user progress' });
      }
      
      // Логируем успешное обновление для отладки
      console.log(`✅ Updated ${field} to ${value} (type: ${typeof value}) for user ${user_id}`);
      
      // Проверяем что значение действительно обновилось - получаем полную запись
      const checkResult = await client.query(
        `SELECT * FROM user_progress WHERE user_id = $1`,
        [user_id]
      );
      const updatedProgress = checkResult.rows[0];
      const actualValue = updatedProgress?.[field];
      
      console.log(`✅ Verified update for user ${user_id}:`);
      console.log(`   ${field} = ${actualValue} (type: ${typeof actualValue})`);
      console.log(`   Full progress:`, {
        onboarding_completed: updatedProgress?.onboarding_completed,
        tour_completed: updatedProgress?.tour_completed,
        onboarding_completed_at: updatedProgress?.onboarding_completed_at,
        tour_completed_at: updatedProgress?.tour_completed_at
      });
      
      await client.end();
      
      return res.status(200).json({ 
        success: true, 
        updated_value: actualValue,
        progress: updatedProgress
      });
      
    } catch (error) {
      console.error('❌ Database error in PATCH /api/progress:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        user_id,
        field,
        value
      });
      await client.end();
      return res.status(500).json({ 
        error: 'Database error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 