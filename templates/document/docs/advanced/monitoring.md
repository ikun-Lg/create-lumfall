# 请求观测 monitoring

`serviceStart({ monitoring })` 提供请求级的观测钩子（可选配置，
不配置就是纯 passthrough，对默认行为零影响）。

## 基本用法

```js
serviceStart({
  monitoring: {
    // 透传 / 生成 trace id 的请求头，默认 "x-trace-id"
    traceHeader: "x-trace-id",

    onRequestStart({ traceId, method, path }) {
      // 请求进入
    },
    onRequestEnd({ traceId, method, path, status, durationMs }) {
      // 响应完成（正常路径）
    },
    onRequestError({ traceId, method, path, error, durationMs }) {
      // 内层抛出异常时（异常还会继续向上交给 errorHandler）
    },
  },
});
```

## trace id

- 请求头里已有 `traceHeader` 就复用，否则生成（UUID），并回显到**同名响应头**
- trace id 同时写入 `ctx.traceId`，业务代码可直接读
- 跨服务串日志：上游把 trace id 放进请求头，下游自动复用

## 行为约定

- 钩子自己抛错只记 warning，**不影响响应**——观测故障不拖垮业务
- monitoring 位于 `errorHandler` 内侧：内层异常先触发 `onRequestError`，
  再由 errorHandler 渲染响应，所以每个请求都会且只会触发一次
  `onRequestEnd` 或 `onRequestError`
- 校验：未知 hook 名、非函数 hook、非法 `traceHeader` 都会导致**启动失败**

## 典型用法

```js
serviceStart({
  monitoring: {
    onRequestStart({ traceId, method, path }) {
      app.logger.info(`[start] ${traceId} ${method} ${path}`);
    },
    onRequestEnd({ traceId, method, path, status, durationMs }) {
      app.logger.info(`[end] ${traceId} ${method} ${path} ${status} ${durationMs}ms`);
    },
  },
});
```

::: tip 与全局中间件的分工
- monitoring：请求级「开始 / 结束 / 出错」三点观测 + trace 透传
- 业务全局中间件：需要修改请求 / 响应（加 header、改 body）的逻辑
只做观测就用 monitoring，它有框架级的错误隔离。
:::
