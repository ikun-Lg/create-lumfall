# DSL 总览

Lumfall 对 B 端管理台的核心设计是一套**声明式 DSL**：菜单结构、页面形态、
列表页的搜索栏 / 表格 / 表单 / 详情，全部由 `model/` 目录下的配置文件描述，
启动时自动扫描合并，前端 Dashboard 页面按配置渲染——**写配置，而不是写页面**。

- 完整规则源文件：框架包内 `model/docs/dsl-guide.md`（编写规则）与
  `model/docs/dashboard-model.md`（字段速查），本章节是其使用视角的展开
- 参考实现：同工作区 `lumfall-business/`（两个 Model、多个 Project 的完整示例）

## 两层 DSL：Model 与 Project

```text
Model（模型）    一个业务域的公共默认配置（菜单骨架），可被多个 Project 继承
Project（项目）  一个具体项目的差异化配置，与所属 Model 深度合并
```

- DSL 以 CommonJS 模块存放在业务项目根目录 `model/` 下，**新增文件即生效，无需注册**
- `key` / `modelKey` 由扫描器按目录名 / 文件名自动注入，不要手写
- 合并规则：同 `key` 深度合并（Project 覆盖 Model），新 `key` 追加到末尾，
  详见 [Model 与 Project](./model-project.md)

```text
model/
├── index.js                  # 扫描器 + 合并引擎（框架自带，不要动）
├── business/                 # ← Model：电商系统
│   ├── model.js              #    公共默认配置
│   └── project/
│       ├── taobao.js         #    项目：淘宝
│       └── jd.js             #    项目：京东
└── course/                   # ← Model：课程系统
    ├── model.js
    └── project/
        └── bilibili.js
```

## 四种页面形态

页面渲染方式由菜单项的 `moduleType` 决定（详见[菜单项 DSL](./menu.md)）：

| `moduleType` | 形态 | 说明 |
| --- | --- | --- |
| `schema` | 列表工作台 | **主要形态**：一份字段 schema 驱动搜索栏 + 表格 + 动态表单/详情抽屉，见 [schema 模块 DSL](./schema.md) |
| `custom` | 自定义页 | 跳转到业务自己注册的前端路由 |
| `sider` | 侧边复合视图 | 左侧二级菜单 + 右侧子页面 |
| `iframe` | 嵌入页 | 内嵌外部 URL 或内部页面 |

## 一个最小例子

```js
// model/business/model.js —— 公共默认
module.exports = {
  model: "dashboard",
  name: "电商系统",
  menu: [
    {
      key: "product",
      name: "商品管理",
      menuType: "module",
      moduleType: "schema",
      schemaConfig: {
        api: "/api/project/product",   // 接口基址，见「接口契约」
        schema: {
          type: "object",
          properties: {
            productName: {
              type: "string",
              label: "商品名称",
              tableOption: { width: 200 },                  // 进表格列
              searchOption: { componentType: "input" },     // 进搜索栏
              createFormOption: { componentType: "input" }, // 进新增表单
            },
            status: {
              type: "string",
              label: "上架状态",
              tableOption: {
                enumList: [
                  { label: "上架", value: "1" },
                  { label: "下架", value: "0" },
                ],
              },
            },
          },
          required: ["productName"],
        },
      },
    },
  ],
};
```

```js
// model/business/project/taobao.js —— 只写差异
module.exports = {
  name: "淘宝",
  desc: "淘宝电商项目",
  homePage: "/schema?projectKey=taobao&key=product",
  menu: [
    // 只覆盖名称，其余（schemaConfig 等）全部继承 Model
    { key: "product", name: "商品管理(淘宝)" },
  ],
};
```

重启服务后，`/view/dashboard?projectKey=taobao` 就是一个可用的商品管理页：
搜索、分页、枚举标签、新增/编辑/详情抽屉全部由这份配置驱动。

## 章节导航

- [Model 与 Project](./model-project.md)：字段定义与合并规则
- [菜单项 DSL](./menu.md)：menuType / moduleType / 分组 / 路由参数
- [schema 模块](./schema.md)：字段 schema、表格列、搜索项
- [按钮与动态表单](./schema-actions.md)：tableConfig、增删改查抽屉
- [接口契约](./api-contract.md)：schema 模块的后端接口标准
- [扩展 DSL](./extend.md)：业务侧自定义搜索 / 表单控件与动态组件
- [完整模板与注意事项](./reference.md)：全量配置模板 + 20 条避坑清单
