# 常见错误自查

启动失败或行为不符合预期时，按这份清单排查。

## 启动期

1. **`Class extends value ... is not a constructor`**
   `Controller.Base` / `Service.Base` 是工厂函数，要调用：
   `require("lumfall").Controller.Base(app)`，少写 `(app)` 就会这样报错

2. **controller / service 工厂返回了对象而不是 class**
   loader 直接抛错中断启动；检查 `return class Xxx extends Base { ... }`

3. **router-schema 启动报 `does not match a registered route`**
   schema 的 key（path）写错、漏写路由，或 method 用了大写
   （必须小写且确实以该方法注册过）

4. **`[lifecycle] hook "xxx" must be synchronous`**
   启动期 hook 不能返回 Promise；异步初始化放到 `serviceStart()` 之前做
   （`beforeStop` / `afterStop` 除外）

5. **`unknown hook "xxx"`**
   lifecycle 只接受七个 hook 名，见[生命周期](../core/lifecycle.md)

6. **插件报 name 重复 / 缺依赖 / 循环依赖 / register 必须同步**
   见[插件](../core/plugins.md)规则表

7. **配置校验失败 `merged configuration for "prod" is invalid`**
   合并后的配置不满足 `configSchema`；注意浅合并是整键替换，
   环境文件里对象型配置要写完整

8. **extend 报 `must export a factory function`**
   `app/extend/` 下的文件要导出 `(app) => object`，返回值挂到 app 上

9. **同名页面报 `duplicate business page entry`**
   同一来源（业务目录）里出现了两个同名 `entry.<name>.js`

## 运行期

10. **配置不生效**
    - 用的是 `NODE_ENV` 而不是 `_ENV`？环境变量是 `_ENV` ∈ local / beta / prod
    - 配置是浅合并：环境文件里对象型配置整键替换，可能把 default 的子键覆盖丢了
    - 在请求阶段读了吗？工厂执行期 `this.config` 是 undefined

11. **挂载点拿不到（undefined）**
    - 用文件名而不是 camelCase 挂载名？
      `app.middlewares.apiParamsVerify` 而不是 `app.middlewares["api-params-verify"]`
    - 用 `__dirname` 拼业务路径？业务路径统一 `app.businessPath`

12. **`/view/<未知页面>` 返回 404 `4041` 而不是跳首页**
    这是约定：页面不存在是 404 `4041`；页面存在但没构建模板是 503 `5031`；
    只有**非 /view 的未命中路由**才 302 到 `homePath`

13. **接口返回 `code 442`**
    router-schema 校验失败，看响应 message 里的具体字段提示

14. **接口返回 `code 445`**
    签名校验失败：检查 `secret` 是否与客户端一致、时间戳是否过期（`maxAgeMs`）、
    时间戳是否在未来

15. **接口返回 `code 446`**
    `/api/project/` 路径缺 `project_key` 头；URL 带 `?projectKey=xxx`
    时 `$lumfallCurl` 会自动带上

16. **接口返回 `code 5000`**
    服务端异常被 errorHandler 兜底，详情在日志里（工作区 `logs/` 目录）

17. **页面白屏**
    - 看浏览器控制台与 Network：JS/CSS 404 说明产物 publicPath 对不上
      （确认跑过对应模式的构建）
    - dev 模式资源指向 `127.0.0.1:9002`，先起 `build:dev` 再访问 3000 端口

18. **排查「文件明明写了却没生效」**
    读诊断清单：`app.diagnostics.getManifest()`，看 `routes` / `pages`
    里有没有你注册的东西

## 工程与依赖

19. **业务代码 import 框架的传递依赖报模块找不到**
    lumfall ≥ 1.1.1 起框架已把内置依赖（vue / @arco-design/web-vue / pinia /
    vue-router / @babel/runtime 等）暴露给业务代码，直接 import 即可；
    旧版本（≤ 1.1.0）+ pnpm 下需在业务 `package.json` 显式声明（见[快速开始](../guide/getting-started.md)）。
    框架没有的库仍然要先 `pnpm add`

20. **`frontendBuild("beta")` 什么都不做**
    构建只支持 `_ENV=local`（dev server）与 `_ENV=prod`（产物）

21. **从错误目录启动 / 构建**
    业务根目录 = `process.cwd()`；必须在 `<app-root>` 下执行 `node server.js`
    与构建命令

22. **服务端启动时控制台输出大量内容**
    lumfall ≥ 1.2.0 启动日志已降级为摘要（各 loader 条目数，不打印配置内容）；
    若仍看到全量配置 dump，说明框架版本过旧，升级即可
