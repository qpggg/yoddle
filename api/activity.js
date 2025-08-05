import { Client } from 'pg';

export default async function handler(req, res) {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    if (req.method === 'GET') {
      // Получение данных активности
      const { user_id, year, month } = req.query;
      
      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      const currentDate = new Date();
      const targetYear = year ? parseInt(year) : currentDate.getFullYear();
      const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      const dailyActivity = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        actions: 0
      }));

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

      result.rows.forEach(row => {
        const dayIndex = parseInt(row.day) - 1;
        if (dayIndex >= 0 && dayIndex < daysInMonth) {
          dailyActivity[dayIndex].actions = parseInt(row.total_actions);
        }
      });

      const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ];

      await client.end();

      return res.status(200).json({
        success: true,
        data: dailyActivity,
        month: monthNames[targetMonth - 1],
        year: targetYear,
        totalActions: dailyActivity.reduce((sum, day) => sum + day.actions, 0)
      });

    } else if (req.method === 'POST') {
      // Добавление новой активности
      const { userId, user_id, action, details, xpEarned = 0 } = req.body;
      
      const actualUserId = userId || user_id;
      
      if (!actualUserId || !action) {
        return res.status(400).json({ error: 'User ID and action required' });
      }

      // Логируем активность в существующую таблицу activity_log
      const result = await client.query(
        'INSERT INTO activity_log (user_id, action, xp_earned, description, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
        [actualUserId, action, xpEarned, details || null]
      );

      await client.end();

      return res.status(200).json({ 
        success: true, 
        activityId: result.rows[0].id 
      });

    } else {
      await client.end();
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Activity API error:', error);
    await client.end();
    return res.status(500).json({ error: 'Failed to process activity request' });
  }
} 