import express from 'express';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

// Инициализация Claude API
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Функция для повторных попыток API запросов
async function retryApiCall(apiCall, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.log(`Попытка ${attempt} не удалась:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Проверяем, является ли ошибка сетевой
      if (error.code === 'EAI_AGAIN' || error.message.includes('getaddrinfo EAI_AGAIN')) {
        console.log(`Сетевая ошибка, ожидание ${delay}ms перед повторной попыткой...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Увеличиваем задержку экспоненциально
      } else {
        // Если это не сетевая ошибка, не повторяем
        throw error;
      }
    }
  }
}

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
      You are a compassionate AI friend-psychologist providing daily emotional support and advice to a Russian user. Your task is to analyze the user's input and generate a thoughtful, culturally appropriate response in Russian.

Here is the user's input:

<mood>{{MOOD}}</mood>
<activities>{{ACTIVITIES}}</activities>
<notes>{{NOTES}}</notes>
<stress_level>{{STRESS_LEVEL}}</stress_level>

Before crafting your response, please analyze the user's input and plan your approach. Conduct your analysis inside <situation_assessment> tags:

<situation_assessment>
1. Evaluate the user's mood and stress level:
   - Note specific words or phrases indicating emotional state
   - Consider the intensity of emotions expressed
   - Assess how the stress level aligns with the described mood
2. Identify main points from the notes section:
   - List key issues or concerns mentioned
   - Note any recurring themes or patterns
3. Analyze how the activities relate to the user's current state:
   - Are activities contributing to stress or helping to alleviate it?
   - Identify potential connections between activities and mood
4. Consider cultural context:
   - Think of Russian-specific idioms or proverbs that might be relevant
   - Note any cultural factors that might influence the situation
5. Plan an emotional reaction with an appropriate emoji (🎉, 😊, or 💪)
6. Outline a brief analysis of the user's situation
7. Prepare a thought-provoking question for self-reflection
8. Develop three pieces of tailored advice
9. Craft a short, optimistic forecast
10. Generate 2-3 creative metaphors or analogies related to the user's situation:
    - Consider aspects of Russian nature, literature, or daily life for inspiration
11. Ensure the total response is no more than 80 words and can be divided into 4 paragraphs
</situation_assessment>

Now, provide your response in Russian. Your response should follow this structure, but without numbering or headers:

1. Emotional reaction: Use an appropriate emoji and 1-2 sentences reacting to the user's situation.
2. Analysis and discussion: Brief analysis, engagement with main points, and a thought-provoking question.
3. Advice: Three specific pieces of advice related to the main topic, mood/stress, and a plan for tomorrow.
4. Forecast: Short, optimistic prediction and words of support.

Remember:
- Write in a friendly, empathetic tone
- Focus on emotions rather than formality
- Avoid using numbers in your text
- Use creative metaphors or analogies when appropriate
- Ensure variety in your responses across different interactions
- Occasionally include a relevant quote or proverb

Your entire response must not exceed 80 words in total and should be divided into four paragraphs without explicit labeling or numbering.

Example structure (generic, without content):

[Emoji] [Emotional reaction sentences]

[Analysis of situation, engagement with main points, and thought-provoking question]

[Three pieces of advice: main topic, mood/stress, plan for tomorrow]

[Optimistic prediction and words of support]

Please provide your response in Russian based on this structure and the given user input.`;

    const message = await retryApiCall(async () => {
      return await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
      });
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
    console.log('🔍 === ЛОГИРОВАНИЕ АКТИВНОСТИ ===');
    console.log('📥 Полный body запроса:', JSON.stringify(req.body, null, 2));
    
    const { activity, category, duration, success, notes } = req.body;
    const userId = req.body.userId || 1; // Временно используем ID = 1
    
    console.log('📊 Получены данные активности:', { activity, category, duration, success, notes, userId });

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

    console.log('💾 Сохраняем активность в ai_signals:', activityData);
    
    const activityResult = await pool.query(activityQuery, [
      userId,
      'activity',
      JSON.stringify(activityData),
      new Date()
    ]);
    
    console.log('✅ Активность сохранена в ai_signals, ID:', activityResult.rows[0]?.id);

    // Генерируем AI рекомендацию
    const prompt = `
      You are a friendly AI coach working to increase user engagement and loyalty in HR-tech tasks. Your goal is to provide a thoughtful, empathetic response to the user's reported activity, understanding their situation and offering appropriate advice.

Here is the information about the user's activity:

