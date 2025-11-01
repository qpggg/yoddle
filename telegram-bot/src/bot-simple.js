const { Telegraf, Markup, session } = require('telegraf');
const path = require('path');

// Загружаем .env из корня проекта (yoddle1/.env)
const rootEnvPath = path.join(__dirname, '..', '..', '.env');
const localEnvPath = path.join(__dirname, '..', '.env');

require('dotenv').config({ 
  path: rootEnvPath 
});

// Пробуем также загрузить локальный .env если он есть
require('dotenv').config({ 
  path: localEnvPath,
  override: false // Не перезаписывать переменные из корневого .env
});

// Логируем, откуда загружаются переменные
if (process.env.BOT_TOKEN) {
  console.log(`✅ .env файл загружен из: ${rootEnvPath}`);
} else {
  console.warn(`⚠️  .env файл не найден в корне проекта: ${rootEnvPath}`);
}

const fs = require('fs');
const axios = require('axios');

// Импортируем сервис для работы с БД
const { getLeadByTelegramId, saveLead, initDatabase, checkAIUsageLimit } = require('./services/leadService');

// Импортируем конфигурацию
const config = require('./config');

// Создаем бота
const bot = new Telegraf(process.env.BOT_TOKEN);

// Middleware для session (сохранение состояния пользователя в рамках одного сеанса)
bot.use(session());

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ Произошла ошибка. Попробуйте позже или напишите /start');
});

// Функция для показа главного меню (после завершения онбординга)
function showMainMenu(ctx, firstName, role = null) {
  const greeting = role 
    ? `👋 Рад снова видеть, <b>${firstName}</b>!\n\n` +
      `Я помню, что вы <b>${role}</b>. Готовы продолжить работу с Yoddle?\n\n`
    : `👋 С возвращением, <b>${firstName}</b>!\n\n`;
  
  return ctx.replyWithHTML(
    greeting +
    `<b>🚀 Что вас интересует?</b>`,
    Markup.inlineKeyboard([
      [Markup.button.callback('📱 Посмотреть демо', 'show_demo')],
      [Markup.button.callback('🤖 Попробовать ИИ-советника', 'try_ai')],
      [Markup.button.callback('📊 Получить презентацию', 'get_presentation')],
      [Markup.button.callback('📞 Записаться на демо', 'schedule_demo')],
      [Markup.button.url('🌐 Открыть сайт', 'https://yoddle.ru')]
    ])
  );
}

// Команда /start
bot.command('start', async (ctx) => {
  const firstName = ctx.from.first_name || 'друг';
  const telegramId = ctx.from.id;
  
  // Инициализируем session если её нет
  if (!ctx.session) {
    ctx.session = {};
  }
  
  // Сохраняем текущее состояние ИИ-советника (если есть), чтобы не потерять прогресс
  const aiAdvisorState = ctx.session.aiAdvisor;
  
  try {
    // ПРОВЕРЯЕМ БД: завершил ли пользователь онбординг ранее?
    const existingLead = await getLeadByTelegramId(telegramId);
    
    if (existingLead && existingLead.email) {
      // Пользователь УЖЕ зарегистрирован в БД - показываем главное меню
      ctx.session.onboardingCompleted = true; // Сохраняем в session для быстрого доступа
      
      // Восстанавливаем состояние ИИ-советника, если оно было
      if (aiAdvisorState) {
        ctx.session.aiAdvisor = aiAdvisorState;
      }
      
      await showMainMenu(ctx, firstName, existingLead.role);
      return;
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке БД:', error);
    // Если БД недоступна, продолжаем с обычной логикой
  }
  
  // Проверяем session (на случай если онбординг прошел в текущей сессии)
  if (ctx.session.onboardingCompleted) {
    // Восстанавливаем состояние ИИ-советника, если оно было
    if (aiAdvisorState) {
      ctx.session.aiAdvisor = aiAdvisorState;
    }
    
    await showMainMenu(ctx, firstName);
    return;
  }
  
  // НОВЫЙ пользователь - показываем приветствие с кнопкой "Начать знакомство"
  await ctx.replyWithHTML(
    `👋 Привет, <b>${firstName}</b>!\n\n` +
    `Я — ассистент <b>Yoddle</b>, первой в России HR-платформы с ИИ-советником и геймификацией.\n\n` +
    `<b>🎯 Что умеет Yoddle:</b>\n` +
    `• 💰 Управление корпоративными льготами\n` +
    `• 🤖 ИИ-рекомендации для сотрудников\n` +
    `• 🎮 Геймификация для вовлечения\n` +
    `• 📊 Аналитика и отчетность для руководства\n\n` +
    `Давайте начнем знакомство!`,
    Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Начать знакомство', 'start_onboarding')],
      [Markup.button.url('🌐 Открыть сайт', 'https://yoddle.ru')]
    ])
  );
});

// Обработка кнопки "Начать знакомство"
bot.action('start_onboarding', async (ctx) => {
  await ctx.answerCbQuery();
  
  // Инициализируем session для онбординга
  if (!ctx.session) {
    ctx.session = {};
  }
  ctx.session.onboarding = {
    step: 'role'
  };
  
  await ctx.editMessageText(
    '👋 Отлично! Давайте познакомимся.\n\n' +
    '<b>Какая у вас роль?</b>',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('👔 HR-специалист', 'role_hr')],
        [Markup.button.callback('💼 C-Level (CEO, CFO, COO)', 'role_clevel')],
        [Markup.button.callback('🏢 Собственник бизнеса', 'role_owner')],
        [Markup.button.callback('📊 Консультант', 'role_consultant')],
        [Markup.button.callback('👤 Другое', 'role_other')]
      ])
    }
  );
});

