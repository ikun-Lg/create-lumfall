# lumfall-document（空模板）

基于 [lumfall](https://www.npmjs.com/package/lumfall) 的技术文档站**空模板**：
导航、侧边栏、页面目录（TOC）、站内搜索（Ctrl/Cmd+K）、代码高亮与复制、
亮 / 暗主题、上一篇/下一篇、移动端适配全部就绪，生成后只需要写内容。

> 这个分支（`template/empty`）是 create-lumfall 脚手架 `document` 模板的来源；
> `main` 分支是自举的完整示例（内置 lumfall 技术文档）。

## 开始

```sh
pnpm install
pnpm start:dev                # http://localhost:3000/view/docs

pnpm build:static             # 产出 dist-static/（Vercel 等静态托管可直接部署）
```

## 写内容

1. **内容**：`docs/` 下的 markdown 就是文档，目录结构随意（两级以内体验最佳）。
   文档里可以互相引用，支持相对链接与锚点：
   ```markdown
   [其他页](./other.md)  [上级目录](../advanced/x.md)  [某节](./other.md#锚点)
   ```
2. **站点配置**：`app/pages/docs/docs-config.js` 是唯一需要动的配置文件——
   站点名、导航、侧栏分组、首页 hero、页脚。侧栏条目的 `path` 对应
   `docs/` 下的文件路径（`/view/docs/<path>` ↔ `docs/<path>.md`）
3. **可选**：改主题色（`app/pages/docs/styles/vars.less` 的 `--doc-brand`
   等变量）、换 logo（`app/pages/docs/assets/docs-logo.svg`）

## 功能清单

| 功能 | 说明 |
| --- | --- |
| 首页 hero | 大标题 + 标语 + 按钮 + 特性卡片（配置驱动） |
| 侧边栏 | 分组导航，当前页高亮，移动端抽屉 |
| 页面目录 | 正文右侧 TOC，滚动联动高亮（<1280px 隐藏） |
| 站内搜索 | `Ctrl/Cmd + K` 或 `/` 唤起；标题 / 小节 / 正文加权匹配，关键词高亮摘要，键盘导航 |
| 代码块 | highlight.js 按需注册语言、语言标签、一键复制、亮暗配色 |
| markdown 扩展 | `::: tip / info / warning / danger <可选标题>` 提示块、标题锚点、外链新窗口 |
| 主题 | 亮 / 暗（右上角切换），首次进站跟随系统，localStorage 记忆 |
| 上一篇/下一篇 | 按侧边栏顺序自动生成 |
| 静态部署 | `pnpm build:static` 一键产出 `dist-static/`（vercel.json rewrite + 长缓存） |

## 写作约定

- 每篇文档以 `# 一级标题` 开头（渲染为页面标题），章节用 `##` / `###`
  （自动进入右侧 TOC 与搜索索引）
- 代码块标注语言（`js` / `vue` / `bash` / `json`…）才会高亮
- 不支持数学公式、mermaid 图（markdown-it 未接插件，需要时可在
  `app/pages/docs/markdown/index.js` 扩展）

## 相关项目

- `lumfall-basic-project/`：基础业务工程骨架
- `lumfall-business/`：B 端全栈模板
- `create-lumfall/`：应用脚手架（本模板通过它的 `-t document` 生成）
