# 命令与环境速查

## 命令速查

在业务根目录（`<app-root>`）下执行：

| 场景 | 命令 |
| --- | --- |
| 安装依赖 | `pnpm install` |
| 本地开发（前端 HMR + 服务） | `pnpm start:dev`（= `build:dev` + `dev` 并行） |
| 只起服务 | `_ENV=local node server.js` |
| 生产构建 | `_ENV=prod node build.js` |
| 生产启动 | `_ENV=prod node server.js` |
| 构建 + 启动 | `pnpm start:prod` |
| 生成页面 | `pnpm new-page <name> [--header]` 或 `node ./node_modules/lumfall/scripts/generate-page.js <name>` |
| 排查挂载 | 启动后读 `app.diagnostics.getManifest()` |

`new-page` 的页面名必须是 kebab-case；`--header` 套 HeaderContainer 布局。

## 环境变量

| 变量 | 取值 | 作用 |
| --- | --- | --- |
| `_ENV` | `local`（默认）/ `beta` / `prod` | 环境标识，决定加载哪份 `config.<env>.js` 与构建模式 |
| `PORT` | 默认 3000 | Koa 服务端口 |
| `IP` | 默认 0.0.0.0 | Koa 监听地址 |

注意：**不是** `NODE_ENV`；`_ENV` 同时决定配置加载与前端构建模式。

## serviceStart 选项

| 选项 | 类型 | 作用 |
| --- | --- | --- |
| `name` | string | 应用名（页面 `<title>`） |
| `homePath` | string | 未命中路由的 302 兜底；传 options 时必须显式声明 |
| `configSchema` | object | 合并配置的 JSON Schema 校验 |
| `lifecycle` | object | 启动 / 停止 hook（7 个） |
| `plugins` | array | 插件描述符 |
| `monitoring` | object | 请求观测 hook |

## 端口速记

| 端口 | 归属 |
| --- | --- |
| 3000 | Koa 服务（`PORT` 可覆盖） |
| 9002 | Webpack dev server + HMR（仅 `_ENV=local` 构建，写死在框架 `webpack.dev.js`） |

## 错误码速记

| code | 含义 | 来源 |
| --- | --- | --- |
| 442 | 参数校验失败 | apiParamsVerify（router-schema） |
| 445 | 签名校验失败 | apiSignVerify |
| 446 | 缺 project_key | projectHandler |
| 5000 | 服务端异常兜底 | errorHandler |
| 4041 | 页面不存在 | ViewController |
| 5031 | 页面模板未构建 | ViewController |
| 50000 | 业务失败约定码 | `this.fail` 示例约定 |

## 框架内置路由

| 路由 | 说明 |
| --- | --- |
| `/view/:page`、`/view/:page/*` | 页面渲染 |
| `/health/live` | 存活探针 |
| `/health/ready` | 就绪探针 |
| `/api/project/model_list` | Dashboard Model 列表（免 project_key） |
| `/api/project/list` | Dashboard 项目列表（免 project_key） |
| `/api/project` | Dashboard 单项目配置 |
| 其余未命中 GET | 302 → `homePath` |
