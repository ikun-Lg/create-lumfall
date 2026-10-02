// 站内搜索：对全部文档做轻量内存索引（标题 / 小节标题 / 正文），
// 返回带高亮摘要的结果。文档规模在几百页以内时体验足够，无需后端参与。
import { getAllDocs } from "./content";
import { slugify, escapeHtml } from "./utils";

let index = null;

/** 懒构建索引：文档内容在构建时已打进 bundle，这里只做文本预处理 */
function buildIndex() {
  if (index) {
    return index;
  }

  const all = getAllDocs();
  index = Object.entries(all).map(([docPath, source]) => {
    // 去掉代码块再提取文本，避免把代码当正文搜索
    const withoutCode = String(source).replace(/```[\s\S]*?```/g, " ");

    const headings = [];
    const headingRe = /^(#{2,3})\s+(.+?)\s*#*\s*$/gm;
    let match;
    while ((match = headingRe.exec(withoutCode))) {
      headings.push({
        level: match[1].length,
        text: match[2].replace(/[#*`]/g, "").trim(),
      });
    }

    const text = withoutCode
      .replace(/<[^>]+>/g, " ")
      .replace(/[#>*`~[\]()!_|:-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    return { docPath, headings, text };
  });

  return index;
}

function buildTitleMap(sidebar) {
  const map = {};
  (sidebar || []).forEach((group) => {
    (group.items || []).forEach((item) => {
      map[item.path.replace(/^\/view\/docs\//, "")] = item.text;
    });
  });
  return map;
}

/** 把关键词片段包上 <mark>，先转义再替换，保证安全 */
function highlight(text, keyword) {
  if (!keyword) {
    return escapeHtml(text);
  }
  const escaped = escapeHtml(text);
  const pattern = keyword
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  if (!pattern) {
    return escaped;
  }
  return escaped.replace(new RegExp(`(${pattern})`, "gi"), "<mark>$1</mark>");
}

/**
 * 搜索文档
 * @param {string} keyword 关键词，支持空格分词
 * @param {object} docsConfig 文档站配置（取侧边栏标题）
 * @returns {Array<{docPath, title, titleHtml, heading, anchor, snippet}>}
 */
export function searchDocs(keyword, docsConfig) {
  const terms = String(keyword || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!terms.length) {
    return [];
  }

  const titleMap = buildTitleMap(docsConfig.sidebar);
  const results = [];

  buildIndex().forEach(({ docPath, headings, text }) => {
    const title = titleMap[docPath] || docPath;
    const titleLower = title.toLowerCase();

    let score = 0;
    let matchedHeading = null;

    terms.forEach((term) => {
      if (titleLower.includes(term)) {
        score += 100;
      }
      // 中文场景：标题无空格分词，按整串 contains；正文按出现次数计分
      const occurrences = text.split(term).length - 1;
      score += occurrences;

      if (!matchedHeading) {
        const heading = headings.find((h) => h.text.toLowerCase().includes(term));
        if (heading) {
          matchedHeading = heading;
          score += 30;
        }
      }
    });

    if (score <= 0) {
      return;
    }

    // 摘要：取第一个命中的关键词前后各 70 字符
    let snippet = "";
    const firstTerm = terms[0];
    const pos = text.indexOf(firstTerm);
    if (pos >= 0) {
      const start = Math.max(0, pos - 70);
      const end = Math.min(text.length, pos + firstTerm.length + 70);
      snippet = `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${
        end < text.length ? "…" : ""
      }`;
    } else {
      snippet = text.slice(0, 140);
    }

    results.push({
      docPath,
      title,
      titleHtml: highlight(title, keyword),
      heading: matchedHeading ? matchedHeading.text : "",
      anchor: matchedHeading ? slugify(matchedHeading.text) : "",
      snippet: highlight(snippet, keyword),
      score,
    });
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}
