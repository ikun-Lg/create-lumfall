# 配置

配置放在业务根目录的 `config/` 下，按 `_ENV` 环境分层加载，**四层浅合并**，
后面的覆盖前面的同名键：

```text
框架 config.default.js → 业务 config.default.js → 框架 config.<env>.js → 业务 config.<env>.js
```

环境由环境变量 `_ENV` 决定（`local` / `beta` / `prod`，缺省 `local`），
**不是 `NODE_ENV`**。`_ENV` 不存在对应的配置文件时按空对象处理，不会报错。

## 基本用法

```js
// config/config.default.js
module.exports = {
  name: "my-app",
  apiBasePath: "/api",
  security: {
    apiSignature: { enabled: false, maxAgeMs: 600000 },
    projectKey: { enabled: true, headerName: "project_key" },
  },
};
```

```js
// config/config.prod.js —— 只写需要覆盖的键
module.exports = {
  security: {
    apiSignature: { enabled: true, secret: process.env.API_SIGN_SECRET },
  },
};
```

::: warning 浅合并
合并是**一层**的浅合并（`Object.assign` 语义）：对象型配置在环境文件里
覆盖时是**整键替换**，不是深合并。上例的 `security` 会整体替换 default 里的
`security`，所以环境文件里要写完整的安全配置，不要只写变化的子键。
:::

## 工厂形式

配置文件也可以导出工厂函数 `(app) => object`，适合需要读 `app` 信息的场景。
工厂**必须返回普通对象**，否则启动直接失败：

```js
// config/config.prod.js
module.exports = (app) => ({
  port: process.env.PORT,
  env: app.env.get(),
});
```

## 读取配置

- 服务端在**请求阶段**读 `app.config`（controller / service 基类的 `this.config`
  getter 是安全的）
- 不要在 loader 工厂执行期或构造期读 `app.config`——`configLoader` 在 controller /
  service 之后才执行，那时它还不存在
- 前端页面可从 `window.__LUMFALL__.options` 拿到 `serviceStart` 的入参
  （注意是 options，不是 config；需要下发的值请通过接口返回）

## JSON Schema 强校验

需要强约束配置时，在 `serviceStart` 传入 `configSchema`（JSON Schema，Ajv 校验）。
合并后的配置不匹配会**启动失败**，错误信息指明环境、字段路径和原因：

```js
// server.js
const app = serviceStart({
  name: "my-app",
  homePath: "/view/home",
  configSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      "security": {
        type: "object",
        properties: {
          apiSignature: {
            type: "object",
            properties: {
              enabled: { type: "boolean" },
              secret: { type: "string" },
            },
            required: ["enabled"],
          },
        },
      },
    },
    required: ["name"],
  },
});
```

校验失败示例：

```text
Error: [config] merged configuration for "prod" is invalid: /security/apiSignature
  should have required property 'enabled'
```

## 生产环境建议

- 密钥、连接串走环境变量（`process.env.XXX`）或配置中心，不要提交进仓库
- 开启 `configSchema`，把「配置写错」从运行时问题提前到启动失败
- 敏感配置不要通过接口原样下发给前端
