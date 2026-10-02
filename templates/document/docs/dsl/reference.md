# 完整模板与注意事项

## 全量配置模板

包含所有菜单类型的项目级模板，可直接复制修改：

```js
module.exports = {
  name: "示例项目",
  desc: "展示所有菜单类型的示例",
  homePage: "/schema?projectKey=demo&key=product",

  menu: [
    // ─── 1. custom 模块（自定义路由页面）───
    {
      key: "home",
      name: "首页",
      menuType: "module",
      moduleType: "custom",
      customConfig: { path: "/todo" },
    },

    // ─── 2. iframe 模块（嵌入外部页面）───
    {
      key: "external",
      name: "外部链接",
      menuType: "module",
      moduleType: "iframe",
      iframeConfig: { path: "https://example.com" },
    },

    // ─── 3. sider 模块（侧边栏复合视图）───
    {
      key: "management",
      name: "管理",
      menuType: "module",
      moduleType: "sider",
      siderConfig: {
        menu: [
          { key: "settings", name: "设置", menuType: "module", moduleType: "custom",
            customConfig: { path: "/todo" } },
          { key: "stats", name: "统计", menuType: "module", moduleType: "iframe",
            iframeConfig: { path: "https://stats.example.com" } },
        ],
      },
    },

    // ─── 4. schema 模块（搜索栏 + 表格 + 动态表单）───
    {
      key: "product",
      name: "商品管理",
      menuType: "module",
      moduleType: "schema",
      schemaConfig: {
        api: "/api/project/product",
        schema: {
          type: "object",
          properties: {
            productId: {
              type: "string",
              label: "商品ID",
              tableOption: { width: 300, ellipsis: true, tooltip: true },
              editFormOption: { componentType: "input", disabled: true },
            },
            productName: {
              type: "string",
              label: "商品名称",
              minLength: 3,
              maxLength: 10,
              tableOption: { width: 200 },
              searchOption: { componentType: "input", default: "",
                placeholder: "请输入商品名称", allowClear: true },
              createFormOption: { componentType: "input" },
              editFormOption: { componentType: "input" },
              detailPanelOption: {},
            },
            status: {
              type: "string",
              label: "上架状态",
              tableOption: { width: 200, enumList: [
                { label: "上架", value: "1" },
                { label: "下架", value: "0" },
              ] },
              searchOption: { componentType: "select", default: "", enumList: [
                { label: "上架", value: "1" },
                { label: "下架", value: "0" },
              ] },
              detailPanelOption: {},
            },
            createTime: {
              type: "string",
              label: "创建时间",
              tableOption: { width: 180 },
              searchOption: { componentType: "dateRange", default: [],
                showTime: true, valueFormat: "YYYY-MM-DD HH:mm:ss" },
              detailPanelOption: {},
            },
          },
          required: ["productName"],
        },
        tableConfig: {
          headerButtons: [
            { label: "新增商品", eventKey: "showComponent", type: "outline",
              eventOption: { comName: "createForm" } },
          ],
          rowButtons: [
            { label: "查看", eventKey: "showComponent", type: "primary",
              eventOption: { comName: "detailPanel" } },
            { label: "修改", eventKey: "showComponent", type: "warning",
              eventOption: { comName: "editForm" } },
            { label: "删除", eventKey: "delete", type: "danger",
              eventOption: { params: { productId: "schema::productId" } } },
          ],
          componentConfig: {
            createForm: { title: "新增商品", saveBtnText: "新增商品" },
            editForm: { mainKey: "productId", title: "修改商品", saveBtnText: "修改商品" },
            detailPanel: { mainKey: "productId", title: "商品详情" },
          },
        },
      },
    },

    // ─── 5. group 分组（下拉子菜单）───
    {
      key: "system",
      name: "系统管理",
      menuType: "group",
      subMenu: [
        { key: "users", name: "用户管理", menuType: "module", moduleType: "custom",
          customConfig: { path: "/todo" } },
        { key: "roles", name: "角色管理", menuType: "module", moduleType: "custom",
          customConfig: { path: "/todo" } },
      ],
    },

    // ─── 6. 仅覆盖（从 Model 继承其余属性，只改 name）───
    { key: "report", name: "报表(自定义名称)" },
  ],
};
```