// Обработка выбора роли
bot.action(/role_(.+)/, async (ctx) => {
  const roleMap = {
    hr: 'HR-специалист',
    clevel: 'C-Level',
    owner: 'Собственник бизнеса',
    consultant: 'Консультант',
    other: 'Другое'
  };
  
  const role = ctx.match[1];
  const roleName = roleMap[role];
  
  // Сохраняем роль в session
  if (!ctx.session) {
    ctx.session = {};
  }
  if (!ctx.session.onboarding) {
    ctx.session.onboarding = {};
  }
  ctx.session.onboarding.role = roleName;
  ctx.session.onboarding.step = 'email';
  
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `✅ Отлично, ${roleName}!\n\n` +
    '📧 Оставьте ваш email, чтобы мы могли отправить вам:\n' +
    '• Презентацию платформы\n' +
    '• Калькулятор ROI для вашей компании\n\n' +
    'Напишите ваш email:'
  );
});

// Обработка email (только если мы в процессе онбординга на этапе email)
bot.on('text', async (ctx) => {
  // Проверяем, что мы в процессе онбординга и ожидаем email
  if (!ctx.session?.onboarding || ctx.session.onboarding.step !== 'email') {
    return; // Не обрабатываем, если не в процессе онбординга
  }
  
  const text = ctx.message.text.trim();
  
  // Простая проверка email
  if (text.includes('@') && text.includes('.')) {
    // Сохраняем email в session
    ctx.session.onboarding.email = text;
    ctx.session.onboarding.step = 'interests';
    ctx.session.onboarding.interests = [];
    
    await ctx.replyWithHTML(
      '✅ Email сохранен!\n\n' +
      '<b>Что вас интересует в Yoddle?</b>\n' +
      'Выберите один или несколько пунктов:',
      Markup.inlineKeyboard([
        [Markup.button.callback('💰 Корпоративные льготы', 'interest_benefits')],
        [Markup.button.callback('🤖 ИИ-рекомендации', 'interest_ai')],
        [Markup.button.callback('🎮 Геймификация', 'interest_gamification')],
        [Markup.button.callback('📊 Аналитика и отчетность', 'interest_analytics')],
        [Markup.button.callback('✅ Завершить', 'interest_done')],
        [Markup.button.callback('⏭️ Пропустить', 'interest_skip')]
      ])
    );
  } else {
    await ctx.reply('❌ Некорректный email. Попробуйте еще раз:');
  }
});

// Обработка интересов
bot.action(/interest_(.+)/, async (ctx) => {
  const interest = ctx.match[1];
  
  if (interest === 'done' || interest === 'skip') {
    await ctx.answerCbQuery();
    
    // Подготавливаем данные лида для сохранения в БД
    const leadData = {
      telegram_id: ctx.from.id,
      username: ctx.from.username,
      first_name: ctx.from.first_name,
      last_name: ctx.from.last_name,
      role: ctx.session.onboarding.role,
      email: ctx.session.onboarding.email,
      interests: ctx.session.onboarding.interests || [],
      source: 'telegram_bot'
    };
    
    try {
      // СОХРАНЯЕМ В БД (постоянное хранилище)
      await saveLead(leadData);
      console.log(`✅ Лид сохранен в БД: ${leadData.first_name} (${leadData.email})`);
      
      // Отмечаем в session как завершенный (для текущей сессии)
      ctx.session.onboardingCompleted = true;
      
      // Уведомление админу
      console.log(`🆕 Новый лид! ${leadData.first_name} ${leadData.last_name || ''} (@${leadData.username || 'нет username'})`);
      console.log(`   Роль: ${leadData.role}, Email: ${leadData.email}`);
      console.log(`   Интересы: ${leadData.interests.length > 0 ? leadData.interests.join(', ') : 'не указаны'}`);
      
    } catch (error) {
      console.error('❌ Ошибка при сохранении лида в БД:', error);
      // Продолжаем даже если БД недоступна
      ctx.session.onboardingCompleted = true;
    }
    
    await ctx.editMessageText(
      '🎉 <b>Отлично! Регистрация завершена.</b>\n\n' +
      '<b>📧 Мы отправим вам:</b>\n' +
      '✅ Презентацию платформы\n' +
      '✅ Калькулятор ROI для вашей компании\n\n' +
      '<b>🚀 Следующие шаги:</b>',
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📱 Посмотреть демо', 'show_demo')],
          [Markup.button.callback('🤖 Попробовать ИИ-советника', 'try_ai')],
          [Markup.button.callback('📊 Получить презентацию', 'get_presentation')],
          [Markup.button.callback('📞 Записаться на демо', 'schedule_demo')],
          [Markup.button.url('🌐 Открыть сайт', 'https://yoddle.ru')]
        ])
      }
    );
    
    return;
  }
  
  const interestMap = {
    benefits: 'Корпоративные льготы',
    ai: 'ИИ-рекомендации',
    gamification: 'Геймификация',
    analytics: 'Аналитика и отчетность'
  };
  
  const interestName = interestMap[interest];
  
  // Инициализируем массив интересов если его нет
  if (!ctx.session.onboarding.interests) {
    ctx.session.onboarding.interests = [];
  }
  
  // Добавляем интерес если его еще нет
  if (!ctx.session.onboarding.interests.includes(interestName)) {
    ctx.session.onboarding.interests.push(interestName);
    await ctx.answerCbQuery(`✅ Добавлено: ${interestName}`);
  } else {
    await ctx.answerCbQuery('Уже добавлено');
  }
});

// Обработка кнопки "Посмотреть демо"
bot.action('show_demo', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    '📱 <b>Демо платформы Yoddle</b>\n\n' +
    'Выберите модуль, чтобы узнать больше:\n\n' +
    '💰 <b>Льготы</b> — каталог и управление корпоративными льготами\n' +
    '🤖 <b>ИИ-советник</b> — персональные рекомендации для сотрудников\n' +
    '🎮 <b>Геймификация</b> — мотивация через XP, ранги, достижения\n' +
    '📊 <b>Аналитика</b> — дашборд руководителя в реальном времени',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💰 Льготы', 'demo_benefits')],
        [Markup.button.callback('🤖 ИИ-советник', 'demo_ai')],
        [Markup.button.callback('🎮 Геймификация', 'demo_gamification')],
        [Markup.button.callback('📊 Аналитика', 'demo_analytics')],
        [Markup.button.callback('⬅️ Назад', 'demo_back')]
      ])
    }
  );
});

