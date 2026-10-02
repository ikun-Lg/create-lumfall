import boot from "$lumfallBoot";
import Docs from "./docs.vue";
import { initTheme } from "./theme";

// 尽早应用主题（localStorage / 系统偏好），避免首屏闪白
initTheme();

// 文档站是单个页面（app/pages/docs），站内路由：
//   /view/docs            首页（hero + 特性卡片）
//   /view/docs/<path>     文档页（path 对应 docs/<path>.md）
// 页面目录名决定挂载路径（本页是 docs）；要改名时同步调整 docs-config.js 里的
// DOCS_BASE 与上面两个路由 path。
boot(Docs, {
  routes: [
    {
      path: "/view/docs",
      name: "doc-home",
      component: () => import("./views/doc-home.vue"),
    },
    {
      path: "/view/docs/:path(.*)",
      name: "doc-page",
      component: () => import("./views/doc-page.vue"),
    },
  ],
});
