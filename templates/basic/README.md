# lumfall-basic-project

基于 [lumfall](https://www.npmjs.com/package/lumfall) 的基础业务项目骨架。
克隆或复制本目录，重命名后即可开始业务开发，不必从零搭建工程。

## 目录结构

```text
lumfall-basic-project/
├── server.js                  # 服务端入口：serviceStart()
├── build.js                   # 前端构建入口：frontendBuild(_ENV)
├── package.json
├── config/
│   ├── config.default.js      # 全环境基础配置
│   ├── config.local.js        # _ENV=local 覆盖（可选）
│   ├── config.beta.js         # _ENV=beta 覆盖（可选）
│   └── config.prod.js         # _ENV=prod 覆盖（可选）
└── app/
    ├── middleware.js          # 业务全局中间件注册入口
    ├── middleware/            # 可复用中间件 → app.middlewares.<dir>.<name>
    ├── controller/            # 示例：demo.js → app.controllers.demo
    ├── service/               # 示例：demo.js → app.services.demo
    ├── router/                # 路由注册（URL → controller 方法）
    ├── router-schema/         # API 参数 JSON Schema（Ajv 校验）
    ├── extend/                # 扩展点：返回值直接挂到 app 上
    ├── pages/
    │   └── home/              # 示例页面，访问 /view/home
    │       ├── entry.home.js  # 页面入口（命名必须是 entry.<page-name>.js）
    │       └── home.vue
    └── webpack.config.js      # Webpack 扩展配置（与框架配置 merge.smart 合并）
```

框架通过 npm 依赖 `lumfall` 引入，业务代码只写在本目录，不要修改
`node_modules/lumfall` 里的框架本体。

## 常用命令

```sh
pnpm install                  # 安装依赖

pnpm start:dev                # 本地开发：webpack dev server（HMR）+ 服务
pnpm build:prod && pnpm prod  # 生产构建 + 启动
pnpm new-page user-list       # 新建页面 app/pages/user-list/，访问 /view/user-list
pnpm new-page user-list --header  # 新建页面并套用框架的 HeaderContainer 布局
```

环境由 `_ENV` 区分（`local` / `beta` / `prod`，缺省 `local`），不是 `NODE_ENV`。

## 示例包含什么

骨架自带一套最小但完整的示例，覆盖最常见的开发路径：

| 内容 | 位置 | 说明 |
| --- | --- | --- |
| 页面 | `app/pages/home/` | 访问 `/view/home`，演示 `$lumfallCurl` 调接口、Arco 组件 |
| 读配置的接口 | `GET /api/demo/info` | 返回 `config` 合并结果，改 `config.<env>.js` 即可看到变化 |
| 分页列表接口 | `GET /api/demo/note/list` | 演示 query 参数 + router-schema 校验 |
| 创建接口 | `POST /api/demo/note` | 演示 body 参数 + 校验失败返回 code 442 |

新增一个 API 只需四步：`app/service/xxx.js` → `app/controller/xxx.js` →
`app/router/xxx.js` → `app/router-schema/xxx.js`，目录与挂载约定见下表。

## 目录约定与挂载点

文件 / 目录名用 `kebab-case` 或 `snake_case`，加载后自动转 `camelCase`。

| 业务目录 | 导出约定 | 挂载结果 |
| --- | --- | --- |
| `app/middleware/**/*.js` | `(app) => (ctx, next) => {}` | `app.middlewares.<dir>.<name>` |
| `app/controller/**/*.js` | `(app) => class` | `app.controllers.<dir>.<name>`，启动时实例化 |
| `app/service/**/*.js` | `(app) => class` | `app.services.<dir>.<name>`，启动时实例化 |
| `app/extend/**/*.js` | `(app) => object` | 直接挂到 `app`，例如 `app.logger` |
| `app/router/**/*.js` | `(app, router) => {}` | 注册路由到 `app.router` |
| `app/router-schema/**/*.js` | schema 对象或 `(app) => map` | 合并进 `app.routerSchema` |

controller / service 继承基类后可用：`this.services`（= `app.services`）、
`this.config`（= `app.config`，仅请求阶段读取），以及统一响应
`this.success(ctx, data, metadata)` / `this.fail(ctx, message, code)`。

## 配置

四层浅合并，后者覆盖前者同名键：

```text
框架 config.default -> 业务 config.default -> 框架 config.<env> -> 业务 config.<env>
```

- 需要强约束时在 `server.js` 传 `configSchema`（JSON Schema），不匹配直接启动失败
- 需要强校验时同样可传 `lifecycle`（启动/停止 hook）、`plugins`（数据库等前置能力）、
  `monitoring`（请求级观测），用法见框架文档

## 常见注意点

1. 服务与构建都必须在本目录（业务根目录 = `process.cwd()`）下执行
2. 业务代码里取业务路径用 `app.businessPath`，不要用 `__dirname`
3. `frontendBuild` 只认 `_ENV=local`（webpack dev server）和 `_ENV=prod`（产物构建）
4. 完全未命中路由会 302 到 `server.js` 里配置的 `homePath`
5. `/health/live`、`/health/ready` 是框架内置健康检查；业务依赖探针通过
   `app/extend/` 注册到 `app.health`
6. 生产环境建议开启 `config.security.apiSignature` 并把 `secret` 放到环境变量
7. 框架共享依赖（`vue`、`@arco-design/web-vue`、`vue-router`、`pinia`、
   `@babel/runtime`、`lodash`、`axios` 等）可直接 import，由框架
   `resolve.alias` 白名单解析（需要 lumfall ≥ 1.1.1），无需重复安装，
   运行时也只有一份实例。白名单之外的库先 `pnpm add xxx` 再使用；
   `_` 与 `axios` 另有 webpack 全局注入，页面代码不 import 也能用

## 下一步

- 需要 B 端管理台（登录、Dashboard、Schema 组件、菜单管理）时，参考同工作区的
  `lumfall-business/`，它演示了 `model/`（Dashboard 的 Model + Project 配置）、
  schema 表格/表单/搜索栏等开箱组件的用法
- 需要技术文档站模板时，参考同工作区的 `lumfall-document/`
- 框架完整能力（安全策略、生命周期、插件、诊断清单等）见 lumfall 技术文档
