const apiKeyInput = document.querySelector("#apiKey");
const modelInput = document.querySelector("#model");
const rememberKeyInput = document.querySelector("#rememberKey");
const promptInput = document.querySelector("#prompt");
const sendBtn = document.querySelector("#sendBtn");
const cancelBtn = document.querySelector("#cancelBtn");
const statusBtn = document.querySelector("#statusBtn");
const closeTabsBtn = document.querySelector("#closeTabsBtn");
const resetBtn = document.querySelector("#resetBtn");
const industryStatusEl = document.querySelector("#industryStatus");
const industryRegionInput = document.querySelector("#industryRegion");
const industryArkModelInput = document.querySelector("#industryArkModel");
const industryArkKeyInput = document.querySelector("#industryArkKey");
const industryBrowserModelInput = document.querySelector("#industryBrowserModel");
const industryUserInfoInput = document.querySelector("#industryUserInfo");
const industryResumeTextInput = document.querySelector("#industryResumeText");
const industryFilesInput = document.querySelector("#industryFiles");
const industrySessionIdInput = document.querySelector("#industrySessionId");
const industryRunStatusEl = document.querySelector("#industryRunStatus");
const industryAnalyzeBtn = document.querySelector("#industryAnalyzeBtn");
const industryPreviewBtn = document.querySelector("#industryPreviewBtn");
const industryRunTycBtn = document.querySelector("#industryRunTycBtn");
const industryClearBtn = document.querySelector("#industryClearBtn");
const industryLogEl = document.querySelector("#industryLog");
const industryResultsEl = document.querySelector("#industryResults");
const dbStatusEl = document.querySelector("#dbStatus");
const dbStatusBtn = document.querySelector("#dbStatusBtn");
const dbInitBtn = document.querySelector("#dbInitBtn");
const companyFileInput = document.querySelector("#companyFile");
const importCompaniesBtn = document.querySelector("#importCompaniesBtn");
const findJobsCompanyFileInput = document.querySelector("#findJobsCompanyFile");
const findJobsImportCompaniesBtn = document.querySelector("#findJobsImportCompaniesBtn");
const findJobsImportStatusEl = document.querySelector("#findJobsImportStatus");
const scanDownloadsBtn = document.querySelector("#scanDownloadsBtn");
const processNextBtn = document.querySelector("#processNextBtn");
const autoIngestInput = document.querySelector("#autoIngest");
const dbAgentStatusEl = document.querySelector("#dbAgentStatus");
const dbAgentApiKeyInput = document.querySelector("#dbAgentApiKey");
const dbAgentModelInput = document.querySelector("#dbAgentModel");
const dbAgentMaxInput = document.querySelector("#dbAgentMax");
const dbAgentStatusSelect = document.querySelector("#dbAgentStatusSelect");
const dbAgentCompanyDelayMinInput = document.querySelector("#dbAgentCompanyDelayMin");
const dbAgentCompanyDelayMaxInput = document.querySelector("#dbAgentCompanyDelayMax");
const dbAgentActionDelayMinInput = document.querySelector("#dbAgentActionDelayMin");
const dbAgentActionDelayMaxInput = document.querySelector("#dbAgentActionDelayMax");
const dbAgentCityInput = document.querySelector("#dbAgentCity");
const rememberDbAgentKeyInput = document.querySelector("#rememberDbAgentKey");
const dbAgentOpenBossBtn = document.querySelector("#dbAgentOpenBossBtn");
const dbAgentCloseGeekrunBtn = document.querySelector("#dbAgentCloseGeekrunBtn");
const dbAgentRequeueErrorBtn = document.querySelector("#dbAgentRequeueErrorBtn");
const dbAgentStartBtn = document.querySelector("#dbAgentStartBtn");
const dbAgentStopBtn = document.querySelector("#dbAgentStopBtn");
const dbAgentLogEl = document.querySelector("#dbAgentLog");
const job51AgentStatusEl = document.querySelector("#job51AgentStatus");
const job51AgentMaxInput = document.querySelector("#job51AgentMax");
const job51AgentStatusSelect = document.querySelector("#job51AgentStatusSelect");
const job51AgentCompanyDelayMinInput = document.querySelector("#job51AgentCompanyDelayMin");
const job51AgentCompanyDelayMaxInput = document.querySelector("#job51AgentCompanyDelayMax");
const job51AgentActionDelayMinInput = document.querySelector("#job51AgentActionDelayMin");
const job51AgentActionDelayMaxInput = document.querySelector("#job51AgentActionDelayMax");
const job51AgentAreaInput = document.querySelector("#job51AgentArea");
const job51AgentOpenBtn = document.querySelector("#job51AgentOpenBtn");
const job51AgentCloseBtn = document.querySelector("#job51AgentCloseBtn");
const job51AgentStartBtn = document.querySelector("#job51AgentStartBtn");
const job51AgentStopBtn = document.querySelector("#job51AgentStopBtn");
const job51AgentLogEl = document.querySelector("#job51AgentLog");
const jobScreenStatusEl = document.querySelector("#jobScreenStatus");
const jobScreenApiKeyInput = document.querySelector("#jobScreenApiKey");
const jobScreenModelInput = document.querySelector("#jobScreenModel");
const jobScreenBatchSizeInput = document.querySelector("#jobScreenBatchSize");
const jobScreenInstructionInput = document.querySelector("#jobScreenInstruction");
const rememberJobScreenKeyInput = document.querySelector("#rememberJobScreenKey");
const jobScreenRescreenAllInput = document.querySelector("#jobScreenRescreenAll");
const jobScreenStartBtn = document.querySelector("#jobScreenStartBtn");
const jobScreenStopBtn = document.querySelector("#jobScreenStopBtn");
const jobScreenResetBtn = document.querySelector("#jobScreenResetBtn");
const jobScreenLogEl = document.querySelector("#jobScreenLog");
const viewButtons = document.querySelectorAll("[data-open-view]");
const viewPanels = document.querySelectorAll("[data-view-panel]");
const statFindCompaniesEl = document.querySelector("#statFindCompanies");
const statFindJobsEl = document.querySelector("#statFindJobs");
const statScreenJobsEl = document.querySelector("#statScreenJobs");
const statResultsEl = document.querySelector("#statResults");
const statDownloadsEl = document.querySelector("#statDownloads");
const jobResultsStatusInput = document.querySelector("#jobResultsStatus");
const jobResultsQueryInput = document.querySelector("#jobResultsQuery");
const jobResultsLimitInput = document.querySelector("#jobResultsLimit");
const jobResultsRefreshBtn = document.querySelector("#jobResultsRefreshBtn");
const jobResultsClearBtn = document.querySelector("#jobResultsClearBtn");
const jobResultsSummaryEl = document.querySelector("#jobResultsSummary");
const jobResultsListEl = document.querySelector("#jobResultsList");
const riskCompanyNameInput = document.querySelector("#riskCompanyName");
const riskJobTitleInput = document.querySelector("#riskJobTitle");
const riskDownloadBtn = document.querySelector("#riskDownloadBtn");
const riskAnalyzeBtn = document.querySelector("#riskAnalyzeBtn");
const riskStatusEl = document.querySelector("#riskStatus");
const riskLogEl = document.querySelector("#riskLog");
const riskResultEl = document.querySelector("#riskResult");
const riskAddWindowBtn = document.querySelector("#riskAddWindowBtn");
const riskDeleteWindowBtn = document.querySelector("#riskDeleteWindowBtn");
const riskWindowListEl = document.querySelector("#riskWindowList");
const interviewResumeTextInput = document.querySelector("#interviewResumeText");
const interviewJobTextInput = document.querySelector("#interviewJobText");
const interviewResumeFilesInput = document.querySelector("#interviewResumeFiles");
const interviewJobFilesInput = document.querySelector("#interviewJobFiles");
const interviewExtraInfoInput = document.querySelector("#interviewExtraInfo");
const interviewModelInput = document.querySelector("#interviewModel");
const interviewAnalyzeBtn = document.querySelector("#interviewAnalyzeBtn");
const interviewClearBtn = document.querySelector("#interviewClearBtn");
const interviewStatusEl = document.querySelector("#interviewStatus");
const interviewFileNotesEl = document.querySelector("#interviewFileNotes");
const interviewReportResultEl = document.querySelector("#interviewReportResult");
const composer = document.querySelector("#composer");
const messages = document.querySelector("#messages");

let sessionId = localStorage.getItem("deepseek-bb-session") || "";
let isBusy = false;
let activeView = localStorage.getItem("deepseek-active-view") || "findCompanies";
let job51FastRefreshTimer = null;
let industryData = null;
let riskWindows = [];
let activeRiskWindowId = "";
let riskBusy = false;

