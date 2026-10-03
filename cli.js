#!/usr/bin/env node
/**
 * create-lumfall —— lumfall 应用脚手架。
 *
 * 用法：
 *   pnpm create lumfall [项目名] [-t basic|business|document]
 *   npm create lumfall  [项目名] [-t basic|business|document]
 *   npx create-lumfall  [项目名] [-t basic|business|document]
 *
 * 零依赖：参数缺省时用 readline 交互补齐。
 *
 * 模板不内置在 npm 包里，而是按注册表（TEMPLATES，见下）在生成时从 GitHub 拉取：
 * 优先 codeload tar.gz（无需 git），失败自动回退 `git clone --depth 1`。
 * 模板仓库更新后无需重发本包；`--repo` 可覆盖为 fork / 私有镜像。
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const https = require("https");
const readline = require("readline");
const { execFileSync } = require("child_process");

// ── 模板注册表：repo = GitHub owner/name，ref = 分支（可含 /，如 template/empty）──
const TEMPLATES = [
  {
    key: "basic",
    alias: "b",
    name: "基础业务项目",
    desc: "目录约定 + 示例 API + 示例页面，一般业务从这里起步",
    repo: "ikun-Lg/lumfall-basic-project",
    ref: "main",
    selfName: "lumfall-basic-project",
    hint: "示例页面: http://localhost:3000/view/home（示例 API 在 app/ 下按目录约定组织）",
  },
  {
    key: "business",
    alias: "biz",
    name: "B 端全栈管理台（电商 + 课程双系统）",
    desc: "管理台 SPA + JWT 登录 + DSL 驱动菜单 + schema CRUD，内置双业务系统演示数据",
    repo: "ikun-Lg/lumfall-business",
    ref: "master",
    selfName: "lumfall-business",
    hint: `管理台: http://localhost:3000/view/admin（默认账号 admin / 123456，普通用户 user / 123456）
项目列表: http://localhost:3000/view/project-list（顶栏可切换电商 / 课程系统）`,
  },
  {
    key: "document",
    alias: "d",
    name: "技术文档站（空模板）",
    desc: "导航/侧栏/搜索/主题就绪，生成后放入自己的内容即可",
    repo: "ikun-Lg/lumfall-document",
    ref: "template/empty",
    selfName: "lumfall-document",
    hint: "文档站入口: http://localhost:3000/view/docs（站点配置在 app/pages/docs/docs-config.js）",
  },
];

// 同步进生成目录时需要剔除的文件（lockfile 不随模板分发，安装时取最新依赖）
const EXCLUDED_NAMES = new Set(["pnpm-lock.yaml", ".DS_Store", "node_modules", ".git"]);

const NAME_PATTERN = /^[a-z][a-z0-9-_]*$/i;
const REPO_PATTERN = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/;

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
}

/**
 * 统一问答入口：TTY 用 readline 逐行交互；
 * 非交互（管道/CI）一次性读入 stdin，按行作为答案，避免 EOF 导致挂起。
 */