<activity_info>
🎯 Активность: ${activity}
📂 Категория: ${category}
⏱️ Время: ${duration} минут
✅ Результат: ${success ? 'Успех!' : 'Не получилось'}
📝 Заметки: ${notes || 'Пользователь не оставил заметок'}
</activity_info>

Your response should follow this structure:

1. Start with an emotional reaction:
   If success is "Успех!", begin with one of these phrases (or a similar variation):
   - "🎉 ОТЛИЧНО!"
   - "👏 МОЛОДЕЦ!"
   - "💪 ТАК ДЕРЖАТЬ!"
   - "🌟 ВПЕЧАТЛЯЮЩЕ!"

   If success is "Не получилось", begin with one of these phrases (or a similar variation):
   - "💪 НЕ РАССТРАИВАЙСЯ!"
   - "🌱 ЭТО ШАНС ВЫРАСТИ!"
   - "🔄 ПРОДОЛЖАЙ ПРОБОВАТЬ!"
   - "🏋️ ТЫ СТАНОВИШЬСЯ СИЛЬНЕЕ!"

2. Follow with a one-sentence response:
   If success is "Успех!", congratulate the user on their success, mentioning the specific activity or category.
   If success is "Не получилось", offer support and frame the failure as a learning experience, referencing the activity or category.

3. Provide specific advice or encouragement based on the activity, category, and result. Start this section with "🚀 ЧТО ДАЛЬШЕ:"

Your response should adhere to the following style guidelines:
- Friendly, supportive, and emotional tone
- Maximum of 60 words
- No numbers in the text
- Express vivid emotions
- Write in Russian
- Tailor your advice and emotional response to the specific activity, category, duration, and any notes provided
- Aim to make the user feel understood and motivated to continue their efforts

Remember to vary your responses and use different forms of support to keep the feedback fresh and engaging. Your goal is to create a connection with the user and inspire them to keep improving.

Provide your response directly without any XML tags.
    `;

    const message = await retryApiCall(async () => {
      return await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
      });
    });

    const recommendation = message.content[0].text;
    console.log('✅ AI рекомендация получена, длина:', recommendation.length);
    console.log('📝 Полный ответ:', recommendation);

    // Сохраняем рекомендацию
    const recQuery = `
      INSERT INTO ai_recommendations (user_id, category, message, priority, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `;

    console.log('💾 Сохраняем рекомендацию в ai_recommendations...');
    
    const recResult = await pool.query(recQuery, [
      userId,
      category,
      recommendation,
      success ? 'low' : 'high',
      new Date()
    ]);
    
    console.log('✅ Рекомендация сохранена в ai_recommendations, ID:', recResult.rows[0]?.id);

    // Сохраняем инсайт об активности
    const insightQuery = `
      INSERT INTO ai_insights (user_id, type, content, created_at)
      VALUES ($1, $2, $3, $4)
    `;

    console.log('💾 Сохраняем инсайт об активности в БД...');
    console.log('📊 Данные для сохранения:', { userId, type: 'activity_analysis', content: recommendation });
    
    const insightResult = await pool.query(insightQuery, [
      userId,
      'activity_analysis',
      recommendation,
      new Date()
    ]);
    
    console.log('✅ Инсайт об активности сохранен в БД, ID:', insightResult.rows[0]?.id);

    console.log('📤 Отправляем ответ клиенту, длина рекомендации:', recommendation.length);
    
    res.json({
      success: true,
      recommendation,
      length: recommendation.length
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

// POST /api/ai/generate-personal-recommendations - Генерация персональных рекомендаций
router.post('/generate-personal-recommendations', async (req, res) => {
  try {
    const { userId } = req.body;
    const targetUserId = userId || 1;

    console.log(`🎯 Генерация персональных рекомендаций для пользователя ${targetUserId}`);

    // Получаем все данные пользователя
    const userDataQuery = `
      SELECT 
        s.type,
        s.data,
        s.timestamp,
        i.content as insight_content
      FROM ai_signals s
      LEFT JOIN ai_insights i ON s.user_id = i.user_id
      WHERE s.user_id = $1
      ORDER BY s.timestamp DESC
      LIMIT 50
    `;

    const userDataResult = await pool.query(userDataQuery, [targetUserId]);
    
    if (userDataResult.rows.length === 0) {
      return res.json({
        success: true,
        recommendations: ['Пока недостаточно данных для персонализированных рекомендаций. Продолжайте вести дневник!']
      });
    }

    // Анализируем данные
    const moodData = userDataResult.rows
      .filter(row => row.type === 'mood')
      .map(row => {
        try {
          const data = JSON.parse(row.data);
          return { mood: data.mood, stress: data.stressLevel, timestamp: row.timestamp };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    const activityData = userDataResult.rows
      .filter(row => row.type === 'activity')
      .map(row => {
        try {
          const data = JSON.parse(row.data);
          return { activity: data.activity, success: data.success, duration: data.duration };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    const prompt = `
      Ты - AI-эксперт по продуктивности и личному развитию. Проанализируй данные пользователя и создай 5 персонализированных рекомендаций.
      
      ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:
      📊 Настроение (${moodData.length} записей): ${moodData.map(d => d.mood).join(', ')}
      📈 Уровень стресса: ${moodData.map(d => d.stress).join(', ')}
      🎯 Активности (${activityData.length} записей): ${activityData.map(d => d.activity).join(', ')}
      ✅ Успешность: ${activityData.filter(d => d.success).length}/${activityData.length}
      
      ЗАДАЧА:
      Создай 5 конкретных, персонализированных рекомендаций в формате:
      
      🎯 РЕКОМЕНДАЦИЯ 1: [Название]
      [Описание действия и ожидаемый результат]
      
      🎯 РЕКОМЕНДАЦИЯ 2: [Название]
      [Описание действия и ожидаемый результат]
      
      [И так далее для всех 5 рекомендаций]
      
      СТИЛЬ: 
      - Конкретные, выполнимые действия
      - Учет индивидуальных паттернов пользователя
      - Мотивирующий, но реалистичный тон
      - Используй эмодзи для структурирования
      
      Тон: поддерживающий, мотивирующий, конкретный. На русском языке.
      ДЛИНА: 300-400 слов.
    `;

    console.log('🤖 Генерируем персональные рекомендации...');
    const message = await retryApiCall(async () => {
      return await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 600,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });
    });

    const recommendations = message.content[0].text;
    console.log('✅ Персональные рекомендации сгенерированы');

    // Сохраняем рекомендации
    const recQuery = `
      INSERT INTO ai_recommendations (user_id, category, message, priority, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await pool.query(recQuery, [
      targetUserId,
      'personal_ai',
      recommendations,
      'high',
      new Date()
    ]);

    res.json({
      success: true,
      recommendations: recommendations
    });

  } catch (error) {
    console.error('❌ Generate personal recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка генерации персональных рекомендаций'
    });
  }
});

