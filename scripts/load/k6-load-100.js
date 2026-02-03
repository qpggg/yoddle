/**
 * Нагрузочный тест k6: ~100 виртуальных пользователей, основные API Yoddle.
 * Запуск: k6 run --vus 100 --duration 60s k6-load-100.js
 * Или с кастомным URL: k6 run --vus 100 --duration 60s -e BASE_URL=http://your-host:3001 k6-load-100.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export const options = {
  vus: 100,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // 1. Проверка живости
  let res = http.get(`${BASE_URL}/health`);
  check(res, { 'health status 200': (r) => r.status === 200 });
  sleep(0.5);

  // 2. Публичные/лёгкие API без авторизации (user_id=1 как тестовый)
  res = http.get(`${BASE_URL}/api/benefits`);
  check(res, { 'benefits status 200': (r) => r.status === 200 });
  sleep(0.3);

  res = http.get(`${BASE_URL}/api/progress?user_id=1`);
  check(res, { 'progress status 200': (r) => r.status === 200 });
  sleep(0.3);

  res = http.get(`${BASE_URL}/api/user-benefits?user_id=1`);
  check(res, { 'user-benefits status 200': (r) => r.status === 200 });
  sleep(0.3);

  res = http.get(`${BASE_URL}/api/activity?user_id=1`);
  check(res, { 'activity status 200': (r) => r.status === 200 });
  sleep(0.5);

  // 3. Логин (нагрузка на БД и bcrypt)
  res = http.post(`${BASE_URL}/api/login`, JSON.stringify({
    login: 'test@example.com',
    password: 'test123',
  }), { headers: { 'Content-Type': 'application/json' } });
  check(res, { 'login any response': (r) => r.status === 200 || r.status === 401 });
  sleep(1);
}
