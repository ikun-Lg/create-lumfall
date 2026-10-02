# 目录结构与挂载点

Lumfall 的核心约定：**业务根目录 = 进程的 `process.cwd()`**。
启动服务与执行构建都必须在业务根目录下运行，否则框架会加载错目录。

## 业务项目结构

```text
<app-root>/
├── server.js                  # 服务端入口：serviceStart()
├── build.js                   # 前端构建入口：frontendBuild(_ENV)
├── package.json
├── config/                    # 配置（见「配置」）
│   ├── config.default.js
│   ├── config.local.js        # 可选
│   ├── config.beta.js         # 可选
│   └── config.prod.js         # 可选
├── model/                     # 可选，Dashboard 的 Model + Project 配置
└── app/
    ├── middleware.js          # 可选，业务全局中间件注册入口
    ├── middleware/            # 可复用中间件
    ├── controller/
    ├── service/
    ├── router/
    ├── router-schema/
    ├── extend/
    ├── pages/                 # Vue 页面，entry.<name>.js 是入口
    ├── webpack.config.js      # 可选，扩展 Webpack 配置
    └── public/                # 静态文件；构建产物在 app/public/dist/
```

## 挂载点一览

文件名 / 目录名用 `kebab-case` 或 `snake_case`，加载后自动转 `camelCase`。

| 业务目录 | 导出约定 | 挂载结果 |
| --- | --- | --- |
| `app/middleware/**/*.js` | `(app) => (ctx, next) => {}` | `app.middlewares.<dir>.<name>` |
| `app/controller/**/*.js` | `(app) => class` | `app.controllers.<dir>.<name>`，启动时实例化 |
| `app/service/**/*.js` | `(app) => class` | `app.services.<dir>.<name>`，启动时实例化 |
| `app/extend/**/*.js` | `(app) => object` | 直接挂到 `app` 上，例如 `app.logger` |
| `app/router/**/*.js` | `(app, router) => {}` | 注册路由到 `app.router` |
| `app/router-schema/**/*.js` | schema 对象或 `(app) => map` | 合并进 `app.routerSchema` |
| `app/middleware.js` | `(app) => { app.use(...) }` | 全局中间件注册入口 |
| `app/webpack.config.js` | 配置对象 | 与框架 Webpack 配置 `merge.smart` 合并 |

例子：

- `app/service/user-service.js` → `app.services.userService`
- `app/controller/admin/user-list.js` → `app.controllers.admin.userList`
- `app/middleware/api/params-verify.js` → `app.middlewares.api.paramsVerify`

框架自带的同名类别文件也会被加载（controller、service、middleware、router-schema、
router、extend 都有内置实现）；页面入口同名时，**业务页面覆盖框架页面**。

## app 对象上有什么

启动完成后，`serviceStart()` 返回的 `app`（Koa 实例）上至少有：

| 属性 | 说明 |
| --- | --- |
| `app.options` | `serviceStart()` 的入参 |
| `app.baseDir` | `process.cwd()` |
| `app.businessPath` | `<app-root>/app` 的绝对路径，**业务代码取路径用它，不要用 `__dirname`** |
| `app.env` | 环境：`app.env.get()` 返回 `_ENV` 值 |
| `app.middlewares` | 全部中间件（框架 + 业务） |
| `app.routerSchema` | 合并后的 API 参数校验 schema |
| `app.controllers` / `app.services` | 已实例化的控制器 / 服务 |
| `app.config` | 合并后的配置（`configLoader` 之后才存在） |
| `app.plugins` | 插件注册结果 |
| `app.router` | KoaRouter 实例 |
| `app.logger` | 框架日志（log4js） |
| `app.health` | 健康检查注册器 |
| `app.diagnostics` | 诊断清单：`app.diagnostics.getManifest()` |
| `app.server` | `app.listen()` 返回的 server |
| `app.stop()` | 优雅退出（Promise） |

## 加载规则与三条硬约束

启动流程按固定顺序同步执行（详见 [app 对象与启动流程](../core/app-instance.md)），
由顺序推出三条约束：

1. **`app.config` 在 controller / service 工厂执行期还不存在**
   → 只能在请求阶段读配置（基类的 `this.config` getter 是安全的）
2. **controller 比 service 先加载**
   → 不要在 controller 工厂或构造期取 `app.services`（请求阶段用 `this.services`）
3. **任何 loader 遇到非法导出会直接抛错并中断启动**，不会静默跳过
   → 导出形状必须严格按上表约定

## 路径书写注意

- 业务路径统一走 `app.businessPath` + `path.join` / `path.resolve`，不要硬编码 `/`
- 例外：`glob` v7 的结果始终是 `/` 分隔，拼接前先按 `/` 拆开再 `join(path.sep)`

## 下一步

- [Controller 与 Service](../core/controller-service.md)：写业务逻辑
- [路由与参数校验](../core/router-schema.md)：暴露 API
