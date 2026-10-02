// markdown 文档内容加载器。
// 约定：文档放在项目根目录 docs/ 下（相对本文件 ../../../docs），
// 构建时全部按原始文本打进产物，页面按路径读取并渲染。
// 要调整内容目录位置时，只需要改 require.context 的第一个参数。
const context = require.context("../../../docs", true, /\.md$/);

const moduleMap = {};

context.keys().forEach((key) => {
  // key 形如 "./guide/introduction.md" → "guide/introduction"
  const docPath = key.replace(/^\.\//, "").replace(/\.md$/, "");
  const mod = context(key);
  moduleMap[docPath] = typeof mod === "string" ? mod : mod.default ?? mod;
});

/**
 * 按 docs/ 相对路径取 markdown 原文
 * @param {string} docPath 例如 "guide/introduction"
 * @returns {string|undefined}
 */
export function getDocSource(docPath) {
  return moduleMap[docPath];
}

/** 全部文档：{ "guide/introduction": "# ...", ... } */
export function getAllDocs() {
  return moduleMap;
}
