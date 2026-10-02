// 主题（亮 / 暗）管理。Arco Design 通过 body 上的 arco-theme 属性切换暗色，
// 文档站自己的样式全部走 CSS 变量（见 styles/vars.less），跟随该属性变化。
const STORAGE_KEY = "lumfall-docs-theme";

function apply(mode) {
  if (mode === "dark") {
    document.body.setAttribute("arco-theme", "dark");
  } else {
    document.body.removeAttribute("arco-theme");
  }
}

export function isDark() {
  return document.body.getAttribute("arco-theme") === "dark";
}

/** 进站时调用：优先用户上次选择，否则跟随系统偏好 */
export function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    // localStorage 不可用（如隐私模式）时只跟随系统
  }
  if (saved === "dark" || saved === "light") {
    apply(saved);
    return;
  }
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    apply("dark");
  }
}

/** 切换主题并持久化，返回切换后的模式 */
export function toggleTheme() {
  const next = isDark() ? "light" : "dark";
  apply(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch (e) {
    // 忽略持久化失败
  }
  return next;
}
