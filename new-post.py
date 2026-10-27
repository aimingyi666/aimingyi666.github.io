"""
新建一篇内容。

用法：
    python new-post.py                          # 交互式，逐项问
    python new-post.py "标题"                    # 只给标题，其余交互
    python new-post.py "标题" -g longform -c ai-engineering

它会：
  1. 根据标题生成文件名（中文保留，空格转连字符）
  2. 写入正确的 frontmatter（日期自动填今天）
  3. 打印下一步该做什么

不覆盖已存在的文件 —— 同名会直接报错退出。
"""
import argparse
import datetime
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(ROOT, 'src', 'content', 'notes')

# 和 src/data/site.ts 保持一致
COLUMNS = {
    '1': ('ai-engineering', 'AI 工程落地'),
    '2': ('ai-toolchain', 'AI 工具链'),
    '3': ('engineering', '工程基本功'),
    '4': ('career', '技术成长'),
    '5': ('troubleshooting', '踩坑与排障'),
}

COLLECTIONS = {
    '1': ('vllm-single-node', 'vLLM 单机推理：从跑通到跑满'),
    '2': ('rag-baseline', 'RAG 从零搭到能用'),
    '3': ('agent-orchestration', 'Agent 编排：从能跑到不出事'),
    '4': ('claude-code-ccswitch', 'Claude Code 与多模型切换'),
    '5': ('gpu-topology', 'GPU 节点与拓扑感知调度'),
}

GENRES = {
    '1': ('note', '笔记 —— 一条一个概念'),
    '2': ('longform', '长文 —— 讲原理与判断'),
    '3': ('manual', '手册 —— 分步配置，能照做'),
    '4': ('debug', '排障 —— 从现象到根因'),
    '5': ('log', '日志 —— 一段进展，不进专栏专题'),
}

MATURITY = {
    '1': ('seedling', '刚起头 —— 不发布，先存着'),
    '2': ('budding', '生长中 —— 骨架有了，结论待验证'),
    '3': ('evergreen', '已成体系 —— 敢让人照做'),
}


def ask(prompt, default=''):
    """非交互环境直接取默认值。

    不能用 isatty() 判断 —— 某些 shell（Git Bash 管道）会谎报 True，
    结果 input() 抛 EOFError。直接捕获异常最可靠。
    """
    try:
        s = input(f'{prompt}' + (f' [{default}]' if default else '') + ': ').strip()
        return s or default
    except EOFError:
        return default


def choose(prompt, options, default=None):
    d = default or '1'
    try:
        print(f'\n{prompt}')
        for k, (_, label) in options.items():
            print(f'  {k}. {label}')
        while True:
            v = input(f'选择 [{d}]: ').strip() or d
            if v in options:
                return options[v][0]
            print('  无效选项，重试')
    except EOFError:
        return options[d][0]


def slugify(title):
    """中文保留，空格和标点转连字符，英文转小写。"""
    s = title.strip().lower()
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'[^\w\u4e00-\u9fa5-]', '', s)
    s = re.sub(r'-+', '-', s).strip('-')
    return s[:60] or 'untitled'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('title', nargs='?', help='标题')
    ap.add_argument('-g', '--genre', choices=[v[0] for v in GENRES.values()])
    ap.add_argument('-c', '--column')
    ap.add_argument('-p', '--collection')
    ap.add_argument('-m', '--maturity', choices=[v[0] for v in MATURITY.values()])
    ap.add_argument('-s', '--slug')
    ap.add_argument('-d', '--date')
    args = ap.parse_args()

    print('=' * 56)
    print('新建内容')
    print('=' * 56)

    title = args.title or ask('\n标题（写成陈述句，不要写「关于…的思考」）')
    if not title:
        sys.exit('标题不能为空')

    genre = args.genre or choose('体裁？', GENRES)
    maturity = args.maturity or choose('成熟度？', MATURITY)

    column = args.column
    collection = args.collection

    if genre == 'log':
        print('\n日志不进专栏也不进专题，已跳过归属设置。')
    else:
        if not column:
            column = choose('放哪个专栏？', COLUMNS)
        if not collection:
            if ask('\n要挂到某个专题下吗？(y/N)', 'n').lower() == 'y':
                collection = choose('哪个专题？', COLLECTIONS)

    summary = ask('\n一句话摘要（列表页和 SEO 都用它）')
    tags_raw = ask('标签（最多 3 个，逗号分隔，可留空）')
    tags = [t.strip() for t in re.split(r'[,，]', tags_raw) if t.strip()][:3]

    date = args.date or datetime.date.today().isoformat()
    slug = args.slug or slugify(title)
    path = os.path.join(CONTENT, f'{slug}.md')

    if os.path.exists(path):
        sys.exit(f'\n文件已存在，不覆盖：\n  {path}\n换一个 --slug 或先删除旧文件。')

    # ---- 组装 frontmatter ----
    lines = ['---', f'title: {title}', f'maturity: {maturity}', f'genre: {genre}']
    if column:
        lines.append(f'column: {column}')
    if collection:
        lines.append(f'collection: {collection}')
    lines.append(f'date: {date}')
    if summary:
        lines.append(f'summary: {summary}')
    if tags:
        lines.append(f'tags: [{", ".join(tags)}]')
    lines.append('links: []')

    # 手册类补上必填的 source / verified / task / risk
    if genre == 'manual':
        lines += [
            'task: install',
            'risk: safe',
            'source:',
            '  url: ',
            '  author: ',
            '  license: ',
            '  change: ',
            'verified:',
            '  status: untested',
            '  date: ' + date,
        ]

    lines.append('---')
    lines.append('')

    body = {
        'note': '## 一句话\n\n\n\n## 为什么\n\n\n',
        'longform': '## 结论\n\n\n\n## 为什么是这样\n\n\n\n## 什么时候不成立\n\n\n',
        'manual': '## 用途\n\n\n\n## 命令\n\n```bash\n\n```\n\n## 说明\n\n',
        'debug': '## 现象\n\n\n\n## 排查路径\n\n\n\n## 根因\n\n\n\n## 反思\n\n',
        'log': '## 做了什么\n\n\n\n## 卡在哪\n\n\n\n## 下次注意\n\n',
    }[genre]

    io.open(path, 'w', encoding='utf-8').write('\n'.join(lines) + body)

    # ---- 提示 ----
    print('\n' + '=' * 56)
    print('已创建')
    print('=' * 56)
    print(f'  文件：src/content/notes/{slug}.md')
    print(f'  地址：', end='')

    if collection:
        print(f'/collections/{collection}/{slug}/')
    elif column:
        print(f'/columns/{column}/{slug}/')
    else:
        print(f'/log/{slug}/')

    if maturity == 'seedling':
        print('\n  ⚠ 成熟度是 seedling —— 不会生成页面。')
        print('    写完后改成 budding 或 evergreen 才会发布。')

    if genre == 'manual':
        print('\n  ⚠ 手册类：记得填 source，并把 verified.status 改成')
        print('    tested（必须同时填 env）或保持 untested。')

    print('\n下一步：')
    print('  npm run dev      # 预览，边写边看')
    print('  npm run check    # 发布前检查（构建 + 死链审计）')


if __name__ == '__main__':
    main()
