# 慢变量 · 站点使用说明

Astro 静态站。内容用 Markdown 写，构建后是一叠纯静态 HTML，可以直接托管到任意静态服务或 GitHub Pages。

---

## 日常三件事

```bash
npm run dev      # 本地写作预览，带热更新（http://localhost:4321）
npm run new      # 新建一篇文章（交互式，自动生成 frontmatter）
npm run check    # 构建 + 链接审计（发布前必跑）
```

**第一次加文章？看 [`怎么加文章.md`](./怎么加文章.md)** —— 三种方式、每个字段的含义、常见错误都在里面。

---

## 部署到 GitHub Pages

构建产物 `dist/` 是纯静态文件，可以直接上 GitHub Pages。仓库里已经配好 `.github/workflows/deploy.yml`：**push 到 `main` 就自动构建并发布**，不用本地手动传文件。

### 两种 Pages 形态，工作流自动适配

| 仓库类型 | 例子 | 站点地址 | `base` |
|---|---|---|---|
| 用户页（仓库名 `<user>.github.io`） | `aimingyi666.github.io` | `https://aimingyi666.github.io/` | 自动留空（根路径） |
| 项目页（其他名字） | `slow-variable` | `https://<user>.github.io/slow-variable/` | 自动设为 `/<repo>/` |

**不用手动改任何 `base`**：工作流按仓库名判断——用户页仓库名以 `.github.io` 结尾就留空，否则取仓库名当子路径。所有页面链接、CSS/JS 资源、搜索索引、RSS 都会自动带上对应前缀（或根路径不加）。

### 启用步骤

1. 把这个仓库推到 GitHub。工作流会按仓库名自动判断 `base`：只有仓库名严格等于 `<owner>.github.io` 才当用户页（根路径），其余都当项目页带 `/<repo>/` 前缀（例如本仓库 `Aaron-AiMingYi.github.io` 在 owner `aimingyi666` 下是项目页，地址 `https://aimingyi666.github.io/Aaron-AiMingYi.github.io/`）。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。
3. 之后每次 `git push` 到 `main`，Actions 自动跑：安装依赖 → 构建 → 链接审计 → 发布。

### 自定义域名

如果要用自己的域名（而非 `*.github.io`），在仓库 **Settings → Pages → Custom domain** 填域名并配好 DNS 即可。`ASTRO_SITE` 仍用默认的 `https://<owner>.github.io`，GitHub Pages 会把根域请求映射到你的自定义域名，无需改 `base`、也无需改工作流。

### 本地构建验证

```bash
npm run build                            # 普通构建（base 由 ASTRO_BASE 决定，默认空）
ASTRO_BASE=/slow-variable/ npm run build # 模拟项目页构建，验证前缀是否正确
npm run check                            # 构建 + 链接审计（发布前必跑）
```

> 本地 `npm run dev` 不受 `base` 影响，照常 `http://localhost:4321` 预览。

---

## 写一篇新内容

在 `src/content/notes/` 下新建 `.md` 文件，文件名就是 URL 的最后一段。

```markdown
---
title: 标题写成陈述句
maturity: budding        # seedling | budding | evergreen
genre: note              # note | longform | manual | debug | log
column: ai-engineering   # 必填，决定它属于哪个专栏
collection: vllm-single-node   # 可选，填了就挂到专题下
order: 2                 # 可选，专题内的顺序
date: 2026-10-27
summary: 一句话摘要，列表页和 SEO 都用它
tags: [显存, vLLM]        # 最多 3 个
links: [vllm-kv-cache]   # 出链：指向其他笔记的 slug
---

正文用 Markdown 写，代码块用三个反引号加语言名。
```

### 三种位置，由 frontmatter 决定

| 你填了什么 | 内容会出现在哪 |
|---|---|
| `collection: xxx` | `/collections/xxx/{文件名}/` — 挂在专题下 |
| 只有 `column: xxx` | `/columns/xxx/{文件名}/` — **旁路 A：不进专题的散篇** |
| `genre: log` | `/log/{文件名}/` — **旁路 B：日志，不进专栏也不进专题** |

这三条路都由 `urlFor()` 一处决定，页面和链接不会对不上。

---

## 三条被代码强制的规则

这三条不是"约定"，是构建会拦下来的硬约束：

### 1. 成熟度为 `seedling` 的内容不会生成页面

`src/data/content.ts` 的 `published()` 会过滤掉它。写了一半的东西可以安全地留在仓库里，不会泄漏到线上。

### 2. 「实测通过」必须带环境

