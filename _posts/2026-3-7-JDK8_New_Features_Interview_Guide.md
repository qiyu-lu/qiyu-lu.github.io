---
title: "JDK 8 新特性"
date: 2026-3-7
categories: [秋招记录]
tags: [JAVA八股]
---
---

# JDK 8 新特性

---

## 1. 函数式编程的基石：Lambda、函数式接口与方法引用

面试官通常会从 Lambda 表达式切入，你需要将这三个概念串联起来，展示你对函数式编程基础的理解。

### a. 函数式接口 (`@FunctionalInterface`)

-   **是什么**：一个**有且仅有一个抽象方法**的接口。
-   **为什么需要**：它是 Lambda 表达式的**目标类型**。Java 需要一个明确的类型来承载 Lambda 表达式，这个类型就是函数式接口。
-   **怎么用**：
    -   JDK 提供了大量开箱即用的函数式接口，位于 `java.util.function` 包下，如 `Predicate<T>` (判断)、`Consumer<T>` (消费)、`Function<T, R>` (转换)、`Supplier<T>` (供给)。
    -   任何符合“单一抽象方法”条件的接口都是函数式接口，比如我们熟悉的 `Runnable` 和 `Comparator`。
    -   推荐使用 `@FunctionalInterface` 注解来标记，编译器会帮你检查接口定义是否符合规范。

    ```java
    @FunctionalInterface
    interface MyFunction {
        void doSomething(String s);
    }
    ```

### b. Lambda 表达式

-   **是什么**：一个**匿名函数**，可以理解为一段可以被传递的代码。
-   **为什么需要**：为了替代冗长的匿名内部类，让代码更简洁、更易读。
-   **怎么用**（语法）：`(parameters) -> { body }`

    **面试亮眼回答**：通过一个“前-后”对比来展示 Lambda 的威力。

    ```java
    // JDK 8 之前：使用匿名内部类
    List<String> names = Arrays.asList("alice", "bob", "charlie");
    Collections.sort(names, new Comparator<String>() {
        @Override
        public int compare(String a, String b) {
            return b.compareTo(a); // 降序排序
        }
    });

    // JDK 8 之后：使用 Lambda 表达式
    List<String> namesLambda = Arrays.asList("alice", "bob", "charlie");
    Collections.sort(namesLambda, (a, b) -> b.compareTo(a));
    // 或者 namesLambda.sort((a, b) -> b.compareTo(a));
    ```

### c. 方法引用

-   **是什么**：Lambda 表达式的一种**语法糖**。当 Lambda 体中的代码逻辑**已经有现成的方法可以实现**时，就可以使用方法引用。
-   **为什么需要**：让代码的简洁性达到极致。
-   **怎么用**（四种类型）：
    -   **静态方法引用**：`ClassName::staticMethodName`
    -   **实例方法引用（特定实例）**：`instance::instanceMethodName`
    -   **实例方法引用（任意实例）**：`ClassName::instanceMethodName`
    -   **构造方法引用**：`ClassName::new`

    ```java
    // Lambda 表达式
    names.forEach(s -> System.out.println(s));
    // 方法引用 (更简洁)
    names.forEach(System.out::println);
    ```

---

## 2. Stream API：优雅的数据处理大师

Stream API 是 JDK 8 最具革命性的特性，它提供了一种声明式、链式的方式来处理集合数据。

-   **是什么**：一个来自数据源的元素队列，支持聚合操作。它不是数据结构，不存储数据，只用于计算。
-   **为什么需要**：告别繁琐、易错的 `for` 循环，用一种更符合人类思维的方式处理数据，同时可以轻松实现并行处理。
-   **核心思想**：
    1.  **数据源 (Source)**：从一个集合、数组或 I/O channel 创建流。
    2.  **中间操作 (Intermediate Operations)**：可以有多个，形成一个链。这些操作是**惰性求值**的，只有当终端操作执行时才会真正执行。常见操作有 `filter`, `map`, `sorted`, `distinct`。
    3.  **终端操作 (Terminal Operation)**：只能有一个，是触发计算的开关。常见操作有 `collect`, `forEach`, `count`, `reduce`。

**面试亮眼回答**：准备一个经典的业务场景，例如：

> “假设我们有一个用户列表，需要筛选出所有年龄大于18岁的用户，按年龄降序排序，然后返回他们的姓名列表。”

```java
// 传统写法
List<User> userList = ...;
List<User> filteredList = new ArrayList<>();
for (User user : userList) {
    if (user.getAge() > 18) {
        filteredList.add(user);
    }
}
Collections.sort(filteredList, new Comparator<User>() {
    @Override
    public int compare(User u1, User u2) {
        return Integer.compare(u2.getAge(), u1.getAge());
    }
});
List<String> nameList = new ArrayList<>();
for (User user : filteredList) {
    nameList.add(user.getName());
}

// Stream API 写法
List<String> nameListStream = userList.stream() // 1. 创建流
    .filter(user -> user.getAge() > 18)        // 2. 中间操作：筛选
    .sorted(Comparator.comparingInt(User::getAge).reversed()) // 3. 中间操作：排序
    .map(User::getName)                        // 4. 中间操作：映射
    .collect(Collectors.toList());             // 5. 终端操作：收集结果
```

