// 查询层：所有页面都通过这里拿内容
// 关键约束：成熟度为 seedling 的一律不发布 —— 过滤在这里做，不靠人记

import { getCollection, type CollectionEntry } from 'astro:content';
import { MATURITY_LABEL, withBase } from './site';

export type Note = CollectionEntry<'notes'>;

/** 所有已发布的笔记/文章（过滤掉 seedling 与 draft） */
export async function published(): Promise<Note[]> {
  const all = await getCollection('notes');
  return all
    .filter((n) => {
      if (n.data.draft) return false;
      // 日志不做成熟度过滤
      if (n.data.genre === 'log') return true;
      return MATURITY_LABEL[n.data.maturity].publish;
    })
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** 按生成时间倒序，取前 n 条（首页「最近更新」） */
export async function latest(n = 5): Promise<Note[]> {
  const list = await published();
  return list.filter((x) => x.data.genre !== 'log').slice(0, n);
}

/** 某个专题下的文章，按 order 排序 */
export async function inCollection(slug: string): Promise<Note[]> {
  const list = await published();
  return list
    .filter((n) => n.data.collection === slug)
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));
}

/** 某个专栏下的全部内容 */
export async function inColumn(slug: string): Promise<Note[]> {
  const list = await published();
  return list.filter((n) => n.data.column === slug);
}

/** 工具库条目 */
export async function toolbox(): Promise<Note[]> {
  const list = await published();
  return list.filter((n) => n.data.genre === 'manual' && n.data.risk);
}

/** 反向链接：谁引用了这条笔记 */
export async function backlinks(slug: string): Promise<Note[]> {
  const list = await published();
  return list.filter((n) => n.data.links.includes(slug));
}

/** 日志流 */
export async function logs(): Promise<Note[]> {
  const all = await getCollection('notes');
  return all
    .filter((n) => n.data.genre === 'log' && !n.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** 每条笔记的逻辑路径（不带部署子路径）。
 *  路由生成（getStaticPaths）和站内引用都用它；展示链接请用 linkFor()。 */
export function urlFor(note: Note): string {
  const d = note.data;
  // 工具库条目
  if (d.risk) return `/toolbox/${note.id}/`;
  // 日志
  if (d.genre === 'log') return `/log/${note.id}/`;
  // 有专题：文章挂在专题下
  if (d.collection) return `/collections/${d.collection}/${note.id}/`;
  // 无专题：挂专栏（旁路 A）
  if (d.column) return `/columns/${d.column}/${note.id}/`;
  // 兜底：笔记
  return `/notes/${note.id}/`;
}

/** 对外展示用的链接：逻辑路径 + 部署子路径前缀（base） */
export function linkFor(note: Note): string {
  return withBase(urlFor(note));
}
