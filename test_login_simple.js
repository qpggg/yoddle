import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testSimpleLogin() {
  console.log('🚀 ТЕСТ ПРОСТОГО ВХОДА (с проверкой хеширования)');
  console.log('================================================\n');
  
  const startTime = Date.now();
  
  try {
    // Тестируем с простым паролем (не хешированным)
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: 'test@gmail.com',
        password: 'test'
      })
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Простой вход: ${duration}ms`);
      console.log(`👤 Пользователь: ${data.user.name}`);
      
      // Проверяем хеширование в БД
      const dbResponse = await fetch(`${BASE_URL}/api/check-password-hash?login=test@gmail.com`);
      if (dbResponse.ok) {
        const hashData = await dbResponse.json();
        console.log(`🔑 Пароль в БД: ${hashData.isHashed ? 'Хеширован ✅' : 'Не хеширован ❌'}`);
      }
    } else {
      console.log(`❌ Ошибка входа: ${duration}ms`);
      const errorData = await response.json();
      console.log(`📝 Ошибка: ${errorData.error}`);
    }
    
    return { success: response.ok, duration };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`❌ Ошибка сети: ${duration}ms - ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

async function testDatabaseConnection() {
  console.log('\n🔍 ТЕСТ ПОДКЛЮЧЕНИЯ К БД');
  console.log('==========================\n');
  
  const startTime = Date.now();
  
  try {
    // Простой запрос к БД
    const response = await fetch(`${BASE_URL}/api/benefits`);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.ok) {
      console.log(`✅ Запрос к БД: ${duration}ms`);
    } else {
      console.log(`❌ Ошибка БД: ${duration}ms`);
    }
    
    return { success: response.ok, duration };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`❌ Ошибка сети: ${duration}ms - ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

async function runDiagnostics() {
  const loginResult = await testSimpleLogin();
  await new Promise(resolve => setTimeout(resolve, 1000));
  const dbResult = await testDatabaseConnection();
  
  console.log('\n📊 ДИАГНОСТИКА:');
  console.log('================');
  
  if (loginResult.duration > 1000) {
    console.log('🚨 ПРОБЛЕМА: Вход слишком медленный');
    console.log('   Возможные причины:');
    console.log('   - bcrypt.compare медленный');
    console.log('   - Сетевая задержка Supabase');
    console.log('   - Медленные запросы к БД');
  } else {
    console.log('✅ Вход работает нормально');
  }
  
  if (dbResult.duration > 500) {
    console.log('🚨 ПРОБЛЕМА: БД медленная');
    console.log('   Возможные причины:');
    console.log('   - Сетевая задержка Supabase');
    console.log('   - Медленные запросы');
  } else {
    console.log('✅ БД работает нормально');
  }
  
  console.log('\n🎯 РЕКОМЕНДАЦИИ:');
  if (loginResult.duration > 1000 && dbResult.duration < 500) {
    console.log('- Проблема в bcrypt.compare');
    console.log('- Нужно оптимизировать проверку паролей');
  } else if (loginResult.duration > 1000 && dbResult.duration > 500) {
    console.log('- Проблема в сетевой задержке Supabase');
    console.log('- Нужно рассмотреть локальную БД или кэширование');
  }
}

runDiagnostics().catch(console.error); 