## 注意事项（避坑清单）

| # | 注意点 | 说明 |
| --- | --- | --- |
| 1 | **`key` 必填且同级唯一** | 菜单项合并、前端查找全部依赖 `key`，缺失会导致合并不生效、菜单点击无响应 |
| 2 | **`homePage` 格式** | 写页面内路由 `/path?projectKey=xxx&key=xxx`（不带 `/view/dashboard` 前缀），`projectKey` 必须与文件名一致 |
| 3 | **覆盖只需写 `key` + 差异字段** | `{ key: "product", name: "商品管理(pdd)" }` 即可覆盖名称，其余从 Model 继承 |
| 4 | **不要手写 `key` / `modelKey`** | 扫描器自动注入，手动写无意义 |
| 5 | **sider 子菜单支持任意 moduleType** | 也支持嵌套 group（层级不宜过深） |
| 6 | **group 的 `subMenu` 子项必须写 `menuType: "module"`** | 否则前端无法正确渲染子菜单项 |
| 7 | **iframe 的 `path` 可以是完整 URL 或页面内路径** | 原样作为 `<iframe src>`；未配置时显示空态 |
| 8 | **新增 Model / Project 无需改代码** | 按目录约定放文件，重启即自动加载 |
| 9 | **注意 `menuType` 拼写** | 拼写错误会导致菜单项无法识别为 module / group |
| 10 | **sider 子菜单项的 `key` 同级唯一** | 路由 query 参数是 `siderKey`，但 key 匹配逻辑不变 |
| 11 | **覆盖形态时带全对应 config** | 改 `moduleType` 为 `iframe` / `schema` 时必须同时提供 `iframeConfig` / `schemaConfig` |
| 12 | **不配 `tableOption` / `searchOption` 就不显示** | 表格列与搜索栏互相独立，由各自 Option 的存在与否决定 |
| 13 | **`api` 是基址，不是列表地址** | 前端自动请求 `GET <api>/list`，见[接口契约](./api-contract.md) |
| 14 | **router-schema 的 path 必须与路由完全一致** | 不一致时校验**静默不生效**（不报错） |
| 15 | **`dateRange` 搜索值拆为 `_start` / `_end`** | 固定 `YYYY-MM-DD HH:mm:ss`；未选值不下发；组件忽略 `default`，URL 预填对它无效 |
| 16 | **sider 子项 custom 的 `path` 必须以 `/` 开头** | 否则拼出 `/sidertaobao/...` 之类的非法路由，无法跳转 |
| 17 | **`componentConfig` 必须放在 `tableConfig` 下** | 写在 `schemaConfig` 顶层不生效 |
| 18 | **`showComponent` 用 `eventOption.comName`** | 字段名是 `comName`（不是 `componentName`） |
| 19 | **表单 `componentType` 当前仅支持 `input` / `inputNumber` / `select`** | `dynamicSelect` / `dateRange` 未在表单侧注册；`select` 未配 `default` 会回退第一个枚举值 |
| 20 | **必填校验用顶层 `schema.required` 数组** | 自动注入对应 option 的 `required`（红星 + 校验），不要在每个 option 里手写 |

## 字段速查卡

完整的字段级结构速查（含每个子字段的语义）见框架包内
`model/docs/dashboard-model.md`；本文档各页的表格已覆盖日常使用的全部字段。

## 下一步

- [Dashboard 与 Model 配置](../advanced/dashboard.md)：Dashboard 页面如何消费这份配置
- [常见错误自查](../reference/faq.md)：启动与运行问题排查
