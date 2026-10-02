# create-lumfall

[lumfall](https://www.npmjs.com/package/lumfall) 应用脚手架：一条命令生成可直接运行的
完整工程，不用安装依赖后再手动搭目录。

```sh
pnpm create lumfall my-app            # 交互式选择模板
pnpm create lumfall my-app -t basic   # 基础业务项目
pnpm create lumfall my-doc -t document # 技术文档站

# npm / npx 同样可用
npm create lumfall my-app
npx create-lumfall my-app -t basic
```

## 模板

| 模板 | 说明 |
| --- | --- |
| `basic` | 基础业务项目：`server.js` / `build.js` / `config/` / `app/` 全套目录约定 + 示例 API 与示例页面（来自 `lumfall-basic-project`） |
| `document` | 技术文档站：对标 VitePress（导航/侧栏/TOC/搜索/暗色模式），内置 lumfall 技术文档内容（来自 `lumfall-document`） |

生成后：

```sh
cd my-app
pnpm install
pnpm start:dev      # 本地开发（前端 HMR + 服务）
pnpm start:prod     # 生产构建 + 启动
```

脚手架会把模板里的自指名称（package.json / server.js / config 中的应用名）替换为你
传入的项目名。模板内容与框架版本解耦：模板 `package.json` 里的 `lumfall` 用的是
semver 范围，安装时取最新发布版。

## 维护

模板源是本工作区同级的 `lumfall-basic-project/` 与 `lumfall-document/` 两个项目。
模板内容变更后，在本目录执行：

```sh
pnpm sync            # 重新拷贝（自动排除 node_modules / 构建产物 / logs / .git / pnpm-lock.yaml）
npm publish          # 发布新版
```
