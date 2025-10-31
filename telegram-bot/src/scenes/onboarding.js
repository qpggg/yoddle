const { Scenes, Markup } = require('telegraf');
const validator = require('validator');
const { saveLead } = require('../services/leadService');
const messages = require('../utils/messages');

const onboardingScene = new Scenes.BaseScene('onboarding');

// Вход в сцену
onboardingScene.enter(async (ctx) => {
  ctx.session.onboarding = {};
  
  await ctx.replyWithHTML(
    '👋 Отлично! Давайте познакомимся.\n\n' +
    '<b>Какая у вас роль?</b>',
    Markup.inlineKeyboard([
      [Markup.button.callback('👔 HR-специалист', 'role_hr')],
      [Markup.button.callback('💼 C-Level (CEO, CFO, COO)', 'role_clevel')],
      [Markup.button.callback('🏢 Собственник бизнеса', 'role_owner')],
      [Markup.button.callback('📊 Консультант', 'role_consultant')],
      [Markup.button.callback('👤 Другое', 'role_other')]
    ])
  );
});

// Обработка выбора роли
onboardingScene.action(/role_(.+)/, async (ctx) => {
  const roleMap = {
    hr: 'HR-специалист',
    clevel: 'C-Level',
    owner: 'Собственник бизнеса',
    consultant: 'Консультант',
    other: 'Другое'
  };
  
  const role = ctx.match[1];
  ctx.session.onboarding.role = roleMap[role];
  
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `✅ Отлично, ${roleMap[role]}!\n\n` +
    '📧 Оставьте ваш email, чтобы мы могли отправить вам:\n' +
    '• Презентацию платформы\n' +
    '• Доступ к демо-версии\n' +
    '• Кейсы внедрения\n\n' +
    'Напишите ваш email:'
  );
  
  ctx.session.onboarding.step = 'awaiting_email';
});

// Обработка email
onboardingScene.on('text', async (ctx) => {
  if (ctx.session.onboarding.step === 'awaiting_email') {
    const email = ctx.message.text.trim();
    
    if (!validator.isEmail(email)) {
      await ctx.reply('❌ Некорректный email. Попробуйте еще раз:');
      return;
    }
    
    ctx.session.onboarding.email = email;
    
    await ctx.replyWithHTML(
      '✅ Email сохранен!\n\n' +
      '<b>Что вас интересует в Yoddle?</b>\n' +
      'Выберите один или несколько пунктов:',
      Markup.inlineKeyboard([
        [Markup.button.callback('💰 Корпоративные льготы', 'interest_benefits')],
        [Markup.button.callback('🤖 ИИ-рекомендации', 'interest_ai')],
        [Markup.button.callback('🎮 Геймификация', 'interest_gamification')],
        [Markup.button.callback('📊 Аналитика и отчетность', 'interest_analytics')],
        [Markup.button.callback('✅ Завершить', 'interest_done')]
      ])
    );
    
    ctx.session.onboarding.step = 'selecting_interests';
    ctx.session.onboarding.interests = [];
  }
});

// Обработка интересов
onboardingScene.action(/interest_(.+)/, async (ctx) => {
  const interest = ctx.match[1];
  
  if (interest === 'done') {
    await ctx.answerCbQuery();
    
    // Сохраняем лид в БД
    try {
      const leadData = {
        telegram_id: ctx.from.id,
        username: ctx.from.username,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        role: ctx.session.onboarding.role,
        email: ctx.session.onboarding.email,
        interests: ctx.session.onboarding.interests,
        source: 'telegram_bot'
      };
      
      await saveLead(leadData);
      
      await ctx.editMessageText(
        messages.onboardingComplete(
          ctx.session.onboarding.role,
          ctx.session.onboarding.email
        ),
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📱 Посмотреть демо', 'show_demo')],
            [Markup.button.callback('🤖 Попробовать ИИ-советника', 'try_ai')],
            [Markup.button.callback('📊 Получить презентацию', 'get_presentation')],
            [Markup.button.callback('📞 Записаться на демо', 'schedule_demo')]
          ])
        }
      );
      
      // Уведомление админу
      if (ctx.telegram && process.env.ADMIN_CHAT_ID) {
        await ctx.telegram.sendMessage(
          process.env.ADMIN_CHAT_ID,
          `🆕 Новый лид!\n\n` +
          `👤 ${leadData.first_name} ${leadData.last_name || ''}\n` +
          `💼 ${leadData.role}\n` +
          `📧 ${leadData.email}\n` +
          `🎯 Интересы: ${leadData.interests.join(', ') || 'не указаны'}\n` +
          `🔗 @${leadData.username || 'нет username'}`
        );
      }
      
    } catch (error) {
      console.error('Error saving lead:', error);
      await ctx.reply('❌ Произошла ошибка при сохранении данных. Попробуйте позже.');
    }
    
    return ctx.scene.leave();
  }
  
  const interestMap = {
    benefits: 'Корпоративные льготы',
    ai: 'ИИ-рекомендации',
    gamification: 'Геймификация',
    analytics: 'Аналитика и отчетность'
  };
  
  const interestName = interestMap[interest];
  
  if (!ctx.session.onboarding.interests.includes(interestName)) {
    ctx.session.onboarding.interests.push(interestName);
    await ctx.answerCbQuery(`✅ Добавлено: ${interestName}`);
  } else {
    await ctx.answerCbQuery('Уже добавлено');
  }
});

module.exports = onboardingScene;





