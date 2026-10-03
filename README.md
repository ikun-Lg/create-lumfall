# create-lumfall

[lumfall](https://www.npmjs.com/package/lumfall) 应用脚手架：一条命令从 GitHub 拉取模板并生成
可直接运行的完整工程，不用安装依赖后再手动搭目录。

```sh
pnpm create lumfall my-app                # 交互式选择模板
pnpm create lumfall my-app -t basic       # 基础业务项目
pnpm create lumfall my-admin -t business  # B 端全栈管理台
pnpm create lumfall my-doc -t document    # 技术文档站

# npm / npx 同样可用
npm create lumfall my-app
npx create-lumfall my-app -t business
```

## 模板

模板内容不在本包内维护，而是在生成时按注册表从 GitHub 拉取（模板仓库更新后
无需重发本包）：

| 模板 | 说明 | 模板仓库 |
| --- | --- | --- |
| `basic` | 基础业务项目：`server.js` / `build.js` / `config/` / `app/` 全套目录约定 + 示例 API 与示例页面 | `ikun-Lg/lumfall-basic-project@main` |
| `business` | B 端全栈管理台：电商 + 课程双系统、JWT 登录、DSL 驱动菜单（schema/group/sider/iframe 全形态）、通用 CRUD 接口，内置演示数据（admin / 123456） | `ikun-Lg/lumfall-business@master` |
| `document` | 技术文档站：对标 VitePress（导航/侧栏/TOC/搜索/暗色模式），生成空站后放入自己的内容 | `ikun-Lg/lumfall-document@template/empty` |

拉取策略：优先 codeload `tar.gz`（无需安装 git），失败自动回退 `git clone --depth 1`
（复用 git 的代理 / 凭据配置）。`--repo <owner/name>` 可覆盖模板仓库来源，用于
fork、私有镜像或离线自建。

生成后：

```sh
cd my-app
pnpm install
pnpm start:dev      # 本地开发（前端 HMR + 服务）
pnpm start:prod     # 生产构建 + 启动
```

脚手架会把模板里的自指名称（package.json / server.js / config 中的应用名）替换为你
传入的项目名。模板内容与框架版本解耦：模板 `package.json` 里的 `lumfall` 用的是
semver 范围，安装时取最新发布版。lockfile 不随模板分发（安装时解析最新依赖）。

## 维护

模板内容在各模板仓库里维护，本包只保留注册表（`cli.js` 顶部的 `TEMPLATES`）：

- 更新模板 → 直接提交推送对应仓库（分支由注册表 `ref` 指定），无需发布本包版本；
- 新增模板 → 在 `TEMPLATES` 增加一项（key / alias / name / repo / ref / selfName / hint）；
- 发布本包 → `npm publish`（改动注册表或 CLI 逻辑时）。
