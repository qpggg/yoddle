import { Client } from 'pg';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, year, month } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

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
    // Считаем действия из разных таблиц:
    // 1. user_benefits (добавление льгот)
    // 2. activity_log (журнал всех действий пользователя)
    const query = `
      WITH activity_data AS (
        -- Действия с льготами
        SELECT 
          EXTRACT(DAY FROM created_at) as day,
          COUNT(*) as actions
        FROM user_benefits 
        WHERE user_id = $1 
          AND EXTRACT(YEAR FROM created_at) = $2 
          AND EXTRACT(MONTH FROM created_at) = $3
        GROUP BY EXTRACT(DAY FROM created_at)
        
        UNION ALL
        
        -- Действия из журнала активности (входы в систему, обновления профиля и т.д.)
        SELECT 
          EXTRACT(DAY FROM created_at) as day,
          COUNT(*) as actions
        FROM activity_log 
        WHERE user_id = $1 
          AND EXTRACT(YEAR FROM created_at) = $2 
          AND EXTRACT(MONTH FROM created_at) = $3
        GROUP BY EXTRACT(DAY FROM created_at)
      )
      SELECT 
        day,
        SUM(actions) as total_actions
      FROM activity_data
      GROUP BY day
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
} 