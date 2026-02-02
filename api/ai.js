import express from 'express';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

// Инициализация Claude API
// Диагностика: проверяем наличие API ключа
if (!process.env.CLAUDE_API_KEY) {
  console.error('❌ CLAUDE_API_KEY не установлен! AI функции не будут работать.');
  console.error('💡 Установите переменную окружения CLAUDE_API_KEY в PM2 или .env файле');
} else {
  console.log('✅ CLAUDE_API_KEY загружен (первые 10 символов):', process.env.CLAUDE_API_KEY.substring(0, 10) + '...');
}

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
  // Позволяет направлять трафик через внешний прокси (например, Cloudflare Worker)
  baseURL: process.env.CLAUDE_BASE_URL || undefined,
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

// Удаляет служебный разбор и XML-теги из ответа Claude
function cleanClaudeOutput(text) {
  if (!text) return '';
  try {
    let result = String(text);
    // Удалить блок эмоционального разбора
    result = result.replace(/<emotional_analysis>[\s\S]*?<\/emotional_analysis>/gi, '');
    // Удалить любые оставшиеся XML/HTML теги
    result = result.replace(/<[^>]+>/g, '');
    // Сжать лишние пробелы и переводы строк
    result = result.replace(/[\t\x0B\f\r ]{2,}/g, ' ');
    result = result.replace(/\n{3,}/g, '\n\n');
    return result.trim();
  } catch (_) {
    return String(text);
  }
}

/**
 * Границы календарной недели (понедельник — воскресенье).
 * Правило: один еженедельный отчёт за неделю при достаточности данных.
 * @param {Date} [date=new Date()] — дата, по которой определяется неделя
 * @returns {{ weekStart: Date, weekEnd: Date }} weekStart = пн 00:00, weekEnd = вс 23:59:59.999
 */
function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = вс, 1 = пн, ..., 6 = сб
  const diff = day === 0 ? 6 : day - 1; // дней назад до понедельника
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

// Database connection
// Используем PG_CONNECTION_STRING (как в db.js) или DATABASE_URL для обратной совместимости
const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL,
});

// Функция для расчета качества данных
function calculateDataQuality(mood, notes, activities) {
  let score = 0.0;
  
  // Балл за настроение (0-10)
  if (mood !== undefined && mood !== null) {
    score += 0.3;
  }
  
  // Балл за заметки (чем длиннее, тем лучше)
  if (notes && notes.trim().length > 0) {
    if (notes.length >= 50) score += 0.4;
    else if (notes.length >= 20) score += 0.3;
    else if (notes.length >= 10) score += 0.2;
    else score += 0.1;
  }
  
  // Балл за активности
  if (activities && activities.length > 0) {
    if (Array.isArray(activities)) {
      score += Math.min(activities.length * 0.1, 0.3);
    } else {
      score += 0.1;
    }
  }
  
  return Math.min(score, 1.0);
}

// Функция для расчета качества активности
function calculateActivityQuality(activity, category, duration, success, notes) {
  let score = 0.0;
  
  // Балл за название активности
  if (activity && activity.trim().length > 0) {
    score += 0.2;
  }
  
  // Балл за категорию
  if (category && category.trim().length > 0) {
    score += 0.2;
  }
  
  // Балл за длительность
  if (duration && duration > 0) {
    if (duration >= 60) score += 0.3;
    else if (duration >= 30) score += 0.2;
    else score += 0.1;
  }
  
  // Балл за успешность
  if (success !== undefined) {
    score += 0.2;
  }
  
  // Балл за заметки
  if (notes && notes.trim().length > 0) {
    if (notes.length >= 30) score += 0.1;
    else if (notes.length >= 10) score += 0.05;
  }
  
  return Math.min(score, 1.0);
}

