---
title: 把 Obsidian Vault 备份成可回溯的 git 仓库
maturity: evergreen
genre: manual
column: ai-toolchain
date: 2026-10-18
summary: 把整个 vault 变成一个 git 仓库。改错了能回退，误删了能找回，且不依赖任何云服务。
tags: [Obsidian, 备份]
links: []
task: backup
risk: backup
source:
  url: https://gist.github.com/
  author: 社区
  license: MIT
  change: 已改写：补了 .gitignore 与提交信息规范
verified:
  status: tested
  env: macOS 14.5 / git 2.42 / Obsidian 1.6.5
  date: 2026-10-18
---

## 用途

把整个 vault 变成一个 git 仓库。改错了能回退，误删了能找回，且不依赖任何云服务。

## 命令

```bash
cd ~/Documents/Obsidian/Vault
git init && git add -A && git commit -m 'init: vault baseline'
# 之后每次改完：git add -A && git commit -m 'update'
```

## 说明

先把 `.obsidian/workspace.json` 加进 `.gitignore`——它记录窗口布局，每次开都会变，提交了全是噪音。

`.obsidian/plugins/` 建议也忽略，体积大且可从社区重装。但 `community-plugins.json` 要留，它记录了装了哪些插件。
