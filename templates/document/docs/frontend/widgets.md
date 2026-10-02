# 内置组件

框架内置了一组布局与 schema 驱动的组件（Arco Design Vue 风格），
业务页面直接通过别名引用，用于快速搭建列表页 / 表单页 / 管理台。

::: tip schema 三件套与 DSL 的关系
本页讲的是**独立使用**这些组件的 props / 事件；在 Dashboard 里由
[DSL 配置](../dsl/overview.md)驱动它们时，schema 的 `xxxOption`
如何拆分、按钮与动态表单如何声明，见
[schema 模块 DSL](../dsl/schema.md) 与[按钮与动态表单](../dsl/schema-actions.md)。
:::

## 布局组件

### HeaderContainer

```vue
<template>
  <HeaderContainer title="商品管理">
    <template #menu-content>
      <!-- 顶部导航区（如 a-menu） -->
    </template>
    <template #setting-content>
      <!-- 右上设置区 -->
    </template>
    <template #main-content>
      <!-- 主体内容 -->
    </template>
  </HeaderContainer>
</template>

<script setup>
import HeaderContainer from "$lumfallHeaderContainer";
</script>
```

- props：`title`（标题，默认配 logo）
- slots：`menu-content`（顶栏中部）、`setting-content`（顶栏右侧，自带用户下拉）、
  `main-content`（主体）

### SiderContainer

```vue
<template>
  <SiderContainer>
    <template #menu-content>
      <!-- 左侧菜单（如 a-menu mode="vertical"） -->
    </template>
    <template #main-content>
      <!-- 主体内容 -->
    </template>
  </SiderContainer>
</template>

<script setup>
import SiderContainer from "$lumfallSiderContainer";
</script>
```

## Schema 三件套

一套用 JSON Schema 描述「表格 / 搜索栏 / 表单」的组件，schema 里每个字段的
`option` 控制对应控件的渲染。Dashboard 的 schema 菜单模块就用它们驱动页面
（见 [Dashboard 与 Model 配置](../advanced/dashboard.md)）。

### SchemaTable

```vue
<template>
  <SchemaTable
    :schema="tableSchema"
    api="/api/project/product/list"
    :buttons="buttons"
    @operate="handleOperate"
  />
</template>

<script setup>
import SchemaTable from "$lumfallSchemaTable";
</script>
```

- props：
  - `schema`：字段 schema；`option.visible` 控制列显示，
    `option.enumList`（`[{ label, value }]`）把枚举值渲染成彩色标签，
    其余 `option` 透传给 `a-table-column`
  - `api`：列表接口**基址**——组件实际请求 `GET <api>/list`，
    分页参数 `page` / `pageSize`，期望 `{ data, metadata: { total } }` 响应结构
  - `apiParams`：额外查询参数
  - `buttons`：操作列按钮 `[{ label, eventKey, eventOption, ...aButtonConfig }]`
- emits：`operate`（点操作按钮，携带 `{ btnConfig, rowData }`）
- 自带分页器（10/20/50/100/200 每页），默认省略号 + tooltip 防长文本撑破列宽

### SchemaSearchBar

```vue
<template>
  <SchemaSearchBar :schema="searchSchema" @search="onSearch" @load="onLoad" />
</template>

<script setup>
import SchemaSearchBar from "$lumfallSchemaSearchBar";
</script>
```

- props：`schema`（每个字段的 `option.componentType` 支持
  `input` / `select` / `dynamicSelect` / `dateRange`，`option.default` 为默认值）
- emits：`search`（点查询，携带表单值）、`reset`（点重置）、
  `load`（动态控件就绪后触发一次，携带默认值）
- 字段值由各控件 `getValue()` 合并产出

### SchemaForm

```vue
<template>
  <SchemaForm ref="formRef" :schema="formSchema" :model="formData" />
  <a-button type="primary" @click="submit">提交</a-button>
</template>

<script setup>
import SchemaForm from "$lumfallSchemaForm";

const formRef = ref(null);

const submit = async () => {
  if (!formRef.value.validate()) return;
  const value = formRef.value.getValue();
  // ...提交
};
</script>
```

- props：`schema`（字段 `option.componentType` 支持 `input` / `inputNumber` /
  `select`；`option.required` 必填校验；`option.visible` / `option.disabled` /
  `option.default` / `option.enumList`）、`model`（受控数据）
- expose：`validate()`（全部表单项校验，返回布尔）、`getValue()`
  （合并全部字段值）

### 扩展控件

schema 组件的控件类型通过配置文件注册，业务可扩展自己的控件类型：
`app/pages/widgets/schema-form/form-item-config.js`、
`app/pages/widgets/schema-search-bar/complex-view/search-item-config.js`、
`app/pages/dashboard/complex-view/schema-view/components/component-config.js`
（分别对应别名 `$businessFormItemConfig` / `$businessSearchItemConfig` /
`$businessComponentConfig`，见[前端构建](./build.md)）。

## 下一步

- [DSL 总览](../dsl/overview.md)：用配置驱动这些组件生成整站管理台
- [请求工具 curl](./curl.md)：组件内部如何发请求