function createPrompt() {
  if (process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return {
      question: (question) => ask(rl, question),
      close: () => rl.close(),
    };
  }

  let buffered = null;
  let cursor = 0;
  return {
    question: (question) => {
      if (buffered === null) {
        try {
          buffered = fs.readFileSync(0, "utf8").split(/\r?\n/).map((line) => line.trim());
        } catch (e) {
          buffered = [];
        }
      }
      process.stdout.write(question);
      const answer = buffered[cursor++] ?? "";
      process.stdout.write(`${answer}\n`);
      return Promise.resolve(answer);
    },
    close: () => {},
  };
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function printHelp() {
  log(`create-lumfall —— lumfall 应用脚手架

用法:
  pnpm create lumfall [项目名] [选项]
  npx create-lumfall [项目名] [选项]

选项:
  -t, --template <${TEMPLATES.map((t) => t.key).join("|")}>
                                    模板类型
  -r, --repo <owner/name>           覆盖模板仓库（fork / 私有镜像 / 离线自建）
  -h, --help                        显示帮助
  -v, --version                     显示版本

模板:
${TEMPLATES.map((t) => `  ${t.key.padEnd(10)} ${t.name} —— ${t.desc}`).join("\n")}

说明:
  模板在生成时从 GitHub 拉取（${TEMPLATES.map((t) => t.repo).join(", ")}），
  需要网络；无 git 亦可用（优先走 tar.gz），失败自动回退 git clone。

示例:
  pnpm create lumfall my-app                # 交互式选择模板
  pnpm create lumfall my-app -t business    # 生成 B 端管理台
  pnpm create lumfall my-doc -t document    # 生成文档站
  pnpm create lumfall my-app -t basic -r your-name/lumfall-basic-project`);
}

function resolveTemplate(flagValue) {
  if (!flagValue) return null;
  const value = String(flagValue).toLowerCase();
  return TEMPLATES.find((t) => t.key === value || t.alias === value) || null;
}

/** 目录非空时覆盖确认；返回是否继续 */
async function confirmOverwrite(prompt, targetDir) {
  const entries = fs.existsSync(targetDir) ? fs.readdirSync(targetDir) : [];
  if (entries.length === 0) return true;

  const answer = await prompt.question(`目录 "${targetDir}" 非空，是否覆盖写入？(y/N) `);
  return answer.toLowerCase() === "y";
}

/** 把模板内的自指名称替换为用户项目名（package.json / server.js / config / README） */
function rewriteSelfName(targetDir, template, projectName) {
  const files = [
    "package.json",
    "server.js",
    path.join("config", "config.default.js"),
    "README.md",
  ];
  for (const relative of files) {
    const file = path.join(targetDir, relative);
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    fs.writeFileSync(file, content.split(template.selfName).join(projectName));
  }
}

// ── 模板拉取 ────────────────────────────────────────────────

/** 跟随重定向下载 URL 到本地文件（最多 5 跳），HTTP 状态非 200 时报错并附响应片段 */
function downloadFile(url, destFile, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      { headers: { "user-agent": "create-lumfall", accept: "*/*" }, timeout: 30000 },
      (response) => {
        const { statusCode, headers } = response;

        if (statusCode >= 300 && statusCode < 400 && headers.location) {
          response.resume();
          if (redirectsLeft <= 0) {
            reject(new Error(`${url} 重定向次数过多`));
            return;
          }
          const next = new URL(headers.location, url).toString();
          resolve(downloadFile(next, destFile, redirectsLeft - 1));
          return;
        }

        if (statusCode !== 200) {
          let body = "";
          response.on("data", (chunk) => {
            if (body.length < 200) body += chunk.toString();
          });
          response.on("end", () => {
            reject(new Error(`HTTP ${statusCode}${body ? `：${body.trim().slice(0, 160)}` : ""}`));
          });
          return;
        }

        const file = fs.createWriteStream(destFile);
        response.pipe(file);
        file.on("finish", () => file.close(() => resolve(destFile)));
        file.on("error", reject);
      }
    );
    request.on("timeout", () => request.destroy(new Error("请求超时（30s）")));
    request.on("error", reject);
  });
}

/** 解包 tar.gz 到指定目录（依赖系统 tar：macOS/Linux/Win10+ 均自带） */
function extractTarball(tarballPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  execFileSync("tar", ["-xzf", tarballPath, "-C", destDir], { stdio: "pipe" });
}

/** 从 GitHub 拉取模板到临时目录，返回仓库内容根目录 */
async function fetchTemplate({ repo, ref, workDir }) {
  // 方案一：codeload tar.gz（无需 git，包体最小）
  try {
    const tarball = path.join(workDir, "template.tar.gz");
    const url = `https://codeload.github.com/${repo}/tar.gz/refs/heads/${ref}`;
    log(`  拉取 https://github.com/${repo} (${ref}) ...`);
    await downloadFile(url, tarball);
    const extractDir = path.join(workDir, "extract");
    extractTarball(tarball, extractDir);
    // tar 包顶层是唯一目录（<repo>-<ref>），其内容才是模板根
    const topLevel = fs.readdirSync(extractDir).filter((name) => name !== ".DS_Store");
    if (topLevel.length !== 1) {
      throw new Error(`tar 包结构异常（顶层 ${topLevel.length} 个目录）`);
    }
    return path.join(extractDir, topLevel[0]);
  } catch (tarballError) {
    log(`  tar.gz 拉取失败（${tarballError.message}），回退 git clone ...`);
  }

  // 方案二：git clone（复用 git 的代理 / 凭据配置）
  const cloneDir = path.join(workDir, "clone");
  try {
    execFileSync(
      "git",
      ["clone", "--depth", "1", "--branch", ref, `https://github.com/${repo}.git`, cloneDir],
      { stdio: "pipe" }
    );
    return cloneDir;
  } catch (gitError) {
    const detail = String(gitError.stderr || gitError.message).trim().split("\n").slice(-2).join(" ");
    throw new Error(
      `无法获取模板仓库 ${repo}@${ref}：\n` +
        `  - 请确认网络可访问 GitHub（或配置 git 代理）\n` +
        `  - 请确认仓库存在且分支 "${ref}" 已推送\n` +
        `  - git: ${detail}`
    );
  }
}

