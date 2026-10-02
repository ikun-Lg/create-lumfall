# 插件

插件用于把「要先于业务中间件 / 路由初始化」的能力组装起来：
数据库连接、缓存客户端、feature 模块等。

## 基本用法

```js
serviceStart({
  plugins: [
    {
      name: "database",
      register(app) {
        return { client: connect() }; // 返回值挂到 app.plugins.database
      },
    },
    {
      name: "article-module",
      dependencies: ["database"], // 依赖先注册
      register(app) {
        return { db: app.plugins.database.client };
      },
    },
  ],
});
```

注册时机：在全部 loader、config、extend 之后，全局中间件与路由**之前**——
所以插件的产物在中间件 / 路由里已经可用。

## 规则

| 规则 | 违反后果 |
| --- | --- |
| `name` 唯一且非空 | 启动失败 |
| `register(app)` 必须同步 | 异步 register 启动失败（异步初始化放在 `serviceStart()` 之前做） |
| 返回值必须是普通对象或 `undefined` | 返回其他类型启动失败 |
| `dependencies` 里声明的插件必须存在 | 缺依赖启动失败 |
| 依赖图不能有环 | 循环依赖启动失败 |
| 依赖先注册 | 框架按依赖拓扑排序执行 register |

与生命周期 hook 一样，register 里做不了异步。标准做法是先初始化再传入：

```js
const dbClient = await connect(); // serviceStart() 之前

serviceStart({
  plugins: [
    { name: "database", register: () => ({ client: dbClient }) },
  ],
});
```

## 使用插件产物

- 服务端：`app.plugins.<name>`
- 业务代码里同样遵守「请求阶段再取」的原则——插件注册在 controller / service
  实例化**之后**，工厂执行期读 `app.plugins` 拿到的还是 undefined

```js
// app/service/user.js
module.exports = (app) => {
  const BaseService = require("lumfall").Service.Base(app);
  return class UserService extends BaseService {
    async find(id) {
      const { client: db } = app.plugins.database; // 请求阶段取，已就绪
      return db.query("select * from user where id = ?", [id]);
    }
  };
};
```

::: tip 什么时候用插件，什么时候用 extend
- 插件：有初始化动作、可能被其他模块依赖、需要按序装配的能力（数据库、缓存）
- extend：挂一个现成的工具对象（`app.utils`、`app.http`），无依赖顺序诉求
  （见[目录结构与挂载点](../guide/structure.md)）
:::