// Обработка модулей демо
bot.action('demo_benefits', async (ctx) => {
  await ctx.answerCbQuery();
  
  // Отправляем текст с описанием модуля
  await ctx.editMessageText(
    '💰 <b>Модуль: Корпоративные льготы</b>\n\n' +
    '<b>Проблема:</b>\n' +
    'Сотрудники не знают о льготах или не используют их (активация 20-30%).\n\n' +
    '<b>Решение Yoddle:</b>\n' +
    '• 🎁 Каталог с 100+ партнерами (фитнес, wellness, образование)\n' +
    '• 🤖 ИИ подбирает персональные предложения\n' +
    '• 🔔 Автоматические напоминания и уведомления\n' +
    '• 🎮 Геймификация активации льгот',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🤖 ИИ-советник', 'demo_ai')],
        [Markup.button.callback('🎮 Геймификация', 'demo_gamification')],
        [Markup.button.callback('⬅️ Назад к модулям', 'demo_back_menu')]
      ])
    }
  );
  
  // Отправляем скриншот демо (если файл существует)
  await sendDemoScreenshot(ctx, 'benefits');
});

bot.action('demo_ai', async (ctx) => {
  await ctx.answerCbQuery();
  
  // Отправляем текст с описанием модуля
  await ctx.editMessageText(
    '🤖 <b>Модуль: ИИ-советник</b>\n\n' +
    '<b>Проблема:</b>\n' +
    'Сотрудники выгорают, HR не успевает всех поддержать индивидуально.\n\n' +
    '<b>Решение Yoddle:</b>\n' +
    '• 🎭 Отслеживание настроения и самочувствия\n' +
    '• 💡 Персональные рекомендации от ИИ\n' +
    '• 🆘 Раннее выявление рисков выгорания\n' +
    '• 📊 Предиктивная аналитика удержания\n\n' +
    '<b>💬 Хотите попробовать ИИ-советника прямо сейчас?</b>',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🤖 Попробовать ИИ сейчас', 'try_ai')],
        [Markup.button.callback('🎮 Геймификация', 'demo_gamification')],
        [Markup.button.callback('⬅️ Назад к модулям', 'demo_back_menu')]
      ])
    }
  );
  
  // Отправляем скриншот демо (если файл существует)
  await sendDemoScreenshot(ctx, 'ai');
});

bot.action('demo_gamification', async (ctx) => {
  await ctx.answerCbQuery();
  
  // Отправляем текст с описанием модуля
  await ctx.editMessageText(
    '🎮 <b>Модуль: Геймификация</b>\n\n' +
    '<b>Проблема:</b>\n' +
    'Низкая вовлеченность, сотрудники не участвуют в корпоративных активностях.\n\n' +
    '<b>Решение Yoddle:</b>\n' +
    '• ⭐ XP за активность и использование льгот\n' +
    '• 🏆 Ранги и уровни с уникальными названиями\n' +
    '• 🎖️ Достижения (badges) за активность\n' +
    '• 📊 Лидерборды команд и компаний',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📊 Аналитика', 'demo_analytics')],
        [Markup.button.callback('💰 Льготы', 'demo_benefits')],
        [Markup.button.callback('⬅️ Назад к модулям', 'demo_back_menu')]
      ])
    }
  );
  
  // Отправляем скриншот демо (если файл существует)
  await sendDemoScreenshot(ctx, 'gamification');
});

bot.action('demo_analytics', async (ctx) => {
  await ctx.answerCbQuery();
  
  // Отправляем текст с описанием модуля
  await ctx.editMessageText(
    '📊 <b>Модуль: Аналитика для руководства</b>\n\n' +
    '<b>Проблема:</b>\n' +
    'HR не может доказать ROI льгот, руководство не видит ценности.\n\n' +
    '<b>Решение Yoddle:</b>\n' +
    '• 📈 Дашборд в реальном времени\n' +
    '• 💰 ROI каждой льготы и активности\n' +
    '• 📉 Тренды вовлеченности и рисков\n' +
    '• 📊 Готовые отчеты для C-Level',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📞 Записаться на демо', 'schedule_demo')],
        [Markup.button.callback('📊 Получить презентацию', 'get_presentation')],
        [Markup.button.callback('⬅️ Назад к модулям', 'demo_back_menu')]
      ])
    }
  );
  
  // Отправляем скриншот демо (если файл существует)
  await sendDemoScreenshot(ctx, 'analytics');
});

bot.action('demo_back_menu', async (ctx) => {
  await ctx.answerCbQuery();
  // Возвращаемся к списку модулей демо
  await ctx.editMessageText(
    '📱 <b>Демо платформы Yoddle</b>\n\n' +
    'Выберите модуль, чтобы узнать больше:\n\n' +
    '💰 <b>Льготы</b> — каталог и управление корпоративными льготами\n' +
    '🤖 <b>ИИ-советник</b> — персональные рекомендации для сотрудников\n' +
    '🎮 <b>Геймификация</b> — мотивация через XP, ранги, достижения\n' +
    '📊 <b>Аналитика</b> — дашборд руководителя в реальном времени',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💰 Льготы', 'demo_benefits')],
        [Markup.button.callback('🤖 ИИ-советник', 'demo_ai')],
        [Markup.button.callback('🎮 Геймификация', 'demo_gamification')],
        [Markup.button.callback('📊 Аналитика', 'demo_analytics')],
        [Markup.button.callback('⬅️ Назад', 'demo_back')]
      ])
    }
  );
});

