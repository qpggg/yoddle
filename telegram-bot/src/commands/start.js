const { Markup } = require('telegraf');
const messages = require('../utils/messages');

module.exports = async (ctx) => {
  const firstName = ctx.from.first_name || 'друг';
  
  await ctx.replyWithHTML(
    messages.welcome(firstName),
    Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Начать знакомство', 'start_onboarding')],
      [Markup.button.callback('📱 Посмотреть демо', 'show_demo')],
      [Markup.button.callback('🤖 Попробовать ИИ-советника', 'try_ai')],
      [Markup.button.url('🌐 Открыть сайт', 'https://yoddle.ru')]
    ])
  );
};