// POST /api/ai/generate-daily-insight - Генерация дневного инсайта
router.post('/generate-daily-insight', async (req, res) => {
  try {
    const userId = req.body.userId || 1; // Временно используем ID = 1
    const forceRegenerate = req.body.forceRegenerate || false; // Принудительная регенерация
    console.log(`🔍 Генерация недельного инсайта для пользователя ${userId}`);

    // Проверяем, есть ли уже инсайт за текущую неделю
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Начало недели (воскресенье)
    weekStart.setHours(0, 0, 0, 0);

    if (!forceRegenerate) {
      const existingInsightQuery = `
        SELECT * FROM ai_insights 
        WHERE user_id = $1 
        AND type = 'weekly_insight'
        AND created_at >= $2
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const existingInsight = await pool.query(existingInsightQuery, [userId, weekStart]);
      
      if (existingInsight.rows.length > 0) {
        console.log('ℹ️ Недельный инсайт уже существует за эту неделю');
        return res.json({
          success: true,
          insight: existingInsight.rows[0].content,
          isNew: false,
          weekStart: weekStart.toISOString()
        });
      }
    }

    // Получаем данные за последние 7 дней
    const dataQuery = `
      SELECT * FROM ai_signals 
      WHERE user_id = $1 
      AND timestamp >= NOW() - INTERVAL '7 days'
      ORDER BY timestamp DESC
    `;

    const dataResult = await pool.query(dataQuery, [userId]);
    console.log(`📊 Найдено записей за неделю: ${dataResult.rows.length}`);

    // Проверяем минимальное количество записей для анализа
    if (dataResult.rows.length < 3) {
      console.log('ℹ️ Недостаточно данных для анализа (нужно минимум 3 записи)');
      return res.json({
        success: true,
        insight: 'Пока недостаточно данных для анализа. Продолжайте вести дневник настроения и активности!',
        isNew: false,
        weekStart: weekStart.toISOString()
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

    // Получаем данные геймификации (если есть таблица)
    let gamificationData = [];
    try {
      const gamificationQuery = `
        SELECT * FROM user_progress 
        WHERE user_id = $1 
        AND updated_at >= NOW() - INTERVAL '7 days'
        ORDER BY updated_at DESC
      `;
      const gamificationResult = await pool.query(gamificationQuery, [userId]);
      gamificationData = gamificationResult.rows;
      console.log(`🎮 Данные геймификации: ${gamificationData.length} записей`);
    } catch (e) {
      console.log('ℹ️ Таблица геймификации не найдена, пропускаем');
    }

    console.log(`📈 Данные настроения: ${moodData.length} записей`);
    console.log(`📝 Данные активности: ${activityData.length} записей`);

    // Формируем контекст для AI
    let context = '';
    
    if (moodData.length > 0) {
      const avgMood = (moodData.reduce((sum, d) => sum + (d.mood || 0), 0) / moodData.length).toFixed(1);
      context += `📊 Среднее настроение за неделю: ${avgMood}/10\n`;
    }
    
    if (activityData.length > 0) {
      const categories = [...new Set(activityData.map(d => d.category))];
      context += `📝 Активности: ${categories.join(', ')}\n`;
    }
    
    if (gamificationData.length > 0) {
      const totalPoints = gamificationData.reduce((sum, d) => sum + (d.points || 0), 0);
      context += `🎮 Очки за неделю: +${totalPoints}\n`;
    }

    const prompt = `
      Ты - добрый AI-друг, который анализирует неделю пользователя и дает теплые, поддерживающие советы.

      Вот данные за неделю:

      <context>
      ${context}
      </context>

      Проанализируй эти данные и напиши ответ как лучший друг в мессенджере.

      ТВОЙ ОТВЕТ ДОЛЖЕН БЫТЬ:
      - На русском языке
      - 50-80 слов
      - Один абзац
      - Теплый и дружелюбный тон
      - Без формальностей и цифр

      ВКЛЮЧИ В ОТВЕТ:
      - Что интересного ты заметил в неделе
      - Что у пользователя хорошо получается
      - Один конкретный совет на следующую неделю

      Пиши как будто пишешь другу в чат - тепло, искренне, с поддержкой.

      Начни ответ с <answer> и закончи </answer>.
    `;

    console.log('🤖 Отправляем запрос к Claude AI...');
    const message = await retryApiCall(async () => {
      return await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
      });
    });

    const insight = message.content[0].text;
    console.log('✅ AI ответ получен, длина:', insight.length);

    // Сохраняем инсайт
    const insightQuery = `
      INSERT INTO ai_insights (user_id, type, content, created_at, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await pool.query(insightQuery, [
      userId,
      'weekly_insight',
      insight,
      new Date(),
      JSON.stringify({
        weekStart: weekStart.toISOString(),
        dataPoints: dataResult.rows.length,
        moodEntries: moodData.length,
        activityEntries: activityData.length,
        gamificationEntries: gamificationData.length
      })
    ]);
    console.log('💾 Недельный инсайт сохранен в БД');

    res.json({
      success: true,
      insight,
      isNew: true,
      weekStart: weekStart.toISOString(),
      metadata: {
        dataPoints: dataResult.rows.length,
        moodEntries: moodData.length,
        activityEntries: activityData.length
      }
    });

  } catch (error) {
    console.error('❌ Generate weekly insight error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Ошибка генерации недельного инсайта',
      details: error.message
    });
  }
});

// POST /api/ai/analyze-trends - Анализ долгосрочных трендов
router.post('/analyze-trends', async (req, res) => {
  try {
    const { userId, period = '30' } = req.body; // period в днях
    const targetUserId = userId || 1;

    console.log(`📈 Анализ трендов за ${period} дней для пользователя ${targetUserId}`);

    // Получаем данные за указанный период
    const trendsDataQuery = `
      SELECT 
        s.type,
        s.data,
        s.timestamp,
        DATE(s.timestamp) as date
      FROM ai_signals s
      WHERE s.user_id = $1 
      AND s.timestamp >= NOW() - INTERVAL '${period} days'
      ORDER BY s.timestamp ASC
    `;

    const trendsResult = await pool.query(trendsDataQuery, [targetUserId]);
    
    if (trendsResult.rows.length === 0) {
      return res.json({
        success: true,
        trends: 'Недостаточно данных для анализа трендов. Нужно минимум 7 дней активности.'
      });
    }

    // Группируем данные по дням
    const dailyData = {};
    trendsResult.rows.forEach(row => {
      const date = row.date;
      if (!dailyData[date]) {
        dailyData[date] = { mood: [], stress: [], activities: [] };
      }
      
      try {
        const data = JSON.parse(row.data);
        if (row.type === 'mood') {
          dailyData[date].mood.push(data.mood);
          dailyData[date].stress.push(data.stressLevel);
        } else if (row.type === 'activity') {
          dailyData[date].activities.push(data.activity);
        }
      } catch (e) {
        console.log(`⚠️ Ошибка парсинга данных: ${e.message}`);
      }
    });

    // Вычисляем средние значения
    const trends = Object.keys(dailyData).map(date => ({
      date,
      avgMood: dailyData[date].mood.length > 0 ? 
        (dailyData[date].mood.reduce((a, b) => a + b, 0) / dailyData[date].mood.length).toFixed(1) : 'N/A',
      avgStress: dailyData[date].stress.length > 0 ? 
        (dailyData[date].stress.reduce((a, b) => a + b, 0) / dailyData[date].stress.length).toFixed(1) : 'N/A',
      activityCount: dailyData[date].activities.length
    }));

    const prompt = `
      Ты - AI-аналитик по долгосрочным трендам продуктивности. Проанализируй данные пользователя за ${period} дней и выяви ключевые паттерны.
      
      ДАННЫЕ ПО ДНЯМ:
      ${trends.map(t => `📅 ${t.date}: Настроение ${t.avgMood}/10, Стресс ${t.avgStress}/10, Активностей: ${t.activityCount}`).join('\n')}
      
      ЗАДАЧА:
      Создай анализ трендов в формате:
      
      📊 ОБЩИЕ ТРЕНДЫ
      [Анализ изменений настроения, стресса и активности за период]
      
      🔍 ВЫЯВЛЕННЫЕ ПАТТЕРНЫ
      - [Паттерн 1: что повторяется регулярно]
      - [Паттерн 2: что меняется со временем]
      - [Паттерн 3: неожиданные находки]
      
      📈 ПРОГНОЗ И РЕКОМЕНДАЦИИ
      [Что ожидать в ближайшие дни и как подготовиться]
      
      СТИЛЬ: 
      - Аналитический, но понятный
      - Конкретные цифры и факты
      - Практические выводы
      - Используй эмодзи для структурирования
      
      Тон: профессиональный, поддерживающий. На русском языке.
      ДЛИНА: 250-350 слов.
    `;

    console.log('🤖 Анализируем тренды...');
    const message = await retryApiCall(async () => {
      return await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });
    });

    const trendsAnalysis = message.content[0].text;
    console.log('✅ Анализ трендов завершен');

    // Сохраняем анализ трендов
    const trendsQuery = `
      INSERT INTO ai_insights (user_id, type, content, created_at)
      VALUES ($1, $2, $3, $4)
    `;

    await pool.query(trendsQuery, [
      targetUserId,
      'trends_analysis',
      trendsAnalysis,
      new Date()
    ]);

    res.json({
      success: true,
      trends: trendsAnalysis,
      rawData: trends
    });

  } catch (error) {
    console.error('❌ Analyze trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка анализа трендов'
    });
  }
});

