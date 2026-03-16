---
title: "Java Lambda 表达式入门"
date: 2026-3-7
categories: [Java]
tags: [JAVA八股]
---
---

# Java Lambda 表达式入门

Lambda 表达式是 Java 8 引入的最重要特性之一，它为 Java 带来了函数式编程的能力，让代码变得更简洁、更灵活。

---

## 1. 什么是 Lambda 表达式？

简单来说，Lambda 表达式是一个**匿名函数**（没有函数名的函数）。

它允许你将**功能（代码块）作为方法参数传递**，或者将代码像数据一样进行处理。它的核心目标是用来简化**函数式接口 (Functional Interface)** 的实现。

---

## 2. 什么是函数式接口？

这是使用 Lambda 表达式的前提。

一个**函数式接口**是指**有且仅有一个抽象方法**的接口。

- Java 中有很多我们熟知的函数式接口，例如：
  - `Runnable` (只有一个 `run()` 方法)
  - `Comparator` (只有一个 `compare()` 方法)
  - `ActionListener` (只有一个 `actionPerformed()` 方法)
- Java 8 在 `java.util.function` 包中新增了大量函数式接口来配合 Lambda，如 `Predicate`, `Consumer`, `Function`, `Supplier` 等。
- 你可以使用 `@FunctionalInterface` 注解来标记一个接口是函数式接口，如果该接口不满足条件（例如，有多个抽象方法），编译器会报错。这个注解是可选的，但建议使用。

---

## 3. Lambda 表达式的语法

Lambda 表达式的语法非常简洁，由三部分组成：

`(parameters) -> { body }`

- **`(parameters)`**：参数列表。
  - 如果没有参数，使用空括号 `()`。
  - 如果只有一个参数，可以省略括号。
  - 参数类型可以省略，编译器会根据上下文自动推断（类型推断）。
- **`->`**：箭头符号，分隔参数和主体。
- **`{ body }`**：方法体，即函数要执行的代码。
  - 如果方法体只有一条语句，可以省略大括号 `{}`。
  - 如果方法体只有一条返回语句，可以同时省略大括号 `{}` 和 `return` 关键字。

### 语法演进示例：

| 场景 | 示例 |
| :--- | :--- |
| 无参数，单语句 | `() -> System.out.println("Hello");` |
| 单参数，单语句 | `name -> System.out.println("Hello, " + name);` |
| 多参数，多语句 | `(a, b) -> { int sum = a + b; return sum; }` |
| 多参数，单返回语句 | `(a, b) -> a + b;` |

---

## 4. 从匿名内部类到 Lambda

Lambda 表达式最直观的好处就是替代冗长的匿名内部类语法。

**场景**：启动一个新线程。

**传统方式 (匿名内部类):**
```java
new Thread(new Runnable() {
    @Override
    public void run() {
        System.out.println("Thread is running...");
    }
}).start();
```
`Runnable` 是一个函数式接口，我们真正关心的只是 `run()` 方法里的代码。

**Lambda 方式:**
```java
new Thread(() -> System.out.println("Thread is running...")).start();
```
代码瞬间变得清晰简洁！编译器知道 `new Thread()` 需要一个 `Runnable` 对象，而 `Runnable` 只有一个 `run()` 方法，该方法无参数、无返回值。所以 `()` 对应 `run()` 的参数，`System.out.println(...)` 对应 `run()` 的方法体。

---

## 5. 常见函数式接口与 Lambda 示例

| 接口 | 抽象方法 | 作用 | Lambda 示例 |
| :--- | :--- | :--- | :--- |
| **`Predicate<T>`** | `boolean test(T t)` | **判断**：接收一个参数，返回布尔值。常用于过滤。 | `s -> s.isEmpty()` |
| **`Consumer<T>`** | `void accept(T t)` | **消费**：接收一个参数，无返回值。常用于处理数据。| `s -> System.out.println(s)` |
| **`Function<T, R>`**| `R apply(T t)` | **转换**：接收一个参数，返回一个结果。常用于映射。 | `s -> s.length()` |
| **`Supplier<T>`** | `T get()` | **供给**：不接收参数，返回一个结果。常用于对象创建。 | `() -> new ArrayList<>()` |
| **`Comparator<T>`**| `int compare(T o1, T o2)` | **比较**：接收两个参数，用于排序。 | `(s1, s2) -> s1.compareTo(s2)` |

### 实战示例：
```java
List<String> names = new ArrayList<>(Arrays.asList("Alice", "", "Bob", "Charlie"));

// 1. 使用 Predicate 过滤掉空字符串
names.removeIf(s -> s.isEmpty()); // names 变为 ["Alice", "Bob", "Charlie"]

// 2. 使用 Consumer 遍历并打印
names.forEach(s -> System.out.println(s));

// 3. 使用 Function 转换 (Stream API)
List<Integer> nameLengths = names.stream()
                                 .map(s -> s.length()) // 将 String 转换为其长度 Integer
                                 .collect(Collectors.toList()); // [5, 3, 7]
```

---

## 6. 方法引用 (Method References)

方法引用是 Lambda 表达式的一种**语法糖**，可以让代码更加简洁。当你想要执行的 Lambda 操作**已经有现成的方法可以实现**时，就可以使用方法引用。

| 方法引用类型 | 语法 | Lambda 示例 | 方法引用示例 |
| :--- | :--- | :--- | :--- |
| 静态方法引用 | `ClassName::staticMethod` | `s -> Integer.parseInt(s)` | `Integer::parseInt` |
| 实例方法引用(特定对象)| `instance::instanceMethod`| `() -> instance.doSomething()`| `instance::doSomething` |
| 实例方法引用(任意对象)| `ClassName::instanceMethod`| `s -> s.toUpperCase()` | `String::toUpperCase` |
| 构造方法引用 | `ClassName::new` | `() -> new String()` | `String::new` |

**示例**：
```java
// Lambda 写法
names.forEach(s -> System.out.println(s));

// 方法引用写法 (更简洁)
names.forEach(System.out::println);
```
这里的 `System.out::println` 等价于 `s -> System.out.println(s)`，因为 `forEach` 方法需要一个 `Consumer<String>`，它的 `accept(String s)` 方法正好可以由 `println(String s)` 方法来实现。
