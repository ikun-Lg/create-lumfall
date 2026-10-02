// markdown-it 渲染器：标题锚点 + TOC 收集、代码块外壳（语言标签 + 复制按钮）、
// 外链新窗口打开、文档内 .md 相对链接转站内路由、::: tip/warning/danger 提示块。
import MarkdownIt from "markdown-it";
import MarkdownItContainer from "markdown-it-container";
import hljs from "./highlight";
import { slugify, resolveDocHref } from "../utils";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
  typographer: false,
});

// ::: <type> [自定义标题] 提示块（tip / info / warning / danger）
const CONTAINER_DEFAULT_TITLES = {
  tip: "提示",
  info: "说明",
  warning: "注意",
  danger: "危险",
};

Object.keys(CONTAINER_DEFAULT_TITLES).forEach((type) => {
  md.use(MarkdownItContainer, type, {
    render(tokens, idx) {
      if (tokens[idx].nesting === 1) {
        const info = tokens[idx].info.trim().slice(type.length).trim();
        const title = info || CONTAINER_DEFAULT_TITLES[type];
        return (
          `<div class="doc-container doc-container-${type}">` +
          `<p class="doc-container-title">${md.utils.escapeHtml(title)}</p>`
        );
      }
      return "</div>";
    },
  });
});

// 代码块：highlight.js 高亮（未识别语言则原样转义），外层加语言标签与复制按钮
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const lang = (token.info || "").trim().split(/\s+/)[0];

  let codeHtml;
  if (lang && hljs.getLanguage(lang)) {
    try {
      codeHtml = hljs.highlight(token.content, {
        language: lang,
        ignoreIllegals: true,
      }).value;
    } catch (e) {
      codeHtml = md.utils.escapeHtml(token.content);
    }
  } else {
    codeHtml = md.utils.escapeHtml(token.content);
  }

  const langLabel = md.utils.escapeHtml(lang || "text");
  return (
    `<div class="doc-code-block">` +
    `<div class="doc-code-bar"><span class="doc-code-lang">${langLabel}</span>` +
    `<button class="doc-code-copy" type="button">复制</button></div>` +
    `<pre><code class="hljs">${codeHtml}</code></pre></div>\n`
  );
};

// 标题开标签：生成唯一 id（供 TOC / 锚点 / 搜索跳转），并收集 h2/h3 进 TOC
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const level = Number(token.tag.slice(1));
  const inline = tokens[idx + 1];
  const text = (inline ? inline.content : "").trim();

  const base = slugify(text) || `heading-${idx}`;
  const count = env.slugCount[base] || 0;
  env.slugCount[base] = count + 1;
  const id = count ? `${base}-${count + 1}` : base;

  token.attrSet("id", id);
  env.currentHeadingId = id;
  if (level >= 2 && level <= 3) {
    env.toc.push({ level, text, id });
  }
  return self.renderToken(tokens, idx, options);
};

// 标题闭标签：在标题内部追加悬停可见的 # 锚点链接
md.renderer.rules.heading_close = (tokens, idx, options, env, self) => {
  const id = env.currentHeadingId || "";
  const anchor = id
    ? `<a class="doc-header-anchor" href="#${id}" aria-hidden="true">#</a>`
    : "";
  return anchor + self.renderToken(tokens, idx, options);
};

// 链接开标签：外链新窗口；文档内相对 .md 链接（./xx.md、../xx.md）转站内路由
const defaultLinkOpen =
  md.renderer.rules.link_open ||
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const href = token.attrGet("href") || "";

  if (/^https?:\/\//i.test(href)) {
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer");
  } else if (!href.startsWith("#") && env.docPath) {
    const resolved = resolveDocHref(env.docPath, href);
    if (resolved) {
      token.attrSet("href", resolved.path + resolved.hash);
    }
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

/**
 * 渲染 markdown
 * @param {string} source markdown 原文
 * @param {string} docPath 当前文档路径（相对 docs/），用于解析相对链接
 * @returns {{ html: string, toc: Array<{level:number, text:string, id:string}> }}
 */
export function renderMarkdown(source, docPath) {
  const env = { toc: [], slugCount: {}, docPath };
  const html = md.render(source, env);
  return { html, toc: env.toc };
}

export default md;
