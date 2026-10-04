---
title: 专栏
icon: fas fa-layer-group
order: 1
---

按主题整理的系列文章，适合按顺序阅读。

{% assign slam = site.categories['SLAM'] | where_exp: 'p', 'p.hidden != true' | sort: 'date' %}
{% assign java = site.categories['Java'] | sort: 'date' %}
{% assign algo = site.categories['Algorithms'] | sort: 'title' %}

## SLAM 算法复现与阅读

开源 SLAM 算法的复现记录：环境配置、编译踩坑、数据集运行与结果分析。共 {{ slam.size }} 篇。

{% for p in slam %}
- [{{ p.title | remove: 'SLAM 算法复现记录：' | remove: 'SLAM 算法复现记录： ' | remove: 'SLAM 算法阅读记录：' | remove: '算法复现' | strip }}]({{ p.url | relative_url }}) <small class="text-muted">{{ p.date | date: '%Y-%m-%d' }}</small>
{% endfor %}

## Java 后端

Java 核心知识梳理：面向对象、集合、JDK 8 新特性、反射注解、JavaWeb。共 {{ java.size }} 篇。

{% for p in java %}
- [{{ p.title }}]({{ p.url | relative_url }}) <small class="text-muted">{{ p.date | date: '%Y-%m-%d' }}</small>
{% endfor %}

## LeetCode 热题 100

按专题记录解题思路与代码，已完成 {{ algo.size }} / 100。

{% assign groups = algo | group_by_exp: 'p', 'p.categories[1]' %}
{% for g in groups %}

**{{ g.name }}**

{% for p in g.items %}
- [{{ p.title | remove: '力扣热题100刷题-' | split: '-' | last }}]({{ p.url | relative_url }})
{% endfor %}
{% endfor %}
