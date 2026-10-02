# 中间件

Lumfall 有两种中间件：**可复用中间件**（目录扫描、按名挂载）和
**全局中间件**（`app.use` 注册到请求链上）。

## 可复用中间件

`app/middleware/**/*.js`，导出工厂 `(app) => (ctx, next) => {}`：

```js
// app/middleware/api/logger.js
module.exports = (app) => async (ctx, next) => {
  const start = Date.now();
  await next();
  app.logger.info(`${ctx.method} ${ctx.path} ${Date.now() - start}ms`);
};
```

挂载结果：`app.middlewares.api.logger`。框架内置的可复用中间件
（`app.middlewares.errorHandler`、`app.middlewares.apiParamsVerify`、
`app.middlewares.securityPolicy`、`app.middlewares.monitoring`、
`app.middlewares.apiSignVerify`、`app.middlewares.projectHandler`）
也是同一套约定，业务可以直接复用或覆盖。

::: warning 命名
文件名用 kebab-case / snake_case，挂载名是 camelCase：
`params-verify.js` → `app.middlewares.xxx.paramsVerify`。
用文件原名访问会拿到 undefined。
:::

可复用中间件**不会自动生效**，需要在路由或全局中间件里显式使用：

```js
router.post("/api/article", app.middlewares.api.logger, controller.create.bind(controller));
```

## 全局中间件

`app/middleware.js`（注意是文件不是目录），导出 `(app) => {}`，
在里面 `app.use()`：

```js
module.exports = (app) => {
  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    console.log(`${ctx.method} ${ctx.path} ${ctx.status} ${Date.now() - start}ms`);
  });
};
```

执行时机：框架全局中间件之后、路由之前——所以业务全局中间件位于
框架中间件链的**内层**。

框架全局中间件的注册顺序：

```text
static → nunjucks → bodyParser → errorHandler → monitoring → apiParamsVerify → securityPolicy
```

含义：

- 静态资源与页面模板在**最外层**，不受安全策略影响
- 错误处理包住了后面所有中间件，任何内层异常都会被统一兜底
- `/api/` 请求在进 controller 前会依次经过参数校验（442）与安全策略（445 / 446）
- bodyParser 限制了表单大小 1000mb，支持 json / form / text

## 错误处理行为

`errorHandler` 的兜底策略：

| 异常 | 响应 |
| --- | --- |
| 消息含 `template not found`（页面模板缺失） | 302 重定向到 `homePath` |
| 其他异常 | HTTP 200 + `{ success: false, code: 5000, message: "Internal Server Error" }`，异常详情进日志 |

业务代码里主动抛错会被这里兜住；想给前端返回业务错误，用
`this.fail(ctx, message, code)` 而不是 throw。

## 下一步

- [安全策略](../advanced/security.md)：securityPolicy 中间件的细节
- [请求观测](../advanced/monitoring.md)：monitoring 的使用方式
