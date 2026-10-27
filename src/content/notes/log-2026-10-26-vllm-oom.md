---
title: vLLM 在 8 卡机上 OOM，最后是 ulimit 的问题
maturity: budding
genre: log
date: 2026-10-26
summary: 8 卡 A100 起服务到一半 OOM，nvidia-smi 显示显存是空的。
tags: [vLLM, 排查]
links: [vllm-kv-cache]
---

## 现象

2026-10-26 · 8×A100 80G，vLLM 起服务到一半 OOM，但 `nvidia-smi` 显示显存是空的。

## 排查路径

先怀疑 `gpu_memory_utilization` 太高 → 降到 0.8 仍 OOM。

再怀疑模型加载分片 → 换小模型仍 OOM，排除。

看 `dmesg`：进程被杀是 `Out of memory: Killed process`，**不是 CUDA OOM**。

## 根因

`ulimit -v` 被设成 32G，进程虚拟内存超限。

## 反思

先分清「CUDA OOM」和「系统 OOM」。两者的报错位置、排查命令、修复方向完全不同——前者看显存分配，后者看进程限额。
