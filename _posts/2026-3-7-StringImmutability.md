---
title: "Java String 类的不可变性"
date: 2026-3-7
categories: [秋招记录]
tags: [JAVA八股]
---
---
# Java String 类的不可变性 (Immutability)

`String` 类的不可变性是 Java 设计中的一个核心特性。理解其实现方式和设计目的，对于深入掌握Java至关重要。

---

## 1. 什么是不可变性？

一个对象被称为**不可变的 (Immutable)**，如果它在被创建之后，其内部状态（实例变量的值）就不能被修改。

对于 `String` 来说，这意味着一旦你创建了一个字符串对象，比如 `String s = "hello";`，你就无法改变这个对象中存储的 "hello" 这个字符序列。

任何看似修改字符串的方法（如 `toUpperCase()`, `replace()`, `substring()` 等）实际上都不会改变原始字符串。相反，它们会创建一个**新的 `String` 对象**并返回，这个新对象包含了修改后的结果。

```java
String original = "Java";
String modified = original.toUpperCase(); // original.toUpperCase() 返回了一个新的 String 对象

System.out.println(original); // 输出: "Java" (原始字符串没有改变)
System.out.println(modified); // 输出: "JAVA" (这是一个全新的字符串)
```

---

## 2. String 如何被设计为不可变的？

`String` 类的不可变性是通过多种设计机制共同保证的：

### a. `final` Class
`String` 类被 `public final class String` 声明为 `final`。
这意味着**任何类都无法继承 `String` 类**。这杜绝了子类通过重写父类方法来破坏其不可变性的可能性。如果 `String` 可以被继承，子类就有可能创建出可变的字符串版本。

### b. `private final` 内部存储
在 `String` 类的内部，用于存储字符序列的数组被声明为 `private` 和 `final`。

在 JDK 8 及以前，它是：
```java
private final char value[];
```
在 JDK 9 及以后（为了节约空间，引入了紧凑字符串），它是：
```java
private final byte[] value;
```

- **`private`**：确保了外部代码无法直接访问和修改这个内部数组。
- **`final`**：保证了 `value` 这个引用变量在 `String` 对象被构造后，不能再指向另一个数组。**注意**：`final` 只能保证引用的不可变，而不是数组内容的不可变。因此，还需要其他机制来配合。

### c. 没有提供修改内部状态的公共方法 (No "Setters")
`String` 类没有提供任何 `public` 方法来修改其内部的 `value` 数组，比如 `setChar(int index, char c)` 这样的方法。所有可能接触到内部数组的公共方法都被精心设计，以避免暴露或修改内部状态。

### d. 防御性拷贝 (Defensive Copying)
`String` 的构造器在接收外部传入的、可能是可变的数据（如 `char[]` 或 `byte[]`）时，会创建一个内部的、私有的副本，而不是直接使用传入的引用。这可以防止外部代码在 `String` 对象创建后，通过修改原始数组来意外地改变字符串的内容。

```java
char[] externalArray = {'a', 'b', 'c'};
String s = new String(externalArray);

// 即使在创建字符串后修改了外部数组
externalArray[0] = 'x';

// 字符串 s 的内容不会受到影响
System.out.println(s); // 输出: "abc"
```

---

## 3. 为什么要把 String 设计成不可变的？(目的)

将 `String` 设计为不可变带来了几项关键优势：

### a. 字符串常量池 (String Pool) 的需要
Java 中最主要的性能优化之一就是字符串常量池。如果字符串是可变的，常量池就无法实现。

- **工作原理**：当你创建一个字符串字面量（如 `String s1 = "hello";`）时，JVM 会在常量池中查找是否已存在 "hello" 这个值的字符串。如果存在，就直接返回其引用；如果不存在，就创建一个新的 `String` 对象放入池中，并返回其引用。
- **优势**：`String s1 = "hello"; String s2 = "hello";` 这段代码中，`s1` 和 `s2` 指向的是常量池中同一个对象，极大地节省了内存。
- **前提**：如果 `String` 是可变的，那么一个引用（如 `s1`）修改了字符串的值，会导致所有指向该对象的引用（如 `s2`）的值都意外地改变，这将引发灾难性的后果。

### b. 线程安全 (Thread Safety)
不可变对象是**天生线程安全**的。因为它们的状态无法被修改，所以可以在多个线程之间自由共享，而无需任何额外的同步措施（如 `synchronized` 锁）。这大大简化了并发编程，并提升了性能。

### c. 安全性 (Security)
在很多场景下，`String`被用来存储敏感信息或作为方法的重要参数，例如：
- 网络连接的 **主机名和端口**
- 数据库连接的 **用户名和密码**
- 文件系统的 **文件路径**

如果 `String` 是可变的，这些值在传递过程中（例如，在安全检查之后、实际使用之前）可能会被恶意代码篡改，从而引发严重的安全漏洞。例如，一个方法检查了文件路径的权限后，路径可能被修改为指向一个敏感文件。不可变性杜绝了这种风险。

### d. 作为 `HashMap` 的 Key
`String` 是作为 `HashMap` 等哈希集合的 `key` 的绝佳选择。
因为 `String` 是不可变的，所以它的 `hashCode()` 值在创建时就可以被计算并缓存起来。当把 `String` 对象作为 `key` 放入 `HashMap` 时，它的哈希码不会改变，这保证了每次都能准确地找到 `key` 对应的 `value`。

如果 `String` 是可变的，`key` 的内容发生改变会导致 `hashCode()` 改变，那么 `HashMap` 内部的结构就会被破坏，你将再也无法找回存入的对象。
