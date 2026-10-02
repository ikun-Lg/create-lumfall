/**
 * 静态站点构建脚本：产出可直接托管在 Vercel / Netlify / Nginx 的纯静态目录。
 *
 * 用法：pnpm build:static （等价于 _ENV=prod node build.js + 组装 dist-static/）
 *
 * 文档站是纯前端 SPA：markdown 在构建期打进 bundle，运行时不调用任何接口、
 * 不读取服务端注入的 window.__LUMFALL__，因此可以脱离 Koa 以静态文件部署。
 *
 * 产物结构（dist-static/）：
 *   index.html     "/" 的重定向页 → /view/docs
 *   app.html       应用外壳（由 entry.docs.tpl 转换，占位符替换为静态值）
 *   vercel.json    SPA rewrite（/view/docs/* → app.html）+ 长缓存头
 *   dist/prod/...  构建产物（保持 /dist/prod/ 绝对路径可解析）
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const distDir = path.join(rootDir, "app", "public", "dist");
const outDir = path.join(rootDir, "dist-static");

// 1. 复用生产构建：子进程执行 build.js（_ENV=prod），进程退出即构建完成
console.log("[static] running production build (build.js) ...\n");
const build = spawnSync("node", ["build.js"], {
  stdio: "inherit",
  env: { ...process.env, _ENV: "prod" },
});
if (build.status !== 0) {
  process.exitCode = build.status || 1;
  return;
}

// 2. 组装输出目录（保留 .vercel/ 项目链接目录，否则 vercel link 需要重做。
//    注意必须在 rmSync 之前把文件内容读进内存——rm 后同名路径会被重建，按路径保存无效）
const linkDir = path.join(outDir, ".vercel");
const savedLinkFiles = fs.existsSync(linkDir)
  ? fs.readdirSync(linkDir).map((name) => ({
      name,
      content: fs.readFileSync(path.join(linkDir, name)),
    }))
  : null;
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "dist"), { recursive: true });
if (savedLinkFiles) {
  fs.mkdirSync(linkDir, { recursive: true });
  for (const { name, content } of savedLinkFiles) {
    fs.writeFileSync(path.join(linkDir, name), content);
  }
}
fs.cpSync(path.join(distDir, "prod"), path.join(outDir, "dist", "prod"), {
  recursive: true,
});

// 3. entry.docs.tpl → app.html：把服务端渲染的 __LUMFALL__ 占位换成静态值。
//    文档站前端不读这些值，保留空对象是为了模板使用方将来加 curl 调接口时行为一致。
//    同时剥掉 {# ... #} nunjucks 注释——Koa 渲染时会剥离，静态导出不剥会变成
//    页面顶部的可见文本（浏览器会把 head 里的游离文本挪进 body 渲染）。
//    lumfall >= 1.2.0 起页面模板按模式分目录，prod 构建产物在 dist/prod/ 下。
const tplPath = path.join(distDir, "prod", "entry.docs.tpl");
const tpl = fs
  .readFileSync(tplPath, "utf8")
  .replace(/\{#[\s\S]*?#\}/g, "");
const marker = "window.__LUMFALL__";
const start = tpl.indexOf(marker);
if (start < 0) {
  throw new Error(`[static] ${marker} not found in entry.docs.tpl`);
}
const scriptEnd = tpl.indexOf("</script>", start);
if (scriptEnd < 0) {
  throw new Error("[static] </script> not found after __LUMFALL__ block");
}

const staticGlobals = `window.__LUMFALL__ = {
        name: "lumfall-document",
        env: "static",
        options: {},
        projectKey: "",
      };`;
const appHtml = tpl.slice(0, start) + staticGlobals + tpl.slice(scriptEnd);
fs.writeFileSync(path.join(outDir, "app.html"), appHtml);

// 4. "/" 重定向页：静态托管下没有 302 兜底路由，用 meta refresh + JS 跳到 /view/docs
fs.writeFileSync(
  path.join(outDir, "index.html"),
  `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>Lumfall 文档</title>
    <meta http-equiv="refresh" content="0; url=/view/docs" />
    <script>location.replace("/view/docs");</script>
  </head>
  <body></body>
</html>
`
);

// 5. SPA 路由规则：/view/docs/* 深链接重写到 app.html（文件优先，静态资源不受影响）
fs.writeFileSync(
  path.join(outDir, "vercel.json"),
  JSON.stringify(
    {
      rewrites: [
        { source: "/view/docs", destination: "/app.html" },
        { source: "/view/docs/:path*", destination: "/app.html" },
      ],
      headers: [
        {
          // 构建产物带内容 hash，可永久缓存；app.html 不缓存保证发版即生效
          source: "/dist/prod/(.*)",
          headers: [
            { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ],
        },
        {
          source: "/app.html",
          headers: [{ key: "Cache-Control", value: "no-cache" }],
        },
      ],
    },
    null,
    2
  )
);

console.log(`\n[static] done → ${path.relative(rootDir, outDir)}`);
console.log("[static] deploy: cd dist-static && vercel --prod");
console.log("[static] （或 Vercel 项目设置 Build Command: pnpm build:static, Output Directory: dist-static）");
