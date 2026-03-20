---
title: "力扣热题100刷题-slidingWindow-438-找到字符串中所有字母异位词"
date: 2026-3-20
categories: [Algorithms]
tags: [Algorithms, LeetCode]
---

# 438. 找到字符串中所有字母异位词

## 问题描述

给定两个字符串 `s` 和 `p`，找到 `s` 中所有 `p` 的 **异位词** 的子串，并返回这些子串的起始索引。

**异位词** 是指由相同字母、相同数量组成的字符串，但顺序可能不同。例如, "abc" 和 "cba" 是异位词。

## 解题思路

### 方法一：暴力法 (Brute Force)

这是最直接但效率最低的方法，对应 `findAnagramsBF` 函数。

1.  **遍历**: 从 `s` 的每个字符开始，检查其后长度为 `p.length()` 的子串。
2.  **排序比较**:
    *   取出这个子串。
    *   将子串和字符串 `p` 都转换成字符数组。
    *   对两个数组进行排序。
    *   如果排序后的数组完全相同，说明它们是异位词，记录下当前子串的起始索引。
3.  **复杂度**: 假设 `s` 的长度为 `m`，`p` 的长度为 `n`。
    *   时间复杂度: `O((m-n) * n log n)`。因为外层循环 `m-n` 次，内部每次都要进行长度为 `n` 的字符串排序。
    *   空间复杂度: `O(n)`，用于存储子串的字符数组。

这个方法在 `s` 很大时会非常慢，通常会导致超时。

### 方法二：滑动窗口与字符计数 (Sliding Window)

这是解决此类问题的标准、高效方法，对应 `findAnagramsBySwV2` 函数。

核心思想是维护一个固定大小的窗口（大小为 `p` 的长度），在 `s` 上滑动。我们不去比较子串本身，而是比较窗口内子串的 **字符频率** 是否与 `p` 的字符频率相同。

1.  **统计 `p` 的频率**: 使用一个大小为 26 的数组 `cnt`（因为题目说明是小写英文字母），统计 `p` 中每个字符出现的次数。

2.  **初始化窗口**:
    *   在 `s` 中建立一个初始窗口，大小与 `p` 相同（从索引 0 到 `p.length() - 1`）。
    *   使用另一个数组 `cntTemp` 统计这个初始窗口内各字符的频率。

3.  **滑动与比较**:
    *   **比较**: 比较 `cnt` 和 `cntTemp` 两个频率数组是否完全相同。如果相同，则表示当前窗口是一个异位词子串，将窗口的起始索引 `left` 加入结果列表。
    *   **滑动**: 将窗口向右移动一格。
        *   **移出**: `left` 指针向右移动，所以 `s[left]` 字符离开窗口。在 `cntTemp` 中将该字符的计数减一。
        *   **移入**: `right` 指针向右移动，所以 `s[right]` 字符进入窗口。在 `cntTemp` 中将该字符的计数加一。
    *   重复 **比较** 和 **滑动** 步骤，直到 `right` 指针到达 `s` 的末尾。

#### 代码实现 (`findAnagramsBySwV2`)

```java
public List<Integer> findAnagramsBySwV2(String s, String p) {
    List<Integer> ans = new ArrayList<>();
    if (s.length() < p.length()) return ans;

    int n = p.length();
    int[] cnt = new int[26];      // p 的字符频率
    int[] cntTemp = new int[26];  // 窗口的字符频率

    // 1. 统计 p 的频率，并初始化第一个窗口的频率
    for (int i = 0; i < n; i++) {
        cnt[p.charAt(i) - 'a']++;
        cntTemp[s.charAt(i) - 'a']++;
    }

    // 2. 检查第一个窗口
    if (Arrays.equals(cnt, cntTemp)) {
        ans.add(0);
    }

    // 3. 开始滑动窗口
    for (int left = 1; left <= s.length() - n; left++) {
        int right = left + n - 1;
        
        // 移出 s[left-1]
        cntTemp[s.charAt(left - 1) - 'a']--;
        // 移入 s[right]
        cntTemp[s.charAt(right) - 'a']++;

        // 再次比较
        if (Arrays.equals(cnt, cntTemp)) {
            ans.add(left);
        }
    }
    return ans;
}
```
*注：你提供的 `findAnagramsBySwV2` 在循环的实现上略有不同，但核心思想是一致的。以上版本是另一种常见的、等效的滑动窗口实现。*

4.  **复杂度**:
    *   时间复杂度: `O(m)`。我们只需要遍历一遍字符串 `s`。数组比较是 `O(1)`（因为数组大小固定为 26）。
    *   空间复杂度: `O(1)`，因为我们只用了两个固定大小的数组。

## 总结

滑动窗口通过复用前一步的计算结果（只更新离开和进入窗口的两个字符），避免了暴力法中大量的重复排序和比较工作，是解决子串/子数组问题的强大技巧。