function boot() {
  const savedKey = localStorage.getItem("deepseek-api-key") || "";
  const savedDbAgentKey = localStorage.getItem("deepseek-db-agent-api-key") || "";
  const savedJobScreenKey = localStorage.getItem("deepseek-job-screen-api-key") || "";
  const savedIndustryArkKey = localStorage.getItem("deepseek-industry-ark-key") || "";
  const savedModel = localStorage.getItem("deepseek-model") || "deepseek-chat";
  const savedDbAgentModel = localStorage.getItem("deepseek-db-agent-model") || "deepseek-chat";
  const savedJobScreenModel = localStorage.getItem("deepseek-job-screen-model") || "deepseek-chat";
  apiKeyInput.value = savedKey;
  dbAgentApiKeyInput.value = savedDbAgentKey;
  jobScreenApiKeyInput.value = savedJobScreenKey;
  industryArkKeyInput.value = savedIndustryArkKey;
  rememberKeyInput.checked = true;
  rememberKeyInput.disabled = true;
  rememberDbAgentKeyInput.checked = true;
  rememberDbAgentKeyInput.disabled = true;
  rememberJobScreenKeyInput.checked = true;
  rememberJobScreenKeyInput.disabled = true;
  modelInput.value = savedModel;
  dbAgentModelInput.value = savedDbAgentModel;
  jobScreenModelInput.value = savedJobScreenModel;
  industryRegionInput.value = localStorage.getItem("deepseek-industry-region") || "";
  industryArkModelInput.value = localStorage.getItem("deepseek-industry-ark-model") || "doubao-seed-2-1-turbo-260628";
  industryBrowserModelInput.value = localStorage.getItem("deepseek-industry-browser-model") || savedModel || "deepseek-chat";
  industryUserInfoInput.value = localStorage.getItem("deepseek-industry-user-info") || "";
  industryResumeTextInput.value = localStorage.getItem("deepseek-industry-resume-text") || "";
  industrySessionIdInput.value = localStorage.getItem("deepseek-industry-session-id") || "tyc-industry-search";
  const savedJob51Max = localStorage.getItem("deepseek-job51-agent-max");
  job51AgentMaxInput.value = !savedJob51Max || savedJob51Max === "5" ? "50" : savedJob51Max;
  job51AgentStatusSelect.value = localStorage.getItem("deepseek-job51-agent-status-v2") || "__boss_done__";
  job51AgentCompanyDelayMinInput.value = localStorage.getItem("deepseek-job51-agent-company-delay-min") || "8";
  job51AgentCompanyDelayMaxInput.value = localStorage.getItem("deepseek-job51-agent-company-delay-max") || "15";
  job51AgentActionDelayMinInput.value = localStorage.getItem("deepseek-job51-agent-action-delay-min") || "1";
  job51AgentActionDelayMaxInput.value = localStorage.getItem("deepseek-job51-agent-action-delay-max") || "3";
  job51AgentAreaInput.value = localStorage.getItem("deepseek-job51-agent-area") || "000000";
  jobScreenBatchSizeInput.value = localStorage.getItem("deepseek-job-screen-batch-size") || "100";
  jobScreenInstructionInput.value = localStorage.getItem("deepseek-job-screen-instruction") || "";
  jobScreenRescreenAllInput.checked = localStorage.getItem("deepseek-job-screen-rescreen-all") !== "false";
  jobResultsStatusInput.value = localStorage.getItem("deepseek-job-results-status") || "screened";
  interviewModelInput.value = localStorage.getItem("deepseek-interview-model") || savedModel || "deepseek-chat";
  interviewResumeTextInput.value = localStorage.getItem("deepseek-interview-resume-text") || "";
  interviewJobTextInput.value = localStorage.getItem("deepseek-interview-job-text") || "";
  interviewExtraInfoInput.value = localStorage.getItem("deepseek-interview-extra-info") || "";
  renderInterviewReport(localStorage.getItem("deepseek-interview-report") || "");
  loadRiskWindows();
  renderEmpty();
  renderRiskWorkspace();
  selectView(activeView, false);
  checkDbStatus(false).catch(() => {});
  refreshDbAgentStatus();
  refreshJob51AgentStatus();
  refreshJobScreenStatus();
  refreshJobResults(false).catch(() => {});
  setInterval(refreshDbAgentStatus, 5000);
  setInterval(refreshJob51AgentStatus, 5000);
  setInterval(refreshJobScreenStatus, 5000);
}

function bindAutoSave(input, storageKey, fallback = "") {
  const save = () => {
    const value = input.value.trim();
    if (value) {
      localStorage.setItem(storageKey, value);
    } else if (fallback) {
      localStorage.setItem(storageKey, fallback);
    } else {
      localStorage.removeItem(storageKey);
    }
  };
  input.addEventListener("input", save);
  input.addEventListener("change", save);
}

bindAutoSave(apiKeyInput, "deepseek-api-key");
bindAutoSave(modelInput, "deepseek-model", "deepseek-chat");
bindAutoSave(industryArkKeyInput, "deepseek-industry-ark-key");
bindAutoSave(industryArkModelInput, "deepseek-industry-ark-model", "doubao-seed-2-1-turbo-260628");
bindAutoSave(industryBrowserModelInput, "deepseek-industry-browser-model", "deepseek-chat");
bindAutoSave(industryRegionInput, "deepseek-industry-region");
bindAutoSave(industryUserInfoInput, "deepseek-industry-user-info");
bindAutoSave(industryResumeTextInput, "deepseek-industry-resume-text");
bindAutoSave(industrySessionIdInput, "deepseek-industry-session-id", "tyc-industry-search");
bindAutoSave(dbAgentApiKeyInput, "deepseek-db-agent-api-key");
bindAutoSave(dbAgentModelInput, "deepseek-db-agent-model", "deepseek-chat");
bindAutoSave(jobScreenApiKeyInput, "deepseek-job-screen-api-key");
bindAutoSave(jobScreenModelInput, "deepseek-job-screen-model", "deepseek-chat");
bindAutoSave(interviewModelInput, "deepseek-interview-model", "deepseek-chat");
bindAutoSave(interviewResumeTextInput, "deepseek-interview-resume-text");
bindAutoSave(interviewJobTextInput, "deepseek-interview-job-text");
bindAutoSave(interviewExtraInfoInput, "deepseek-interview-extra-info");

function renderEmpty() {
  if (messages.children.length) return;
  messages.innerHTML = '<div class="empty"><div>填入 DeepSeek API Key，然后告诉它要用 Chrome 做什么。</div></div>';
}

function clearEmpty() {
  const empty = messages.querySelector(".empty");
  if (empty) empty.remove();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function setIndustryStatus(text, className = "") {
  industryStatusEl.textContent = text;
  industryStatusEl.className = `status-line ${className}`.trim();
  industryRunStatusEl.textContent = text;
  industryRunStatusEl.className = `status-line ${className}`.trim();
}

function addIndustryLog(message) {
  const time = new Date().toTimeString().slice(0, 8);
  const current = industryLogEl.innerHTML || "";
  industryLogEl.innerHTML = `<div>${escapeHtml(time)} ${escapeHtml(message)}</div>${current}`;
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error(`无法读取文件：${file.name}`));
    reader.readAsDataURL(file);
  });
}

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error(`无法读取文件：${file.name}`));
    reader.readAsText(file);
  });
}

function isIndustryTextFile(file) {
  const name = file.name.toLowerCase();
  return file.type.startsWith("text/") || [".txt", ".md", ".json", ".csv"].some((suffix) => name.endsWith(suffix));
}

function isInterviewTextFile(file) {
  const name = file.name.toLowerCase();
  return file.type.startsWith("text/") || [".txt", ".md", ".json", ".csv", ".tsv"].some((suffix) => name.endsWith(suffix));
}

async function prepareInterviewFiles(input) {
  const files = [];
  for (const file of [...input.files]) {
    const item = { name: file.name, type: file.type || "unknown", size: file.size };
    if (isInterviewTextFile(file)) {
      item.text = (await readAsText(file)).slice(0, 80000);
    } else {
      item.dataUrl = await readAsDataUrl(file);
    }
    files.push(item);
  }
  return files;
}

async function prepareIndustryFiles() {
  const files = [];
  for (const file of [...industryFilesInput.files]) {
    const item = { name: file.name, type: file.type || "unknown", size: file.size };
    if (file.type.startsWith("image/")) {
      item.dataUrl = await readAsDataUrl(file);
    } else if (isIndustryTextFile(file)) {
      item.text = (await readAsText(file)).slice(0, 12000);
    }
    files.push(item);
  }
  return files;
}

function renderIndustryResults(data) {
  const industries = data?.industries || [];
  if (!industries.length) {
    industryResultsEl.innerHTML = '<article class="result-card"><div class="result-meta">现在无法基于准确信息确认任何行业，请补充更明确的国家、地区、政策线索或简历内容。</div></article>';
    statFindCompaniesEl.textContent = "未确认行业";
    return;
  }
  statFindCompaniesEl.textContent = `行业 ${industries.length} 个，待采集企业`;
  industryResultsEl.innerHTML = `
    <article class="result-card">
      <header>
        <div>
          <div class="result-title">支持行业</div>
          <div class="result-meta">已返回 ${escapeHtml(industries.length)} 个行业，可继续执行天眼查高级搜索。</div>
        </div>
        <span class="badge suitable">已提取</span>
      </header>
      <div class="industry-list">
        ${industries.map((item) => `<div class="result-meta">${escapeHtml(item.number)}. ${escapeHtml(item.industry)}</div>`).join("")}
      </div>
    </article>
  `;
}

