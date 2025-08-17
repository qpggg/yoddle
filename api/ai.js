import express from 'express';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

// Инициализация Claude API
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// POST /api/ai/analyze-mood - Анализ настроения пользователя
router.post('/analyze-mood', async (req, res) => {
  try {
    const { mood, activities, notes, stressLevel } = req.body;
    const userId = req.body.userId || 1; // Временно используем ID = 1

    // Сохраняем сигнал в БД
    const signalQuery = `
      INSERT INTO ai_signals (user_id, type, data, timestamp)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    
    const signalData = {
      mood,
      activities,
      notes,
      stressLevel,
      timestamp: new Date()
    };

    const signalResult = await pool.query(signalQuery, [
      userId,
      'mood',
      JSON.stringify(signalData),
      new Date()
    ]);

    // Анализируем с помощью Claude
    const prompt = `
      Проанализируй настроение пользователя и дай персональные рекомендации:
      
      Настроение: ${mood}/10
      Активности: ${activities.join(', ')}
      Заметки: ${notes}
      Уровень стресса: ${stressLevel}/10
      
      Дай:
      1. Краткий анализ (2-3 предложения)
      2. 3 конкретных рекомендации для улучшения
      3. Прогноз на завтра
      
      Ответ на русском языке, дружелюбный тон.
    `;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const analysis = message.content[0].text;

    // Сохраняем инсайт
    const insightQuery = `
      INSERT INTO ai_insights (user_id, type, content, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    await pool.query(insightQuery, [
      userId,
      'mood_analysis',
      analysis,
      new Date()
    ]);

    res.json({
      success: true,
      analysis,
      signalId: signalResult.rows[0].id
    });

  } catch (error) {
    console.error('AI mood analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка анализа настроения'
    });
  }
});

// GET /api/ai/insights/:userId - Получение персональных инсайтов
router.get('/insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Временно убрали проверку прав доступа для тестирования

    const insightsQuery = `
      SELECT * FROM ai_insights 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    const insightsResult = await pool.query(insightsQuery, [userId]);

    res.json({
      success: true,
      insights: insightsResult.rows
    });

  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения инсайтов'
    });
  }
});

// POST /api/ai/log-activity - Логирование активности
router.post('/log-activity', async (req, res) => {
  try {
    const { activity, category, duration, success, notes } = req.body;
    const userId = req.body.userId || 1; // Временно используем ID = 1

    // Сохраняем активность
    const activityQuery = `
      INSERT INTO ai_signals (user_id, type, data, timestamp)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const activityData = {
      activity,
      category,
      duration,
      success,
      notes,
      timestamp: new Date()
    };

    await pool.query(activityQuery, [
      userId,
      'activity',
      JSON.stringify(activityData),
      new Date()
    ]);

    // Генерируем AI рекомендацию
    const prompt = `
      Пользователь завершил активность:
      
      Активность: ${activity}
      Категория: ${category}
      Длительность: ${duration} минут
      Успех: ${success ? 'Да' : 'Нет'}
      Заметки: ${notes}
      
      Дай краткую мотивационную рекомендацию (1-2 предложения) на русском языке.
      Если неудача - поддержка и совет. Если успех - похвала и следующий шаг.
    `;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const recommendation = message.content[0].text;

    // Сохраняем рекомендацию
    const recQuery = `
      INSERT INTO ai_recommendations (user_id, category, message, priority, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await pool.query(recQuery, [
      userId,
      category,
      recommendation,
      success ? 'low' : 'high',
      new Date()
    ]);

    res.json({
      success: true,
      recommendation
    });

  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка логирования активности'
    });
  }
});

// GET /api/ai/recommendations - Получение рекомендаций
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.query.userId || 1; // Временно используем ID = 1

    const recQuery = `
      SELECT * FROM ai_recommendations 
      WHERE user_id = $1 
      ORDER BY priority DESC, created_at DESC 
      LIMIT 5
    `;

    const recResult = await pool.query(recQuery, [userId]);

    res.json({
      success: true,
      recommendations: recResult.rows
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения рекомендаций'
    });
  }
});

// POST /api/ai/generate-daily-insight - Генерация дневного инсайта
router.post('/generate-daily-insight', async (req, res) => {
  try {
    const userId = req.body.userId || 1; // Временно используем ID = 1
    console.log(`🔍 Генерация недельного инсайта для пользователя ${userId}`);

    // Получаем данные за последние 7 дней
    const dataQuery = `
      SELECT * FROM ai_signals 
      WHERE user_id = $1 
      AND timestamp >= NOW() - INTERVAL '7 days'
      ORDER BY timestamp DESC
    `;

    const dataResult = await pool.query(dataQuery, [userId]);
    console.log(`📊 Найдено записей за неделю: ${dataResult.rows.length}`);

    if (dataResult.rows.length === 0) {
      console.log('ℹ️ Нет данных для анализа');
      return res.json({
        success: true,
        insight: 'Пока недостаточно данных для анализа. Продолжайте вести дневник!'
      });
    }

    // Анализируем паттерны
    const moodData = dataResult.rows
      .filter(row => row.type === 'mood')
      .map(row => {
        try {
          return JSON.parse(row.data);
        } catch (e) {
          console.log(`⚠️ Ошибка парсинга mood данных: ${e.message}`);
          return null;
        }
      })
      .filter(Boolean);

    const activityData = dataResult.rows
      .filter(row => row.type === 'activity')
      .map(row => {
        try {
          return JSON.parse(row.data);
        } catch (e) {
          console.log(`⚠️ Ошибка парсинга activity данных: ${e.message}`);
          return null;
        }
      })
      .filter(Boolean);

    console.log(`📈 Данные настроения: ${moodData.length} записей`);
    console.log(`📝 Данные активности: ${activityData.length} записей`);

    const prompt = `
      Проанализируй данные пользователя за неделю и создай персональный инсайт:
      
      Настроение (последние 7 дней): ${moodData.map(d => d.mood || 'N/A').join(', ')}
      Активности: ${activityData.map(d => d.activity || 'N/A').join(', ')}
      
      Создай:
      1. Краткий анализ недели (3-4 предложения)
      2. Выявленные паттерны
      3. Конкретные рекомендации на следующую неделю
      4. Мотивационное сообщение
      
      Тон: дружелюбный, поддерживающий, конкретный. На русском языке.
    `;

    console.log('🤖 Отправляем запрос к Claude AI...');
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const insight = message.content[0].text;
    console.log('✅ AI ответ получен, длина:', insight.length);

    // Сохраняем инсайт
    const insightQuery = `
      INSERT INTO ai_insights (user_id, type, content, created_at)
      VALUES ($1, $2, $3, $4)
    `;

    await pool.query(insightQuery, [
      userId,
      'weekly_insight',
      insight,
      new Date()
    ]);
    console.log('💾 Инсайт сохранен в БД');

    res.json({
      success: true,
      insight
    });

  } catch (error) {
    console.error('❌ Generate daily insight error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Ошибка генерации инсайта',
      details: error.message
    });
  }
});

export default router;
