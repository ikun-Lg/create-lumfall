# 页面系统

前端页面放在 `app/pages/<page-name>/` 下，由 Webpack 按 `entry.<page-name>.js`
自动发现为入口，Koa 通过 `/view/<page-name>` 渲染。

## 页面结构

```text
app/pages/
└── project-list/
    ├── entry.project-list.js    # 入口文件（命名必须是 entry.<page-name>.js）
    └── project-list.vue         # 页面组件
```

入口文件通常长这样（`$lumfallBoot` 是框架提供的启动器别名）：

```js
import boot from "$lumfallBoot";
import Page from "./project-list.vue";

boot(Page);
```

需要 vue-router 的页面（多视图），把路由数组作为第二个参数传入：

```js
import boot from "$lumfallBoot";
import Page from "./dashboard.vue";

boot(Page, {
  routes: [
    { path: "/view/dashboard", component: () => import("./dashboard.vue") },
    { path: "/view/dashboard/todo", component: () => import("./todo/todo.vue") },
  ],
});
```

::: warning 路由 base
`boot` 内部用 `createWebHistory()` 创建 router（base 为 `/`），所以路由 path
要写**完整路径**（`/view/<page>/...`），且必须与框架服务端路由 `/view/:page/*`
的前缀一致，否则刷新页面会被兜底重定向。
:::

## 访问与错误码

- 页面访问路径：`/view/<page-name>`
- 页面不存在（入口没被发现）：HTTP 404 + `code 4041`
- 页面存在但模板没构建出来（没执行过构建）：HTTP 503 + `code 5031`
- 模板渲染异常（含 `template not found`）会 302 到 `homePath`

## 用脚手架生成页面

```sh
# package.json 里配置了 new-page 脚本时
pnpm new-page project-list            # 生成 entry.project-list.js + project-list.vue
pnpm new-page report --header         # 额外套 HeaderContainer 布局

# 没配脚本时直接调用框架的脚手架
node ./node_modules/lumfall/scripts/generate-page.js project-list
```

- 页面名必须是 kebab-case（小写字母开头），已存在的目录会被拒绝
- `--header` 生成的页面用框架的 `HeaderContainer` 组件做整体布局

## boot 做了什么

`$lumfallBoot`（框架 `app/pages/boot.js`）依次完成：

1. `createApp(pageComponent)`
2. 注册 Arco Design Vue（含图标库）与 Pinia
3. 若传了 `routes`：创建 vue-router（history 模式），等 `router.isReady()` 后挂载；
   否则直接挂载到 `#root`

所以页面里可以直接使用 `a-*` 组件、`pinia` store，无需手动注册。

## 服务端注入的全局数据

页面模板由 nunjucks 渲染，`window.__LUMFALL__` 上有服务端注入的数据：

```js
window.__LUMFALL__ = {
  name: "my-app",        // serviceStart 的 options.name
  env: "local",          // _ENV 值
  options: { ... },      // serviceStart 的完整 options（JSON）
  projectKey: "",        // URL query 里的 projectKey（Dashboard 场景）
};
```

## 页面发现规则

- 框架自带页面（`dashboard`、`health`）与业务页面一起被发现
- **同名时业务页面覆盖框架页面**
- 同一来源（framework 或 business）内出现同名入口会启动报错
- 排查页面是否被发现：`app.diagnostics.getManifest().pages`

## 下一步

- [前端构建](./build.md)：Webpack 管线与别名
- [内置组件](./widgets.md)：HeaderContainer / schema 三件套
