# Model 与 Project

DSL 的两层结构：**Model 定义公共默认**，**Project 定义差异化**，两者深度合并后
就是前端拿到的最终项目配置。

## Model 配置（`model/<modelKey>/model.js`）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `model` | `string` | 是 | 模式类型标识，固定 `"dashboard"`（注意字段名是 `model`，不是 `mode`） |
| `name` | `string` | 是 | Model 显示名称 |
| `menu` | `array` | 是 | 默认菜单数组，该 Model 下所有 Project 共享的菜单骨架 |

> `key` 由扫描器按**目录名**自动注入，不要手写。
> `desc` / `icon` / `homePage` 是 Project 顶层字段，不属于 Model。

## Project 配置（`model/<modelKey>/project/<projectKey>.js`）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | 是 | 项目显示名称 |
| `desc` | `string` | 是 | 项目描述 |
| `homePage` | `string` | 是 | 默认首页，**页面内路由**（如 `/schema?projectKey=pdd&key=product`，不带 `/view/dashboard` 前缀） |
| `menu` | `array` | 是 | 项目菜单，与 Model 的 `menu` 深度合并 |
| `icon` | `string` | 否 | 预留字段 |

> `key`（= 文件名）与 `modelKey`（= 所属目录名）由扫描器自动注入。

## 合并规则

合并逻辑在框架 `model/index.js` 的 `projectExtendModel` 中，基于
`lodash.mergeWith`，但对**数组有特殊的按 key 合并规则**：

### 普通对象：深度合并

Project 的同名属性覆盖 Model 的，Model 独有的属性保留：

```js
// Model:  { name: "商品管理", customConfig: { path: "/todo" } }
// Project:{ name: "商品管理(pdd)" }
// 结果:   { name: "商品管理(pdd)", customConfig: { path: "/todo" } }
```

### 数组：按元素 `key` 智能合并

以 `menu` 为例，合并不是拼接或整体覆盖，而是：

1. 遍历 Model 数组：每个元素去 Project 数组里找**同 `key`** 元素——
   找到则递归深度合并，找不到则原样保留
2. 遍历 Project 数组：Model 中没有的新 `key`，**追加到结果末尾**

```text
Model.menu   = [{ key: "product", name: "商品管理", moduleType: "custom", ... },
                { key: "order",   name: "订单管理", ... }]
Project.menu = [{ key: "product", name: "商品管理(pdd)" },
                { key: "data",    name: "数据管理(pdd)", moduleType: "sider", ... }]

结果          = [{ key: "product", name: "商品管理(pdd)", moduleType: "custom", ... },   ← 覆盖
                 { key: "order",   name: "订单管理", ... },                              ← 保留
                 { key: "data",    name: "数据管理(pdd)", moduleType: "sider", ... }]     ← 追加
```

### 递归生效

合并是**递归**的：`siderConfig.menu`、`subMenu` 等嵌套数组里的元素同样按 `key`
匹配合并，行为在所有层级一致。

::: warning 数组元素必须带 key
数组合并完全依赖 `key` 匹配——`menu`（以及需要被 Project 覆盖的嵌套数组）里
**每个元素都必须写 `key`**，否则合并不生效。
:::

## 三种典型覆盖姿势

```js
// model/business/project/pdd.js
module.exports = {
  name: "拼多多",
  desc: "拼多多电商项目",
  homePage: "/schema?projectKey=pdd&key=product",
  menu: [
    // 1. 只覆盖属性：只写 key + 差异字段，其余从 Model 继承
    { key: "product", name: "商品管理(pdd)" },

    // 2. 覆盖并改变形态：从 custom 换成 schema 模块（要带全对应 config）
    {
      key: "client",
      name: "客户管理(pdd)",
      moduleType: "schema",
      schemaConfig: { api: "/api/client", schema: {} },
    },

    // 3. 新增菜单项：Model 中不存在，追加到末尾
    {
      key: "data",
      name: "数据管理(pdd)",
      menuType: "module",
      moduleType: "sider",
      siderConfig: { menu: [/* ... */] },
    },
  ],
};
```

::: warning 覆盖形态时要带全 config
把某个菜单项的 `moduleType` 从 `custom` 改成 `iframe` 时，必须同时提供
`iframeConfig`；改成 `schema` 时必须提供 `schemaConfig`，否则前端跳转失败。
:::

## 新增一套 DSL 的完整步骤

1. 在 `model/` 下创建目录（目录名 = Model key），编写 `model.js`
2. 在其 `project/` 子目录下创建文件（文件名 = Project key），编写 Project 配置
3. 重启服务——扫描器自动发现，无需注册任何代码

验证：`GET /api/project/list` 能看到新项目，
`GET /api/project?projectKey=<key>` 返回合并后的完整配置
（接口详情见 [Dashboard 数据接口](../advanced/dashboard.md)）。

## 下一步

- [菜单项 DSL](./menu.md)：菜单项的字段与四种模块形态
