// @ts-check
import { defineConfig } from 'astro/config';

// 站点配置：改域名 / 部署目标有两种方式
//   1. 直接改下面的默认值
//   2. 走环境变量（CI / 多环境部署用）：
//        ASTRO_SITE —— 站点正式域名（canonical / RSS 绝对链接用），如 https://user.github.io
//        ASTRO_BASE —— 子路径前缀，GitHub Pages 项目页用 /<repo>/；根域部署（自定义域名、
//                      <user>.github.io 用户页）留空即可
const SITE_URL = process.env.ASTRO_SITE || 'https://manbianliang.com';
const BASE = process.env.ASTRO_BASE || '';

// Astro 的 base 只重写它自己管理的资源（_astro 下的 CSS/JS），
// 不会碰正文 Markdown 里的 [文本](/路径) 链接。这个插件把那些根路径链接也加上 base。
function remarkBase() {
  const prefix = BASE.replace(/\/$/, ''); // '/slow-variable' 或 ''
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (
      (node.type === 'link' || node.type === 'image' || node.type === 'definition') &&
      typeof node.url === 'string' &&
      node.url.startsWith('/')
    ) {
      node.url = prefix + node.url;
    }
    if (Array.isArray(node.children)) node.children.forEach(walk);
  }
  return (tree) => walk(tree);
}

export default defineConfig({
  site: SITE_URL,
  base: BASE,
  build: {
    // 输出 /notes/foo/index.html 而不是 /notes/foo.html
    format: 'directory',
  },
  markdown: {
    remarkPlugins: [remarkBase],
    shikiConfig: {
      // 代码块配色跟设计稿一致
      theme: {
        name: 'slow-variable',
        type: 'dark',
        colors: {
          'editor.background': '#1A1A1A',
          'editor.foreground': '#E8E4D8',
        },
        tokenColors: [
          { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#8A8578' } },
          { scope: ['string', 'constant.other.symbol'], settings: { foreground: '#C9BFA5' } },
          { scope: ['keyword', 'storage.type', 'storage.modifier'], settings: { foreground: '#9FC4D8' } },
          { scope: ['entity.name.function', 'support.function'], settings: { foreground: '#E9C08A' } },
          { scope: ['variable', 'variable.parameter'], settings: { foreground: '#E8E4D8' } },
          { scope: ['constant.numeric'], settings: { foreground: '#D8B08A' } },
        ],
      },
    },
  },
});