bot.action('demo_back', async (ctx) => {
  await ctx.answerCbQuery();
  const firstName = ctx.from.first_name || 'друг';
  
  // Проверяем БД или session
  try {
    const existingLead = await getLeadByTelegramId(ctx.from.id);
    if (existingLead && existingLead.email) {
      await showMainMenu(ctx, firstName, existingLead.role);
      return;
    }
  } catch (error) {
    // Если БД недоступна, проверяем session
  }
  
  if (ctx.session?.onboardingCompleted) {
    await showMainMenu(ctx, firstName);
  } else {
    await ctx.reply('👋 Возвращайтесь! Напишите /start чтобы начать.');
  }
});

// Функция для отправки скриншотов демо
async function sendDemoScreenshot(ctx, moduleName) {
  try {
    // Текстовые описания для каждого модуля
    const moduleDescriptions = {
      benefits: '🎁 Ниже показываем интерфейс умных рекомендаций льгот! ✨\n\n💡 ИИ анализирует ваши предпочтения и предлагает персональные льготы именно для вас! 🚀',
      ai: '🤖 Показываем ответы умного советчика в действии! 🌟\n\n💬 Вы также можете попробовать его прямо в телеграмм по кнопке выше! 👆\n\n✨ Получите персональные рекомендации прямо сейчас!',
      analytics: '📊 Предоставляем еженедельный отчет аналитики и не только! 📈\n\n💎 Смотрите ниже, как выглядит дашборд руководителя! 👇\n\n🎯 Вся важная информация в одном месте!',
      gamification: '🎮 Уровни, опыт, достижения! Все на нашей Платформе! 🏆\n\n⭐ Смотрите, как работает геймификация! 👇\n\n🚀 Мотивируйте сотрудников через игру! 💪'
    };
    
    const description = moduleDescriptions[moduleName] || '';
    
    // Возможные пути к скриншотам (локально и на сервере)
    // Учитываем разные варианты имен файлов
    const possiblePaths = [
      // Вариант 1: demo-screenshots/{moduleName}.png
      path.join(__dirname, '..', '..', 'demo-screenshots', `${moduleName}.png`),
      path.join(__dirname, '..', '..', 'demo-screenshots', `${moduleName}.jpg`),
      // Вариант 2: public/demo/{moduleName}.png
      path.join(__dirname, '..', '..', 'public', 'demo', `${moduleName}.png`),
      path.join(__dirname, '..', '..', 'public', 'demo', `${moduleName}.jpg`),
      // Вариант 3: public/demo_{moduleName}.jpg (текущее расположение файлов)
      path.join(__dirname, '..', '..', 'public', `demo_${moduleName}.png`),
      path.join(__dirname, '..', '..', 'public', `demo_${moduleName}.jpg`),
      // Для gamification также ищем demo_game.png
      ...(moduleName === 'gamification' ? [
        path.join(__dirname, '..', '..', 'demo-screenshots', 'demo_game.png'),
        path.join(__dirname, '..', '..', 'demo-screenshots', 'demo_game.jpg'),
        path.join(__dirname, '..', '..', 'public', 'demo', 'demo_game.png'),
        path.join(__dirname, '..', '..', 'public', 'demo', 'demo_game.jpg'),
        path.join(__dirname, '..', '..', 'public', 'demo_game.png'),
        path.join(__dirname, '..', '..', 'public', 'demo_game.jpg')
      ] : [])
    ];
    
    let screenshotPath = null;
    
    // Ищем локальный файл
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        screenshotPath = possiblePath;
        break;
      }
    }
    
    if (screenshotPath) {
      // Отправляем локальный файл с описанием
      await ctx.replyWithPhoto(
        { source: fs.createReadStream(screenshotPath) },
        { caption: description }
      );
    } else {
      // Пробуем использовать URL на сервере
      // Для gamification используем demo_game.png
      const fileName = moduleName === 'gamification' ? 'demo_game.png' : `${moduleName}.png`;
      const urlPath = `${config.webUrl}/demo/${fileName}`;
      try {
        await ctx.replyWithPhoto(
          { url: urlPath },
          { caption: description }
        );
      } catch (error) {
        // Если скриншот не найден, отправляем только текст описания
        if (description) {
          await ctx.reply(description);
        }
        console.log(`⚠️ Скриншот для модуля ${moduleName} не найден`);
      }
    }
  } catch (error) {
    // Если ошибка при отправке скриншота, отправляем только текст описания
    const moduleDescriptions = {
      benefits: '🎁 Ниже показываем интерфейс умных рекомендаций льгот! ✨\n\n💡 ИИ анализирует ваши предпочтения и предлагает персональные льготы именно для вас! 🚀',
      ai: '🤖 Показываем ответы умного советчика в действии! 🌟\n\n💬 Вы также можете попробовать его прямо в телеграмм по кнопке выше! 👆\n\n✨ Получите персональные рекомендации прямо сейчас!',
      analytics: '📊 Предоставляем еженедельный отчет аналитики и не только! 📈\n\n💎 Смотрите ниже, как выглядит дашборд руководителя! 👇\n\n🎯 Вся важная информация в одном месте!',
      gamification: '🎮 Уровни, опыт, достижения! Все на нашей Платформе! 🏆\n\n⭐ Смотрите, как работает геймификация! 👇\n\n🚀 Мотивируйте сотрудников через игру! 💪'
    };
    const description = moduleDescriptions[moduleName];
    if (description) {
      try {
        await ctx.reply(description);
      } catch (e) {
        // Игнорируем ошибку
      }
    }
    console.log(`⚠️ Ошибка при отправке скриншота для модуля ${moduleName}:`, error.message);
  }
}

