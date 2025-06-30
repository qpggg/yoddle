const { Client } = require('pg');

function createDbClient() {
  const connectionString = 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';
  
  return new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // Получить рекомендации пользователя
    const client = createDbClient();
    try {
      const { user_id } = req.query;
      
      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      await client.connect();
      const result = await client.query(
        'SELECT * FROM user_recommendations WHERE user_id = $1 ORDER BY test_date DESC, priority ASC',
        [user_id]
      );

      // Группируем по test_date чтобы взять самые последние результаты
      const latestResults = result.rows.length > 0 ? 
        result.rows.filter(row => row.test_date === result.rows[0].test_date) : [];

      await client.end();
      res.json({ 
        recommendations: latestResults,
        hasRecommendations: latestResults.length > 0 
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      await client.end();
      res.status(500).json({ error: 'Database error: ' + error.message });
    }
  }

  else if (req.method === 'POST') {
    // Сохранить новые рекомендации
    const client = createDbClient();
    try {
      const { user_id, recommendations, answers } = req.body;
      
      if (!user_id || !recommendations || !Array.isArray(recommendations)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      await client.connect();

      // Удаляем старые рекомендации пользователя
      await client.query(
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
      for (let i = 0; i < recommendations.length; i++) {
        const rec = recommendations[i];
        const category = categoryMapping[rec.category] || rec.category.toLowerCase();
        
        await client.query(
          'INSERT INTO user_recommendations (user_id, category, priority, answers) VALUES ($1, $2, $3, $4)',
          [user_id, category, i + 1, JSON.stringify(answers)]
        );
      }

      await client.end();
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving recommendations:', error);
      await client.end();
      res.status(500).json({ error: 'Database error: ' + error.message });
    }
  }

  else if (req.method === 'DELETE') {
    // Удалить рекомендации пользователя
    const client = createDbClient();
    try {
      const { user_id } = req.body;
      
      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      await client.connect();
      await client.query(
        'DELETE FROM user_recommendations WHERE user_id = $1',
        [user_id]
      );

      await client.end();
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting recommendations:', error);
      await client.end();
      res.status(500).json({ error: 'Database error: ' + error.message });
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}; 