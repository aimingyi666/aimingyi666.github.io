"""
间距归一化：把 padding / gap / margin 里的非阶梯值映射到 4 的倍数。

只处理间距，不动：
  - font-size / line-height / letter-spacing（字号有自己的阶梯，见设计规范）
  - width / height / min-width（组件物理尺寸）
  - border-radius（全站只有 2px，是刻意统一）

映射原则：就近合并，偏好取小不取大 —— 宁可紧凑一点，不要松垮。
"""
import io
import os
import re
import sys

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'styles')

# 阶梯外的值 → 阶梯内的值
MAP = {
    5: 4,
    6: 8,      # 6 用于行内 gap，8 更接近 4 的倍数且不过大
    7: 8,
    9: 8,
    10: 12,
    11: 12,
    13: 12,
    14: 16,
    18: 16,
    20: 24,    # 20 → 24，符合"松"的意图
    22: 24,
    26: 24,
    28: 32,
    30: 32,
}

# 只匹配这三个属性
PROP = re.compile(r'\b(padding|gap|margin)(-block|-inline|-top|-bottom|-left|-right)?\s*:\s*([^;}]+)')

def norm_value(val):
    """把一段值里的所有 px 数字逐个映射。保留 !important 等后缀。"""
    def repl(m):
        n = int(m.group(1))
        return f'{MAP.get(n, n)}px'
    return re.sub(r'(\d+)px', repl, val)


def process(path):
    src = io.open(path, encoding='utf-8').read()
    changes = []

    def repl(m):
        prop = m.group(1) + (m.group(2) or '')
        old_val = m.group(3)
        new_val = norm_value(old_val)
        if new_val != old_val:
            changes.append((prop, old_val.strip(), new_val.strip()))
        return f'{prop}: {new_val}'

    out = PROP.sub(repl, src)
    if changes:
        io.open(path, 'w', encoding='utf-8').write(out)
    return changes


total = 0
for f in sorted(os.listdir(BASE)):
    if not f.endswith('.css') or f == 'tokens.css':
        continue
    path = os.path.join(BASE, f)
    ch = process(path)
    if ch:
        print(f'\n{f}  ({len(ch)} 处)')
        # 按属性归并展示
        seen = {}
        for prop, a, b in ch:
            key = (prop, a, b)
            seen[key] = seen.get(key, 0) + 1
        for (prop, a, b), n in sorted(seen.items()):
            print(f'  {prop}: {a}  →  {b}   ×{n}')
        total += len(ch)

print(f'\n共修改 {total} 处')
