const axios = require('axios');
const config = require('../config');

// Генерация персонализированного совета через Claude API
async function getAIAdvice({ mood, task, role }) {
  const prompt = `
      You are a compassionate AI friend-psychologist providing daily emotional support and advice to a Russian user. Your task is to analyze the user's input and generate a thoughtful, culturally appropriate response in Russian.

Here is the user's input:

<role>{{ROLE}}</role>
<mood>{{MOOD}}</mood>
<task>{{TASK}}</task>

Begin by analyzing the user's situation and planning your response. Wrap this process inside <emotional_analysis> tags:

<emotional_analysis>
1. Analyze the user's role and how it relates to their current mood
2. Evaluate the main task they're facing and its challenges
3. Classify the mood, considering arguments for different categories
4. Consider how the task relates to the user's current emotional state
5. Consider cultural context (Russian-specific idioms, proverbs, or cultural factors)
6. Choose an appropriate emoji (🎉, 😊, or 💪)
7. Prepare a brief analysis of the user's situation
8. Craft a thought-provoking question for self-reflection
9. Develop three pieces of tailored advice related to how Yoddle HR platform can help
10. Create a short, optimistic forecast
11. Generate 2-3 creative metaphors or analogies related to the user's situation (consider Russian nature, literature, or daily life)
12. Consider potential tool calls (e.g., for translation or cultural references) and note required parameters
</emotional_analysis>

After completing your analysis, provide your response in Russian. IMPORTANT: Your response MUST contain exactly 4 paragraphs, separated by empty lines. The total response should be between 80-100 words to provide comprehensive and helpful advice.

Response structure:
Paragraph 1: Emotional reaction with emoji (1-2 sentences)
Paragraph 2: Situation analysis and thought-provoking question (2-3 sentences)
Paragraph 3: Three specific pieces of advice about how Yoddle can help (3-4 sentences, mention specific platform modules: benefits, gamification, AI analytics)
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
- Mention specific Yoddle platform modules (benefits, gamification, AI analytics) naturally

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
  const filledPrompt = prompt
    .replace('{{ROLE}}', role || 'HR-специалист')
    .replace('{{MOOD}}', mood || 'N/A')
    .replace('{{TASK}}', task || 'N/A');

  // Попытка через Claude API
  if (config.claudeApiKey) {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: filledPrompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 10000
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error.message);
    }
  }

  // Попытка через OpenRouter
  if (config.openRouterApiKey) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'anthropic/claude-sonnet-4-20250514',
          messages: [
            {
              role: 'user',
              content: filledPrompt
            }
          ],
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${config.openRouterApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API error:', error.message);
    }
  }

  // Fallback: Rule-based ответы
  return getRuleBasedAdvice({ mood, task, role });
}

// Rule-based советы как fallback
function getRuleBasedAdvice({ mood, task, role }) {
  const adviceMap = {
    'Управление командой': {
      'отлично': '🎯 Отлично! Для эффективного управления командой Yoddle предлагает дашборд руководителя с аналитикой вовлеченности в реальном времени. Вы увидите, кто нуждается в поддержке, еще до того, как возникнут проблемы. Геймификация поможет мотивировать команду через здоровую конкуренцию и признание достижений. 📊',
      'нормально': '💪 Понимаю! Управление командой - это вызов. Yoddle автоматизирует рутину: отслеживает настроение сотрудников, предлагает персональные льготы и показывает, кто рискует выгореть. ИИ-аналитика подскажет, какие действия принесут максимальный эффект для вашей команды. 🎯',
      'устали': '🤝 Вы не одни! 70% HR-специалистов испытывают перегрузку. Yoddle берет на себя рутину: автоматические напоминания о льготах, ИИ-рекомендации, готовые отчеты для руководства. Освободите 40-50 часов в месяц для стратегических задач. 💡',
      'выгорание': '🆘 Выгорание - серьезный сигнал. Yoddle поможет восстановить баланс: автоматизация повторяющихся задач, персональные wellness-программы для вас и команды, ИИ-поддержка 24/7. Начните с малого - позвольте платформе взять часть задач на себя. 🌱'
    },
    'Удержание сотрудников': {
      'отлично': '🎉 Удержание - ключевая метрика! Yoddle снижает текучесть на 15-25% через персонализированные льготы, геймификацию и постоянную обратную связь. ИИ предсказывает риски ухода и предлагает меры по удержанию для каждого сотрудника индивидуально. 🎯',
      'нормально': '💎 Yoddle превращает удержание в систему, а не в тушение пожаров. Платформа анализирует вовлеченность, автоматически предлагает персональные льготы и создает ощущение заботы через геймификацию и признание достижений. Результат: -15-25% текучести. 📊',
      'устали': '🔍 Постоянные увольнения выматывают. Yoddle выявляет причины текучести через ИИ-анализ обратной связи, автоматически предлагает решения и показывает, что работает. Один клиент снизил текучесть с 40% до 18% за 6 месяцев. Можем показать, как это сделать! 💪',
      'выгорание': '⚠️ Высокая текучесть + выгорание HR = катастрофа. Yoddle автоматизирует удержание: ИИ предсказывает риски ухода, платформа сама предлагает персональные меры, геймификация создает позитивную среду. Результат: экономия 1,1 млн ₽ в год на компанию в 100 человек. 🚀'
    },
    'Оптимизация льгот': {
      'отлично': '💰 Оптимизация льгот - прямая экономия! Yoddle показывает, какие льготы используются (70-85% активация), а какие - пустая трата денег. ИИ рекомендует персональные наборы для каждого сотрудника, увеличивая ценность при тех же затратах. 📈',
      'нормально': '🎯 Yoddle решает главную боль HR: неиспользуемые льготы. Платформа геймифицирует активацию (70-85% vs 20-30% обычно), ИИ подбирает релевантные предложения, аналитика показывает ROI каждой льготы. Результат: экономия до 30% бюджета. 💡',
      'устали': '⚡ Устали объяснять сотрудникам про льготы? Yoddle делает это за вас: автоматические напоминания, персональные рекомендации ИИ, понятный каталог с рейтингами. 85% сотрудников активно используют льготы без вашего участия. 🎁',
      'выгорание': '🆘 Управление льготами не должно быть таким сложным. Yoddle полностью автоматизирует процесс: ИИ подбирает, платформа напоминает, геймификация мотивирует. Вы просто смотрите отчеты и видите рост удовлетворенности на 30%. Дайте себе передышку! 🌟'
    },
    'Повышение продуктивности': {
      'отлично': '🚀 Повышение продуктивности на 10-15% - это реально! Yoddle использует геймификацию для мотивации, ИИ-советы для улучшения well-being, персональные льготы для поддержки баланса. Результат: счастливые сотрудники работают эффективнее. 📊',
      'нормально': '💪 Продуктивность = well-being + мотивация. Yoddle повышает оба показателя: персональные wellness-программы снижают выгорание, геймификация создает азарт, льготы показывают заботу. Клиенты видят +10-15% продуктивности через 6-12 месяцев. 🎯',
      'устали': '⚡ Устали требовать продуктивность? Yoddle работает по-другому: создает условия, где люди хотят работать лучше. Геймификация, признание достижений, персональная поддержка ИИ, релевантные льготы. Результат приходит естественно. 🌱',
      'выгорание': '🆘 Выгоревшие люди не могут быть продуктивными. Yoddle начинает с восстановления: wellness-льготы, ИИ-поддержка mental health, геймификация для позитива. Продуктивность вернется, когда вернется энергия. Один из клиентов увеличил NPS с 6 до 8.2 за 4 месяца. 🌟'
    }
  };

  const taskAdvice = adviceMap[task];
  if (taskAdvice && taskAdvice[mood]) {
    return taskAdvice[mood];
  }

  // Default fallback
  return `💡 ${role}, учитывая что вы чувствуете себя ${mood} и фокусируетесь на ${task}, Yoddle может помочь автоматизировать рутину, предоставить ИИ-аналитику для принятия решений и повысить вовлеченность команды через геймификацию. Давайте обсудим конкретные решения на демо! 🚀`;
}

module.exports = {
  getAIAdvice
};





