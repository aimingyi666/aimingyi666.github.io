---
title: gpu_memory_utilization 到底预留了什么
maturity: budding
genre: note
column: ai-engineering
collection: vllm-single-node
order: 3
date: 2026-10-20
summary: 它不是一个「用多少显存」的开关，而是一条留给临时激活值的保险线。
tags: [显存, vLLM]
links: [vllm-kv-cache]
---

这个参数常被理解成「让 vLLM 用 90% 的显存」。这个理解会直接导致两个误判。

## 它不是配额，是上限

`--gpu-memory-utilization 0.9` 的意思是：**vLLM 最多占用总显存的 90%，剩下的 10% 留给框架本身、CUDA context、以及推理过程中的临时激活值。**

它不会「用掉」90%，它只是不越过这条线。

## 两个常见误判

**误判一：调大它能提高吞吐。**
不会。调大它只是允许 KV cache 占用更多——但如果你的瓶颈在批处理调度，加显存不会变快，只会延迟 OOM 的时间点。

**误判二：调到 0.95 更划算。**
危险。剩下的 5% 在长上下文场景下会被临时激活值吃穿，结果是进程被系统 OOM killer 杀掉，而不是 CUDA 报错——两者的排查方向完全不同。

## 怎么定这个值

先按 0.85–0.9 起步，然后看显存峰值与总显存的差值。差值稳定在 3–5 GB 以上是安全的；如果长期只剩 1 GB 以内，说明余量不足，该降了。
