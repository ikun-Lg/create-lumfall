const { frontendBuild } = require("lumfall");

// 环境由 _ENV 决定（不是 NODE_ENV）：
//   _ENV=local  启动 Webpack dev server（HMR 热更新，默认 127.0.0.1:9002）
//   _ENV=prod   产物构建到 app/public/dist/prod/，同时产出各页面 .tpl 模板
frontendBuild(process.env._ENV);
