# 按钮与动态表单

schema 模块的增删改查交互由两部分 DSL 驱动：`tableConfig` 里的**按钮**
（表头按钮 / 行按钮）和**动态组件注册**（`componentConfig`）。
动态组件以抽屉（`a-drawer`，宽 550）呈现，覆盖新增、编辑、详情三种形态。

## 按钮配置

按钮放在 `schemaConfig.tableConfig` 下，每项透传给 `<a-button>`：

```js
tableConfig: {
  // 表头按钮：渲染在表格上方右侧，type 直接映射 a-button 的 type
  headerButtons: [
    { label: "新增商品", eventKey: "showComponent", type: "outline",
      eventOption: { comName: "createForm" } },
  ],
  // 行按钮：渲染在最右侧固定的「操作」列（text 按钮，type 映射状态色）
  rowButtons: [
    { label: "查看", eventKey: "showComponent", type: "primary",
      eventOption: { comName: "detailPanel" } },
    { label: "修改", eventKey: "showComponent", type: "warning",
      eventOption: { comName: "editForm" } },
    { label: "删除", eventKey: "delete", type: "danger",
      eventOption: { params: { productId: "schema::productId" } } },
  ],
}
```

操作列宽度自动估算（`30 + Σ(按钮字数 × 14 + 26)`），无需配置；
未配置按钮时操作列不渲染。

## eventKey：点击行为

| `eventKey` | 内置行为 | `eventOption` |
| --- | --- | --- |
| `delete` | 确认框 → `DELETE <api>`（body 为参数对象）→ 成功后刷新表格 | `params`: 目前**只取第一组键值对**，取值语法 `"schema::<fieldKey>"` 表示从行数据取值 |
| `showComponent` | 打开 `comName` 对应的动态组件抽屉 | `comName`: `createForm` / `editForm` / `detailPanel`（**字段名是 `comName`，不是 `componentName`**） |
| 其他（如 `edit`） | 无内置行为，向上 emit `operate` 事件，可自行扩展 | — |

::: warning componentConfig 必须放在 tableConfig 下
框架读取的是 `schemaConfig.tableConfig.componentConfig`，
写在 `schemaConfig` 顶层不生效。
:::

## componentConfig：动态组件注册

key 固定为三个（前端组件注册表只有这三个，未注册的 key 不渲染）：

```js
tableConfig: {
  componentConfig: {
    createForm:  { title: "新增商品", saveBtnText: "新增商品" },
    editForm:    { mainKey: "productId", title: "修改商品", saveBtnText: "修改商品" },
    detailPanel: { mainKey: "productId", title: "商品详情" },
  },
}
```

| 组件 | 形态 | 数据流 | 必配 |
| --- | --- | --- | --- |
| `createForm` | 新增表单抽屉 | 直接打开，保存 `POST <api>` | 无 |
| `editForm` | 编辑表单抽屉 | 先 `GET <api>?<mainKey>=<值>` 回显，保存 `PUT <api>`（body 带 `{ [mainKey]: 值 }`） | `mainKey` |
| `detailPanel` | 详情抽屉（只读） | 先 `GET <api>?<mainKey>=<值>` 回显 | `mainKey` |

- `title` 默认「创建」/「详情」，`saveBtnText` 默认「保存」
- `mainKey` 是行数据主键字段名——**未配置时编辑 / 详情无法工作**
- 表单字段由各字段的 `createFormOption` / `editFormOption` 决定（见下）
- 保存 / 操作成功后组件 emit `command: loadTableData`，框架自动刷新表格

## 动态表单与详情字段（xxxOption）

字段配置了对应 Option 后进入同名动态组件的 schema：

```js
productName: {
  type: "string",
  label: "商品名称",
  minLength: 3,                 // JSON-Schema 约束：表单 ajv 校验 + placeholder 提示
  maxLength: 10,
  createFormOption: {           // 新增表单项
    componentType: "input",
    default: "10086",
  },
  editFormOption: {             // 编辑表单项
    componentType: "input",
    disabled: true,             // 如主键字段编辑时禁用
    // visible: false,          // 隐藏该项（v-show，字段仍随 getValue 提交）
  },
  detailPanelOption: {},        // 详情展示：配置即以「label: value」行展示该字段
},
```

### 表单控件类型

| `componentType` | arco 组件 | 说明 |
| --- | --- | --- |
| `input` | `a-input` | `placeholder` 等直接透传 |
| `inputNumber` | `a-input-number` | 数值范围走 schema 的 `minimum` / `maximum` |
| `select` | `a-select` | `enumList`: `[{label, value}]`，保存时按枚举值 ajv 校验 |

> `dynamicSelect` / `dateRange` 尚未在表单侧注册；
> `componentType` 未注册时该项不渲染。

### 通用 option 字段

- `required`：一般**不手写**——由顶层 `schema.required` 自动注入（红星 + 校验）
- `visible: false`：隐藏表单项（`v-show`，字段仍随 `getValue()` 提交）
- `disabled` / `default` / `placeholder`：透传给 arco 组件

### 表单校验

表单内置 ajv，每个表单项在 blur / 保存时按字段级 JSON-Schema
（`type` / `minLength` / `maxLength` / `pattern` / `minimum` / `maximum` /
`enum`）校验，错误文案显示在项下方；任一项失败则整个表单不提交。

## 完整数据流

```text
点击按钮（eventKey=showComponent）
  → schema-view 按 eventOption.comName 匹配动态组件，调用组件的 show(rowData)
     ├── createForm：直接打开（不接收行数据）
     └── editForm / detailPanel：先 GET <api>?<mainKey>=<值> 回显，再打开
  → 保存成功 emit command: loadTableData → 表格刷新
```

::: tip 组件类型可以自己扩展
表单控件（`componentType`）与动态组件都支持业务侧注册自定义实现——
比如批量导入面板、自定义向导抽屉，与内置的新增/编辑/详情同一套触发机制，
见[扩展 DSL](./extend.md)。
:::

## 下一步

- [接口契约](./api-contract.md)：这些交互背后的后端接口标准
