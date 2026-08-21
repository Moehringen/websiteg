# GitHub 自动部署到 Cloudflare

这个仓库有两个独立的 Cloudflare 项目：

| 项目 | Cloudflare 产品 | 仓库根目录 | 生产分支 |
| --- | --- | --- | --- |
| 公开网站 | Pages | `/` | `main` |
| 文章后台 | Workers Builds + D1 | `admin` | `main` |

## 公开网站（Cloudflare Pages）

1. Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages** → **Import an existing Git repository**。
2. 选择 `Moehringen/websiteg`，生产分支选择 `main`。
3. Framework preset 选择 **None**；Build command 填 `npm run build:site`；Build output directory 填 `dist`。
4. 在 **Settings → Environment variables** 添加 `ARTICLE_API_URL`，值为文章后台部署后得到的 `https://<worker>.workers.dev/api/articles`。
5. 保存并部署。之后每次推送到 `main`，Cloudflare Pages 自动部署公开网站。

## 文章后台（Cloudflare Workers + D1）

1. Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Import a repository**。
2. 选择同一个 GitHub 仓库；Root directory 填 `admin`。
3. Worker 名称必须与 `admin/wrangler.jsonc` 中的 `name` 相同：`guo-shuang-article-admin`；Production branch 选择 `main`。
4. 创建 D1 数据库：在本机执行 `cd admin && npx wrangler d1 create guo-shuang-articles`，把返回的 ID 填到 `admin/wrangler.jsonc`。
5. 执行 `npx wrangler d1 migrations apply guo-shuang-articles --remote`，创建文章表及初始文章。
6. 在 Worker → **Settings → Variables and Secrets** 添加两个 **Secret**：`ADMIN_PASSWORD`、`SESSION_SECRET`；并把 `PUBLIC_SITE_ORIGIN` 设为公开网站域名。
7. Cloudflare Workers Builds 的 Build command 留空，Deploy command 使用默认的 `npx wrangler deploy`。之后每次推送到 `main`，Cloudflare 自动部署后台。

先部署后台，再将后台 API 地址配置为 Pages 的 `ARTICLE_API_URL`，并重新触发一次 Pages 部署。
