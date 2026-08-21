const api = '/api';
const login = document.querySelector('#login');
const dashboard = document.querySelector('#dashboard');
const form = document.querySelector('#article-form');
const editor = document.querySelector('#content-editor');
const imageUpload = document.querySelector('#image-upload');
let articles = [];

const request = async (path, options = {}) => {
  const response = await fetch(`${api}${path}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '请求失败。');
  return data;
};

const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const today = () => new Date().toISOString().slice(0, 10);
const resetForm = () => {
  HTMLFormElement.prototype.reset.call(form);
  form.elements.id.value = '';
  form.elements.date.value = today();
  editor.innerHTML = '';
  document.querySelector('#form-heading').textContent = '发布新文章';
  document.querySelector('#save-article').textContent = '发布文章';
};
const render = () => {
  document.querySelector('#articles').innerHTML = articles.map(article => `<article class="article"><div><h2>${escapeHtml(article.title)}</h2><p>📅 ${escapeHtml(article.date)} ｜ 标签：${article.tags.map(escapeHtml).join('、')}</p></div><div><button data-edit="${escapeHtml(article.id)}">编辑</button><button data-delete="${escapeHtml(article.id)}">删除</button></div></article>`).join('');
};
const load = async () => { articles = await request('/articles'); render(); };
const show = async () => { login.hidden = true; dashboard.hidden = false; resetForm(); await load(); };
const restoreSelection = () => editor.focus();
const insertImage = source => {
  if (!source) return;
  restoreSelection();
  document.execCommand('insertImage', false, source);
};

document.querySelector('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    await request('/login', { method: 'POST', body: JSON.stringify({ password: new FormData(event.currentTarget).get('password') }) });
    await show();
  } catch (error) { document.querySelector('#login-error').textContent = error.message; }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const value = Object.fromEntries(new FormData(form));
  value.tags = value.tags.split(/[，,]/).map(tag => tag.trim()).filter(Boolean);
  value.content = editor.innerHTML.trim();
  try {
    await request(`/articles${value.id ? `?id=${value.id}` : ''}`, { method: value.id ? 'PUT' : 'POST', body: JSON.stringify(value) });
    resetForm();
    await load();
  } catch (error) { alert(error.message); }
});

document.querySelector('.editor-toolbar').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const { command, action } = button.dataset;
  if (command) { restoreSelection(); document.execCommand(command, false); }
  if (action === 'link') { const url = prompt('请输入链接地址（https://…）：'); if (url) { restoreSelection(); document.execCommand('createLink', false, url); } }
  if (action === 'image-url') insertImage(prompt('请输入图片链接（https://…）：'));
  if (action === 'image-upload') imageUpload.click();
});

imageUpload.addEventListener('change', event => {
  const [file] = event.target.files;
  if (!file) return;
  if (file.size > 1024 * 1024) { alert('图片请控制在 1MB 以内。'); imageUpload.value = ''; return; }
  const reader = new FileReader();
  reader.addEventListener('load', () => { insertImage(reader.result); imageUpload.value = ''; });
  reader.readAsDataURL(file);
});

document.querySelector('#reset').addEventListener('click', resetForm);
document.querySelector('#articles').addEventListener('click', async event => {
  const id = event.target.dataset.edit || event.target.dataset.delete;
  if (!id) return;
  const article = articles.find(item => item.id === id);
  if (event.target.dataset.edit) {
    form.elements.id.value = article.id;
    form.elements.title.value = article.title;
    form.elements.date.value = article.date;
    form.elements.tags.value = article.tags.join('、');
    editor.innerHTML = article.content || '';
    document.querySelector('#form-heading').textContent = '编辑文章';
    document.querySelector('#save-article').textContent = '保存修改';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (confirm(`删除“${article.title}”？`)) { await request(`/articles?id=${id}`, { method: 'DELETE' }); await load(); }
});
document.querySelector('#logout').addEventListener('click', async () => { await request('/logout', { method: 'POST' }); dashboard.hidden = true; login.hidden = false; });
request('/session').then(session => session.authenticated && show()).catch(() => {});
