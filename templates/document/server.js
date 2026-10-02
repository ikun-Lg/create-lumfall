const { serviceStart } = require("lumfall");

const app = serviceStart({
  // 应用名：渲染页面模板 <title> 时使用
  name: "lumfall-document",

  // 未命中任何路由时的 302 兜底目标。
  // 注意：serviceStart 一旦传入 options 对象，就不再套用框架默认值，
  // homePath 必须在这里显式声明，否则兜底重定向会退化为 "/"
  homePath: "/view/docs",
});

module.exports = app;
