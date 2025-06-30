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
      
      // Получаем рекомендованные льготы с их данными
      const result = await client.query(`
        SELECT br.benefit_id, br.priority, b.name, b.description, b.category
        FROM benefit_recommendations br
        JOIN benefits b ON br.benefit_id = b.id
        WHERE br.user_id = $1
        ORDER BY br.priority ASC
      `, [user_id]);

      console.log('Loaded recommendations for user', user_id, ':', result.rows);

      res.status(200).json({ 
        recommendations: result.rows,
        hasRecommendations: result.rows.length > 0 
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
      const { user_id, benefit_ids, answers } = req.body;
      
      if (!user_id || !benefit_ids || !Array.isArray(benefit_ids)) {
        return res.status(400).json({ error: 'Invalid data format. Expected user_id and benefit_ids array.' });
      }

      client = createDbClient();
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
      
      console.log('All benefit recommendations saved successfully');

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving benefit recommendations:', error);
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
        'DELETE FROM benefit_recommendations WHERE user_id = $1',
        [user_id]
      );

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting benefit recommendations:', error);
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