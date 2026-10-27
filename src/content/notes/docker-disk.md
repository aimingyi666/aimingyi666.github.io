---
title: Docker 磁盘占用为什么越清越大
maturity: evergreen
genre: note
column: engineering
date: 2026-10-02
summary: 清掉的是悬空镜像，占地方的是构建缓存和具名卷——两者的清理命令不在一起。
tags: [Docker, 磁盘]
links: []
---

`docker image prune` 清完之后 `df` 还是没降，是最常见的挫败感来源。

## 三块占用，三个命令

| 占用 | 查看 | 清理 |
|---|---|---|
| 悬空镜像 | `docker images -f dangling=true` | `docker image prune` |
| 构建缓存 | `docker system df -v` | `docker builder prune` |
| 具名卷 | `docker volume ls` | `docker volume prune` |

`docker system prune` 默认**不动具名卷**，这是最容易漏的一块。要清卷必须显式加 `--volumes`。

## 为什么构建缓存最大

每次 `docker build` 都会留一层缓存，用于下次加速。多阶段构建时，中间层也会占空间。跑几个月的开发机，缓存几个 G 是常态。

```bash
# 看明细
!docker system df -v
```

## 顺序很重要

先清缓存（最安全，只影响下次构建速度），再看卷（可能有数据），最后才是镜像。反过来做，你会发现清了半天没效果。
