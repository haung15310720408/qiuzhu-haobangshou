import { execFile, spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { copyFile, mkdir, readdir, readFile, rm, stat, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const DEEPSEEK_URL = process.env.DEEPSEEK_URL || "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const ARK_URL = process.env.ARK_URL || "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
const DEFAULT_ARK_MODEL = process.env.ARK_MODEL || "doubao-seed-2-1-turbo-260628";
const NODE = process.env.NODE || process.execPath;
const HOME_DIR = process.env.HOME || process.cwd();
const BB_BROWSER = process.env.BB_BROWSER || "bb-browser";
const BB_BROWSER_CDP_PORT = Number(process.env.BB_BROWSER_CDP_PORT || 9223);
const BB_BROWSER_PROFILE_DIR = process.env.BB_BROWSER_PROFILE_DIR || path.join(HOME_DIR, ".bb-browser", "workbench-profile");
const CHROME_EXECUTABLE = process.env.CHROME_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PYTHON = process.env.PYTHON || "python3";
const DATABASE_URL = process.env.DATABASE_URL || "postgres://deepseek:deepseek_bb_password@127.0.0.1:5432/deepseek_bb";
const GEEKRUN_SEARCH_SCRIPT = process.env.GEEKRUN_SEARCH_SCRIPT || path.join(__dirname, "geekrun_search_jobs.mjs");
const JOB51_SEARCH_SCRIPT = process.env.JOB51_SEARCH_SCRIPT || path.join(__dirname, "job51_search_jobs.mjs");
const GEEKRUN_DIR = process.env.GEEKRUN_DIR || path.join(__dirname, "vendor", "geekrun");
const GEEKRUN_PROFILE_DIR = process.env.GEEKRUN_USER_DATA_DIR || path.join(HOME_DIR, ".geekgeekrun", "chrome-profile");
const JOB51_PROFILE_DIR = process.env.JOB51_USER_DATA_DIR || path.join(HOME_DIR, ".geekgeekrun", "chrome-profile-51job");
const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || path.join(HOME_DIR, "Downloads");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const TASKS_DIR = path.join(__dirname, "tasks");
const MAX_STEPS = process.env.MAX_STEPS ? Number(process.env.MAX_STEPS) : Infinity;
const TOOL_TIMEOUT_MS = Number(process.env.TOOL_TIMEOUT_MS || 45000);
const DEEPSEEK_TIMEOUT_MS = Number(process.env.DEEPSEEK_TIMEOUT_MS || 90000);
const TOOL_OUTPUT_LIMIT = Number(process.env.TOOL_OUTPUT_LIMIT || 12000);
const INGEST_POLL_MS = Number(process.env.INGEST_POLL_MS || 15000);
const sessions = new Map();
const activeRuns = new Map();
let pgPool = null;
let bbBrowserEnsurePromise = null;
const ingestState = { enabled: false, timer: null, taskId: null, sinceMs: null, lastScan: null, lastResult: null };
let dbAgentChild = null;
let job51AgentChild = null;
const dbAgentState = {
  running: false,
  stopRequested: false,
  current: null,
  processed: 0,
  startedAt: null,
  finishedAt: null,
  lastError: null,
  logs: [],
};
const job51AgentState = {
  running: false,
  stopRequested: false,
  current: null,
  processed: 0,
  startedAt: null,
  finishedAt: null,
  lastError: null,
  logs: [],
};
const jobScreenState = {
  running: false,
  stopRequested: false,
  currentBatch: null,
  processed: 0,
  batches: 0,
  startedAt: null,
  finishedAt: null,
  lastError: null,
  logs: [],
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

const systemPrompt = `你是一个可以操控用户本机 Chrome 的浏览器代理。
你通过 bb-browser 工具工作。目标是完成用户指令，同时尽量节省 token。

工作原则：
1. 先用 browser_status 或 browser_tab_list 判断当前浏览器状态。
2. 打开网页后优先用 browser_get、browser_eval、browser_site 获取精确内容；只有需要定位按钮/输入框时才用 browser_snapshot。
3. snapshot 默认只取 interactive/compact/depth，避免读取整页 DOM。
4. 点击或填写前必须先通过 snapshot 找到正确 ref，比如 @3。
5. 如果工具返回内容被截断，换用更精确的 selector、eval 或 site adapter。
6. 对涉及登录的网站，提醒用户需要先在 Chrome 里登录。
7. 下载按钮或疑似下载操作每个任务最多点击一次。点击后先检查结果，不要反复点击同一个下载按钮。
8. 如果 Chrome 浏览器自身出现“文件可能有危险/是否保留/丢弃”等安全提示，停止操作并提醒用户手动选择；不要尝试绕过安全拦截。
9. 处理企业招聘任务时，必须优先用 db_claim_next_company 每次只领取 1 家企业；领取后这家企业今天不会再次返回。找到岗位用 db_add_job，没找到近期岗位用 db_update_company 标记 no_recent_jobs，并用 db_add_note 记录查过的来源和证据。
10. 投递简历前必须让用户确认；确认后再辅助打开页面、填写、提交，并用 db_add_application 记录状态。
11. 通过本程序下载的文件会自动入库到当前任务，可用 db_recent_downloads 查看最近入库文件；下载后可等待几秒再读取。
12. 不要泄露 API Key，不要尝试读取本地敏感文件。
13. 发送验证码、提交表单、投递简历等有外部影响的操作，点击后必须再次检查页面状态或网络结果。发送验证码只有在按钮进入倒计时/禁用状态、页面出现明确成功提示、或短信接口返回成功时，才能回复“验证码已发送”；若没有这些证据，必须回复“已尝试但未确认发送成功”，并说明手机号输入、协议勾选、验证码拦截或页面报错等实际状态。不得仅凭点击动作声称成功。`;

const tools = [
  {
    type: "function",
    function: {
      name: "browser_status",
      description: "查看 bb-browser daemon 状态和当前 Chrome 连接状态。",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_daemon",
      description: "启动、停止或查看 bb-browser daemon。",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["start", "stop", "status"], description: "daemon 操作" },
        },
        required: ["action"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_tab_list",
      description: "列出当前 Chrome 标签页。",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_open",
      description: "打开 URL。默认新建标签页；tab 为 current 时在当前标签打开。",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "要打开的网址" },
          tab: { type: "string", description: "可选：current 或具体 tab id" },
        },
        required: ["url"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_snapshot",
      description: "读取页面快照，用于找按钮/输入框 ref。复杂网页会消耗较多 token。",
      parameters: {
        type: "object",
        properties: {
          tab: { type: "string", description: "tab id；可省略使用当前标签" },
          interactive: { type: "boolean", description: "只返回可交互元素，默认 true" },
          compact: { type: "boolean", description: "压缩空节点，默认 true" },
          depth: { type: "integer", minimum: 1, maximum: 8, description: "树深度，默认 4" },
          selector: { type: "string", description: "CSS selector，仅抓取局部区域" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_click",
      description: "点击 snapshot 中的元素 ref，比如 @3。",
      parameters: {
        type: "object",
        properties: {
          ref: { type: "string", description: "元素 ref，如 @3" },
          tab: { type: "string", description: "tab id" },
        },
        required: ["ref"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_fill",
      description: "向输入框填入文本。",
      parameters: {
        type: "object",
        properties: {
          ref: { type: "string", description: "输入框 ref，如 @5" },
          text: { type: "string", description: "要填入的文本" },
          tab: { type: "string", description: "tab id" },
        },
        required: ["ref", "text"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_press",
      description: "发送按键，比如 Enter、Escape、Meta+L。",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", description: "按键名称" },
          tab: { type: "string", description: "tab id" },
        },
        required: ["key"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_scroll",
      description: "滚动页面。",
      parameters: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["up", "down", "left", "right"], description: "滚动方向" },
          pixels: { type: "integer", minimum: 1, maximum: 5000, description: "滚动像素" },
          tab: { type: "string", description: "tab id" },
        },
        required: ["direction"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_get",
      description: "获取当前页面 title/url/text/html/value 等内容。比 snapshot 更省 token。",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["title", "url", "text", "html", "value"], description: "获取类型" },
          ref: { type: "string", description: "可选元素 ref，如 @3" },
          tab: { type: "string", description: "tab id" },
        },
        required: ["kind"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_eval",
      description: "在页面中执行 JavaScript，适合精确提取数据。避免返回过大内容。",
      parameters: {
        type: "object",
        properties: {
          script: { type: "string", description: "要执行的 JS 表达式或代码" },
          tab: { type: "string", description: "tab id" },
          domain: { type: "string", description: "按域名选择标签页，例如 github.com" },
        },
        required: ["script"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_site",
      description: "运行 bb-browser 社区 site adapter，例如 zhihu/hot、arxiv/search、github/search。也可 command=list/info/update。",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "adapter 名称或 list/info/update" },
          args: { type: "array", items: { type: "string" }, description: "传给 adapter 的参数" },
          jq: { type: "string", description: "可选 jq 过滤表达式" },
        },
        required: ["command"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_screenshot",
      description: "截取当前页面截图，返回保存路径。",
      parameters: {
        type: "object",
        properties: {
          tab: { type: "string", description: "tab id" },
          filename: { type: "string", description: "可选文件名，如 page.png" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_wait",
      description: "等待若干秒，让页面加载或动画完成。",
      parameters: {
        type: "object",
        properties: {
          seconds: { type: "number", minimum: 0.2, maximum: 10 },
        },
        required: ["seconds"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "db_status",
      description: "查看招聘数据库状态、表数量和下载入库状态。",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "db_search_companies",
      description: "按公司名、城市、备注搜索企业库。",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "搜索关键词" },
          limit: { type: "integer", minimum: 1, maximum: 50 },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "db_get_next_companies",
      description: "领取下一批待检查招聘状态的企业。默认只领取 1 家；领取后当天不会再次返回。推荐优先使用 db_claim_next_company。",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "默认 new，也可以 searching/error/no_recent_jobs 等" },
          limit: { type: "integer", minimum: 1, maximum: 100 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "db_claim_next_company",
      description: "领取下一家今天还没处理过的企业。返回 exhausted=true 表示今天已经轮完，不能继续读取新企业。",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "默认 new；也可领取 searching/error/no_recent_jobs 等状态" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "db_update_company",
      description: "更新企业招聘状态和备注。公司不存在时会自动创建。",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "公司名称" },
          hiring_status: { type: "string", description: "new/searching/actively_hiring/possibly_hiring/no_recent_jobs/skipped/error 等" },
          notes: { type: "string", description: "备注" },
          city: { type: "string" },
          industry: { type: "string" },
          website: { type: "string" },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "db_add_job",
      description: "给企业写入一个招聘岗位记录。",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string" },
          title: { type: "string" },
          location: { type: "string" },
          salary: { type: "string" },
          education: { type: "string" },
          experience: { type: "string" },
          description: { type: "string" },
          apply_url: { type: "string" },
          source_platform: { type: "string" },
          source_url: { type: "string" },
          status: { type: "string" },
          fit_score: { type: "number" },
          evidence_text: { type: "string" },
        },
        required: ["company_name", "title"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "db_add_note",
      description: "给企业或岗位添加备注。",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string" },
          content: { type: "string" },
          note_type: { type: "string", description: "general/recruiting/apply/contact/fit 等" },
        },
        required: ["company_name", "content"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "db_search_jobs",
      description: "搜索岗位库。",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          status: { type: "string" },
          limit: { type: "integer", minimum: 1, maximum: 50 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "db_update_job_status",
      description: "更新岗位状态、匹配分和备注。",
      parameters: {
        type: "object",
        properties: {
          job_id: { type: "integer" },
          status: { type: "string", description: "found/reviewed/suitable/unsuitable/applied/expired 等" },
          fit_score: { type: "number" },
          notes: { type: "string" },
        },
        required: ["job_id", "status"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "db_add_application",
      description: "写入投递记录。真正提交简历前建议先让用户确认。",
      parameters: {
        type: "object",
        properties: {
          job_id: { type: "integer" },
          resume_version: { type: "string" },
          status: { type: "string", description: "draft/submitted/failed/interview/rejected/offer" },
          account_used: { type: "string" },
          notes: { type: "string" },
        },
        required: ["job_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "db_recent_downloads",
      description: "查看最近自动入库的下载文件。",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "integer", minimum: 1, maximum: 50 },
        },
        additionalProperties: false,
      },
    },
  },
];

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 30_000_000) throw new Error("request body too large");
  }
  return body ? JSON.parse(body) : {};
}

function truncate(text, limit = TOOL_OUTPUT_LIMIT) {
  const value = String(text ?? "");
  if (value.length <= limit) return value;
  return value.slice(0, limit) + `\n\n[输出已截断：${value.length} chars > ${limit} chars。请用 selector/eval/jq 获取更小范围。]`;
}

function createRunContext(sessionId) {
  const previous = activeRuns.get(sessionId);
  if (previous) previous.cancel("新的请求已开始");

  const context = {
    sessionId,
    controller: new AbortController(),
    children: new Set(),
    clickedRefs: new Set(),
    downloadIngestSinceMs: Date.now() - 5000,
    cancelled: false,
    reason: "",
    cancel(reason = "用户暂停执行") {
      this.cancelled = true;
      this.reason = reason;
      this.controller.abort();
      for (const child of this.children) {
        if (!child.killed) child.kill("SIGTERM");
      }
    },
  };
  activeRuns.set(sessionId, context);
  return context;
}

function assertNotCancelled(context) {
  if (context?.cancelled || context?.controller.signal.aborted) {
    throw new Error(context?.reason || "执行已暂停");
  }
}

async function readCdpJson(pathname) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(`http://127.0.0.1:${BB_BROWSER_CDP_PORT}${pathname}`, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function createCdpPageTarget() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`http://127.0.0.1:${BB_BROWSER_CDP_PORT}/json/new?about%3Ablank`, {
      method: "PUT",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function ensureBbBrowserTargetInner() {
  let version = await readCdpJson("/json/version");
  if (!version) {
    if (!existsSync(CHROME_EXECUTABLE)) {
      throw new Error(`找不到 Chrome：${CHROME_EXECUTABLE}`);
    }
    await mkdir(BB_BROWSER_PROFILE_DIR, { recursive: true });
    const child = spawn(
      CHROME_EXECUTABLE,
      [
        `--remote-debugging-port=${BB_BROWSER_CDP_PORT}`,
        `--user-data-dir=${BB_BROWSER_PROFILE_DIR}`,
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-session-crashed-bubble",
        "--hide-crash-restore-bubble",
        "about:blank",
      ],
      { detached: true, stdio: "ignore" },
    );
    child.unref();
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      await sleep(250);
      version = await readCdpJson("/json/version");
      if (version) break;
    }
    if (!version) throw new Error(`工作台 Chrome 未能在 CDP 端口 ${BB_BROWSER_CDP_PORT} 启动`);
  }

  let targets = await readCdpJson("/json/list");
  const hasPage = Array.isArray(targets) && targets.some((target) => target?.type === "page");
  if (!hasPage) {
    await createCdpPageTarget();
    await sleep(300);
    targets = await readCdpJson("/json/list");
  }
  if (!Array.isArray(targets) || !targets.some((target) => target?.type === "page")) {
    throw new Error(`Chrome 已连接到 ${BB_BROWSER_CDP_PORT}，但无法创建页面 target`);
  }
}

async function ensureBbBrowserTarget() {
  if (!bbBrowserEnsurePromise) {
    bbBrowserEnsurePromise = ensureBbBrowserTargetInner().finally(() => {
      bbBrowserEnsurePromise = null;
    });
  }
  return bbBrowserEnsurePromise;
}

async function runBb(args, options = {}, context) {
  assertNotCancelled(context);
  const stoppingDaemon = args[0] === "daemon" && args[1] === "stop";
  if (!stoppingDaemon) await ensureBbBrowserTarget();
  const commandArgs = args.includes("--port") ? args : [...args, "--port", String(BB_BROWSER_CDP_PORT)];
  return new Promise((resolve) => {
    const started = Date.now();
    const child = execFile(BB_BROWSER, commandArgs, { timeout: options.timeout || TOOL_TIMEOUT_MS }, (error, stdout, stderr) => {
      const elapsedMs = Date.now() - started;
      context?.children.delete(child);
      context?.controller.signal.removeEventListener("abort", onAbort);
      resolve({
        ok: !error && !context?.cancelled,
        cancelled: Boolean(context?.cancelled),
        command: `bb-browser ${commandArgs.join(" ")}`,
        exitCode: error?.code ?? 0,
        signal: error?.signal ?? null,
        elapsedMs,
        output: context?.cancelled
          ? truncate([stdout, stderr, context.reason || "执行已暂停"].filter(Boolean).join("\n"))
          : truncate([stdout, stderr].filter(Boolean).join("\n")),
      });
    });

    function onAbort() {
      if (!child.killed) child.kill("SIGTERM");
    }

    context?.children.add(child);
    context?.controller.signal.addEventListener("abort", onAbort, { once: true });
    if (context?.cancelled) onAbort();
  });
}

function runBossBrowser(args, options = {}, context) {
  return runBb(args, options, context);
}

function runGeekrunJson(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      NODE,
      [GEEKRUN_SEARCH_SCRIPT, ...args],
      {
        timeout: options.timeout || 180000,
        maxBuffer: options.maxBuffer || 64 * 1024 * 1024,
        env: {
          ...process.env,
          GEEKRUN_DIR,
          GEEKRUN_USER_DATA_DIR: GEEKRUN_PROFILE_DIR,
        },
      },
      (error, stdout, stderr) => {
        const text = String(stdout || "").trim();
        const jsonLine = text.split(/\n+/).reverse().find((line) => line.trim().startsWith("{"));
        if (!jsonLine) {
          reject(new Error(`GeekRun 没有返回 JSON：${[stdout, stderr, error?.message].filter(Boolean).join("\n").slice(0, 2000)}`));
          return;
        }
        try {
          const data = JSON.parse(jsonLine);
          resolve({ ...data, stderr: String(stderr || ""), exitCode: error?.code ?? 0 });
        } catch (parseError) {
          reject(new Error(`GeekRun JSON 解析失败：${parseError.message}; output=${text.slice(0, 2000)}`));
        }
      },
    );
    dbAgentChild = child;
    child.once("exit", () => {
      if (dbAgentChild === child) dbAgentChild = null;
    });
  });
}

function runJob51Json(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      NODE,
      [JOB51_SEARCH_SCRIPT, ...args],
      {
        timeout: options.timeout || 180000,
        maxBuffer: options.maxBuffer || 64 * 1024 * 1024,
        env: {
          ...process.env,
          GEEKRUN_DIR,
          JOB51_USER_DATA_DIR: JOB51_PROFILE_DIR,
        },
      },
      (error, stdout, stderr) => {
        const text = String(stdout || "").trim();
        const jsonLine = text.split(/\n+/).reverse().find((line) => line.trim().startsWith("{"));
        if (!jsonLine) {
          reject(new Error(`前程无忧没有返回 JSON：${[stdout, stderr, error?.message].filter(Boolean).join("\n").slice(0, 2000)}`));
          return;
        }
        try {
          const data = JSON.parse(jsonLine);
          resolve({ ...data, stderr: String(stderr || ""), exitCode: error?.code ?? 0 });
        } catch (parseError) {
          reject(new Error(`前程无忧 JSON 解析失败：${parseError.message}; output=${text.slice(0, 2000)}`));
        }
      },
    );
    job51AgentChild = child;
    child.once("exit", () => {
      if (job51AgentChild === child) job51AgentChild = null;
    });
  });
}

function runJsonCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: options.timeout || 120000, maxBuffer: options.maxBuffer || 50 * 1024 * 1024 }, (error, stdout, stderr) => {
      let data;
      try {
        data = JSON.parse(stdout || "{}");
      } catch (parseError) {
        reject(new Error(`无法解析命令输出: ${parseError.message}; stderr=${stderr}`));
        return;
      }
      if (error || data.ok === false) {
        reject(new Error(data.error || stderr || error?.message || "命令执行失败"));
        return;
      }
      resolve(data);
    });
  });
}

