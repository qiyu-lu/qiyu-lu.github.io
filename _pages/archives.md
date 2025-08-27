---
title: 📚 全部文章
permalink: /archives/
layout: single
author_profile: true
toc: false
---

{% for post in site.posts %}
- {{ post.date | date: "%Y-%m-%d" }} → [{{ post.title }}]({{ post.url | relative_url }})
{% endfor %}
