// 所有环境共享的基础配置。合并顺序（后者覆盖前者同名键）：
//   框架 config.default -> 业务 config.default -> 框架 config.<env> -> 业务 config.<env>
module.exports = {
  name: "lumfall-document",
  apiBasePath: "/api",

  // 文档站是纯静态站点，默认不暴露 /api 路由；security 的默认值
  // （签名关闭 + projectKey 开启）保持框架默认即可，见框架文档「安全策略」
};
