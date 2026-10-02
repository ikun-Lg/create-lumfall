# 构建与部署

## 两种构建

`frontendBuild(_ENV)` 只认两个值，其他值什么都不做（所以 `_ENV=beta` 没有 dev 构建）：

| `_ENV` | 行为 |
| --- | --- |
| `local` | 启动 Webpack dev server（Express，默认 `127.0.0.1:9002`），HMR 热更新，内存编译 |
| `prod` | 完整产物构建到 `app/public/dist/prod/`，同时把每个页面的模板写到 `app/public/dist/entry.<name>.tpl` |

## 产物结构

`_ENV=prod node build.js` 之后：

```text
app/public/dist/
├── dev/                       # _ENV=local 构建产物（含 dev/entry.<page>.tpl 模板）
└── prod/
    ├── js/
    │   ├── runtime~entry.<page>_*.bundle.js
    │   ├── vendor_*.bundle.js     # node_modules 第三方库
    │   ├── common_*.bundle.js     # 被 ≥2 个入口引用的业务公共代码
    │   └── entry.<page>_*.bundle.js
    ├── css/
    │   ├── vendor_*.bundle.css
    │   └── ...
    └── entry.<page>.tpl       # 页面模板（Koa 用 nunjucks 渲染，按模式分目录）
```

- 分包策略（vendor / common / runtime）目的是让第三方与公共代码的长缓存稳定，
  业务代码改动不影响 vendor 的 hash
- 生产构建会先清空 `app/public/dist/` 再输出
- 模板里的资源以 `/dist/prod/` 为 publicPath，由 Koa 的静态目录（`app/public`）直接服务
- 页面模板按模式分目录（lumfall ≥ 1.2.0）：dev 构建写 `dist/dev/`、prod 构建写 `dist/prod/`，服务按 `_ENV` 渲染对应目录——模式不匹配时返回 503 并提示应执行的构建命令，不会白屏

::: tip 模式不匹配时的表现（lumfall ≥ 1.2.0）
dev 与 prod 构建的模板按模式分目录存放，服务只渲染 `_ENV` 对应目录的模板。
跑过 dev 构建后直接以 prod 模式启动（没执行 `build:prod`），页面请求会返回
503（code 5031）并附上应执行的构建命令——按提示重新构建即可，不会再出现
无报错的白屏。
:::

## 本地开发

```sh
pnpm start:dev
# = concurrently "pnpm build:dev" "pnpm dev"
```

- Webpack dev server 监听 `127.0.0.1:9002`，负责产出 JS/CSS 与 HMR 长连接
- Koa 服务监听 `0.0.0.0:3000`，页面模板在编译完成后写到磁盘
  （`app/public/dist/entry.<name>.tpl`），模板里的资源 URL 指向 dev server
- 页面访问走 Koa（`http://localhost:3000/view/<name>`），不要直接访问 9002

`PORT` / `IP` 环境变量可以覆盖 Koa 监听地址：

```sh
PORT=8080 IP=127.0.0.1 _ENV=local node server.js
```

## 生产部署

```sh
pnpm install
_ENV=prod node build.js
_ENV=prod node server.js
```

通常再配一个进程守护（pm2 / systemd / 容器）：

```sh
# pm2 示例
pm2 start server.js --name my-app --env _ENV=prod
```

- 服务器只需要 `server.js` + 构建产物；`build.js` 可以在 CI 里执行
- 健康检查接入负载均衡：存活探针用 `/health/live`，就绪探针用 `/health/ready`
  （详见 [健康检查](../advanced/health.md)）
- 日志输出在工作区 `logs/` 目录（log4js），注意持久化或采集

## 端口与地址速记

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PORT` | 3000 | Koa 服务端口 |
| `IP` | 0.0.0.0 | Koa 监听地址 |
| dev server | 127.0.0.1:9002 | Webpack dev server（HMR），端口写在框架 `webpack.dev.js` |

## 静态托管（Vercel / Netlify / Nginx）

不依赖 `/api` 的纯前端项目（页面数据都在构建期打包，比如文档站）可以脱离
Koa 以**纯静态站点**部署，不需要 Node 进程：

1. 正常执行 `_ENV=prod` 构建，产物为 `app/public/dist/` 下的
   `entry.<page>.tpl`（页面外壳）与 `prod/`（带 hash 的静态资源）
2. 把 `.tpl` 里的 `window.__LUMFALL__` 占位符替换为静态值，另存为 `app.html`
3. 配置 SPA rewrite：`/view/<page>` 与 `/view/<page>/:path*` → `app.html`；
   其余静态资源按原路径放行（模板里资源 URL 是 `/dist/prod/...` 绝对路径，
   保持目录结构即可）
4. 原来的 302 兜底用一个静态跳转页替代（`/` → 目标页面）

完整可运行的参考实现见 `lumfall-document/` 的 `scripts/build-static.js`
（`pnpm build:static` 一键产出 `dist-static/`，含 vercel.json rewrite 与
长缓存头，可直接部署 Vercel）。

::: tip 什么时候可以静态托管
页面只用「构建期已知的数据」——文档站、纯展示页、营销页。只要页面运行时
会调 `/api`（如 Dashboard、业务页面），就需要 Koa 服务，走上面的服务端部署。
:::

## 下一步

- [app 对象与启动流程](../core/app-instance.md)：理解启动时发生了什么
- [健康检查](../advanced/health.md)：接入业务依赖探针
