# 扩展 DSL

DSL 不是封闭的。schema 模块的**搜索控件、表单控件、动态组件**以及
Dashboard 的 **custom 路由**都留了业务侧扩展点：在业务项目的 `app/pages/`
下创建与框架同名的配置文件，框架构建时通过 webpack 别名自动识别并
**与默认实现合并**（同名覆盖、新名追加）。

## 四个扩展点

| 业务文件（`<app-root>/app/pages/` 下） | webpack 别名 | 作用 |
| --- | --- | --- |
| `widgets/schema-search-bar/complex-view/search-item-config.js` | `$businessSearchItemConfig` | 注册 / 覆盖搜索控件 `componentType` |
| `widgets/schema-form/form-item-config.js` | `$businessFormItemConfig` | 注册 / 覆盖表单控件 `componentType` |
| `dashboard/complex-view/schema-view/components/component-config.js` | `$businessComponentConfig` | 注册 / 覆盖 schema-view 动态组件 |
| `dashboard/router.js` | `$businessDashboardRouterConfig` | 注册 `custom` 模块的前端路由 |

合并规则（三个组件注册表）：

```js
// 框架内部实现：默认注册表与业务注册表展开合并，业务同名 key 覆盖默认
export default {
  ...DefaultConfig,
  ...BusinessConfig,
};
```

::: tip 不建文件也完全不影响
这四个文件都是**可选**的：业务项目没创建时，别名指向框架的空模块，
DSL 按内置能力工作。只有需要扩展时才创建对应文件。
:::

## 扩展搜索控件

搜索项控件注册进 `search-item-config.js`，DSL 里通过
`searchOption.componentType` 使用。

**1. 写控件组件**——契约：props 收 `schemaKey` / `schema`，
expose `getValue()` 与 `reset()`，动态拉取选项的控件在就绪后 emit `load`：

```vue
<!-- app/pages/widgets/schema-search-bar/complex-view/rate/rate.vue -->
<template>
  <a-rate v-model="dtoValue" v-bind="schema.option" allow-half />
</template>

<script setup>
import { ref } from "vue";

const { schemaKey, schema } = defineProps({
  schemaKey: String,
  schema: Object,
});

const emit = defineEmits(["load"]);
const dtoValue = ref(0);

// getValue 返回 { [字段名]: 值 }；值为 undefined 时返回 {}（不下发该参数）
const getValue = () =>
  dtoValue.value !== undefined ? { [schemaKey]: dtoValue.value } : {};

// reset 恢复为 DSL 里配置的 option.default
const reset = () => {
  dtoValue.value = schema?.option?.default ?? 0;
};

defineExpose({ getValue, reset });
</script>
```

**2. 注册**（新建配置文件，导出「componentType → { component }」映射）：

```js
// app/pages/widgets/schema-search-bar/complex-view/search-item-config.js
import rate from "./rate/rate.vue";

export default {
  rate: { component: rate },
};
```

**3. 在 DSL 里使用**：

```js
score: {
  type: "number",
  label: "评分",
  searchOption: { componentType: "rate", default: 0 },
},
```

内置的四种控件（`input` / `select` / `dynamicSelect` / `dateRange`）无需注册；
业务注册**同名** `componentType`（如 `input`）会覆盖内置控件——覆盖会影响
所有使用 SchemaSearchBar 的地方，谨慎操作。

## 扩展表单控件

表单控件注册进 `form-item-config.js`，供 `createFormOption` /
`editFormOption` 的 `componentType` 使用。契约比搜索控件多一项校验：

- props：`schemaKey` / `schema` / `model`（回显值）
- 可 `inject("ajv")` 拿到校验器（schema-form 已 provide）
- expose：`validate()`（返回布尔，失败时自行展示错误提示）、
  `getValue()`（返回 `{ [schemaKey]: value }`）、`name`

```vue
<!-- app/pages/widgets/schema-form/complex-view/textarea/textarea.vue -->
<template>
  <a-row class="form-item" align="center" justify="space-between">
    <a-row class="item-label" v-if="schema.label" justify="end">
      <span v-if="schema.option?.required" class="required">*</span>
      {{ schema.label }}
    </a-row>
    <a-row class="item-value" justify="start">
      <a-textarea
        v-model="dtoValue"
        v-bind="schema.option"
        :max-length="schema.maxLength"
        :placeholder="`请输入${schema.label}`"
      />
    </a-row>
  </a-row>
</template>

<script setup>
import { ref, toRefs, watch, inject } from "vue";

const ajv = inject("ajv");

const props = defineProps({
  schemaKey: String,
  schema: Object,
  model: String,
});
const { schemaKey } = props;
const { schema, model } = toRefs(props);

const dtoValue = ref("");

watch([model, schema], () => {
  dtoValue.value = model.value ?? schema.value.option?.default;
}, { immediate: true, deep: true });

const validate = () => {
  // 必填 + 字段级 JSON-Schema 校验（与内置控件同一套 ajv 约定）
  if (schema.value.option?.required && !dtoValue.value) return false;
  if (dtoValue.value) {
    return ajv.compile(schema.value)(dtoValue.value);
  }
  return true;
};

const getValue = () =>
  dtoValue.value !== undefined ? { [schemaKey]: dtoValue.value } : {};

defineExpose({ validate, getValue });
</script>
```

```js
// app/pages/widgets/schema-form/form-item-config.js
import textarea from "./complex-view/textarea/textarea.vue";

export default {
  textarea: { component: textarea },
};
```

