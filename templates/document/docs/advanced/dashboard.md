# Dashboard 与 Model 配置

框架自带开箱即用的 B 端控制台页面 `/view/dashboard`。它本身**不含任何业务代码**：
页面结构、菜单、每个入口的形态，全部由业务项目 `model/` 目录下的
**Dashboard DSL** 声明，启动时自动扫描合并。

::: tip 编写配置请看 DSL 章节
本页讲 Dashboard 页面如何**消费** DSL；如何**编写** DSL（Model / Project /
菜单 / schema 模块 / 接口契约）见 [DSL 章节](../dsl/overview.md)。
:::

## 前端消费链路

```
1. 浏览器访问 /view/dashboard/schema?projectKey=pdd&key=product
   （history 模式，服务端由 /view/:page/* 兜底渲染）
2. dashboard.vue 挂载：
   ├── GET /api/project/list?projectKey=pdd  → 项目列表（头部项目切换）
   └── GET /api/project?projectKey=pdd       → 合并后的完整项目配置（含 menu）
3. menuStore.setMenuList(menu)               → 菜单存入 Pinia
4. header-view 渲染菜单                      → 含 subMenu 的项渲染为下拉子菜单
5. 点击菜单项 → 按 moduleType 决定路由跳转
   ├── custom → dashboard 基址 + customConfig.path
   ├── sider  → /sider（左侧子菜单，子项跳转带 siderKey）
   ├── iframe → /iframe
   └── schema → /schema → schema-view
6. schema-view 内部：
   useSchema() 按路由 query 的 key / siderKey 从 menuStore 找到菜单项
   → buildDtoSchema 按 xxxOption 拆出表格 / 搜索 / 动态组件 schema
   → 搜索栏 + 表格渲染，URL query 同名字段预填搜索默认值
7. 动态组件（配置了 tableConfig.componentConfig 时）：
   按钮 eventKey=showComponent 打开 createForm / editForm / detailPanel 抽屉
   → 保存成功 emit loadTableData → 表格刷新
```

## Dashboard 前端路由

| 路由（基址 `/view/dashboard`） | 组件 | 说明 |
| --- | --- | --- |
| `/sider` | sider-view | 侧边复合视图，含子路由 `/sider/iframe`、`/sider/schema` 等 |
| `/iframe` | iframe-view | iframe 嵌入页 |
| `/schema` | schema-view | schema 驱动页 |
| `/sider/:chapters+` | sider-view | sider 多级路径兜底 |

## 内置数据接口

| 接口 | 免 project_key | 说明 |
| --- | --- | --- |
| `GET /api/project/model_list` | ✓ | 全部 Model 及其 Project 概要（DTO） |
| `GET /api/project/list?projectKey=` | ✓ | 项目列表（可按 key 过滤） |
| `GET /api/project?projectKey=` | ✗（需 `project_key` 头） | 合并后的完整项目配置（含 menu） |

Dashboard 页面启动时用 `$lumfallCurl` 拉取这些接口渲染菜单；URL 带
`?projectKey=xxx` 时 curl 自动带 `project_key` 头（见[请求工具](../frontend/curl.md)）。

## 项目切换

头部右上角的下拉会列出**同 Model 下的其他 Project**（来自
`/api/project/list`），切换后以新项目的 `homePage` 作为落点——这就是
Model + Project 两层 DSL 在体验上的意义：一套公共菜单骨架，多个项目按需覆盖。

## 下一步

- [DSL 总览](../dsl/overview.md)：从零声明一个管理台
- [接口契约](../dsl/api-contract.md)：schema 模块的后端接口标准
- [安全策略](./security.md)：`/api/project/*` 的 project_key 校验
