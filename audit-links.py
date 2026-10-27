"""静态站链接审计：扫描 dist 下所有 HTML 的内部链接，检查目标文件是否存在。"""
import os
import re
import sys
import urllib.parse

DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')
if not os.path.isdir(DIST):
    sys.exit('先跑 npx astro build')

# 部署子路径（base），需与 astro.config.mjs 里的 ASTRO_BASE 保持一致。
# 站内链接带 base 前缀（如 /<repo>/tags/），但文件就在 dist 根目录，
# 解析时要把 base 前缀剥掉才能对上磁盘上的真实文件，否则会误报死链。
BASE = os.environ.get('ASTRO_BASE', '').rstrip('/')
if BASE and not BASE.startswith('/'):
    BASE = '/' + BASE

TAGS = re.compile(r'(?:href|src)="([^"]+)"')

dead = {}
placeholders = {}
anchors = {}
checked = 0


def resolve(page_dir, href):
    """把 href 解析成 dist 下的真实文件路径。

    关键：URL 里的中文标签会被编码成 %E6%98%BE%E5%AD%98，
    必须 unquote 才能对应到磁盘上的「显存」目录。
    """
    raw = href.split('#')[0].split('?')[0]
    # 逐段解码，保留 / 结构
    parts = [urllib.parse.unquote(p) for p in raw.split('/')]
    path = '/'.join(parts)

    # 剥掉部署子路径前缀：/<base>/x → /x（文件在 dist 根目录）
    if BASE and path.startswith(BASE + '/'):
        path = path[len(BASE):]

    if path.startswith('/'):
        target = os.path.join(DIST, path.lstrip('/'))
    else:
        target = os.path.normpath(os.path.join(page_dir, path))

    if os.path.isdir(target):
        target = os.path.join(target, 'index.html')

    return target

for dp, dn, fn in os.walk(DIST):
    for f in fn:
        if not f.endswith('.html'):
            continue
        page = os.path.join(dp, f)
        rel = os.path.relpath(page, DIST).replace(os.sep, '/')
        html = open(page, encoding='utf-8').read()

        # 该页所有 id
        ids = set(re.findall(r'id="([^"]+)"', html))

        for h in TAGS.findall(html):
            if h.startswith(('mailto:', 'http', 'data:', '//')):
                continue
            if h == '#':
                placeholders[rel] = placeholders.get(rel, 0) + 1
                continue
            if h.startswith('#'):
                if h[1:] not in ids:
                    anchors.setdefault(rel, set()).add(h)
                continue

            frag = h.split('#')[1] if '#' in h else ''
            target = resolve(dp, h)

            checked += 1
            if not os.path.exists(target):
                dead.setdefault(h, set()).add(rel)
            elif frag and target.endswith('.html'):
                tids = set(re.findall(r'id="([^"]+)"', open(target, encoding='utf-8').read()))
                if frag not in tids:
                    anchors.setdefault(rel, set()).add(h)

print(f'扫描页面 {sum(1 for _,_,fs in os.walk(DIST) for f in fs if f.endswith(".html"))} 个，内部链接 {checked} 条')
print()

print('=== 死链 ===')
if not dead:
    print('（无）')
for k, v in sorted(dead.items()):
    print(f'{k}   <- {len(v)} 处')

print()
print('=== 占位 href="#" ===')
if not placeholders:
    print('（无）')
for k, v in sorted(placeholders.items()):
    print(f'{v:>3} 处   {k}')

print()
print('=== 锚点不存在 ===')
if not anchors:
    print('（无）')
for k, v in sorted(anchors.items()):
    print(f'{k}: {sorted(v)}')