function previewIndustryTycTasks() {
  const region = industryRegionInput.value.trim();
  const industries = industryData?.industries || [];
  if (!region) throw new Error("请先填写国家或地区。");
  if (!industries.length) throw new Error("请先提取支持行业。");
  industryResultsEl.innerHTML = `
    <article class="result-card">
      <header>
        <div>
          <div class="result-title">天眼查任务预览</div>
          <div class="result-meta">将按顺序执行 ${escapeHtml(industries.length)} 个行业，风险筛选包含无失信、无被执行、无限高、无破产、无经营异常。</div>
        </div>
        <span class="badge maybe">待执行</span>
      </header>
      ${industries.map((item) => `
        <div class="result-note">${escapeHtml(item.number)}. 地区=${escapeHtml(region)} / 行业=${escapeHtml(item.industry)}</div>
      `).join("")}
    </article>
  `;
  setIndustryStatus(`已生成 ${industries.length} 个天眼查任务`, "good");
  addIndustryLog(`预览 ${industries.length} 个任务`);
}

function renderIndustryTycResult(data) {
  const companies = data.companies || [];
  const resultCards = (data.results || []).map((item) => `
    <article class="result-card">
      <header>
        <div>
          <div class="result-title">${escapeHtml(item.number)}. ${escapeHtml(item.industry)}</div>
          <div class="result-meta">返回公司 ${(item.companies || []).length} 家；导入 ${(item.companyImport?.imported || 0)} 家。</div>
        </div>
        <span class="badge suitable">完成</span>
      </header>
      ${(item.companies || []).slice(0, 20).map((name) => `<div class="result-meta">${escapeHtml(name)}</div>`).join("")}
      ${item.reply ? `<details><summary>模型回复</summary><div class="result-note">${escapeHtml(item.reply).replaceAll("\n", "<br>")}</div></details>` : ""}
    </article>
  `).join("");
  industryResultsEl.innerHTML = `
    <article class="result-card">
      <header>
        <div>
          <div class="result-title">企业名单采集完成</div>
          <div class="result-meta">${escapeHtml(data.message || "天眼查流程完成。")} 企业总数 ${companies.length}。</div>
        </div>
        <span class="badge suitable">已入库</span>
      </header>
    </article>
    ${resultCards || '<article class="result-card"><div class="result-meta">没有可展示的行业结果。</div></article>'}
  `;
  statFindCompaniesEl.textContent = `企业 ${companies.length}，导入 ${data.importedCompanies || 0}`;
}

function setInterviewStatus(text, className = "") {
  interviewStatusEl.textContent = text;
  interviewStatusEl.className = `status-line ${className}`.trim();
}

function renderInterviewFileNotes(notes = []) {
  if (!notes.length) {
    interviewFileNotesEl.innerHTML = "";
    return;
  }
  interviewFileNotesEl.innerHTML = notes.map((item) => {
    const label = item.area === "resume" ? "简历" : "岗位";
    const status = item.status === "text_extracted" ? "已读取" : "未读取";
    const note = item.note ? `：${item.note}` : "";
    return `<div>${escapeHtml(label)} ${escapeHtml(item.name)} ${escapeHtml(status)}${escapeHtml(note)}</div>`;
  }).join("");
}

function renderInterviewReport(report) {
  const value = String(report || "").trim();
  if (!value) {
    interviewReportResultEl.innerHTML = '<div class="empty">上传简历和目标岗位后，这里会生成正式面试策略报告。</div>';
    return;
  }
  interviewReportResultEl.innerHTML = `<pre class="report-pre">${escapeHtml(value)}</pre>`;
}

function selectView(view, remember = true) {
  const targetView = view || "findCompanies";
  activeView = document.querySelector(`[data-view-panel="${targetView}"]`) ? targetView : "findCompanies";
  viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.openView === activeView);
  });
  viewPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === activeView);
  });
  if (remember) localStorage.setItem("deepseek-active-view", activeView);
  if (activeView === "results") refreshJobResults(false).catch(() => {});
  if (activeView === "browser") promptInput.focus();
  if (activeView === "companyRisk") riskCompanyNameInput.focus();
  if (activeView === "interviewReport") interviewResumeTextInput.focus();
}

