// 标签聚合
// 关键：标签必须从 published() 里取，不能从全量内容取。
// 否则 seedling 笔记的独有标签会出现在标签云里，点进去是 404。

import { published, linkFor, type Note } from './content';
import { GENRE_LABEL, columnName } from './site';

export interface TagInfo {
  name: string;      // 显示名，如「显存」
  slug: string;      // URL 段，中文直接用原文，构建时编码
  count: number;
  notes: Note[];
}

/** 全部标签，按出现次数降序、同频按名称排序 */
export async function allTags(): Promise<TagInfo[]> {
  const items = await published();
  const map = new Map<string, Note[]>();

  for (const n of items) {
    for (const t of n.data.tags) {
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(n);
    }
  }

  return [...map.entries()]
    .map(([name, notes]) => ({
      name,
      slug: name,
      count: notes.length,
      notes: notes.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'));
}

/** 单个标签 */
export async function tagInfo(slug: string): Promise<TagInfo | null> {
  const list = await allTags();
  return list.find((t) => t.slug === slug) ?? null;
}

/** 标签之间的共现：给我跟它一起出现最多的几个 */
export async function relatedTags(slug: string, limit = 5): Promise<TagInfo[]> {
  const all = await allTags();
  const self = all.find((t) => t.slug === slug);
  if (!self) return [];

  const co = new Map<string, number>();
  for (const n of self.notes) {
    for (const t of n.data.tags) {
      if (t === slug) continue;
      co.set(t, (co.get(t) ?? 0) + 1);
    }
  }

  return [...co.entries()]
    .map(([name, n]) => ({ tag: all.find((x) => x.slug === name)!, weight: n }))
    .filter((x) => x.tag)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((x) => x.tag);
}

/** 标签页里的一行（和 ArticleRow 数据结构对齐） */
export function tagRow(n: Note) {
  return {
    href: linkFor(n),
    date: n.data.date,
    title: n.data.title,
    dek: n.data.summary,
    maturity: n.data.maturity,
    genre: GENRE_LABEL[n.data.genre],
    column: n.data.column ? columnName(n.data.column) : '',
    tags: n.data.tags,
  };
}
