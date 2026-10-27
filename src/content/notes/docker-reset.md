---
title: 重置 Docker 的全部本地数据
maturity: budding
genre: manual
column: engineering
date: 2026-10-12
summary: 把 Docker 恢复到刚装完的状态。用于彻底清理磁盘，或解决镜像层损坏到无法修复的情况。
tags: [Docker, 清理]
links: [docker-disk]
task: cleanup
risk: danger
source:
  url: https://docs.docker.com/engine/reference/commandline/system_prune/
  author: Docker
  license: 官方文档
  change: 仅记录命令
verified:
  status: untested
  date: 2026-10-12
---

## 用途

把 Docker 恢复到刚装完的状态。用于彻底清理磁盘，或解决镜像层损坏到无法修复的情况。

## 命令

```bash
!docker system prune -a --volumes
# 会删除：未使用镜像、构建缓存、网络、匿名卷
# 执行前：docker save 需要的镜像 / 备份具名卷
```

## 说明

`-a` 会删掉所有没有被容器使用的镜像，包括你手动 pull 下来备用的。`--volumes` 会删具名卷——**这一条最容易造成数据丢失**，先确认没有数据库容器依赖它们。

回滚方式：没有。删掉的镜像要重新 pull，删掉的卷基本找不回来。