function withTab(args, tab) {
  if (tab) args.push("--tab", String(tab));
  return args;
}

function safeName(name) {
  return String(name || `shot-${Date.now()}.png`).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function safeTaskId(sessionId) {
  return safeName(sessionId || randomUUID()).slice(0, 80);
}

function taskDirFor(sessionId) {
  return path.join(TASKS_DIR, safeTaskId(sessionId));
}

async function ensureTaskSession(sessionId, title = "") {
  const taskId = safeTaskId(sessionId);
  const taskDir = taskDirFor(taskId);
  await mkdir(path.join(taskDir, "downloads"), { recursive: true });
  await mkdir(path.join(taskDir, "uploads"), { recursive: true });

  dbQuery(
    `INSERT INTO task_sessions (id, title, task_dir, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (id) DO UPDATE SET
       title = coalesce(nullif(EXCLUDED.title, ''), task_sessions.title),
       updated_at = now()
     RETURNING id`,
    [taskId, title, taskDir],
  ).catch(() => {});

  return { taskId, taskDir, downloadsDir: path.join(taskDir, "downloads") };
}

async function appendTaskMessage(sessionId, role, content, metadata = {}) {
  const task = await ensureTaskSession(sessionId);
  const entry = {
    role,
    content: content || "",
    metadata,
    created_at: new Date().toISOString(),
  };
  await writeFile(path.join(task.taskDir, "conversation.jsonl"), `${JSON.stringify(entry)}\n`, { flag: "a" });
  dbQuery(
    `INSERT INTO task_messages (task_id, role, content, metadata)
     VALUES ($1, $2, $3, $4)`,
    [task.taskId, role, content || "", JSON.stringify(metadata || {})],
  ).catch(() => {});
}

async function getPool() {
  if (pgPool) return pgPool;
  const { Pool } = await import("pg");
  pgPool = new Pool({ connectionString: DATABASE_URL });
  return pgPool;
}

async function dbQuery(sql, params = []) {
  const pool = await getPool();
  return pool.query(sql, params);
}

async function withDbClient(fn) {
  const pool = await getPool();
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

async function getDbCounts() {
  const result = await dbQuery(`
    SELECT
      (SELECT count(*)::int FROM companies) AS companies,
      (SELECT count(*)::int FROM jobs) AS jobs,
      (SELECT count(*)::int FROM applications) AS applications,
      (SELECT count(*)::int FROM downloaded_files) AS downloaded_files,
      (SELECT count(*)::int FROM companies WHERE hiring_status = 'new' AND (last_ai_read_date IS NULL OR last_ai_read_date < CURRENT_DATE)) AS claimable_today,
      (SELECT count(*)::int FROM companies WHERE last_ai_read_date = CURRENT_DATE) AS claimed_today,
      (SELECT count(*)::int FROM companies WHERE last_ai_write_date = CURRENT_DATE) AS written_today,
      (SELECT coalesce(jsonb_object_agg(hiring_status, total), '{}'::jsonb)
       FROM (
         SELECT hiring_status, count(*)::int AS total
         FROM companies
         GROUP BY hiring_status
       ) status_counts) AS status_counts,
      (SELECT coalesce(jsonb_object_agg(hiring_status, total), '{}'::jsonb)
       FROM (
         SELECT hiring_status, count(*)::int AS total
         FROM companies
         WHERE last_ai_read_date IS NULL OR last_ai_read_date < CURRENT_DATE
         GROUP BY hiring_status
       ) claimable_counts) AS claimable_by_status,
      (SELECT coalesce(jsonb_object_agg(status, total), '{}'::jsonb)
       FROM (
         SELECT status, count(*)::int AS total
         FROM jobs
         GROUP BY status
       ) job_status_counts) AS job_status_counts,
      (SELECT coalesce(jsonb_object_agg(coalesce(ai_screen_status, 'pending'), total), '{}'::jsonb)
       FROM (
         SELECT coalesce(ai_screen_status, 'pending') AS ai_screen_status, count(*)::int AS total
         FROM jobs
         GROUP BY coalesce(ai_screen_status, 'pending')
       ) job_screen_counts) AS job_screen_counts,
      (SELECT count(*)::int FROM jobs WHERE coalesce(ai_screen_status, 'pending') = 'pending') AS screenable_jobs
  `);
  return result.rows[0];
}

function normalizeCompanyName(name) {
  return String(name || "").toLowerCase().replace(/\s+/g, "");
}

function looksLikeBadCompanyName(name) {
  const compact = normalizeCompanyName(name).replace(/[（）()【】\[\]·,，.。:：;；、\-_/\\]/g, "");
  if (!compact) return true;
  if (compact.length > 34) {
    for (let size = 2; size <= 6; size += 1) {
      for (let index = 0; index <= compact.length - size * 3; index += 1) {
        const part = compact.slice(index, index + size);
        if (part && compact.slice(index, index + size * 3) === part.repeat(3)) return true;
      }
    }
  }
  return /(环保科技){2,}|(科技环保){2,}|(环保){4,}|(科技){5,}/.test(compact);
}

function pickField(row, candidates) {
  for (const key of Object.keys(row)) {
    const normalized = key.trim().toLowerCase().replace(/\s+/g, "");
    if (candidates.includes(normalized)) {
      const value = String(row[key] ?? "").trim();
      if (value) return value;
    }
  }
  return "";
}

function mapCompanyRow(row) {
  const name = pickField(row, ["企业名称", "公司名称", "单位名称", "企业", "公司", "名称", "name", "company", "companyname"]);
  if (!name) return null;
  return {
    name,
    province: pickField(row, ["省", "省份", "province"]),
    city: pickField(row, ["市", "城市", "地区", "所在地", "city", "location"]),
    district: pickField(row, ["区", "区县", "县", "district"]),
    industry: pickField(row, ["行业", "所属行业", "产业", "industry"]),
    website: pickField(row, ["网址", "官网", "网站", "website", "url"]),
    notes: pickField(row, ["备注", "说明", "notes", "note"]),
    source: pickField(row, ["来源", "source"]),
    metadata: row,
  };
}

async function initDatabase() {
  const pool = await getPool();
  const extension = { vector: false, error: null };
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
    extension.vector = true;
  } catch (error) {
    extension.error = error.message;
  }
  const schema = await readFile(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
  return { ok: true, extension, counts: await getDbCounts() };
}

async function dbStatus(sessionId = null) {
  try {
    const result = await dbQuery("SELECT now() AS now, current_database() AS database");
    let counts = null;
    let task = null;
    let taskCounts = null;
    try {
      counts = await getDbCounts();
    } catch {
      counts = null;
    }
    if (sessionId) {
      task = await ensureTaskSession(sessionId);
      const taskResult = await dbQuery(
        "SELECT count(*)::int AS downloaded_files FROM downloaded_files WHERE task_id = $1",
        [task.taskId],
      );
      taskCounts = taskResult.rows[0];
    }
    return {
      ok: true,
      database: result.rows[0].database,
      now: result.rows[0].now,
      counts,
      task,
      taskCounts,
      downloadsDir: DOWNLOADS_DIR,
      ingest: {
        enabled: ingestState.enabled,
        lastScan: ingestState.lastScan,
        lastResult: ingestState.lastResult,
      },
    };
  } catch (error) {
    return { ok: false, error: error.message, databaseUrl: DATABASE_URL.replace(/:[^:@/]+@/, ":***@") };
  }
}

async function ensureCompany(name, fields = {}, options = {}) {
  const companyName = String(name || "").trim();
  if (!companyName) throw new Error("缺少公司名称");
  const markAiWrite = Boolean(options.markAiWrite);
  const result = await dbQuery(
    `INSERT INTO companies (
       name, normalized_name, province, city, district, industry, website, source,
       hiring_status, notes, metadata, last_ai_write_date, last_ai_write_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, coalesce($9, 'new'), $10, $11, $12, $13, now())
     ON CONFLICT (normalized_name) DO UPDATE SET
       province = coalesce(EXCLUDED.province, companies.province),
       city = coalesce(EXCLUDED.city, companies.city),
       district = coalesce(EXCLUDED.district, companies.district),
       industry = coalesce(EXCLUDED.industry, companies.industry),
       website = coalesce(EXCLUDED.website, companies.website),
       source = coalesce(EXCLUDED.source, companies.source),
       hiring_status = CASE WHEN $9 IS NULL THEN companies.hiring_status ELSE EXCLUDED.hiring_status END,
       notes = coalesce(EXCLUDED.notes, companies.notes),
       metadata = companies.metadata || EXCLUDED.metadata,
       last_ai_write_date = coalesce(EXCLUDED.last_ai_write_date, companies.last_ai_write_date),
       last_ai_write_at = coalesce(EXCLUDED.last_ai_write_at, companies.last_ai_write_at),
       updated_at = now()
     RETURNING *`,
    [
      companyName,
      normalizeCompanyName(companyName),
      fields.province || null,
      fields.city || null,
      fields.district || null,
      fields.industry || null,
      fields.website || null,
      fields.source || null,
      fields.hiring_status || null,
      fields.notes || null,
      JSON.stringify(fields.metadata || {}),
      markAiWrite ? new Date().toISOString().slice(0, 10) : null,
      markAiWrite ? new Date().toISOString() : null,
    ],
  );
  return result.rows[0];
}

async function importCompanies(rows, source = "manual_import") {
  let imported = 0;
  let skipped = 0;
  const samples = [];
  for (const row of rows) {
    const mapped = mapCompanyRow(row);
    if (!mapped) {
      skipped += 1;
      continue;
    }
    if (looksLikeBadCompanyName(mapped.name)) {
      skipped += 1;
      continue;
    }
    mapped.source = mapped.source || source;
    await ensureCompany(mapped.name, mapped);
    imported += 1;
    if (samples.length < 5) samples.push(mapped.name);
  }
  return { imported, skipped, samples, counts: await getDbCounts() };
}

async function claimNextCompanies({ status = "new", limit = 1, taskId = null } = {}) {
  const claimLimit = Math.min(Math.max(Number(limit) || 1, 1), 100);
  return withDbClient(async (client) => {
    await client.query("BEGIN");
    try {
      const selected = await client.query(
        `SELECT id, name
         FROM companies
         WHERE hiring_status = $1
           AND (last_ai_read_date IS NULL OR last_ai_read_date < CURRENT_DATE)
         ORDER BY updated_at ASC, id ASC
         LIMIT $2
         FOR UPDATE SKIP LOCKED`,
        [status, claimLimit * 5],
      );
      const badRows = selected.rows.filter((row) => looksLikeBadCompanyName(row.name));
      if (badRows.length) {
        await client.query(
          `UPDATE companies
           SET hiring_status = 'skipped',
               notes = coalesce(notes, '') || CASE WHEN coalesce(notes, '') = '' THEN '' ELSE E'\n' END || '系统跳过：公司名包含异常重复片段，疑似导入脏数据。',
               updated_at = now()
           WHERE id = ANY($1::bigint[])`,
          [badRows.map((row) => row.id)],
        );
      }
      const ids = selected.rows
        .filter((row) => !looksLikeBadCompanyName(row.name))
        .slice(0, claimLimit)
        .map((row) => row.id);
      if (!ids.length) {
        await client.query("COMMIT");
        const skippedText = badRows.length ? `已跳过 ${badRows.length} 条异常公司名。` : "";
        return { exhausted: true, message: `${skippedText}今天没有可领取的 ${status} 企业了。`, rows: [] };
      }
      const updated = await client.query(
        `UPDATE companies
         SET last_ai_read_date = CURRENT_DATE,
             last_ai_read_at = now(),
             ai_claimed_task_id = $2,
             ai_claimed_at = now(),
             process_round = process_round + 1,
             hiring_status = CASE WHEN hiring_status = 'new' THEN 'searching' ELSE hiring_status END,
             updated_at = now()
         WHERE id = ANY($1::bigint[])
         RETURNING id, name, province, city, district, industry, website, hiring_status, notes,
                   last_ai_read_date, ai_claimed_task_id, process_round`,
        [ids, taskId],
      );
      await client.query("COMMIT");
      return { exhausted: false, rows: updated.rows };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

function resolveJob51Statuses(status = "new") {
  if (status === "__boss_done__") return ["no_recent_jobs", "actively_hiring"];
  if (status === "__all_searchable__") return ["new", "no_recent_jobs", "actively_hiring", "error"];
  return [status || "new"];
}

async function claimNextCompaniesForPlatform({ status = "new", statuses = null, limit = 1, taskId = null, platformKey } = {}) {
  if (!platformKey) throw new Error("缺少平台标识");
  const claimLimit = Math.min(Math.max(Number(limit) || 1, 1), 100);
  const statusList = (Array.isArray(statuses) && statuses.length ? statuses : [status || "new"]).filter(Boolean);
  return withDbClient(async (client) => {
    await client.query("BEGIN");
    try {
      const selected = await client.query(
        `SELECT id, name
         FROM companies
         WHERE hiring_status = ANY($1::text[])
           AND (coalesce(metadata, '{}'::jsonb) #>> ARRAY['platform_reads', $2::text]) IS DISTINCT FROM CURRENT_DATE::text
         ORDER BY updated_at ASC, id ASC
         LIMIT $3
         FOR UPDATE SKIP LOCKED`,
        [statusList, platformKey, claimLimit * 5],
      );
      const badRows = selected.rows.filter((row) => looksLikeBadCompanyName(row.name));
      if (badRows.length) {
        await client.query(
          `UPDATE companies
           SET hiring_status = 'skipped',
               notes = coalesce(notes, '') || CASE WHEN coalesce(notes, '') = '' THEN '' ELSE E'\n' END || '系统跳过：公司名包含异常重复片段，疑似导入脏数据。',
               updated_at = now()
           WHERE id = ANY($1::bigint[])`,
          [badRows.map((row) => row.id)],
        );
      }
      const ids = selected.rows
        .filter((row) => !looksLikeBadCompanyName(row.name))
        .slice(0, claimLimit)
        .map((row) => row.id);
      if (!ids.length) {
        await client.query("COMMIT");
        const skippedText = badRows.length ? `已跳过 ${badRows.length} 条异常公司名。` : "";
        return { exhausted: true, message: `${skippedText}今天没有可由 ${platformKey} 处理的 ${statusList.join("/")} 企业了。`, rows: [] };
      }
      const updated = await client.query(
        `UPDATE companies
         SET ai_claimed_task_id = $3,
             ai_claimed_at = now(),
             process_round = process_round + 1,
             metadata = coalesce(metadata, '{}'::jsonb)
               || jsonb_build_object(
                 'platform_reads',
                 coalesce(metadata->'platform_reads', '{}'::jsonb) || jsonb_build_object($2::text, CURRENT_DATE::text)
               ),
             hiring_status = CASE WHEN hiring_status = 'new' THEN 'searching' ELSE hiring_status END,
             updated_at = now()
         WHERE id = ANY($1::bigint[])
         RETURNING id, name, province, city, district, industry, website, hiring_status, notes,
                   last_ai_read_date, ai_claimed_task_id, process_round, metadata`,
        [ids, platformKey, taskId],
      );
      await client.query("COMMIT");
      return { exhausted: false, rows: updated.rows };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

async function getNextCompanies({ status = "new", limit = 1, taskId = null } = {}) {
  return claimNextCompanies({ status, limit, taskId });
}

async function searchCompanies(query, limit = 20) {
  const result = await dbQuery(
    `SELECT id, name, city, industry, website, hiring_status, confidence_score, notes, updated_at
     FROM companies
     WHERE name ILIKE $1 OR coalesce(city, '') ILIKE $1 OR coalesce(notes, '') ILIKE $1
     ORDER BY updated_at DESC
     LIMIT $2`,
    [`%${query}%`, Math.min(Number(limit) || 20, 50)],
  );
  return result.rows;
}

async function addCompanyNote({ company_name, name, content, note_type = "general" }) {
  const company = await ensureCompany(company_name || name, {}, { markAiWrite: true });
  const result = await dbQuery(
    `INSERT INTO notes (company_id, note_type, content, created_by)
     VALUES ($1, $2, $3, 'ai')
     RETURNING *`,
    [company.id, note_type, content],
  );
  return { company, note: result.rows[0] };
}

async function addJob(args) {
  const company = await ensureCompany(args.company_name, {}, { markAiWrite: true });
  const result = await dbQuery(
    `INSERT INTO jobs (
       company_id, company_name, title, location, salary, education, experience,
       description, apply_url, source_platform, source_url, status, fit_score, evidence_text, metadata
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,coalesce($12,'found'),$13,$14,$15)
     RETURNING *`,
    [
      company.id,
      company.name,
      args.title,
      args.location || null,
      args.salary || null,
      args.education || null,
      args.experience || null,
      args.description || null,
      args.apply_url || null,
      args.source_platform || null,
      args.source_url || null,
      args.status || null,
      args.fit_score ?? null,
      args.evidence_text || null,
      JSON.stringify(args.metadata || {}),
    ],
  );
  await dbQuery("UPDATE companies SET hiring_status = 'actively_hiring', updated_at = now() WHERE id = $1", [company.id]);
  return result.rows[0];
}

async function searchJobs({ query = "", status = "", limit = 20 }) {
  const clauses = [];
  const params = [];
  if (query) {
    params.push(`%${query}%`);
    clauses.push(`(coalesce(company_name, '') ILIKE $${params.length} OR title ILIKE $${params.length} OR coalesce(description, '') ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    clauses.push(`status = $${params.length}`);
  }
  params.push(Math.min(Number(limit) || 20, 50));
  const result = await dbQuery(
    `SELECT id, company_name, title, location, salary, status, fit_score, apply_url, source_url, last_seen_at
     FROM jobs
     ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
     ORDER BY last_seen_at DESC
     LIMIT $${params.length}`,
    params,
  );
  return result.rows;
}

async function listJobScreenResults({ status = "suitable", query = "", limit = 50 } = {}) {
  const clauses = [];
  const params = [];
  const normalizedStatus = String(status || "suitable").trim();
  if (normalizedStatus === "screened") {
    clauses.push(`coalesce(ai_screen_status, 'pending') IN ('suitable', 'maybe', 'not_suitable', 'error')`);
  } else if (normalizedStatus && normalizedStatus !== "all") {
    params.push(normalizedStatus);
    clauses.push(`coalesce(ai_screen_status, 'pending') = $${params.length}`);
  }
  const normalizedQuery = String(query || "").trim();
  if (normalizedQuery) {
    params.push(`%${normalizedQuery}%`);
    clauses.push(`(
      coalesce(company_name, '') ILIKE $${params.length}
      OR coalesce(title, '') ILIKE $${params.length}
      OR coalesce(location, '') ILIKE $${params.length}
      OR coalesce(ai_screen_note, '') ILIKE $${params.length}
      OR coalesce(description, '') ILIKE $${params.length}
    )`);
  }
  params.push(Math.max(1, Math.min(Number(limit) || 50, 200)));
  const result = await dbQuery(
    `SELECT id, company_name, title, location, salary, education, experience,
            left(coalesce(description, ''), 800) AS description,
            apply_url, source_platform, source_url, status, fit_score,
            ai_screen_status, ai_screen_score, ai_screen_note, ai_screen_at, last_seen_at
     FROM jobs
     ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
     ORDER BY
       CASE coalesce(ai_screen_status, 'pending')
         WHEN 'suitable' THEN 1
         WHEN 'maybe' THEN 2
         WHEN 'not_suitable' THEN 3
         WHEN 'error' THEN 4
         ELSE 5
       END,
       ai_screen_score DESC NULLS LAST,
       fit_score DESC NULLS LAST,
       ai_screen_at DESC NULLS LAST,
       last_seen_at DESC NULLS LAST,
       id DESC
     LIMIT $${params.length}`,
    params,
  );
  return result.rows;
}

async function updateJobStatus({ job_id, status, fit_score, notes }) {
  const result = await dbQuery(
    `UPDATE jobs
     SET status = $2,
         fit_score = coalesce($3, fit_score),
         metadata = metadata || $4::jsonb,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [job_id, status, fit_score ?? null, JSON.stringify(notes ? { notes } : {})],
  );
  if (!result.rows[0]) throw new Error(`找不到岗位: ${job_id}`);
  return result.rows[0];
}

function normalizeScreenDecision(value) {
  const text = String(value || "").toLowerCase();
  if (/(not|no|reject|不合适|不推荐|淘汰|拒绝)/i.test(text)) return "not_suitable";
  if (/(maybe|possible|部分|一般|备选|可考虑)/i.test(text)) return "maybe";
  if (/(suitable|fit|match|yes|合适|推荐|通过)/i.test(text)) return "suitable";
  return "maybe";
}

function clampScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, score));
}

async function claimJobScreenBatch(limit = 100) {
  const batchLimit = Math.max(1, Math.min(Number(limit || 100), 100));
  const taskId = `job-screen-${Date.now()}`;
  return withDbClient(async (client) => {
    await client.query("BEGIN");
    try {
      const selected = await client.query(
        `SELECT id
         FROM jobs
         WHERE coalesce(ai_screen_status, 'pending') = 'pending'
         ORDER BY last_seen_at DESC, id ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED`,
        [batchLimit],
      );
      const ids = selected.rows.map((row) => row.id);
      if (!ids.length) {
        await client.query("COMMIT");
        return { exhausted: true, rows: [], taskId };
      }
      const updated = await client.query(
        `UPDATE jobs
         SET ai_screen_status = 'screening',
             ai_screen_task_id = $2,
             updated_at = now()
         WHERE id = ANY($1::bigint[])
         RETURNING id, company_name, title, location, salary, education, experience,
                   description, apply_url, source_platform, source_url, evidence_text`,
        [ids, taskId],
      );
      await client.query("COMMIT");
      return { exhausted: false, rows: updated.rows, taskId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

function jobForScreenPrompt(job) {
  return {
    id: Number(job.id),
    company: job.company_name || "",
    title: job.title || "",
    location: job.location || "",
    salary: job.salary || "",
    education: job.education || "",
    experience: job.experience || "",
    source: job.source_platform || "",
    url: job.apply_url || job.source_url || "",
    description: String(job.description || job.evidence_text || "").slice(0, 1400),
  };
}

async function screenJobBatch({ apiKey, model, instruction, jobs }) {
  const payload = jobs.map(jobForScreenPrompt);
  return callDeepSeekJson({
    apiKey,
    model,
    messages: [
      {
        role: "system",
        content:
          "你是岗位匹配筛选助手。只返回 JSON，不要输出解释。你会根据用户的筛选要求判断岗位是否合适。必须逐条返回结果，不要遗漏 id。",
      },
      {
        role: "user",
        content: `筛选要求：
${instruction || "筛选出适合用户投递的岗位。"}

岗位列表 JSON：
${JSON.stringify(payload)}

请只返回 JSON：
{
  "results": [
    {
      "id": 123,
      "decision": "suitable" 或 "maybe" 或 "not_suitable",
      "fit_score": 0到100的数字,
      "note": "一句中文理由，说明为什么适合或不适合"
    }
  ]
}`,
      },
    ],
  });
}

async function writeJobScreenResults(jobs, llmResult = {}) {
  const results = Array.isArray(llmResult.results)
    ? llmResult.results
    : (Array.isArray(llmResult.jobs) ? llmResult.jobs : []);
  const byId = new Map(results.map((item) => [String(item.id ?? item.job_id), item]));
  let processed = 0;
  for (const job of jobs) {
    const item = byId.get(String(job.id));
    if (!item) {
      await dbQuery(
        `UPDATE jobs
         SET ai_screen_status = 'error',
             status = 'screen_error',
             ai_screen_note = '大模型返回结果中缺少该岗位 id',
             ai_screen_at = now(),
             ai_screen_round = ai_screen_round + 1,
             updated_at = now()
         WHERE id = $1`,
        [job.id],
      );
      continue;
    }
    const decision = normalizeScreenDecision(item.decision || item.status || item.result);
    const score = clampScore(item.fit_score ?? item.score);
    const note = String(item.note || item.reason || "").slice(0, 2000);
    await dbQuery(
      `UPDATE jobs
       SET ai_screen_status = $2,
           status = $2,
           fit_score = coalesce($3, fit_score),
           ai_screen_score = coalesce($3, ai_screen_score),
           ai_screen_note = $4,
           ai_screen_at = now(),
           ai_screen_round = ai_screen_round + 1,
           metadata = metadata || $5::jsonb,
           updated_at = now()
       WHERE id = $1`,
      [
        job.id,
        decision,
        score,
        note,
        JSON.stringify({ screening: { decision, score, note, at: new Date().toISOString() } }),
      ],
    );
    processed += 1;
  }
  return processed;
}

async function resetJobScreening() {
  const result = await dbQuery(
    `UPDATE jobs
     SET ai_screen_status = 'pending',
         ai_screen_note = NULL,
         ai_screen_score = NULL,
         ai_screen_at = NULL,
         ai_screen_task_id = NULL,
         status = CASE WHEN status IN ('suitable', 'maybe', 'not_suitable', 'screen_error') THEN 'found' ELSE status END,
         updated_at = now()
     WHERE coalesce(ai_screen_status, 'pending') <> 'pending'
     RETURNING id`,
  );
  pushJobScreenLog("岗位筛选状态已重置", { count: result.rows.length });
  return { updated: result.rows.length };
}

async function runJobScreenAgent({ apiKey, model = DEFAULT_MODEL, instruction = "", batchSize = 100 }) {
  jobScreenState.running = true;
  jobScreenState.stopRequested = false;
  jobScreenState.currentBatch = null;
  jobScreenState.processed = 0;
  jobScreenState.batches = 0;
  jobScreenState.startedAt = new Date().toISOString();
  jobScreenState.finishedAt = null;
  jobScreenState.lastError = null;
  pushJobScreenLog("岗位筛选通道启动", { batchSize: Math.min(Number(batchSize || 100), 100) });

  try {
    while (!jobScreenState.stopRequested) {
      const claimed = await claimJobScreenBatch(batchSize);
      if (claimed.exhausted || !claimed.rows.length) {
        pushJobScreenLog("搜索后岗位已全部轮完一遍");
        break;
      }
      jobScreenState.currentBatch = {
        taskId: claimed.taskId,
        count: claimed.rows.length,
        ids: claimed.rows.map((job) => job.id),
      };
      pushJobScreenLog("发送一批岗位给大模型", {
        count: claimed.rows.length,
        first: claimed.rows[0]?.title || "",
      });
      let llmResult;
      try {
        llmResult = await screenJobBatch({ apiKey, model, instruction, jobs: claimed.rows });
      } catch (error) {
        await dbQuery(
          `UPDATE jobs
           SET ai_screen_status = 'pending',
               ai_screen_task_id = NULL,
               ai_screen_note = $2,
               updated_at = now()
           WHERE id = ANY($1::bigint[])`,
          [claimed.rows.map((job) => job.id), `筛选失败，已放回待筛选：${error.message || String(error)}`],
        );
        throw error;
      }
      const processed = await writeJobScreenResults(claimed.rows, llmResult);
      jobScreenState.processed += processed;
      jobScreenState.batches += 1;
      pushJobScreenLog("一批岗位筛选完成", { processed, totalProcessed: jobScreenState.processed });
    }
  } catch (error) {
    jobScreenState.lastError = error.message || String(error);
    pushJobScreenLog("岗位筛选通道出错", { error: jobScreenState.lastError });
  } finally {
    jobScreenState.running = false;
    jobScreenState.currentBatch = null;
    jobScreenState.finishedAt = new Date().toISOString();
    pushJobScreenLog("岗位筛选通道结束", {
      processed: jobScreenState.processed,
      batches: jobScreenState.batches,
      error: jobScreenState.lastError,
    });
  }
}

async function addApplication({ job_id, resume_version, status = "draft", account_used, notes }) {
  const job = await dbQuery("SELECT id, company_id FROM jobs WHERE id = $1", [job_id]);
  if (!job.rows[0]) throw new Error(`找不到岗位: ${job_id}`);
  const result = await dbQuery(
    `INSERT INTO applications (job_id, company_id, resume_version, status, account_used, notes, applied_at)
     VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $4 = 'submitted' THEN now() ELSE NULL END)
     RETURNING *`,
    [job_id, job.rows[0].company_id, resume_version || null, status, account_used || null, notes || null],
  );
  if (status === "submitted") {
    await updateJobStatus({ job_id, status: "applied" });
  }
  return result.rows[0];
}

function extOf(filePath) {
  return path.extname(filePath).toLowerCase().replace(/^\./, "");
}

function guessMime(ext) {
  const mimes = {
    txt: "text/plain",
    csv: "text/csv",
    tsv: "text/tab-separated-values",
    json: "application/json",
    html: "text/html",
    htm: "text/html",
    md: "text/markdown",
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return mimes[ext] || "application/octet-stream";
}

async function hashFile(filePath) {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

async function extractText(filePath, ext, size) {
  const readable = new Set(["txt", "csv", "tsv", "json", "html", "htm", "md"]);
  if (!readable.has(ext)) {
    if (["pdf", "docx", "xlsx", "xlsm"].includes(ext) && size <= 50_000_000) {
      const result = await runJsonCommand(PYTHON, [path.join(__dirname, "extract_text.py"), filePath]).catch((error) => ({
        ok: false,
        error: error.message,
      }));
      return result.ok === false ? null : result.text;
    }
    return null;
  }
  if (size > 5_000_000) return null;
  const text = await readFile(filePath, "utf8").catch(() => "");
  if (ext === "html" || ext === "htm") {
    return text
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200_000);
  }
  return text.slice(0, 200_000);
}

async function ingestFile(filePath, taskId = null) {
  const info = await stat(filePath);
  if (!info.isFile()) return { ok: false, skipped: true, reason: "not_file", filePath };
  if (filePath.endsWith(".crdownload") || filePath.endsWith(".download") || filePath.endsWith(".tmp")) {
    return { ok: false, skipped: true, reason: "partial_download", filePath };
  }

  const ext = extOf(filePath);
  const sha256 = await hashFile(filePath);
  let storedPath = filePath;
  if (taskId) {
    const task = await ensureTaskSession(taskId);
    const targetName = `${sha256.slice(0, 12)}-${safeName(path.basename(filePath))}`;
    storedPath = path.join(task.downloadsDir, targetName);
    if (!existsSync(storedPath)) {
      await copyFile(filePath, storedPath);
    }
  }
  const text = await extractText(storedPath, ext, info.size);
  const conflictClause = taskId
    ? `ON CONFLICT (task_id, sha256) WHERE task_id IS NOT NULL AND sha256 IS NOT NULL DO UPDATE SET
       file_size = EXCLUDED.file_size,
       extracted_text = EXCLUDED.extracted_text,
       original_path = EXCLUDED.original_path,
       updated_at = now()`
    : `ON CONFLICT (file_path) DO UPDATE SET
       file_size = EXCLUDED.file_size,
       sha256 = EXCLUDED.sha256,
       extracted_text = EXCLUDED.extracted_text,
       task_id = EXCLUDED.task_id,
       original_path = EXCLUDED.original_path,
       updated_at = now()`;
  const result = await dbQuery(
    `INSERT INTO downloaded_files (task_id, original_path, file_path, file_name, file_ext, mime_type, file_size, sha256, extracted_text, metadata, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
     ${conflictClause}
     RETURNING id, task_id, file_name, file_ext, file_size, file_path, original_path, created_at, updated_at`,
    [
      taskId,
      filePath,
      storedPath,
      path.basename(storedPath),
      ext || null,
      guessMime(ext),
      info.size,
      sha256,
      text,
      JSON.stringify({ mtimeMs: info.mtimeMs }),
    ],
  );
  return { ok: true, row: result.rows[0] };
}

async function scanDownloads(limit = 200, taskId = null, options = {}) {
  const sinceMs = Number(options.sinceMs || 0);
  const entries = await readdir(DOWNLOADS_DIR).catch((error) => {
    throw new Error(`无法读取下载目录 ${DOWNLOADS_DIR}: ${error.message}`);
  });
  const files = [];
  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    const filePath = path.join(DOWNLOADS_DIR, entry);
    const info = await stat(filePath).catch(() => null);
    if (info?.isFile() && (!sinceMs || info.mtimeMs >= sinceMs)) files.push({ filePath, mtimeMs: info.mtimeMs });
  }
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);

  let indexed = 0;
  let skipped = 0;
  const errors = [];
  for (const file of files.slice(0, Math.min(Number(limit) || 200, 1000))) {
    try {
      const result = await ingestFile(file.filePath, taskId);
      if (result.ok) indexed += 1;
      else skipped += 1;
    } catch (error) {
      errors.push({ file: file.filePath, error: error.message });
    }
  }
  ingestState.lastScan = new Date().toISOString();
  ingestState.lastResult = {
    indexed,
    skipped,
    errors: errors.slice(0, 10),
    scanned: files.length,
    taskId,
    sinceMs: sinceMs || null,
    reason: options.reason || null,
  };
  return ingestState.lastResult;
}

function startIngestWatcher(taskId = null, options = {}) {
  const sinceMs = Number(options.sinceMs || ingestState.sinceMs || Date.now() - 5000);
  if (ingestState.timer && ingestState.taskId === taskId) return;
  if (ingestState.timer && ingestState.taskId !== taskId) {
    clearInterval(ingestState.timer);
    ingestState.timer = null;
  }
  ingestState.enabled = true;
  ingestState.taskId = taskId;
  ingestState.sinceMs = sinceMs;
  ingestState.timer = setInterval(() => {
    scanDownloads(200, ingestState.taskId, { sinceMs: ingestState.sinceMs, reason: "watcher" }).catch((error) => {
      ingestState.lastScan = new Date().toISOString();
      ingestState.lastResult = { indexed: 0, skipped: 0, errors: [{ error: error.message }] };
    });
  }, INGEST_POLL_MS);
  if (options.immediate !== false) {
    scanDownloads(200, ingestState.taskId, { sinceMs: ingestState.sinceMs, reason: "watcher_start" }).catch(() => {});
  }
}

function stopIngestWatcher() {
  if (ingestState.timer) clearInterval(ingestState.timer);
  ingestState.timer = null;
  ingestState.enabled = false;
  ingestState.taskId = null;
  ingestState.sinceMs = null;
}

async function autoIngestDownloadsForContext(context, reason = "browser_tool") {
  if (!context?.sessionId) return null;
  const task = await ensureTaskSession(context.sessionId);
  if (!context.downloadIngestSinceMs) context.downloadIngestSinceMs = Date.now() - 5000;
  startIngestWatcher(task.taskId, { sinceMs: context.downloadIngestSinceMs, immediate: false });
  return scanDownloads(80, task.taskId, { sinceMs: context.downloadIngestSinceMs, reason });
}

async function withDownloadIngest(resultPromise, context, reason) {
  const result = await resultPromise;
  if (!context?.sessionId) return result;
  try {
    const downloadIngest = await autoIngestDownloadsForContext(context, reason);
    return { ...result, downloadIngest };
  } catch (error) {
    return { ...result, downloadIngest: { ok: false, error: error.message || String(error) } };
  }
}

async function executeTool(name, rawArgs, context) {
  assertNotCancelled(context);
  const args = rawArgs && typeof rawArgs === "object" ? rawArgs : {};
  switch (name) {
    case "browser_status":
      return runBb(["tab", "list"], {}, context);
    case "browser_daemon": {
      const action = args.action || "status";
      return action === "status"
        ? runBb(["tab", "list"], {}, context)
        : runBb(["daemon", action], {}, context);
    }
    case "browser_tab_list":
      return runBb(["tab", "list"], {}, context);
    case "browser_open": {
      const cmd = ["open", args.url];
      if (args.tab) cmd.push("--tab", String(args.tab));
      return withDownloadIngest(runBb(cmd, { timeout: 60000 }, context), context, "browser_open");
    }
    case "browser_snapshot": {
      const cmd = ["snapshot"];
      if (args.interactive !== false) cmd.push("-i");
      if (args.compact !== false) cmd.push("-c");
      cmd.push("-d", String(args.depth || 4));
      if (args.selector) cmd.push("-s", String(args.selector));
      withTab(cmd, args.tab);
      return runBb(cmd, { timeout: 60000 }, context);
    }
    case "browser_click": {
      const clickKey = `${args.tab || "current"}:${args.ref}`;
      if (context?.clickedRefs.has(clickKey)) {
        return {
          ok: false,
          blocked: true,
          output: `已阻止重复点击 ${args.ref}。下载或疑似下载按钮每个任务最多点击一次；如果 Chrome 出现“可能有危险/是否保留”的安全提示，请用户手动处理后再继续。`,
        };
      }
      context?.clickedRefs.add(clickKey);
      return withDownloadIngest(runBb(withTab(["click", args.ref], args.tab), {}, context), context, "browser_click");
    }
    case "browser_fill":
      return runBb(withTab(["fill", args.ref, args.text], args.tab), {}, context);
    case "browser_press":
      return withDownloadIngest(runBb(withTab(["press", args.key], args.tab), {}, context), context, "browser_press");
    case "browser_scroll": {
      const cmd = ["scroll", args.direction];
      if (args.pixels) cmd.push(String(args.pixels));
      return runBb(withTab(cmd, args.tab), {}, context);
    }
    case "browser_get": {
      const cmd = ["get", args.kind];
      if (args.ref) cmd.push(args.ref);
      return runBb(withTab(cmd, args.tab), {}, context);
    }
    case "browser_eval": {
      const cmd = ["eval", args.script];
      if (args.domain) cmd.push("--domain", String(args.domain));
      withTab(cmd, args.tab);
      return withDownloadIngest(runBb(cmd, { timeout: 60000 }, context), context, "browser_eval");
    }
    case "browser_site": {
      const cmd = ["site", args.command, ...(Array.isArray(args.args) ? args.args : [])];
      if (args.jq) cmd.push("--jq", String(args.jq));
      return withDownloadIngest(runBb(cmd, { timeout: 90000 }, context), context, "browser_site");
    }
    case "browser_screenshot": {
      const filename = safeName(args.filename);
      const filePath = path.join(__dirname, "screenshots", filename.endsWith(".png") ? filename : `${filename}.png`);
      const cmd = ["screenshot", filePath];
      withTab(cmd, args.tab);
      const result = await runBb(cmd, { timeout: 60000 }, context);
      return { ...result, path: filePath };
    }
    case "browser_wait": {
      const ms = Math.max(200, Math.min(10000, Number(args.seconds || 1) * 1000));
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        context?.controller.signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error(context.reason || "执行已暂停"));
        }, { once: true });
      });
      return withDownloadIngest(Promise.resolve({ ok: true, elapsedMs: ms, output: `waited ${ms}ms` }), context, "browser_wait");
    }
    case "db_status":
      return dbStatus(context?.sessionId || null);
    case "db_search_companies":
      return { ok: true, rows: await searchCompanies(args.query, args.limit) };
    case "db_get_next_companies":
      return { ok: true, ...(await getNextCompanies({ ...args, taskId: context?.sessionId || null })) };
    case "db_claim_next_company":
      return { ok: true, ...(await claimNextCompanies({ ...args, limit: 1, taskId: context?.sessionId || null })) };
    case "db_update_company":
      return { ok: true, row: await ensureCompany(args.name, args, { markAiWrite: true }) };
    case "db_add_job":
      return { ok: true, row: await addJob(args) };
    case "db_add_note":
      return { ok: true, row: await addCompanyNote(args) };
    case "db_search_jobs":
      return { ok: true, rows: await searchJobs(args) };
    case "db_update_job_status":
      return { ok: true, row: await updateJobStatus(args) };
    case "db_add_application":
      return { ok: true, row: await addApplication(args) };
    case "db_recent_downloads": {
      const taskId = context?.sessionId ? safeTaskId(context.sessionId) : (args.task_id ? safeTaskId(args.task_id) : null);
      if (!taskId) return { ok: false, error: "缺少当前任务 ID" };
      const result = await dbQuery(
        `SELECT id, task_id, file_name, file_ext, file_size, file_path, original_path, created_at, updated_at
         FROM downloaded_files
         WHERE task_id = $2
         ORDER BY updated_at DESC
         LIMIT $1`,
        [Math.min(Number(args.limit) || 10, 50), taskId],
      );
      return { ok: true, taskId, rows: result.rows };
    }
    default:
      return { ok: false, output: `unknown tool: ${name}` };
  }
}

async function callDeepSeek({ apiKey, model, messages, context }) {
  assertNotCancelled(context);
  const response = await fetchDeepSeek({
    method: "POST",
    signal: context?.controller.signal,
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.2,
    }),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`DeepSeek returned non-JSON (${response.status}): ${text.slice(0, 500)}`);
  }
  if (!response.ok) {
    throw new Error(data?.error?.message || `DeepSeek API error: ${response.status}`);
  }
  return data;
}

async function fetchDeepSeek(options) {
  const timeoutController = new AbortController();
  const parentSignal = options.signal;
  let timedOut = false;
  const onParentAbort = () => timeoutController.abort(parentSignal.reason);
  if (parentSignal) {
    if (parentSignal.aborted) onParentAbort();
    else parentSignal.addEventListener("abort", onParentAbort, { once: true });
  }
  const timer = setTimeout(() => {
    timedOut = true;
    timeoutController.abort();
  }, DEEPSEEK_TIMEOUT_MS);

  try {
    return await fetch(DEEPSEEK_URL, { ...options, signal: timeoutController.signal });
  } catch (error) {
    if (timedOut) {
      throw new Error(`DeepSeek API 请求超过 ${Math.round(DEEPSEEK_TIMEOUT_MS / 1000)} 秒，请稍后重试`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", onParentAbort);
  }
}

async function callDeepSeekJson({ apiKey, model, messages }) {
  const requestBody = {
    model: model || DEFAULT_MODEL,
    messages,
    temperature: 0.1,
    response_format: { type: "json_object" },
  };
  let response = await fetchDeepSeek({
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  let text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`DeepSeek returned non-JSON (${response.status}): ${text.slice(0, 500)}`);
  }
  if (!response.ok && /response_format|json_object/i.test(data?.error?.message || "")) {
    delete requestBody.response_format;
    response = await fetchDeepSeek({
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`DeepSeek returned non-JSON (${response.status}): ${text.slice(0, 500)}`);
    }
  }
  if (!response.ok) {
    throw new Error(data?.error?.message || `DeepSeek API error: ${response.status}`);
  }
  const content = data.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(`DeepSeek JSON 解析失败: ${content.slice(0, 500)}`);
  }
}

async function validateDeepSeekKey({ apiKey, model }) {
  const data = await callDeepSeek({
    apiKey,
    model,
    messages: [{ role: "user", content: "ping" }],
  });
  return Boolean(data.choices?.[0]?.message);
}

function pushDbAgentLog(message, detail = {}) {
  const entry = { time: new Date().toISOString(), message, detail };
  dbAgentState.logs.push(entry);
  if (dbAgentState.logs.length > 200) dbAgentState.logs.shift();
  return entry;
}

function pushJob51AgentLog(message, detail = {}) {
  const entry = { time: new Date().toISOString(), message, detail };
  job51AgentState.logs.push(entry);
  if (job51AgentState.logs.length > 200) job51AgentState.logs.shift();
  return entry;
}

function pushJobScreenLog(message, detail = {}) {
  const entry = { time: new Date().toISOString(), message, detail };
  jobScreenState.logs.push(entry);
  if (jobScreenState.logs.length > 200) jobScreenState.logs.shift();
  return entry;
}

function parseMaybeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeMsRange(minValue, maxValue, fallbackMin, fallbackMax, cap) {
  let min = Number(minValue);
  let max = Number(maxValue);
  if (!Number.isFinite(min)) min = fallbackMin;
  if (!Number.isFinite(max)) max = fallbackMax;
  min = Math.max(0, Math.min(Math.round(min), cap));
  max = Math.max(0, Math.min(Math.round(max), cap));
  if (max < min) [min, max] = [max, min];
  return { min, max };
}

function parseCurrentTabId(statusText = "") {
  const current = statusText.match(/\*\s+\[([^\]]+)\]/);
  if (current) return current[1];
  const first = statusText.match(/\[([^\]]+)\]/);
  return first?.[1] || "";
}

async function ensureBrowserTab() {
  const status = await runBossBrowser(["status"], { timeout: 15000 });
  if (status.ok && !/No tabs/i.test(status.output || "")) {
    const tabId = parseCurrentTabId(status.output);
    if (tabId) return tabId;
  }
  const created = await runBossBrowser(["tab", "new"], { timeout: 15000 });
  if (!created.ok) {
    throw new Error(`无法创建浏览器标签页：${created.output || "unknown error"}`);
  }
  const nextStatus = await runBossBrowser(["status"], { timeout: 15000 });
  const tabId = parseCurrentTabId(nextStatus.output);
  if (!tabId) throw new Error("无法识别浏览器标签页 ID");
  return tabId;
}

function buildBossSearchUrl(company, city = "") {
  const params = new URLSearchParams();
  params.set("query", company.name);
  params.set("city", city || "101010100");
  return `https://www.zhipin.com/web/geek/job?${params.toString()}`;
}

async function extractBossPageText(tabId) {
  const script = `(() => {
    const selectors = [
      ".job-list-box",
      ".search-job-result",
      ".job-list-container",
      "main",
      "body"
    ];
    const parts = [];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText) parts.push(el.innerText);
    }
    return parts.join("\\n\\n").slice(0, 30000);
  })()`;
  const result = await runBossBrowser(["eval", script, "--tab", tabId], { timeout: 30000 });
  return result.ok ? String(result.output || "") : "";
}

async function bossSearchCompany(company, { city = "" } = {}) {
  const result = await runGeekrunJson([
    "--company",
    company.name,
    "--city",
    city || "101010100",
    "--limit",
    "20",
  ]);
  return {
    ok: Boolean(result.ok),
    output: JSON.stringify(result),
    json: result,
    command: `node ${GEEKRUN_SEARCH_SCRIPT} --company ${company.name} --city ${city || "101010100"}`,
    mode: "geekrun",
    url: result.url || "",
  };
}

async function bossSearchCompanies(companies, options = {}) {
  const city = options.city || "";
  const companyDelayRange = options.delayMs !== undefined && options.companyDelayMinMs === undefined && options.companyDelayMaxMs === undefined
    ? normalizeMsRange(options.delayMs, options.delayMs, 8000, 8000, 120000)
    : normalizeMsRange(options.companyDelayMinMs, options.companyDelayMaxMs, 8000, 15000, 120000);
  const actionDelayRange = normalizeMsRange(options.actionDelayMinMs, options.actionDelayMaxMs, 1000, 3000, 30000);
  const payload = Buffer.from(JSON.stringify(companies.map((company) => ({
    id: company.id,
    name: company.name,
  })))).toString("base64");
  const timeoutPerCompany = 110000 + companyDelayRange.max + actionDelayRange.max * 8;
  const result = await runGeekrunJson([
    "--companies-json",
    payload,
    "--city",
    city || "101010100",
    "--limit",
    "20",
    "--company-delay-min-ms",
    String(companyDelayRange.min),
    "--company-delay-max-ms",
    String(companyDelayRange.max),
    "--action-delay-min-ms",
    String(actionDelayRange.min),
    "--action-delay-max-ms",
    String(actionDelayRange.max),
  ], {
    timeout: Math.max(180000, companies.length * timeoutPerCompany),
  });
  return {
    ok: Boolean(result.ok),
    output: JSON.stringify(result),
    json: result,
    command: `node ${GEEKRUN_SEARCH_SCRIPT} --companies-json <${companies.length} companies> --city ${city || "101010100"} --company-delay ${companyDelayRange.min}-${companyDelayRange.max}ms --action-delay ${actionDelayRange.min}-${actionDelayRange.max}ms`,
    mode: "geekrun_batch",
  };
}

async function openBossLoginPage() {
  const child = spawn(
    NODE,
    [GEEKRUN_SEARCH_SCRIPT, "--open-login"],
    {
      detached: true,
      stdio: "ignore",
      env: {
        ...process.env,
        GEEKRUN_DIR,
        GEEKRUN_USER_DATA_DIR: GEEKRUN_PROFILE_DIR,
      },
    },
  );
  child.unref();
  return {
    ok: true,
    output: "GeekRun 登录浏览器已启动",
    command: `node ${GEEKRUN_SEARCH_SCRIPT} --open-login`,
  };
}

function closeGeekrunBrowser() {
  const escapedScript = GEEKRUN_SEARCH_SCRIPT.replaceAll("'", "'\\''");
  const escapedProfile = GEEKRUN_PROFILE_DIR.replaceAll("'", "'\\''");
  const script = [
    `pkill -f '${escapedScript} --open-login' 2>/dev/null || true`,
    `pkill -f '${escapedProfile}' 2>/dev/null || true`,
    `rm -f '${escapedProfile}/SingletonLock' '${escapedProfile}/SingletonCookie' '${escapedProfile}/SingletonSocket' 2>/dev/null || true`,
  ].join("\n");
  return new Promise((resolve) => {
    execFile("/bin/sh", ["-lc", script], { timeout: 10000 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        output: [stdout, stderr, error?.message].filter(Boolean).join("\n"),
      });
    });
  });
}

function summarizeGeekrunFailure(output) {
  const data = parseMaybeJson(output) || {};
  if (data.needsLogin) return "GeekRun 需要先登录或通过 BOSS 验证";
  if (/SingletonLock|ProcessSingleton|chrome-profile|profile directory/i.test(output || "")) {
    return "GeekRun 登录浏览器还开着，请登录完成后关闭它再搜索";
  }
  if (data.message) return data.message;
  if (data.error) return `GeekRun 错误：${data.error}`;
  return "GeekRun 搜索失败";
}

async function job51SearchCompanies(companies, options = {}) {
  const area = options.area || "";
  const companyDelayRange = options.delayMs !== undefined && options.companyDelayMinMs === undefined && options.companyDelayMaxMs === undefined
    ? normalizeMsRange(options.delayMs, options.delayMs, 8000, 8000, 120000)
    : normalizeMsRange(options.companyDelayMinMs, options.companyDelayMaxMs, 8000, 15000, 120000);
  const actionDelayRange = normalizeMsRange(options.actionDelayMinMs, options.actionDelayMaxMs, 1000, 3000, 30000);
  const payload = Buffer.from(JSON.stringify(companies.map((company) => ({
    id: company.id,
    name: company.name,
  })))).toString("base64");
  const timeoutPerCompany = 110000 + companyDelayRange.max + actionDelayRange.max * 8;
  const result = await runJob51Json([
    "--companies-json",
    payload,
    "--area",
    area || "000000",
    "--limit",
    "20",
    "--company-delay-min-ms",
    String(companyDelayRange.min),
    "--company-delay-max-ms",
    String(companyDelayRange.max),
    "--action-delay-min-ms",
    String(actionDelayRange.min),
    "--action-delay-max-ms",
    String(actionDelayRange.max),
  ], {
    timeout: Math.max(180000, companies.length * timeoutPerCompany),
  });
  return {
    ok: Boolean(result.ok),
    output: JSON.stringify(result),
    json: result,
    command: `node ${JOB51_SEARCH_SCRIPT} --companies-json <${companies.length} companies> --area ${area || "000000"} --company-delay ${companyDelayRange.min}-${companyDelayRange.max}ms --action-delay ${actionDelayRange.min}-${actionDelayRange.max}ms`,
    mode: "job51_batch",
  };
}

async function job51SearchCompany(company, options = {}) {
  const area = options.area || "";
  const actionDelayRange = normalizeMsRange(options.actionDelayMinMs, options.actionDelayMaxMs, 1000, 3000, 30000);
  const result = await runJob51Json([
    "--company",
    company.name,
    "--area",
    area || "000000",
    "--limit",
    "20",
    "--action-delay-min-ms",
    String(actionDelayRange.min),
    "--action-delay-max-ms",
    String(actionDelayRange.max),
  ], {
    timeout: Math.max(120000, 90000 + actionDelayRange.max * 8),
  });
  return {
    ok: Boolean(result.ok),
    output: JSON.stringify(result),
    json: result,
    command: `node ${JOB51_SEARCH_SCRIPT} --company ${company.name} --area ${area || "000000"} --action-delay ${actionDelayRange.min}-${actionDelayRange.max}ms`,
    mode: "job51_single",
  };
}

async function openJob51LoginPage() {
  const child = spawn(
    NODE,
    [JOB51_SEARCH_SCRIPT, "--open-login"],
    {
      detached: true,
      stdio: "ignore",
      env: {
        ...process.env,
        GEEKRUN_DIR,
        JOB51_USER_DATA_DIR: JOB51_PROFILE_DIR,
      },
    },
  );
  child.unref();
  return {
    ok: true,
    output: "前程无忧登录浏览器已启动",
    command: `node ${JOB51_SEARCH_SCRIPT} --open-login`,
  };
}

function closeJob51Browser() {
  const escapedScript = JOB51_SEARCH_SCRIPT.replaceAll("'", "'\\''");
  const escapedProfile = JOB51_PROFILE_DIR.replaceAll("'", "'\\''");
  const script = [
    `pkill -f '${escapedScript} --open-login' 2>/dev/null || true`,
    `pkill -f '${escapedProfile}' 2>/dev/null || true`,
    `rm -f '${escapedProfile}/SingletonLock' '${escapedProfile}/SingletonCookie' '${escapedProfile}/SingletonSocket' 2>/dev/null || true`,
  ].join("\n");
  return new Promise((resolve) => {
    execFile("/bin/sh", ["-lc", script], { timeout: 10000 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        output: [stdout, stderr, error?.message].filter(Boolean).join("\n"),
      });
    });
  });
}

