# Cloudflare 文章后台

本目录部署为**独立的 Cloudflare Worker**：Worker 托管后台网页和 API，D1 保存文章。公开网站保持独立部署，只读取后台的公开文章接口。

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

后台与主站分开部署；后台的登录 cookie 仅在后台域名下有效。`ADMIN_PASSWORD` 和 `SESSION_SECRET` 仅保存在 Cloudflare Worker Secrets 中。Cloudflare 的 Workers 静态资源和 D1 绑定配置见 [Cloudflare Workers 配置文档](https://developers.cloudflare.com/workers/wrangler/configuration/) 和 [D1 迁移文档](https://developers.cloudflare.com/d1/reference/migrations/)。

## 发布文章

- 点击“发布新文章”会创建一篇新文章；点击既有文章的“编辑”才会更新该文章。
- 正文支持加粗、斜体、下划线、列表、链接和图片。图片可使用公开图片链接，也可上传单张不超过 1MB 的图片嵌入文章。
- 公开网站首页最多展示 4 篇文章；超过 4 篇时显示“查看全部文章”，进入 `articles.html` 查看完整列表。