// POST /api/ai/analyze-mood - Анализ настроения пользователя
router.post('/analyze-mood', async (req, res) => {
  try {
    const { mood, energy, activities, notes, stressLevel } = req.body;
    let userId = req.body.userId || 1; // По умолчанию используем ID = 1 (тестовый пользователь)
    const originalUserId = userId; // Сохраняем оригинальный ID для логирования
    
    // Если userId выглядит как telegram_id (большое число), используем фиксированный user_id = 1
    // для Telegram пользователей, так как таблица enter только для пользователей сайта
    if (userId > 1000000) {
      // Это telegram_id, используем фиксированный user_id = 1 для всех Telegram пользователей
      // Данные telegram_id сохраняются в поле data JSONB для идентификации
      userId = 1;
      console.log(`ℹ️ Telegram пользователь ${originalUserId} использует user_id = 1 для AI системы`);
    }
    
    console.log(`🔍 AI analyze-mood: originalUserId=${originalUserId}, final userId=${userId}, mood=${mood}`);

    // Проверяем лимит использования ИИ-советника (3 раза в день для обычных пользователей)
    // Для Telegram пользователей проверяем по telegram_id в поле data
    const isTelegramUser = req.body.userId > 1000000;
    const isAdmin = userId === 1 && !isTelegramUser || req.body.userId === parseInt(process.env.ADMIN_TELEGRAM_ID);
    
    if (!isAdmin) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let limitCheck;
        if (isTelegramUser) {
          // Для Telegram пользователей проверяем по telegram_id в поле data
          limitCheck = await pool.query(`
            SELECT COUNT(*) as count
            FROM ai_signals
            WHERE user_id = $1
            AND type = 'mood'
            AND timestamp >= $2
            AND data->>'telegram_id' = $3
          `, [userId, today, String(req.body.userId)]);
        } else {
          // Для обычных пользователей проверяем по user_id
          limitCheck = await pool.query(`
            SELECT COUNT(*) as count
            FROM ai_signals
            WHERE user_id = $1
            AND type = 'mood'
            AND timestamp >= $2
            AND (data->>'telegram_id' IS NULL OR data->>'telegram_id' = '')
          `, [userId, today]);
        }
        
        const count = parseInt(limitCheck.rows[0]?.count || 0);
        const limit = 3;
        
        if (count >= limit) {
          return res.status(429).json({
            success: false,
            error: 'Достигнут лимит использования ИИ-советника',
            message: `Вы использовали ИИ-советника ${count}/${limit} раз сегодня. Лимит обновится завтра.`
          });
        }
      } catch (limitError) {
        console.error('⚠️ Ошибка при проверке лимита (продолжаем работу):', limitError.message);
        // Продолжаем работу, даже если проверка лимита не удалась
      }
    }

    // Сохраняем сигнал в БД с использованием всех доступных полей
    const signalQuery = `
      INSERT INTO ai_signals (
        user_id, type, data, timestamp, 
        mood_rating, energy_rating, stress_rating, notes, quality_score
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const signalData = {
      mood,
      energy: energy != null ? energy : undefined,
      activities: Array.isArray(activities) ? activities : [activities],
      notes,
      stressLevel,
      timestamp: new Date()
    };
    
    // Если это Telegram пользователь, сохраняем telegram_id в data для идентификации
    if (req.body.userId > 1000000) {
      signalData.telegram_id = req.body.userId;
    }

    // Рассчитываем quality_score на основе качества данных
    const qualityScore = calculateDataQuality(mood, notes, activities);

    console.log(`💾 Сохранение ai_signals: user_id=${userId}, telegram_id=${req.body.userId > 1000000 ? req.body.userId : 'N/A'}`);
    
    const signalResult = await pool.query(signalQuery, [
      userId,
      'mood',
      JSON.stringify(signalData),
      new Date(),
      mood ?? 0,
      energy != null ? energy : null,
      stressLevel ?? 0,
      notes || '',
      qualityScore
    ]);

    // Анализируем с помощью Claude
    const prompt = `
      You are a compassionate AI friend-psychologist providing daily emotional support and advice to a Russian user. Your task is to analyze the user's input and generate a thoughtful, culturally appropriate response in Russian.

Here is the user's input:

<notes>{{NOTES}}</notes>
<mood>{{MOOD}}</mood>
<activities>{{ACTIVITIES}}</activities>
<stress_level>{{STRESS_LEVEL}}</stress_level>

Begin by analyzing the user's situation and planning your response. Wrap this process inside <emotional_analysis> tags:

<emotional_analysis>
1. Write down relevant quotes from the notes section
2. Count and list each activity
3. Classify the mood and stress level, considering arguments for different categories
4. Evaluate how the activities relate to the user's current state
5. Consider cultural context (Russian-specific idioms, proverbs, or cultural factors)
6. Choose an appropriate emoji (🎉, 😊, or 💪)
7. Prepare a brief analysis of the user's situation
8. Craft a thought-provoking question for self-reflection
9. Develop three pieces of tailored advice
10. Create a short, optimistic forecast
11. Generate 2-3 creative metaphors or analogies related to the user's situation (consider Russian nature, literature, or daily life)
12. Consider potential tool calls (e.g., for translation or cultural references) and note required parameters
</emotional_analysis>

After completing your analysis, provide your response in Russian. IMPORTANT: Your response MUST contain exactly 4 paragraphs, separated by empty lines. The total response should be between 150-250 words to provide comprehensive and helpful advice.

Response structure:
Paragraph 1: Emotional reaction with emoji (1-2 sentences)
Paragraph 2: Situation analysis and thought-provoking question (2-3 sentences)
Paragraph 3: Three specific pieces of advice (3-4 sentences)
Paragraph 4: Optimistic forecast and words of support (1-2 sentences)

Example format (content-free):

Абзац 1

Абзац 2

Абзац 3

Абзац 4

Guidelines for your response:
- Write in a friendly, empathetic tone
- Focus on emotions rather than formality
- Avoid using numbers in your text
- Use creative metaphors or analogies when appropriate
- Ensure variety in your responses across different interactions
- Occasionally include a relevant Russian quote or proverb

IMPORTANT: Each response must be UNIQUE. Do not repeat phrases, metaphors, or structures from previous responses.

Vary your approach:
- Use DIFFERENT emojis, metaphors, Russian proverbs, and cultural references in each response
- Avoid cliché phrases like "как говорится", "уверен", "справитесь"
- Vary the emotional tone from enthusiastic to calmly supportive
- Use different types of support: motivation, empathy, admiration, calmness
- Vary metaphors: nature (spring, sea, mountains, forest, river, sun, stars), culture (Russian birch, matryoshka, balalaika, samovar), professional (growth, development, achievements, success)
- Ask DIFFERENT types of questions: reflective, planning, emotional, practical

BEFORE SENDING: Ensure that your response is unique, diverse, and contains exactly 4 paragraphs separated by empty lines. The response must be ready for direct display to the user.

Now, please provide your response in Russian based on this structure and the given user input.`;

    // Подставляем фактические значения в плейсхолдеры шаблона
    const activitiesStr = Array.isArray(activities) ? activities.join(', ') : (activities ? String(activities) : 'Нет');
    const filledPrompt = (prompt || '')
      .replace('{{NOTES}}', (notes && String(notes)) || 'Нет')
      .replace('{{MOOD}}', (mood ?? '') === '' ? 'N/A' : String(mood))
      .replace('{{ACTIVITIES}}', activitiesStr)
      .replace('{{STRESS_LEVEL}}', (stressLevel ?? '') === '' ? 'N/A' : String(stressLevel));

    const message = await retryApiCall(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: filledPrompt
        }
      ]
      });
    });

    const analysis = cleanClaudeOutput(message.content[0].text);

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

    // ВРЕМЕННО ОТКЛЮЧЕНО: Интеграция с системой продуктивности
    // TODO: Исправить проблему с достижениями перед включением
    console.log('ℹ️ Интеграция с продуктивностью временно отключена (проблема с достижениями)');

    res.json({
      success: true,
      analysis,
      signalId: signalResult.rows[0].id,
      message: 'Настроение проанализировано и сохранено'
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

    // Сохраняем активность с использованием всех доступных полей
    const activityQuery = `
      INSERT INTO ai_signals (
        user_id, type, data, timestamp,
        activity_category, duration_minutes, success_rating, notes, quality_score
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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

    // Рассчитываем quality_score для активности
    const activityQualityScore = calculateActivityQuality(activity, category, duration, success, notes);

    console.log('💾 Сохраняем активность в ai_signals:', activityData);
    
    const activityResult = await pool.query(activityQuery, [
      userId,
      'activity',
      JSON.stringify(activityData),
      new Date(),
      category || '',
      duration || 0,
      req.body.success_rating || 5, // Принимаем success_rating с фронтенда (0-10), по умолчанию 5
      notes || '',
      activityQualityScore
    ]);
    
    console.log('✅ Активность сохранена в ai_signals, ID:', activityResult.rows[0]?.id);

    // Генерируем AI рекомендацию (при ошибке API — активность уже сохранена, возвращаем fallback)
    let recommendation;
    try {
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
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        });
      });

      recommendation = cleanClaudeOutput(message.content[0].text);
      console.log('✅ AI рекомендация получена, длина:', recommendation.length);

      const recommendationQuery = `
        INSERT INTO ai_recommendations (user_id, category, message, priority, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      await pool.query(recommendationQuery, [
        userId,
        category || 'general',
        recommendation,
        'medium',
        new Date()
      ]);

      const insightQuery = `
        INSERT INTO ai_insights (user_id, type, content, created_at)
        VALUES ($1, $2, $3, $4)
      `;
      await pool.query(insightQuery, [
        userId,
        'activity_analysis',
        recommendation,
        new Date()
      ]);
    } catch (aiError) {
      console.error('AI recommendation failed (activity already saved):', aiError?.status || aiError?.message);
      recommendation = success
        ? '💪 Так держать! Активность записана. Рекомендация временно недоступна.'
        : '🔄 Продолжай пробовать! Активность записана. Рекомендация временно недоступна.';
    }

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

// POST /api/ai/recommendations/generate — гибридная генерация (тест + free-form + сигналы) с использованием Claude
router.post('/recommendations/generate', async (req, res) => {
  try {
    const userId = parseInt(req.body.user_id || req.body.userId || 1, 10);
    const variant = (req.query.variant || 'hybrid_v1').toString();
    
    console.log(`🚀 Генерация гибридных рекомендаций для пользователя ${userId}, вариант: ${variant}`);

    // 1) Загружаем свободные предпочтения (последнюю запись)
    const prefQuery = `
      SELECT data FROM ai_signals 
      WHERE user_id = $1 AND type = 'preferences_free' 
      ORDER BY timestamp DESC LIMIT 1
    `;
    const prefRes = await pool.query(prefQuery, [userId]);
    
    // Безопасно парсим предпочтения
    let prefs = { tags: [], avoid: [], free_text: '', constraints: {} };
    if (prefRes.rows[0]?.data) {
      const prefData = prefRes.rows[0].data;
      if (typeof prefData === 'object') {
        prefs = prefData;
      } else {
        try {
          prefs = JSON.parse(prefData);
        } catch (e) {
          console.warn('⚠️ Не удалось распарсить предпочтения:', e.message);
        }
      }
    }

    // 2) Загружаем недавние сигналы (14 дней)
    const signalsQuery = `
      SELECT type, data FROM ai_signals 
      WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '14 days'
      ORDER BY timestamp DESC
    `;
    const sigRes = await pool.query(signalsQuery, [userId]);
    
    // Безопасно парсим данные из БД (могут быть JSON строками или объектами)
    const parseSignalData = (data) => {
      if (!data) return null;
      if (typeof data === 'object') return data;
      try {
        return JSON.parse(data);
      } catch (e) {
        console.warn('⚠️ Не удалось распарсить данные сигнала:', e.message);
        return null;
      }
    };
    
    const moods = sigRes.rows
      .filter(r => r.type === 'mood')
      .map(r => parseSignalData(r.data))
      .filter(Boolean);
    
    const acts = sigRes.rows
      .filter(r => r.type === 'activity')
      .map(r => parseSignalData(r.data))
      .filter(Boolean);
    
    console.log(`📊 Загружено ${moods.length} записей настроения и ${acts.length} активностей для пользователя ${userId}`);

    // 3) Загружаем текущий список льгот для маппинга (id, name, category)
    const benefitsQuery = `SELECT id, name, category FROM benefits`;
    const benefitsRes = await pool.query(benefitsQuery);
    const benefits = benefitsRes.rows || [];

    const findBenefitId = (name, category) => {
      if (!benefits.length) return null;
      
      const searchName = String(name || '').toLowerCase().trim();
      const searchCategory = String(category || '').toLowerCase().trim();
      
      // 1. Точное совпадение по имени
      const exactMatch = benefits.find(b => (b.name || '').toLowerCase() === searchName);
      if (exactMatch) return exactMatch.id;
      
      // 2. Частичное совпадение по имени (содержит ключевые слова)
      const partialMatch = benefits.find(b => {
        const benefitName = (b.name || '').toLowerCase();
        return searchName.includes(benefitName) || benefitName.includes(searchName);
      });
      if (partialMatch) return partialMatch.id;
      
      // 3. Поиск по ключевым словам в названии
      const keywords = searchName.split(/[\s\-,]+/).filter(w => w.length > 2);
      const keywordMatch = benefits.find(b => {
        const benefitName = (b.name || '').toLowerCase();
        return keywords.some(keyword => benefitName.includes(keyword));
      });
      if (keywordMatch) return keywordMatch.id;
      
      // 4. По категории + приоритет по количеству льгот в категории (берем случайную)
      const categoryMatches = benefits.filter(b => (b.category || '').toLowerCase() === searchCategory);
      if (categoryMatches.length > 0) {
        // Возвращаем случайную льготу из подходящей категории
        const randomIndex = Math.floor(Math.random() * categoryMatches.length);
        return categoryMatches[randomIndex].id;
      }
      
      // 5. Fallback: возвращаем случайную льготу (лучше что-то, чем ничего)
      if (benefits.length > 0) {
        const randomIndex = Math.floor(Math.random() * benefits.length);
        console.warn(`⚠️ Не найдена льгота "${name}" в категории "${category}", используем fallback: ${benefits[randomIndex].name}`);
        return benefits[randomIndex].id;
      }
      
      return null;
    };

    // 4) Загружаем тестовые результаты (если есть) как "test_score"
    // Берём последние записи из benefit_recommendations и строим веса 1.0, 0.66, 0.33
    const testQuery = `
      SELECT benefit_id, priority FROM benefit_recommendations
      WHERE user_id = $1
      ORDER BY created_at DESC, priority ASC
      LIMIT 3
    `;
    let testScores = {};
    try {
      const testRes = await pool.query(testQuery, [userId]);
      const weights = { 1: 1.0, 2: 0.66, 3: 0.33 };
      testRes.rows.forEach(r => { testScores[r.benefit_id] = weights[r.priority] || 0.33; });
    } catch (_) {
      testScores = {};
    }

    // 5) Формируем промпт для Claude с требованием STRICT JSON
    const compactMoods = moods.slice(0, 10).map(m => ({ mood: m.mood, stress: m.stressLevel, notes: (m.notes||'').slice(0,60) }));
    const compactActs = acts.slice(0, 10).map(a => ({ activity: a.activity, category: a.category, duration: a.duration, success: a.success }));

    const prompt = `Ты — HR‑ИИ. На основе данных пользователя верни СТРОГИЙ JSON без пояснений:
{
  "variant": "hybrid_v1",
  "candidates": [
    { "category": "Психология", "benefit_name": "Психологическая поддержка", "reason_short": ["стресс ↑", "онлайн"], "ai_score": 0.9, "confidence": 0.75 }
  ]
}

