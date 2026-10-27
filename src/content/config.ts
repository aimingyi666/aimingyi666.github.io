// 内容模型：笔记与文章共用一个集合，靠 genre 区分体裁
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),

    // 成熟度：三档。刚起头不发布，构建时会过滤掉。
    maturity: z.enum(['seedling', 'budding', 'evergreen']).default('seedling'),

    // 体裁：决定读者预期，也决定页面上显示哪个标签
    genre: z.enum(['note', 'longform', 'manual', 'debug', 'log']).default('note'),

    // 归属：都没有时，文章直接挂专栏（旁路 A）
    column: z.string().optional(),
    collection: z.string().optional(),
    order: z.number().optional(), // 在专题内的序号

    // 时间
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),

    // 摘要
    summary: z.string().optional(),

    // 标签：最多 3 个，构建时会校验
    tags: z.array(z.string()).max(3).default([]),

    // 出链：指向其他笔记的 slug
    links: z.array(z.string()).default([]),

    // 手册类专用
    source: z.object({
      url: z.string().optional(),
      author: z.string().optional(),
      license: z.string().optional(),
      change: z.string().optional(), // 我的改动
    }).optional(),

    // 验证状态：必须和环境一起出现
    verified: z.object({
      status: z.enum(['tested', 'untested', 'expired']),
      env: z.string().optional(), // 实测时必填
      date: z.coerce.date().optional(),
    }).optional(),

    // 工具库条目专用
    task: z.enum([
      'install', 'deploy', 'backup', 'debug', 'cleanup', 'batch',
    ]).optional(),
    risk: z.enum(['safe', 'backup', 'danger']).optional(),

    // 草稿：直接跳过构建
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