function summarizeJob51Failure(output) {
  const data = parseMaybeJson(output) || {};
  if (data.needsLogin) return "前程无忧需要先登录或通过验证";
  if (/SingletonLock|ProcessSingleton|chrome-profile-51job|profile directory/i.test(output || "")) {
    return "前程无忧登录浏览器还开着，请登录完成后关闭它再搜索";
  }
  if (data.message) return data.message;
  if (data.error) return `前程无忧错误：${data.error}`;
  return "前程无忧搜索失败";
}

async function releaseCompanyClaim(company, reason, status = "error") {
  if (!company?.id) return;
  await dbQuery(
    `UPDATE companies
     SET last_ai_read_date = coalesce(last_ai_read_date, CURRENT_DATE),
         last_ai_read_at = coalesce(last_ai_read_at, now()),
         ai_claimed_task_id = NULL,
         hiring_status = CASE WHEN hiring_status IN ('new', 'searching') THEN $3 ELSE hiring_status END,
         notes = $2,
         updated_at = now()
     WHERE id = $1`,
    [company.id, reason || null, status],
  );
}

async function releaseCompanyPlatformClaim(company, platformKey, reason, status = "error") {
  if (!company?.id || !platformKey) return;
  await dbQuery(
    `UPDATE companies
     SET ai_claimed_task_id = NULL,
         metadata = coalesce(metadata, '{}'::jsonb) #- ARRAY['platform_reads', $2::text],
         hiring_status = CASE WHEN hiring_status IN ('new', 'searching') THEN $4 ELSE hiring_status END,
         notes = $3,
         updated_at = now()
     WHERE id = $1`,
    [company.id, platformKey, reason || null, status],
  );
}

