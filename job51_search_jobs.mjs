import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const GEEKRUN_DIR = process.env.GEEKRUN_DIR || path.join(process.cwd(), "vendor", "geekrun");
const geekRequire = createRequire(path.join(GEEKRUN_DIR, "package.json"));
const JOB51_COOKIE_FILE = process.env.JOB51_COOKIE_FILE || path.join(os.homedir(), ".geekgeekrun", "storage", "51job-cookies.json");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      args[arg.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    }
  }
  return args;
}

function writeJson(data) {
  process.stdout.write(`${JSON.stringify(data)}\n`);
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function compactCompanyText(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[（）()【】\[\]·,，.。:：;；、\-_/\\\s]/g, "");
}

function companyMatches(jobCompany, targetCompany) {
  const left = compactCompanyText(jobCompany);
  const right = compactCompanyText(targetCompany);
  if (!left || !right) return false;
  if (left === right) return true;
  if (right.length < 4) return left.includes(right);
  if (left.length >= 4 && left.includes(right)) return true;
  return left.length >= 4 && right.includes(left);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeDelayRange(minValue, maxValue, fallbackMin, fallbackMax, cap) {
  let min = Number(minValue);
  let max = Number(maxValue);
  if (!Number.isFinite(min)) min = fallbackMin;
  if (!Number.isFinite(max)) max = fallbackMax;
  min = Math.max(0, Math.min(Math.round(min), cap));
  max = Math.max(0, Math.min(Math.round(max), cap));
  if (max < min) [min, max] = [max, min];
  return { min, max };
}

function randomDelay(range) {
  if (!range || range.max <= range.min) return Math.max(0, range?.min || 0);
  return range.min + Math.floor(Math.random() * (range.max - range.min + 1));
}

async function sleepRandom(range) {
  const ms = randomDelay(range);
  if (ms > 0) await sleep(ms);
  return ms;
}

function decodeCompaniesArg(value) {
  if (!value) return [];
  const text = Buffer.from(value, "base64").toString("utf8");
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [];
}

async function loadJob51Cookies(page) {
  try {
    const cookies = JSON.parse(await readFile(JOB51_COOKIE_FILE, "utf8"));
    if (!Array.isArray(cookies) || !cookies.length) return 0;
    let loaded = 0;
    for (const cookie of cookies) {
      const clean = sanitizeCookie(cookie);
      if (!clean) continue;
      try {
        await page.setCookie(clean);
        loaded += 1;
      } catch {}
    }
    return loaded;
  } catch {
    return 0;
  }
}

function sanitizeCookie(cookie) {
  if (!cookie?.name || cookie.value === undefined) return null;
  const clean = {
    name: String(cookie.name),
    value: String(cookie.value),
    path: cookie.path || "/",
    httpOnly: Boolean(cookie.httpOnly),
    secure: Boolean(cookie.secure),
  };
  if (cookie.domain) clean.domain = cookie.domain;
  if (Number.isFinite(cookie.expires) && cookie.expires > 0) clean.expires = Math.floor(cookie.expires);
  if (["Strict", "Lax", "None"].includes(cookie.sameSite)) clean.sameSite = cookie.sameSite;
  return clean;
}

async function saveJob51Cookies(page) {
  const urls = [
    "https://we.51job.com",
    "https://login.51job.com",
    "https://i.51job.com",
    "https://jobs.51job.com",
    "https://cupidjob.51job.com",
  ];
  const cookies = await page.cookies(...urls);
  const unique = new Map();
  for (const cookie of cookies || []) {
    if (!cookie?.name) continue;
    unique.set(`${cookie.name}:${cookie.domain || ""}:${cookie.path || ""}`, cookie);
  }
  await mkdir(path.dirname(JOB51_COOKIE_FILE), { recursive: true });
  await writeFile(JOB51_COOKIE_FILE, `${JSON.stringify([...unique.values()], null, 2)}\n`);
  return unique.size;
}

function startCookieAutosave(page) {
  const timer = setInterval(() => {
    saveJob51Cookies(page).catch(() => {});
  }, 2000);
  const save = () => saveJob51Cookies(page).catch(() => {});
  page.on("framenavigated", save);
  page.on("close", save);
  return () => {
    clearInterval(timer);
    page.off("framenavigated", save);
    page.off("close", save);
  };
}

function pickLine(lines, regex) {
  return lines.find((line) => regex.test(line)) || "";
}

function parseCardFields(card, companyName) {
  const lines = String(card.text || "")
    .split(/\n+/)
    .map(normalizeText)
    .filter(Boolean)
    .filter((line, index, arr) => arr.indexOf(line) === index);
  const companyLine = lines.find((line) => companyMatches(line, companyName)) || "";
  const title = normalizeText(card.title) || normalizeText(card.jobTitle) || lines[0] || "未命名岗位";
  const salary = pickLine(lines, /(面议|(?:\d+(?:\.\d+)?\s*[-至]\s*)?\d+(?:\.\d+)?\s*(?:万|千|k|K|元)(?:[·\-\d\s]*(?:万|千|k|K|薪|\/年|\/月|\/天|\/小时))?)/);
  const location = pickLine(lines, /(北京|上海|天津|重庆|广州|深圳|杭州|成都|苏州|南京|武汉|西安|长沙|郑州|佛山|东莞|厦门|宁波|青岛|无锡|合肥|福州|昆明|南昌|贵阳|南宁|哈尔滨|长春|沈阳|大连|济南|石家庄|太原|兰州|海口|乌鲁木齐|市|区|县|省|远程)/);
  const education = pickLine(lines, /(学历|本科|大专|硕士|博士|高中|中专|不限)/);
  const experience = pickLine(lines, /(经验|应届|实习|校招|\d+\s*[-至]\s*\d+\s*年|\d+\s*年)/);
  return { lines, companyLine, title, salary, location, education, experience };
}

function isUsableHref(href) {
  return /^https?:\/\//i.test(String(href || ""));
}

function mergeDetailFields(cardJob, detail) {
  const detailLines = String(detail.text || "")
    .split(/\n+/)
    .map(normalizeText)
    .filter(Boolean);
  return {
    title: normalizeText(detail.title) || cardJob.title || "未命名岗位",
    company_name: normalizeText(detail.companyName) || cardJob.company_name || "",
    location: normalizeText(detail.location) || cardJob.location || "",
    salary: normalizeText(detail.salary) || cardJob.salary || "",
    education: cardJob.education || pickLine(detailLines, /(学历|本科|大专|硕士|博士|高中|中专|不限)/),
    experience: cardJob.experience || pickLine(detailLines, /(经验|应届|实习|校招|\d+\s*[-至]\s*\d+\s*年|\d+\s*年)/),
    description: normalizeText(detail.description) || normalizeText(detail.text) || cardJob.description || "",
    apply_url: detail.url || cardJob.apply_url || "",
    source_url: detail.url || cardJob.source_url || "",
    evidence_text: normalizeText(detail.text) || cardJob.evidence_text || "",
    raw: cardJob.raw || null,
  };
}

function mapJob51ApiItem(item, fallbackUrl) {
  const tags = Array.isArray(item.jobTags) ? item.jobTags.filter(Boolean) : [];
  const description = normalizeText(item.jobDescribe) || tags.join("\n");
  const evidenceParts = [
    item.jobName,
    item.provideSalaryString,
    item.jobAreaString,
    item.workYearString,
    item.degreeString,
    item.fullCompanyName,
    description,
  ].filter(Boolean);
  return {
    title: item.jobName || "未命名岗位",
    company_name: item.fullCompanyName || item.companyName || "",
    location: item.jobAreaString || item.jobAreaLevelDetail || "",
    salary: item.provideSalaryString || "",
    education: item.degreeString || "",
    experience: item.workYearString || "",
    description,
    apply_url: item.jobHref || fallbackUrl || "",
    source_url: item.jobHref || fallbackUrl || "",
    evidence_text: evidenceParts.join("\n").slice(0, 6000),
    raw: item,
  };
}

function parseJob51ApiJobs(data, companyName, fallbackUrl, limit) {
  const items = data?.resultbody?.job?.items || data?.resultbody?.jobs || data?.items || [];
  if (!Array.isArray(items)) return [];
  const jobs = [];
  const seen = new Set();
  for (const item of items) {
    const company = item.fullCompanyName || item.companyName || "";
    if (!companyMatches(company, companyName)) continue;
    const job = mapJob51ApiItem(item, fallbackUrl);
    const key = item.jobId || job.apply_url || `${job.title}:${job.company_name}:${job.location}`;
    if (seen.has(key)) continue;
    seen.add(key);
    jobs.push(job);
    if (jobs.length >= limit) break;
  }
  return jobs;
}

function waitForJob51ApiResponse(page, timeoutMs = 12000) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => finish(null), timeoutMs);

    function finish(value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      page.off("response", onResponse);
      resolve(value);
    }

    async function onResponse(response) {
      const responseUrl = response.url();
      if (!/\/(api\/job\/search-pc|open\/noauth\/search-pc)/i.test(responseUrl)) return;
      try {
        const text = await response.text();
        const trimmed = text.trim();
        if (!trimmed.startsWith("{")) return;
        const data = JSON.parse(trimmed);
        finish({
          url: responseUrl,
          status: response.status(),
          data,
        });
      } catch {}
    }

    page.on("response", onResponse);
  });
}

