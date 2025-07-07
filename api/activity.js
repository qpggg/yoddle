import { Client } from 'pg';

// 🏆 ФУНКЦИЯ ПРОВЕРКИ И РАЗБЛОКИРОВКИ ДОСТИЖЕНИЙ
async function checkAndUnlockAchievements(client, userId, action) {
  try {
    // Получаем текущий прогресс пользователя
    const progressResult = await client.query(
      'SELECT * FROM user_progress WHERE user_id = $1',
      [userId]
    );
    
    if (!progressResult.rows[0]) return;
    
    const currentProgress = progressResult.rows[0];
    
    // Получаем все достижения с их требованиями
    const allAchievements = await client.query(`
      SELECT code, requirement_type, requirement_value, requirement_action
      FROM achievements 
      WHERE is_active = true
    `);
    
    // Получаем уже разблокированные достижения
    const unlockedAchievements = await client.query(
      'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
      [userId]
    );
    const unlockedIds = unlockedAchievements.rows.map(row => row.achievement_id);
    
    const achievementsToUnlock = [];
    
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
              [userId]
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
        [userId, achievementId]
      );
      console.log(`🏆 Достижение ${achievementId} разблокировано для пользователя ${userId}`);
    }
    
    return achievementsToUnlock;
    
  } catch (error) {
    console.error('Ошибка проверки достижений:', error);
    return [];
  }
}

export default async function handler(req, res) {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    if (req.method === 'GET') {
      const { user_id, year, month } = req.query;

      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

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
      // Берем данные только из activity_log (где точно есть тестовые данные)
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

    } else if (req.method === 'POST') {
      // Новый POST метод для добавления активности
      const { user_id, action, xp_earned = 0, description } = req.body;

      // Валидация обязательных полей
      if (!user_id || !action) {
        await client.end();
        return res.status(400).json({ 
          success: false, 
          error: 'user_id и action обязательны' 
        });
      }

      // Валидация типов данных и конвертация user_id
      const userIdNumber = Number(user_id);
      if (isNaN(userIdNumber) || typeof action !== 'string') {
        await client.end();
        return res.status(400).json({ 
          success: false, 
          error: 'Неверный формат данных: user_id должен быть числом' 
        });
      }

      // Валидация XP (должно быть положительным числом)
      const xpValue = Number(xp_earned);
      if (isNaN(xpValue) || xpValue < 0) {
        await client.end();
        return res.status(400).json({ 
          success: false, 
          error: 'XP должно быть положительным числом' 
        });
      }

      console.log('Activity API POST: Добавление активности для user_id:', userIdNumber, 'action:', action);

      // Вставляем новую запись активности
      const insertQuery = `
        INSERT INTO activity_log (user_id, action, xp_earned, description, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING id, created_at;
      `;

      const insertResult = await client.query(insertQuery, [
        userIdNumber, 
        action, 
        xpValue, 
        description || null
      ]);

      console.log('Activity API POST: Активность добавлена:', insertResult.rows[0]);

      // Обновляем общий прогресс пользователя (если таблица user_progress существует)
      try {
        // Получаем текущий XP для расчета нового уровня
        const currentProgressResult = await client.query(
          'SELECT xp FROM user_progress WHERE user_id = $1',
          [userIdNumber]
        );
        
        const currentXP = currentProgressResult.rows[0]?.xp || 0;
        const newXP = currentXP + xpValue;
        
        // Рассчитываем новый уровень
        let newLevel = 1;
        if (newXP >= 1001) newLevel = 5;
        else if (newXP >= 501) newLevel = 4;
        else if (newXP >= 301) newLevel = 3;
        else if (newXP >= 101) newLevel = 2;

        const updateProgressQuery = `
          UPDATE user_progress 
          SET 
            xp = $2,
            level = $3,
            last_activity = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1;
        `;
        
        await client.query(updateProgressQuery, [userIdNumber, newXP, newLevel]);
        console.log(`Activity API POST: Прогресс обновлен - XP: ${newXP}, Уровень: ${newLevel}`);

        // 🏆 ПРОВЕРКА И РАЗБЛОКИРОВКА ДОСТИЖЕНИЙ
        if (xpValue > 0) {
          await checkAndUnlockAchievements(client, userIdNumber, action);
        }

      } catch (progressError) {
        console.log('Activity API POST: Таблица user_progress не найдена или ошибка обновления:', progressError.message);
        // Не прерываем выполнение, если таблица прогресса не существует
      }

      await client.end();

      res.status(201).json({
        success: true,
        message: 'Активность успешно добавлена',
        data: {
          id: insertResult.rows[0].id,
          user_id: userIdNumber,
          action: action,
          xp_earned: xpValue,
          description: description,
          created_at: insertResult.rows[0].created_at
        }
      });

    } else {
      await client.end();
      return res.status(405).json({ 
        success: false, 
        error: 'Method not allowed. Поддерживаются только GET и POST.' 
      });
    }

  } catch (error) {
    console.error('Activity API Error:', error);
    await client.end();
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера', 
      details: error.message 
    });
  }
} 