async function requeueErrorCompanies() {
  const result = await dbQuery(
    `UPDATE companies
     SET hiring_status = 'new',
         last_ai_read_date = NULL,
         last_ai_read_at = NULL,
         ai_claimed_task_id = NULL,
         ai_claimed_at = NULL,
         notes = coalesce(notes, '') || CASE WHEN coalesce(notes, '') = '' THEN '' ELSE E'\n' END || '用户操作：已从 error 重置为待处理。',
         updated_at = now()
     WHERE hiring_status = 'error'
     RETURNING id, name`,
  );
  pushDbAgentLog("错误企业已重置为待处理", { count: result.rows.length });
  return {
    updated: result.rows.length,
    samples: result.rows.slice(0, 10).map((row) => row.name),
  };
}

async function analyzeBossJobs({ apiKey, model, company, bossResult }) {
  const bossText = typeof bossResult.json === "object" && bossResult.json
    ? JSON.stringify(bossResult.json).slice(0, 30000)
    : String(bossResult.output || "").slice(0, 30000);

  return callDeepSeekJson({
    apiKey,
    model,
    messages: [
      {
        role: "system",
        content:
          "你是招聘数据清洗助手。只返回 JSON，不要输出解释。判断 BOSS 直聘搜索结果中是否有目标公司的真实招聘岗位。必须严格匹配公司名称，不能把同名/相似公司误判为目标公司。",
      },
      {
        role: "user",
        content: `目标公司：${company.name}
城市：${company.city || ""}
行业：${company.industry || ""}

BOSS 搜索原始结果：
${bossText}

请返回 JSON：
{
  "found": true/false,
  "company_status": "actively_hiring" 或 "no_recent_jobs",
  "note": "简短中文备注，说明证据或没找到",
  "jobs": [
    {
      "title": "岗位名",
      "location": "地点",
      "salary": "薪资",
      "education": "学历",
      "experience": "经验",
      "description": "岗位要求/JD，尽量保留关键要求",
      "apply_url": "投递链接或岗位链接",
      "source_url": "来源链接",
      "evidence_text": "用于证明岗位属于目标公司的文本"
    }
  ]
}
如果没有严格匹配目标公司的岗位，found=false，jobs=[]。`,
      },
    ],
  });
}

