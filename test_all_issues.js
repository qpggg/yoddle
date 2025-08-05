import fetch from 'node-fetch';

async function testAllIssues() {
  console.log('🔍 ТЕСТ ВСЕХ ПРОБЛЕМ');
  console.log('====================');
  
  const testUser = {
    login: 'andrei@gmail.com',
    password: 'andrei'
  };
  
  try {
    // Тест 1: Вход Андрея
    console.log('\n📝 Тест 1: Вход Андрея...');
    const loginResponse = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log(`❌ Ошибка входа: ${loginResponse.status} - ${errorText}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log(`✅ Вход успешен! ID: ${loginData.user.id}`);
    
    const userId = loginData.user.id;
    
    // Тест 2: Геймификация входа
    console.log('\n🎮 Тест 2: Геймификация входа...');
    const gamificationResponse = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        gamification: true
      })
    });
    
    if (gamificationResponse.ok) {
      const gamificationData = await gamificationResponse.json();
      console.log(`✅ Геймификация: ${gamificationData.totalXP} XP`);
      console.log(`📊 Действий: ${gamificationData.actions}, Бонусов: ${gamificationData.bonuses}`);
    } else {
      console.log('❌ Ошибка геймификации');
    }
    
    // Тест 3: Добавление льготы
    console.log('\n🎁 Тест 3: Добавление льготы...');
    const benefitResponse = await fetch('http://localhost:3000/api/user-benefits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        benefit_id: 1
      })
    });
    
    if (benefitResponse.ok) {
      const benefitData = await benefitResponse.json();
      console.log(`✅ Льгота добавлена! XP: ${benefitData.xpEarned || 'не указано'}`);
    } else {
      const errorText = await benefitResponse.text();
      console.log(`❌ Ошибка добавления льготы: ${benefitResponse.status} - ${errorText}`);
    }
    
    // Тест 4: Прохождение теста
    console.log('\n📋 Тест 4: Прохождение теста...');
    const testResponse = await fetch('http://localhost:3000/api/user-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        benefit_ids: [1, 2, 3],
        answers: { q1: 'yes', q2: 'no' }
      })
    });
    
    if (testResponse.ok) {
      console.log(`✅ Тест пройден!`);
    } else {
      const errorText = await testResponse.text();
      console.log(`❌ Ошибка теста: ${testResponse.status} - ${errorText}`);
    }
    
    // Тест 5: Проверка активности
    console.log('\n📊 Тест 5: Проверка активности...');
    const activityResponse = await fetch(`http://localhost:3000/api/activity?user_id=${userId}`);
    
    if (activityResponse.ok) {
      const activityData = await activityResponse.json();
      console.log(`✅ Активность получена: ${activityData.totalActions} действий`);
    } else {
      console.log('❌ Ошибка получения активности');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testAllIssues(); 