// 示例 service：演示「工厂返回 class、继承 BaseService」的约定。
// 文件名 demo.js + 无子目录 → 挂载到 app.services.demo
// 数据放在内存里，重启即清空；真实业务请换成数据库 / 远程服务调用。
module.exports = (app) => {
  const BaseService = require("lumfall").Service.Base(app);

  // 内存数据池
  const notePool = [
    { id: 1, content: "第一条示例笔记：这是一个基于 lumfall 的基础项目骨架", createdAt: "2026-10-02 10:00:00" },
    { id: 2, content: "在 app/service 下新建文件即可被自动加载", createdAt: "2026-10-02 10:01:00" },
    { id: 3, content: "配置通过 config/config.<env>.js 按 _ENV 合并", createdAt: "2026-10-02 10:02:00" },
  ];
  let nextId = notePool.length + 1;

  return class DemoService extends BaseService {
    // 请求阶段读 this.config（= app.config）是安全的；
    // 不要在工厂执行期或构造期读，那时 configLoader 还没跑
    getInfo() {
      return {
        appName: this.config.name,
        demoMessage: this.config.demoMessage,
        serverTime: new Date().toISOString(),
      };
    }

    /**
     * 分页查询笔记
     * @param {{ page: number, size: number }} param0
     */
    getNoteList({ page = 1, size = 10 }) {
      const start = (page - 1) * size;
      const data = notePool.slice(start, start + size).map((note) => ({ ...note }));

      return { data, total: notePool.length, page, size };
    }

    /**
     * 新建笔记
     * @param {{ content: string }} param0
     */
    createNote({ content }) {
      const note = {
        id: nextId++,
        content,
        createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      };
      notePool.unshift(note);
      return note;
    }
  };
};
