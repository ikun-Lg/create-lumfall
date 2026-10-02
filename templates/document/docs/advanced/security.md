# 安全策略

框架内置两道 API 防线，由 `config.security` 控制（不配置时等价于
「签名关闭 + project_key 开启」），只作用于 `/api` 开头的请求。

## 接口签名校验（apiSignature）

开启后，所有 `/api` 请求必须携带签名请求头，防重放、防伪造：

```js
// config/config.default.js
module.exports = {
  security: {
    apiSignature: {
      enabled: true,
      secret: process.env.API_SIGN_SECRET, // 不配时退化为默认串 "lumfall"（只适合本地）
      maxAgeMs: 600000,                     // 时间戳有效期，默认 10 分钟
    },
  },
};
```

算法：`s_sign = md5(secret + "_" + st)`。

| 请求头 | 含义 |
| --- | --- |
| `s_sign`（或 `s_sign` 别名 `ssign`） | `md5(secret + "_" + st)` |
| `s_t`（或 `s_t` 别名 `st`） | 毫秒时间戳 |

失败条件（任一满足即拒绝，返回 `code 445`）：

- 缺少签名或时间戳
- 时间戳不是合法数字
- 签名不匹配
- 时间差超过 `maxAgeMs`，或时间戳在未来

框架的 `$lumfallCurl` 默认带 `s_sign` / `s_t`（用默认串 `lumfall` 签名）；
服务端换了 `secret` 时客户端要同步实现同样的算法。

## project_key 校验（projectKey）

多项目（多租户）场景下，归属某个项目的接口要求请求头声明项目：

```js
module.exports = {
  security: {
    projectKey: {
      enabled: true,
      headerName: "project_key", // 可改
      freePaths: ["/api/project/custom"], // 追加豁免路径
    },
  },
};
```

- 只作用于 `/api/project/` 开头的路径
- 内置豁免：`/api/project/model_list`、`/api/project/list`
  （项目列表页初始化时还没有项目上下文），可用 `freePaths` 追加
- 缺少请求头返回 `code 446`；通过后 `ctx.projectKey` 可在 controller / service 里使用
- `$lumfallCurl` 在 URL 带 `?projectKey=xxx` 时自动追加这个请求头

## 错误码总表

| 中间件 | 触发条件 | 响应 |
| --- | --- | --- |
| `apiParamsVerify` | router-schema 校验不通过 | `{ success: false, code: 442 }` |
| `apiSignVerify` | 缺签名 / 签名不匹配 / 时间戳非法或过期 | `{ success: false, code: 445 }` |
| `projectHandler` | 缺少 `project_key` | `{ success: false, code: 446 }` |

三者都返回 HTTP 200，前端按 `success` / `code` 判断。

## 中间件链位置

安全策略位于框架中间件链的最后一环（最内层业务之前）：

```text
static → nunjucks → bodyParser → errorHandler → monitoring → apiParamsVerify → securityPolicy
```

所以参数校验（442）先于安全校验（445 / 446）执行。

## 安全建议

- 生产环境**必须**开启 `apiSignature` 并配置强随机 `secret`
- `secret` 走环境变量或配置中心；泄露后签名机制形同虚设
- md5 + 时间戳是轻量防重放方案；对安全等级要求更高的系统，把签名逻辑
  换成自定义中间件（HMAC、nonce 等）替换或叠加在 `securityPolicy` 之前
- `/view/...` 页面路由不走这两道校验，页面级权限需要业务自己控制
