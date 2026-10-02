/**
 * 模板同步脚本：把模板源同步到本包 templates/ 下。
 *
 * 模板源：
 *   basic    —— 工作区同级 lumfall-basic-project 的当前工作区内容（cp 拷贝）
 *   document —— 工作区同级 lumfall-document 仓库的 template/empty 分支（git archive）
 *               该分支是"空文档站模板"（站点框架就绪、内容为占位页）；
 *               main 分支是自举的完整示例，不作为模板分发。
 *
 * 同步时排除工程运行产物与本地状态，保证脚手架生成的是"干净起点"：
 *   node_modules / app/public/dist / dist-static / logs / .git / .DS_Store /
 *   pnpm-lock.yaml（锁定文件不随模板分发，让用户安装到最新依赖）
 *
 * 用法：在本目录执行 pnpm sync（或 node scripts/sync-templates.js）。
 * 模板项目内容变更后重新执行即可。
 */
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const log = (message) => process.stdout.write(`${message}\n`);

const rootDir = path.join(__dirname, "..");
const templatesDir = path.join(rootDir, "templates");

const SOURCES = [
  { key: "basic", from: path.resolve(rootDir, "..", "lumfall-basic-project") },
  {
    key: "document",
    from: path.resolve(rootDir, "..", "lumfall-document"),
    ref: "template/empty", // 空文档模板所在分支
  },
];

const EXCLUDED = new Set([
  "node_modules",
  "logs",
  ".git",
  ".idea",
  ".vscode",
  ".DS_Store",
  "pnpm-lock.yaml",
]);

const isExcludedPath = (relative) => {
  const segments = relative.split(path.sep);
  if (segments.some((segment) => EXCLUDED.has(segment))) {
    return true;
  }
  // 构建产物目录（含按模式分目录的 dist/dev、dist/prod 与静态站点产物）
  const normalized = segments.join("/");
  return (
    normalized === "app/public/dist" ||
    normalized.startsWith("app/public/dist/") ||
    normalized === "dist-static" ||
    normalized.startsWith("dist-static/")
  );
};

const shouldExcludeDir = (dirPath, sourceRoot) => {
  const relative = path.relative(sourceRoot, dirPath);
  if (!relative || relative.startsWith("..")) return false;
  return isExcludedPath(relative);
};

const shouldExcludeFile = (filePath, sourceRoot) => {
  const relative = path.relative(sourceRoot, filePath);
  if (relative.startsWith("..")) return false;
  return isExcludedPath(relative);
};

const countFiles = (dir) =>
  fs.readdirSync(dir).reduce((sum, entry) => {
    const full = path.join(dir, entry);
    return sum + (fs.statSync(full).isDirectory() ? countFiles(full) : 1);
  }, 0);

const displayPath = (p) => path.relative(os.homedir(), p) || p;

fs.rmSync(templatesDir, { recursive: true, force: true });
fs.mkdirSync(templatesDir, { recursive: true });

for (const { key, from, ref } of SOURCES) {
  if (!fs.existsSync(from)) {
    throw new Error(`模板源不存在: ${from}（请在工作区根目录的相对位置保留模板项目）`);
  }

  const target = path.join(templatesDir, key);

  if (ref) {
    // 分支源：git archive 提取（分支内容已提交，天然不含 node_modules/构建产物）
    fs.mkdirSync(target, { recursive: true });
    execSync(`git -C "${from}" archive --format=tar "${ref}" | tar -x -C "${target}"`, {
      stdio: "inherit",
      shell: "/bin/bash",
    });
    // 归档后清理：lockfile 与系统文件不随模板分发
    const lockfile = path.join(target, "pnpm-lock.yaml");
    if (fs.existsSync(lockfile)) fs.rmSync(lockfile);
  } else {
    // 工作区源：直接拷贝 + 过滤
    fs.cpSync(from, target, {
      recursive: true,
      filter: (src) => {
        const stat = fs.statSync(src);
        return stat.isDirectory()
          ? !shouldExcludeDir(src, from)
          : !shouldExcludeFile(src, from);
      },
    });
  }

  log(`synced ${key}: ${displayPath(from)}${ref ? ` @ ${ref}` : ""} → templates/${key} (${countFiles(target)} files)`);
}

log("\n模板同步完成。发布前请确认 templates/ 内容符合预期（会被打进 npm 包）。");
