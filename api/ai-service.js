const Anthropic = require('@anthropic-ai/sdk');
const { Pool } = require('pg');

class AIService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  // Анализ настроения с персонализацией
  async analyzeMood(userId, moodData) {
    try {
      // Получаем настройки пользователя
      const userPrefs = await this.getUserPreferences(userId);
      
      // Получаем историю для контекста
      const history = await this.getMoodHistory(userId, 7);
      
      const prompt = this.buildMoodAnalysisPrompt(moodData, history, userPrefs);
      
      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      });

      const analysis = message.content[0].text;
      
      // Сохраняем результат
      await this.saveInsight(userId, 'mood_analysis', analysis, {
        mood: moodData.mood,
        activities: moodData.activities,
        stressLevel: moodData.stressLevel
      });

      return {
        success: true,
        analysis,
        recommendations: this.extractRecommendations(analysis),
        moodTrend: this.calculateMoodTrend(history)
      };

    } catch (error) {
      console.error('Mood analysis error:', error);
      throw new Error('Ошибка анализа настроения');
    }
  }

  // Генерация еженедельного инсайта
  async generateWeeklyInsight(userId) {
    try {
      const userPrefs = await this.getUserPreferences(userId);
      const weekData = await this.getWeekData(userId);
      
      if (weekData.length === 0) {
        return {
          success: true,
          insight: 'Пока недостаточно данных для анализа. Продолжайте вести дневник продуктивности!',
          type: 'no_data'
        };
      }

      const prompt = this.buildWeeklyInsightPrompt(weekData, userPrefs);
      
      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      });

      const insight = message.content[0].text;
      
      await this.saveInsight(userId, 'weekly_insight', insight, {
        weekStart: weekData[0]?.timestamp,
        weekEnd: weekData[weekData.length - 1]?.timestamp,
        dataPoints: weekData.length
      });

      return {
        success: true,
        insight,
        type: 'weekly_analysis',
        metrics: this.calculateWeeklyMetrics(weekData)
      };

    } catch (error) {
      console.error('Weekly insight error:', error);
      throw new Error('Ошибка генерации еженедельного инсайта');
    }
  }

  // Анализ активности и рекомендации
  async analyzeActivity(userId, activityData) {
    try {
      const userPrefs = await this.getUserPreferences(userId);
      const recentActivities = await this.getRecentActivities(userId, 5);
      
      const prompt = this.buildActivityAnalysisPrompt(activityData, recentActivities, userPrefs);
      
      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      });

      const analysis = message.content[0].text;
      
      // Сохраняем рекомендацию
      await this.saveRecommendation(userId, activityData.category, analysis, 
        activityData.success ? 'low' : 'high');

      return {
        success: true,
        analysis,
        category: activityData.category,
        priority: activityData.success ? 'low' : 'high'
      };

    } catch (error) {
      console.error('Activity analysis error:', error);
      throw new Error('Ошибка анализа активности');
    }
  }

  // Генерация персонализированных рекомендаций
  async generatePersonalRecommendations(userId) {
    try {
      const userPrefs = await this.getUserPreferences(userId);
      const recentData = await this.getRecentData(userId, 14);
      const goals = await this.getUserGoals(userId);
      
      const prompt = this.buildRecommendationsPrompt(recentData, goals, userPrefs);
      
      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      });

      const recommendations = message.content[0].text;
      
      // Парсим и сохраняем рекомендации
      const parsedRecs = this.parseRecommendations(recommendations);
      await this.saveMultipleRecommendations(userId, parsedRecs);

      return {
        success: true,
        recommendations: parsedRecs,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Recommendations generation error:', error);
      throw new Error('Ошибка генерации рекомендаций');
    }
  }

  // Получение настроек пользователя
  async getUserPreferences(userId) {
    const query = 'SELECT * FROM ai_user_preferences WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      // Создаем базовые настройки
      const defaultPrefs = {
        analysis_frequency: 'daily',
        privacy_level: 'standard',
        ai_personality: 'supportive',
        notification_preferences: { email: true, push: true, in_app: true }
      };
      
      await this.pool.query(
        'INSERT INTO ai_user_preferences (user_id, analysis_frequency, privacy_level, ai_personality, notification_preferences) VALUES ($1, $2, $3, $4, $5)',
        [userId, defaultPrefs.analysis_frequency, defaultPrefs.privacy_level, defaultPrefs.ai_personality, JSON.stringify(defaultPrefs.notification_preferences)]
      );
      
      return defaultPrefs;
    }
    
    return result.rows[0];
  }

  // Получение истории настроения
  async getMoodHistory(userId, days) {
    const query = `
      SELECT data, timestamp FROM ai_signals 
      WHERE user_id = $1 AND type = 'mood' 
      AND timestamp >= NOW() - INTERVAL '${days} days'
      ORDER BY timestamp DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  // Получение данных за неделю
  async getWeekData(userId) {
    const query = `
      SELECT * FROM ai_signals 
      WHERE user_id = $1 
      AND timestamp >= NOW() - INTERVAL '7 days'
      ORDER BY timestamp ASC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  // Получение недавних активностей
  async getRecentActivities(userId, limit) {
    const query = `
      SELECT * FROM ai_signals 
      WHERE user_id = $1 AND type = 'activity'
      ORDER BY timestamp DESC 
      LIMIT $2
    `;
    
    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
  }

  // Получение недавних данных
  async getRecentData(userId, days) {
    const query = `
      SELECT * FROM ai_signals 
      WHERE user_id = $1 
      AND timestamp >= NOW() - INTERVAL '${days} days'
      ORDER BY timestamp DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  // Получение целей пользователя
  async getUserGoals(userId) {
    const query = `
      SELECT data FROM ai_signals 
      WHERE user_id = $1 AND type = 'goal'
      ORDER BY timestamp DESC 
      LIMIT 5
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows.map(row => JSON.parse(row.data));
  }

  // Сохранение инсайта
  async saveInsight(userId, type, content, metadata = {}) {
    const query = `
      INSERT INTO ai_insights (user_id, type, content, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await this.pool.query(query, [userId, type, content, JSON.stringify(metadata), new Date()]);
  }

  // Сохранение рекомендации
  async saveRecommendation(userId, category, message, priority = 'medium') {
    const query = `
      INSERT INTO ai_recommendations (user_id, category, message, priority, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await this.pool.query(query, [userId, category, message, priority, new Date()]);
  }

  // Сохранение множественных рекомендаций
  async saveMultipleRecommendations(userId, recommendations) {
    for (const rec of recommendations) {
      await this.saveRecommendation(userId, rec.category, rec.message, rec.priority);
    }
  }

  // Построение промпта для анализа настроения
  buildMoodAnalysisPrompt(moodData, history, userPrefs) {
    const personality = this.getPersonalityTone(userPrefs.ai_personality);
    
    return `
      ${personality} проанализируй настроение пользователя и дай персональные рекомендации:
      
      Текущее настроение: ${moodData.mood}/10
      Активности: ${moodData.activities.join(', ')}
      Заметки: ${moodData.notes || 'Нет'}
      Уровень стресса: ${moodData.stressLevel}/10
      
      История настроения (последние 7 дней): ${history.map(h => JSON.parse(h.data).mood).join(', ')}
      
      Дай:
      1. Краткий анализ текущего состояния (2-3 предложения)
      2. 3 конкретных рекомендации для улучшения настроения
      3. Прогноз на завтра с учетом паттернов
      4. Мотивационное сообщение
      
      Тон: ${personality}, дружелюбный, поддерживающий. Ответ на русском языке.
    `;
  }

  // Построение промпта для еженедельного инсайта
  buildWeeklyInsightPrompt(weekData, userPrefs) {
    const personality = this.getPersonalityTone(userPrefs.ai_personality);
    
    const moodTrend = this.calculateMoodTrend(weekData.filter(d => d.type === 'mood'));
    const activitySummary = this.summarizeActivities(weekData.filter(d => d.type === 'activity'));
    
    return `
      ${personality} проанализируй неделю пользователя и создай персональный инсайт:
      
      Тренд настроения: ${moodTrend}
      Активности: ${activitySummary}
      Общее количество записей: ${weekData.length}
      
      Создай:
      1. Краткий анализ недели (3-4 предложения)
      2. Выявленные паттерны и тренды
      3. 3-5 конкретных рекомендаций на следующую неделю
      4. Мотивационное сообщение для продолжения
      5. Прогноз на следующую неделю
      
      Тон: ${personality}, дружелюбный, поддерживающий, конкретный. На русском языке.
    `;
  }

  // Построение промпта для анализа активности
  buildActivityAnalysisPrompt(activityData, recentActivities, userPrefs) {
    const personality = this.getPersonalityTone(userPrefs.ai_personality);
    
    return `
      ${personality} проанализируй активность пользователя:
      
      Текущая активность: ${activityData.activity}
      Категория: ${activityData.category}
      Длительность: ${activityData.duration} минут
      Успех: ${activityData.success ? 'Да' : 'Нет'}
      Заметки: ${activityData.notes || 'Нет'}
      
      Недавние активности: ${recentActivities.map(a => JSON.parse(a.data).activity).join(', ')}
      
      Дай краткую мотивационную рекомендацию (1-2 предложения) на русском языке.
      Если неудача - поддержка и конкретный совет. Если успех - похвала и следующий шаг.
      Тон: ${personality}, дружелюбный.
    `;
  }

  // Построение промпта для рекомендаций
  buildRecommendationsPrompt(recentData, goals, userPrefs) {
    const personality = this.getPersonalityTone(userPrefs.ai_personality);
    
    return `
      ${personality} создай персональные рекомендации для пользователя:
      
      Недавние данные (14 дней): ${recentData.length} записей
      Цели: ${goals.map(g => g.title || g.description).join(', ')}
      
      Создай 5-7 конкретных рекомендаций в формате:
      - Категория: [категория]
      - Приоритет: [high/medium/low]
      - Рекомендация: [конкретный совет]
      
      Категории: продуктивность, здоровье, обучение, отдых, отношения
      Тон: ${personality}, дружелюбный, конкретный. На русском языке.
    `;
  }

  // Получение тона личности AI
  getPersonalityTone(personality) {
    const tones = {
      'supportive': 'Поддерживающе',
      'motivational': 'Мотивационно',
      'analytical': 'Аналитически',
      'friendly': 'Дружелюбно'
    };
    
    return tones[personality] || 'Поддерживающе';
  }

  // Извлечение рекомендаций из текста
  extractRecommendations(analysis) {
    // Простой парсинг рекомендаций
    const recommendations = [];
    const lines = analysis.split('\n');
    
    for (const line of lines) {
      if (line.includes('рекомендация') || line.includes('совет') || line.includes('•')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations.slice(0, 3); // Возвращаем первые 3
  }

  // Расчет тренда настроения
  calculateMoodTrend(history) {
    if (history.length < 2) return 'недостаточно данных';
    
    const moods = history.map(h => JSON.parse(h.data).mood);
    const recent = moods.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, moods.length);
    const older = moods.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, moods.length);
    
    if (recent > older + 1) return 'улучшается';
    if (recent < older - 1) return 'ухудшается';
    return 'стабильно';
  }

  // Суммаризация активностей
  summarizeActivities(activities) {
    if (activities.length === 0) return 'нет данных';
    
    const categories = {};
    activities.forEach(activity => {
      const data = JSON.parse(activity.data);
      categories[data.category] = (categories[data.category] || 0) + 1;
    });
    
    return Object.entries(categories)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ');
  }

  // Расчет недельных метрик
  calculateWeeklyMetrics(weekData) {
    const moodData = weekData.filter(d => d.type === 'mood');
    const activityData = weekData.filter(d => d.type === 'activity');
    
    return {
      moodEntries: moodData.length,
      activityEntries: activityData.length,
      averageMood: moodData.length > 0 
        ? moodData.reduce((sum, d) => sum + JSON.parse(d.data).mood, 0) / moodData.length 
        : 0,
      totalActivities: activityData.length,
      successRate: activityData.length > 0
        ? activityData.filter(d => JSON.parse(d.data).success).length / activityData.length * 100
        : 0
    };
  }

  // Парсинг рекомендаций
  parseRecommendations(text) {
    const recommendations = [];
    const lines = text.split('\n');
    
    let currentRec = {};
    
    for (const line of lines) {
      if (line.includes('Категория:')) {
        if (currentRec.category) recommendations.push(currentRec);
        currentRec = { category: line.split(':')[1]?.trim() };
      } else if (line.includes('Приоритет:')) {
        currentRec.priority = line.split(':')[1]?.trim() || 'medium';
      } else if (line.includes('Рекомендация:')) {
        currentRec.message = line.split(':')[1]?.trim() || line.trim();
      }
    }
    
    if (currentRec.category) recommendations.push(currentRec);
    
    return recommendations;
  }

  // Закрытие соединения с БД
  async close() {
    await this.pool.end();
  }
}

module.exports = AIService;
