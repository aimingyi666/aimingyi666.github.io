// RSS：只包含文章与笔记，日志不进 feed（见架构文档：日志不做 SEO 目标）
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { published, urlFor, linkFor } from '../data/content';
import { SITE } from '../data/site';

export async function GET(context: APIContext) {
  const items = await published();

  return rss({
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
    // site 用 origin（不含 base）；下面的 link 已自带 base 前缀（见 urlFor）
    site: import.meta.env.SITE ?? SITE.url,
    items: items
      .filter((n) => n.data.genre !== 'log')
      .slice(0, 40)
      .map((n) => ({
        title: n.data.title,
        pubDate: n.data.date,
        description: n.data.summary ?? '',
        link: linkFor(n),
      })),
  });
}