```js
// DSL：createFormOption.componentType: "textarea"
remark: {
  type: "string",
  label: "备注",
  maxLength: 200,
  createFormOption: { componentType: "textarea" },
},
```

## 扩展 schema-view 动态组件

最强大的扩展点：给 schema 模块加**自定义抽屉 / 面板**（批量导入、
审计日志、自定义向导……），与内置的新增 / 编辑 / 详情同一套触发与刷新机制。

一个自定义动态组件要同时做两件事：

1. **代码侧注册**（component-config.js）
2. **DSL 侧声明**（`tableConfig.componentConfig` 写同名 key）——两者缺一不可，
   schema-view 只渲染 DSL 里声明了的组件

组件契约：

| 成员 | 说明 |
| --- | --- |
| `inject("schemaViewData")` | 拿到 `api`、`components`（其中自己 comName 对应 `{ schema, config }`） |
| expose `name` | 必须等于 componentConfig 的 key，schema-view 按它找组件 ref |
| expose `show(rowData)` | 按钮触发时被调用；行按钮传行数据，**表头按钮不传** |
| emit `command` | `{ event: "loadTableData" }` 让框架刷新表格 |

```vue
<!-- app/pages/dashboard/complex-view/schema-view/components/batch-import.vue -->
<template>
  <a-drawer v-model:visible="isShow" :title="config.title || '批量导入'" :width="550">
    <!-- 自己的表单 / 上传逻辑；schema 来自 components.value.batchImport.schema -->
    <a-button type="primary" @click="save">导入</a-button>
  </a-drawer>
</template>

<script setup>
import { ref, inject, defineEmits } from "vue";

const { api, components } = inject("schemaViewData") || {};
const emit = defineEmits(["command"]);

const isShow = ref(false);
const config = ref({});
const name = ref("batchImport"); // 与 componentConfig 的 key 一致

const show = (rowData) => {
  // 表头按钮触发时 rowData 为 undefined
  config.value = components.value?.batchImport?.config || {};
  isShow.value = true;
};

const save = async () => {
  // ...调用接口
  isShow.value = false;
  emit("command", { event: "loadTableData" }); // 保存成功后刷新表格
};

defineExpose({ name, show });
</script>
```

```js
// app/pages/dashboard/complex-view/schema-view/components/component-config.js
import batchImport from "./batch-import.vue";

export default {
  batchImport: { component: batchImport },
};
```

```js
// DSL：componentConfig 声明 + 按钮触发
tableConfig: {
  headerButtons: [
    { label: "批量导入", eventKey: "showComponent", type: "outline",
      eventOption: { comName: "batchImport" } },
  ],
  componentConfig: {
    batchImport: { title: "批量导入" },
    // 与内置的 createForm / editForm / detailPanel 共存
  },
}
```

::: tip 自定义组件的字段 schema 自动派生
`buildDtoSchema` 对 componentConfig 里的**任意** key 生效：DSL 字段里配置
`batchImportOption: { ... }` 的字段会自动进入该组件的 schema
（`components.value.batchImport.schema`），与内置表单同一套机制。
:::

## 注册 custom 模块路由

`custom` 模块的 `customConfig.path` 指向的前端路由由业务注册。
框架启动 Dashboard 时会调用业务的路由配置：

```js
// app/pages/dashboard/router.js
module.exports = ({ routes, siderRoutes }) => {
  // 顶层路由：customConfig.path: "/article-manage" 对应这里
  routes.push({
    path: "/view/dashboard/article-manage",
    component: () => import("./article-manage/article-manage.vue"),
  });

  // sider 子路由：相对路径，最终挂到 /sider/<path>
  siderRoutes.push({
    path: "article-sider",
    component: () => import("./article-manage/article-manage.vue"),
  });
};
```

- `routes` 是顶层路由数组（框架的 `/iframe`、`/schema`、`/sider` 已在里面），
  path 写完整 `/view/dashboard/...`
- `siderRoutes` 是 sider 的 children，path 写**相对路径**（不带前导 `/`），
  最终路由为 `/view/dashboard/sider/<path>`
- 业务路由注册发生在 sider 通配路由之前，同名时业务优先

::: warning 与 menu DSL 的对应关系
`custom` 模块的 `customConfig.path: "/article-manage"` 必须能在 `routes`
里匹配到；sider 子菜单的 custom 项 `path` 必须以 `/` 开头且对应
`siderRoutes` 注册的子路由（或框架已注册的 `/sider/iframe`、`/sider/schema`），
否则点击后内容区为空。
:::

## 事件与行为的边界

- 按钮内置行为只有两种：`showComponent`（打开动态组件）与 `delete`
  （确认框 + `DELETE <api>` + 刷新）
- 其他 `eventKey`（如 `edit`）会向上 emit `operate` 事件，但 schema-view
  内置的处理器当前只响应 `showComponent`——**扩展新的按钮行为时，
  优先用 `showComponent` + 自定义动态组件**，而不是自定义 eventKey
- 需要完全自定义列表页交互（超出抽屉形态）时，直接用 `custom` 模块 +
  自定义页面，页面里仍可独立使用 SchemaTable / SchemaSearchBar /
  SchemaForm（见[内置组件](../frontend/widgets.md)）

## 下一步

- [内置组件](../frontend/widgets.md)：脱离 DSL 独立使用这些组件
- [完整模板与注意事项](./reference.md)：DSL 全量避坑清单
