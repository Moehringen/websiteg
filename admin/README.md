# Cloudflare 文章后台

本目录支持两种部署方式：原有的 **Cloudflare Worker**，以及推荐的 **Cloudflare Pages + Pages Functions**。两种方式都可复用同一个 D1 数据库；不会删除或迁移既有文章。

## 推荐：部署到 Cloudflare Pages

Pages 专用文件位于 `admin/pages`，与旧 Worker 的部署配置完全分开。构建时会复制后台页面和共用 API 代码；`functions/api/[[path]].js` 提供 `/api/*` 接口。`_routes.json` 已限定为只有 API 请求运行函数，后台页面和样式保持静态访问。

1. 在 Cloudflare 创建一个新的 Pages 项目，连接本仓库。
2. 将 **Root directory** 设为 `admin/pages`，**Build command** 设为 `node build.mjs`，**Build output directory** 设为 `public`。
3. 在 Pages 项目的 **Settings > Bindings** 中添加 D1：变量名为 `DB`，选择既有的 `guo-shuang-articles` 数据库。
4. 在 **Settings > Variables and Secrets** 中添加：
   - 文本变量 `PUBLIC_SITE_ORIGIN`：公开网站域名，例如 `https://websiteg-8s4.pages.dev`。
   - 加密密钥 `ADMIN_PASSWORD`：后台登录密码。
   - 加密密钥 `SESSION_SECRET`：随机的长字符串。
5. 每次新增绑定或变量后重新部署 Pages 项目。
6. 将公开网站 Pages 项目的 `ARTICLE_API_URL` 改为新后台 Pages 域名加 `/api/articles`，例如 `https://guo-shuang-article-admin.pages.dev/api/articles`，然后重新部署公开网站。

> 不要把密码或会话密钥写进仓库或 `wrangler.jsonc`。Pages 的密钥单独保存，不会被本仓库的部署配置覆盖。

## 首次部署

1. 安装 Wrangler：`npm install --save-dev wrangler`。
2. 进入此目录，创建 D1：`npx wrangler d1 create guo-shuang-articles`。
3. 将命令返回的 `database_id` 填入 `wrangler.jsonc` 的 `database_id`。
4. 修改 `PUBLIC_SITE_ORIGIN` 为公开网站的真实域名，例如 `https://www.example.com`。
5. 创建密码和会话密钥（不会写入代码）：
   - `npx wrangler secret put ADMIN_PASSWORD`
   - `npx wrangler secret put SESSION_SECRET`
6. 建表并写入初始文章：`npx wrangler d1 migrations apply guo-shuang-articles --remote`。
7. 部署后台：`npx wrangler deploy`。

## 连接公开网站

把主站 `index.html` 中 `article-api-url` meta 标签的内容设为后台 Worker 地址加 `/api/articles`，例如 `https://guo-shuang-article-admin.<account>.workers.dev/api/articles`。

后台与主站分开部署；后台的登录 cookie 仅在后台域名下有效。`ADMIN_PASSWORD` 和 `SESSION_SECRET` 仅保存在 Cloudflare Secrets 中。Cloudflare 的 Pages D1 绑定配置见 [Cloudflare Pages Bindings 文档](https://developers.cloudflare.com/pages/functions/bindings/)。

## 发布文章

- 点击“发布新文章”会创建一篇新文章；点击既有文章的“编辑”才会更新该文章。
- 正文支持加粗、斜体、下划线、列表、链接和图片。图片可使用公开图片链接，也可上传单张不超过 1MB 的图片嵌入文章。
- 公开网站首页最多展示 4 篇文章；超过 4 篇时显示“查看全部文章”，进入 `articles.html` 查看完整列表。
