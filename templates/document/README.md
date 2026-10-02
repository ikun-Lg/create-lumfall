# lumfall-document

基于 [lumfall](https://www.npmjs.com/package/lumfall) 的技术文档站模板，
对标 VitePress 的使用体验：顶部导航、侧边栏、页面目录（TOC）、
站内搜索（Ctrl/Cmd+K）、代码高亮与复制、亮 / 暗主题、上一篇/下一篇、移动端适配。

模板本身是自举的：**内置内容就是 lumfall 框架的技术文档**，换掉内容即可为
任何项目搭文档站。文档是纯前端渲染的 SPA，内容由构建期打进产物，无需后端 API。

## 快速开始

```sh
pnpm install
pnpm start:dev                # 本地开发：webpack dev server + 服务
# 打开 http://localhost:3000/view/docs

pnpm start:prod               # 生产构建 + 启动（Koa 服务）
```

环境变量 `_ENV`（local / beta / prod）与构建部署细节同 lumfall 基础工程，
见[构建与部署文档](docs/guide/deployment.md)。

## 部署到 Vercel（静态托管）

文档站是纯前端 SPA：markdown 在构建期全部打进 bundle，运行时不调用任何接口，
因此**不需要 Node 进程**，可以直接以静态站点部署到 Vercel / Netlify / Nginx。

```sh
pnpm build:static             # 产出 dist-static/（index.html + app.html + vercel.json + dist/prod/）

cd dist-static && vercel --prod   # CLI 部署
```

或使用 Git 集成：Vercel 项目设置 **Build Command** = `pnpm build:static`，
**Output Directory** = `dist-static`，Framework Preset 选 Other。

`dist-static/` 的组成：

| 文件 | 作用 |
| --- | --- |
| `app.html` | 应用外壳（由框架页面模板转换，`window.__LUMFALL__` 替换为静态值） |
| `index.html` | `/` 的重定向页（跳到 `/view/docs`，替代 Koa 的 302 兜底） |
| `vercel.json` | SPA rewrite：`/view/docs/*` → `app.html`；`dist/prod/*` 长缓存头 |
| `dist/prod/...` | 构建产物（保持 `/dist/prod/` 绝对路径可解析） |

其他平台的等价配置：把 `/view/docs` 与 `/view/docs/:path*` rewrite 到
`app.html`（Netlify 的 `_redirects`、Nginx 的 `try_files` 即可），`/` 指向
`index.html`。深链接刷新、站内路由、客户端 404 页全部由前端自行处理。

::: warning 静态模式的能力边界
静态部署只有文档站页面：框架自带的 `/view/health`、`/view/dashboard`、
`/health/*`、`/api/*` 都不存在；如果往文档站里加 curl 调接口的功能，
需要回到 Koa 部署（或为接口单独部署服务）。
:::

## 目录结构

```text
lumfall-document/
├── server.js                  # 服务端入口（homePath 指向 /view/docs）
├── build.js                   # 前端构建入口
├── scripts/build-static.js    # 静态站点构建（pnpm build:static → dist-static/）
├── config/                    # 环境配置（同基础工程）
├── docs/                      # ★ 文档内容：全部 markdown，目录结构随意
│   ├── guide/
│   ├── core/
│   ├── dsl/                   # Dashboard DSL 章节（Model+Project、schema 模块、接口契约）
│   ├── frontend/
│   ├── advanced/
│   └── reference/
└── app/
    ├── webpack.config.js      # 额外声明了 .md 的 asset/source 规则
    └── pages/
        └── docs/              # 文档站页面（单页 + 站内路由）
            ├── entry.docs.js  # 页面入口：注册 /view/docs 两条路由
            ├── docs-config.js # ★ 站点配置：导航、侧栏、首页 hero、页脚
            ├── content.js     # 内容加载器：require.context 扫 docs/ 下所有 .md
            ├── markdown/      # markdown-it 渲染器（锚点/TOC/代码块/提示块/链接）
            ├── search.js      # 站内搜索索引
            ├── theme.js       # 亮暗主题
            ├── components/    # navbar / sidebar / toc / search / layout
            ├── views/         # 首页（hero）与文档页
            └── styles/        # 设计变量与排版样式（CSS 变量驱动双主题）
```

## 用它搭自己的文档站

三步：

1. **改内容**：把 `docs/` 下的 markdown 换成自己的（目录层级随意，
   两级以内体验最佳）。文档里可以互相引用，支持相对链接：
   ```markdown
   [配置](./config.md)          → 同目录
   [路由](../core/router-schema.md) → 上级目录
   [某节](./config.md#读取配置)  → 带锚点
   ```
2. **改配置**：`app/pages/docs/docs-config.js` 是唯一需要动的配置文件——
   站点名、导航、侧栏分组、首页 hero、页脚。侧栏条目的 `path` 对应
   `docs/` 下的文件路径（`/view/docs/<path>` ↔ `docs/<path>.md`）
3. **可选**：改主题色（`app/pages/docs/styles/vars.less` 的 `--doc-brand`
   等变量）、换 logo（`app/pages/docs/assets/docs-logo.svg`）

## 功能清单

| 功能 | 说明 |
| --- | --- |
| 首页 hero | 大标题 + 标语 + 按钮 + 特性卡片（配置驱动） |
| 侧边栏 | 分组导航，当前页高亮，移动端抽屉 |
| 页面目录 | 正文右侧 TOC，滚动联动高亮（<1280px 隐藏） |
| 站内搜索 | `Ctrl/Cmd + K` 或 `/` 唤起；标题 / 小节 / 正文加权匹配，关键词高亮摘要，键盘导航 |
| 代码块 | highlight.js 按需注册语言、语言标签、一键复制、亮暗配色 |
| markdown 扩展 | `::: tip / info / warning / danger <可选标题>` 提示块、标题锚点（悬停显示 #）、外链新窗口 |
| 主题 | 亮 / 暗（右上角切换），首次进站跟随系统，localStorage 记忆 |
| 上一篇/下一篇 | 按侧边栏顺序自动生成 |
| 路由 | `/view/docs` 首页，`/view/docs/<path>` 文档页，未知路径显示 404 引导 |
| SEO 基础 | 每页动态 `document.title`；如需完整 SEO 需要额外的预渲染方案 |

## 写作约定

- 每篇文档以 `# 一级标题` 开头（渲染为页面标题），章节用 `##` / `###`
  （自动进入右侧 TOC 与搜索索引）
- 代码块标注语言（`js` / `vue` / `bash` / `json`…）才会高亮
- 小节标题会被 slug 化为锚点 id（中文保留原文字符），可直接 `#锚点` 引用
- 不支持的内容：数学公式、mermaid 图（markdown-it 未接插件，需要时可在
  `app/pages/docs/markdown/index.js` 自行扩展）

## 搜索原理

构建时全部 markdown 以文本形式打进 bundle（`asset/source`），
搜索在浏览器内存里做索引（标题 / 小节标题 / 正文三级加权，代码块不参与）。
文档量在几百页以内体验良好；更大规模时建议接后端搜索或引入 lunr/minisearch。

## 常见问题

- **改了 docs/ 下的 md 没生效**：dev 模式需要重新触发编译（保存任意被引用的
  文件）；生产模式需要重新 `pnpm build:prod`
- **侧栏点进去 404**：`docs-config.js` 里的 path 与 `docs/` 实际文件不一致
- **想改页面挂载路径（/view/docs）**：改 `docs-config.js` 的 `DOCS_BASE`
  与 `entry.docs.js` 里的两条路由 path，三处保持一致

## 相关项目

- `lumfall-basic-project/`：基础业务工程骨架（本模板的工程底座）
- `lumfall-business/`：B 端全栈模板（Dashboard / schema 组件）
- `lumfall/`：框架本体
