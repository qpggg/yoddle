const { Telegraf, Scenes, session } = require('telegraf');
const config = require('./config');

// Commands
const startCommand = require('./commands/start');
const demoCommand = require('./commands/demo');

// Scenes
const onboardingScene = require('./scenes/onboarding');
const miniDemoScene = require('./scenes/miniDemo');
const aiAdvisorScene = require('./scenes/aiAdvisor');

// Services
const { initDatabase } = require('./services/leadService');

// Create bot
const bot = new Telegraf(config.botToken);

// Create stage with scenes
const stage = new Scenes.Stage([
  onboardingScene,
  miniDemoScene,
  aiAdvisorScene
]);

// Middleware
bot.use(session());
bot.use(stage.middleware());

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ Произошла ошибка. Попробуйте позже или напишите /start');
});

// Commands
bot.command('start', startCommand);
bot.command('demo', demoCommand);
bot.command('help', (ctx) => {
  ctx.reply(
    '🤖 Команды бота:\n\n' +
    '/start - Начать знакомство с Yoddle\n' +
    '/demo - Посмотреть демо платформы\n' +
    '/help - Список команд'
  );
});

// Callback handlers
bot.action('start_onboarding', (ctx) => {
  ctx.answerCbQuery();
  ctx.scene.enter('onboarding');
});

bot.action('show_demo', (ctx) => {
  ctx.answerCbQuery();
  ctx.scene.enter('miniDemo');
});

bot.action('try_ai', (ctx) => {
  ctx.answerCbQuery();
  ctx.scene.enter('aiAdvisor');
});

bot.action('get_presentation', async (ctx) => {
  ctx.answerCbQuery();
  await ctx.reply(
    '📊 Отлично! Отправляю вам презентацию Yoddle.\n\n' +
    '👉 Презентация: [Скачать PDF](https://yoddle.ru/presentation.pdf)\n' +
    '🌐 Сайт: ' + config.webUrl,
    { parse_mode: 'Markdown' }
  );
});

bot.action('schedule_demo', async (ctx) => {
  ctx.answerCbQuery();
  await ctx.reply(
    '📞 Отлично! Давайте запланируем демо.\n\n' +
    '👉 Выберите удобное время: [Календарь](https://calendly.com/yoddle)\n\n' +
    'Или напишите ваш email, и мы свяжемся с вами:',
    { parse_mode: 'Markdown' }
  );
});

bot.action('open_website', async (ctx) => {
  ctx.answerCbQuery();
  await ctx.reply(
    '🌐 Открыть сайт Yoddle:\n' + config.webUrl + '\n\n' +
    'Узнайте больше о платформе, кейсах и возможностях!'
  );
});

// Initialize database and launch bot
(async () => {
  try {
    await initDatabase();
    console.log('✅ Database initialized');
    
    await bot.launch();
    console.log('🚀 Yoddle Telegram Bot запущен!');
    console.log('📱 Бот готов принимать сообщения');
  } catch (error) {
    console.error('❌ Ошибка запуска бота:', error);
    process.exit(1);
  }
})();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

