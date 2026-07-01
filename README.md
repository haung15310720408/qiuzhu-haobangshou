# 求助好帮手

本地招聘自动化工作台：通过 DeepSeek、Ark、bb-browser、GeekRun 和 PostgreSQL 辅助企业招聘搜索、岗位筛选、下载文件入库与企业背调。

## 隐私说明

- 不要把真实 API Key、Cookie、简历、下载文件、任务对话或数据库数据提交到 Git。
- 页面里的 Key 默认只保存在浏览器 localStorage，不应写入仓库。
- `tasks/`、`uploads/`、日志、下载副本、依赖目录和本地配置都已在 `.gitignore` 中排除。

## 准备

```bash
cp .env.example .env
```

按需在 `.env` 中配置：

- `BB_BROWSER`：bb-browser 可执行文件路径，或确保 `bb-browser` 在 `PATH` 中。
- `GEEKRUN_DIR`：GeekRun 项目目录。
- `DATABASE_URL`：PostgreSQL 连接串。
- `POSTGRES_PASSWORD`：本地 Docker 数据库密码。

`start.sh`、`start.command` 和 `start-db.sh` 会自动加载 `.env`。

## 启动

先启动数据库：

```bash
./start-db.sh
```

再启动控制台：

```bash
./start.sh
```

打开：

```text
http://127.0.0.1:8787
```

## 招聘数据库流程

1. 启动 Docker/OrbStack。
2. 运行 `./start-db.sh` 启动 PostgreSQL + pgvector。
3. 打开控制台，点击“初始化数据库”。
4. 导入企业名单 CSV/TSV/XLSX。
5. 在页面里使用“找岗位”“筛选岗位”“看结果”等工作区。

企业名单支持常见表头：

```text
企业名称 / 公司名称 / 单位名称 / name / company
省份 / 城市 / 地区 / 行业 / 官网 / 备注
```

## 常用指令

```text
检查浏览器状态
查看当前页面标题和 URL
从数据库取 10 家 new 状态企业，逐个搜索它们是否还招人，找到岗位就写入数据库并加备注
请用 db_claim_next_company 领取下一家企业，只处理这一家。处理完后停止，不要继续领取下一家。
```

## 运行数据

运行时会生成：

- `tasks/<taskId>/conversation.jsonl`
- `tasks/<taskId>/downloads/`
- `server.log` / `server.err.log`
- `uploads/`

这些内容可能包含个人信息、下载文件、企业记录或模型上下文，默认不会提交到仓库。
