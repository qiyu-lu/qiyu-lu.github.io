---
title: "力扣热题100刷题-twoPointers-11-盛最多水的容器"
date: 2026-3-20
categories: [Algorithms]
tags: [Algorithms, LeetCode]
---



# LeetCode 11. 盛最多水的容器 (Container With Most Water)

## 题目描述

给定一个非负整数数组 `height` ，每个数代表一个点的坐标 `(i, height[i])`。在坐标系中画 `n` 条垂直线，第 `i` 条线的两个端点分别为 `(i, 0)` 和 `(i, height[i])`。找出其中的两条线，使得它们与 x 轴共同构成的容器可以容纳最多的水。

## 核心思路：双指针法

这道题的经典解法是**双指针法**。我们使用两个指针，一个指向数组的开头（`left`），另一个指向数组的末尾（`right`）。这两个指针代表了容器的两条边。

容器的面积取决于两个因素：
1.  **宽度**：两条边之间的距离，即 `right - left`。
2.  **高度**：由较短的那条边决定，即 `min(height[left], height[right])`。

因此，面积 `Area = min(height[left], height[right]) * (right - left)`。

我们的目标是让这个面积最大化。

## 算法步骤

1.  初始化左指针 `left = 0`，右指针 `right = height.length - 1`。
2.  初始化最大面积 `maxArea = 0`。
3.  当 `left < right` 时，循环执行以下步骤：
    a. 计算当前指针构成的容器面积：`currentArea = min(height[left], height[right]) * (right - left)`。
    b. 更新最大面积：`maxArea = max(maxArea, currentArea)`。
    c. **移动指针**：比较 `height[left]` 和 `height[right]` 的高度。为了找到可能更大的面积，我们选择移动指向**较短**边的那一侧指针。
       - 如果 `height[left] <= height[right]`，则 `left++`。
       - 否则，`right--`。
4.  循环结束后，`maxArea` 即为所求答案。

## 为什么移动较短的边是正确的？（正确性证明）

这是一个贪心策略。我们来证明为什么每次移动较短的边，不会错过最优解。

假设我们当前的左右指针为 `left` 和 `right`，并且 `height[left] < height[right]`。
此时的面积是 `Area = height[left] * (right - left)`。

我们有两个选择：
1.  **移动右指针 `right`**：`right--`。新的宽度变成了 `right - 1 - left`，比原来小。新的高度是 `min(height[left], height[right-1])`。因为 `height[left]` 已经是较短的边，所以新的高度最大也只能是 `height[left]`。宽度变小了，高度没有增加，所以新的面积 `Area_new = min(height[left], height[right-1]) * (right - 1 - left) <= height[left] * (right - 1 - left) < Area`。因此，移动较高的边（`right`）不可能得到更大的面积。

2.  **移动左指针 `left`**：`left++`。新的宽度 `right - (left + 1)` 也变小了。但新的高度 `min(height[left+1], height[right])` 可能会变大。如果 `height[left+1]` 足够大，就有可能弥补宽度减小的损失，从而得到一个更大的面积。

因此，在每一步中，我们固定较高的那条边，移动较低的那条边，才有可能找到一个更大的容器面积。这个策略保证了我们朝着面积可能增大的方向探索，最终能够找到全局最优解。

## 总结

双指针法是解决此问题的关键。通过从两端向中间收缩，并始终移动较短的板，我们可以在 O(n) 的时间复杂度内有效地找到最大面积。这个方法之所以有效，是因为容器的面积由短板和宽度共同决定，移动短板是唯一可能找到更大面积的策略。
