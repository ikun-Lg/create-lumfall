# 前端构建

前端构建由框架内置的 Webpack 5 管线完成，业务项目一般**零配置**，
特殊需求通过 `app/webpack.config.js` 扩展。

## 构建模式

`frontendBuild(_ENV)`（见[构建与部署](../guide/deployment.md)）：

| 模式 | 说明 |
| --- | --- |
| `_ENV=local` | Webpack dev server（`127.0.0.1:9002`），HMR 热更新，模板写盘 |
| `_ENV=prod` | 产物构建到 `app/public/dist/prod/`，CSS 抽离压缩、JS Terser 压缩（去 console）、构建前清空 dist |

两种模式都会把页面模板写成 `app/public/dist/entry.<name>.tpl` 供 Koa 渲染。

## 入口自动发现

构建入口通过扫描得到（框架页面目录 + 业务 `app/pages/`），规则与页面系统一致：
`**/entry.*.js`，业务同名覆盖框架。**新增 / 删除页面不需要改任何构建配置**。

## 分包策略

生产构建把 JS 拆成三类，配合浏览器长缓存：

| chunk | 内容 | 变化频率 |
| --- | --- | --- |
| `vendor` | node_modules 第三方库 | 几乎不变 |
| `common` | 被 ≥2 个入口引用的 common / widgets 业务代码 | 较少 |
| `entry.<page>` | 页面自身代码 | 经常 |

`runtime` 单独抽出；文件名带内容 hash，内容不变则文件名不变。

## Webpack 别名

页面代码里可用的框架别名：

| 别名 | 指向 |
| --- | --- |
| `$lumfallBoot` | 页面启动器 |
| `$lumfallPage` | 框架页面目录（框架的 app/pages） |
| `$lumfallCommon` | 框架公共工具目录 |
| `$lumfallCurl` | 请求工具 `curl.js` |
| `$lumfallUtils` | 通用工具 `utils.js` |
| `$lumfallWidgets` | 框架内置组件目录 |
| `$lumfallStore` | Pinia store（`menu.js` / `project.js`） |
| `$lumfallAssert` | 框架静态资源（logo / avatar / 公共样式） |
| `$lumfallHeaderContainer` | 头部布局组件 |
| `$lumfallSchemaForm` / `$lumfallSchemaSearchBar` / `$lumfallSchemaTable` | schema 三件套 |
| `$lumfallSiderContainer` | 侧边布局组件 |

另有四个「业务覆盖点」别名，业务项目里存在对应文件时指向业务文件，
否则指向空模块（所以**业务可以不写这些文件**）。它们是 DSL 的业务侧
扩展入口——注册自定义搜索 / 表单控件、schema-view 动态组件与 custom 路由，
完整契约见[扩展 DSL](../dsl/extend.md)：

| 别名 | 业务文件 |
| --- | --- |
| `$businessDashboardRouterConfig` | `app/pages/dashboard/router.js` |
| `$businessComponentConfig` | `app/pages/dashboard/complex-view/schema-view/components/component-config.js` |
| `$businessFormItemConfig` | `app/pages/widgets/schema-form/form-item-config.js` |
| `$businessSearchItemConfig` | `app/pages/widgets/schema-search-bar/complex-view/search-item-config.js` |

## 扩展 Webpack 配置

`app/webpack.config.js` 导出配置对象，与框架配置 `webpack-merge` 的
`merge.smart` 合并。常见场景：

```js
// 给 .md 文件加原文导入（本站就是这么做的）
module.exports = {
  module: {
    rules: [{ test: /\.md$/, type: "asset/source" }],
  },
};
```

```js
// 增加 resolve 别名
const path = require("path");

module.exports = {
  resolve: {
    alias: {
      $business: path.resolve(__dirname, "pages/business"),
    },
  },
};
```

## 依赖解析：框架共享依赖直接可用

框架在 webpack.base 的 `resolve.alias` 里维护了一份**共享依赖白名单**
（alias 指向包的真实目录，`require.resolve` 以框架自身为解析上下文），
业务页面**可以直接 import 白名单里的库**，无需在业务 `package.json`
里重复安装：

- 当前白名单：`vue`、`vue-router`、`pinia`、`@arco-design/web-vue`、
  `@babel/runtime`、`axios`、`lodash`、`moment`、`md5`
- alias 指向包目录，所以子路径 import 全部可用
  （`@arco-design/web-vue/es/icon`、`@babel/runtime/helpers/*`、`lodash/cloneDeep` 等）
- 框架解析优先于业务 `node_modules`，运行时**只有一份实例**——
  业务即使声明了同名库，构建时也解析到框架那份（不会出现双 Vue）
- 需要暴露更多框架依赖时，在框架 `webpack.base.js` 的 `sharedDeps`
  数组加一行包名；框架没有的库（如文档站的 `markdown-it`）仍需业务自己安装
- 需要 lumfall ≥ 1.1.1；更早版本在 pnpm 下解析不到框架依赖，
  需在业务 `package.json` 显式声明（显式声明在任意版本下都有效）

`_` 与 `axios` 另有全局注入（ProvidePlugin），页面代码不 import 也能用。

## loader 覆盖注意

- 业务页面的 JS 默认由 babel-loader 处理（生产环境 preset-env +
  transform-runtime，worker 并行）；`.vue` 由 vue-loader 处理
- `.css` 走 style-loader（dev）/ MiniCssExtract（prod）；`.less` 额外经过
  less-loader，页面里推荐 `lang="less"`
- `merge.smart` 下相同 `test` 的规则会合并，`use` 数组会被生产配置覆盖——
  想改某个 loader 的行为时优先用「新增规则」或换文件类型，避免整条覆盖
