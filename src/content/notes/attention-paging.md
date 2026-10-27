---
title: PagedAttention 与显存碎片的关系
maturity: evergreen
genre: note
column: ai-engineering
collection: vllm-single-node
order: 4
date: 2026-10-16
summary: 连续分配导致预留浪费，分页让浪费发生在页内而不是序列间。
tags: [显存, vLLM, 调度]
links: [vllm-kv-cache]
---

## 问题出在「连续」

传统实现里，每个序列的 KV cache 需要在显存里占一段连续空间。因为序列长度事先不可知，只能按最大长度预留——于是一个实际只说 200 token 的请求，可能占着 2048 token 的空间。

更麻烦的是**碎片**：序列结束时释放的空间大小不一，新的序列塞不进去，只能往后找。跑久了，显存总量还剩 40%，却拼不出一段连续空间。

## PagedAttention 的做法

把 KV cache 切成固定大小的 block（默认 16 token），序列的 block 不需要连续，靠一张 block table 映射到物理位置。

于是：
- 预留浪费从「按最大长度预留」变成「按页预留」，最坏只浪费一页
- 序列结束释放的是离散的 block，可以被任意新序列复用
- 碎片从「不可用」变成「可拼装」

## 但它不省总量

这是最常被误读的一点。**分页解决的是「因碎片而浪费的那部分」，不是「KV cache 本身需要多少」。**

序列真正需要的 block 数没变，所以总占用仍然随上下文长度线性增长。分页让利用率从 60% 提到 95%，但如果你需要的是 200% 显存，怎么分页都不够。

> 一句话：PagedAttention 让你少浪费，不让你少花钱。