async function extractDetail(browser, href, actionDelayRange) {
  const detailPage = await browser.newPage();
  detailPage.setDefaultTimeout(30000);
  detailPage.setDefaultNavigationTimeout(60000);
  try {
    await detailPage.goto(href, { waitUntil: "domcontentloaded" });
    await detailPage.waitForSelector("body", { timeout: 12000 }).catch(() => {});
    await sleepRandom(actionDelayRange);
    return await detailPage.evaluate(() => {
      const textOf = (selector) => document.querySelector(selector)?.innerText?.trim() || "";
      const title = textOf("h1") || textOf(".jobName") || textOf(".job-title") || textOf("[class*='jobName']") || document.title;
      const companyName =
        textOf(".com_name") ||
        textOf(".company-name") ||
        textOf("[class*='companyName']") ||
        textOf("[class*='comName']");
      const salary = textOf(".salary") || textOf("[class*='salary']") || "";
      const jobLocation = textOf(".job_msg") || textOf("[class*='job_msg']") || textOf("[class*='address']") || "";
      const description =
        textOf(".bmsg") ||
        textOf(".job-duty") ||
        textOf(".job-detail") ||
        textOf("[class*='jobDetail']") ||
        textOf("[class*='describe']") ||
        "";
      return {
        url: window.location.href,
        title,
        companyName,
        salary,
        location: jobLocation,
        description,
        text: document.body?.innerText?.slice(0, 30000) || "",
      };
    });
  } finally {
    await detailPage.close().catch(() => {});
  }
}