// Функция для создания клавиатуры с числами от 1 до 10
function createNumberKeyboard(prefix, currentValue = null) {
  const buttons = [];
  for (let i = 1; i <= 10; i += 2) {
    const row = [];
    row.push(Markup.button.callback(
      currentValue === i ? `✓ ${i}` : `${i}`,
      `${prefix}_${i}`
    ));
    if (i + 1 <= 10) {
      row.push(Markup.button.callback(
        currentValue === (i + 1) ? `✓ ${i + 1}` : `${i + 1}`,
        `${prefix}_${i + 1}`
      ));
    }
    buttons.push(row);
  }
  return Markup.inlineKeyboard(buttons);
}

// Функция проверки, является ли пользователь админом
function isAdmin(userId) {
  const adminChatId = config.adminChatId;
  if (!adminChatId) {
    return false;
  }
  // Проверяем, совпадает ли ID пользователя с админским ID
  return String(userId) === String(adminChatId);
}

// Обработка кнопки "Попробовать ИИ-советника"
bot.action('try_ai', async (ctx) => {
  await ctx.answerCbQuery();
  
  const userId = ctx.from.id;
  const userIsAdmin = isAdmin(userId);
  
  // НЕ проверяем лимит ДО обращения к API - пусть API сам это делает
  // API сервер сохраняет данные в БД и может проверить лимит там
  // Это избегает проблем с подключением к БД в боте
  
  // Инициализируем session для ИИ-советника
  if (!ctx.session) {
    ctx.session = {};
  }
  ctx.session.aiAdvisor = {
    step: 'mood',
    mood: null,
    energy: null,
    stress: null,
    notes: null,
    isAdmin: userIsAdmin
  };
  
  await ctx.reply(
    '🤖 <b>ИИ-советник Yoddle</b>\n\n' +
    'Привет! Давайте оценим ваше состояние.\n\n' +
    '🎭 <b>Настроение:</b> Оцените ваше настроение от 1 до 10\n' +
    '(1 - очень плохо, 10 - отлично)',
    {
      parse_mode: 'HTML',
      ...createNumberKeyboard('mood')
    }
  );
});

// Обработка выбора настроения (1-10)
bot.action(/mood_(\d+)/, async (ctx) => {
  const moodValue = parseInt(ctx.match[1]);
  
  if (!ctx.session) {
    ctx.session = {};
  }
  if (!ctx.session.aiAdvisor) {
    ctx.session.aiAdvisor = {};
  }
  
  ctx.session.aiAdvisor.mood = moodValue;
  ctx.session.aiAdvisor.step = 'energy';
  
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `✅ Настроение: <b>${moodValue}/10</b>\n\n` +
    '⚡ <b>Энергия:</b> Оцените ваш уровень энергии от 1 до 10\n' +
    '(1 - совсем нет сил, 10 - полон энергии)',
    {
      parse_mode: 'HTML',
      ...createNumberKeyboard('energy')
    }
  );
});

// Обработка выбора энергии (1-10)
bot.action(/energy_(\d+)/, async (ctx) => {
  const energyValue = parseInt(ctx.match[1]);
  
  if (!ctx.session) {
    ctx.session = {};
  }
  if (!ctx.session.aiAdvisor) {
    ctx.session.aiAdvisor = {};
  }
  
  ctx.session.aiAdvisor.energy = energyValue;
  ctx.session.aiAdvisor.step = 'stress';
  
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `✅ Настроение: <b>${ctx.session.aiAdvisor.mood}/10</b>\n` +
    `✅ Энергия: <b>${energyValue}/10</b>\n\n` +
    '😰 <b>Стресс:</b> Оцените уровень стресса от 1 до 10\n' +
    '(1 - нет стресса, 10 - очень высокий стресс)',
    {
      parse_mode: 'HTML',
      ...createNumberKeyboard('stress')
    }
  );
});

// Обработка выбора стресса (1-10)
bot.action(/stress_(\d+)/, async (ctx) => {
  const stressValue = parseInt(ctx.match[1]);
  
  if (!ctx.session) {
    ctx.session = {};
  }
  if (!ctx.session.aiAdvisor) {
    ctx.session.aiAdvisor = {};
  }
  
  ctx.session.aiAdvisor.stress = stressValue;
  ctx.session.aiAdvisor.step = 'notes';
  
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `✅ Настроение: <b>${ctx.session.aiAdvisor.mood}/10</b>\n` +
    `✅ Энергия: <b>${ctx.session.aiAdvisor.energy}/10</b>\n` +
    `✅ Стресс: <b>${stressValue}/10</b>\n\n` +
    '📝 <b>Дополнительные заметки:</b>\n\n' +
    'Опишите ваши достижения или провалы за день.\n' +
    'Например: "Сегодня успешно провел презентацию" или "Не удалось завершить проект в срок"\n\n' +
    'Напишите ваше сообщение:',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⏭️ Пропустить', 'skip_notes')]
      ])
    }
  );
});

// Обработка пропуска заметок
bot.action('skip_notes', async (ctx) => {
  if (!ctx.session) {
    ctx.session = {};
  }
  if (!ctx.session.aiAdvisor) {
    ctx.session.aiAdvisor = {};
  }
  
  ctx.session.aiAdvisor.notes = '';
  ctx.session.aiAdvisor.step = 'processing';
  
  await ctx.answerCbQuery();
  await processAIAdvisor(ctx);
});

