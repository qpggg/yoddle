const { Scenes, Markup } = require('telegraf');
const { getAIAdvice } = require('../services/aiService');

const aiAdvisorScene = new Scenes.BaseScene('aiAdvisor');

// Вход в сцену
aiAdvisorScene.enter(async (ctx) => {
  ctx.session.aiAdvisor = { step: 'mood' };
  
  await ctx.replyWithHTML(
    '🤖 <b>ИИ-советник Yoddle</b>\n\n' +
    'Привет! Я помогу вам понять, как Yoddle может улучшить вашу работу.\n\n' +
    '🎭 <b>Как вы себя чувствуете на работе сегодня?</b>',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('😊 Отлично', 'mood_great'),
        Markup.button.callback('😐 Нормально', 'mood_ok')
      ],
      [
        Markup.button.callback('😔 Устал', 'mood_tired'),
        Markup.button.callback('😫 Выгорание', 'mood_burnout')
      ]
    ])
  );
});

// Обработка настроения
aiAdvisorScene.action(/mood_(.+)/, async (ctx) => {
  const moodMap = {
    great: { emoji: '😊', text: 'отлично' },
    ok: { emoji: '😐', text: 'нормально' },
    tired: { emoji: '😔', text: 'устали' },
    burnout: { emoji: '😫', text: 'выгорание' }
  };
  
  const mood = ctx.match[1];
  ctx.session.aiAdvisor.mood = moodMap[mood];
  
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `${moodMap[mood].emoji} Понял, вы чувствуете себя ${moodMap[mood].text}.\n\n` +
    '💼 <b>Что является вашей главной задачей сейчас?</b>',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📊 Управление командой', 'task_management')],
        [Markup.button.callback('🎯 Удержание сотрудников', 'task_retention')],
        [Markup.button.callback('💰 Оптимизация льгот', 'task_benefits')],
        [Markup.button.callback('📈 Повышение продуктивности', 'task_productivity')]
      ])
    }
  );
  
  ctx.session.aiAdvisor.step = 'task';
});

// Обработка задачи
aiAdvisorScene.action(/task_(.+)/, async (ctx) => {
  const taskMap = {
    management: 'Управление командой',
    retention: 'Удержание сотрудников',
    benefits: 'Оптимизация льгот',
    productivity: 'Повышение продуктивности'
  };
  
  const task = ctx.match[1];
  ctx.session.aiAdvisor.task = taskMap[task];
  
  await ctx.answerCbQuery();
  await ctx.editMessageText('⏳ Анализирую ваши ответы...');
  
  // Генерация персонализированного совета через ИИ
  try {
    const advice = await getAIAdvice({
      mood: ctx.session.aiAdvisor.mood.text,
      task: taskMap[task],
      role: ctx.session.onboarding?.role || 'HR-специалист',
      userId: ctx.from.id // Передаем telegram_id как userId
    });
    
    await ctx.editMessageText(
      `🤖 <b>Персональные рекомендации для вас:</b>\n\n${advice}\n\n` +
      '💡 <b>Хотите увидеть, как это работает на практике?</b>',
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📞 Записаться на демо', 'schedule_demo')],
          [Markup.button.callback('📊 Получить презентацию', 'get_presentation')],
          [Markup.button.callback('🔄 Попробовать еще раз', 'ai_restart')],
          [Markup.button.callback('⬅️ Главное меню', 'ai_exit')]
        ])
      }
    );
  } catch (error) {
    console.error('AI Advisor error:', error);
    await ctx.editMessageText(
      '❌ Произошла ошибка при генерации рекомендаций.\n' +
      'Попробуйте позже или свяжитесь с нами напрямую.'
    );
  }
});

aiAdvisorScene.action('ai_restart', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.reenter();
});

aiAdvisorScene.action('ai_exit', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('👋 Возвращайтесь! Напишите /start чтобы начать снова.');
  return ctx.scene.leave();
});

module.exports = aiAdvisorScene;





