# 健康检查

框架自带两个健康检查接口与一个探针注册器，用于容器编排 / 负载均衡的探活。

## 内置接口

| 接口 | 用途 | 行为 |
| --- | --- | --- |
| `GET /health/live` | 存活探针 | 进程能响应即 200 `{"status":"ok"}` |
| `GET /health/ready` | 就绪探针 | 并行执行全部已注册探针，全部通过 200；任一抛错 / 超时 / 返回 `false` 则 503 |

两个接口都带 `Cache-Control: no-store`。`/health/ready` 的响应只包含探针名与状态，
不包含错误详情（避免泄露内部信息）：

```json
{
  "status": "error",
  "checks": [
    { "name": "database", "status": "ok" },
    { "name": "cache", "status": "error" }
  ]
}
```

`/view/health` 是框架自带的人工查看页面。

## 注册业务探针

通过 extend 把业务依赖（数据库、缓存、下游服务）注册为探针：

```js
// app/extend/health-check.js
module.exports = (app) => {
  app.health.register("database", async () => {
    await app.services.db.ping(); // 抛错或返回 false 视为不健康
  });

  app.health.register("cache", async () => {
    const ok = await redisClient.ping();
    return ok === "PONG";
  }, { timeoutMs: 1000 }); // 默认 3000ms

  return {}; // extend 的返回值挂到 app.healthCheck（返回 {} 占位即可）
};
```

探针要求：

- `register(name, probe, { timeoutMs })`：name 唯一非空；probe 是返回
  Promise / 布尔的函数；抛错、超时、返回 `false` 都判为不健康
- 同名重复注册会启动失败
- `app.health.list()` 查看已注册探针（也会出现在
  `app.diagnostics.getManifest().healthChecks`）

## 接入编排系统

```yaml
# Kubernetes 示例
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
```

- 存活探针只证明进程能响应，不要挂重探针
- 就绪探针反映真实依赖状态：依赖故障时摘除流量，但不重启进程
- 文档站这类无外部依赖的纯静态项目，不注册探针即可，`/health/ready`
  恒为 200（`checks` 为空）
