const { serviceStart } = require("lumfall");

const app = serviceStart({
  // 应用名：渲染页面模板 <title> 时使用
  name: "lumfall-basic-project",

  // 未命中任何路由时的 302 兜底目标。
  // 注意：serviceStart 一旦传入 options 对象，就不再套用框架默认值，
  // homePath 必须在这里显式声明，否则兜底重定向会退化为 "/"
  homePath: "/view/home",

  // 可选：配置强校验。传入 JSON Schema，合并后的配置不匹配会直接启动失败
  // configSchema: require("./config/config.schema.js"),

  // 可选：启动 / 停止 hook（beforeStart / beforeRouteLoad / afterRouteLoad /
  // afterStart / onError / beforeStop / afterStop），启动期 hook 必须同步
  // lifecycle: {},

  // 可选：插件（数据库、缓存等先于业务中间件/路由初始化的能力）
  // plugins: [],

  // 可选：请求级观测 hook（traceId / onRequestStart / onRequestEnd / onRequestError）
  // monitoring: {},
});

module.exports = app;