async function writeGeekrunResultToDb(company, analyzed = {}) {
  const jobs = Array.isArray(analyzed.jobs) ? analyzed.jobs : [];

  if (!analyzed.found || jobs.length === 0) {
    await ensureCompany(company.name, {
      hiring_status: "no_recent_jobs",
      notes: analyzed.message || "GeekRun 未找到严格匹配的近期岗位",
    }, { markAiWrite: true });
    await addCompanyNote({
      company_name: company.name,
      note_type: "geekrun_search",
      content: analyzed.message || "GeekRun 未找到严格匹配的近期岗位，记录为无。",
    });
    pushDbAgentLog("未找到岗位，已记录无", { name: company.name });
    return { exhausted: false, company, found: false, jobs: [] };
  }

  const inserted = [];
  for (const job of jobs.slice(0, 20)) {
    inserted.push(await addJob({
      company_name: company.name,
      title: job.title || "未命名岗位",
      location: job.location || "",
      salary: job.salary || "",
      education: job.education || "",
      experience: job.experience || "",
      description: job.description || job.evidence_text || "",
      apply_url: job.apply_url || job.source_url || "",
      source_platform: "GeekRun/BOSS直聘",
      source_url: job.source_url || job.apply_url || "",
      status: "found",
      evidence_text: job.evidence_text || analyzed.message || "",
      metadata: { dbAgent: true, source: "geekrun", raw: job.raw || null },
    }));
  }
  await addCompanyNote({
    company_name: company.name,
    note_type: "geekrun_search",
    content: analyzed.message || `GeekRun 找到 ${inserted.length} 个岗位。`,
  });
  pushDbAgentLog("找到岗位并写入数据库", { name: company.name, jobs: inserted.length });
  return { exhausted: false, company, found: true, jobs: inserted };
}

async function processOneBossCompany({ apiKey, model = DEFAULT_MODEL, city = "", status = "new" }) {
  const claimed = await claimNextCompanies({ status, limit: 1, taskId: "db-boss-agent" });
  if (claimed.exhausted || !claimed.rows.length) {
    pushDbAgentLog("今天没有可处理企业了", { status });
    return { exhausted: true, message: claimed.message || "今天没有可处理企业了" };
  }

  const company = claimed.rows[0];
  dbAgentState.current = company;
  pushDbAgentLog("领取企业", { id: company.id, name: company.name });

  const bossResult = await bossSearchCompany(company, { city });
  if (!bossResult.ok) {
    const failureSummary = summarizeGeekrunFailure(bossResult.output);
    await releaseCompanyClaim(company, `${failureSummary}，未计入今日处理。`);
    await addCompanyNote({
      company_name: company.name,
      note_type: "geekrun_error",
      content: `GeekRun 搜索失败。命令：${bossResult.command}。输出：${bossResult.output || ""}`.slice(0, 4000),
    });
    pushDbAgentLog(failureSummary, { name: company.name });
    throw new Error(`${failureSummary}，已停止后台通道。`);
  }

  return writeGeekrunResultToDb(company, bossResult.json || {});
}