// Обработка email (только если мы в процессе онбординга на этапе email)
// Обработка текстовых сообщений (email для онбординга или заметки для ИИ-советника)
bot.on('text', async (ctx) => {
  // Приоритет 1: Проверяем, что мы в процессе ИИ-советника и ожидаем заметки
  if (ctx.session?.aiAdvisor?.step === 'notes') {
    ctx.session.aiAdvisor.notes = ctx.message.text;
    ctx.session.aiAdvisor.step = 'processing';
    
    await processAIAdvisor(ctx);
    return;
  }
  
  // Приоритет 2: Проверяем, что мы в процессе онбординга и ожидаем email
  if (ctx.session?.onboarding?.step === 'email') {
    const text = ctx.message.text.trim();
    
    // Простая проверка email
    if (text.includes('@') && text.includes('.')) {
      ctx.session.onboarding.email = text;
      ctx.session.onboarding.step = 'interests';
      ctx.session.onboarding.interests = [];
      
      await ctx.replyWithHTML(
        '✅ Email сохранен!\n\n' +
        '<b>Что вас интересует в Yoddle?</b>\n' +
        'Выберите один или несколько пунктов:',
        Markup.inlineKeyboard([
          [Markup.button.callback('💰 Корпоративные льготы', 'interest_benefits')],
          [Markup.button.callback('🤖 ИИ-рекомендации', 'interest_ai')],
          [Markup.button.callback('🎮 Геймификация', 'interest_gamification')],
          [Markup.button.callback('📊 Аналитика и отчетность', 'interest_analytics')],
          [Markup.button.callback('✅ Завершить', 'interest_done')],
          [Markup.button.callback('⏭️ Пропустить', 'interest_skip')]
        ])
      );
    } else {
      await ctx.reply('❌ Некорректный email. Попробуйте еще раз:');
    }
    return;
  }
  
  // Если не в процессе онбординга или ИИ-советника, игнорируем сообщение
});