Данные (сжато):
- Свободные предпочтения: free_text="${(prefs.free_text||'').slice(0,200)}", tags=${JSON.stringify(prefs.tags||[])}, avoid=${JSON.stringify(prefs.avoid||[])}, constraints=${JSON.stringify(prefs.constraints||{})}
- Настроение (последние): ${JSON.stringify(compactMoods)}
- Активности (последние): ${JSON.stringify(compactActs)}

Правила:
- Верни 3 кандидата максимум.
- reason_short: 2–3 короткие причины, используй свободные предпочтения и недавние сигналы.
- Учитывай avoid: такие льготы не предлагать.
- ai_score в 0..1, confidence в 0..1.
- Только JSON, без текста вне JSON.`;

    console.log(`📝 Отправляем промпт в Claude для генерации рекомендаций (длина: ${prompt.length} символов)`);
    
    const message = await retryApiCall(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });
    });

    console.log(`📥 Получен ответ от Claude (длина: ${message.content?.[0]?.text?.length || 0} символов)`);
    
    let parsed;
    try {
      parsed = JSON.parse(message.content?.[0]?.text || '{}');
      console.log(`✅ JSON успешно распарсен, найдено кандидатов: ${parsed?.candidates?.length || 0}`);
    } catch (e) {
      console.warn('⚠️ Ошибка парсинга JSON, пытаемся очистить и распарсить:', e.message);
      // В случае нарушения формата пытаемся очистить и распарсить
      try { 
        parsed = JSON.parse(cleanClaudeOutput(message.content?.[0]?.text || '{}')); 
        console.log(`✅ JSON распарсен после очистки, найдено кандидатов: ${parsed?.candidates?.length || 0}`);
      } catch (e2) { 
        console.error('❌ Не удалось распарсить JSON даже после очистки:', e2.message);
        parsed = { candidates: [] }; 
      }
    }

    const candidates = Array.isArray(parsed?.candidates) ? parsed.candidates.slice(0,3) : [];
    console.log(`🎯 Обрабатываем ${candidates.length} кандидатов от AI`);

    // 6) Подсчет итогового score и подготовка записей к сохранению
    const items = candidates.map((c) => {
      const benefitId = findBenefitId(c.benefit_name, c.category);
      const aiScore = Math.max(0, Math.min(Number(c.ai_score || 0), 1));
      const testScore = benefitId && testScores[benefitId] ? testScores[benefitId] : 0;
      const finalScore = (Object.keys(testScores).length ? (0.6 * testScore + 0.4 * aiScore) : aiScore);
      const reasons = Array.isArray(c.reason_short) ? c.reason_short : [];
      const confidence = Math.max(0, Math.min(Number(c.confidence || 0.6), 1));
      return { benefitId, finalScore, testScore, aiScore, reasons, confidence, name: c.benefit_name, category: c.category };
    }).filter(i => i.benefitId);

    // Фильтруем по avoid с безопасной проверкой
    const avoidList = Array.isArray(prefs.avoid) ? prefs.avoid.map(s => String(s).toLowerCase()) : [];
    const filtered = items.filter(i => {
      const nameL = String(i.name||'').toLowerCase();
      const catL  = String(i.category||'').toLowerCase();
      return !avoidList.some(a => nameL.includes(a) || catL.includes(a));
    });

    // Сортировка и ограничение Top-3
    let top = filtered.sort((a,b) => b.finalScore - a.finalScore).slice(0,3);
    
    // ГАРАНТИРУЕМ МИНИМУМ 3 РЕКОМЕНДАЦИИ: добавляем случайные льготы если не хватает
    if (top.length < 3 && benefits.length > 0) {
      console.warn(`⚠️ AI дал только ${top.length} рекомендаций, дополняем до 3 случайными льготами`);
      
      const usedBenefitIds = new Set(top.map(t => t.benefitId));
      const availableBenefits = benefits.filter(b => !usedBenefitIds.has(b.id));
      
      while (top.length < 3 && availableBenefits.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableBenefits.length);
        const randomBenefit = availableBenefits.splice(randomIndex, 1)[0];
        
        // Создаем fallback рекомендацию
        const fallbackRec = {
          benefitId: randomBenefit.id,
          finalScore: 0.5, // Средний score для fallback
          testScore: 0,
          aiScore: 0.5,
          reasons: ['рекомендация системы', 'дополнительная опция'],
          confidence: 0.6,
          name: randomBenefit.name,
          category: randomBenefit.category
        };
        
        top.push(fallbackRec);
        console.log(`✅ Добавлена fallback рекомендация: ${randomBenefit.name}`);
      }
    }

    // Очищаем предыдущие рекомендации пользователя (только variant=hybrid_v1)
    console.log(`🗑️ Удаляем старые рекомендации для пользователя ${userId}`);
    await pool.query(`DELETE FROM benefit_recommendations WHERE user_id = $1`, [userId]);

    // Сохраняем новые рекомендации с расширенными полями
    console.log(`💾 Сохраняем ${top.length} новых рекомендаций в БД`);
    for (let i = 0; i < top.length; i++) {
      const t = top[i];
      const insert = `
        INSERT INTO benefit_recommendations (user_id, benefit_id, priority, answers, explanations, confidence, algorithm_variant, score_breakdown)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      await pool.query(insert, [
        userId,
        t.benefitId,
        i + 1,
        JSON.stringify({ from: 'hybrid', tags: prefs.tags || [] }),
        JSON.stringify(t.reasons || []),
        t.confidence,
        variant,
        JSON.stringify({ test_score: t.testScore, ai_score: t.aiScore, final: t.finalScore })
      ]);
    }

    console.log(`✅ Генерация гибридных рекомендаций завершена успешно для пользователя ${userId}`);
    res.json({ success: true, variant, generatedAt: new Date().toISOString(), saved: top.length });
  } catch (error) {
    console.error('❌ Hybrid recommendations generation error:', error);
    console.error('📋 Детали ошибки:', {
      message: error.message,
      stack: error.stack,
      userId: req.body.user_id || req.body.userId
    });
    res.status(500).json({ success: false, error: 'Ошибка генерации рекомендаций: ' + error.message });
  }
});


