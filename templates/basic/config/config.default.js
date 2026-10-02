// 所有环境共享的基础配置。合并顺序（后者覆盖前者同名键）：
//   框架 config.default -> 业务 config.default -> 框架 config.<env> -> 业务 config.<env>
// 环境由 _ENV 决定（local / beta / prod，缺省 local），不是 NODE_ENV。
module.exports = {
  // 应用名，与 server.js 的 name 保持一致
  name: "lumfall-basic-project",

  // API 路径前缀约定：框架的参数校验（apiParamsVerify）与安全策略（securityPolicy）
  // 只作用于 /api 开头的请求
  apiBasePath: "/api",

  // 示例配置：演示「配置如何从服务端流动到接口/页面」，各环境文件里都有同名键
  demoMessage: "hello from config.default",

  // 安全策略（可选）。不配置这段时，框架等价于「接口签名关闭 + projectKey 开启」
  security: {
    // 接口签名校验：开启后 /api 请求必须携带 s_sign = md5(secret + "_" + st)、
    // st = 毫秒时间戳（前端 $lumfallCurl 默认带的是 s_sign / s_t，均可识别），
    // 时间差超过 maxAgeMs 或时间戳在未来都会返回 code 445。
    // 生产开启时 secret 建议走环境变量 / 配置中心，不要提交到仓库。
    apiSignature: {
      enabled: false,
      maxAgeMs: 600000,
    },
    // project_key 校验：只作用于 /api/project/ 路径，缺 header 返回 code 446。
    // /api/project/model_list、/api/project/list 内置豁免，可用 freePaths 追加。
    projectKey: {
      enabled: true,
      headerName: "project_key",
    },
  },
};
