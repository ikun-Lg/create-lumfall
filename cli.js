#!/usr/bin/env node
/**
 * create-lumfall —— lumfall 应用脚手架。
 *
 * 用法：
 *   pnpm create lumfall [项目名] [-t basic|document]
 *   npm create lumfall  [项目名] [-t basic|document]
 *   npx create-lumfall  [项目名] [-t basic|document]
 *
 * 零依赖：参数缺省时用 readline 交互补齐；模板内嵌在本包 templates/ 下，
 * 生成即可 pnpm install && pnpm start:dev，不需要手动建目录。
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");

const TEMPLATES = [
  {
    key: "basic",
    alias: "b",
    name: "基础业务项目",
    desc: "目录约定 + 示例 API + 示例页面，一般业务从这里起步",
    selfName: "lumfall-basic-project",
  },
  {
    key: "document",
    alias: "d",
    name: "技术文档站",
    desc: "对标 VitePress 的文档站模板（导航/侧栏/搜索/暗色模式），内置 lumfall 文档内容",
    selfName: "lumfall-document",
  },
];

const NAME_PATTERN = /^[a-z][a-z0-9-_]*$/i;

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
  -t, --template <basic|document>   模板类型（basic=基础业务项目, document=技术文档站）
  -h, --help                        显示帮助
  -v, --version                     显示版本

示例:
  pnpm create lumfall my-app                # 交互式选择模板
  pnpm create lumfall my-app -t document    # 直接生成文档站
  npx create-lumfall admin -t basic`);
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

async function main() {
  const argv = process.argv.slice(2);
  const flags = { template: null };

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
    if (arg.startsWith("-")) {
      throw new Error(`未知选项 "${arg}"（--help 查看用法）`);
    }
    positional.push(arg);
  }

  const prompt = createPrompt();
  try {    // 1. 项目名
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

    // 3. 目标目录
    const targetDir = path.resolve(process.cwd(), projectName);
    if (!(await confirmOverwrite(prompt, targetDir))) {
      log("已取消。");
      return;
    }

    // 4. 拷贝模板 + 重写项目名
    const templateDir = path.join(__dirname, "templates", template.key);
    if (!fs.existsSync(templateDir)) {
      throw new Error(`模板缺失: ${template.key}（包可能未完整发布）`);
    }
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
    fs.cpSync(templateDir, targetDir, { recursive: true });
    rewriteSelfName(targetDir, template, projectName);

    log(`
✔ 已创建 ${template.name} 项目: ${projectName}
  模板: ${template.key}    位置: ${path.relative(os.homedir(), targetDir) || targetDir}

下一步:
  cd ${projectName}
  pnpm install
  pnpm start:dev        # 本地开发（前端 HMR + 服务）
  pnpm start:prod       # 生产构建 + 启动
${template.key === "document"
    ? `
文档站入口: http://localhost:3000/view/docs（站点配置在 app/pages/docs/docs-config.js）`
    : `
示例页面: http://localhost:3000/view/home（示例 API 在 app/ 下按目录约定组织）`}

详细用法见项目内 README.md。`);
  } finally {
    prompt.close();
  }
}

main().catch((error) => {
  log(`[create-lumfall] ${error.message}`);
  process.exitCode = 1;
});
