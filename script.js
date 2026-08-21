const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.nav');
const articleDialog = document.querySelector('.article-dialog');
const articleGrid = document.querySelector('.article-grid');
const articleApi = document.querySelector('meta[name="article-api-url"]')?.content;

menuButton?.addEventListener('click', () => { const isOpen = navigation.classList.toggle('open'); menuButton.setAttribute('aria-expanded', String(isOpen)); menuButton.textContent = isOpen ? '关闭' : '菜单'; });
navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { navigation.classList.remove('open'); menuButton?.setAttribute('aria-expanded', 'false'); if (menuButton) menuButton.textContent = '菜单'; }));

const openArticle = article => { document.querySelector('#article-title').textContent = article.title; document.querySelector('#article-date').textContent = `发布时间：${article.date}`; document.querySelector('#article-content').textContent = article.content || '文章内容将按时间倒序持续更新。'; document.querySelector('#article-tags').textContent = `文章分类标签：${article.tags.join('、')}`; articleDialog?.showModal(); };
const bindArticles = () => document.querySelectorAll('.article-link').forEach(link => link.addEventListener('click', event => { event.preventDefault(); openArticle({ title: link.dataset.title, date: link.dataset.date, content: link.dataset.content, tags: link.dataset.tags.split('、') }); }));
const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const renderArticles = articles => { articleGrid.innerHTML = articles.map(article => `<article><a class="article-link" href="#${escapeHtml(article.id)}" data-title="${escapeHtml(article.title)}" data-date="${escapeHtml(article.date)}" data-content="${escapeHtml(article.content || '')}" data-tags="${article.tags.map(escapeHtml).join('、')}"><h3>📄 ${escapeHtml(article.title)}</h3><p>📅 ${escapeHtml(article.date)} ｜ 标签：${article.tags.map(escapeHtml).join('、')}</p></a></article>`).join(''); bindArticles(); };

bindArticles();
if (articleApi) fetch(articleApi).then(response => response.ok ? response.json() : Promise.reject()).then(renderArticles).catch(() => {});
document.querySelector('.dialog-close')?.addEventListener('click', () => articleDialog?.close());