/** 把模板内容拷贝到目标目录（剔除 lockfile / 系统文件 / 版本控制目录） */
function copyTemplate(sourceRoot, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(sourceRoot, targetDir, {
    recursive: true,
    filter: (src) => !EXCLUDED_NAMES.has(path.basename(src)),
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const flags = { template: null, repo: null };

  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      printHelp();
      return;
    }
    if (arg === "-v" || arg === "--version") {
      log(require("./package.json").version);
      return;
    }
    if (arg === "-t" || arg === "--template") {
      flags.template = argv[++i];
      continue;
    }
    if (arg === "-r" || arg === "--repo") {
      flags.repo = argv[++i];
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`未知选项 "${arg}"（--help 查看用法）`);
    }
    positional.push(arg);
  }

  const prompt = createPrompt();
  let workDir = null;
  try {
    // 1. 项目名
    let projectName = positional[0];
    if (!projectName) {
      projectName = await prompt.question("项目名称（用作目录名，如 my-app）: ");
    }
    projectName = projectName.replace(/\s+/g, "-").toLowerCase();
    if (!NAME_PATTERN.test(projectName)) {
      throw new Error(`项目名 "${projectName}" 不合法：字母开头，只能含字母/数字/-/_`);
    }

    // 2. 模板
    let template = resolveTemplate(flags.template);
    if (!template) {
      log("\n选择模板:");
      TEMPLATES.forEach((item, index) => {
        log(`  ${index + 1}. ${item.name}（${item.key}）—— ${item.desc}`);
      });
      const choice = await prompt.question("输入编号 [1]: ");
      const index = (parseInt(choice, 10) || 1) - 1;
      template = TEMPLATES[index];
      if (!template) {
        throw new Error(`无效的模板编号 "${choice}"`);
      }
    }

    // 2.1 --repo 覆盖（fork / 私有镜像 / 离线自建仓库）
    let repo = template.repo;
    if (flags.repo) {
      if (!REPO_PATTERN.test(flags.repo)) {
        throw new Error(`--repo "${flags.repo}" 不合法：格式为 owner/name`);
      }
      repo = flags.repo;
    }

    // 3. 目标目录
    const targetDir = path.resolve(process.cwd(), projectName);
    if (!(await confirmOverwrite(prompt, targetDir))) {
      log("已取消。");
      return;
    }

    // 4. 从 GitHub 拉取模板 → 拷贝 → 重写项目名
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-lumfall-"));
    const sourceRoot = await fetchTemplate({ repo, ref: template.ref, workDir });
    copyTemplate(sourceRoot, targetDir);

    if (!fs.existsSync(path.join(targetDir, "server.js"))) {
      log("⚠ 仓库内容未包含 server.js，可能不是 lumfall 模板仓库，请留意产物。");
    }
    rewriteSelfName(targetDir, template, projectName);

    log(`
✔ 已创建 ${template.name} 项目: ${projectName}
  模板: ${template.key}    仓库: ${repo}@${template.ref}    位置: ${path.relative(os.homedir(), targetDir) || targetDir}

下一步:
  cd ${projectName}
  pnpm install
  pnpm start:dev        # 本地开发（前端 HMR + 服务）
  pnpm start:prod       # 生产构建 + 启动
${template.hint}

详细用法见项目内 README.md。`);
  } finally {
    prompt.close();
    if (workDir) {
      try {
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch (e) {
        // 临时目录清理失败不影响结果
      }
    }
  }
}

main().catch((error) => {
  log(`[create-lumfall] ${error.message}`);
  process.exitCode = 1;
});
