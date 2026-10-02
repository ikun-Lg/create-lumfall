# Controller 与 Service

controller 负责接收请求、组装参数、返回统一响应；service 负责业务逻辑。
两者都以「工厂函数返回 class」的形式编写，由 loader 自动实例化。

## Controller

`app/controller/<name>.js`，工厂返回 class，继承 `Controller.Base(app)`：

```js
module.exports = (app) => {
  const BaseController = require("lumfall").Controller.Base(app);

  return class ArticleController extends BaseController {
    async getList(ctx) {
      const { article: articleService } = this.services;
      const { data, total } = await articleService.list({
        page: Number(ctx.request.query.page) || 1,
        size: Number(ctx.request.query.pageSize) || 20,
      });
      await this.success(ctx, data, { total });
    }
  };
};
```

挂载结果：`app.controllers.article`（无子目录时）或
`app.controllers.admin.articleList`（`app/controller/admin/article-list.js`）。

基类提供：

| 成员 | 说明 |
| --- | --- |
| `this.app` | app 实例 |
| `this.services` | `app.services`（getter，请求阶段取，安全） |
| `this.config` | `app.config`（getter） |
| `this.success(ctx, data, metadata)` | 成功响应 |
| `this.fail(ctx, message, code)` | 失败响应 |

## 统一响应结构

成功与失败都返回 HTTP 200，前端按 body 里的 `success` / `code` 判断：

```js
// this.success(ctx, data, metadata)
{ "success": true, "data": ..., "metadata": { "total": 0 } }

// this.fail(ctx, message, code)
{ "success": false, "message": "获取失败", "code": 50000 }
```

::: warning this 绑定
路由绑定 controller 方法时必须 `.bind(controller)`，
否则方法内的 `this`（`this.services` 等）会丢失：

```js
router.get("/api/article/list", articleController.getList.bind(articleController));
```
:::

## Service

`app/service/<name>.js`，工厂返回 class，继承 `Service.Base(app)`：

```js
module.exports = (app) => {
  const BaseService = require("lumfall").Service.Base(app);

  return class ArticleService extends BaseService {
    async list({ page = 1, size = 20 }) {
      // 读配置用 this.config（getter，请求阶段安全）
      // 调其他服务用 this.app.services.xxx
      return { data: [], total: 0, page, size };
    }
  };
};
```

service 基类提供 `this.app` 与 `this.config`。跨 service 调用：
`this.app.services.orderService`。

## 加载时机约束

loader 顺序是 controller → service → config（详见
[app 对象与启动流程](./app-instance.md)），由此得到两条铁律：

1. **controller 工厂 / 构造期不要取 `app.services`**——那时 service 还没加载。
   基类的 `this.services` 是 getter，请求阶段解析，所以总是安全的
2. **不要在工厂执行期读 `app.config`**——配置还没合并。同样推迟到请求阶段

```js
// ❌ 错误：工厂执行期读配置
module.exports = (app) => {
  const maxSize = app.config.maxSize; // undefined，config 还没加载
  return class extends BaseController { /* ... */ };
};

// ✅ 正确：请求阶段读
module.exports = (app) => {
  const BaseService = require("lumfall").Service.Base(app);
  return class DemoService extends BaseService {
    getInfo() {
      return { maxSize: this.config.maxSize };
    }
  };
};
```

## 状态与单例

controller / service 实例在启动时创建、全进程共享——**单例**。
不要把请求级状态挂在 `this` 上（并发请求会互相污染）；请求级数据放 `ctx`，
跨请求状态放外部存储或通过插件初始化的客户端。