-   **并行流 (Parallel Stream)**：只需将 `.stream()` 替换为 `.parallelStream()`，就可以利用多核CPU并行处理数据，在处理大数据量时能显著提升性能。但要注意线程安全问题。

---

## 3. Optional：优雅地告别 `NullPointerException`

-   **是什么**：一个**容器类**，代表一个值存在或不存在。
-   **为什么需要**：`NullPointerException` (NPE) 是 Java 开发中最常见的噩梦。`Optional` 的出现旨在通过类型系统来**显式地提醒**开发者处理“可能为空”的情况，而不是依赖于 `if (obj != null)` 这种防御性编程。
-   **核心用法**：
    -   **创建**：`Optional.of(value)` (value不能是null), `Optional.ofNullable(value)` (value可以是null), `Optional.empty()`。
    -   **判断**：`isPresent()` (存在则返回true)。
    -   **获取值**：`get()` (如果值不存在会抛异常，不推荐)。
    -   **安全消费**：`ifPresent(consumer)` (如果值存在，则执行consumer)。
    -   **默认值**：`orElse(defaultValue)` (如果值不存在，返回默认值), `orElseGet(supplier)` (如果值不存在，通过supplier获取一个值)。
    -   **转换**：`map(function)`, `flatMap(function)`。

**面试亮眼回答**：`orElse` 和 `orElseGet` 的区别是什么？
> `orElse(T other)`：无论 `Optional` 中是否有值，`other` 参数都会被求值。
> `orElseGet(Supplier<? extends T> other)`：只有当 `Optional` 为空时，才会执行 `Supplier` 来获取值。
> 因此，如果默认值的计算成本很高，或者会产生副作用，**应优先使用 `orElseGet`**。

---

## 4. 全新的日期与时间 API (`java.time`)

-   **为什么需要**：旧的 `java.util.Date` 和 `Calendar` API 设计糟糕、可变（非线程安全）、API混乱、时区处理困难。
-   **是什么**：一套全新的、设计精良的日期时间API，位于 `java.time` 包下。
-   **核心优势与类**：
    -   **不可变性与线程安全**：`java.time` 包下所有类都是不可变的，因此是线程安全的。
    -   **职责分离，语义清晰**：
        -   `LocalDate`：只包含日期 (如: 2024-03-08)。
        -   `LocalTime`：只包含时间 (如: 17:30:00)。
        -   `LocalDateTime`：包含日期和时间，是两者的结合。
        -   `ZonedDateTime`：带时区的日期时间。
        -   `Instant`：机器时间，代表时间线上的一个瞬时点（时间戳）。
        -   `Duration`：表示两个时间之间的间隔（秒、纳秒）。
        -   `Period`：表示两个日期之间的间隔（年、月、日）。
        -   `DateTimeFormatter`：强大的、线程安全的日期时间格式化与解析工具。

---

## 5. 接口的默认方法与静态方法

### a. 默认方法 (Default Methods)
-   **是什么**：在接口中用 `default` 关键字修饰的、带有方法体的方法。
-   **为什么需要**：为了解决“接口升级”的难题。在 Java 8 之前，如果给一个接口增加新方法，所有实现该接口的类都必须修改代码。默认方法允许我们在不破坏已有实现的情况下，为接口添加新功能。
-   **最典型的例子**：`Iterable` 接口在 JDK 8 中增加了 `forEach()` 默认方法，使得所有 `Collection` 子类都自动获得了这个能力，可以直接使用 Lambda 进行遍历。

### b. 接口静态方法
-   **是什么**：在接口中使用 `static` 关键字修饰的方法。
-   **为什么需要**：提供与接口相关的工具方法，减少工具类（如 `Collections`）的创建。

---

## 6. (加分项) JVM 的变化：从永久代到元空间

-   **是什么**：在 JVM 层面，Java 8 移除了**永久代 (PermGen)**，取而代之的是**元空间 (Metaspace)**。
-   **为什么需要**：永久代位于 JVM 堆内存中，大小固定，当加载的类过多时，容易引发 `OutOfMemoryError: PermGen space`。
-   **元空间的变化**：
    -   **存储位置**：元空间使用的是**本地内存 (Native Memory)**，而不是 JVM 堆内存。
    -   **大小**：默认情况下，元空间的大小仅受本地内存的限制，大大降低了因类加载过多而导致 OOM 的风险。

## 总结

JDK 8 不仅仅是语法糖的集合，它是一次深刻的编程思想变革。在面试中，我们不仅要能罗列出这些新特性，更要能清晰地阐述每个特性背后的设计思想、它解决了什么实际问题，并能结合简洁的代码示例进行说明。掌握了以上内容，当面试官再问起 JDK 8 时，你便可以从容不迫，侃侃而谈。