async function processGeekrunCompanyBatch(options = {}) {
  const city = options.city || "";
  const status = options.status || "new";
  const maxCompanies = options.maxCompanies || 1;
  const limit = Math.max(1, Math.min(Number(maxCompanies || 1), 100));
  const claimed = await claimNextCompanies({ status, limit, taskId: "db-geekrun-agent" });
  if (claimed.exhausted || !claimed.rows.length) {
    pushDbAgentLog("今天没有可处理企业了", { status });
    return { exhausted: true, processed: 0, message: claimed.message || "今天没有可处理企业了" };
  }

  const companies = claimed.rows;
  pushDbAgentLog("批量领取企业", { count: companies.length, names: companies.map((company) => company.name).slice(0, 5) });

  let batchResult;
  try {
    batchResult = await bossSearchCompanies(companies, options);
  } catch (error) {
    const message = dbAgentState.stopRequested ? "GeekRun 批量搜索已暂停" : (error.message || String(error));
    for (const company of companies) {
      await releaseCompanyClaim(company, `${message}，未计入今日处理。`);
    }
    throw new Error(message);
  }
  const results = Array.isArray(batchResult.json?.results) ? batchResult.json.results : [];
  const resultsById = new Map(results.filter((result) => result.companyId).map((result) => [String(result.companyId), result]));
  const resultsByName = new Map(results.filter((result) => result.company).map((result) => [normalizeCompanyName(result.company), result]));

  let processed = 0;
  for (const company of companies) {
    const result = resultsById.get(String(company.id)) || resultsByName.get(normalizeCompanyName(company.name));
    dbAgentState.current = company;
    if (result?.ok) {
      await writeGeekrunResultToDb(company, result);
      processed += 1;
      dbAgentState.processed = processed;
      continue;
    }
    const failureSummary = summarizeGeekrunFailure(result ? JSON.stringify(result) : batchResult.output);
    await releaseCompanyClaim(company, `${failureSummary}，未计入今日处理。`);
    await addCompanyNote({
      company_name: company.name,
      note_type: "geekrun_error",
      content: `GeekRun 批量搜索未完成。命令：${batchResult.command}。输出：${batchResult.output || ""}`.slice(0, 4000),
    });
  }

  if (!batchResult.ok) {
    const failureSummary = summarizeGeekrunFailure(batchResult.output);
    pushDbAgentLog(failureSummary, { processed, total: companies.length });
    throw new Error(`${failureSummary}，已停止后台通道。`);
  }

  return { exhausted: false, processed, total: companies.length };
}

async function runDbBossAgent(options) {
  const companyDelayRange = normalizeMsRange(options.companyDelayMinMs, options.companyDelayMaxMs, 8000, 15000, 120000);
  const actionDelayRange = normalizeMsRange(options.actionDelayMinMs, options.actionDelayMaxMs, 1000, 3000, 30000);
  dbAgentState.running = true;
  dbAgentState.stopRequested = false;
  dbAgentState.current = null;
  dbAgentState.processed = 0;
  dbAgentState.startedAt = new Date().toISOString();
  dbAgentState.finishedAt = null;
  dbAgentState.lastError = null;
  pushDbAgentLog("GeekRun 岗位通道启动", {
    maxCompanies: options.maxCompanies || 1,
    companyDelayMs: companyDelayRange,
    actionDelayMs: actionDelayRange,
  });

  try {
    if (dbAgentState.stopRequested) return;
    const result = await processGeekrunCompanyBatch(options);
    dbAgentState.processed = result.processed || 0;
  } catch (error) {
    dbAgentState.lastError = error.message || String(error);
    pushDbAgentLog("GeekRun 岗位通道出错", { error: dbAgentState.lastError });
  } finally {
    dbAgentState.running = false;
    dbAgentState.current = null;
    dbAgentState.finishedAt = new Date().toISOString();
    pushDbAgentLog("GeekRun 岗位通道结束", { processed: dbAgentState.processed, error: dbAgentState.lastError });
  }
}

async function writeJob51ResultToDb(company, analyzed = {}) {
  const jobs = Array.isArray(analyzed.jobs) ? analyzed.jobs : [];

  if (!analyzed.found || jobs.length === 0) {
    await ensureCompany(company.name, {
      hiring_status: "no_recent_jobs",
      notes: analyzed.message || "前程无忧未找到严格匹配的近期岗位",
    }, { markAiWrite: true });
    await addCompanyNote({
      company_name: company.name,
      note_type: "job51_search",
      content: analyzed.message || "前程无忧未找到严格匹配的近期岗位，记录为无。",
    });
    pushJob51AgentLog("未找到岗位，已记录无", { name: company.name });
    return { exhausted: false, company, found: false, jobs: [] };
  }

  const inserted = [];
  for (const job of jobs.slice(0, 20)) {
    inserted.push(await addJob({
      company_name: company.name,
      title: job.title || "未命名岗位",
      location: job.location || "",
      salary: job.salary || "",
      education: job.education || "",
      experience: job.experience || "",
      description: job.description || job.evidence_text || "",
      apply_url: job.apply_url || job.source_url || "",
      source_platform: "前程无忧/51job",
      source_url: job.source_url || job.apply_url || "",
      status: "found",
      evidence_text: job.evidence_text || analyzed.message || "",
      metadata: { dbAgent: true, source: "51job", raw: job.raw || null },
    }));
  }
  await addCompanyNote({
    company_name: company.name,
    note_type: "job51_search",
    content: analyzed.message || `前程无忧找到 ${inserted.length} 个岗位。`,
  });
  pushJob51AgentLog("找到岗位并写入数据库", { name: company.name, jobs: inserted.length });
  return { exhausted: false, company, found: true, jobs: inserted };
}

async function processJob51CompanyBatch(options = {}) {
  const status = options.status || "new";
  const maxCompanies = options.maxCompanies || 1;
  const limit = Math.max(1, Math.min(Number(maxCompanies || 1), 100));
  const statuses = resolveJob51Statuses(status);
  const companyDelayRange = options.delayMs !== undefined && options.companyDelayMinMs === undefined && options.companyDelayMaxMs === undefined
    ? normalizeMsRange(options.delayMs, options.delayMs, 8000, 8000, 120000)
    : normalizeMsRange(options.companyDelayMinMs, options.companyDelayMaxMs, 8000, 15000, 120000);
  let processed = 0;
  let exhausted = false;

  for (let index = 0; index < limit; index += 1) {
    if (job51AgentState.stopRequested) break;
    const claimed = await claimNextCompaniesForPlatform({ statuses, limit: 1, taskId: "db-job51-agent", platformKey: "51job" });
    if (claimed.exhausted || !claimed.rows.length) {
      exhausted = true;
      pushJob51AgentLog("今天没有可由前程无忧处理的企业了", { status, statuses, processed });
      break;
    }

    const company = claimed.rows[0];
    job51AgentState.current = company;
    pushJob51AgentLog("领取企业并开始前程无忧搜索", { id: company.id, name: company.name, index: index + 1, limit });

    let companyResult;
    try {
      companyResult = await job51SearchCompany(company, options);
    } catch (error) {
      const message = job51AgentState.stopRequested ? "前程无忧搜索已暂停" : (error.message || String(error));
      await releaseCompanyPlatformClaim(company, "51job", `${message}，未计入前程无忧今日处理。`);
      throw new Error(message);
    }

    if (companyResult.json?.ok) {
      await writeJob51ResultToDb(company, companyResult.json);
      processed += 1;
      job51AgentState.processed = processed;
      if (index < limit - 1 && !job51AgentState.stopRequested) await sleep(Math.max(0, Math.min(companyDelayRange.max, companyDelayRange.min + Math.floor(Math.random() * (companyDelayRange.max - companyDelayRange.min + 1)))));
      continue;
    }

    const failureSummary = summarizeJob51Failure(companyResult.output);
    await releaseCompanyPlatformClaim(company, "51job", `${failureSummary}，未计入前程无忧今日处理。`);
    await addCompanyNote({
      company_name: company.name,
      note_type: "job51_error",
      content: `前程无忧搜索未完成。命令：${companyResult.command}。输出：${companyResult.output || ""}`.slice(0, 4000),
    });
    pushJob51AgentLog(failureSummary, { name: company.name, processed });
    throw new Error(`${failureSummary}，已停止前程无忧通道。`);
  }

  return { exhausted, processed, total: limit };
}

async function runJob51Agent(options) {
  const companyDelayRange = normalizeMsRange(options.companyDelayMinMs, options.companyDelayMaxMs, 8000, 15000, 120000);
  const actionDelayRange = normalizeMsRange(options.actionDelayMinMs, options.actionDelayMaxMs, 1000, 3000, 30000);
  job51AgentState.running = true;
  job51AgentState.stopRequested = false;
  job51AgentState.current = null;
  job51AgentState.processed = 0;
  job51AgentState.startedAt = new Date().toISOString();
  job51AgentState.finishedAt = null;
  job51AgentState.lastError = null;
  pushJob51AgentLog("前程无忧岗位通道启动", {
    maxCompanies: options.maxCompanies || 1,
    area: options.area || "000000",
    companyDelayMs: companyDelayRange,
    actionDelayMs: actionDelayRange,
  });

  try {
    if (job51AgentState.stopRequested) return;
    const result = await processJob51CompanyBatch(options);
    job51AgentState.processed = result.processed || 0;
  } catch (error) {
    job51AgentState.lastError = error.message || String(error);
    pushJob51AgentLog("前程无忧岗位通道出错", { error: job51AgentState.lastError });
  } finally {
    job51AgentState.running = false;
    job51AgentState.current = null;
    job51AgentState.finishedAt = new Date().toISOString();
    pushJob51AgentLog("前程无忧岗位通道结束", { processed: job51AgentState.processed, error: job51AgentState.lastError });
  }
}

function getSession(sessionId) {
  const id = sessionId || randomUUID();
  if (!sessions.has(id)) {
    sessions.set(id, [{ role: "system", content: systemPrompt }]);
  }
  ensureTaskSession(id).catch(() => {});
  return { id, messages: sessions.get(id) };
}

function normalizeMessage(message) {
  if (message.role === "assistant") {
    const normalized = {
      role: "assistant",
      content: message.content ?? "",
    };
    if (Array.isArray(message.tool_calls) && message.tool_calls.length) {
      normalized.tool_calls = message.tool_calls;
    }
    return normalized;
  }
  return message;
}

function compactHistory(messages) {
  const normalized = messages.map(normalizeMessage);
  if (normalized.length <= 34) return normalized;

  const system = normalized[0];
  const tail = normalized.slice(1);
  let start = Math.max(0, tail.length - 33);

  // A message with role "tool" is only valid immediately after the assistant
  // message that contains its matching tool_calls. If history truncation starts
  // inside that block, step back to include the assistant tool_call message.
  while (start > 0 && tail[start]?.role === "tool") {
    start -= 1;
  }

  // If the retained history still starts with orphan tool output, drop it.
  while (start < tail.length && tail[start]?.role === "tool") {
    start += 1;
  }

  return [system, ...tail.slice(start)];
}

