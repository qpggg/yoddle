import { Client } from 'pg';

function createDbClient() {
  const connectionString = 'postgresql://postgres.wbgagyckqpkeemztsgka:22kiKggfEG2haS5x@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';
  
  return new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

export default async (req, res) => {
  // Добавляем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Получить рекомендации пользователя
    let client;
    try {
      const { user_id } = req.query;
      
      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      client = createDbClient();
      await client.connect();
      
      const result = await client.query(
        'SELECT * FROM user_recommendations WHERE user_id = $1 ORDER BY test_date DESC, priority ASC',
        [user_id]
      );

      // Группируем по test_date чтобы взять самые последние результаты
      const latestResults = result.rows.length > 0 ? 
        result.rows.filter(row => row.test_date === result.rows[0].test_date) : [];

      res.status(200).json({ 
        recommendations: latestResults,
        hasRecommendations: latestResults.length > 0 
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Database error: ' + error.message });
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (e) {
          console.error('Error closing client:', e);
        }
      }
    }
  }

  else if (req.method === 'POST') {
    // Сохранить новые рекомендации
    let client;
    try {
      const { user_id, recommendations, answers } = req.body;
      
      if (!user_id || !recommendations || !Array.isArray(recommendations)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      client = createDbClient();
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

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving recommendations:', error);
      res.status(500).json({ error: 'Database error: ' + error.message });
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (e) {
          console.error('Error closing client:', e);
        }
      }
    }
  }

  else if (req.method === 'DELETE') {
    // Удалить рекомендации пользователя
    let client;
    try {
      const { user_id } = req.body;
      
      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      client = createDbClient();
      await client.connect();
      await client.query(
        'DELETE FROM user_recommendations WHERE user_id = $1',
        [user_id]
      );

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting recommendations:', error);
      res.status(500).json({ error: 'Database error: ' + error.message });
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (e) {
          console.error('Error closing client:', e);
        }
      }
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}; 