// POST /api/ai/generate-personal-recommendations - Генерация персональных рекомендаций
router.post('/generate-personal-recommendations', async (req, res) => {
  try {
    const { userId } = req.body;
    const targetUserId = parseInt(userId || 1, 10);

    console.log(`🎯 Генерация персональных рекомендаций для пользователя ${targetUserId}`);

    // Получаем все данные пользователя (включая колонки mood_rating, stress_rating, success_rating для daily_mood_check и activity_analysis)
    const userDataQuery = `
      SELECT 
        s.type,
        s.data,
        s.timestamp,
        s.mood_rating,
        s.energy_rating,
        s.stress_rating,
        s.success_rating,
        s.notes,
        s.activity_category,
        s.duration_minutes,
        i.content as insight_content
      FROM ai_signals s
      LEFT JOIN ai_insights i ON s.user_id = i.user_id
      WHERE s.user_id = $1
      ORDER BY s.timestamp DESC
      LIMIT 50
    `;

    const userDataResult = await pool.query(userDataQuery, [targetUserId]);
    
    console.log(`📊 Загружено ${userDataResult.rows.length} записей сигналов для пользователя ${targetUserId}`);
    
    if (userDataResult.rows.length === 0) {
      console.log(`⚠️ Нет данных для пользователя ${targetUserId}, возвращаем сообщение по умолчанию`);
      return res.json({
        success: true,
        recommendations: ['Пока недостаточно данных для персонализированных рекомендаций. Продолжайте вести дневник!']
      });
    }

    // Безопасно парсим data (JSON)
    const parseSignalData = (data) => {
      if (!data) return null;
      if (typeof data === 'object') return data;
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    };

    // Настроение: учитываем и type=mood (из data), и type=daily_mood_check (из колонок mood_rating, stress_rating)
    const moodData = [];
    for (const row of userDataResult.rows) {
      if (row.type === 'mood') {
        const data = parseSignalData(row.data);
        if (data && (data.mood != null || data.stressLevel != null))
          moodData.push({ mood: data.mood, stress: data.stressLevel ?? data.stress, timestamp: row.timestamp });
      } else if (row.type === 'daily_mood_check') {
        if (row.mood_rating != null || row.stress_rating != null)
          moodData.push({ mood: row.mood_rating, stress: row.stress_rating, timestamp: row.timestamp });
      }
    }

    // Активности: учитываем и type=activity (из data), и type=activity_analysis (из колонок notes, success_rating)
    const activityData = [];
    for (const row of userDataResult.rows) {
      if (row.type === 'activity') {
        const data = parseSignalData(row.data);
        if (data)
          activityData.push({
            activity: data.activity ?? row.notes ?? row.activity_category ?? 'активность',
            success: data.success ?? (row.success_rating != null && row.success_rating >= 5),
            duration: data.duration ?? row.duration_minutes,
            timestamp: row.timestamp
          });
      } else if (row.type === 'activity_analysis') {
        activityData.push({
          activity: row.notes ?? row.activity_category ?? 'активность',
          success: row.success_rating != null && Number(row.success_rating) >= 5,
          duration: row.duration_minutes,
          timestamp: row.timestamp
        });
      }
    }

    console.log(`📈 Обработано ${moodData.length} записей настроения и ${activityData.length} активностей (включая daily_mood_check и activity_analysis)`);

    const moodList = moodData.map(d => d.mood != null ? d.mood : '-').join(', ');
    const stressList = moodData.map(d => d.stress != null ? d.stress : '-').join(', ');
    const activityList = activityData.map(d => d.activity || '-').join(', ');
    const successCount = activityData.filter(d => d.success).length;
    const totalActivities = activityData.length;
    const successPct = totalActivities ? Math.round((successCount / totalActivities) * 100) : 0;

    const prompt = `
      Ты - AI-эксперт по продуктивности и личному развитию. Проанализируй данные пользователя и создай 5 персонализированных рекомендаций.
      
      ДАННЫЕ ПОЛЬЗОВАТЕЛЯ (реальные записи настроения и активностей):
      📊 Настроение (${moodData.length} записей, шкала 0-10): ${moodList || 'нет данных'}
      📈 Уровень стресса (${moodData.length} записей, шкала 0-10): ${stressList || 'нет данных'}
      🎯 Активности (${activityData.length} записей): ${activityList || 'нет данных'}
      ✅ Успешность выполнения: ${successCount}/${totalActivities} (${successPct}%)
      
      ЗАДАЧА:
      Создай 5 конкретных рекомендаций в формате: 🎯 РЕКОМЕНДАЦИЯ N: [Название] + 1-2 предложения по сути. Кратко.
      
      СТИЛЬ: конкретные действия, мотивирующий тон, эмодзи для структуры. Используй реальные цифры из ДАННЫХ выше; при разбросе — диапазон или «в среднем», не одну цифру.
      Тон: поддерживающий, на русском.
      ДЛИНА: 180-220 слов всего.
    `;

    console.log('🤖 Генерируем персональные рекомендации...');
    const message = await retryApiCall(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 450,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });
    });

    const recommendations = cleanClaudeOutput(message.content[0].text);
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

    console.log(`✅ Персональные рекомендации успешно сгенерированы для пользователя ${targetUserId}`);
    res.json({
      success: true,
      recommendations: recommendations
    });

  } catch (error) {
    console.error('❌ Generate personal recommendations error:', error);
    console.error('📋 Детали ошибки:', {
      message: error.message,
      stack: error.stack,
      userId: req.body.userId
    });
    res.status(500).json({
      success: false,
      error: 'Ошибка генерации персональных рекомендаций: ' + error.message
    });
  }
});

