# 快速开始

从零搭一个最小可运行的 lumfall 业务项目。

## 1. 安装

```sh
mkdir my-app && cd my-app
pnpm init
pnpm add lumfall
pnpm add -D nodemon concurrently
```

::: tip 框架共享依赖无需重复安装
业务页面可以直接 import 框架暴露的共享依赖——`vue`、`@arco-design/web-vue`、
`vue-router`、`pinia`、`@babel/runtime`、`axios`、`lodash`、`moment`、`md5`。
框架在 webpack.base 的 `resolve.alias` 里维护这份白名单（指向框架自身的
依赖目录），无需在业务 `package.json` 里重复安装，且运行时保证只有一份实例
（需要 lumfall ≥ 1.1.1，白名单见[前端构建](../frontend/build.md)）。

只有框架没有的库才需要自己安装：

```sh
pnpm add <你的三方库>
```
:::

## 2. 服务端入口

`server.js`：

```js
const { serviceStart } = require("lumfall");

const app = serviceStart({
  name: "my-app",
  // 未命中路由时的 302 兜底目标。传了 options 对象就必须显式写 homePath，
  // 否则兜底会退化为 "/"
  homePath: "/view/health",
});

module.exports = app;
```

框架自带 `health` 页面与接口，此时已经可以启动：

```sh
_ENV=local node server.js
# Server running on http://0.0.0.0:3000
```

访问 `http://localhost:3000/view/health` 看到健康页，
`http://localhost:3000/health/live` 返回 `{"status":"ok"}`。

::: warning 环境变量是 `_ENV`，不是 `NODE_ENV`
`_ENV` 的取值是 `local` / `beta` / `prod`（缺省 `local`），决定加载哪份环境配置。
`NODE_ENV` 对框架配置加载不起作用。
:::

## 3. 前端构建入口

`build.js`：

```js
const { frontendBuild } = require("lumfall");

// _ENV=local 启动 Webpack dev server（HMR，默认 127.0.0.1:9002）
// _ENV=prod  产物构建到 app/public/dist/prod/
frontendBuild(process.env._ENV);
```

`package.json` 的 scripts：

```json
{
  "scripts": {
    "dev": "_ENV='local' nodemon --exitcrash server.js",
    "prod": "_ENV='prod' node server.js",
    "build:dev": "_ENV='local' node --max_old_space_size=4096 ./build.js",
    "build:prod": "_ENV='prod' node ./build.js",
    "start:dev": "concurrently --kill-others-on-fail -n webpack,server -c cyan,green \"pnpm build:dev\" \"pnpm dev\"",
    "start:prod": "pnpm build:prod && pnpm prod"
  }
}
```

## 4. 写第一个 API

四个文件，目录约定见[目录结构与挂载点](./structure.md)：

`app/service/demo.js`：

```js
module.exports = (app) => {
  const BaseService = require("lumfall").Service.Base(app);

  return class DemoService extends BaseService {
    greeting(name) {
      return `hello, ${name || "world"}`;
    }
  };
};
```

`app/controller/demo.js`：

```js
module.exports = (app) => {
  const BaseController = require("lumfall").Controller.Base(app);

  return class DemoController extends BaseController {
    async getGreeting(ctx) {
      const { demo: demoService } = this.services;
      const message = demoService.greeting(ctx.request.query.name);
      await this.success(ctx, { message });
    }
  };
};
```

`app/router/demo.js`：

```js
module.exports = (app, router) => {
  const { demo: demoController } = app.controllers;
  router.get(
    "/api/demo/greeting",
    demoController.getGreeting.bind(demoController)
  );
};
```

`app/router-schema/demo.js`：

```js
module.exports = {
  "/api/demo/greeting": {
    get: {
      query: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      },
    },
  },
};
```

重启服务后访问：

```sh
curl "http://localhost:3000/api/demo/greeting?name=lumfall"
# {"success":true,"data":{"message":"hello, lumfall"},"metadata":{}}
```

参数校验不通过时返回 HTTP 200 + `code 442`（详见[路由与参数校验](../core/router-schema.md)）。

## 5. 写第一个页面

推荐用脚手架生成（页面名必须是 kebab-case）：

```sh
node ./node_modules/lumfall/scripts/generate-page.js hello
# 生成 app/pages/hello/entry.hello.js + app/pages/hello/hello.vue
```

也可以手动创建，入口文件 `entry.hello.js`：

```js
import boot from "$lumfallBoot";
import Hello from "./hello.vue";

boot(Hello);
```

页面组件 `hello.vue`：

```vue
<template>
  <main class="hello-page">
    <h1>Hello Lumfall</h1>
  </main>
</template>
```

本地开发时同时起 webpack dev server 与服务：

```sh
pnpm start:dev
```

访问 `http://localhost:3000/view/hello`。改组件代码，浏览器热更新。

## 6. 接下来

- [目录结构与挂载点](./structure.md)：把目录约定吃透
- [配置](./config.md)：按环境组织配置
- [常见错误自查](../reference/faq.md)：启动失败时先看这里
