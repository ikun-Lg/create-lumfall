/**
 * 文档站配置 —— 使用本模板时主要改这个文件。
 *
 * 换成自己的站点只需三步：
 *   1. 改本文件的 site / nav / sidebar / hero / footer
 *   2. 把 docs/ 目录下的 markdown 换成自己的内容（目录结构随意，两层以内最佳）
 *   3. 想改页面挂载路径（/view/docs）时，改 DOCS_BASE 并同步 entry.docs.js 里的路由
 */

// 站内文档的 URL 前缀 = /view/<页面目录名>
const DOCS_BASE = "/view/docs";

const doc = (path) => `${DOCS_BASE}/${path}`;

export default {
  // 站点信息
  site: {
    title: "Lumfall",
    description: "Lumfall 全栈框架开发文档",
    // 右上角仓库链接，不需要就置空
    repo: "https://github.com/ikun-Lg/lumfall",
  },

  // 顶部导航：path 为站内路由（高亮按第一级 section 匹配），link 为外链
  nav: [
    { text: "指南", path: doc("guide/introduction") },
    { text: "核心概念", path: doc("core/app-instance") },
    { text: "DSL", path: doc("dsl/overview") },
    { text: "前端", path: doc("frontend/page") },
    { text: "进阶", path: doc("advanced/security") },
    { text: "参考", path: doc("reference/faq") },
    { text: "GitHub", link: "https://github.com/ikun-Lg/lumfall" },
  ],

  // 侧边栏分组。items 的 path 必须对应 docs/ 下真实存在的 markdown 文件
  // （例如 doc("guide/introduction") 对应 docs/guide/introduction.md）
  sidebar: [
    {
      text: "指南",
      items: [
        { text: "简介", path: doc("guide/introduction") },
        { text: "快速开始", path: doc("guide/getting-started") },
        { text: "目录结构与挂载点", path: doc("guide/structure") },
        { text: "配置", path: doc("guide/config") },
        { text: "构建与部署", path: doc("guide/deployment") },
      ],
    },
    {
      text: "核心概念",
      items: [
        { text: "app 对象与启动流程", path: doc("core/app-instance") },
        { text: "Controller 与 Service", path: doc("core/controller-service") },
        { text: "路由与参数校验", path: doc("core/router-schema") },
        { text: "中间件", path: doc("core/middleware") },
        { text: "生命周期", path: doc("core/lifecycle") },
        { text: "插件", path: doc("core/plugins") },
      ],
    },
    {
      text: "DSL",
      items: [
        { text: "DSL 总览", path: doc("dsl/overview") },
        { text: "Model 与 Project", path: doc("dsl/model-project") },
        { text: "菜单项 DSL", path: doc("dsl/menu") },
        { text: "schema 模块 DSL", path: doc("dsl/schema") },
        { text: "按钮与动态表单", path: doc("dsl/schema-actions") },
        { text: "接口契约", path: doc("dsl/api-contract") },
        { text: "扩展 DSL", path: doc("dsl/extend") },
        { text: "完整模板与注意事项", path: doc("dsl/reference") },
      ],
    },
    {
      text: "前端",
      items: [
        { text: "页面系统", path: doc("frontend/page") },
        { text: "前端构建", path: doc("frontend/build") },
        { text: "内置组件", path: doc("frontend/widgets") },
        { text: "请求工具 curl", path: doc("frontend/curl") },
      ],
    },
    {
      text: "进阶",
      items: [
        { text: "安全策略", path: doc("advanced/security") },
        { text: "健康检查", path: doc("advanced/health") },
        { text: "请求观测 monitoring", path: doc("advanced/monitoring") },
        { text: "Dashboard 与 Model 配置", path: doc("advanced/dashboard") },
      ],
    },
    {
      text: "参考",
      items: [
        { text: "常见错误自查", path: doc("reference/faq") },
        { text: "命令与环境速查", path: doc("reference/commands") },
      ],
    },
  ],

  // 首页 hero
  hero: {
    name: "Lumfall",
    tagline: "Koa + Vue 全栈框架，目录即约定，开箱即用",
    text: "目录自动加载、四层配置合并、声明式 Dashboard DSL、页面与路由构建、安全策略、健康检查——写配置和业务代码，而不是搭工程。",
    actions: [
      { text: "快速开始", path: doc("guide/getting-started"), theme: "brand" },
      { text: "DSL 设计", path: doc("dsl/overview"), theme: "brand-outline" },
      { text: "GitHub", link: "https://github.com/ikun-Lg/lumfall" },
    ],
    features: [
      {
        icon: "📐",
        title: "声明式 Dashboard DSL",
        details:
          "Model + Project 两层 DSL 声明管理台；一份字段 schema 驱动搜索栏、表格、表单、详情四个视图，写配置不改代码。",
      },
      {
        icon: "📁",
        title: "目录即约定",
        details:
          "controller / service / router / middleware 按目录自动加载并挂载到 app，新建文件即生效，无需手动注册。",
      },
      {
        icon: "⚙️",
        title: "四层配置合并",
        details:
          "框架与业务的 config 按 _ENV 分层浅合并，支持 JSON Schema 强校验，环境切换只改一个变量。",
      },
      {
        icon: "🧩",
        title: "页面系统",
        details:
          "Vue 3 页面按 entry.<name>.js 自动发现，Webpack 5 多页构建，/view/<name> 直接访问，支持 HMR 热更新。",
      },
      {
        icon: "🛡️",
        title: "内置安全策略",
        details:
          "接口签名校验与 project_key 校验开箱可用，参数校验基于 JSON Schema（Ajv），错误码统一。",
      },
      {
        icon: "💚",
        title: "健康检查与观测",
        details:
          "/health/live 与 /health/ready 内置探针机制；monitoring 提供请求级 trace 观测钩子；插件与生命周期覆盖启动退出。",
      },
    ],
  },

  // 首页与文档页底部
  footer: {
    text: "基于 lumfall 构建的文档站模板",
    // copyright: "© 2026 Your Name",
  },
};
