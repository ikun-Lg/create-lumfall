// 可复用中间件目录：每个文件导出 (app) => (ctx, next) => {}，
// 自动挂载到 app.middlewares.<目录名>.<文件名>（kebab/snake-case 自动转 camelCase）。
