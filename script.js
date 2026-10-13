const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.nav');
const articleDialog = document.querySelector('.article-dialog');
const articleGrid = document.querySelector('.article-grid');
const articleApi = document.querySelector('meta[name="article-api-url"]')?.content;
const isArticleListPage = /\/articles(?:\.html)?\/?$/.test(location.pathname);

menuButton?.addEventListener('click', () => { const isOpen = navigation.classList.toggle('open'); menuButton.setAttribute('aria-expanded', String(isOpen)); menuButton.textContent = isOpen ? '关闭' : '菜单'; });
navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { navigation.classList.remove('open'); menuButton?.setAttribute('aria-expanded', 'false'); if (menuButton) menuButton.textContent = '菜单'; }));

const safeUrl = (value, image = false) => {
  const source = String(value || '').trim();
  if (image && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(source)) return source;
  try { const url = new URL(source); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
};
const richContent = html => {
  const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'A', 'IMG', 'DIV', 'SECTION', 'SPAN', 'FIGURE', 'FIGCAPTION', 'HR', 'PRE', 'CODE']);
  const blocked = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'LINK', 'META', 'BASE', 'SVG', 'MATH']);
  const documentFragment = document.createDocumentFragment();
  const source = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const copy = node => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
    if (node.nodeType !== Node.ELEMENT_NODE || blocked.has(node.tagName)) return null;
    const element = allowed.has(node.tagName)
      ? document.createElement(node.tagName.toLowerCase())
      : document.createDocumentFragment();
    if (node.tagName === 'A') { const href = safeUrl(node.getAttribute('href')); if (href) { element.href = href; element.target = '_blank'; element.rel = 'noopener noreferrer'; } }
    if (node.tagName === 'IMG') { const src = safeUrl(node.getAttribute('src'), true); if (!src) return null; element.src = src; element.alt = node.getAttribute('alt') || ''; element.loading = 'lazy'; element.style.maxWidth = '100%'; element.style.height = 'auto'; }
    node.childNodes.forEach(child => { const copied = copy(child); if (copied) element.append(copied); });
    return element;
  };
  source.body.childNodes.forEach(node => { const copied = copy(node); if (copied) documentFragment.append(copied); });
  return documentFragment;
};
const openArticle = article => {
  document.querySelector('#article-title').textContent = article.title;
  document.querySelector('#article-date').textContent = `发布时间：${article.date}`;
  const content = document.querySelector('#article-content') || articleDialog?.querySelector('h3 + p');
  if (content) { content.replaceChildren(); if (article.content) content.append(richContent(article.content)); else content.textContent = '文章内容将按时间倒序持续更新。'; }
  document.querySelector('#article-tags').textContent = `文章分类标签：${article.tags.join('、')}`;
  articleDialog?.showModal();
};
const bindArticles = () => document.querySelectorAll('.article-link').forEach(link => link.addEventListener('click', event => { event.preventDefault(); openArticle({ title: link.dataset.title, date: link.dataset.date, content: link.dataset.content, tags: link.dataset.tags.split('、') }); }));
const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const renderArticles = articles => {
  if (!articleGrid) return;
  const visibleArticles = isArticleListPage ? articles : articles.slice(0, 4);
  articleGrid.innerHTML = visibleArticles.map(article => `<article><a class="article-link" href="#${escapeHtml(article.id)}" data-title="${escapeHtml(article.title)}" data-date="${escapeHtml(article.date)}" data-content="${escapeHtml(article.content || '')}" data-tags="${article.tags.map(escapeHtml).join('、')}"><h3>📄 ${escapeHtml(article.title)}</h3><p>📅 ${escapeHtml(article.date)} ｜ 标签：${article.tags.map(escapeHtml).join('、')}</p></a></article>`).join('');
  if (!isArticleListPage && articles.length > 4 && !document.querySelector('#article-view-more')) articleGrid.insertAdjacentHTML('afterend', '<p id="article-view-more"><a class="button button-dark" href="articles.html">查看全部文章 <span>→</span></a></p>');
  bindArticles();
};

bindArticles();
if (articleApi) fetch(articleApi).then(response => response.ok ? response.json() : Promise.reject()).then(renderArticles).catch(() => {});
document.querySelector('.dialog-close')?.addEventListener('click', () => articleDialog?.close());