```yaml
verified:
  status: tested
  env: macOS 14.5 / git 2.42        # ← 缺这行，构建直接失败
  date: 2026-10-27
```

报错信息：`[验证状态] status="tested" 时必须提供 env`

### 3. 标签最多 3 个

schema 里 `z.array(z.string()).max(3)`，超了构建失败。

---

## 订阅：为什么没有后端

这个站刻意不带服务器。所以「邮件订阅」目前**没有接通**——页面上不会出现一个点了没反应的按钮，而是明确写「邮件订阅还没接通」，并引导到 RSS。

要真正接通，改一个文件：`src/data/subscribe.ts`

```ts
export const SUBSCRIBE = {
  mode: 'none',        // 改成 'formspree' 或 'buttondown'
  endpoint: '',        // 填服务商给的地址
  thankyou: '/subscribed/',
};
```

支持两种，都不需要自己维护服务器：

| 模式 | 服务 | 免费额度 | 注册地址 |
|---|---|---|---|
| `formspree` | Formspree | 50 条/月 | formspree.io |
| `buttondown` | Buttondown | 100 订阅者 | buttondown.email |

改完重建，页面会自动从「还没接通」切换成真实表单，`/subscribed/` 也会成为提交后的落地页。

**为什么不自己写后端**：存邮箱意味着要做数据库、防滥用、退订管理、隐私合规。这些都是长期负担，而收益只是一个订阅者列表——第三方服务免费额度就够用。

---

## 手册类内容（工具库）

工具库条目 = `genre: manual` + 有 `risk` 字段。

```yaml
genre: manual
task: debug          # install | deploy | backup | debug | cleanup | batch
risk: safe           # safe | backup | danger
source:
  url: https://...
  author: NVIDIA
  license: 官方文档
  change: 仅记录命令，未改写
verified:
  status: tested
  env: Ubuntu 22.04 / nvidia-smi 535.129
  date: 2026-10-20
```

`risk: danger` 会在页面上自动加一条红色警示行，且页面头部的命令块表头变暗红。

---

## 加一个新专题

改 `src/data/site.ts` 里的 `COLLECTIONS` 数组：

```ts
{
  slug: 'gpu-topology',
  name: 'GPU 节点与拓扑感知调度',
  column: 'engineering',
  maturity: 'budding',
  plan: 4,
  intro: '这个专题解决什么问题……',
  hint: '按什么顺序读',
  next: [],          // 读完之后推荐的专题
}
```

加完重建，专题索引页、专栏页、首页卡片会自动出现它。

## 加一个新专栏

改 `site.ts` 里的 `COLUMNS`，同上。

---

## 目录结构

```
src/
├── content/notes/          ← 所有内容都在这（Markdown）
├── content/config.ts       ← 内容字段的 schema 与校验
├── data/
│   ├── site.ts             ← 专栏、专题、任务、状态文案
│   └── content.ts          ← 查询层（过滤 seedling、算 url）
├── layouts/Base.astro      ← header / footer / drawer，只定义一次
├── components/             ← Chip / CodeBlock / RiskBadge / VerifyLine / ...
├── pages/
│   ├── index.astro                     首页
│   ├── [...path].astro                 详情页（文章/笔记/手册/日志共用）
│   ├── columns/[slug].astro            专栏详情
│   ├── collections/[slug]/index.astro  专题详情
│   ├── notes/index.astro               笔记列表
│   ├── toolbox/index.astro             工具库
│   ├── log/index.astro                 日志
│   ├── about/index.astro               关于
│   └── rss.xml.ts                      RSS
└── styles/                 ← tokens → base → components → content → toolbox
```

**改样式先改 `tokens.css`。** 组件层不允许出现硬编码色值（`npm run check` 之外可以手动 grep 一下）。

---

## 与 Obsidian 的关系

Obsidian 负责**写**，这个站负责**发布**。

推荐做法：把 `src/content/notes/` 作为 Obsidian vault 的一部分（或软链接进去），写的时候直接在 Obsidian 里写，frontmatter 用模板插入。构建时自动读取。

**不要在网站上重搭一遍知识结构**，否则你会同时维护两份链接关系。

---

## 待办

- [x] 搜索（构建时生成索引 + 客户端匹配，零后端）
- [x] 标签聚合页（按热度分组 + 相关标签共现）
- [x] 订阅：诚实的 RSS 引导 + 可切换的第三方适配层
- [ ] 图谱页（只读全站概览，优先级最低）
- [ ] 间距归一化（`设计规范.md` 里列的 6 个非阶梯值）