function addMessage(role, content, className = "") {
  clearEmpty();
  const el = document.createElement("article");
  el.className = `message ${className}`.trim();
  el.innerHTML = `<div class="role">${escapeHtml(role)}</div><div>${escapeHtml(content).replaceAll("\n", "<br>")}</div>`;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

function setBusy(nextBusy) {
  isBusy = nextBusy;
  sendBtn.disabled = nextBusy;
  cancelBtn.disabled = !nextBusy;
  statusBtn.disabled = nextBusy;
  closeTabsBtn.disabled = nextBusy;
  industryAnalyzeBtn.disabled = nextBusy;
  industryPreviewBtn.disabled = nextBusy;
  industryRunTycBtn.disabled = nextBusy;
  industryClearBtn.disabled = nextBusy;
  dbStatusBtn.disabled = nextBusy;
  dbInitBtn.disabled = nextBusy;
  companyFileInput.disabled = nextBusy;
  importCompaniesBtn.disabled = nextBusy;
  findJobsCompanyFileInput.disabled = nextBusy;
  findJobsImportCompaniesBtn.disabled = nextBusy;
  scanDownloadsBtn.disabled = nextBusy;
  processNextBtn.disabled = nextBusy;
  autoIngestInput.disabled = nextBusy;
  dbAgentStatusSelect.disabled = nextBusy;
  dbAgentRequeueErrorBtn.disabled = nextBusy;
  job51AgentStatusSelect.disabled = nextBusy;
  job51AgentStartBtn.disabled = nextBusy;
  jobScreenStartBtn.disabled = nextBusy;
  jobScreenResetBtn.disabled = nextBusy;
  jobScreenRescreenAllInput.disabled = nextBusy;
  jobResultsClearBtn.disabled = nextBusy;
  riskCompanyNameInput.disabled = nextBusy || riskBusy;
  riskJobTitleInput.disabled = nextBusy || riskBusy;
  riskDownloadBtn.disabled = nextBusy || riskBusy;
  riskAnalyzeBtn.disabled = nextBusy || riskBusy;
  riskAddWindowBtn.disabled = nextBusy || riskBusy;
  riskDeleteWindowBtn.disabled = nextBusy || riskBusy;
  interviewResumeTextInput.disabled = nextBusy;
  interviewJobTextInput.disabled = nextBusy;
  interviewResumeFilesInput.disabled = nextBusy;
  interviewJobFilesInput.disabled = nextBusy;
  interviewExtraInfoInput.disabled = nextBusy;
  interviewAnalyzeBtn.disabled = nextBusy;
  interviewClearBtn.disabled = nextBusy;
  resetBtn.disabled = false;
  sendBtn.textContent = nextBusy ? "执行中" : "发送";
}

function renderDbAgentStatus(data) {
  if (!data.ok) {
    dbAgentStatusEl.textContent = data.error || "通道状态异常";
    dbAgentStatusEl.className = "status-line bad";
    return;
  }
  dbAgentStatusEl.className = data.running ? "status-line good" : "status-line";
  const current = data.current?.name ? `，当前：${data.current.name}` : "";
  dbAgentStatusEl.textContent = data.running
    ? `运行中，已处理 ${data.processed || 0}${current}`
    : `未运行，已处理 ${data.processed || 0}${data.lastError ? `，错误：${data.lastError}` : ""}`;
  const logs = (data.logs || []).slice(-6).reverse();
  dbAgentLogEl.innerHTML = logs.map((log) => `<div>${escapeHtml(log.time.slice(11, 19))} ${escapeHtml(log.message)}</div>`).join("");
  dbAgentOpenBossBtn.disabled = Boolean(data.running);
  dbAgentCloseGeekrunBtn.disabled = Boolean(data.running);
  dbAgentRequeueErrorBtn.disabled = Boolean(data.running);
  dbAgentStartBtn.disabled = Boolean(data.running);
  dbAgentStopBtn.disabled = !data.running;
}

async function refreshDbAgentStatus() {
  try {
    const response = await fetch("/api/db-agent/status");
    const data = await response.json();
    renderDbAgentStatus(data);
  } catch (error) {
    renderDbAgentStatus({ ok: false, error: error.message || String(error) });
  }
}

function addLocalDbAgentLog(message) {
  const time = new Date().toTimeString().slice(0, 8);
  const current = dbAgentLogEl.innerHTML || "";
  dbAgentLogEl.innerHTML = `<div>${escapeHtml(time)} ${escapeHtml(message)}</div>${current}`;
}

function renderJob51AgentStatus(data) {
  if (!data.ok) {
    job51AgentStatusEl.textContent = data.error || "前程无忧状态异常";
    job51AgentStatusEl.className = "status-line bad";
    return;
  }
  job51AgentStatusEl.className = data.running ? "status-line good" : "status-line";
  const current = data.current?.name ? `，当前：${data.current.name}` : "";
  job51AgentStatusEl.textContent = data.running
    ? `运行中，已处理 ${data.processed || 0}${current}`
    : `未运行，已处理 ${data.processed || 0}${data.lastError ? `，错误：${data.lastError}` : ""}`;
  const logs = (data.logs || []).slice(-6).reverse();
  job51AgentLogEl.innerHTML = logs.map((log) => `<div>${escapeHtml(log.time.slice(11, 19))} ${escapeHtml(log.message)}</div>`).join("");
  job51AgentOpenBtn.disabled = Boolean(data.running);
  job51AgentCloseBtn.disabled = Boolean(data.running);
  job51AgentStartBtn.disabled = Boolean(data.running);
  job51AgentStopBtn.disabled = !data.running;
}

async function refreshJob51AgentStatus() {
  try {
    const response = await fetch("/api/job51-agent/status");
    const data = await response.json();
    renderJob51AgentStatus(data);
  } catch (error) {
    renderJob51AgentStatus({ ok: false, error: error.message || String(error) });
  }
}

function addLocalJob51Log(message) {
  const time = new Date().toTimeString().slice(0, 8);
  const current = job51AgentLogEl.innerHTML || "";
  job51AgentLogEl.innerHTML = `<div>${escapeHtml(time)} ${escapeHtml(message)}</div>${current}`;
}

function startJob51FastRefresh() {
  if (job51FastRefreshTimer) clearInterval(job51FastRefreshTimer);
  let ticks = 0;
  job51FastRefreshTimer = setInterval(() => {
    ticks += 1;
    refreshJob51AgentStatus().catch(() => {});
    if (ticks >= 15) {
      clearInterval(job51FastRefreshTimer);
      job51FastRefreshTimer = null;
    }
  }, 1000);
}

function renderJobScreenStatus(data) {
  if (!data.ok) {
    jobScreenStatusEl.textContent = data.error || "岗位筛选状态异常";
    jobScreenStatusEl.className = "status-line bad";
    return;
  }
  const pending = data.counts?.screenable_jobs ?? 0;
  const screenCounts = data.counts?.job_screen_counts || {};
  const screenedTotal = (screenCounts.suitable || 0) + (screenCounts.maybe || 0) + (screenCounts.not_suitable || 0) + (screenCounts.error || 0);
  jobScreenStatusEl.className = data.running ? "status-line good" : "status-line";
  jobScreenStatusEl.textContent = data.running
    ? `运行中，本次已筛选 ${data.processed || 0}，剩余待筛选 ${pending}`
    : `未运行，数据库已筛选 ${screenedTotal}，剩余待筛选 ${pending}${data.lastError ? `，错误：${data.lastError}` : ""}`;
  const logs = (data.logs || []).slice(-6).reverse();
  jobScreenLogEl.innerHTML = logs.map((log) => `<div>${escapeHtml(log.time.slice(11, 19))} ${escapeHtml(log.message)}</div>`).join("");
  jobScreenStartBtn.disabled = Boolean(data.running);
  jobScreenStopBtn.disabled = !data.running;
  jobScreenResetBtn.disabled = Boolean(data.running);
  jobResultsClearBtn.disabled = Boolean(data.running);
  if (activeView === "results") refreshJobResults(false).catch(() => {});
}

async function refreshJobScreenStatus() {
  try {
    const response = await fetch("/api/job-screen/status");
    const data = await response.json();
    renderJobScreenStatus(data);
  } catch (error) {
    renderJobScreenStatus({ ok: false, error: error.message || String(error) });
  }
}

function renderJobResults(data) {
  if (!data.ok) {
    jobResultsSummaryEl.textContent = data.error || "结果加载失败";
    jobResultsSummaryEl.className = "status-line bad";
    jobResultsListEl.innerHTML = "";
    return;
  }
  const rows = data.rows || [];
  const counts = data.counts?.job_screen_counts || {};
  const filterLabel = jobResultsStatusInput.selectedOptions?.[0]?.textContent || "当前条件";
  jobResultsSummaryEl.className = "status-line good";
  jobResultsSummaryEl.textContent = `${filterLabel}：已加载 ${rows.length} 条；合适 ${counts.suitable || 0}，可考虑 ${counts.maybe || 0}，不合适 ${counts.not_suitable || 0}，待筛选 ${counts.pending || 0}`;
  if (!rows.length) {
    jobResultsListEl.innerHTML = '<div class="result-card"><div class="result-meta">当前条件没有筛选结果。</div></div>';
    return;
  }
  const labels = {
    suitable: "合适",
    maybe: "可考虑",
    not_suitable: "不合适",
    error: "错误",
    pending: "待筛选",
    screening: "筛选中",
  };
  jobResultsListEl.innerHTML = rows.map((job) => {
    const status = job.ai_screen_status || job.status || "pending";
    const score = job.ai_screen_score ?? job.fit_score;
    const url = safeHttpUrl(job.apply_url || job.source_url);
    const meta = [
      job.company_name,
      job.location,
      job.salary,
      job.experience,
      job.education,
      job.source_platform,
    ].filter(Boolean).join(" / ");
    const description = String(job.description || "").slice(0, 220);
    return `
      <article class="result-card">
        <header>
          <div>
            <div class="result-title">${escapeHtml(job.title || "未命名岗位")}</div>
            <div class="result-meta">${escapeHtml(meta || "暂无岗位信息")}</div>
          </div>
          <span class="badge ${escapeHtml(status)}">${escapeHtml(labels[status] || status)}${score == null ? "" : ` ${escapeHtml(score)}`}</span>
        </header>
        ${job.ai_screen_note ? `<div class="result-note">${escapeHtml(job.ai_screen_note)}</div>` : ""}
        ${description ? `<div class="result-meta">${escapeHtml(description)}</div>` : ""}
        ${url ? `<a class="result-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">打开岗位来源</a>` : ""}
      </article>`;
  }).join("");
}

async function refreshJobResults(showMessage = false) {
  const params = new URLSearchParams();
  params.set("status", jobResultsStatusInput.value || "suitable");
  params.set("limit", jobResultsLimitInput.value || "50");
  if (jobResultsQueryInput.value.trim()) params.set("query", jobResultsQueryInput.value.trim());
  const response = await fetch(`/api/job-screen/results?${params}`);
  const data = await response.json();
  renderJobResults(data);
  if (showMessage) addMessage("系统", data.ok ? `已刷新筛选结果：${(data.rows || []).length} 条。` : `结果加载失败：${data.error}`);
  return data;
}

function loadRiskWindows() {
  try {
    riskWindows = JSON.parse(localStorage.getItem("company-risk-windows") || "[]");
  } catch {
    riskWindows = [];
  }
  if (!Array.isArray(riskWindows) || !riskWindows.length) {
    riskWindows = [createRiskWindow()];
  }
  activeRiskWindowId = localStorage.getItem("company-risk-active-window") || riskWindows[0].id;
  if (!riskWindows.some((item) => item.id === activeRiskWindowId)) {
    activeRiskWindowId = riskWindows[0].id;
  }
  saveRiskWindows();
}

function createRiskWindow() {
  const index = riskWindows.length + 1;
  return {
    id: crypto.randomUUID(),
    sessionId: `company-risk-${crypto.randomUUID()}`,
    title: `窗口 ${index}`,
    companyName: "",
    jobTitle: "",
    status: "idle",
    log: [],
    chatReply: "",
    report: null,
    analysis: null,
    error: "",
  };
}

function saveRiskWindows() {
  localStorage.setItem("company-risk-windows", JSON.stringify(riskWindows));
  localStorage.setItem("company-risk-active-window", activeRiskWindowId || "");
}

function getActiveRiskWindow() {
  return riskWindows.find((item) => item.id === activeRiskWindowId) || riskWindows[0];
}

function updateActiveRiskWindow(patch) {
  const current = getActiveRiskWindow();
  if (!current) return null;
  Object.assign(current, patch);
  current.title = current.companyName || current.title || "新窗口";
  saveRiskWindows();
  renderRiskWorkspace();
  return current;
}

function addRiskLog(message) {
  const current = getActiveRiskWindow();
  if (!current) return;
  const time = new Date().toTimeString().slice(0, 8);
  current.log = [{ time, message }, ...(current.log || [])].slice(0, 30);
  saveRiskWindows();
  renderRiskWorkspace();
}

function syncRiskInputs() {
  updateActiveRiskWindow({
    companyName: riskCompanyNameInput.value.trim(),
    jobTitle: riskJobTitleInput.value.trim(),
  });
}

function renderRiskWorkspace() {
  const current = getActiveRiskWindow();
  riskWindowListEl.innerHTML = riskWindows.map((item, index) => `
    <button class="window-item ${item.id === activeRiskWindowId ? "active" : ""}" type="button" data-risk-window-id="${escapeHtml(item.id)}" ${riskBusy ? "disabled" : ""}>
      <strong>${escapeHtml(item.companyName || item.title || `窗口 ${index + 1}`)}</strong>
      <small>${escapeHtml(item.statusText || item.jobTitle || "新一轮任务")}</small>
    </button>
  `).join("");

  riskWindowListEl.querySelectorAll("[data-risk-window-id]").forEach((button) => {
    button.addEventListener("click", () => {
      activeRiskWindowId = button.dataset.riskWindowId;
      saveRiskWindows();
      renderRiskWorkspace();
    });
  });

  if (!current) return;
  if (riskCompanyNameInput.value !== current.companyName) riskCompanyNameInput.value = current.companyName || "";
  if (riskJobTitleInput.value !== current.jobTitle) riskJobTitleInput.value = current.jobTitle || "";
  riskStatusEl.textContent = current.statusText || statusLabel(current.status);
  riskStatusEl.className = `status-line ${current.status === "failed" ? "bad" : current.status === "completed" ? "good" : ""}`;
  riskLogEl.innerHTML = (current.log || []).map((item) => `<div>${escapeHtml(item.time)} ${escapeHtml(item.message)}</div>`).join("");
  riskResultEl.innerHTML = renderRiskResult(current);
  riskDeleteWindowBtn.disabled = riskBusy || riskWindows.length <= 1;
}

function statusLabel(status) {
  const map = {
    idle: "等待开始",
    downloading: "正在下载报告",
    scanning: "正在扫描下载目录",
    analyzing: "正在分析报告",
    completed: "分析完成",
    failed: "任务失败",
  };
  return map[status] || status || "等待开始";
}

function renderRiskResult(win) {
  if (win.error) {
    return `<div class="status-line bad">${escapeHtml(win.error)}</div>`;
  }
  if (!win.analysis) {
    return `<div class="empty">${escapeHtml(win.chatReply || "新增窗口或填写公司信息后开始分析。")}</div>`;
  }
  const analysis = win.analysis;
  const scoreItems = Array.isArray(analysis.score_items) ? analysis.score_items : [];
  const risks = Array.isArray(analysis.risk_points) ? analysis.risk_points : [];
  const questions = Array.isArray(analysis.questions_to_ask_hr) ? analysis.questions_to_ask_hr : [];
  return `
    <div class="risk-summary">
      <div>${escapeHtml(analysis.summary || "")}</div>
      <div class="risk-metrics">
        <div class="risk-metric"><span>求职安全评分</span><strong>${escapeHtml(analysis.job_safety_score ?? "-")}</strong></div>
        <div class="risk-metric"><span>风险等级</span><strong>${escapeHtml(analysis.risk_level || "-")}</strong></div>
        <div class="risk-metric"><span>结论</span><strong>${escapeHtml(analysis.overall_conclusion || "-")}</strong></div>
      </div>
      ${win.report?.fileName ? `<div class="status-line">报告：${escapeHtml(win.report.fileName)}</div>` : ""}
      ${scoreItems.length ? renderRiskScoreTable(scoreItems) : ""}
      ${risks.length ? `<h3>核心风险点</h3><ul class="risk-list">${risks.map((item) => `<li>${escapeHtml(`${item.risk || ""}：${item.impact_on_employee || item.evidence || ""}`)}</li>`).join("")}</ul>` : ""}
      ${questions.length ? `<h3>入职前追问 HR</h3><ul class="risk-list">${questions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
    </div>
  `;
}

function renderRiskScoreTable(items) {
  return `
    <table class="risk-table">
      <thead>
        <tr><th>评分项</th><th>得分</th><th>风险</th><th>依据</th></tr>
      </thead>
      <tbody>
        ${items.map((item) => `
          <tr>
            <td>${escapeHtml(item.item_name || "")}</td>
            <td>${escapeHtml(item.score ?? 0)}/${escapeHtml(item.max_score ?? "")}</td>
            <td>${escapeHtml(item.risk_level || "")}</td>
            <td>${escapeHtml(item.evidence || item.reason || "")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function buildRiskDownloadPrompt(companyName, jobTitle) {
  return `你是浏览器自动化智能体。请打开天眼查，搜索公司“${companyName}”，进入最匹配的公司详情页，然后点击右上角或页面内的“报告下载/下载报告/企业信用报告”等按钮下载企业信用报告。

求职职位：${jobTitle}

操作要求：
1. 优先选择公司名称完全一致的结果。
2. 如果有多个相似结果，优先选择经营状态正常、名称完全一致的公司；无法确认时不要乱点，列出候选并停止。
3. 如果遇到登录、验证码、会员、付费、权限不足，停止并说明原因。
4. 下载按钮每个任务最多点击一次，点击后等待几秒并用 db_recent_downloads 或下载状态确认。
5. 完成后只用中文简短说明：匹配公司名、公司页 URL、是否点击下载、报告文件名或无法识别文件名的原因。`;
}

async function runRiskAnalysis({ withDownload }) {
  syncRiskInputs();
  const current = getActiveRiskWindow();
  const apiKey = apiKeyInput.value.trim();
  const model = modelInput.value.trim() || "deepseek-chat";
  if (!apiKey) {
    updateActiveRiskWindow({ status: "failed", statusText: "请先填写浏览器 API Key", error: "请先填写浏览器 API Key" });
    return;
  }
  if (!current.companyName || !current.jobTitle) {
    updateActiveRiskWindow({ status: "failed", statusText: "公司名称和职位不能为空", error: "公司名称和职位不能为空" });
    return;
  }

  localStorage.setItem("deepseek-api-key", apiKey);
  localStorage.setItem("deepseek-model", model);
  riskBusy = true;
  setBusy(isBusy);
  updateActiveRiskWindow({ status: withDownload ? "downloading" : "scanning", statusText: withDownload ? "正在操控浏览器下载报告" : "正在扫描下载目录", error: "", analysis: null });
  try {
    if (withDownload) {
      addRiskLog("开始让 DeepSeek 操控天眼查下载报告");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey,
          model,
          message: buildRiskDownloadPrompt(current.companyName, current.jobTitle),
          sessionId: current.sessionId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "报告下载任务失败");
      current.chatReply = data.reply || "浏览器操作完成。";
      current.sessionId = data.sessionId || current.sessionId;
      addRiskLog("浏览器操作完成，准备扫描下载目录");
    }

    updateActiveRiskWindow({ status: "scanning", statusText: "正在扫描下载目录" });
    const scanResponse = await fetch("/api/download-ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "scan", sessionId: current.sessionId, limit: 80 }),
    });
    const scanData = await scanResponse.json();
    if (!scanResponse.ok) throw new Error(scanData.error || "扫描下载目录失败");
    addRiskLog(`下载目录扫描完成，入库 ${scanData.result?.indexed ?? 0} 个文件`);

    updateActiveRiskWindow({ status: "analyzing", statusText: "正在分析企业信用报告" });
    const analyzeResponse = await fetch("/api/company-risk/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey,
        model,
        sessionId: current.sessionId,
        companyName: current.companyName,
        jobTitle: current.jobTitle,
      }),
    });
    const analyzeData = await analyzeResponse.json();
    if (!analyzeResponse.ok) throw new Error(analyzeData.error || "企业风险分析失败");
    updateActiveRiskWindow({
      status: "completed",
      statusText: "分析完成",
      report: analyzeData.report,
      analysis: analyzeData.analysis,
      error: "",
    });
    addRiskLog(`分析完成：${analyzeData.report?.fileName || "已读取报告"}`);
  } catch (error) {
    updateActiveRiskWindow({
      status: "failed",
      statusText: `失败：${error.message || String(error)}`,
      error: error.message || String(error),
    });
    addRiskLog(`失败：${error.message || String(error)}`);
  } finally {
    riskBusy = false;
    setBusy(isBusy);
    renderRiskWorkspace();
  }
}

function ensureSessionId() {
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("deepseek-bb-session", sessionId);
  }
  return sessionId;
}

async function sendPrompt(message) {
  const apiKey = apiKeyInput.value.trim();
  const model = modelInput.value.trim() || "deepseek-chat";
  if (!apiKey) {
    addMessage("系统", "请先填写 DeepSeek API Key。");
    return;
  }
  localStorage.setItem("deepseek-api-key", apiKey);
  localStorage.setItem("deepseek-model", model);

  const activeSessionId = ensureSessionId();
  addMessage("你", message, "user");
  setBusy(true);
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey, model, message, sessionId: activeSessionId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "请求失败");
    sessionId = data.sessionId;
    localStorage.setItem("deepseek-bb-session", sessionId);
    addMessage(data.cancelled ? "系统" : "DeepSeek", data.reply || "完成。");
  } catch (error) {
    addMessage("错误", error.message || String(error));
  } finally {
    setBusy(false);
  }
}

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = promptInput.value.trim();
  if (!value) return;
  promptInput.value = "";
  sendPrompt(value);
});

promptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    composer.requestSubmit();
  }
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => selectView(button.dataset.openView));
});

riskCompanyNameInput.addEventListener("input", () => {
  const current = getActiveRiskWindow();
  if (!current) return;
  current.companyName = riskCompanyNameInput.value.trim();
  current.title = current.companyName || current.title || "新窗口";
  saveRiskWindows();
  renderRiskWorkspace();
});

riskJobTitleInput.addEventListener("input", () => {
  const current = getActiveRiskWindow();
  if (!current) return;
  current.jobTitle = riskJobTitleInput.value.trim();
  saveRiskWindows();
  renderRiskWorkspace();
});

riskAddWindowBtn.addEventListener("click", () => {
  const next = createRiskWindow();
  riskWindows.push(next);
  activeRiskWindowId = next.id;
  saveRiskWindows();
  renderRiskWorkspace();
  riskCompanyNameInput.focus();
});

riskDeleteWindowBtn.addEventListener("click", async () => {
  const current = getActiveRiskWindow();
  if (!current || riskWindows.length <= 1) return;
  riskDeleteWindowBtn.disabled = true;
  try {
    await fetch("/api/company-risk/clear", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: current.sessionId }),
    }).catch(() => {});
    riskWindows = riskWindows.filter((item) => item.id !== current.id);
    activeRiskWindowId = riskWindows[0]?.id || "";
    saveRiskWindows();
    renderRiskWorkspace();
  } finally {
    riskDeleteWindowBtn.disabled = riskBusy || riskWindows.length <= 1;
  }
});

riskDownloadBtn.addEventListener("click", () => {
  runRiskAnalysis({ withDownload: true });
});

riskAnalyzeBtn.addEventListener("click", () => {
  runRiskAnalysis({ withDownload: false });
});

industryAnalyzeBtn.addEventListener("click", async () => {
  const apiKey = industryArkKeyInput.value.trim();
  const region = industryRegionInput.value.trim();
  if (!apiKey) {
    setIndustryStatus("请填写 Ark API Key", "bad");
    return;
  }
  if (!region) {
    setIndustryStatus("请填写国家或地区", "bad");
    return;
  }
  industryAnalyzeBtn.disabled = true;
  setIndustryStatus("正在提取支持行业...", "good");
  addIndustryLog("开始调用豆包提取行业");
  try {
    const response = await fetch("/api/industry/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey,
        region,
        model: industryArkModelInput.value.trim() || "doubao-seed-2-1-turbo-260628",
        userInfo: industryUserInfoInput.value.trim(),
        resumeText: industryResumeTextInput.value.trim(),
        files: await prepareIndustryFiles(),
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "行业提取失败");
    industryData = { industries: data.industries || [] };
    renderIndustryResults(industryData);
    setIndustryStatus(`已提取 ${industryData.industries.length} 个行业`, industryData.industries.length ? "good" : "");
    addIndustryLog(`行业提取完成：${industryData.industries.length} 个`);
  } catch (error) {
    setIndustryStatus(error.message || String(error), "bad");
    addIndustryLog(`提取失败：${error.message || String(error)}`);
  } finally {
    industryAnalyzeBtn.disabled = isBusy;
  }
});

industryPreviewBtn.addEventListener("click", () => {
  try {
    previewIndustryTycTasks();
  } catch (error) {
    setIndustryStatus(error.message || String(error), "bad");
    addIndustryLog(error.message || String(error));
  }
});

industryRunTycBtn.addEventListener("click", async () => {
  const apiKey = apiKeyInput.value.trim() || dbAgentApiKeyInput.value.trim() || jobScreenApiKeyInput.value.trim();
  const region = industryRegionInput.value.trim();
  const industries = industryData?.industries || [];
  if (!apiKey) {
    setIndustryStatus("请先填写顶部浏览器 API Key", "bad");
    return;
  }
  if (!region || !industries.length) {
    setIndustryStatus("请先提取行业结果", "bad");
    return;
  }
  industryRunTycBtn.disabled = true;
  setIndustryStatus("正在执行天眼查任务...", "good");
  addIndustryLog(`开始执行 ${industries.length} 个天眼查任务`);
  try {
    const response = await fetch("/api/industry/tyc-run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey,
        region,
        industries,
        model: industryBrowserModelInput.value.trim() || modelInput.value.trim() || "deepseek-chat",
        sessionId: industrySessionIdInput.value.trim() || ensureSessionId(),
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "天眼查任务失败");
    renderIndustryTycResult(data);
    setIndustryStatus(`已导入企业 ${data.importedCompanies || 0} 家`, "good");
    addIndustryLog(data.message || "天眼查任务完成");
    await checkDbStatus(false);
  } catch (error) {
    setIndustryStatus(error.message || String(error), "bad");
    addIndustryLog(`执行失败：${error.message || String(error)}`);
  } finally {
    industryRunTycBtn.disabled = isBusy;
  }
});

industryClearBtn.addEventListener("click", () => {
  industryData = null;
  industryResultsEl.innerHTML = "";
  setIndustryStatus("等待行业提取");
  statFindCompaniesEl.textContent = "行业政策 / 天眼查名单";
  addIndustryLog("已清空行业结果");
});

jobResultsRefreshBtn.addEventListener("click", () => {
  refreshJobResults(true).catch((error) => addMessage("错误", error.message || String(error)));
});

jobResultsClearBtn.addEventListener("click", async () => {
  jobResultsClearBtn.disabled = true;
  jobResultsSummaryEl.className = "status-line";
  jobResultsSummaryEl.textContent = "正在清空筛选结果...";
  jobResultsListEl.innerHTML = "";
  try {
    const response = await fetch("/api/job-screen/clear-results", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "清空筛选结果失败");
    addMessage("系统", data.message || `已清空 ${data.updated || 0} 条筛选结果。`);
    jobResultsStatusInput.value = "screened";
    localStorage.setItem("deepseek-job-results-status", "screened");
    await checkDbStatus(false);
    await refreshJobScreenStatus();
    await refreshJobResults(false);
  } catch (error) {
    addMessage("错误", error.message || String(error));
    await refreshJobResults(false).catch(() => {});
  } finally {
    jobResultsClearBtn.disabled = isBusy;
  }
});

jobResultsStatusInput.addEventListener("change", () => {
  localStorage.setItem("deepseek-job-results-status", jobResultsStatusInput.value || "screened");
  refreshJobResults(false).catch(() => {});
});

jobResultsLimitInput.addEventListener("change", () => {
  refreshJobResults(false).catch(() => {});
});

jobResultsQueryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    refreshJobResults(false).catch(() => {});
  }
});

statusBtn.addEventListener("click", () => {
  sendPrompt("请检查 bb-browser daemon 和 Chrome 标签页状态。如果没有连接，请启动 daemon。");
});

function renderDbStatus(data) {
  if (!data.ok) {
    dbStatusEl.textContent = `未连接：${data.error || "数据库不可用"}`;
    dbStatusEl.className = "status-line bad";
    statFindJobsEl.textContent = "数据库未连接";
    statScreenJobsEl.textContent = "等待数据库";
    statResultsEl.textContent = "暂无结果";
    statDownloadsEl.textContent = "下载未检查";
    return;
  }
  const counts = data.counts;
  const taskDownloads = data.taskCounts?.downloaded_files;
  const statusCounts = counts?.status_counts
    ? Object.entries(counts.status_counts).map(([status, count]) => `${status} ${count}`).join("，")
    : "";
  const screenCounts = counts?.job_screen_counts
    ? Object.entries(counts.job_screen_counts).map(([status, count]) => `${status} ${count}`).join("，")
    : "";
  dbStatusEl.className = "status-line good";
  dbStatusEl.textContent = counts
    ? `已连接：搜索前企业 ${counts.companies}，今日剩余 ${counts.claimable_today || 0}；搜索后岗位 ${counts.jobs}，待筛选 ${counts.screenable_jobs || 0}；本任务下载 ${taskDownloads ?? 0}${statusCounts ? `，企业状态：${statusCounts}` : ""}${screenCounts ? `，岗位筛选：${screenCounts}` : ""}`
    : "已连接：尚未初始化表";
  if (counts) {
    const screen = counts.job_screen_counts || {};
    statFindJobsEl.textContent = `企业 ${counts.companies || 0}，今日剩余 ${counts.claimable_today || 0}`;
    statScreenJobsEl.textContent = `岗位 ${counts.jobs || 0}，待筛选 ${counts.screenable_jobs || 0}`;
    statResultsEl.textContent = `合适 ${screen.suitable || 0}，可考虑 ${screen.maybe || 0}`;
    statDownloadsEl.textContent = `本任务下载 ${taskDownloads ?? 0}，总文件 ${counts.downloaded_files || 0}`;
  }
  if (data.ingest) autoIngestInput.checked = Boolean(data.ingest.enabled);
}

async function checkDbStatus(showMessage = true) {
  const params = new URLSearchParams();
  if (sessionId) params.set("sessionId", sessionId);
  const response = await fetch(`/api/db/status${params.toString() ? `?${params}` : ""}`);
  const data = await response.json();
  renderDbStatus(data);
  if (showMessage) addMessage("系统", data.ok ? dbStatusEl.textContent : `数据库未连接：${data.error}`);
  return data;
}

dbStatusBtn.addEventListener("click", async () => {
  try {
    await checkDbStatus(true);
  } catch (error) {
    addMessage("错误", error.message || String(error));
  }
});

dbInitBtn.addEventListener("click", async () => {
  dbInitBtn.disabled = true;
  dbInitBtn.textContent = "初始化中";
  try {
    const response = await fetch("/api/db/init", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "初始化失败");
    renderDbStatus({ ok: true, counts: data.counts });
    addMessage("系统", `数据库初始化完成。企业 ${data.counts.companies}，岗位 ${data.counts.jobs}，下载 ${data.counts.downloaded_files}。`);
  } catch (error) {
    addMessage("错误", error.message || String(error));
  } finally {
    dbInitBtn.textContent = "初始化数据库";
    dbInitBtn.disabled = isBusy;
  }
});

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    };
    reader.onerror = () => reject(reader.error || new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

function setImportStatus(statusEl, message, state = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status-line ${state}`.trim();
}

async function importCompanyFile(fileInput, button, defaultText, statusEl = null) {
  const file = fileInput.files?.[0];
  if (!file) {
    setImportStatus(statusEl, "请先选择 Excel/CSV 企业名单文件。", "bad");
    addMessage("系统", "请先选择 CSV/Excel 企业名单文件。");
    return;
  }
  if (/\.xls$/i.test(file.name)) {
    const message = "当前入口支持 .xlsx/.xlsm，不支持老式 .xls。请另存为 .xlsx 后再导入。";
    setImportStatus(statusEl, message, "bad");
    addMessage("错误", message);
    return;
  }
  button.disabled = true;
  button.textContent = "导入中";
  setImportStatus(statusEl, `正在导入：${file.name}`, "good");
  try {
    const base64 = await readFileAsBase64(file);
    const response = await fetch("/api/import-companies", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: file.name, base64 }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "导入失败");
    const message = `企业导入完成：新增/更新 ${data.imported} 家，跳过 ${data.skipped} 行。示例：${(data.samples || []).join("、") || "无"}`;
    setImportStatus(statusEl, message, "good");
    addMessage("系统", message);
    fileInput.value = "";
    await checkDbStatus(false);
  } catch (error) {
    setImportStatus(statusEl, error.message || String(error), "bad");
    addMessage("错误", error.message || String(error));
  } finally {
    button.textContent = defaultText;
    button.disabled = isBusy;
  }
}

importCompaniesBtn.addEventListener("click", async () => {
  await importCompanyFile(companyFileInput, importCompaniesBtn, "导入企业");
});

findJobsImportCompaniesBtn.addEventListener("click", async () => {
  await importCompanyFile(findJobsCompanyFileInput, findJobsImportCompaniesBtn, "导入企业名单", findJobsImportStatusEl);
});

scanDownloadsBtn.addEventListener("click", async () => {
  scanDownloadsBtn.disabled = true;
  scanDownloadsBtn.textContent = "扫描中";
  try {
    const response = await fetch("/api/download-ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "scan", sessionId: ensureSessionId() }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "扫描失败");
    addMessage("系统", `下载目录扫描完成：入库/更新 ${data.result.indexed} 个，跳过 ${data.result.skipped} 个。本任务下载副本目录：${data.taskDownloadsDir}`);
    await checkDbStatus(false);
  } catch (error) {
    addMessage("错误", error.message || String(error));
  } finally {
    scanDownloadsBtn.textContent = "扫描下载目录";
    scanDownloadsBtn.disabled = isBusy;
  }
});

processNextBtn.addEventListener("click", () => {
  sendPrompt("请使用 db_claim_next_company 领取下一家今天还没处理过的企业。只处理这一家：搜索官网、招聘平台、政府/园区公告，判断是否还招人。找到岗位就用 db_add_job 写入岗位并用 db_add_note 记录证据；没找到近期岗位就用 db_update_company 标记 no_recent_jobs 并备注查过的来源。处理完后停止，不要继续领取下一家。");
});

dbAgentOpenBossBtn.addEventListener("click", async () => {
  dbAgentOpenBossBtn.disabled = true;
  dbAgentOpenBossBtn.textContent = "打开中";
  addLocalDbAgentLog("正在打开 GeekRun 登录页...");
  try {
    const response = await fetch("/api/db-agent/open-boss", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "打开 GeekRun 登录页失败");
    addLocalDbAgentLog(data.message || "已打开 GeekRun 登录页，请查看弹出的 Chrome 窗口。");
    addMessage("系统", data.message || "已打开 GeekRun 登录页。");
  } catch (error) {
    addLocalDbAgentLog(`打开失败：${error.message || String(error)}`);
    addMessage("错误", error.message || String(error));
  } finally {
    dbAgentOpenBossBtn.textContent = "打开 GeekRun 登录页";
    dbAgentOpenBossBtn.disabled = false;
  }
});

dbAgentCloseGeekrunBtn.addEventListener("click", async () => {
  dbAgentCloseGeekrunBtn.disabled = true;
  dbAgentCloseGeekrunBtn.textContent = "关闭中";
  addLocalDbAgentLog("正在关闭 GeekRun 浏览器...");
  try {
    const response = await fetch("/api/db-agent/close-geekrun", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "关闭 GeekRun 失败");
    addLocalDbAgentLog(data.message || "已关闭 GeekRun 浏览器。");
    addMessage("系统", data.message || "已关闭 GeekRun 浏览器。");
  } catch (error) {
    addLocalDbAgentLog(`关闭失败：${error.message || String(error)}`);
    addMessage("错误", error.message || String(error));
  } finally {
    dbAgentCloseGeekrunBtn.textContent = "关闭 GeekRun 浏览器";
    dbAgentCloseGeekrunBtn.disabled = false;
  }
});

dbAgentRequeueErrorBtn.addEventListener("click", async () => {
  dbAgentRequeueErrorBtn.disabled = true;
  try {
    const response = await fetch("/api/db-agent/requeue-errors", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "重置错误队列失败");
    addMessage("系统", data.message || `已重置 ${data.updated || 0} 家错误企业。`);
    await checkDbStatus(false);
    await refreshDbAgentStatus();
  } catch (error) {
    addMessage("错误", error.message || String(error));
  } finally {
    dbAgentRequeueErrorBtn.disabled = false;
  }
});

dbAgentStartBtn.addEventListener("click", async () => {
  const apiKey = dbAgentApiKeyInput.value.trim();
  const model = dbAgentModelInput.value.trim() || "deepseek-chat";
  localStorage.setItem("deepseek-db-agent-api-key", apiKey);
  localStorage.setItem("deepseek-db-agent-model", model);
  dbAgentStartBtn.disabled = true;
  try {
    const response = await fetch("/api/db-agent/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey,
        model,
        city: dbAgentCityInput.value.trim(),
        maxCompanies: Number(dbAgentMaxInput.value || 1),
        companyDelayMinMs: Number(dbAgentCompanyDelayMinInput.value || 0) * 1000,
        companyDelayMaxMs: Number(dbAgentCompanyDelayMaxInput.value || 0) * 1000,
        actionDelayMinMs: Number(dbAgentActionDelayMinInput.value || 0) * 1000,
        actionDelayMaxMs: Number(dbAgentActionDelayMaxInput.value || 0) * 1000,
        status: dbAgentStatusSelect.value || "new",
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "启动失败");
    addMessage("系统", data.message || "GeekRun 岗位通道已启动。");
    await refreshDbAgentStatus();
  } catch (error) {
    addMessage("错误", error.message || String(error));
  } finally {
    dbAgentStartBtn.disabled = false;
  }
});

dbAgentStopBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("/api/db-agent/stop", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "暂停失败");
    addMessage("系统", data.message || "已请求暂停 GeekRun 岗位通道。");
    await refreshDbAgentStatus();
  } catch (error) {
    addMessage("错误", error.message || String(error));
  }
});

job51AgentOpenBtn.addEventListener("click", async () => {
  job51AgentOpenBtn.disabled = true;
  job51AgentStatusEl.textContent = "正在打开前程无忧个人中心...";
  job51AgentStatusEl.className = "status-line good";
  addLocalJob51Log("正在打开个人中心");
  try {
    const response = await fetch("/api/job51-agent/open-login", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "打开前程无忧失败");
    addLocalJob51Log("个人中心已打开；若仍显示未登录，请登录后等待 3 秒");
    addMessage("系统", data.message || "已打开前程无忧页面。");
  } catch (error) {
    job51AgentStatusEl.textContent = error.message || String(error);
    job51AgentStatusEl.className = "status-line bad";
    addLocalJob51Log(`打开失败：${error.message || String(error)}`);
    addMessage("错误", error.message || String(error));
  } finally {
    job51AgentOpenBtn.disabled = false;
  }
});

job51AgentCloseBtn.addEventListener("click", async () => {
  job51AgentCloseBtn.disabled = true;
  try {
    const response = await fetch("/api/job51-agent/close-browser", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "关闭前程无忧浏览器失败");
    addMessage("系统", data.message || "已关闭前程无忧浏览器。");
  } catch (error) {
    addMessage("错误", error.message || String(error));
  } finally {
    job51AgentCloseBtn.disabled = false;
  }
});

job51AgentStartBtn.addEventListener("click", async () => {
  const settings = {
    maxCompanies: Number(job51AgentMaxInput.value || 1),
    status: job51AgentStatusSelect.value || "new",
    area: job51AgentAreaInput.value.trim() || "000000",
    companyDelayMinMs: Number(job51AgentCompanyDelayMinInput.value || 0) * 1000,
    companyDelayMaxMs: Number(job51AgentCompanyDelayMaxInput.value || 0) * 1000,
    actionDelayMinMs: Number(job51AgentActionDelayMinInput.value || 0) * 1000,
    actionDelayMaxMs: Number(job51AgentActionDelayMaxInput.value || 0) * 1000,
  };
  localStorage.setItem("deepseek-job51-agent-max", String(settings.maxCompanies));
  localStorage.setItem("deepseek-job51-agent-status-v2", settings.status);
  localStorage.setItem("deepseek-job51-agent-area", settings.area);
  localStorage.setItem("deepseek-job51-agent-company-delay-min", job51AgentCompanyDelayMinInput.value || "0");
  localStorage.setItem("deepseek-job51-agent-company-delay-max", job51AgentCompanyDelayMaxInput.value || "0");
  localStorage.setItem("deepseek-job51-agent-action-delay-min", job51AgentActionDelayMinInput.value || "0");
  localStorage.setItem("deepseek-job51-agent-action-delay-max", job51AgentActionDelayMaxInput.value || "0");
  job51AgentStartBtn.disabled = true;
  job51AgentStatusEl.textContent = "正在启动前程无忧搜索...";
  job51AgentStatusEl.className = "status-line good";
  addLocalJob51Log(`请求启动：${settings.status} 队列，${settings.maxCompanies} 家，地区 ${settings.area}`);
  try {
    const response = await fetch("/api/job51-agent/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "启动失败");
    addLocalJob51Log(data.message || "前程无忧岗位通道已启动");
    addMessage("系统", data.message || "前程无忧岗位通道已启动。");
    startJob51FastRefresh();
    await refreshJob51AgentStatus();
  } catch (error) {
    job51AgentStatusEl.textContent = error.message || String(error);
    job51AgentStatusEl.className = "status-line bad";
    addLocalJob51Log(`启动失败：${error.message || String(error)}`);
    addMessage("错误", error.message || String(error));
  } finally {
    await refreshJob51AgentStatus();
  }
});

job51AgentStopBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("/api/job51-agent/stop", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "暂停失败");
    addMessage("系统", data.message || "已请求暂停前程无忧岗位通道。");
    await refreshJob51AgentStatus();
  } catch (error) {
    addMessage("错误", error.message || String(error));
  }
});

