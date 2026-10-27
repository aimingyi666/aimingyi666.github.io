---
title: 查看并释放被占用的 GPU 显存
maturity: evergreen
genre: manual
column: ai-engineering
date: 2026-10-20
summary: 找出是哪个进程占着显存，只结束该结束的那个，不用重启整机。
tags: [显存, 排查]
links: [vllm-kv-cache]
task: debug
risk: safe
source:
  url: https://docs.nvidia.com/deploy/nvidia-smi/index.html
  author: NVIDIA
  license: 官方文档
  change: 仅记录命令，未改写
verified:
  status: tested
  env: Ubuntu 22.04 / nvidia-smi 535.129 / RTX 4090
  date: 2026-10-20
---

## 用途

找出是哪个进程占着显存，只结束该结束的那个，不用重启整机。

## 命令

```bash
nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv
# 确认是哪个 pid 之后，只结束目标进程，不要动其它
kill -15 <pid>
```

## 说明

先发 `-15`（SIGTERM）让进程自己清理。如果 30 秒后还在，才考虑 `-9`——直接 `-9` 可能留下未释放的 IPC 资源，反而更麻烦。

如果 GPU 显示占用但 `query-compute-apps` 是空的，说明是僵尸进程残留的 context，只能重启机器或重置驱动。