async function handleChat(req, res) {
  let context;
  try {
    const body = await readJson(req);
    const apiKey = String(body.apiKey || "").trim();
    const userMessage = String(body.message || "").trim();
    const model = String(body.model || DEFAULT_MODEL).trim();
    if (!apiKey) return json(res, 400, { error: "请填写 DeepSeek API Key" });
    if (!userMessage) return json(res, 400, { error: "请输入指令" });
    if (!existsSync(BB_BROWSER)) return json(res, 500, { error: `找不到 bb-browser: ${BB_BROWSER}` });

    const { id, messages } = getSession(body.sessionId);
    context = createRunContext(id);
    await autoIngestDownloadsForContext(context, "chat_start").catch(() => null);
    messages.push({ role: "user", content: userMessage });
    await appendTaskMessage(id, "user", userMessage);
    const events = [];
    let finalText = "";

    for (let step = 0; step < MAX_STEPS; step += 1) {
      assertNotCancelled(context);
      const data = await callDeepSeek({ apiKey, model, messages: compactHistory(messages), context });
      const choice = data.choices?.[0];
      const assistant = choice?.message;
      if (!assistant) throw new Error("DeepSeek 响应里没有 message");

      messages.push(normalizeMessage(assistant));
      events.push({ type: "assistant", content: assistant.content || "", toolCalls: assistant.tool_calls || [] });

      const toolCalls = assistant.tool_calls || [];
      if (!toolCalls.length) {
        finalText = assistant.content || "";
        await appendTaskMessage(id, "assistant", finalText);
        break;
      }

      for (const call of toolCalls) {
        assertNotCancelled(context);
        const toolName = call.function?.name;
        let toolArgs = {};
        try {
          toolArgs = call.function?.arguments ? JSON.parse(call.function.arguments) : {};
        } catch {
          toolArgs = { parseError: call.function?.arguments || "" };
        }
        const result = await executeTool(toolName, toolArgs, context);
        assertNotCancelled(context);
        events.push({ type: "tool", name: toolName, args: toolArgs, result });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    if (!finalText) {
      finalText = "已达到最大工具调用步数。你可以继续发下一条指令，我会接着当前状态处理。";
      await appendTaskMessage(id, "assistant", finalText, { maxSteps: true });
    }
    await autoIngestDownloadsForContext(context, "chat_finish").catch(() => null);
    json(res, 200, { sessionId: id, reply: finalText, events });
  } catch (error) {
    if (context?.cancelled || error.name === "AbortError") {
      return json(res, 200, {
        sessionId: context?.sessionId,
        cancelled: true,
        reply: context?.reason || "执行已暂停。",
        events: [],
      });
    }
    json(res, 500, { error: error.message || String(error) });
  } finally {
    if (context && !context.cancelled) {
      autoIngestDownloadsForContext(context, "chat_finally").catch(() => {});
    }
    if (context && activeRuns.get(context.sessionId) === context) {
      activeRuns.delete(context.sessionId);
    }
  }
}

async function handleReset(req, res) {
  const body = await readJson(req).catch(() => ({}));
  const context = activeRuns.get(body.sessionId);
  if (context) context.cancel("会话已重置");
  if (body.sessionId) {
    if (ingestState.taskId === safeTaskId(body.sessionId)) stopIngestWatcher();
    sessions.delete(body.sessionId);
    dbQuery("UPDATE task_sessions SET status = 'closed', updated_at = now() WHERE id = $1", [safeTaskId(body.sessionId)]).catch(() => {});
    appendTaskMessage(body.sessionId, "system", "会话已结束。").catch(() => {});
  }
  json(res, 200, { ok: true });
}

async function handleCancel(req, res) {
  const body = await readJson(req).catch(() => ({}));
  const sessionId = body.sessionId;
  if (!sessionId) return json(res, 400, { error: "缺少 sessionId" });

  const context = activeRuns.get(sessionId);
  if (!context) return json(res, 200, { ok: false, message: "当前没有正在执行的任务" });

  context.cancel("用户已暂停执行。");
  json(res, 200, { ok: true, message: "已发送暂停信号" });
}

function parseTabs(tabListOutput) {
  const tabs = [];
  for (const line of String(tabListOutput || "").split("\n")) {
    const match = line.match(/^\s*(\*)?\s*\[([^\]]+)\]/);
    if (match) {
      tabs.push({ id: match[2], active: Boolean(match[1]) });
    }
  }
  return tabs;
}

async function handleCloseTabs(req, res) {
  try {
    const body = await readJson(req).catch(() => ({}));
    const keepActive = body.keepActive !== false;
    const listed = await runBb(["tab", "list"]);
    if (!listed.ok) {
      return json(res, 500, { error: listed.output || "无法读取标签页列表" });
    }

    const tabs = parseTabs(listed.output);
    const activeTab = tabs.find((tab) => tab.active);
    const keepId = keepActive ? activeTab?.id : null;
    const targets = tabs.filter((tab) => tab.id !== keepId);
    const results = [];

    for (const tab of targets) {
      results.push({ tab: tab.id, result: await runBb(["close", "--tab", tab.id]) });
    }

    const closed = results.filter((item) => item.result.ok).length;
    json(res, 200, {
      ok: true,
      total: tabs.length,
      kept: keepId || null,
      closed,
      failed: results.length - closed,
      message: keepId
        ? `已关闭 ${closed} 个标签页，保留当前标签 ${keepId}。`
        : `已关闭 ${closed} 个标签页。`,
    });
  } catch (error) {
    json(res, 500, { error: error.message || String(error) });
  }
}

const industrySystemPrompt = `你是产业政策信息提取助手。You must return valid json only.

请根据用户提供的信息、要求、简历内容或图片内容，确定用户关注的国家或地区。

然后基于可验证、准确、公开的信息，查询该国家或地区当前正在明确支持、鼓励或重点发展的行业。

重要要求：
1. 不要自行推断。
2. 不要根据常识猜测。
3. 只基于准确、可验证的政策、政府文件、官方公告、权威机构报告或可靠新闻来源。
4. 如果没有找到准确信息，不要输出该行业。
5. 只返回编号加行业名称。
6. 不要返回解释、原因、来源、Markdown 或其他文字。
7. 行业名称要简洁，方便程序拆分并写入 PostgreSQL。
8. 未能读取正文的文件只能作为附件记录，不得作为行业判断依据。

返回格式必须严格如下：

{
  "industries": [
    {
      "number": 1,
      "industry": "xx行业"
    }
  ]
}

如果无法基于准确信息确认任何行业，请返回：

{
  "industries": []
}`;

function parseModelJsonObject(content) {
  const cleaned = String(content || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(`模型没有返回有效 JSON：${cleaned.slice(0, 500)}`);
  }
}

function normalizeIndustriesForWorkflow(industries = []) {
  return (Array.isArray(industries) ? industries : [])
    .map((item, index) => {
      if (typeof item === "string") return { number: index + 1, industry: item.trim() };
      return {
        number: Number.isInteger(item?.number) ? item.number : index + 1,
        industry: String(item?.industry || "").trim(),
      };
    })
    .filter((item) => item.industry);
}

function buildIndustryMessages({ region, userInfo, resumeText, files = [] }) {
  const fileTexts = [];
  const manifest = [];
  const content = [];
  for (const file of files) {
    const item = {
      name: String(file.name || ""),
      type: String(file.type || "unknown"),
      size: Number(file.size || 0),
      status: file.dataUrl ? "image_sent" : (file.text ? "text_extracted" : "not_extracted"),
    };
    manifest.push(item);
    if (file.text) fileTexts.push(`文件：${item.name}\n${String(file.text).slice(0, 12000)}`);
  }

  content.push({
    type: "text",
    text: [
      "输出格式提醒：必须返回有效 json，且只能返回 json_object。",
      "",
      `目标国家或地区：${region}`,
      "",
      "用户信息或要求：",
      userInfo || "未提供",
      "",
      "简历文本：",
      resumeText || "未提供",
      "",
      "已读取文本文件：",
      fileTexts.length ? fileTexts.join("\n\n") : "无",
      "",
      "附件记录：",
      manifest.length ? JSON.stringify(manifest, null, 2) : "无",
    ].join("\n"),
  });

  for (const file of files) {
    if (!file.dataUrl) continue;
    content.push({
      type: "image_url",
      image_url: { url: file.dataUrl },
    });
  }

  return [
    { role: "system", content: industrySystemPrompt },
    { role: "user", content },
  ];
}

async function callArkJson({ apiKey, model, messages }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(ARK_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: model || DEFAULT_ARK_MODEL,
        temperature: 0,
        max_tokens: 300,
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
        messages,
      }),
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`豆包返回非 JSON (${response.status}): ${text.slice(0, 500)}`);
    }
    if (!response.ok) {
      throw new Error(data?.error?.message || `豆包接口错误：${response.status}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function handleIndustryAnalyze(req, res) {
  try {
    const body = await readJson(req);
    const apiKey = String(body.apiKey || "").trim();
    const region = String(body.region || "").trim();
    const model = String(body.model || DEFAULT_ARK_MODEL).trim();
    if (!apiKey) return json(res, 400, { error: "请填写 Ark API Key" });
    if (!region) return json(res, 400, { error: "请填写国家或地区" });

    const data = await callArkJson({
      apiKey,
      model,
      messages: buildIndustryMessages({
        region,
        userInfo: String(body.userInfo || "").trim(),
        resumeText: String(body.resumeText || "").trim(),
        files: Array.isArray(body.files) ? body.files : [],
      }),
    });
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("豆包没有返回可读取内容");
    const parsed = parseModelJsonObject(content);
    if (!Array.isArray(parsed.industries)) throw new Error("模型返回 JSON 不符合 industries 数组格式");
    parsed.industries = normalizeIndustriesForWorkflow(parsed.industries);
    return json(res, 200, { ok: true, ...parsed, raw: data });
  } catch (error) {
    json(res, 500, { error: error.message || String(error) });
  }
}

function buildTianyanchaPrompt(region, industry, number) {
  return `请使用 bb-browser 按顺序完成天眼查高级搜索任务。这是第 ${number} 个行业。

地区：${region}
行业：${industry}

目标：
1. 打开天眼查，进入高级搜索。
2. 在高级搜索中按“地区=${region}、行业=${industry}”设置筛选条件。
3. 风险信息必须只保留低风险企业，筛选项必须尽量选择：
   - 无失信被执行人
   - 无被执行人 / 非执行人
   - 无限制高消费
   - 无破产案件
   - 无经营异常
4. 点击查询。
5. 从结果页提取企业名单，优先提取前 50 家公司名称。
6. 对每一家确认到的公司调用 db_update_company 写入招聘数据库，字段建议：
   name=公司名称
   city 或 province=${region}
   industry=${industry}
   source=tianyancha_advanced_search
   hiring_status=new
   notes=天眼查高级搜索筛选：地区 ${region}，行业 ${industry}，风险信息无失信/无被执行/无限高/无破产/无经营异常
7. 如果页面存在“下载/导出/导出名单”按钮，并且当前账号权限允许，请只点击一次下载。
8. 下载后等待几秒，并调用 db_recent_downloads 查看最近下载文件。
9. 如果需要登录、验证码、会员权限、下载权限、或 Chrome 安全提示，不要绕过，不要反复点击，停止并在 blockers 中说明。

限制：
- 不要绕过验证码、登录、付费墙、风控或权限限制。
- 不要猜公司名；只记录页面上真实看到或下载文件中确认的公司名。
- 如果某个筛选项在天眼查页面没有同名控件，请选择含义最接近的控件，并在 notes 里说明。

最终回复必须尽量只返回 JSON：
{
  "region": "${region}",
  "industry": "${industry}",
  "companies": ["公司名称1", "公司名称2"],
  "download_files": ["下载文件路径或文件名"],
  "blockers": [],
  "notes": "简短说明"
}`;
}

function uniqueStrings(items = []) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const value = String(item || "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function looksLikeCompanyName(name) {
  const compact = String(name || "").replace(/\s+/g, "");
  if (compact.length < 4 || compact.length > 80) return false;
  return !["公司名称", "企业名称", "暂无数据", "登录", "验证码", "下载", "导出"].some((word) => compact.includes(word));
}

function extractCompaniesFromChat(chat) {
  const names = [];
  const parsed = parseMaybeJson(chat.reply || "") || parseModelJsonObjectSafe(chat.reply || "");
  if (parsed && Array.isArray(parsed.companies)) names.push(...parsed.companies);
  for (const event of chat.events || []) {
    if (event.name !== "db_update_company") continue;
    const args = event.args || {};
    const row = event.result?.row || {};
    names.push(args.name || row.name || "");
  }
  return uniqueStrings(names).filter(looksLikeCompanyName);
}

function parseModelJsonObjectSafe(text) {
  try {
    return parseModelJsonObject(text);
  } catch {
    return null;
  }
}

async function runInternalChat({ apiKey, model, message, sessionId }) {
  const response = await fetch(`http://127.0.0.1:${PORT}/api/chat`, {
    method: "POST",
    signal: AbortSignal.timeout(900000),
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ apiKey, model, message, sessionId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `浏览器任务失败：HTTP ${response.status}`);
  return data;
}

async function importCompanyNamesFromIndustry(names, region, industry) {
  const rows = uniqueStrings(names).filter(looksLikeCompanyName).map((name) => ({
    "企业名称": name,
    "地区": region,
    "行业": industry,
    "来源": "tianyancha_advanced_search_reply",
    "备注": `来自天眼查高级搜索：${region} / ${industry}`,
  }));
  if (!rows.length) return { imported: 0, skipped: 0, samples: [], counts: await getDbCounts() };
  return importCompanies(rows, `tyc-${region}-${industry}`);
}

async function handleIndustryTycRun(req, res) {
  try {
    const body = await readJson(req);
    const apiKey = String(body.apiKey || "").trim();
    const model = String(body.model || DEFAULT_MODEL).trim();
    const region = String(body.region || "").trim();
    const sessionId = String(body.sessionId || `tyc-${Date.now()}`).trim();
    const industries = normalizeIndustriesForWorkflow(body.industries);
    if (!apiKey) return json(res, 400, { error: "请填写浏览器 API Key" });
    if (!region) return json(res, 400, { error: "请填写地区" });
    if (!industries.length) return json(res, 400, { error: "没有可执行的行业" });

    await initDatabase();
    const results = [];
    const allCompanies = [];
    let importedCompanies = 0;
    for (const item of industries) {
      const chat = await runInternalChat({
        apiKey,
        model,
        sessionId: `${sessionId}-${item.number}`,
        message: buildTianyanchaPrompt(region, item.industry, item.number),
      });
      const companies = extractCompaniesFromChat(chat);
      const companyImport = await importCompanyNamesFromIndustry(companies, region, item.industry);
      importedCompanies += Number(companyImport.imported || 0);
      allCompanies.push(...companies);
      results.push({
        number: item.number,
        industry: item.industry,
        companies,
        companyImport,
        reply: chat.reply || "",
        sessionId: chat.sessionId,
      });
    }

    json(res, 200, {
      ok: true,
      region,
      results,
      companies: uniqueStrings(allCompanies),
      importedCompanies,
      counts: await getDbCounts(),
      message: `已完成 ${results.length} 个行业任务，导入企业 ${importedCompanies} 家。`,
    });
  } catch (error) {
    json(res, 500, { error: error.message || String(error) });
  }
}

async function handleDb(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname === "/api/db/status") {
      return json(res, 200, await dbStatus(url.searchParams.get("sessionId")));
    }
    if (req.method === "POST" && url.pathname === "/api/db/init") {
      return json(res, 200, await initDatabase());
    }
    json(res, 404, { error: "unknown db endpoint" });
  } catch (error) {
    json(res, 500, { error: error.message || String(error) });
  }
}

async function parseCompanyUpload({ filename, content, base64 }) {
  await mkdir(UPLOADS_DIR, { recursive: true });
  const safeFilename = safeName(filename || `companies-${Date.now()}.csv`);
  const filePath = path.join(UPLOADS_DIR, `${Date.now()}-${safeFilename}`);
  const bytes = base64 ? Buffer.from(base64, "base64") : Buffer.from(String(content || ""), "utf8");
  await writeFile(filePath, bytes);
  try {
    const parsed = await runJsonCommand(PYTHON, [path.join(__dirname, "parse_table.py"), filePath]);
    return { rows: parsed.rows || [], filePath };
  } finally {
    unlink(filePath).catch(() => {});
  }
}

async function handleImportCompanies(req, res) {
  try {
    const body = await readJson(req);
    const parsed = await parseCompanyUpload(body);
    if (!parsed.rows.length) return json(res, 400, { error: "没有解析到企业数据，请确认文件有表头和企业名称列" });
    const result = await importCompanies(parsed.rows, body.filename || "upload");
    json(res, 200, { ok: true, ...result });
  } catch (error) {
    json(res, 500, { error: error.message || String(error) });
  }
}

async function handleDownloadIngest(req, res) {
  try {
    const body = await readJson(req).catch(() => ({}));
    const action = body.action || "status";
    const task = body.sessionId ? await ensureTaskSession(body.sessionId) : null;
    if (action === "status") {
      return json(res, 200, {
        ok: true,
        taskId: task?.taskId || ingestState.taskId,
        taskDownloadsDir: task?.downloadsDir || null,
        downloadsDir: DOWNLOADS_DIR,
        enabled: ingestState.enabled,
        sinceMs: ingestState.sinceMs,
        lastScan: ingestState.lastScan,
        lastResult: ingestState.lastResult,
      });
    }
    if (action === "scan") {
      if (!task) return json(res, 400, { error: "缺少 sessionId，无法确定当前任务" });
      return json(res, 200, {
        ok: true,
        taskId: task.taskId,
        taskDownloadsDir: task.downloadsDir,
        downloadsDir: DOWNLOADS_DIR,
        result: await scanDownloads(body.limit || 200, task.taskId),
      });
    }
    if (action === "start") {
      if (!task) return json(res, 400, { error: "缺少 sessionId，无法确定当前任务" });
      startIngestWatcher(task.taskId, { sinceMs: Date.now() - 5000 });
      return json(res, 200, {
        ok: true,
        taskId: task.taskId,
        taskDownloadsDir: task.downloadsDir,
        downloadsDir: DOWNLOADS_DIR,
        enabled: true,
        sinceMs: ingestState.sinceMs,
        lastResult: ingestState.lastResult,
      });
    }
    if (action === "stop") {
      stopIngestWatcher();
      return json(res, 200, { ok: true, downloadsDir: DOWNLOADS_DIR, enabled: false });
    }
    json(res, 400, { error: `unknown action: ${action}` });
  } catch (error) {
    json(res, 500, { error: error.message || String(error) });
  }
}

function buildCompanyRiskMessages({ companyName, jobTitle, reportText, fileName }) {
  return [
    {
      role: "system",
      content: `你是一名企业信用风险分析师，同时熟悉求职避坑、劳动关系风险、企业经营风险和招聘合规风险。
你必须严格基于企业信用报告内容分析，不要编造报告中没有的信息。
如果某项报告未体现，请明确写“报告未体现”。
请输出合法 JSON，不要输出 Markdown，不要输出 JSON 以外的内容。`,
    },
    {
      role: "user",
      content: `我准备去这家公司求职。请你从“求职者是否适合入职”的角度分析这家公司怎么样。

公司名称：
${companyName}

用户求职职位：
${jobTitle}

报告文件名：
${fileName || "报告未体现"}

企业信用报告内容：
${String(reportText || "").slice(0, 90000)}

请重点分析：
1. 司法与合规风险：被执行人、失信被执行人、限制高消费、诉讼、劳动仲裁、劳务纠纷、行政处罚、严重违法、经营异常，以及是否影响工资发放、劳动合同稳定性和公司信誉。
2. 经营稳定性：成立年限、注册资本与实缴资本、经营状态、年报情况、经营异常历史、法人/股东/地址/经营范围是否频繁变更。
3. 用工风险：劳动合同纠纷、工资拖欠、社保纠纷、工伤争议、社保参保人数是否合理、是否可能不缴社保/外包/挂靠/人员流动异常。
4. 企业正规度：商标、专利、软著、资质证书、经营范围是否和求职职位匹配、业务是否清晰、是否疑似空壳/皮包/外包壳公司。
5. 股权与关联风险：股东和实控人是否清晰、股权嵌套、关联企业是否有失信/破产/被执行/严重违法、股东背景是否稳定可信。

同时请按以下 12 项评分，满分 100 分。每一项都要给 score、max_score、reason、evidence、missing_fields、risk_level：
1. 被执行人记录，10分：无记录得10分；近3年1-2条已履行得5分；≥3条/有未履行得0分。
2. 劳动仲裁/劳务纠纷，10分：无记录得10分；近3年1-3条已结案得5分；≥4条/有未结得0分。
3. 行政处罚记录，10分：无记录得10分；近3年1-2条单条罚款＜1万得5分；≥3条/单条罚款≥10万得0分。
4. 企业成立年限，8分：成立≥5年得8分；3-5年得5分；1-3年得3分；不满1年得0分。
5. 注册资本实缴情况，8分：实缴比例≥50%得8分；部分实缴＜50%得4分；全认缴无实缴得0分。
6. 年报与经营异常历史，9分：连续3年正常年报、无异常记录得9分；有异常已移出得4分；2年未报年报得0分。
7. 社保参保人数，10分：≥50人得10分；10-49人得7分；1-9人得3分；0人得0分。
8. 知识产权/行业资质，8分：商标/专利/软著≥3项，或有行业必备资质得8分；1-2项得4分；全无得0分。
9. 经营范围匹配度，7分：求职职位与经营范围高度匹配得7分；关联一般得3分；完全无关得0分。
10. 股权结构清晰度，8分：实控人明确、股权无多层嵌套得8分；结构较分散可追溯得4分；实控人不明得0分。
11. 关联企业风险，7分：关联企业无重大风险得7分；有少量非核心风险得3分；关联方有失信/破产得0分。
12. 股东背景质量，5分：有机构/上市公司股东得5分；自然人股东无负面得3分；股东有失信记录得0分。

输出 JSON 格式：
{
  "company_name": "${companyName}",
  "job_title": "${jobTitle}",
  "report_file_name": "${fileName || ""}",
  "overall_conclusion": "推荐入职/可以考虑但需确认/谨慎入职/不建议入职",
  "risk_level": "低风险/中低风险/中风险/中高风险/高风险",
  "job_safety_score": 0,
  "summary": "用3-5句话说明这家公司是否适合求职者入职",
  "score_items": [
    {
      "item_name": "被执行人记录",
      "score": 0,
      "max_score": 10,
      "reason": "为什么给这个分",
      "evidence": "报告中的关键事实或报告未体现",
      "missing_fields": [],
      "risk_level": "低/中/高"
    }
  ],
  "positive_points": [
    {
      "point": "加分项",
      "evidence": "报告中的依据"
    }
  ],
  "risk_points": [
    {
      "risk": "风险点",
      "severity": "低/中/高",
      "evidence": "报告中的依据",
      "impact_on_employee": "对求职者可能产生的影响"
    }
  ],
  "dimension_analysis": {
    "judicial_compliance_risk": { "conclusion": "分析结论", "evidence": "报告依据或报告未体现" },
    "business_stability": { "conclusion": "分析结论", "evidence": "报告依据或报告未体现" },
    "employment_risk": { "conclusion": "分析结论", "evidence": "报告依据或报告未体现" },
    "company_formality": { "conclusion": "分析结论", "evidence": "报告依据或报告未体现" },
    "equity_and_related_party_risk": { "conclusion": "分析结论", "evidence": "报告依据或报告未体现" }
  },
  "questions_to_ask_hr": ["入职前需要向 HR 确认的问题"],
  "offer_advice": {
    "continue_interview": true,
    "accept_offer": false,
    "must_confirm_before_accepting": ["接受 offer 前必须确认的事项"]
  },
  "missing_information": ["报告中缺失但会影响判断的信息"]
}`,
    },
  ];
}