// POST /api/ai/force-weekly-insight - Принудительная регенерация недельного инсайта (для разработчиков)
router.post('/force-weekly-insight', async (req, res) => {
  try {
    const { userId, weekOffset = 0 } = req.body; // weekOffset: 0 = текущая неделя, -1 = прошлая неделя
    const targetUserId = userId || 1;
    
    console.log(`🔧 Принудительная регенерация недельного инсайта для пользователя ${targetUserId}, неделя: ${weekOffset}`);

    // Вычисляем начало недели с учетом смещения
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekOffset * 7));
    weekStart.setHours(0, 0, 0, 0);

    // Удаляем существующий инсайт за эту неделю
    const deleteQuery = `
      DELETE FROM ai_insights 
      WHERE user_id = $1 
      AND type = 'weekly_insight'
      AND created_at >= $2
      AND created_at < $3
    `;
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    await pool.query(deleteQuery, [targetUserId, weekStart, weekEnd]);
    console.log('🗑️ Удален существующий инсайт за неделю');

    // Генерируем новый инсайт
    const insightData = {
      userId: targetUserId,
      forceRegenerate: true
    };

    // Вызываем внутренне функцию генерации инсайта
    const insightResult = await generateWeeklyInsight(targetUserId, weekStart, weekEnd);
    
    if (insightResult.success) {
      res.json({
        success: true,
        message: 'Недельный инсайт успешно перегенерирован',
        insight: insightResult.insight,
        weekStart: weekStart.toISOString(),
        metadata: insightResult.metadata
      });
    } else {
      throw new Error(insightResult.error);
    }

  } catch (error) {
    console.error('❌ Force weekly insight error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка принудительной регенерации недельного инсайта',
      details: error.message
    });
  }
});

