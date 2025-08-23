// Тестирование AI системы Yoddle (без внешних зависимостей)
// Запуск: node test_ai_system_simple.cjs

const http = require('http');

const BASE_URL = 'localhost:3001'; // Измените на ваш порт
const TEST_USER_ID = 1; // Пользователь с ID 1

// Тестовые данные для API
const testMoodData = {
    userId: 1,
    mood: 8,
    activities: ["работа", "спорт"],
    notes: "Отличный день! Завершил проект",
    stressLevel: 2
};

const testActivityData = {
    userId: 1,
    activity: "Тестирование AI системы",
    category: "разработка",
    duration: 120,
    success: true,
    notes: "AI API работает отлично!"
};

// Получение JWT токена (временно не нужен)
function getAuthToken() {
    return ''; // Пустая строка - аутентификация отключена
}

// Простой HTTP запрос
function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;
        
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData ? Buffer.byteLength(postData) : 0
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(body);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

// Проверка здоровья сервера
async function checkServerHealth() {
    console.log('🏥 Проверка здоровья сервера...');
    try {
        const response = await makeRequest('/health');
        if (response.status === 200) {
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
        const response = await makeRequest('/api/ai/analyze-mood', 'POST', testMoodData);
        if (response.status === 200) {
            console.log('✅ Анализ настроения успешен:');
            console.log('📊 Анализ:', response.data.analysis);
            console.log('🆔 ID сигнала:', response.data.signalId);
        } else {
            console.log('❌ Ошибка анализа настроения:', response.data.error);
        }
        return response.status === 200;
    } catch (error) {
        console.error('❌ Ошибка запроса:', error.message);
        return false;
    }
}

// Тест логирования активности
async function testActivityLogging() {
    console.log('📝 Тестирование логирования активности...');
    try {
        const response = await makeRequest('/api/ai/log-activity', 'POST', testActivityData);
        if (response.status === 200) {
            console.log('✅ Активность залогирована:');
            console.log('💡 Рекомендация:', response.data.recommendation);
        } else {
            console.log('❌ Ошибка логирования активности:', response.data.error);
        }
        return response.status === 200;
    } catch (error) {
        console.error('❌ Ошибка запроса:', error.message);
        return false;
    }
}

// Тест получения инсайтов
async function testGetInsights() {
    console.log('🔍 Тестирование получения инсайтов...');
    try {
        const response = await makeRequest(`/api/ai/insights/${TEST_USER_ID}`);
        if (response.status === 200) {
            console.log('✅ Инсайты получены:');
            console.log('📊 Количество инсайтов:', response.data.insights.length);
            if (response.data.insights.length > 0) {
                console.log('💡 Последний инсайт:', response.data.insights[0].content.substring(0, 100) + '...');
            }
        } else {
            console.log('❌ Ошибка получения инсайтов:', response.data.error);
        }
        return response.status === 200;
    } catch (error) {
        console.error('❌ Ошибка запроса:', error.message);
        return false;
    }
}

// Тест получения рекомендаций
async function testGetRecommendations() {
    console.log('💡 Тестирование получения рекомендаций...');
    try {
        const response = await makeRequest('/api/ai/recommendations?userId=1');
        if (response.status === 200) {
            console.log('✅ Рекомендации получены:');
            console.log('📊 Количество рекомендаций:', response.data.recommendations.length);
            if (response.data.recommendations.length > 0) {
                console.log('💡 Последняя рекомендация:', response.data.recommendations[0].message.substring(0, 80) + '...');
            }
        } else {
            console.log('❌ Ошибка получения рекомендаций:', response.data.error);
        }
        return response.status === 200;
    } catch (error) {
        console.error('❌ Ошибка запроса:', error.message);
        return false;
    }
}

// Тест генерации недельного инсайта
async function testWeeklyInsight() {
    console.log('📅 Тестирование генерации недельного инсайта...');
    try {
        const response = await makeRequest('/api/ai/generate-daily-insight', 'POST', { userId: 1 });
        if (response.status === 200) {
            console.log('✅ Недельный инсайт сгенерирован:');
            console.log('💡 Инсайт:', response.data.insight.substring(0, 100) + '...');
        } else {
            console.log('❌ Ошибка генерации инсайта:', response.data.error);
        }
        return response.status === 200;
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

// Запуск тестов
runAllTests().catch(console.error);
