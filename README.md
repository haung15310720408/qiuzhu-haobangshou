# 求助好帮手

求助好帮手是一套本地运行的招聘自动化工作台，面向需要批量整理企业、检索岗位、筛选机会和做求职风险背调的个人使用场景。

它把浏览器控制、大模型分析、企业名单数据库、下载文件入库和岗位筛选放在一个网页控制台里，尽量把重复的搜索、记录、归类工作交给自动化流程处理。

## 主要功能

- 企业名单管理：导入 CSV/TSV/XLSX 企业名单，统一写入 PostgreSQL。
- 招聘搜索辅助：调用 BOSS、前程无忧等通道检索企业近期岗位。
- 岗位筛选：用大模型根据岗位信息和自定义规则做初筛。
- 企业背调：结合下载的天眼查等报告，生成求职风险分析。
- 浏览器指令：通过 bb-browser 控制本机 Chrome 完成网页查询和信息提取。
- 下载入库：扫描下载目录，把任务相关文件复制到本地任务目录并记录元数据。

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

## 基本流程

1. 启动数据库和工作台。
2. 在页面点击“初始化数据库”。
3. 导入企业名单。
4. 使用“找岗位”工作区批量搜索岗位。
5. 使用“筛选岗位”工作区做大模型初筛。
6. 在“看结果”里查看合适、可考虑或不合适的岗位。
7. 对重点企业使用“企业背调”分析求职风险。

## 企业名单表头

支持常见表头：

```text
企业名称 / 公司名称 / 单位名称 / name / company
省份 / 城市 / 地区 / 行业 / 官网 / 备注
```

## 常用浏览器指令

```text
检查浏览器状态
查看当前页面标题和 URL
从数据库取 10 家 new 状态企业，逐个搜索它们是否还招人，找到岗位就写入数据库并加备注
请用 db_claim_next_company 领取下一家企业，只处理这一家。处理完后停止，不要继续领取下一家。
```

## 运行数据

运行时可能生成：

- `tasks/<taskId>/conversation.jsonl`
- `tasks/<taskId>/downloads/`
- `server.log` / `server.err.log`
- `uploads/`

这些内容可能包含个人信息、下载文件、企业记录或模型上下文，默认不会提交到仓库。