// POST /api/ai/generate-daily-insight - Генерация еженедельного инсайта
// Правило: один отчёт за календарную неделю (пн–вс), при достаточности данных (минимум 3 записи за неделю)
router.post('/generate-daily-insight', async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      console.log('⚠️ userId не передан в запросе');
      return res.status(400).json({
        success: false,
        message: 'userId обязателен для генерации недельного инсайта'
      });
    }
    const forceRegenerate = req.body.forceRegenerate || false;
    console.log(`🔍 Генерация недельного инсайта для пользователя ${userId}`);

    // Правило: один отчёт за календарную неделю (пн–вс) при достаточности данных
    const { weekStart, weekEnd } = getWeekBounds(new Date());
    const weekStartIso = weekStart.toISOString();

    if (!forceRegenerate) {
      // Есть ли уже инсайт за эту неделю (по metadata.weekStart)
      const existingInsightQuery = `
        SELECT * FROM ai_insights 
        WHERE user_id = $1 
        AND type = 'weekly_insight'
        AND metadata->>'weekStart' = $2
        AND (metadata::text NOT LIKE '%testMode%' AND content NOT LIKE '%тестовый%' AND content NOT LIKE '%тест%')
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const existingInsight = await pool.query(existingInsightQuery, [userId, weekStartIso]);

      if (existingInsight.rows.length > 0) {
        console.log('ℹ️ Недельный инсайт уже существует за эту неделю (раз в неделю)');
        return res.json({
          success: true,
          insight: existingInsight.rows[0].content,
          isNew: false,
          weekStart: weekStartIso
        });
      }

      // Если есть тестовый инсайт за эту неделю — удаляем и генерируем новый
      const testInsightQuery = `
        SELECT * FROM ai_insights 
        WHERE user_id = $1 
        AND type = 'weekly_insight'
        AND metadata->>'weekStart' = $2
        AND (metadata::text LIKE '%testMode%' OR content LIKE '%тестовый%' OR content LIKE '%тест%')
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const testInsight = await pool.query(testInsightQuery, [userId, weekStartIso]);
      if (testInsight.rows.length > 0) {
        console.log('🧹 Найден тестовый инсайт за неделю, удаляем для генерации нового');
        await pool.query(`DELETE FROM ai_insights WHERE id = $1`, [testInsight.rows[0].id]);
      }
    }

    // Данные строго за текущую календарную неделю (пн 00:00 — вс 23:59)
    const dataQuery = `
      SELECT * FROM ai_signals 
      WHERE user_id = $1 
      AND timestamp >= $2
      AND timestamp <= $3
      ORDER BY timestamp DESC
    `;
    const dataResult = await pool.query(dataQuery, [userId, weekStart, weekEnd]);
    console.log(`📊 Найдено записей за неделю: ${dataResult.rows.length}`);

    // Проверяем минимальное количество записей для анализа
    // ИСПРАВЛЕНО: считаем записи настроения И активности
    const moodCount = dataResult.rows.filter(row => row.type === 'mood' || row.type === 'daily_mood_check').length;
    const activityCount = dataResult.rows.filter(row => row.type === 'activity' || row.type === 'activity_analysis').length;
    const totalCount = moodCount + activityCount;
    
    console.log(`📊 Данные для недельного отчета: настроений=${moodCount}, активностей=${activityCount}, всего=${totalCount}`);
    console.log(`📊 Типы записей в данных:`, [...new Set(dataResult.rows.map(r => r.type))]);
    
    
    if (totalCount < 3) {
      console.log(`ℹ️ Недостаточно данных за текущую неделю (нужно минимум 3 записи, есть ${totalCount})`);
      // Возвращаем последний сохранённый недельный инсайт (за прошлую неделю), если есть
      const latestQuery = `
        SELECT * FROM ai_insights 
        WHERE user_id = $1 AND type = 'weekly_insight'
        AND (metadata::text NOT LIKE '%testMode%' AND content NOT LIKE '%тестовый%' AND content NOT LIKE '%тест%')
        ORDER BY created_at DESC LIMIT 1
      `;
      const latest = await pool.query(latestQuery, [userId]);
      const fallbackInsight = latest.rows[0]?.content || 'Пока недостаточно данных за эту неделю для анализа. Продолжайте вести дневник настроения и активности — отчёт появится раз в неделю при достаточности данных.';
      return res.json({
        success: true,
        insight: fallbackInsight,
        isNew: false,
        weekStart: weekStartIso,
        metadata: {
          moodEntries: moodCount,
          activityEntries: activityCount,
          totalEntries: totalCount,
          availableTypes: [...new Set(dataResult.rows.map(r => r.type))]
        }
      });
    }
    
    console.log(`✅ Достаточно данных для генерации недельного отчета (${totalCount} записей)`);

    // Анализируем паттерны
    // ИСПРАВЛЕНО: используем правильные типы из БД
    const moodRows = dataResult.rows.filter(row => row.type === 'mood' || row.type === 'daily_mood_check');
    console.log(`📊 Найдено строк настроения для обработки: ${moodRows.length}`);
    
    const moodData = moodRows
      .map((row, index) => {
        // Если есть поля mood_rating, energy_rating, stress_rating напрямую - используем их
        if (row.mood_rating !== undefined && row.mood_rating !== null) {
          const parsed = {
            mood: row.mood_rating,
            energy: row.energy_rating || 5,
            stress: row.stress_rating || 5
          };
          console.log(`✅ Mood запись ${index + 1}: использованы прямые поля`, parsed);
          return parsed;
        }
        // Иначе пытаемся парсить из data JSONB
        if (row.data) {
          try {
            const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
            // Проверяем, что это объект настроения
            if (parsed && (parsed.mood !== undefined || parsed.mood_rating !== undefined)) {
              const result = {
                mood: parsed.mood || parsed.mood_rating || 5,
                energy: parsed.energy || parsed.energy_rating || 5,
                stress: parsed.stress || parsed.stress_rating || 5
              };
              console.log(`✅ Mood запись ${index + 1}: распарсена из JSON`, result);
              return result;
            }
          } catch (e) {
            console.log(`⚠️ Ошибка парсинга mood данных ${index + 1}: ${e.message}`, row.data);
          }
        }
        console.log(`⚠️ Mood запись ${index + 1}: пропущена (нет данных)`);
        return null;
      })
      .filter(Boolean);

    const activityRows = dataResult.rows.filter(row => row.type === 'activity' || row.type === 'activity_analysis');
    console.log(`📊 Найдено строк активности для обработки: ${activityRows.length}`);
    
    const activityData = activityRows
      .map((row, index) => {
        // Если есть поля напрямую - используем их
        if (row.success_rating !== undefined && row.success_rating !== null) {
          const parsed = {
            success: row.success_rating >= 7,
            success_rating: row.success_rating,
            category: row.activity_category || 'other',
            notes: row.notes || ''
          };
          console.log(`✅ Activity запись ${index + 1}: использованы прямые поля`, parsed);
          return parsed;
        }
        // Иначе пытаемся парсить из data JSONB
        if (row.data) {
          try {
            const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
            // Проверяем, что это объект активности
            if (parsed && (parsed.success !== undefined || parsed.success_rating !== undefined || parsed.activity !== undefined)) {
              const result = {
                success: parsed.success || (parsed.success_rating !== undefined ? parsed.success_rating >= 7 : true),
                success_rating: parsed.success_rating || (parsed.success ? 8 : 4),
                category: parsed.category || parsed.activity_category || 'other',
                notes: parsed.notes || ''
              };
              console.log(`✅ Activity запись ${index + 1}: распарсена из JSON`, result);
              return result;
            }
          } catch (e) {
            console.log(`⚠️ Ошибка парсинга activity данных ${index + 1}: ${e.message}`, row.data);
          }
        }
        console.log(`⚠️ Activity запись ${index + 1}: пропущена (нет данных)`);
        return null;
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

    console.log(`📈 Данные настроения после фильтрации: ${moodData.length} записей`);
    console.log(`📝 Данные активности после фильтрации: ${activityData.length} записей`);
    
    // Проверяем, что данные действительно есть после фильтрации
    if (moodData.length === 0 && activityData.length === 0) {
      console.log('⚠️ После фильтрации данных за неделю не осталось');
      const latestQuery = `
        SELECT * FROM ai_insights 
        WHERE user_id = $1 AND type = 'weekly_insight'
        AND (metadata::text NOT LIKE '%testMode%' AND content NOT LIKE '%тестовый%' AND content NOT LIKE '%тест%')
        ORDER BY created_at DESC LIMIT 1
      `;
      const latest = await pool.query(latestQuery, [userId]);
      const fallbackInsight = latest.rows[0]?.content || 'Пока недостаточно данных за эту неделю. Отчёт генерируется раз в неделю при достаточности данных.';
      return res.json({
        success: true,
        insight: fallbackInsight,
        isNew: false,
        weekStart: weekStartIso,
        metadata: {
          moodEntries: moodData.length,
          activityEntries: activityData.length,
          totalEntries: moodData.length + activityData.length,
          rawDataCount: dataResult.rows.length
        }
      });
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

    console.log('🤖 Отправляем запрос к Claude AI...');
    const message = await retryApiCall(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
      });
    });

    const insight = cleanClaudeOutput(message.content[0].text);
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
        model: 'claude-sonnet-4-20250514',
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
    const { userId, weekOffset = 0 } = req.body; // weekOffset: 0 = текущая неделя, -1 = прошлая
    const targetUserId = userId || 1;
    const refDate = new Date();
    refDate.setDate(refDate.getDate() + weekOffset * 7);
    const { weekStart, weekEnd } = getWeekBounds(refDate);

    console.log(`🔧 Принудительная регенерация недельного инсайта для пользователя ${targetUserId}, неделя: ${weekOffset} (пн–вс)`);

    // Удаляем существующий инсайт за эту неделю (по metadata.weekStart)
    const deleteQuery = `
      DELETE FROM ai_insights 
      WHERE user_id = $1 
      AND type = 'weekly_insight'
      AND metadata->>'weekStart' = $2
    `;
    await pool.query(deleteQuery, [targetUserId, weekStart.toISOString()]);
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
    // Получаем данные за указанную календарную неделю (включительно по weekEnd)
    const dataQuery = `
      SELECT * FROM ai_signals 
      WHERE user_id = $1 
      AND timestamp >= $2
      AND timestamp <= $3
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
        AND updated_at <= $3
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });
    });

    const insight = cleanClaudeOutput(message.content[0].text);

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

// GET /api/ai/recommendations — получить сохранённые рекомендации с объяснениями
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.query.user_id || req.query.userId || 1;

    // Получаем рекомендации с данными о льготах
    const query = `
      SELECT 
        br.benefit_id,
        br.priority,
        br.explanations,
        br.confidence,
        br.algorithm_variant,
        br.score_breakdown,
        br.created_at,
        b.name,
        b.description,
        b.category
      FROM benefit_recommendations br
      LEFT JOIN benefits b ON br.benefit_id = b.id
      WHERE br.user_id = $1
      ORDER BY br.priority ASC, br.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.json({
        hasRecommendations: false,
        variant: null,
        recommendations: []
      });
    }

    // Преобразуем в формат для фронта
    const recommendations = result.rows.map(row => {
      let explanations = [];
      let confidence = 0.6;
      let scoreBreakdown = {};
      let variant = row.algorithm_variant || 'static';

      try {
        explanations = Array.isArray(row.explanations) ? row.explanations : JSON.parse(row.explanations || '[]');
      } catch (e) {
        explanations = [];
      }

      try {
        scoreBreakdown = typeof row.score_breakdown === 'object' ? row.score_breakdown : JSON.parse(row.score_breakdown || '{}');
      } catch (e) {
        scoreBreakdown = {};
      }

      if (typeof row.confidence === 'number') {
        confidence = Math.max(0, Math.min(1, row.confidence));
      }

      return {
        benefit_id: row.benefit_id,
        name: row.name || 'Неизвестная льгота',
        description: row.description || '',
        category: row.category || 'Общее',
        priority: row.priority,
        score: scoreBreakdown.final || scoreBreakdown.test_score || 0.6,
        confidence,
        explanations,
        score_breakdown: scoreBreakdown
      };
    });

    res.json({
      hasRecommendations: true,
      variant: result.rows[0]?.algorithm_variant || 'static',
      recommendations
    });

  } catch (error) {
    console.error('Get AI recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения рекомендаций'
    });
  }
});

export default router;
