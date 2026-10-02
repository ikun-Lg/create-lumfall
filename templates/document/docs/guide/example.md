# 示例页面

这个页面演示文档站支持的 markdown 能力，确认效果后可以删除本文件
（记得同步删掉 `docs-config.js` 侧栏里的对应条目）。

## 提示块

::: tip 提示
这是一个 tip 提示块，用于展示正向提示。
:::

::: warning 注意
这是一个 warning 提示块，用于展示需要注意的内容。
:::

## 代码高亮

标注语言即可高亮，右上角有一键复制：

```js
const { serviceStart } = require("lumfall");

const app = serviceStart({
  name: "my-docs",
  homePath: "/view/docs",
});
```

## 表格

| 能力 | 说明 |
| --- | --- |
| 页面目录（TOC） | 正文 h2/h3 自动生成，滚动联动高亮 |
| 站内搜索 | `Ctrl/Cmd + K` 或 `/` 唤起，标题与正文加权匹配，无需后端 |
| 相对链接 | `[返回介绍](./introduction.md)` 自动转站内路由，支持锚点 |
| 亮暗主题 | 跟随系统 + 手动切换，主题色由 CSS 变量驱动 |

## 锚点

每个标题悬停会出现 `#` 锚点链接，可以被其他文档引用：
[跳到代码高亮](./example.md#代码高亮)。
