export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Нормализуем путь: если не начинается с /v1, добавим префикс
    const incomingPath = url.pathname || '/';
    const normalizedPath = incomingPath.startsWith('/v1/')
      ? incomingPath
      : (incomingPath === '/v1' ? '/v1/' : `/v1${incomingPath.startsWith('/') ? '' : '/'}${incomingPath.replace(/^\/+/, '')}`);

    const target = new URL(`https://api.anthropic.com${normalizedPath}${url.search}`);

    const isBodyAllowed = request.method !== 'GET' && request.method !== 'HEAD';
    const init = {
      method: request.method,
      headers: new Headers(request.headers),
      body: isBodyAllowed ? await request.arrayBuffer() : undefined,
    };

    // Обязательные заголовки для Anthropic API
    init.headers.set('anthropic-version', '2023-06-01');

    // Если хотите хранить ключ на стороне воркера, раскомментируйте и
    // добавьте ANTHROPIC_API_KEY в wrangler.toml -> [vars]
    // init.headers.set('x-api-key', env.ANTHROPIC_API_KEY);

    // Чистим заголовки, которые может не любить апстрим
    init.headers.delete('host');
    init.headers.delete('cf-connecting-ip');
    init.headers.delete('x-forwarded-for');

    const resp = await fetch(target.toString(), init);

    // Базовые CORS для удобной отладки
    const out = new Response(resp.body, resp);
    out.headers.set('Access-Control-Allow-Origin', '*');
    out.headers.set('Access-Control-Allow-Headers', '*');
    out.headers.set('x-proxy-target', target.toString());
    return out;
  },
};


