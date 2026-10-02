// 示例 controller：演示「工厂返回 class、继承 Controller.Base」的约定。
// 文件名 demo.js + 无子目录 → 挂载到 app.controllers.demo
module.exports = (app) => {
  const BaseController = require("lumfall").Controller.Base(app);

  return class DemoController extends BaseController {
    // 通过 this.services（= app.services）在请求阶段取 service，安全
    async getInfo(ctx) {
      const { demo: demoService } = this.services;
      await this.success(ctx, demoService.getInfo());
    }

    async getNoteList(ctx) {
      const { demo: demoService } = this.services;
      const { data, total, page, size } = demoService.getNoteList({
        page: Number(ctx.request.query.page) || 1,
        size: Number(ctx.request.query.pageSize) || 10,
      });
      await this.success(ctx, data, { total, page, size });
    }

    async createNote(ctx) {
      const { demo: demoService } = this.services;
      const note = demoService.createNote(ctx.request.body);
      await this.success(ctx, note);
    }
  };
};
