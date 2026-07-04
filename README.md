# 求助好帮手

求助好帮手是一套本地运行的招聘自动化工作台，面向需要批量整理企业、检索岗位、筛选机会和做求职风险背调的个人使用场景。

它把浏览器控制、大模型分析、企业名单数据库、下载文件入库和岗位筛选放在一个网页控制台里，尽量把重复的搜索、记录、归类工作交给自动化流程处理。

## 主要功能

- 企业名单管理：导入 CSV/TSV/XLSX 企业名单，统一写入 PostgreSQL。
- 招聘搜索辅助：调用 BOSS、前程无忧等通道检索企业近期岗位。
- 岗位筛选：用大模型根据岗位信息和自定义规则做初筛。
- 企业背调：结合下载的天眼查等报告，生成求职风险分析。
- 面试报告：根据简历和目标岗位生成面试通过策略报告。
- 浏览器指令：通过 bb-browser 控制本机 Chrome 完成网页查询和信息提取。
- 下载入库：扫描下载目录，把任务相关文件复制到本地任务目录并记录元数据。

## 最新更新

- 新增“面试报告”工作区：支持粘贴或上传简历、目标岗位 JD，并生成岗位解读、匹配度评分、面试策略、高频问题、简历修改建议和 7 天准备计划。
- “找岗位”页新增企业名单导入入口，可以在岗位搜索前直接导入企业名单。
- 企业名单解析增强：CSV/XLSX 支持无表头名单，并在缺少 `openpyxl` 时提供基础 XLSX 解析能力。
- 前程无忧通道默认处理数量调整为 50 家。

## 隐私与安全

- 项目默认只在本机运行，不内置任何真实 API Key。
- API Key 默认保存在浏览器 localStorage，不写入仓库。
- `tasks/`、`uploads/`、日志、下载副本、依赖目录、本地配置和数据库文件都已在 `.gitignore` 中排除。
- 不要把真实 Cookie、简历、下载报告、任务对话、企业数据库或 `.env` 文件提交到 Git。

## 环境要求

- Node.js 18 或更高版本
- Docker 或 OrbStack
- PostgreSQL + pgvector（可通过本项目的 `docker-compose.yml` 启动）
- 可选：bb-browser、GeekRun、本机 Chrome

## 配置

复制示例配置：

```bash
cp .env.example .env
```

按需修改 `.env`：

```bash
PORT=8787
BB_BROWSER=bb-browser
GEEKRUN_DIR=./vendor/geekrun
POSTGRES_PASSWORD=change-me
DATABASE_URL=postgres://deepseek:change-me@127.0.0.1:5432/deepseek_bb
```

`start.sh`、`start.command` 和 `start-db.sh` 会自动加载 `.env`。

## 启动

安装依赖：

```bash
npm install
```

启动数据库：

```bash
./start-db.sh
```

启动工作台：

```bash
./start.sh
```

打开：

```text
http://127.0.0.1:8787
```
