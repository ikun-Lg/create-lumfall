# 接口契约

schema 模块对 `schemaConfig.api` 有**固定的调用方式**：`api` 是接口**基址**
（不是完整列表地址），前端自动拼接出六个标准接口。后端按需实现即可。

## 六个标准接口

| 调用 | 方法 | 地址与入参 | 响应 | 调用方 |
| --- | --- | --- | --- | --- |
| 查询列表 | `GET` | `<api>/list`，query: 搜索字段 + `page` + `pageSize`（默认 50） | `{ success, data: [...], metadata: { total } }`，`total` 必须存在 | 表格 |
| 单条查询 | `GET` | `<api>`，query: `{ [mainKey]: 值 }` | `{ success, data: {...} }` | 编辑/详情回显 |
| 新增 | `POST` | `<api>`，body: 新增表单值 | `{ success }` | 新增表单 |
| 更新 | `PUT` | `<api>`，body: `{ [mainKey]: 值, ...编辑表单值 }` | `{ success }` | 编辑表单 |
| 删除 | `DELETE` | `<api>`，body: `{ <参数名>: <值> }` | `{ success }` | 删除按钮 |
| 枚举选项 | `GET` | 搜索项 `dynamicSelect` 配置的 `api` 原样请求 | `{ success, data: [{label, value}] }` | 动态下拉 |

::: warning api 是基址
列表接口由前端自动拼接 `/list` 后缀（`GET <api>/list`），删除走
`DELETE <api>`。写后端路由时按基址注册，不要在 `schemaConfig.api` 里
写上 `/list`。
:::

搜索字段值原样并入 query：`dateRange` 拆为 `<field>_start` / `<field>_end`
（见 [schema 模块](./schema.md)）；**空字符串参数表示「不过滤」**，
后端要处理这个语义。

## 响应包络

所有接口遵循框架统一响应结构（controller 基类的 `this.success` /
`this.fail`，前端 `$lumfallCurl` 按此消费，见[请求工具](../frontend/curl.md)）：

```json
{
  "success": true,
  "data": {},
  "metadata": {}
}
```

失败时 `success: false`，附 `code` 与 `message`：

| code | 含义 | 来源 |
| --- | --- | --- |
| `442` | 参数校验失败（router-schema ajv 校验） | apiParamsVerify |
| `445` | 非法请求：签名校验失败或时间戳超时 | apiSignVerify |
| `446` | 缺少 `project_key` header | projectHandler |
| `5000` | 服务端未捕获异常 | errorHandler |
| `50000` | 业务错误（message 为具体文案） | `this.fail` 约定 |
| `504` | 请求超时（>60s） | curl |

## 后端登记步骤

以商品管理为例，四个文件对齐契约（参考实现见 `lumfall-business/` 的
`app/controller/business.js` 等四件套）：

1. **service** 实现数据逻辑（分页查询单条增删改）
2. **controller** 实现处理器，遵循 `this.success(ctx, data, { total })` /
   `this.fail(ctx, message, code)`
3. **router** 注册路由，与契约对齐：

   ```js
   router.get("/api/project/product/list", controller.getBusinessList.bind(controller));
   router.get("/api/project/product", controller.getBusiness.bind(controller));
   router.get("/api/project/productEnum/list", controller.getProductEnumList.bind(controller));
   router.post("/api/project/product", controller.createBusiness.bind(controller));
   router.put("/api/project/product", controller.updateBusiness.bind(controller));
   router.delete("/api/project/product", controller.deleteBusinessList.bind(controller));
   ```

4. **router-schema** 登记参数校验 schema——key 必须与路由 path
   **完全一致**，否则该校验**静默不生效**（无 schema 的 path 直接放行）。

::: tip 路径写错的坑
router-schema 的 path 与路由 path 不一致时**不会报错**，只是校验被跳过
（如 schema 写了 `/api/product` 而路由是 `/api/project/product`）。
排查用 `app.diagnostics.getManifest().routes` 对照。
:::

## Dashboard 数据接口

除业务接口外，框架为 Dashboard 本身提供三个内置数据接口（消费链路见
[Dashboard 与 Model 配置](../advanced/dashboard.md)）：

| 接口 | 免 project_key | 说明 |
| --- | --- | --- |
| `GET /api/project/model_list` | ✓ | 全部 Model 与 Project 概要 |
| `GET /api/project/list?projectKey=` | ✓ | 项目列表（可按 key 过滤） |
| `GET /api/project?projectKey=` | ✗（需 `project_key` 头） | 合并后的完整项目配置（含 menu） |
