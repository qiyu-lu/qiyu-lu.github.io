---
title: 如何用 GitHub Pages + Minimal Mistakes 搭建个人博客
date: 2025-08-09
categories: [教程]
tags: [GitHub Pages, 博客, Minimal Mistakes]
---

这篇文章记录了我如何用 **GitHub Pages** + **Minimal Mistakes** 主题搭建了我的第一个个人博客，全程免费且适合新手。

---

## 一、准备工作

1. **注册 GitHub 账号**  
   打开 [https://github.com/](https://github.com/) 注册账号。  
   我的用户名是 `qiyu-lu`，这在后面创建仓库时会用到。

2. **确定博客地址**  
   GitHub Pages 的地址规则是：  https://你的用户名.github.io
   所以我的博客地址就是：https://qiyu-lu.github.io


---

## 二、创建博客仓库

1. 打开 Minimal Mistakes 官方的 **Remote Theme Starter** 模板：  
[https://github.com/mmistakes/mm-github-pages-starter/generate](https://github.com/mmistakes/mm-github-pages-starter/generate)

2. 在 **Repository name** 填：qiyu-lu.github.io

3. 点击 **Create repository**。

---

## 三、开启 GitHub Pages

1. 进入仓库 **Settings → Pages**。
2. **Branch** 选择 `master`（我的仓库是 master 分支）。
3. **Folder** 选择 `/ (root)`。
4. 点击保存，等待 1～5 分钟，访问：https://qiyu-lu.github.io

---

## 四、修改博客信息

打开仓库里的 `_config.yml` 文件，修改：

```yml
title: 我的个人博客
author:
name: Qiyu
bio: 分享学习与生活
minimal_mistakes_skin: dark
保存后，刷新网页即可看到变化。
```
## 五、写第一篇文章
1. 在仓库的 _posts 文件夹下，新建文件：2025-08-09-my-first-post.md
2. 内容示例：
---
title: 我的第一篇博客
date: 2025-08-09
categories: [随笔]
tags: [生活]
---

这是我用 Minimal Mistakes 主题写的第一篇文章，支持 **Markdown** 语法。

3. 提交保存后，几秒钟后刷新博客页面就能看到文章。





