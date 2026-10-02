/**
 * 标题 → url slug。保留中文等 unicode 字母数字，空格转 -，
 * 与 markdown 渲染器的标题 id 规则保持一致（搜索跳转锚点也用它）。
 */
export function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

/** "/view/docs/guide/intro" → "guide/intro" */
export function pathOfDoc(viewPath) {
  return String(viewPath || "")
    .replace(/^\/view\/docs\/?/, "")
    .replace(/\/+$/, "");
}

/**
 * 解析文档内相对链接（xxx.md / ./xxx.md / ../xxx.md，可带 #锚点）。
 * 返回 { path, hash }；不是 .md 链接时返回 null（外链、页内锚点走默认规则）。
 * @param {string} currentDocPath 当前文档路径，如 "guide/getting-started"
 * @param {string} href markdown 里的 href
 */
export function resolveDocHref(currentDocPath, href) {
  const [raw = "", hash = ""] = String(href).split("#");
  if (!/\.md$/.test(raw)) {
    return null;
  }

  const baseParts = String(currentDocPath).split("/").slice(0, -1);
  raw
    .replace(/^\.\//, "")
    .split("/")
    .forEach((seg) => {
      if (seg === "..") {
        baseParts.pop();
      } else if (seg && seg !== ".") {
        baseParts.push(seg);
      }
    });

  const resolved = baseParts.join("/").replace(/\.md$/, "");
  return {
    path: `/view/docs/${resolved}`,
    hash: hash ? `#${hash}` : "",
  };
}

/** HTML 转义（搜索高亮等场景） */
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
