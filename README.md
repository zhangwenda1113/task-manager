# 智能任务管理系统

Node.js（Next.js）+ React + Supabase 的任务管理系统，配套《练习二：智能任务管理系统-开发部署操作手册》使用。

## 功能

- 输入框 + 优先级下拉（高 / 中 / 低）添加任务，回车即可提交
- 任务列表按创建时间倒序显示，展示标题、优先级、创建时间、完成状态
- 每条任务：圆形勾选、「完成 / 未完成」切换按钮、「删除」按钮
- 按优先级筛选：全部 / 高 / 中 / 低（带各优先级数量）
- 已完成任务标题加删除线并置灰
- 顶部待办 / 已完成统计与完成度进度条
- 输入时命中「紧急」「尽快」「今天」等词，自动建议优先级

## 技术栈

| 层 | 选型 |
| --- | --- |
| 前端 | React 18（Next.js App Router，中文界面） |
| 后端 | Node.js（Next.js API Routes，`/api/tasks`） |
| 数据库 | Supabase（PostgreSQL，`@supabase/supabase-js` 走 REST API） |
| 部署 | Vercel |

## 目录结构

```
智能任务管理系统/
├── app/
│   ├── page.jsx                 # 主页面（状态与请求编排）
│   ├── layout.jsx               # 页面骨架
│   ├── globals.css              # 样式
│   ├── icon.svg                 # 站点图标
│   └── api/
│       ├── tasks/route.js       # GET 列表 / POST 新增
│       ├── tasks/[id]/route.js  # PATCH 切换完成 / DELETE 删除
│       └── health/route.js      # 当前数据源（supabase / local）
├── components/
│   ├── TaskComposer.jsx         # 输入框 + 优先级 + 智能提示
│   ├── FilterBar.jsx            # 优先级筛选
│   └── TaskItem.jsx             # 单条任务
├── lib/
│   ├── priority.js              # 优先级常量与校验
│   ├── smart.js                 # 智能优先级规则
│   ├── format.js                # 时间格式化
│   └── store.js                 # 数据访问层（Supabase / 本地降级）
├── supabase/schema.sql          # 建表 + RLS 策略
├── .env.example                 # 环境变量模板
└── package.json
```

## 一、本地运行

```bash
npm install
cp .env.example .env.local    # Windows：copy .env.example .env.local
npm run dev                   # 打开 http://localhost:3000
```

`.env.local` 里填 Supabase 的 `SUPABASE_URL` 与 `SUPABASE_ANON_KEY`。
**没填也能跑**：会自动使用本地 `data/tasks.json` 存储，方便先看界面、跑通功能；填好后就走云端数据库。

## 二、创建 Supabase 数据库

1. 登录 <https://supabase.com> → **New Project**（Name：`task-manager`，Region：`Southeast Asia (Singapore)`），等状态变为 Active。
2. 左侧 **SQL Editor** → New query，粘贴 `supabase/schema.sql` 全文 → **Run**，看到 `Success. No rows returned`。
3. **Project Settings → API Keys**，复制 `Project URL` 与 `Publishable key`（`sb_publishable_...`）。
   ⚠️ `sb_secret_...` 是保密密钥，不要复制、不要提交到 GitHub。

表结构：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | bigint 自增主键 | 任务唯一编号 |
| title | text | 任务标题 |
| priority | text，只能是「高 / 中 / 低」 | 优先级 |
| completed | boolean，默认 false | 是否完成 |
| created_at | timestamptz，默认 now() | 创建时间（用于倒序） |

`schema.sql` 同时创建了四条 RLS 策略（允许匿名读写），**不做这一步写入会被 RLS 拦截**。

## 三、上传到 GitHub

```bash
git init
git add .
git commit -m "init: 智能任务管理系统"
git remote add origin https://github.com/你的用户名/task-manager.git
git branch -M main
git push -u origin main
```

`.env` / `.env.local` 已在 `.gitignore` 中，不会进仓库（可在 GitHub 页面确认）。

## 四、Vercel 部署

1. Vercel → **Add New → Project** → 导入 `task-manager` 仓库（Vercel 自动识别 Next.js，无需改构建配置）。
2. 在 Environment Variables 中添加（生产 / Preview 都勾选）：

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | `https://你的项目ID.supabase.co` |
| `SUPABASE_ANON_KEY` | `sb_publishable_你的key` |

3. **Deploy**，1～3 分钟得到 `https://task-manager-xxx.vercel.app`。
4. 打开网址测试：添加任务 → 回 Supabase Table Editor 能看到新数据 → 刷新页面数据还在。

## 五、绑定域名

在 Vercel 项目 → **Settings → Domains** 添加域名（格式：姓名拼音 + 序号，例如 `zhangsan1.rangzijigenghao.online`），Vercel 会给出需要添加的 DNS 记录：

- `CNAME`：记录名填子域名前缀，值填 Vercel 给出的 `cname.vercel-dns.com`
- `TXT`：按 Vercel 给出的 `_vercel` 验证记录原样填写

两条记录生效后，回到 Vercel 点 **Verify / Refresh**，状态变为 Valid 即可访问。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/tasks?priority=全部\|高\|中\|低` | 任务列表，按创建时间倒序 |
| POST | `/api/tasks` | 新增，body：`{ "title": "写周报", "priority": "高" }` |
| PATCH | `/api/tasks/:id` | 切换完成，body：`{ "completed": true }` |
| DELETE | `/api/tasks/:id` | 删除 |
| GET | `/api/health` | 当前数据源（`supabase` / `local`） |

响应统一为 `{ "ok": true, "data": ... }`，出错为 `{ "ok": false, "message": "..." }`。

## 常见问题

- **`new row violates row-level security policy`**：RLS 策略没开全，重跑 `schema.sql` 中四条 policy。
- **`relation "tasks" does not exist`**：建表 SQL 没执行成功，重跑建表部分。
- **Vercel 上能打开但没有数据 / 报错**：检查环境变量名是否写错（必须是 `SUPABASE_URL`、`SUPABASE_ANON_KEY`），改完要 Redeploy。
- **本地能看到数据，Vercel 看不到**：两边连的不是同一个 Supabase 项目，核对 URL 中的项目 ID。
- **密钥泄露**：立刻在 Supabase 轮换 key，删掉仓库里的 `.env`，重新 push。
