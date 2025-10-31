const { Scenes, Markup } = require('telegraf');
const messages = require('../utils/messages');

const miniDemoScene = new Scenes.BaseScene('miniDemo');

// Вход в сцену
miniDemoScene.enter(async (ctx) => {
  await ctx.replyWithHTML(
    messages.demoIntro,
    Markup.inlineKeyboard([
      [Markup.button.callback('💰 Льготы', 'demo_benefits')],
      [Markup.button.callback('🤖 ИИ-советник', 'demo_ai')],
      [Markup.button.callback('🎮 Геймификация', 'demo_gamification')],
      [Markup.button.callback('📊 Аналитика', 'demo_analytics')],
      [Markup.button.callback('🎯 Кейсы', 'demo_cases')],
      [Markup.button.callback('⬅️ Назад', 'demo_back')]
    ])
  );
});

// Обработка модулей
miniDemoScene.action('demo_benefits', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    messages.demoBenefits,
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🤖 ИИ-советник', 'demo_ai')],
        [Markup.button.callback('🎮 Геймификация', 'demo_gamification')],
        [Markup.button.callback('⬅️ Назад к модулям', 'demo_back_menu')]
      ])
    }
  );
});

miniDemoScene.action('demo_ai', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    messages.demoAI,
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🤖 Попробовать ИИ сейчас', 'try_ai')],
        [Markup.button.callback('🎮 Геймификация', 'demo_gamification')],
        [Markup.button.callback('⬅️ Назад к модулям', 'demo_back_menu')]
      ])
    }
  );
});

miniDemoScene.action('demo_gamification', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    messages.demoGamification,
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📊 Аналитика', 'demo_analytics')],
        [Markup.button.callback('💰 Льготы', 'demo_benefits')],
        [Markup.button.callback('⬅️ Назад к модулям', 'demo_back_menu')]
      ])
    }
  );
});

miniDemoScene.action('demo_analytics', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    messages.demoAnalytics,
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🎯 Кейсы', 'demo_cases')],
        [Markup.button.callback('💰 Льготы', 'demo_benefits')],
        [Markup.button.callback('⬅️ Назад к модулям', 'demo_back_menu')]
      ])
    }
  );
});

miniDemoScene.action('demo_cases', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    messages.demoCases,
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📞 Записаться на демо', 'schedule_demo')],
        [Markup.button.callback('📊 Получить презентацию', 'get_presentation')],
        [Markup.button.callback('⬅️ Назад к модулям', 'demo_back_menu')]
      ])
    }
  );
});

miniDemoScene.action('demo_back_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.reenter();
});

miniDemoScene.action('demo_back', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('👋 Возвращайтесь! Напишите /start чтобы начать снова.');
  return ctx.scene.leave();
});

module.exports = miniDemoScene;





