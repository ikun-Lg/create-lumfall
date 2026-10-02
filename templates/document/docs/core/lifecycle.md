# 生命周期

`serviceStart({ lifecycle })` 提供启动与退出的 hook：

```js
serviceStart({
  lifecycle: {
    beforeStart(app) {},        // 全部 loader 之前
    beforeRouteLoad(app) {},    // 全局中间件之后、路由加载之前
    afterRouteLoad(app) {},     // 路由之后、listen 之前
    afterStart(app) {},         // listen 之后
    onError(error, app) {},     // 启动期异常；处理后错误仍会抛出
    async beforeStop(app) {},   // app.stop() 的第一步
    async afterStop(app) {},    // server 关闭之后
  },
});
```

## 约束

- **启动期 hook（beforeStart / beforeRouteLoad / afterRouteLoad / afterStart）必须同步**，
  返回 Promise 会直接启动失败。需要异步初始化（连数据库、拉远程配置）时，
  在调用 `serviceStart()` **之前**完成，再把结果传进来
- 未知的 hook 名或非函数值会启动失败
- `onError` 只提供观测点，不能吞掉错误——处理完异常仍会向上抛

```js
// ❌ 启动期异步初始化
lifecycle: {
  async beforeStart(app) {
    app.db = await connect(); // 启动失败：hook must be synchronous
  },
}

// ✅ 先初始化，再启动
const db = await connect();
const app = serviceStart({
  plugins: [{ name: "database", register: () => ({ client: db }) }],
});
```

## 优雅退出

`app.stop()` 返回 Promise，按顺序执行：

```text
lifecycle.beforeStop → server.close() → lifecycle.afterStop
```

- 可以重复调用，内部复用同一次关闭流程
- 适合接 `SIGTERM`（容器 / pm2 场景）：

```js
process.on("SIGTERM", async () => {
  await app.stop();
  process.exit(0);
});
```

- `beforeStop` / `afterStop` 是唯二支持异步的 hook，用来刷缓冲、关连接
