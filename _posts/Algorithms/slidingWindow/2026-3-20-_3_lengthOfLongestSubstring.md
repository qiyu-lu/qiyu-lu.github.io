---
title: "力扣热题100刷题-slidingWindow-3-无重复字符的最长子串"
date: 2026-3-20
categories: [Algorithms]
tags: [Algorithms, LeetCode]
---

# 3. 无重复字符的最长子串

## 问题描述

给定一个字符串 `s` ，请你找出其中不含有重复字符的 **最长子串** 的长度。

## 解题思路：滑动窗口

这道题是典型的滑动窗口问题，我们可以用两个指针 `left` 和 `right` 来维护一个窗口，这个窗口内的子串就是我们正在检查的子串。

### 核心思想

1.  **右指针 `right` 扩张**: 不断向右移动 `right` 指针，以扩大窗口，将新的字符纳入窗口中。
2.  **检查重复**: 每当一个新的字符 `s[right]` 进入窗口时，我们需要判断这个字符是否已经在窗口中存在。
    *   **不重复**: 如果 `s[right]` 不在窗口中，那么我们成功地将窗口扩大了一格，当前窗口的长度就是 `right - left + 1`，我们更新最大长度。
    *   **重复**: 如果 `s[right]` 已经在窗口中了，说明从 `left` 到 `right` 的这个子串包含了重复字符。此时，我们需要收缩窗口。
3.  **左指针 `left` 收缩**: 不断向右移动 `left` 指针，将 `s[left]` 移出窗口，直到窗口内不再包含重复的 `s[right]` 字符。然后 `right` 指针可以继续扩张。

通过这个过程，我们就能遍历所有可能的无重复字符的子串，并找到其中最长的一个。

### 实现方法

#### 方法一：使用 HashSet

这是最直观的实现。我们可以用一个 `HashSet` 来存储当前窗口内的所有字符。

- **扩张窗口**: 当 `right` 指针移动时，检查 `s[right]` 是否在 `HashSet` 中。
    - 如果不在，就将其加入 `HashSet`，然后 `right` 指针加一，并更新最大长度 `ans = max(ans, set.size())`。
    - 如果在，说明遇到了重复字符。
- **收缩窗口**: 当发现重复时，我们从 `HashSet` 中移除 `s[left]`，然后 `left` 指针加一。这个过程一直持续到 `s[right]` 可以被安全地加入 `HashSet` 为止。

```java
public int lengthOfLongestSubstring(String s) {
    char[] arr = s.toCharArray();
    int n = arr.length;
    HashSet<Character> set = new HashSet<>();
    int ans = 0;
    int left = 0;
    int right = 0;

    while(right < n){
        if(!set.contains(arr[right])){
            set.add(arr[right]);
            right++;
            // 每次扩大窗口都可能是最长的一次
            ans = Math.max(ans, set.size()); 
        }
        else{
            // 发现重复，收缩窗口
            set.remove(arr[left]);
            left++;
        }
    }
    return ans;
}
```

#### 方法二：使用布尔数组（优化）

考虑到题目提示 “s 由英文字母、数字、符号和空格组成”，这些都属于 ASCII 字符集。ASCII 码的范围是 0-127。因此，我们可以用一个大小为 128 的布尔数组 `has[]` 来代替 `HashSet`，以提高效率。数组的索引就是字符的 ASCII 码。

- `has[char]` 为 `true` 表示该字符在当前窗口中。
- `has[char]` 为 `false` 表示该字符不在当前窗口中。

这种方法的逻辑和 `HashSet` 完全一样，但数组操作通常比 `HashSet` 的哈希计算和冲突处理要快。

```java
public int lengthOfLongestSubstringByArray(String s) {
    char[] arr = s.toCharArray();
    int n = arr.length;
    boolean[] has = new boolean[128]; // ASCII 字符集
    int ans = 0;
    int left = 0;

    for(int right = 0; right < n; right++){
        // 当发现 arr[right] 已经在窗口中时，收缩窗口
        while(has[arr[right]]){
            has[arr[left]] = false; // 将左边界字符移出窗口
            left++;
        }
        // 此时 arr[right] 可以安全地加入窗口
        has[arr[right]] = true;
        // 更新最大长度
        ans = Math.max(ans, right - left + 1);
    }
    return ans;
}
```
*代码 `_3_lengthOfLongestSubstring.java` 中的 `lengthOfLongestSubstringByArrayPlus` 方法与此逻辑相同。*

## 总结

- **问题类型**: 寻找满足条件的 **最长子串/子数组**，通常可以考虑滑动窗口。
- **核心数据结构**: 需要一个能快速判断元素是否存在的数据结构来维护窗口内的字符，例如 `HashSet` 或 `HashMap`。
- **优化**: 如果字符集范围有限（如 ASCII），使用数组代替哈希表可以提高性能。
- **窗口移动**: 滑动窗口的精髓在于，指针只向前移动，避免了暴力解法中的重复计算，将时间复杂度从 O(N^2) 或 O(N^3) 优化到 O(N)。