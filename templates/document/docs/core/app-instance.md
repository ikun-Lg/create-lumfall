# app 对象与启动流程

`serviceStart(options)` 返回的 `app` 是一个 Koa 实例，框架把所有能力都装配在它上面。
理解启动流程，就理解了框架的几乎所有约束。

## serviceStart 选项

| 选项 | 作用 |
| --- | --- |
| `name` | 应用名，渲染页面模板 `<title>` 时使用 |
| `homePath` | 完全未命中路由时的 302 兜底目标 |
| `configSchema` | 校验合并后配置的 JSON Schema（见[配置](../guide/config.md)） |
| `lifecycle` | 启动 / 停止 hook（见[生命周期](./lifecycle.md)） |
| `plugins` | 插件描述符数组（见[插件](./plugins.md)） |
| `monitoring` | 请求级观测 hook（见[请求观测](../advanced/monitoring.md)） |

::: warning homePath 默认值陷阱
完全不传参时 `homePath` 默认是 `/view/health`；但**一旦传了 options 对象**，
框架不再套用默认值——没写 `homePath` 时兜底重定向会变成 `/`。
所以只要传 options，就显式声明 `homePath`。
:::

其他启动相关默认值：监听 `0.0.0.0:3000`，可用 `IP` / `PORT` 环境变量覆盖。

## 启动流程

`serviceStart()` 内部固定按这个顺序同步装配：

```js
app.options = options;
app.baseDir = process.cwd();
app.businessPath = path.resolve(app.baseDir, "app");
app.env = env();

middlewareLoader(app);      // app.middlewares
routerSchemaLoader(app);    // app.routerSchema
controllerLoader(app);      // app.controllers（类在这里被 new）
serviceLoader(app);         // app.services（类在这里被 new）
configLoader(app);          // app.config
extendLoader(app);          // 返回值直接挂到 app（app.logger / app.health / ...）

registerPlugins(app, options.plugins);              // app.plugins

require("<lumfall>/app/middleware.js")(app);        // 框架全局中间件
require("<app-root>/app/middleware.js")(app);       // 业务全局中间件

// lifecycle.beforeRouteLoad(app)
routerLoader(app);                                  // app.router + 兜底 302 路由
// lifecycle.afterRouteLoad(app)
app.diagnostics = createDiagnostics(app);           // 诊断清单

app.server = app.listen(PORT || 3000, IP || "0.0.0.0");
// lifecycle.afterStart(app)
```

兜底路由注册在所有业务与框架路由之后：任何未命中路由的 GET 请求会
302 到 `homePath`。业务路由先于框架路由加载，路径冲突时业务优先。

任何一步抛错（文件导出不合法、schema 与路由不匹配、插件循环依赖、
配置校验失败……）都会中断启动并抛出异常，`lifecycle.onError` 会先被调用。

## 框架全局中间件链

框架 `app/middleware.js` 按固定顺序 `app.use()`：

```text
koa-static(app/public)          静态资源
koa-nunjucks-2(app/public)      模板引擎（ext: tpl）
koa-bodyparser                  请求体解析（json / form / text）
errorHandler                    统一异常兜底
monitoring                      请求观测（未配置时是 passthrough）
apiParamsVerify                 /api 参数校验（router-schema）
securityPolicy                  安全策略（apiSignVerify + projectHandler）
```

业务的 `app/middleware.js` 在框架之后执行，因此业务中间件位于这一串的**内层**：
请求先经过框架的静态资源、模板、bodyParser、错误处理、参数校验和安全策略，
再到业务中间件。

## 诊断清单

排查「文件明明写了却没生效」时非常有用：

```js
const manifest = app.diagnostics.getManifest();
// {
//   version: "1.1.0",
//   environment: "local",
//   loaders: ["middleware", "router-schema", "controller", "service", "config", "extend", "router"],
//   routes: [{ path, methods }],
//   pages: [{ name, entry, route, source }],
//   healthChecks: [{ name, timeoutMs }],
// }
```

- `routes`：已注册路由及方法
- `pages`：发现的页面入口，`source` 标记 `framework` / `business`
- `healthChecks`：已注册探针
- 内容可 JSON 序列化，不含凭证与探针函数，可以直接打成日志或挂在内部排查接口上

## 优雅退出

`app.stop()` 返回 Promise，可重复调用（内部会复用同一次流程）：

```text
lifecycle.beforeStop → 关闭 HTTP server → lifecycle.afterStop
```

适合在容器 / pm2 的 `SIGTERM` 处理里调用，等待在途请求处理完再退出。

## 下一步

- [Controller 与 Service](./controller-service.md)
- [生命周期](./lifecycle.md)
