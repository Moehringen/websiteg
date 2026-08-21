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
