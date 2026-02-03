/**
 * Простой нагрузочный тест без k6/Artillery: N параллельных запросов к основным API.
 * Запуск: node scripts/load/simple-load.js
 * Переменные: BASE_URL (по умолчанию http://localhost:3001), CONCURRENT (по умолчанию 50)
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const CONCURRENT = parseInt(process.env.CONCURRENT || '50', 10);

const routes = [
  { method: 'GET', url: `${BASE_URL}/health` },
  { method: 'GET', url: `${BASE_URL}/api/benefits` },
  { method: 'GET', url: `${BASE_URL}/api/progress?user_id=1` },
  { method: 'GET', url: `${BASE_URL}/api/user-benefits?user_id=1` },
  { method: 'GET', url: `${BASE_URL}/api/activity?user_id=1` },
];

async function fetchOne(route) {
  const start = Date.now();
  try {
    const res = await fetch(route.url, {
      method: route.method,
      headers: route.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
      body: route.method === 'POST' ? JSON.stringify({ login: 'test@example.com', password: 'test123' }) : undefined,
    });
    const ms = Date.now() - start;
    return { ok: res.ok, status: res.status, ms };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - start, error: err.message };
  }
}

async function run() {
  console.log(`Base URL: ${BASE_URL}, concurrent requests: ${CONCURRENT}\n`);
  const startTotal = Date.now();
  const promises = [];
  for (let i = 0; i < CONCURRENT; i++) {
    const route = routes[i % routes.length];
    promises.push(fetchOne(route));
  }
  const results = await Promise.all(promises);
  const totalMs = Date.now() - startTotal;
  const failed = results.filter((r) => !r.ok);
  const times = results.map((r) => r.ms).filter((m) => m > 0);
  const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(0) : 0;
  const max = times.length ? Math.max(...times) : 0;

  console.log(`Total: ${results.length} requests in ${totalMs} ms`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Avg response time: ${avg} ms, max: ${max} ms`);
  if (failed.length > 0) {
    console.log('Sample errors:', failed.slice(0, 3));
  }
}

run().catch((e) => console.error(e));
