import fetch from 'node-fetch';

// 🔧 НАСТРОЙКИ ДЛЯ VERCEL PREVIEW
const VERCEL_URL = 'https://yoddle-is9s9hl0a-mikhails-projects-da517846.vercel.app';
const TEST_USER = {
  login: 'admin@gmail.com', // замените на правильный логин
  password: 'admin' // замените на правильный пароль
};

async function testVercelGamification() {
  console.log('🚀 ТЕСТ ГЕЙМИФИКАЦИИ НА VERCEL');
  console.log('================================');
  console.log(`📡 URL: ${VERCEL_URL}`);
  
  try {
    // 1. Проверяем доступность сайта
    console.log('\n📡 Проверяем доступность сайта...');
    const siteResponse = await fetch(VERCEL_URL);
    
    if (!siteResponse.ok) {
      console.log(`❌ Сайт недоступен: ${siteResponse.status}`);
      return;
    }
    
    console.log('✅ Сайт доступен!');
    
    // 2. Тестируем API логина
    console.log('\n🔐 Тестируем API логина...');
    const loginResponse = await fetch(`${VERCEL_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log(`❌ Ошибка входа: ${loginResponse.status} - ${errorText}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log(`✅ Вход выполнен: ${loginData.user.name} (ID: ${loginData.user.id})`);
    
    // 3. Тестируем геймификацию
    console.log('\n🎮 Тестируем геймификацию...');
    const gamificationResponse = await fetch(`${VERCEL_URL}/api/gamification/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: loginData.user.id })
    });
    
    if (!gamificationResponse.ok) {
      const errorText = await gamificationResponse.text();
      console.log(`❌ Ошибка геймификации: ${gamificationResponse.status} - ${errorText}`);
      return;
    }
    
    const gamificationData = await gamificationResponse.json();
    console.log(`✅ Геймификация: ${gamificationData.totalXP} XP`);
    console.log(`📊 Действий: ${gamificationData.actions}, Бонусов: ${gamificationData.bonuses}`);
    console.log(`🔥 Streak: ${gamificationData.newStreak}`);
    console.log(`🏆 Достижения: ${gamificationData.achievements.join(', ')}`);
    
    // 4. Проверяем активность
    console.log('\n📊 Проверяем активность...');
    const activityResponse = await fetch(`${VERCEL_URL}/api/activity?user_id=${loginData.user.id}`);
    
    if (activityResponse.ok) {
      const activityData = await activityResponse.json();
      console.log(`✅ Активность получена: ${activityData.dailyActivity.length} дней`);
    } else {
      console.log('❌ Ошибка получения активности');
    }
    
    console.log('\n🎯 РЕЗУЛЬТАТ: Геймификация на Vercel работает!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testVercelGamification(); 