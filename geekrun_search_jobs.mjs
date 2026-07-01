import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const GEEKRUN_DIR = process.env.GEEKRUN_DIR || path.join(process.cwd(), "vendor", "geekrun");
const geekRequire = createRequire(path.join(GEEKRUN_DIR, "package.json"));

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

function companyMatches(jobCompany, targetCompany) {
  const left = normalizeText(jobCompany).toLowerCase();
  const right = normalizeText(targetCompany).toLowerCase();
  if (!left || !right) return false;
  return left.includes(right) || right.includes(left);
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

async function readCookies() {
  const fs = await import("node:fs/promises");
  const candidates = [
    path.join(os.homedir(), ".geekgeekrun", "storage", "boss-cookies.json"),
    path.join(GEEKRUN_DIR, ".local-home", ".geekgeekrun", "storage", "boss-cookies.json"),
  ];
  for (const file of candidates) {
    try {
      const cookies = JSON.parse(await fs.readFile(file, "utf8"));
      if (Array.isArray(cookies) && cookies.length) return cookies;
    } catch {}
  }
  return [];
}

async function searchOneCompany(page, company, city, limit, actionDelayRange) {
  const companyName = normalizeText(company.name || company.company || company);
  const url = new URL("https://www.zhipin.com/web/geek/job");
  url.searchParams.set("query", companyName);
  url.searchParams.set("city", city);
  url.searchParams.set("_ts", String(Date.now()));
  await page.goto("about:blank", { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
  await page.waitForSelector("li.job-card-box, .job-card-box, .job-card-wrapper, .page-jobs-main, body", { timeout: 10000 }).catch(() => {});
  await sleepRandom(actionDelayRange);
  await page.mouse.wheel({ deltaY: 360 });
  await sleepRandom(actionDelayRange);
  await page.mouse.wheel({ deltaY: -180 });
  await sleepRandom(actionDelayRange);

  const pageState = await page.evaluate(() => {
    const vueJobs = document.querySelector(".page-jobs-main")?.__vue__?.jobList || [];
    const cards = Array.from(document.querySelectorAll("li.job-card-box, .job-card-box, .job-card-wrapper")).map((el, index) => ({
      index,
      text: el.innerText || "",
    }));
    return {
      url: location.href,
      title: document.title,
      query: new URL(location.href).searchParams.get("query") || "",
      bodyText: document.body.innerText?.slice(0, 5000) || "",
      vueJobs,
      cards,
    };
  });

  const pageProblem = /\/web\/user|注册登录|验证码|安全验证|环境异常|您的环境存在异常/i.test(
    `${pageState.url}\n${pageState.title}\n${pageState.bodyText.slice(0, 1200)}`,
  );
  if (pageProblem) {
    return {
      ok: false,
      needsLogin: true,
      company: companyName,
      companyId: company.id || null,
      message: "GeekRun 打开的 BOSS 页面需要登录或验证",
      ...pageState,
    };
  }

  const listJobs = Array.isArray(pageState.vueJobs) ? pageState.vueJobs : [];
  const matched = listJobs
    .map((job, index) => ({ ...job, index }))
    .filter((job) => companyMatches(job.brandName || job.companyName || "", companyName))
    .slice(0, limit);

  const jobs = [];
  for (const item of matched) {
    const selector = `li.job-card-box:nth-child(${item.index + 1}), .job-card-box:nth-child(${item.index + 1})`;
    try {
      const card = await page.$(selector);
      if (card) {
        await card.click();
        await sleepRandom(actionDelayRange);
      }
    } catch {}
    const detail = await page.evaluate(() => {
      const data = document.querySelector(".job-detail-box")?.__vue__?.data || null;
      const text = document.querySelector(".job-detail-box")?.innerText || "";
      return { data, text };
    });
    const detailJob = detail.data?.jobInfo || {};
    const brand = detail.data?.brandComInfo || {};
    jobs.push({
      title: detailJob.jobName || item.jobName || item.title || "",
      company_name: brand.customerBrandName || brand.brandName || item.brandName || item.companyName || "",
      location: detailJob.address || item.cityName || item.areaDistrict || "",
      salary: detailJob.salaryDesc || item.salaryDesc || "",
      education: detailJob.degreeName || item.degreeName || "",
      experience: detailJob.experienceName || item.jobExperience || "",
      description: detailJob.postDescription || detail.text || "",
      apply_url: page.url(),
      source_url: page.url(),
      evidence_text: detail.text || JSON.stringify(item).slice(0, 2000),
      raw: item,
    });
  }

  return {
    ok: true,
    mode: "geekrun",
    company: companyName,
    companyId: company.id || null,
    city,
    url: pageState.url,
    title: pageState.title,
    searchedQuery: pageState.query,
    found: jobs.length > 0,
    jobs,
    rawCount: listJobs.length,
    message: jobs.length ? `GeekRun 找到 ${jobs.length} 个匹配岗位` : "GeekRun 未找到匹配公司岗位",
    bodyText: pageState.bodyText.slice(0, 3000),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const company = normalizeText(args.company);
  const city = normalizeText(args.city) || "101010100";
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

  const userDataDir = process.env.GEEKRUN_USER_DATA_DIR || path.join(os.homedir(), ".geekgeekrun", "chrome-profile");
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
  } catch (error) {
    const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    browser = await puppeteer.launch({ ...launchOptions, executablePath: chromePath });
  }

  try {
    const page = (await browser.pages())[0] || await browser.newPage();
    page.setDefaultTimeout(45000);
    page.setDefaultNavigationTimeout(60000);
    await page.goto("https://www.zhipin.com", { waitUntil: "domcontentloaded" });
    const cookies = await readCookies();
    if (cookies.length) {
      await page.setCookie(...cookies.map((cookie) => ({ ...cookie, domain: cookie.domain || ".zhipin.com" })));
    }
    if (openLogin) {
      await page.goto("https://www.zhipin.com/web/user/", { waitUntil: "domcontentloaded" });
      writeJson({ ok: true, mode: "geekrun", message: "已打开 GeekRun 使用的 BOSS 登录页，请在弹出的浏览器里登录/验证；登录完成后请关闭这个浏览器，再启动搜索。", url: page.url() });
      await new Promise((resolve) => browser.on("disconnected", resolve));
      return;
    }

    const queue = companies.length ? companies : [{ name: company }];
    const results = [];
    for (let index = 0; index < queue.length; index += 1) {
      const result = await searchOneCompany(page, queue[index], city, limit, actionDelayRange);
      results.push(result);
      writeJson({ ok: true, progress: true, index: index + 1, total: queue.length, company: result.company, found: result.found || false, message: result.message });
      if (!result.ok) {
        writeJson({ ok: false, mode: "geekrun", message: result.message || "GeekRun 搜索失败", needsLogin: result.needsLogin || false, results });
        return;
      }
      if (index < queue.length - 1) await sleepRandom(companyDelayRange);
    }

    if (companies.length) {
      writeJson({ ok: true, mode: "geekrun", city, results, message: `GeekRun 批量搜索完成：${results.length} 家` });
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
