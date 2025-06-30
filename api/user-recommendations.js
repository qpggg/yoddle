const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'yoddle',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // Получить рекомендации пользователя
    try {
      const { user_id } = req.query;
      
      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      const result = await pool.query(
        'SELECT * FROM user_recommendations WHERE user_id = $1 ORDER BY test_date DESC, priority ASC',
        [user_id]
      );

      // Группируем по test_date чтобы взять самые последние результаты
      const latestResults = result.rows.length > 0 ? 
        result.rows.filter(row => row.test_date === result.rows[0].test_date) : [];

      res.json({ 
        recommendations: latestResults,
        hasRecommendations: latestResults.length > 0 
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  else if (req.method === 'POST') {
    // Сохранить новые рекомендации
    try {
      const { user_id, recommendations, answers } = req.body;
      
      if (!user_id || !recommendations || !Array.isArray(recommendations)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      // Удаляем старые рекомендации пользователя
      await pool.query(
        'DELETE FROM user_recommendations WHERE user_id = $1',
        [user_id]
      );

      // Mapping категорий из фронтенда в БД
      const categoryMapping = {
        'Здоровье': 'health',
        'Обучение': 'education',
        'Спорт': 'sports', 
        'Психология': 'psychology',
        'Социальная поддержка': 'social',
        'Отдых': 'wellness'
      };

      // Сохраняем новые рекомендации
      const insertPromises = recommendations.map((rec, index) => {
        const category = categoryMapping[rec.category] || rec.category.toLowerCase();
        
        return pool.query(
          'INSERT INTO user_recommendations (user_id, category, priority, answers) VALUES ($1, $2, $3, $4)',
          [user_id, category, index + 1, JSON.stringify(answers)]
        );
      });

      await Promise.all(insertPromises);

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving recommendations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  else if (req.method === 'DELETE') {
    // Удалить рекомендации пользователя
    try {
      const { user_id } = req.body;
      
      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      await pool.query(
        'DELETE FROM user_recommendations WHERE user_id = $1',
        [user_id]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting recommendations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}; 