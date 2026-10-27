// 站点的结构性数据：专栏、专题、体裁与状态的展示文案
// 这些是"配置"，不是"内容"——内容在 src/content/notes/ 里

/** 部署子路径（base）。根域部署时为 '/'；GitHub Pages 项目页为 '/<repo>/'。
 *  所有内部链接都必须过 withBase()，否则项目子路径下会 404。 */
export const BASE = import.meta.env.BASE_URL || '/';
export function withBase(path: string): string {
  if (!path.startsWith('/')) return path;
  return BASE.replace(/\/$/, '') + path;
}

export const SITE = {
  name: '慢变量',
  tagline: '个人知识库 · 笔记 · 工具库',
  description:
    '个人技术知识库：原子笔记互相链接、收成专题，另有按任务索引的工具库。讲清方案成立的条件与失效边界。',
  email: 'hi@manbianliang.com',
  url: 'https://manbianliang.com',
};

/** 专栏：长期方向，平级无主次 */
export const COLUMNS = [
  { slug: 'ai-engineering', name: 'AI 工程落地', desc: '推理服务化、RAG、评测、Agent 编排、可观测性、成本' },
  { slug: 'ai-toolchain', name: 'AI 工具链', desc: 'Claude Code / CCSwitch / WorkBuddy / MCP / 本地模型 / 网络代理' },
  { slug: 'engineering', name: '工程基本功', desc: 'Python 工程化、容器与编排、系统设计、可观测性基础' },
  { slug: 'career', name: '技术成长', desc: 'FDE 能力地图、技能路线、转型复盘' },
  { slug: 'troubleshooting', name: '踩坑与排障', desc: '单个故障的完整定位过程' },
];

/** 专题：有导言的 MOC，给出一条阅读顺序 */
export const COLLECTIONS = [
  {
    slug: 'vllm-single-node',
    name: 'vLLM 单机推理：从跑通到跑稳',
    column: 'ai-engineering',
    maturity: 'budding',
    plan: 5,
    intro:
      '跑通一个接口只要十分钟。跑稳要理解批处理、显存管理与 KV cache 三件事。这个专题按这三层拆开，每篇给一个可量化的基线——读完你应该能独立部署一个稳定的推理服务。',
    hint: '每一篇都建立在前一篇的基础上，跳读会缺一块',
    next: [
      { slug: 'gpu-topology', name: 'GPU 节点与拓扑感知调度', meta: '4 篇 · 工程基本功' },
      { slug: 'agent-orchestration', name: 'Agent 编排：熔断、重试与幂等', meta: '4 篇 · AI 工程落地' },
    ],
  },
  {
    slug: 'rag-baseline',
    name: 'RAG 的召回率与幻觉率基线',
    column: 'ai-engineering',
    maturity: 'budding',
    plan: 4,
    intro:
      '没有 golden set 的 RAG 优化都是猜。先建离线评测集，再谈召回、重排与提示词工程。',
    hint: '先建基线，再谈优化——顺序反了会白做',
    next: [],
  },
  {
    slug: 'agent-orchestration',
    name: 'Agent 编排：熔断、重试与幂等',
    column: 'ai-engineering',
    maturity: 'budding',
    plan: 4,
    intro:
      '多步 Agent 的失败是必然的。这个专题讲清楚在哪一步熔断、怎么重试、为什么工具必须幂等。',
    hint: '按「先止损、再重试、后去重」的顺序读',
    next: [],
  },
  {
    slug: 'claude-code-ccswitch',
    name: 'Claude Code 与 CCSwitch 配置',
    column: 'ai-toolchain',
    maturity: 'evergreen',
    plan: 4,
    intro:
      '多模型切换、代理与权限边界。一套可迁移的本地开发工作流，含完整配置与踩坑记录。',
    hint: '每篇都可以单独看，不必按顺序',
    next: [],
  },
  {
    slug: 'gpu-topology',
    name: 'GPU 节点与拓扑感知调度',
    column: 'engineering',
    maturity: 'budding',
    plan: 4,
    intro:
      '显存够、算力够，吞吐还是上不去——问题常在跨 NUMA 访存与调度亲和。',
    hint: '先量出跨 NUMA 的比例，再决定要不要上拓扑感知',
    next: [],
  },
];

/** 工具库的任务分类：顶层必须是动词 */
export const TASKS = [
  { slug: 'install', name: '安装与配置' },
  { slug: 'deploy', name: '部署与上线' },
  { slug: 'backup', name: '备份与迁移' },
  { slug: 'debug', name: '故障排查' },
  { slug: 'cleanup', name: '清理与回收' },
  { slug: 'batch', name: '批量处理' },
];

/** 状态的展示文案 —— 渲染层只查这里，不硬编码中文 */
export const MATURITY_LABEL = {
  seedling: { text: '刚起头', cls: 'chip--seedling', publish: false },
  budding: { text: '生长中', cls: 'chip--budding', publish: true },
  evergreen: { text: '已成体系', cls: 'chip--evergreen', publish: true },
};

export const GENRE_LABEL = {
  note: '笔记',
  longform: '长文',
  manual: '手册',
  debug: '排障',
  log: '日志',
};

export const RISK_LABEL = {
  safe: { text: '安全', cls: 'risk--safe' },
  backup: { text: '需备份', cls: 'risk--backup' },
  danger: { text: '破坏性', cls: 'risk--danger' },
};

export const VERIFY_LABEL = {
  tested: '实测通过',
  untested: '未实测',
  expired: '已失效',
};

/** 取专栏名 */
export function columnName(slug) {
  const c = COLUMNS.find((x) => x.slug === slug);
  return c ? c.name : slug;
}

/** 取专题对象 */
export function collectionBySlug(slug) {
  return COLLECTIONS.find((x) => x.slug === slug);
}
