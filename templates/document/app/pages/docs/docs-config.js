/**
 * 文档站配置 —— 使用本模板时主要改这个文件。
 *
 * 换成自己的站点只需两步：
 *   1. 改本文件的 site / nav / sidebar / hero / footer
 *   2. 把 docs/ 目录下的 markdown 换成自己的内容（目录结构随意，两级以内最佳）
 */

// 站内文档的 URL 前缀 = /view/<页面目录名>
const DOCS_BASE = "/view/docs";

const doc = (path) => `${DOCS_BASE}/${path}`;

export default {
  // 站点信息
  site: {
    title: "Your Docs",
    description: "基于 lumfall 的技术文档站",
    // 右上角仓库链接，不需要就置空
    repo: "",
  },

  // 顶部导航：path 为站内路由（高亮按第一级 section 匹配），link 为外链
  nav: [{ text: "文档", path: doc("guide/introduction") }],

  // 侧边栏分组。items 的 path 必须对应 docs/ 下真实存在的 markdown 文件
  // （例如 doc("guide/introduction") 对应 docs/guide/introduction.md）
  sidebar: [
    {
      text: "开始",
      items: [
        { text: "介绍", path: doc("guide/introduction") },
        { text: "示例页面", path: doc("guide/example") },
      ],
    },
  ],

  // 首页 hero
  hero: {
    name: "Your Docs",
    tagline: "基于 lumfall 的技术文档站模板",
    text: "把 docs/ 目录下的 markdown 换成你的内容，再修改本文件（app/pages/docs/docs-config.js），即可拥有完整的文档站点。",
    actions: [{ text: "开始使用", path: doc("guide/introduction"), theme: "brand" }],
    features: [
      {
        icon: "📝",
        title: "Markdown 驱动",
        details:
          "docs/ 目录即内容，支持相对链接、标题锚点、提示块、代码高亮与一键复制。",
      },
      {
        icon: "🔍",
        title: "站内搜索",
        details: "Ctrl/Cmd + K 唤起，标题与正文加权匹配，纯前端实现无需后端。",
      },
      {
        icon: "🌗",
        title: "亮暗主题",
        details: "跟随系统并支持手动切换，样式由 CSS 变量驱动，改一个变量即换主题色。",
      },
    ],
  },

  // 首页与文档页底部
  footer: {
    text: "基于 lumfall-document 模板构建",
  },
};