// Вспомогательная функция для генерации недельного инсайта
async function generateWeeklyInsight(userId, weekStart, weekEnd) {
  try {
    // Получаем данные за указанную неделю
    const dataQuery = `
      SELECT * FROM ai_signals 
      WHERE user_id = $1 
      AND timestamp >= $2
      AND timestamp < $3
      ORDER BY timestamp DESC
    `;

    const dataResult = await pool.query(dataQuery, [userId, weekStart, weekEnd]);
    
    if (dataResult.rows.length < 3) {
      return {
        success: false,
        error: 'Недостаточно данных для анализа (нужно минимум 3 записи)'
      };
    }

    // Анализируем паттерны (копируем логику из основного эндпоинта)
    const moodData = dataResult.rows
      .filter(row => row.type === 'mood')
      .map(row => {
        try {
          return JSON.parse(row.data);
        } catch (e) {
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
          return null;
        }
      })
      .filter(Boolean);

    // Получаем данные геймификации
    let gamificationData = [];
    try {
      const gamificationQuery = `
        SELECT * FROM user_progress 
        WHERE user_id = $1 
        AND updated_at >= $2
        AND updated_at < $3
        ORDER BY updated_at DESC
      `;
      const gamificationResult = await pool.query(gamificationQuery, [userId, weekStart, weekEnd]);
      gamificationData = gamificationResult.rows;
    } catch (e) {
      // Игнорируем ошибки геймификации
    }

    // Формируем контекст для AI
    let context = '';
    
    if (moodData.length > 0) {
      const avgMood = (moodData.reduce((sum, d) => sum + (d.mood || 0), 0) / moodData.length).toFixed(1);
      context += `📊 Среднее настроение за неделю: ${avgMood}/10\n`;
    }
    
    if (activityData.length > 0) {
      const categories = [...new Set(activityData.map(d => d.category))];
      context += `📝 Активности: ${categories.join(', ')}\n`;
    }
    
    if (gamificationData.length > 0) {
      const totalPoints = gamificationData.reduce((sum, d) => sum + (d.points || 0), 0);
      context += `🎮 Очки за неделю: +${totalPoints}\n`;
    }

    const prompt = `
      Ты - добрый AI-друг, который анализирует неделю пользователя и дает теплые, поддерживающие советы.

      Вот данные за неделю:

      <context>
      ${context}
      </context>

      Проанализируй эти данные и напиши ответ как лучший друг в мессенджере.

      ТВОЙ ОТВЕТ ДОЛЖЕН БЫТЬ:
      - На русском языке
      - 50-80 слов
      - Один абзац
      - Теплый и дружелюбный тон
      - Без формальностей и цифр

      ВКЛЮЧИ В ОТВЕТ:
      - Что интересного ты заметил в неделе
      - Что у пользователя хорошо получается
      - Один конкретный совет на следующую неделю

      Пиши как будто пишешь другу в чат - тепло, искренне, с поддержкой.

      Начни ответ с <answer> и закончи </answer>.
    `;

    const message = await retryApiCall(async () => {
      return await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });
    });

    const insight = message.content[0].text;

    // Сохраняем инсайт
    const insightQuery = `
      INSERT INTO ai_insights (user_id, type, content, created_at, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await pool.query(insightQuery, [
      userId,
      'weekly_insight',
      insight,
      new Date(),
      JSON.stringify({
        weekStart: weekStart.toISOString(),
        dataPoints: dataResult.rows.length,
        moodEntries: moodData.length,
        activityEntries: activityData.length,
        gamificationEntries: gamificationData.length
      })
    ]);

    return {
      success: true,
      insight,
      metadata: {
        dataPoints: dataResult.rows.length,
        moodEntries: moodData.length,
        activityEntries: activityData.length
      }
    };

  } catch (error) {
    console.error('❌ Generate weekly insight helper error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default router;
