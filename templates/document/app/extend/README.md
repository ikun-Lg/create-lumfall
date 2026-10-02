// 扩展点目录：每个文件导出 (app) => object，返回值直接挂到 app 上。
// 例如注册业务健康探针（文档站默认没有外部依赖，无需探针）：
//   module.exports = (app) => {
//     app.health.register("database", async () => { /* ping */ });
//     return {};
//   };
