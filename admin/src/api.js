const encoder = new TextEncoder();

const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  }
});

const cors = (request, env) => {
  const origin = request.headers.get('Origin');
  const configuredOrigins = String(env.PUBLIC_SITE_ORIGIN || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  const allowedOrigins = new Set();

  for (const configuredOrigin of configuredOrigins) {
    try {
      const url = new URL(configuredOrigin);
      allowedOrigins.add(url.origin);
      url.hostname = url.hostname.startsWith('www.')
        ? url.hostname.slice('www.'.length)
        : `www.${url.hostname}`;
      allowedOrigins.add(url.origin);
    } catch {
      continue;
    }
  }

  const allowedOrigin = origin && allowedOrigins.has(origin) ? origin : null;

  return allowedOrigin
    ? { 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' }
    : { Vary: 'Origin' };
};

const safeEqual = (left, right) => {
  if (left.length !== right.length) return false;

  let value = 0;
  for (let index = 0; index < left.length; index += 1) {
    value |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return value === 0;
};

const signature = async (value, secret) => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));

  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
};

const session = async (request, env) => {
  if (!env.SESSION_SECRET) return false;

  const token = request.headers.get('Cookie')
    ?.split(';')
    .map(item => item.trim())
    .find(item => item.startsWith('admin_session='))
    ?.slice('admin_session='.length);

  if (!token) return false;

  const [expires, tokenSignature] = token.split('.');

  return Number(expires) > Date.now()
    && safeEqual(tokenSignature || '', await signature(expires, env.SESSION_SECRET));
};

const article = value => ({
  id: String(value.id || crypto.randomUUID()),
  title: String(value.title || '').trim(),
  date: String(value.date || '').trim(),
  tags: Array.isArray(value.tags)
    ? value.tags.map(String).filter(Boolean)
    : String(value.tags || '').split(/[，,]/).map(tag => tag.trim()).filter(Boolean),
  content: String(value.content || '').trim()
});

const row = item => ({
  id: item.id,
  title: item.title,
  date: item.published_at,
  tags: JSON.parse(item.tags),
  content: item.content
});

const configurationError = (env, headers) => {
  if (env.DB && env.ADMIN_PASSWORD && env.SESSION_SECRET) return null;

  return json({ error: '后台尚未完成 D1 或密钥配置。' }, 503, headers);
};

const readBody = async request => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

export const handleApiRequest = async (request, env) => {
  const url = new URL(request.url);
  const headers = cors(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...headers,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (!url.pathname.startsWith('/api/')) return null;

  if (url.pathname === '/api/articles' && request.method === 'GET') {
    if (!env.DB) return configurationError(env, headers);

    const result = await env.DB.prepare('SELECT * FROM articles ORDER BY published_at DESC').all();
    return json(result.results.map(row), 200, headers);
  }

  if (url.pathname === '/api/session' && request.method === 'GET') {
    return json({ authenticated: await session(request, env) }, 200, headers);
  }

  if (url.pathname === '/api/login' && request.method === 'POST') {
    const configuration = configurationError(env, headers);
    if (configuration) return configuration;

    const body = await readBody(request);
    const supplied = String(body?.password || '');

    if (!safeEqual(supplied, env.ADMIN_PASSWORD)) {
      return json({ error: '密码不正确。' }, 401, headers);
    }

    const expires = String(Date.now() + 8 * 60 * 60 * 1000);
    const token = await signature(expires, env.SESSION_SECRET);

    return json({ ok: true }, 200, {
      ...headers,
      'Set-Cookie': `admin_session=${expires}.${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`
    });
  }

  if (url.pathname === '/api/logout' && request.method === 'POST') {
    return json({ ok: true }, 200, {
      ...headers,
      'Set-Cookie': 'admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
    });
  }

  if (url.pathname === '/api/articles' && ['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const configuration = configurationError(env, headers);
    if (configuration) return configuration;
    if (!await session(request, env)) return json({ error: '请先登录。' }, 401, headers);

    const id = url.searchParams.get('id');

    if (request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
      return json({ ok: true }, 200, headers);
    }

    const body = await readBody(request);
    if (!body) return json({ error: '文章数据格式不正确。' }, 422, headers);

    const value = article(body);
    if (!value.title || !value.date) {
      return json({ error: '请填写标题和发布时间。' }, 422, headers);
    }

    if (request.method === 'POST') {
      await env.DB.prepare('INSERT INTO articles (id,title,published_at,tags,content) VALUES (?,?,?,?,?)')
        .bind(value.id, value.title, value.date, JSON.stringify(value.tags), value.content)
        .run();
      return json(value, 201, headers);
    }

    if (!id) return json({ error: '缺少文章编号。' }, 422, headers);

    await env.DB.prepare('UPDATE articles SET title=?,published_at=?,tags=?,content=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .bind(value.title, value.date, JSON.stringify(value.tags), value.content, id)
      .run();
    return json({ ...value, id }, 200, headers);
  }

  return json({ error: '未找到接口。' }, 404, headers);
};
