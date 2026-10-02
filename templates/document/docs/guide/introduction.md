# 开始使用

这是由 create-lumfall 生成的**空文档站模板**——站点框架（导航、侧栏、目录、搜索、
代码高亮、亮暗主题）已全部就绪，你只需要写内容。

## 放入你的内容

1. 把 `docs/` 目录下的 markdown 换成你的文档（目录结构随意，两级以内体验最佳）
2. 修改 `app/pages/docs/docs-config.js`：站点名、导航、侧栏、首页 hero、页脚
3. 本地预览：`pnpm start:dev`，访问 <http://localhost:3000/view/docs>

## 侧边栏与文件对应

侧边栏条目的 `path` 对应 `docs/` 下的 markdown 文件：

| 配置项 | 对应文件 |
| --- | --- |
| `doc("guide/introduction")` | `docs/guide/introduction.md` |
| `doc("guide/example")` | `docs/guide/example.md` |

## 发布

```sh
pnpm build:static              # 产出 dist-static/（含 vercel.json）
cd dist-static && vercel --prod
```

## 下一步

- 看 [示例页面](./example.md) 了解文档站支持的 markdown 能力，确认后可删除
- 完整功能说明见 lumfall-document 项目 README
