---
title: "力扣热题100刷题-hash-49-字母异位词分组"
date: 2026-3-20
categories: [Algorithms]
tags: [Algorithms, LeetCode]
---

# 49 + 字母异位词分组

---

## 思路

字母异位词就是一个字符串的字符的不同排列方式，可以使用哈希表，遍历这个字符串，将其中的字符进行排序，
排序后的字符串作为键，为什么不使用字符数组作为键，字符数组作为键的话是它的地址，每一个遍历到的字符串排序后新建的字符数组地址都不一样。
然后符合字母异位词的要求的列表作为值。

---

---

### 核心思路（本质）
（这题的抽象本质是什么？）

例：
- 右侧第一个更大元素
- 子数组求和问题
- 树的后序遍历
- 二分查找答案

---

## 总结

总结一下这里使用到的一些方法:

```java
map.put(key, value);       // 插入/更新
map.get(key);              // 获取value
map.containsKey(key);      // 是否包含key
map.remove(key);           // 删除对应key的键值对
map.getOrDefault(key, 0);  // 不存在时返回默认值
map.values(); // 获取全部的值 返回的正是 Collection 类型
//然后 ArrayList 提供了接收 Collection 的构造方法
new ArrayList<>(map.values()) //可以这样
map.getOrDefault(key, defaultValue) //如果 key 存在，就返回对应的 value；如果 key 不存在，就返回你给的默认值。

//key,要查找的键 如果不存在，则执行第二个参数：lambda表达式函数创建值,然后返回 key 对应的值（现有的或新创建的）
map.computeIfAbsent(K key, Function<? super K, ? extends V> mappingFunction)

s.toCharArray() // 字符串转化为字符数组
Arrays.sort(arr) //对数组进行排序
```

