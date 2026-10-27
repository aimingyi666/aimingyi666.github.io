---
title: KV cache 量化：fp16 降到 int8 能省多少
maturity: seedling
genre: note
column: ai-engineering
date: 2026-10-15
summary: 缓解显存压力最直接的方向，但精度损失还没测。
tags: [显存, 量化]
links: [vllm-kv-cache]
---

还没写完。只记了一个估算：fp16 → int8 理论上把 KV cache 减半，实际因为 per-channel scale 的开销，大概能省 45%。

待补：
- 在 8B 模型上实测精度掉多少（用 golden set 对比）
- 长上下文下误差是否累积
