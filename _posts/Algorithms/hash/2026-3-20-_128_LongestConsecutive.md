---
title: "力扣热题100刷题-hash-128-最长连续序列"
date: 2026-3-20
categories: [Algorithms]
tags: [Algorithms, LeetCode]
---

# 128 + 最长连续序列

---

## 思路

将数组中的所有元素添加到哈希表中，然后遍历哈希表，看以当前数为起点或者以当前数为终点的连续序列的长度，
核心优化点：
假如是以当前遍历的数为起点的，判断哈希集合中是否有以他为起点的连续序列，
那么就可以在遍历时，查找哈希集合中是否有 n-1 这样的数，如果有的话，n
n为起点的就不是最长的，就可以不进行后面的查找操作了，首先的操作是找到起点或者终点，
这样可以节省很多时间。
---

## 总结

使用到的几个方法

```java
//哈希集合
boolean add(E e)                        // 添加元素（若已存在返回 false）
boolean contains(Object o)              // 是否包含元素
//遍历
HashSet<String> set = new HashSet<>();
for (String s : set){} //增强 for 循环
Iterator<String> it = set.iterator();//使用 Iterator（可在遍历中删除元素）
while (it.hasNext()) {
String s = it.next();
    System.out.println(s);
}
set.forEach(System.out::println);//使用 Stream（更简洁，但不可改元素和结构）
```