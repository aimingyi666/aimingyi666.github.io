// 构建时生成搜索索引：/search-index.json
// 只含已发布内容（成熟度过滤已由 published() 完成）
import type { APIContext } from 'astro';
import { published, urlFor, linkFor } from '../data/content';
import { GENRE_LABEL, columnName, MATURITY_LABEL } from '../data/site';

interface Doc {
  id: string;
  t: string;   // title
  s: string;   // summary
  u: string;   // url
  g: string;   // genre 中文
  c: string;   // column 中文
  k: string;   // tags 拼接
  b: string;   // body 纯文本（截断）
  m: string;   // maturity
}

export async function GET(_context: APIContext) {
  const items = await published();

  const docs: Doc[] = items.map((n) => {
    const d = n.data;
    const body = (n.body ?? '')
      // 去掉代码块，避免命令把搜索结果带偏
      .replace(/```[\s\S]*?```/g, ' ')
      // 去掉 markdown 标记
      .replace(/[#>*`\-|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 600);

    return {
      id: n.id,
      t: d.title,
      s: d.summary ?? '',
      u: linkFor(n),
      g: GENRE_LABEL[d.genre],
      c: d.column ? columnName(d.column) : '',
      k: d.tags.join(' '),
      b: body,
      m: MATURITY_LABEL[d.maturity].text,
    };
  });

  return new Response(JSON.stringify({ docs }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
