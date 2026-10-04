# qiyu-lu.github.io

个人技术博客：SLAM 算法复现 · Java 后端 · 算法刷题。
基于 [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) 主题，通过 GitHub Actions 部署到 GitHub Pages。

## 本地预览

```bash
bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve   # http://127.0.0.1:4000
```

## 写文章

在 `_posts/<分类>/` 下新建 `YYYY-MM-DD-标题.md`：

```yaml
---
title: "文章标题"
date: 2026-10-04
categories: [SLAM]        # 最多两级，如 [Algorithms, 双指针]
tags: [LIO-SAM, SLAM算法复现]
math: true                # 需要公式时打开
pin: true                 # 置顶到首页（可选）
---
```
