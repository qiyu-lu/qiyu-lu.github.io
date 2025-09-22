---
title: "力扣热题100刷题-两数之和"
date: 2025-09-16
categories: [算法刷题]
tags: [算法, 力扣]
---

---
# 1. 暴力解法

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        //int [] result = new int[2]; 
        for (int i = 0;; ++i) {
            for (int j = i + 1; j < nums.length; ++j) {
                if (nums[i] + nums[j] == target) {
                    return new int[] { i, j };
                }
            }
        }
        //return result; 
    }
}
```
在 Java 里，编译器要求所有可能的执行路径都必须有返回值，否则会报错。
原始写法（有循环终止条件）理论上可能跑完，那外层循环退出后，方法就要知道返回什么。编译器不知道你逻辑上“一定会找到解”，所以它强制要求最后写 return。

去掉循环终止条件后，编译器分析控制流时，发现：要么在循环里 return，要么就卡死在循环里。所以它认为：方法一定会在循环里 return，不会执行到循环外。因此在循环外就不需要写 return 了。

# 2. 哈希表解法

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> idx = new HashMap<>();
        for(int i = 0; ; ++i){
            int x = nums[i];
            if(idx.containsKey(target - x)){//之前存的数据中找
                return new int[]{idx.get(target - x), i};
            }
            else
                idx.put(x, i);
        }
    }
}
```

举例：
[3,1,4,1,5,9]
哈希表中存着
找有没有 9-3 = 6 这个键存在 没有则 添加 3 - 0
找有没有 9-1 = 8 这个键存在 没有则 添加 1 - 1
找有没有 9-4 = 5 这个键存在 没有则 添加 4 - 2
找有没有 9-1 = 8 这个键存在 没有则 添加 1 - 3 这应该覆盖了吧
找有没有 9-5 = 4 这个键存在   有则 输出 4对应的值为2， 以及5对应的值为4


HashMap 单遍扫描 ，要找的不是 nums[i]，而是它的“补数”：如果在前面已经出现过 complement，那么就能和当前的 nums[i] 组成一对解。
时间复杂度：O(n)
每个元素只处理一次，哈希表查询/插入是均摊 O(1)。

空间复杂度：O(n)
最坏情况下，所有元素都要存进哈希表。