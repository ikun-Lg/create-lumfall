// API 参数校验：key 必须是已注册路由的 path，method 必须全小写，否则启动失败。
// 只作用于 /api 开头的请求；校验失败返回 HTTP 200 + { success: false, code: 442 }。
module.exports = {
  "/api/demo/info": {
    get: {},
  },
  "/api/demo/note/list": {
    get: {
      query: {
        type: "object",
        properties: {
          page: { type: "string" },
          pageSize: { type: "string" },
        },
      },
    },
  },
  "/api/demo/note": {
    post: {
      body: {
        type: "object",
        properties: {
          content: { type: "string", minLength: 1, maxLength: 200 },
        },
        required: ["content"],
      },
    },
  },
};