async function searchOneCompany(page, company, area, limit, actionDelayRange) {
  const companyName = normalizeText(company.name || company.company || company);
  const url = new URL("https://we.51job.com/pc/search");
  url.searchParams.set("keyword", companyName);
  url.searchParams.set("searchType", "2");
  url.searchParams.set("sortType", "0");
  url.searchParams.set("jobArea", area || "000000");
  url.searchParams.set("_ts", String(Date.now()));

  await page.goto("about:blank", { waitUntil: "domcontentloaded" }).catch(() => {});
  const apiResponsePromise = waitForJob51ApiResponse(page);
  await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
  const apiResponse = await apiResponsePromise;
  if (apiResponse?.data) {
    const apiJobs = parseJob51ApiJobs(apiResponse.data, companyName, apiResponse.url || url.toString(), limit);
    const groupInfo = apiResponse.data?.resultbody?.groupInfo || {};
    return {
      ok: true,
      mode: "job51_api",
      company: companyName,
      companyId: company.id || null,
      area: area || "000000",
      url: apiResponse.url || url.toString(),
      title: `前程无忧接口：${companyName}`,
      found: apiJobs.length > 0,
      jobs: apiJobs,
      rawCount: apiResponse.data?.resultbody?.job?.items?.length || 0,
      message: apiJobs.length ? `前程无忧接口找到 ${apiJobs.length} 个匹配岗位` : "前程无忧接口未找到匹配公司岗位",
      groupInfo,
      apiStatus: apiResponse.status,
    };
  }

  await page.waitForSelector("body", { timeout: 15000 }).catch(() => {});
  await page.waitForFunction(() => {
    const text = document.body?.innerText || "";
    return text.length > 300 || text.includes("投递") || document.querySelectorAll("a[href*='jobs.51job.com']").length > 5;
  }, { timeout: 18000 }).catch(() => {});
  await sleepRandom(actionDelayRange);
  await page.mouse.wheel({ deltaY: 520 }).catch(() => {});
  await sleepRandom(actionDelayRange);
  await page.mouse.wheel({ deltaY: -220 }).catch(() => {});
  await sleepRandom(actionDelayRange);

  const pageState = await page.evaluate(() => {
    const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const salaryPattern = /(面议|(?:\d+(?:\.\d+)?\s*[-至]\s*)?\d+(?:\.\d+)?\s*(?:万|千|k|K|元)(?:[·\-\d\s]*(?:万|千|k|K|薪|\/年|\/月|\/天|\/小时))?)/;
    const companyPattern = /(公司|集团|银行|医院|学校|大学|事务所|工作室|中心|研究院|有限|股份|厂|所)/;
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const cards = anchors
      .map((anchor, index) => {
        const href = anchor.href || "";
        if (!/(jobs\.51job\.com\/[^?#]+\/\d+\.html|\/pc\/job_detail)/i.test(href)) return null;
        const root =
          anchor.closest(".joblist-item, .job-item, .e, li, [class*='joblist'], [class*='job-list'], [class*='jobItem'], [class*='job-card'], [class*='item']") ||
          anchor.parentElement;
        const text = root?.innerText || anchor.innerText || "";
        return {
          index,
          title: normalize(anchor.innerText),
          href,
          text,
        };
      })
      .filter(Boolean)
      .filter((card, index, arr) => card.href && arr.findIndex((item) => item.href === card.href) === index)
      .slice(0, 80);
    const bodyText = document.body?.innerText || "";
    const lines = bodyText
      .split(/\n+/)
      .map(normalize)
      .filter(Boolean);
    const bodyJobs = [];
    let blockStart = 0;
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index] !== "投递") continue;
      const block = lines.slice(blockStart, index + 1);
      blockStart = index + 1;
      const salaryIndex = block.findIndex((line) => salaryPattern.test(line));
      if (salaryIndex <= 0) continue;
      const jobBlock = block.slice(Math.max(0, salaryIndex - 1));
      const jobTitle = jobBlock[0];
      const salaryLine = jobBlock[1] || "";
      const locationLine = jobBlock[2] || "";
      const chatIndex = jobBlock.lastIndexOf("去聊聊");
      let companyLine = chatIndex >= 2 && jobBlock[chatIndex - 2]?.length <= 80 ? jobBlock[chatIndex - 2] : "";
      for (let offset = jobBlock.length - 2; !companyLine && offset >= 2; offset -= 1) {
        const line = jobBlock[offset];
        if (line === "去聊聊" || line === "投递") continue;
        if (companyPattern.test(line) && line.length <= 80) {
          companyLine = line;
          break;
        }
      }
      if (!jobTitle || !companyLine) continue;
      bodyJobs.push({
        index,
        title: jobTitle,
        jobTitle,
        href: "",
        companyName: companyLine,
        text: jobBlock.join("\n"),
        salary: salaryLine,
        location: locationLine,
      });
      if (bodyJobs.length >= 80) break;
    }
    return {
      url: location.href,
      title: document.title,
      bodyText: bodyText.slice(0, 8000),
      cards,
      bodyJobs,
    };
  });

  const problemText = `${pageState.url}\n${pageState.title}\n${pageState.bodyText.slice(0, 1600)}`;
  if (/\/login|passport|验证码|安全验证|访问异常|请完成验证|网络不给力|滑块|请先登录|登录后/i.test(problemText)) {
    return {
      ok: false,
      needsLogin: true,
      company: companyName,
      companyId: company.id || null,
      message: "前程无忧页面需要登录或验证",
      ...pageState,
    };
  }

  const matchedCards = [];
  const seen = new Set();
  const candidates = [...(pageState.cards || []), ...(pageState.bodyJobs || [])];
  for (const card of candidates) {
    const fields = parseCardFields(card, companyName);
    const matched = fields.companyLine || companyMatches(card.companyName, companyName) || (card.href ? companyMatches(card.text, companyName) : false);
    const dedupeKey = card.href || `${fields.title}:${fields.companyLine || card.companyName || ""}`;
    if (!matched || seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    matchedCards.push({ card, fields });
    if (matchedCards.length >= limit) break;
  }

  const jobs = [];
  for (const { card, fields } of matchedCards) {
    const cardJob = {
      title: fields.title,
      company_name: fields.companyLine || card.companyName || companyName,
      location: card.location || fields.location,
      salary: card.salary || fields.salary,
      education: fields.education,
      experience: fields.experience,
      description: fields.lines.join("\n"),
      apply_url: card.href || pageState.url,
      source_url: card.href || pageState.url,
      evidence_text: card.text,
      raw: card,
    };
    let job = cardJob;
    try {
      if (!isUsableHref(card.href)) throw new Error("missing detail url");
      const detail = await extractDetail(page.browser(), card.href, actionDelayRange);
      job = mergeDetailFields(cardJob, detail);
    } catch {
      job = cardJob;
    }
    jobs.push(job);
  }

  return {
    ok: true,
    mode: "job51",
    company: companyName,
    companyId: company.id || null,
    area: area || "000000",
    url: pageState.url,
    title: pageState.title,
    found: jobs.length > 0,
    jobs,
    rawCount: pageState.cards?.length || 0,
    message: jobs.length ? `前程无忧找到 ${jobs.length} 个匹配岗位` : "前程无忧未找到匹配公司岗位",
    bodyText: pageState.bodyText.slice(0, 3000),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const company = normalizeText(args.company);
  const area = normalizeText(args.area || args["job-area"]) || "000000";
  const limit = Math.max(1, Math.min(Number(args.limit || 10), 30));
  const legacyDelayMs = args["delay-ms"] === undefined ? undefined : args["delay-ms"];
  const companyDelayRange = legacyDelayMs !== undefined && args["company-delay-min-ms"] === undefined && args["company-delay-max-ms"] === undefined
    ? normalizeDelayRange(legacyDelayMs, legacyDelayMs, 8000, 8000, 120000)
    : normalizeDelayRange(args["company-delay-min-ms"], args["company-delay-max-ms"], 8000, 15000, 120000);
  const actionDelayRange = normalizeDelayRange(args["action-delay-min-ms"], args["action-delay-max-ms"], 1000, 3000, 30000);
  const openLogin = args["open-login"] === "true";
  const companies = decodeCompaniesArg(args["companies-json"]);
  if (!company && !companies.length && !openLogin) throw new Error("missing --company");

  const puppeteer = geekRequire("puppeteer-extra");
  const StealthPlugin = geekRequire("puppeteer-extra-plugin-stealth");
  const LaodengPlugin = geekRequire("@geekgeekrun/puppeteer-extra-plugin-laodeng");
  const AnonymizeUaPlugin = geekRequire("puppeteer-extra-plugin-anonymize-ua");

  puppeteer.use(StealthPlugin());
  puppeteer.use(LaodengPlugin());
  puppeteer.use(AnonymizeUaPlugin({ makeWindows: false }));

  const userDataDir = process.env.JOB51_USER_DATA_DIR || path.join(os.homedir(), ".geekgeekrun", "chrome-profile-51job");
  const launchOptions = {
    headless: false,
    defaultViewport: null,
    userDataDir,
    args: [
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1280,900",
    ],
  };
  if (process.env.CHROME_EXECUTABLE) {
    launchOptions.executablePath = process.env.CHROME_EXECUTABLE;
  }

  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch {
    const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    browser = await puppeteer.launch({ ...launchOptions, executablePath: chromePath });
  }

  try {
    const page = (await browser.pages())[0] || await browser.newPage();
    page.setDefaultTimeout(45000);
    page.setDefaultNavigationTimeout(60000);
    const loadedCookies = await loadJob51Cookies(page);
    await page.goto("https://we.51job.com", { waitUntil: "domcontentloaded" });
    if (openLogin) {
      const stopAutosave = startCookieAutosave(page);
      await page.goto("https://i.51job.com/userset/my_51job.php", { waitUntil: "domcontentloaded" });
      await page.waitForSelector("body", { timeout: 12000 }).catch(() => {});
      await sleep(1500);
      writeJson({
        ok: true,
        mode: "job51",
        message: "已打开前程无忧个人中心。若页面显示未登录，请在这个窗口登录；登录成功后等待 3 秒再开始搜索或关闭窗口，程序会保存登录态。",
        loadedCookies,
        cookieFile: JOB51_COOKIE_FILE,
        url: page.url(),
      });
      await new Promise((resolve) => browser.on("disconnected", resolve));
      stopAutosave();
      return;
    }

    const queue = companies.length ? companies : [{ name: company }];
    const results = [];
    for (let index = 0; index < queue.length; index += 1) {
      const result = await searchOneCompany(page, queue[index], area, limit, actionDelayRange);
      results.push(result);
      writeJson({ ok: true, progress: true, index: index + 1, total: queue.length, company: result.company, found: result.found || false, message: result.message });
      if (!result.ok) {
        writeJson({ ok: false, mode: "job51", message: result.message || "前程无忧搜索失败", needsLogin: result.needsLogin || false, results });
        return;
      }
      await saveJob51Cookies(page).catch(() => {});
      if (index < queue.length - 1) await sleepRandom(companyDelayRange);
    }

    if (companies.length) {
      writeJson({ ok: true, mode: "job51", area, results, message: `前程无忧批量搜索完成：${results.length} 家` });
    } else {
      writeJson(results[0]);
    }
  } finally {
    await browser?.close().catch(() => {});
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    writeJson({ ok: false, error: error.message || String(error), stack: error.stack });
    process.exit(1);
  });
