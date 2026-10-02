// 扩展点目录：每个文件导出 (app) => object，返回值直接挂到 app 上。
// 例如文件 cache.js 导出 (app) => ({ get, set })，即可通过 app.cache 使用。
// 框架已占用：app.logger、app.health、app.env 等，重名会被跳过并告警。
