# 路由与参数校验

路由文件负责把 URL 绑到 controller 方法；router-schema 用 JSON Schema（Ajv）
声明参数约束，框架中间件在请求进入 controller 前自动校验。

## 注册路由

`app/router/<name>.js`，导出 `(app, router) => {}`：

```js
module.exports = (app, router) => {
  const { article: articleController } = app.controllers;

  router.get("/api/article/list", articleController.getList.bind(articleController));

  router.post(
    "/api/article",
    app.middlewares.apiParamsVerify, // 可选：挂额外中间件
    articleController.create.bind(articleController)
  );
};
```

- 框架自带路由：`/view/:page` 与 `/view/:page/*`（页面渲染）、
  `/health/live`、`/health/ready`、`/api/project/*`（Dashboard 数据）
- 业务路由先于框架路由加载，同路径时业务优先
- 完全未命中的 GET 请求 302 到 `homePath`

## 声明参数校验

`app/router-schema/<name>.js`，导出「path → method → schema」的映射，
或 `(app) => map` 工厂：

```js
module.exports = {
  "/api/article/list": {
    get: {
      query: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1 },
          pageSize: { type: "integer", minimum: 1, maximum: 200 },
        },
      },
    },
  },
  "/api/article": {
    post: {
      body: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1 },
        },
        required: ["title"],
      },
    },
  },
};
```

可校验的位置：`headers` / `body` / `query` / `params`（JSON Schema draft-07 风格）。

## 校验行为

- 只作用于 **`/api/` 开头**的请求，其余路径不校验
- schema 里没声明的 path / method 直接放行
- 校验失败返回 **HTTP 200** + 业务错误码：

```json
{
  "success": false,
  "message": "request validate fail: data should have required property 'title'",
  "code": 442
}
```

## 启动期一致性校验

router-schema 与路由的一致性在**启动时**校验，不匹配直接启动失败：

- key（path）必须是已注册路由的 path
- method 必须全小写，且该路由确实以这个方法注册过

```text
Error: [router] router-schema path "/api/artile/list" does not match a registered route
```

::: tip 常见坑
- path 手打错一个字母 → 启动失败（这是故意的，把问题提前到启动期）
- method 写成 `"GET"` → 启动失败，必须小写
- 校验只对 `/api/` 开头的路径生效，`/view/...` 不参与
:::

## 校验器缓存

Ajv 编译后的校验器按 `method + path + 位置` 缓存（schema 是启动期静态数据），
运行时没有重复编译开销。

## 下一步

- [中间件](./middleware.md)：参数校验在整条中间件链的位置
- [安全策略](../advanced/security.md)：445 / 446 错误码来自哪里