jobScreenStartBtn.addEventListener("click", async () => {
  const apiKey = jobScreenApiKeyInput.value.trim() || apiKeyInput.value.trim() || dbAgentApiKeyInput.value.trim();
  const model = jobScreenModelInput.value.trim() || "deepseek-chat";
  const instruction = jobScreenInstructionInput.value.trim();
  if (!apiKey) {
    addMessage("错误", "请先填写顶部浏览器 API Key，或在筛选岗位里填写 API Key。");
    return;
  }
  if (!jobScreenApiKeyInput.value.trim()) {
    jobScreenApiKeyInput.value = apiKey;
  }
  localStorage.setItem("deepseek-job-screen-api-key", apiKey);
  localStorage.setItem("deepseek-job-screen-model", model);
  localStorage.setItem("deepseek-job-screen-batch-size", jobScreenBatchSizeInput.value || "100");
  localStorage.setItem("deepseek-job-screen-instruction", instruction);
  localStorage.setItem("deepseek-job-screen-rescreen-all", jobScreenRescreenAllInput.checked ? "true" : "false");
  jobScreenStartBtn.disabled = true;
  if (jobScreenRescreenAllInput.checked) {
    jobResultsStatusInput.value = "screened";
    localStorage.setItem("deepseek-job-results-status", "screened");
    jobResultsSummaryEl.className = "status-line";
    jobResultsSummaryEl.textContent = "正在清空旧筛选结果，并按当前要求重新筛选...";
    jobResultsListEl.innerHTML = "";
  }
  try {
    const response = await fetch("/api/job-screen/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey,
        model,
        instruction,
        batchSize: Number(jobScreenBatchSizeInput.value || 100),
        rescreenAll: jobScreenRescreenAllInput.checked,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "启动岗位筛选失败");
    addMessage("系统", data.message || "搜索后岗位筛选通道已启动。");
    jobResultsStatusInput.value = "screened";
    localStorage.setItem("deepseek-job-results-status", "screened");
    selectView("results");
    await refreshJobScreenStatus();
    await refreshJobResults(false);
  } catch (error) {
    addMessage("错误", error.message || String(error));
  } finally {
    jobScreenStartBtn.disabled = false;
  }
});

jobScreenStopBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("/api/job-screen/stop", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "暂停岗位筛选失败");
    addMessage("系统", data.message || "已请求暂停岗位筛选。");
    await refreshJobScreenStatus();
  } catch (error) {
    addMessage("错误", error.message || String(error));
  }
});

jobScreenResetBtn.addEventListener("click", async () => {
  jobScreenResetBtn.disabled = true;
  try {
    const response = await fetch("/api/job-screen/reset", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "重置岗位筛选失败");
    addMessage("系统", data.message || `已重置 ${data.updated || 0} 条岗位。`);
    jobResultsStatusInput.value = "screened";
    localStorage.setItem("deepseek-job-results-status", "screened");
    await checkDbStatus(false);
    await refreshJobScreenStatus();
    await refreshJobResults(false);
  } catch (error) {
    addMessage("错误", error.message || String(error));
  } finally {
    jobScreenResetBtn.disabled = false;
  }
});

interviewAnalyzeBtn.addEventListener("click", async () => {
  const apiKey = apiKeyInput.value.trim() || dbAgentApiKeyInput.value.trim() || jobScreenApiKeyInput.value.trim();
  const model = interviewModelInput.value.trim() || modelInput.value.trim() || "deepseek-chat";
  const resumeText = interviewResumeTextInput.value.trim();
  const jobText = interviewJobTextInput.value.trim();
  const extraInfo = interviewExtraInfoInput.value.trim();
  if (!apiKey) {
    setInterviewStatus("请先填写顶部浏览器 API Key", "bad");
    return;
  }
  if (!resumeText && !interviewResumeFilesInput.files.length) {
    setInterviewStatus("请粘贴或上传简历", "bad");
    return;
  }
  if (!jobText && !interviewJobFilesInput.files.length) {
    setInterviewStatus("请粘贴或上传目标岗位", "bad");
    return;
  }

  interviewAnalyzeBtn.disabled = true;
  setInterviewStatus("正在读取文件并生成报告...", "good");
  renderInterviewFileNotes([]);
  try {
    const [resumeFiles, jobFiles] = await Promise.all([
      prepareInterviewFiles(interviewResumeFilesInput),
      prepareInterviewFiles(interviewJobFilesInput),
    ]);
    const response = await fetch("/api/interview-report/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey,
        model,
        resumeText,
        jobText,
        extraInfo,
        resumeFiles,
        jobFiles,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "生成面试报告失败");
    localStorage.setItem("deepseek-api-key", apiKey);
    localStorage.setItem("deepseek-interview-model", model);
    localStorage.setItem("deepseek-interview-report", data.report || "");
    renderInterviewFileNotes(data.fileNotes || []);
    renderInterviewReport(data.report || "");
    setInterviewStatus("面试报告已生成", "good");
    addMessage("系统", "面试报告已生成。");
  } catch (error) {
    setInterviewStatus(error.message || String(error), "bad");
    addMessage("错误", error.message || String(error));
  } finally {
    interviewAnalyzeBtn.disabled = false;
  }
});

