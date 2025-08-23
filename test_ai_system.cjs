// Тестирование AI системы Yoddle
// Запуск: node test_ai_system.js

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001'; // Измените на ваш порт
const TEST_USER_ID = 1; // Пользователь с ID 1

// Тестовые данные для API
const testMoodData = {
    mood: 8,
    activities: ["работа", "спорт"],
    notes: "Отличный день! Завершил проект",
    stressLevel: 2
};

const testActivityData = {
    activity: "Тестирование AI системы",
    category: "разработка",
    duration: 120,
    success: true,
    notes: "AI API работает отлично!"
};

// Получение JWT токена (заглушка - замените на реальную аутентификацию)
async function getAuthToken() {
    // TODO: Реализуйте получение JWT токена через login API
    // Пока возвращаем заглушку
    return 'your_jwt_token_here';
}

// Проверка здоровья сервера
async function checkServerHealth() {
    console.log('🏥 Проверка здоровья сервера...');
    try {
        const response = await fetch(`${BASE_URL}/health`);
        if (response.ok) {
            console.log('✅ Сервер работает');
            return true;
        } else {
            console.log('❌ Сервер недоступен');
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка подключения к серверу:', error.message);
        return false;
    }
}

// Тест анализа настроения
async function testMoodAnalysis() {
    console.log('🧠 Тестирование анализа настроения...');
    try {
        const token = await getAuthToken();
        const response = await fetch(`${BASE_URL}/api/ai/analyze-mood`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(testMoodData)
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log('✅ Анализ настроения успешен:');
            console.log('📊 Анализ:', data.analysis);
            console.log('🆔 ID сигнала:', data.signalId);
        } else {
            console.log('❌ Ошибка анализа настроения:', data.error);
        }
        return response.ok;
    } catch (error) {
        console.error('❌ Ошибка запроса:', error.message);
        return false;
    }
}

// Тест логирования активности
async function testActivityLogging() {
    console.log('📝 Тестирование логирования активности...');
    try {
        const token = await getAuthToken();
        const response = await fetch(`${BASE_URL}/api/ai/log-activity`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(testActivityData)
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log('✅ Активность залогирована:');
            console.log('💡 Рекомендация:', data.recommendation);
            console.log('🆔 ID сигнала:', data.signalId);
        } else {
            console.log('❌ Ошибка логирования активности:', data.error);
        }
        return response.ok;
    } catch (error) {
        console.error('❌ Ошибка запроса:', error.message);
        return false;
    }
}

// Тест получения инсайтов
async function testGetInsights() {
    console.log('🔍 Тестирование получения инсайтов...');
    try {
        const token = await getAuthToken();
        const response = await fetch(`${BASE_URL}/api/ai/insights/${TEST_USER_ID}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log('✅ Инсайты получены:');
            console.log('📊 Количество инсайтов:', data.insights.length);
            if (data.insights.length > 0) {
                console.log('💡 Последний инсайт:', data.insights[0].content.substring(0, 100) + '...');
            }
        } else {
            console.log('❌ Ошибка получения инсайтов:', data.error);
        }
        return response.ok;
    } catch (error) {
        console.error('❌ Ошибка запроса:', error.message);
        return false;
    }
}

// Тест получения рекомендаций
async function testGetRecommendations() {
    console.log('💡 Тестирование получения рекомендаций...');
    try {
        const token = await getAuthToken();
        const response = await fetch(`${BASE_URL}/api/ai/recommendations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log('✅ Рекомендации получены:');
            console.log('📊 Количество рекомендаций:', data.recommendations.length);
            if (data.recommendations.length > 0) {
                console.log('💡 Последняя рекомендация:', data.recommendations[0].message.substring(0, 80) + '...');
            }
        } else {
            console.log('❌ Ошибка получения рекомендаций:', data.error);
        }
        return response.ok;
    } catch (error) {
        console.error('❌ Ошибка запроса:', error.message);
        return false;
    }
}

// Тест генерации недельного инсайта
async function testWeeklyInsight() {
    console.log('📅 Тестирование генерации недельного инсайта...');
    try {
        const token = await getAuthToken();
        const response = await fetch(`${BASE_URL}/api/ai/generate-daily-insight`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            }
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log('✅ Недельный инсайт сгенерирован:');
            console.log('💡 Инсайт:', data.insight.substring(0, 100) + '...');
        } else {
            console.log('❌ Ошибка генерации инсайта:', data.error);
        }
        return response.ok;
    } catch (error) {
        console.error('❌ Ошибка запроса:', error.message);
        return false;
    }
}

// Запуск всех тестов
async function runAllTests() {
    console.log('🚀 Запуск тестов AI системы...\n');
    
    // Проверяем здоровье сервера
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
        console.log('❌ Сервер недоступен, тесты прерваны');
        return;
    }
    
    console.log('📋 Результаты тестов:\n');
    
    const results = {
        moodAnalysis: await testMoodAnalysis(),
        activityLogging: await testActivityLogging(),
        getInsights: await testGetInsights(),
        getRecommendations: await testGetRecommendations(),
        weeklyInsight: await testWeeklyInsight()
    };
    
    console.log('\n📊 Итоговый отчет:');
    console.log('✅ Успешные тесты:', Object.values(results).filter(Boolean).length);
    console.log('❌ Неудачные тесты:', Object.values(results).filter(r => !r).length);
    
    if (Object.values(results).every(Boolean)) {
        console.log('🎉 Все тесты прошли успешно!');
    } else {
        console.log('⚠️ Некоторые тесты не прошли. Проверьте логи выше.');
    }
}

// Запуск тестов если файл запущен напрямую
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    runAllTests,
    testMoodAnalysis,
    testActivityLogging,
    testGetInsights,
    testGetRecommendations,
    testWeeklyInsight
};
