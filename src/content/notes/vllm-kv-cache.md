---
title: vLLM 的 KV cache 为什么会在长上下文下爆显存
maturity: budding
genre: note
column: ai-engineering
collection: vllm-single-node
order: 2
date: 2026-10-24
summary: PagedAttention 解决的是显存碎片，不是显存总量。上下文一长，绝对值仍然线性增长。
tags: [显存, vLLM, 推理服务]
links: [attention-paging, kv-cache-quantization]
---

先说结论：KV cache 的显存占用同时随「上下文长度」和「batch size」线性增长。PagedAttention 优化的是显存怎么分配，不是需要多少显存。所以长上下文爆显存，调 paged attention 的相关参数只能缓解，不能解决。

## 先算一遍这笔账

以 Llama-3-8B 为例：fp16、32 层、8 个 KV head、head_dim 128。每个 token 要存 K 和 V 两份，所以单 token 的 KV cache 是 128 KB。

```python
kv_per_token = 2 * 32 * 8 * 128 * 2        # 131072 B = 128 KB
ctx_8k   = 128 * 1024 * 8192  / 1024**3    # 1.0 GB / 序列
ctx_32k  = 128 * 1024 * 32768 / 1024**3    # 4.0 GB / 序列
batch_16 = ctx_32k * 16                   # 64 GB  ← 单卡装不下
```

所以「支持 32K 上下文」在单卡上不是免费的。A100 80G 跑 8B 模型，权重占约 16G，32K 上下文 8 并发就已经吃掉 32G——剩下的空间才留给批处理与临时激活值。

## 这条笔记还没写完的部分

- **缺实测**：上面的数字是算出来的，还没在同一张卡上用 `nvidia-smi` 对照过峰值。
- **缺反例**：什么情况下这个线性关系会失效？目前只想到 KV cache 量化（fp16 → int8）会改变系数，但没验证精度损失。

标注「生长中」的意思就是这两条还没补上——你可以看思路，但结论先别直接拿去当容量规划的输入。
