# 请求工具 curl

框架提供统一的请求工具 `$lumfallCurl`，封装了 axios、统一响应处理、
接口签名与 project_key 透传。

## 基本用法

```js
import $curl from "$lumfallCurl";

const res = await $curl({
  url: "/api/project/product/list",
  method: "get",            // 默认 post
  query: { page: "1", pageSize: "20" },  // query 参数
  data: { title: "x" },     // 请求体
  headers: {},              // 额外请求头
  timeout: 60000,           // 默认 60000ms
  responseType: "json",
});

if (res && res.success) {
  console.log(res.data, res.metadata);
}
```

返回值是接口的 body（`{ success, data, metadata }` 或
`{ success: false, message, code }`），网络异常时返回包含错误信息的对象，
**不会 reject**——业务代码统一按 `res.success` 判断。

## 自动处理的协议细节

### 接口签名

每个请求自动携带 `s_t`（毫秒时间戳）与 `s_sign`（`md5("lumfall_" + st)`），
对应服务端的 apiSignature 校验（见[安全策略](../advanced/security.md)）。
注意：默认签名串是 `lumfall`，服务端配置了自定义 `secret` 时，
客户端要用同样的 secret 重新生成签名。

### project_key

页面 URL 带 `?projectKey=xxx` 时（`window.__LUMFALL__.projectKey`），
对 `/api/project/` 开头的请求自动追加 `project_key` 请求头，
对应服务端的 projectHandler 校验。

### 错误码提示

`success: false` 时按 code 弹出 Arco Message 错误提示：

| code | 提示 |
| --- | --- |
| 442 | Invalid request parameters（参数校验失败） |
| 445 | Invalid request（签名校验失败） |
| 446 | Required parameter is missing（缺 project_key） |
| 50000 | 显示服务端 message（`this.fail` 的默认约定码） |
| 其他 | Network Error |

业务想自定义失败处理时，忽略提示逻辑直接处理返回值即可。

## window.__LUMFALL__

curl 依赖页面模板注入的全局数据（见[页面系统](./page.md)）：

```js
window.__LUMFALL__ = {
  name: "my-app",
  env: "local",
  options: { /* serviceStart 的 options */ },
  projectKey: "",
};
```

## 下一步

- [安全策略](../advanced/security.md)：签名与 project_key 的服务端逻辑
- [Dashboard 与 Model 配置](../advanced/dashboard.md)：curl 在 Dashboard 页面里的使用
