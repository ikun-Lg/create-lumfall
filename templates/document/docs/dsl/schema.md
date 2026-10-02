# schema 模块 DSL

schema 模块（`moduleType: "schema"`）是 DSL 的主要形态：**一份字段 schema
同时驱动搜索栏、表格列、新增/编辑表单、详情面板**。每个字段在哪个视图出现、
以什么控件出现，由该字段是否配置对应的 `xxxOption` 决定。

## schemaConfig 总览

```js
{
  key: "product",
  name: "商品管理",
  menuType: "module",
  moduleType: "schema",
  schemaConfig: {
    api: "/api/project/product",  // 接口基址（不是完整列表地址，见「接口契约」）
    schema: { /* 字段 schema，本页重点 */ },
    tableConfig: { /* 按钮与动态组件，见「按钮与动态表单」 */ },
    searchConfig: {},             // 预留字段，前端暂未消费
  },
}
```

::: warning 不要手写 components 字段
动态组件（表单/详情）的 schema 由框架根据 `tableConfig.componentConfig`
自动派生，`schemaConfig` 顶层不要手写 `components` 字段。
:::

## 字段定义：一份 schema，四个视图

```js
schema: {
  type: "object",
  properties: {
    productName: {
      type: "string",          // JSON-Schema 类型（表单项按此做 ajv 校验）
      label: "商品名称",        // 表格列标题 / 表单 label / 详情行 label
      minLength: 3,            // 可选 JSON-Schema 约束：表单侧校验 + 提示
      maxLength: 10,

      tableOption:      { width: 200 },                    // 配了才进表格列
      searchOption:     { componentType: "input" },        // 配了才进搜索栏
      createFormOption: { componentType: "input" },        // 配了才进新增表单
      editFormOption:   { componentType: "input" },        // 配了才进编辑表单
      detailPanelOption: {},                               // 配了才进详情面板
    },
  },
  required: ["productName"],
}
```

**关键规则**（由前端 `buildDtoSchema` 按 `${comName}Option` 统一拆分实现）：

- `tableOption` / `searchOption` / `createFormOption` / `editFormOption` /
  `detailPanelOption` 走**同一套机制**，只是消费方不同
- 配了哪个 Option 字段就进哪个视图，视图之间互相独立——同一字段可以只配其一
- 合并后字段会挂到 `option` 属性上传给对应组件；`type` / `label` /
  约束字段等非 `xxxOption` 键原样保留
- **必填自动注入**：字段名出现在顶层 `required` 数组中，其表单 `option`
  自动获得 `required: true`（红星 + 校验），**不要在各 option 里手写**

## tableOption：表格列

透传给 arco `<a-table-column>`（`v-bind`），`width` / `ellipsis` / `tooltip` /
`align` / `fixed` 等标准配置均可直接使用。另有三个扩展字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `enumList` | `array` | 枚举标签：`[{label, value}]`，命中枚举值的单元格渲染为彩色标签（颜色按索引循环） |
| `toFixed` | `number` | 数字保留 N 位小数 |
| `visible` | `boolean` | `false` 时该列不渲染（字段仍参与搜索 / 数据） |

> 所有列默认带 `ellipsis: true, tooltip: true` 防止长文本撑破列宽，
> `tableOption` 里的同名配置可覆盖默认值。

## searchOption：搜索项

控件类型由 `componentType` 选择（注册于框架 `schema-search-bar` 的
search-item-config），其余配置透传给对应 arco 组件：

| `componentType` | arco 组件 | 额外字段 | 搜索值下发形状 |
| --- | --- | --- | --- |
| `input` | `a-input` | 无（`placeholder`、`allowClear` 直接透传） | 标量 |
| `select` | `a-select` | `enumList`: `[{label, value}]` | 标量 |
| `dynamicSelect` | `a-select` | `api`: 选项接口，挂载后自动请求，响应 `data` 须为 `[{label, value}]` | 标量 |
| `dateRange` | `a-range-picker` | `valueFormat`（建议配合 `showTime: true`） | 拆为 `<fieldKey>_start` / `<fieldKey>_end` 两个参数 |

### default 与空值语义

- `default` 是初始 / 重置值：`input` / `select` / `dynamicSelect` 用标量，
  建议 `""` 表示不选
- `select` / `dynamicSelect` **未配置 `default` 时会回退选中第一个枚举值**，
  建议始终显式写 `default: ""`
- `dateRange` 的重置值恒为 `[]`（组件忽略 `default`，URL 预填对它也无效）
- **空字符串会原样下发**：`getValue()` 只在值为 `undefined` 时省略字段，
  `""`（含 `default: ""`）会进入请求——**后端需把 `""` 视为「不过滤」**
- `dateRange` 选中后固定拆成 `<field>_start` / `<field>_end` 两个参数，
  值为 `YYYY-MM-DD HH:mm:ss` 字符串；未选值时两个参数都不下发

## URL 预填搜索值

路由 query 中存在与字段同名的参数时（如 `?productName=手机`），会覆盖该
搜索项的 `option.default`——实现「从别处带着搜索条件跳转过来」。
仅对标量控件（`input` / `select` / `dynamicSelect`）生效。

## 搜索数据流

```text
schema-search-bar（收集各搜索项 getValue）
  → search-panel（@load / @search / @reset 统一转为 search 事件）
  → schema-view（apiParams = 搜索值，下发表格）
  → schema-table（watch apiParams → 重置分页 → GET <api>/list）
```

- 首次挂载：全部搜索项就绪后**自动触发一次带默认值的查询**（含 URL 预填值）
- 点「查询」：立即按当前值触发；点「重置」：恢复 `default` 后重新拉全量

## 下一步

- [按钮与动态表单](./schema-actions.md)：增删改查按钮与表单/详情抽屉
- [接口契约](./api-contract.md)：后端需要实现的接口标准
