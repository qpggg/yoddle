import { Client } from 'pg';

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

      // Валидация типов данных
      if (typeof user_id !== 'number' || typeof action !== 'string') {
        await client.end();
        return res.status(400).json({ 
          success: false, 
          error: 'Неверный формат данных' 
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

      console.log('Activity API POST: Добавление активности для user_id:', user_id, 'action:', action);

      // Вставляем новую запись активности
      const insertQuery = `
        INSERT INTO activity_log (user_id, action, xp_earned, description, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING id, created_at;
      `;

      const insertResult = await client.query(insertQuery, [
        user_id, 
        action, 
        xpValue, 
        description || null
      ]);

      console.log('Activity API POST: Активность добавлена:', insertResult.rows[0]);

      // Обновляем общий прогресс пользователя (если таблица user_progress существует)
      try {
        const updateProgressQuery = `
          UPDATE user_progress 
          SET 
            xp = xp + $2,
            last_activity = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1;
        `;
        
        await client.query(updateProgressQuery, [user_id, xpValue]);
        console.log('Activity API POST: Прогресс пользователя обновлен');
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
          user_id: user_id,
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