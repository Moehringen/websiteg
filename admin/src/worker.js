const encoder = new TextEncoder();
const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
const cors = (request, env) => ({ 'Access-Control-Allow-Origin': request.headers.get('Origin') === env.PUBLIC_SITE_ORIGIN ? env.PUBLIC_SITE_ORIGIN : '', Vary: 'Origin' });
const safeEqual = (left, right) => { if (left.length !== right.length) return false; let value = 0; for (let index = 0; index < left.length; index += 1) value |= left.charCodeAt(index) ^ right.charCodeAt(index); return value === 0; };
const signature = async (value, secret) => { const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''); };
const session = async (request, env) => { const token = request.headers.get('Cookie')?.split(';').map(item => item.trim()).find(item => item.startsWith('admin_session='))?.slice(14); if (!token) return false; const [expires, tokenSignature] = token.split('.'); return Number(expires) > Date.now() && safeEqual(tokenSignature || '', await signature(expires, env.SESSION_SECRET)); };
const article = value => ({ id: String(value.id || crypto.randomUUID()), title: String(value.title || '').trim(), date: String(value.date || '').trim(), tags: Array.isArray(value.tags) ? value.tags.map(String).filter(Boolean) : String(value.tags || '').split(/[，,]/).map(tag => tag.trim()).filter(Boolean), content: String(value.content || '').trim() });
const row = item => ({ id: item.id, title: item.title, date: item.published_at, tags: JSON.parse(item.tags), content: item.content });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = cors(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    if (url.pathname === '/api/articles' && request.method === 'GET') return json((await env.DB.prepare('SELECT * FROM articles ORDER BY published_at DESC').all()).results.map(row), 200, headers);
    if (url.pathname === '/api/session' && request.method === 'GET') return json({ authenticated: await session(request, env) }, 200, headers);
    if (url.pathname === '/api/login' && request.method === 'POST') { const supplied = String((await request.json()).password || ''); if (!safeEqual(supplied, env.ADMIN_PASSWORD)) return json({ error: '密码不正确。' }, 401, headers); const expires = String(Date.now() + 8 * 60 * 60 * 1000); return json({ ok: true }, 200, { ...headers, 'Set-Cookie': `admin_session=${expires}.${await signature(expires, env.SESSION_SECRET)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800` }); }
    if (url.pathname === '/api/logout' && request.method === 'POST') return json({ ok: true }, 200, { ...headers, 'Set-Cookie': 'admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0' });
    if (url.pathname === '/api/articles' && ['POST', 'PUT', 'DELETE'].includes(request.method)) { if (!await session(request, env)) return json({ error: '请先登录。' }, 401, headers); const id = url.searchParams.get('id'); if (request.method === 'DELETE') { await env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run(); return json({ ok: true }, 200, headers); } const value = article(await request.json()); if (!value.title || !value.date) return json({ error: '请填写标题和发布时间。' }, 422, headers); if (request.method === 'POST') { await env.DB.prepare('INSERT INTO articles (id,title,published_at,tags,content) VALUES (?,?,?,?,?)').bind(value.id, value.title, value.date, JSON.stringify(value.tags), value.content).run(); return json(value, 201, headers); } await env.DB.prepare('UPDATE articles SET title=?,published_at=?,tags=?,content=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(value.title, value.date, JSON.stringify(value.tags), value.content, id).run(); return json({ ...value, id }, 200, headers); }
    return env.ASSETS.fetch(request);
  }
};