interviewClearBtn.addEventListener("click", () => {
  interviewResumeTextInput.value = "";
  interviewJobTextInput.value = "";
  interviewExtraInfoInput.value = "";
  interviewResumeFilesInput.value = "";
  interviewJobFilesInput.value = "";
  localStorage.removeItem("deepseek-interview-resume-text");
  localStorage.removeItem("deepseek-interview-job-text");
  localStorage.removeItem("deepseek-interview-extra-info");
  localStorage.removeItem("deepseek-interview-report");
  renderInterviewFileNotes([]);
  renderInterviewReport("");
  setInterviewStatus("已清空，等待上传简历和岗位");
});

autoIngestInput.addEventListener("change", async () => {
  try {
    const response = await fetch("/api/download-ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: autoIngestInput.checked ? "start" : "stop", sessionId: ensureSessionId() }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "设置失败");
    addMessage("系统", autoIngestInput.checked ? `已开启自动入库。原始下载目录：${data.downloadsDir}；本任务目录：${data.taskDownloadsDir}` : "已关闭自动入库。");
  } catch (error) {
    autoIngestInput.checked = !autoIngestInput.checked;
    addMessage("错误", error.message || String(error));
  }
});

closeTabsBtn.addEventListener("click", async () => {
  closeTabsBtn.disabled = true;
  closeTabsBtn.textContent = "关闭中";
  try {
    const response = await fetch("/api/close-tabs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ keepActive: true }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "关闭失败");
    addMessage("系统", data.message || `已关闭 ${data.closed || 0} 个标签页。`);
  } catch (error) {
    addMessage("错误", error.message || String(error));
  } finally {
    closeTabsBtn.textContent = "关闭多余标签";
    closeTabsBtn.disabled = isBusy;
  }
});

resetBtn.addEventListener("click", async () => {
  await fetch("/api/reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId }),
  }).catch(() => {});
  sessionId = "";
  localStorage.removeItem("deepseek-bb-session");
  autoIngestInput.checked = false;
  messages.innerHTML = "";
  renderEmpty();
});

cancelBtn.addEventListener("click", async () => {
  if (!sessionId) return;
  cancelBtn.disabled = true;
  cancelBtn.textContent = "暂停中";
  try {
    const response = await fetch("/api/cancel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const data = await response.json();
    addMessage("系统", data.message || "已发送暂停信号。");
  } catch (error) {
    addMessage("错误", error.message || String(error));
  } finally {
    cancelBtn.textContent = "暂停执行";
  }
});

document.querySelectorAll(".example").forEach((button) => {
  button.addEventListener("click", () => {
    promptInput.value = button.textContent.trim();
    promptInput.focus();
  });
});

boot();
