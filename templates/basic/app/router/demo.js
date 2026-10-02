// 路由只负责把 URL 绑到 controller 方法。
// 注意绑定时要 .bind(controller)，否则方法内的 this 会丢失。
module.exports = (app, router) => {
  const { demo: demoController } = app.controllers;

  router.get("/api/demo/info", demoController.getInfo.bind(demoController));

  router.get(
    "/api/demo/note/list",
    demoController.getNoteList.bind(demoController)
  );

  router.post(
    "/api/demo/note",
    demoController.createNote.bind(demoController)
  );
};
