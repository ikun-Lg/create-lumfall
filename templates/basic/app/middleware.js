// 业务全局中间件注册入口。
// 执行时机在框架全局中间件之后（static → nunjucks → bodyParser → errorHandler
// → monitoring → apiParamsVerify → securityPolicy），因此这里注册的中间件
// 位于框架中间件链的内层。
// 可复用中间件放在 app/middleware/ 目录，会自动挂到 app.middlewares.<dir>.<name>。
module.exports = (app) => {
  // 示例：简单请求日志（生产观测更推荐 serviceStart 的 monitoring 配置）
  // app.use(async (ctx, next) => {
  //   const start = Date.now();
  //   await next();
  //   console.log(`${ctx.method} ${ctx.path} ${ctx.status} ${Date.now() - start}ms`);
  // });
};