// Функция обработки ИИ-советника и отправки на API
async function processAIAdvisor(ctx) {
  try {
    const { mood, energy, stress, notes, isAdmin } = ctx.session.aiAdvisor || {};
    
    // Проверяем, что все необходимые данные есть
    if (!mood || !energy || stress === undefined) {
      throw new Error('Не все данные заполнены');
    }
    
    // Отправляем сообщение о обработке
    await ctx.editMessageText(
      `✅ Настроение: <b>${mood}/10</b>\n` +
      `✅ Энергия: <b>${energy}/10</b>\n` +
      `✅ Стресс: <b>${stress}/10</b>\n` +
      `${notes ? `✅ Заметки: ${notes.substring(0, 50)}${notes.length > 50 ? '...' : ''}\n\n` : ''}` +
      '⏳ Анализирую ваши данные и генерирую персональные рекомендации...',
      { parse_mode: 'HTML' }
    );
    
    try {
      // Отправляем запрос на API для анализа
      const apiUrl = `${config.apiBaseUrl}/api/ai/analyze-mood`;
      console.log(`🌐 Отправка запроса к ИИ API: ${apiUrl}`);
      console.log(`📦 Данные запроса:`, {
        mood,
        energy,
        stressLevel: stress,
        notes: notes ? notes.substring(0, 50) + '...' : '(пусто)',
        userId: ctx.from.id
      });
      
      const response = await axios.post(apiUrl, {
        mood: mood,
        energy: energy, // Преобразуем в activities для совместимости с API
        stressLevel: stress,
        notes: notes || '',
        activities: [], // Пустой массив, так как мы не собираем активности
        userId: ctx.from.id // Используем telegram ID как userId
      }, {
        timeout: 30000, // Таймаут 30 секунд
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Ответ от ИИ API получен:`, {
        success: response.data?.success,
        hasAnalysis: !!response.data?.analysis,
        status: response.status
      });
      
      if (response.data && response.data.success && response.data.analysis) {
        // API сам проверил лимит и сохранил данные в БД
        // Проверяем лимит ПОСЛЕ ответа только для информационного сообщения
        // (не критично, если БД недоступна)
        let usageInfo = '';
        if (!isAdmin) {
          try {
            const usageCheck = await checkAIUsageLimit(ctx.from.id, false);
            if (usageCheck && usageCheck.limit && usageCheck.count !== undefined) {
              const remaining = usageCheck.limit - usageCheck.count;
              if (remaining > 0) {
                usageInfo = `\n\n📊 Осталось использований сегодня: <b>${remaining}/${usageCheck.limit}</b>`;
              } else {
                usageInfo = `\n\n⛔ Лимит использований на сегодня исчерпан. Лимит обновится завтра.`;
              }
            }
          } catch (error) {
            // Игнорируем ошибку проверки лимита - не критично
            // API уже обработал запрос и сохранил данные в БД
            console.error('⚠️ Ошибка при проверке лимита (не критично):', error?.message || String(error).substring(0, 100));
          }
        }
        
        // Показываем результат от AI
        await ctx.editMessageText(
          `🤖 <b>Персональные рекомендации для вас:</b>\n\n` +
          `${response.data.analysis}${usageInfo}\n\n` +
          `💡 <b>Что дальше?</b>`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('🔄 Оценить еще раз', 'try_ai')],
              [Markup.button.callback('📞 Записаться на демо', 'schedule_demo')],
              [Markup.button.callback('⬅️ Главное меню', 'menu_main')]
            ])
          }
        );
      } else if (response.data && response.data.success === false && response.data.error === 'Достигнут лимит использования ИИ-советника') {
        // API вернул ошибку лимита
        await ctx.editMessageText(
          `⛔ <b>Достигнут лимит использования ИИ-советника</b>\n\n` +
          `${response.data.message || 'Вы использовали ИИ-советника максимальное количество раз сегодня.'}\n\n` +
          `Лимит обновится завтра. Спасибо за использование Yoddle! 💙`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('📞 Записаться на демо', 'schedule_demo')],
              [Markup.button.callback('⬅️ Главное меню', 'menu_main')]
            ])
          }
        );
      } else {
        throw new Error('API вернул неверный формат данных');
      }
    } catch (apiError) {
      // Обработка ошибки 429 (Too Many Requests) от API
      if (apiError.response && apiError.response.status === 429) {
        const errorData = apiError.response.data || {};
        await ctx.editMessageText(
          `⛔ <b>Достигнут лимит использования ИИ-советника</b>\n\n` +
          `${errorData.message || 'Вы использовали ИИ-советника максимальное количество раз сегодня.'}\n\n` +
          `Лимит обновится завтра. Спасибо за использование Yoddle! 💙`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('📞 Записаться на демо', 'schedule_demo')],
              [Markup.button.callback('⬅️ Главное меню', 'menu_main')]
            ])
          }
        );
        return;
      }
      
      // Детальное логирование ошибки API
      const errorDetails = {
        message: apiError?.message || 'Неизвестная ошибка',
        code: apiError?.code,
        response: apiError?.response ? {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: apiError.response.data
        } : null,
        apiUrl: `${config.apiBaseUrl}/api/ai/analyze-mood`
      };
      
      console.error('❌ Ошибка при обращении к ИИ API:', JSON.stringify(errorDetails, null, 2));
      
      // Определяем тип ошибки
      let errorMessage = 'Ошибка подключения к серверу';
      if (apiError.code === 'ECONNREFUSED') {
        errorMessage = 'Сервер ИИ недоступен. Проверьте, запущен ли API сервер.';
      } else if (apiError.code === 'ETIMEDOUT') {
        errorMessage = 'Превышено время ожидания ответа от сервера ИИ.';
      } else if (apiError.response) {
        errorMessage = `Ошибка сервера ИИ: ${apiError.response.status} ${apiError.response.statusText}`;
      }
      
      console.error(`💡 Детали ошибки: ${errorMessage}`);
      
      // Fallback ответ, если API недоступен
      const fallbackAdvice = `💡 <b>Рекомендации на основе ваших данных:</b>\n\n`;
      
      let advice = '';
      if (mood >= 7 && energy >= 7 && stress <= 3) {
        advice = 'Отлично! Вы в хорошем состоянии. Продолжайте поддерживать баланс между работой и отдыхом.\n\n';
      } else if (mood <= 4 || energy <= 4 || stress >= 7) {
        advice = 'Похоже, вам нужна поддержка. Рекомендую сделать перерыв, заняться чем-то приятным и не перегружать себя.\n\n';
      } else {
        advice = 'Ваше состояние требует внимания. Постарайтесь найти баланс и заботьтесь о себе.\n\n';
      }
      
      advice += '💡 Хотите узнать больше о том, как Yoddle может помочь?';
      
      await ctx.editMessageText(
        fallbackAdvice + advice,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать еще раз', 'try_ai')],
            [Markup.button.callback('📞 Записаться на демо', 'schedule_demo')],
            [Markup.button.callback('⬅️ Главное меню', 'menu_main')]
          ])
        }
      );
    }
  } catch (error) {
    console.error('❌ Критическая ошибка в processAIAdvisor:', error);
    
    // Показываем сообщение об ошибке пользователю
    try {
      await ctx.reply(
        '❌ Произошла ошибка при обработке вашего запроса.\n\n' +
        'Попробуйте еще раз или вернитесь в главное меню.',
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Попробовать еще раз', 'try_ai')],
          [Markup.button.callback('⬅️ Главное меню', 'menu_main')]
        ])
      );
    } catch (replyError) {
      console.error('❌ Не удалось отправить сообщение об ошибке:', replyError);
    }
  } finally {
    // Очищаем session после обработки
    if (ctx.session && ctx.session.aiAdvisor) {
      ctx.session.aiAdvisor.step = 'completed';
    }
  }
}

// Обработка кнопки "Получить презентацию"
bot.action('get_presentation', async (ctx) => {
  await ctx.answerCbQuery();
  
  try {
    // Вариант 1: Пытаемся использовать локальный файл (для разработки)
    let useLocalFile = false;
    let pdfPath = null;
    
    // Если указан путь к локальному файлу в конфиге или переменной окружения
    if (config.presentationLocalPath && fs.existsSync(config.presentationLocalPath)) {
      pdfPath = config.presentationLocalPath;
      useLocalFile = true;
    } else {
      // Пробуем найти файл в стандартных местах (для локальной разработки)
      const possiblePaths = [
        path.join(__dirname, '..', '..', 'public', 'yoddle.pdf'), // Основной файл
        path.join(__dirname, '..', '..', 'public', 'Yoddle.pdf'), // С заглавной буквы
        path.join(__dirname, '..', '..', 'public', 'Yoddle.pdf.pdf'),
        path.join(__dirname, '..', '..', 'public', 'presentation.pdf'),
        path.join(__dirname, '..', '..', '01.07_Yoddle.pdf'),
        path.join(__dirname, '..', '..', 'presentation.pdf')
      ];
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          pdfPath = possiblePath;
          useLocalFile = true;
          break;
        }
      }
    }
    
    if (useLocalFile && pdfPath) {
      // Отправляем локальный PDF файл (для локальной разработки)
      console.log(`📄 Отправка локального файла: ${pdfPath}`);
      await ctx.replyWithDocument(
        { source: fs.createReadStream(pdfPath), filename: 'Yoddle_Presentation.pdf' },
        {
          caption: '📊 Презентация Yoddle\n\nПрезентация платформы Yoddle для вашей компании.',
          parse_mode: 'HTML'
        }
      );
    } else {
      // Вариант 2: Используем URL (для продакшена на сервере)
      // Telegram Bot API может скачать файл по публичному URL и отправить его
      console.log(`📄 Отправка файла по URL: ${config.presentationUrl}`);
      await ctx.replyWithDocument(
        { url: config.presentationUrl },
        {
          caption: '📊 Презентация Yoddle\n\nПрезентация платформы Yoddle для вашей компании.',
          parse_mode: 'HTML'
        }
      );
    }
  } catch (error) {
    console.error('❌ Ошибка при отправке презентации:', error);
    // Если не удалось отправить файл, отправляем текстовое сообщение со ссылкой
    await ctx.reply(
      '📊 Отлично! Отправляю вам презентацию Yoddle.\n\n' +
      `👉 Презентация: [Скачать PDF](${config.presentationUrl})\n` +
      `🌐 Сайт: ${config.webUrl}`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Обработка кнопки "Записаться на демо"
bot.action('schedule_demo', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    '📞 Отлично! Давайте запланируем демо.\n\n' +
    '👉 Выберите удобное время: [Календарь](https://calendar.app.google/Aq2MweD78sfW5yof8)\n\n' +
    'Или напишите ваш email, и мы свяжемся с вами:',
    { parse_mode: 'Markdown' }
  );
});

// Команда /help
bot.command('help', (ctx) => {
  ctx.reply(
    '🤖 Команды бота:\n\n' +
    '/start - Начать знакомство с Yoddle\n' +
    '/demo - Посмотреть демо платформы\n' +
    '/help - Список команд'
  );
});

// Обработка кнопки "Главное меню"
bot.action('menu_main', async (ctx) => {
  await ctx.answerCbQuery();
  const firstName = ctx.from.first_name || 'друг';
  
  // Получаем данные из БД для персонализированного приветствия
  try {
    const existingLead = await getLeadByTelegramId(ctx.from.id);
    await showMainMenu(ctx, firstName, existingLead?.role || null);
  } catch (error) {
    await showMainMenu(ctx, firstName);
  }
});

// Команда /demo
bot.command('demo', async (ctx) => {
  // Проверяем завершенность онбординга в БД или session
  try {
    const existingLead = await getLeadByTelegramId(ctx.from.id);
    if (!existingLead || !existingLead.email) {
      await ctx.reply('👋 Сначала пройдите онбординг, нажав /start');
      return;
    }
  } catch (error) {
    // Если БД недоступна, проверяем session
    if (!ctx.session?.onboardingCompleted) {
      await ctx.reply('👋 Сначала пройдите онбординг, нажав /start');
      return;
    }
  }
  // Вызываем обработчик демо
  await ctx.replyWithHTML(
    '📱 <b>Демо платформы Yoddle</b>\n\n' +
    'Выберите модуль, чтобы узнать больше:\n\n' +
    '💰 <b>Льготы</b> — каталог и управление корпоративными льготами\n' +
    '🤖 <b>ИИ-советник</b> — персональные рекомендации для сотрудников\n' +
    '🎮 <b>Геймификация</b> — мотивация через XP, ранги, достижения\n' +
    '📊 <b>Аналитика</b> — дашборд руководителя в реальном времени',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💰 Льготы', 'demo_benefits')],
        [Markup.button.callback('🤖 ИИ-советник', 'demo_ai')],
        [Markup.button.callback('🎮 Геймификация', 'demo_gamification')],
        [Markup.button.callback('📊 Аналитика', 'demo_analytics')],
        [Markup.button.callback('⬅️ Назад', 'demo_back')]
      ])
    }
  );
});

// Запуск бота
(async () => {
  try {
    console.log('🚀 Запуск Yoddle Telegram Bot...');
    
    // Выводим конфигурацию подключения
    console.log('📋 Конфигурация:');
    console.log(`   • API Base URL: ${config.apiBaseUrl || 'НЕ НАСТРОЕН'}`);
    console.log(`   • Web URL: ${config.webUrl || 'НЕ НАСТРОЕН'}`);
    console.log(`   • Bot Token: ${config.botToken ? '✓ Установлен' : '✗ НЕ НАСТРОЕН'}`);
    console.log(`   • Admin Chat ID: ${config.adminChatId || 'НЕ НАСТРОЕН'}`);
    
    // КРИТИЧЕСКАЯ ПРОВЕРКА: BOT_TOKEN обязателен
    if (!config.botToken || !process.env.BOT_TOKEN) {
      console.error('❌ ОШИБКА: BOT_TOKEN не найден!');
      console.error('💡 Инструкция по исправлению:');
      console.error('   1. Убедитесь, что файл .env существует в корне проекта');
      console.error(`   2. Путь к .env должен быть: ${rootEnvPath}`);
      console.error('   3. Добавьте в .env строку: BOT_TOKEN=ваш_токен_от_botfather');
      console.error('   4. Перезапустите бота: pm2 restart yoddle-tg');
      console.error('');
      console.error('⚠️  Бот остановлен. Исправьте конфигурацию и перезапустите.');
      // Останавливаем процесс, чтобы PM2 не перезапускал его бесконечно
      process.exit(1);
    }
    
    if (!config.apiBaseUrl || config.apiBaseUrl === 'http://localhost:3000') {
      console.log('⚠️  ВНИМАНИЕ: API_BASE_URL не настроен или использует localhost');
      console.log('   Убедитесь, что API сервер запущен на указанном адресе');
    }
    
    // Пытаемся инициализировать БД (но не падаем, если она недоступна)
    await initDatabase();
    
    await bot.launch();
    console.log('✅ Бот запущен и готов к работе!');
    console.log('📱 Найдите вашего бота в Telegram и отправьте /start');
  } catch (error) {
    console.error('❌ Ошибка запуска бота:', error);
    
    // Если ошибка связана с токеном
    if (error.response && error.response.error_code === 401) {
      console.error('');
      console.error('💡 Проблема: Неверный или отсутствующий BOT_TOKEN');
      console.error('   Инструкция:');
      console.error('   1. Проверьте файл .env в корне проекта');
      console.error(`   2. Путь: ${rootEnvPath}`);
      console.error('   3. Убедитесь, что BOT_TOKEN указан правильно');
      console.error('   4. Перезапустите бота: pm2 restart yoddle-tg');
    } else {
      console.log('💡 Проверьте BOT_TOKEN в файле .env');
      console.log(`   Путь к .env: ${rootEnvPath}`);
    }
    
    process.exit(1);
  }
})();

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));