async function handleCompanyRisk(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "POST" && url.pathname === "/api/company-risk/analyze") {
      const body = await readJson(req);
      const apiKey = String(body.apiKey || "").trim();
      const model = String(body.model || DEFAULT_MODEL).trim();
      const sessionId = safeTaskId(body.sessionId || "");
      const companyName = String(body.companyName || "").trim();
      const jobTitle = String(body.jobTitle || "").trim();
      if (!apiKey) return json(res, 400, { error: "请填写浏览器 API Key" });
      if (!sessionId) return json(res, 400, { error: "缺少窗口 sessionId" });
      if (!companyName || !jobTitle) return json(res, 400, { error: "公司名称和求职职位都不能为空" });

      const report = await dbQuery(
        `SELECT id, file_name, file_ext, file_size, file_path, original_path, extracted_text, updated_at
         FROM downloaded_files
         WHERE task_id = $1
           AND coalesce(extracted_text, '') <> ''
           AND lower(coalesce(file_ext, '')) IN ('pdf', 'docx', 'html', 'htm', 'txt', 'md')
         ORDER BY updated_at DESC, id DESC
         LIMIT 1`,
        [sessionId],
      );
      const row = report.rows[0];
      if (!row) {
        return json(res, 404, {
          error: "当前窗口还没有可分析的企业信用报告。请先下载报告，或点击“扫描下载并分析”。",
        });
      }

      const analysis = await callDeepSeekJson({
        apiKey,
        model,
        messages: buildCompanyRiskMessages({
          companyName,
          jobTitle,
          reportText: row.extracted_text,
          fileName: row.file_name,
        }),
      });

      await appendTaskMessage(sessionId, "assistant", JSON.stringify(analysis, null, 2), {
        type: "company_risk_analysis",
        reportFileId: row.id,
        reportFileName: row.file_name,
      }).catch(() => {});

      return json(res, 200, {
        ok: true,
        report: {
          id: row.id,
          fileName: row.file_name,
          fileExt: row.file_ext,
          fileSize: row.file_size,
          updatedAt: row.updated_at,
        },
        analysis,
      });
    }

    if (req.method === "POST" && url.pathname === "/api/company-risk/clear") {
      const body = await readJson(req).catch(() => ({}));
      const sessionId = safeTaskId(body.sessionId || "");
      if (!sessionId) return json(res, 400, { error: "缺少窗口 sessionId" });
      const context = activeRuns.get(sessionId);
      if (context) context.cancel("窗口已删除");
      if (ingestState.taskId === sessionId) stopIngestWatcher();
      sessions.delete(sessionId);
      await dbQuery("DELETE FROM downloaded_files WHERE task_id = $1", [sessionId]).catch(() => {});
      await dbQuery("DELETE FROM task_sessions WHERE id = $1", [sessionId]).catch(() => {});
      await rm(taskDirFor(sessionId), { recursive: true, force: true }).catch(() => {});
      return json(res, 200, { ok: true });
    }

    json(res, 404, { error: "unknown company-risk endpoint" });
  } catch (error) {
    json(res, 500, { error: error.message || String(error) });
  }
}

async function handleDbAgent(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname === "/api/db-agent/status") {
      return json(res, 200, { ok: true, ...dbAgentState });
    }

    if (req.method === "POST" && url.pathname === "/api/db-agent/stop") {
      dbAgentState.stopRequested = true;
      if (dbAgentChild && !dbAgentChild.killed) dbAgentChild.kill("SIGTERM");
      await closeGeekrunBrowser();
      pushDbAgentLog("收到暂停请求");
      return json(res, 200, { ok: true, message: "已请求后台通道暂停" });
    }

    if (req.method === "POST" && url.pathname === "/api/db-agent/open-boss") {
      const result = await openBossLoginPage();
      if (!result.ok) return json(res, 500, { error: result.output || "打开 BOSS 失败" });
      return json(res, 200, { ok: true, message: "已打开 GeekRun 使用的 BOSS 登录页。登录/验证完成后，请关闭弹出的 GeekRun 浏览器，再启动搜索。", ...result });
    }

    if (req.method === "POST" && url.pathname === "/api/db-agent/close-geekrun") {
      const result = await closeGeekrunBrowser();
      return json(res, 200, { ok: true, message: "已关闭 GeekRun 浏览器并清理锁文件。", ...result });
    }

    if (req.method === "POST" && url.pathname === "/api/db-agent/requeue-errors") {
      if (dbAgentState.running) return json(res, 409, { error: "数据库通道正在运行，不能重置队列" });
      const result = await requeueErrorCompanies();
      return json(res, 200, {
        ok: true,
        ...result,
        counts: await getDbCounts(),
        message: `已把 ${result.updated} 家错误企业重置为待处理。`,
      });
    }

    if (req.method === "POST" && url.pathname === "/api/db-agent/start") {
      const body = await readJson(req);
      const apiKey = String(body.apiKey || "").trim();
      const model = String(body.model || DEFAULT_MODEL).trim();
      if (dbAgentState.running) return json(res, 409, { error: "数据库通道正在运行" });
      if (apiKey) await validateDeepSeekKey({ apiKey, model });

      const legacyDelayMs = body.delayMs === undefined ? undefined : Number(body.delayMs || 0);
      runDbBossAgent({
        apiKey,
        model,
        city: String(body.city || "").trim(),
        status: String(body.status || "new").trim(),
        maxCompanies: Number(body.maxCompanies || 1),
        companyDelayMinMs: body.companyDelayMinMs === undefined ? (legacyDelayMs ?? 8000) : Number(body.companyDelayMinMs || 0),
        companyDelayMaxMs: body.companyDelayMaxMs === undefined ? (legacyDelayMs ?? 15000) : Number(body.companyDelayMaxMs || 0),
        actionDelayMinMs: body.actionDelayMinMs === undefined ? 1000 : Number(body.actionDelayMinMs || 0),
        actionDelayMaxMs: body.actionDelayMaxMs === undefined ? 3000 : Number(body.actionDelayMaxMs || 0),
      });
      return json(res, 200, { ok: true, message: "数据库 GeekRun 岗位通道已启动" });
    }

    json(res, 404, { error: "unknown db-agent endpoint" });
  } catch (error) {
    json(res, 500, { error: error.message || String(error) });
  }
}

async function handleJob51Agent(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname === "/api/job51-agent/status") {
      return json(res, 200, { ok: true, ...job51AgentState });
    }

    if (req.method === "POST" && url.pathname === "/api/job51-agent/stop") {
      job51AgentState.stopRequested = true;
      if (job51AgentChild && !job51AgentChild.killed) job51AgentChild.kill("SIGTERM");
      await closeJob51Browser();
      pushJob51AgentLog("收到暂停请求");
      return json(res, 200, { ok: true, message: "已请求前程无忧通道暂停" });
    }

    if (req.method === "POST" && url.pathname === "/api/job51-agent/open-login") {
      await closeJob51Browser();
      const result = await openJob51LoginPage();
      if (!result.ok) return json(res, 500, { error: result.output || "打开前程无忧失败" });
      return json(res, 200, { ok: true, message: "已打开前程无忧个人中心。若页面显示未登录，请在弹出的浏览器里登录；登录后等待 3 秒再启动搜索。", ...result });
    }

    if (req.method === "POST" && url.pathname === "/api/job51-agent/close-browser") {
      const result = await closeJob51Browser();
      return json(res, 200, { ok: true, message: "已关闭前程无忧浏览器并清理锁文件。", ...result });
    }

    if (req.method === "POST" && url.pathname === "/api/job51-agent/start") {
      const body = await readJson(req);
      if (job51AgentState.running) return json(res, 409, { error: "前程无忧通道正在运行" });
      await closeJob51Browser();
      pushJob51AgentLog("启动前已关闭前程无忧登录窗口并清理锁文件");

      const legacyDelayMs = body.delayMs === undefined ? undefined : Number(body.delayMs || 0);
      runJob51Agent({
        area: String(body.area || "000000").trim(),
        status: String(body.status || "new").trim(),
        maxCompanies: Number(body.maxCompanies || 1),
        companyDelayMinMs: body.companyDelayMinMs === undefined ? (legacyDelayMs ?? 8000) : Number(body.companyDelayMinMs || 0),
        companyDelayMaxMs: body.companyDelayMaxMs === undefined ? (legacyDelayMs ?? 15000) : Number(body.companyDelayMaxMs || 0),
        actionDelayMinMs: body.actionDelayMinMs === undefined ? 1000 : Number(body.actionDelayMinMs || 0),
        actionDelayMaxMs: body.actionDelayMaxMs === undefined ? 3000 : Number(body.actionDelayMaxMs || 0),
      });
      return json(res, 200, { ok: true, message: "数据库前程无忧岗位通道已启动" });
    }

    json(res, 404, { error: "unknown job51-agent endpoint" });
  } catch (error) {
    json(res, 500, { error: error.message || String(error) });
  }
}

async function handleJobScreen(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname === "/api/job-screen/results") {
      const rows = await listJobScreenResults({
        status: url.searchParams.get("status") || "suitable",
        query: url.searchParams.get("query") || "",
        limit: url.searchParams.get("limit") || 50,
      });
      return json(res, 200, { ok: true, rows, counts: await getDbCounts() });
    }

    if (req.method === "GET" && url.pathname === "/api/job-screen/status") {
      return json(res, 200, { ok: true, ...jobScreenState, counts: await getDbCounts() });
    }

    if (req.method === "POST" && url.pathname === "/api/job-screen/stop") {
      jobScreenState.stopRequested = true;
      pushJobScreenLog("收到暂停请求");
      return json(res, 200, { ok: true, message: "已请求岗位筛选通道暂停" });
    }

    if (req.method === "POST" && url.pathname === "/api/job-screen/reset") {
      if (jobScreenState.running) return json(res, 409, { error: "岗位筛选通道正在运行，不能重置" });
      const result = await resetJobScreening();
      return json(res, 200, {
        ok: true,
        ...result,
        counts: await getDbCounts(),
        message: `已重置 ${result.updated} 条岗位为待筛选。`,
      });
    }

    if (req.method === "POST" && url.pathname === "/api/job-screen/clear-results") {
      if (jobScreenState.running) return json(res, 409, { error: "岗位筛选通道正在运行，不能清空结果" });
      const result = await resetJobScreening();
      return json(res, 200, {
        ok: true,
        ...result,
        counts: await getDbCounts(),
        message: `已清空 ${result.updated} 条筛选结果，岗位原始记录已保留。`,
      });
    }

    if (req.method === "POST" && url.pathname === "/api/job-screen/start") {
      const body = await readJson(req);
      const apiKey = String(body.apiKey || "").trim();
      const model = String(body.model || DEFAULT_MODEL).trim();
      const instruction = String(body.instruction || "").trim();
      const batchSize = Math.max(1, Math.min(Number(body.batchSize || 100), 100));
      const rescreenAll = body.rescreenAll !== false;
      if (jobScreenState.running) return json(res, 409, { error: "岗位筛选通道正在运行" });
      if (!apiKey) return json(res, 400, { error: "请填写搜索后筛选的大模型 API Key" });
      if (!instruction) return json(res, 400, { error: "请填写岗位筛选要求" });
      await validateDeepSeekKey({ apiKey, model });
      const resetResult = rescreenAll ? await resetJobScreening() : { updated: 0 };
      if (rescreenAll) pushJobScreenLog("已按当前要求重新放回待筛选", { count: resetResult.updated });
      runJobScreenAgent({ apiKey, model, instruction, batchSize });
      return json(res, 200, {
        ok: true,
        reset: resetResult.updated,
        message: rescreenAll
          ? `已重新放回 ${resetResult.updated} 条岗位，搜索后岗位筛选通道已启动`
          : "搜索后岗位筛选通道已启动",
      });
    }

    json(res, 404, { error: "unknown job-screen endpoint" });
  } catch (error) {
    json(res, 500, { error: error.message || String(error) });
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.join(__dirname, "public", path.normalize(pathname).replace(/^(\.\.[/\\])+/, ""));
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "content-type": mimeTypes[ext] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/api/health") {
    return json(res, 200, { ok: true, bbBrowser: BB_BROWSER, bbBrowserCdpPort: BB_BROWSER_CDP_PORT, defaultModel: DEFAULT_MODEL });
  }
  if (req.url.startsWith("/api/db/")) return handleDb(req, res);
  if (req.url.startsWith("/api/db-agent/")) return handleDbAgent(req, res);
  if (req.url.startsWith("/api/job51-agent/")) return handleJob51Agent(req, res);
  if (req.url.startsWith("/api/job-screen/")) return handleJobScreen(req, res);
  if (req.url.startsWith("/api/company-risk/")) return handleCompanyRisk(req, res);
  if (req.method === "POST" && req.url === "/api/industry/analyze") return handleIndustryAnalyze(req, res);
  if (req.method === "POST" && req.url === "/api/industry/tyc-run") return handleIndustryTycRun(req, res);
  if (req.method === "POST" && req.url === "/api/import-companies") return handleImportCompanies(req, res);
  if (req.method === "POST" && req.url === "/api/download-ingest") return handleDownloadIngest(req, res);
  if (req.method === "POST" && req.url === "/api/chat") return handleChat(req, res);
  if (req.method === "POST" && req.url === "/api/cancel") return handleCancel(req, res);
  if (req.method === "POST" && req.url === "/api/close-tabs") return handleCloseTabs(req, res);
  if (req.method === "POST" && req.url === "/api/reset") return handleReset(req, res);
  if (req.method === "GET") return serveStatic(req, res);
  json(res, 405, { error: "method not allowed" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`DeepSeek BB Controller: http://127.0.0.1:${PORT}`);
  console.log(`bb-browser: ${BB_BROWSER}`);
  runBb(["tab", "list"], { timeout: 20000 })
    .then((result) => {
      console.log(result.ok
        ? `bb-browser ready: CDP ${BB_BROWSER_CDP_PORT}`
        : `bb-browser warmup failed: ${result.output || "unknown error"}`);
    })
    .catch((error) => {
      console.error(`bb-browser warmup failed: ${error.message || String(error)}`);
    });
});
