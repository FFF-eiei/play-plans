# 一起出去玩 · 部署说明（Netlify + GitHub）

现在已经**不用 Supabase 了**，数据直接存在 Netlify 自带的 Blobs 存储里（免费、国内能直连）。网页和函数都部署在 Netlify 上，朋友打开网页就能用，不用挂代理。

## 文件说明
- `index.html` —— 网页前端，调用下面的函数读写安排
- `netlify/functions/plans.mjs` —— 后端函数，读写 Blobs 里的安排表
- `netlify.toml` —— Netlify 配置（函数目录、发布目录、构建命令）
- `package.json` —— 声明 `@netlify/blobs` 依赖
- `schema.sql` —— **已废弃，不再需要**，可删

## 部署步骤（用 GitHub 仓库）

1. 打开 GitHub 新建一个仓库（public / private 都行）。
2. 把本文件夹里的这些文件全部 push 上去（`schema.sql` 不用传）。
3. 打开 https://app.netlify.com/ → **Add new site → Import an existing project** → 选 GitHub，选中这个仓库。
4. Netlify 会自动读取 `netlify.toml`（Build command = `npm install`，Publish directory = `.`），确认后点 **Deploy site**。
5. 部署完成后会得到一个 `https://xxx.netlify.app` 链接，发给朋友即可。
6. 之后想改内容，改完 push 一下，Netlify 会自动重新部署。

## 注意
- 数据存在 Netlify Blobs，公开可读写（和之前一样没有登录，请别写隐私信息）。
- 首次打开页面函数会有一次冷启动，可能要等几秒；如果显示「读取失败」，刷新一下重试。
- 每次重新部署（push）不会清空数据，数据是跨部署保存的。
