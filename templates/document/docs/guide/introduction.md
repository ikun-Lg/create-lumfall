# 简介

**Lumfall** 是一个基于 Node.js 的全栈框架：服务端是 Koa 2，前端是 Vue 3 + Webpack 5，
通过 **目录约定** 组织代码，按目录自动加载并挂载，开箱即用。

```sh
pnpm add lumfall
```

服务端只需要一个入口文件（`serviceStart()`）；前端由 Webpack 按 `app/pages/` 下的页面入口
自动多页打包，产物交给 Koa 渲染。业务代码写在自己的项目目录里，框架以 npm 包 `lumfall`
的形式被依赖。

## 它解决什么问题

搭一个 Koa + Vue 的业务工程，通常要解决一串工程化问题：目录怎么组织、配置怎么分环境、
路由和参数校验怎么管、前端怎么多页构建、接口安全怎么兜底……Lumfall 把这些固化为约定：

- **目录自动加载**：`app/controller`、`app/service`、`app/router`、`app/middleware`、
  `app/extend` 下的文件自动扫描、按约定挂载到 `app` 对象上，新建文件即生效
- **声明式 Dashboard DSL**：Model + Project 两层配置声明整个 B 端管理台；
  一份字段 schema 驱动搜索栏 / 表格 / 表单 / 详情四个视图，写配置不改代码
  （见 [DSL 章节](../dsl/overview.md)）
- **四层配置合并**：框架配置与业务配置按 `_ENV` 环境分层浅合并，支持 JSON Schema 强校验
- **页面系统**：`app/pages/<name>/entry.<name>.js` 自动发现为页面入口，
  访问 `/view/<name>`，支持开发热更新（HMR）
- **前端构建管线**：Webpack 5 多页构建、vendor/common 分包长缓存、
  `webpack-dev-middleware` + HMR 的开发服务
- **统一 API 形态**：controller / service 基类 + 统一响应结构 + 基于 JSON Schema 的参数校验
- **安全策略**：接口签名校验、project_key 校验等内置中间件，配置即用
- **可观测性**：`/health/live`、`/health/ready` 健康检查探针、请求级 monitoring 钩子、
  启动产物诊断清单（路由 / 页面 / 探针一览）
- **插件与生命周期**：数据库、缓存等前置能力以插件注册；启动 / 退出 hook 覆盖全流程

## 适用场景

- 中小型全栈业务系统：管理后台、内容系统、内部工具
- B 端多项目（多租户）控制台：配合内置 Dashboard 与声明式 DSL，
  用配置生成整站管理页
- 需要快速起步、统一团队工程约定的全栈项目

不适合的场景：重 SSR / SEO 的 C 端站点（页面是客户端渲染的 SPA）。

## 快速了解

- 从零建一个项目，看 [快速开始](./getting-started.md)
- 想直接抄目录骨架，用同工作区的 `lumfall-basic-project/`
- 声明一个 B 端管理台，看 [DSL 总览](../dsl/overview.md)
- B 端管理台完整参考（登录、Dashboard、schema 表格表单）看 `lumfall-business/`
- 技术文档站模板参考 `lumfall-document/`（本站即由它构建）

## 下一步

- [快速开始](./getting-started.md)：十分钟跑起第一个项目
- [目录结构与挂载点](./structure.md)：框架的核心约定
