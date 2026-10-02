# 菜单项 DSL

菜单项是 DSL 的骨架：定义 Dashboard 的导航结构与每个入口的页面形态。
`menu[]` 中的每个元素就是一个菜单项。

## 通用字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `key` | `string` | 是 | 菜单项唯一标识，**用于路由 query 参数 `?key=xxx`**，也是 Model/Project 合并的匹配键 |
| `name` | `string` | 否 | 显示名称（Project 覆盖时可省略，继承 Model） |
| `menuType` | `string` | 是* | `"module"` 普通模块 / `"group"` 分组 |
| `moduleType` | `string` | — | `menuType: "module"` 时有效，见下表 |

**默认行为**：不写 `menuType` 时，该菜单项是**仅覆盖属性的 module**——
从 Model 继承 `menuType` / `moduleType` / 对应 config，只改 `name` 等字段。
这是 Project 覆盖 Model 的最简形式。

::: warning group 必须带 subMenu
前端通过**是否含 `subMenu`** 决定渲染为下拉子菜单（`a-sub-menu`），
所以 `menuType: "group"` 的菜单项必须同时包含 `subMenu` 数组才能正确渲染。
:::

## moduleType：四种模块形态

| 值 | 前端路由 | 必填 config | 说明 |
| --- | --- | --- | --- |
| `custom` | `customConfig.path` | `customConfig` | 自定义页，跳到业务注册的前端路由 |
| `sider` | `/view/dashboard/sider` | `siderConfig` | 侧边复合视图：左侧子菜单 + 右侧子页面 |
| `iframe` | `/view/dashboard/iframe` | `iframeConfig` | iframe 嵌入页 |
| `schema` | `/view/dashboard/schema` | `schemaConfig` | schema 驱动列表页（主要形态），见 [schema 模块 DSL](./schema.md) |

```js
// 四种形态的配置形状
{
  key: "home",      name: "首页",
  menuType: "module", moduleType: "custom",
  customConfig: { path: "/todo" },             // 页面内路由
}
{
  key: "external",  name: "外部链接",
  menuType: "module", moduleType: "iframe",
  iframeConfig: { path: "https://example.com" }, // 完整 URL 或页面内路径
}
{
  key: "management", name: "管理",
  menuType: "module", moduleType: "sider",
  siderConfig: { menu: [/* 子菜单，元素结构与 menu[] 一致 */] },
}
{
  key: "product",   name: "商品管理",
  menuType: "module", moduleType: "schema",
  schemaConfig: { api: "...", schema: { /* ... */ } },
}
```

- `iframe` 的 `path` 原样作为 `<iframe src>`：完整 URL 嵌第三方页面；
  相对路径（如 `todo`）基于当前页面 URL 解析，落到服务端页面路由。未配置时显示空态
- `siderConfig` 是**对象**（不是数组），其 `menu` 子菜单支持 custom / iframe /
  schema，也支持嵌套 group（层级不宜过深）

## 分组菜单（group + subMenu）

```js
{
  key: "system",
  name: "系统管理",
  menuType: "group",
  subMenu: [
    { key: "users", name: "用户管理", menuType: "module", moduleType: "custom", customConfig: { path: "/todo" } },
    { key: "roles", name: "角色管理", menuType: "module", moduleType: "custom", customConfig: { path: "/todo" } },
  ],
}
```

`subMenu` 中每一项的结构与顶层 `menu[]` 完全一致，支持任意嵌套；
子项必须写 `menuType: "module"`。

## 路由与 query 参数

Dashboard 是 history 路由的单页，基址 `/view/dashboard`（与框架服务端
`/view/:page/*` 路由前缀一致）。DSL 中的所有路径（`homePage`、
`customConfig.path`）都写**不带基址**的页面内路由。

| query 参数 | 说明 | 示例 |
| --- | --- | --- |
| `projectKey` | 当前项目标识（= Project 文件名） | `pdd` |
| `key` | 当前选中的头部菜单项 key | `product` |
| `siderKey` | 当前选中的 sider 子菜单项 key（仅 sider 模块） | `cpopon` |
| 任意字段名 | 与 schema 字段同名时**预填该搜索项默认值**（仅 schema 模块） | `?productName=手机` |

::: warning sider 子菜单 custom 路径必须以 / 开头
sider 子菜单点击跳转 `/sider/<子模块路由>`，custom 子项的
`customConfig.path` 会**原样拼接**到 `/sider` 后。不带前导斜杠的
`path: "taobao/cpopon"` 会拼出非法路由 `/sidertaobao/cpopon`，
点击无法跳转——必须写 `path: "/todo"` 这样以 `/` 开头的页面内路由。
:::

## 下一步

- [schema 模块 DSL](./schema.md)：主要形态的完整配置
