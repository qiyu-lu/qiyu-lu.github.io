---
title: "Java中的 `==`, `equals()` 和 `hashCode()`"
date: 2026-3-7
categories: [Java]
tags: [JAVA八股]
---
---

# Java中的 `==`, `equals()` 和 `hashCode()`

在Java中，对象的比较是一个非常基础且重要的概念。正确理解 `==` 运算符、`equals()` 方法和 `hashCode()` 方法之间的区别和联系，对于编写健壮的代码至关重要，尤其是在处理集合类（如 `HashMap`, `HashSet`）时。

---

## 1. `==` vs `equals()`

这两者都用于比较，但比较的“东西”完全不同。

### `==` 运算符

`==` 的行为取决于比较的是**基本数据类型**还是**引用类型**。

- **比较基本数据类型 (Primitive Types)**
  当用于 `byte`, `short`, `char`, `int`, `long`, `float`, `double`, `boolean` 这些基本类型时，`==` 比较的是它们的 **值**。

  ```java
  int a = 10;
  int b = 10;
  System.out.println(a == b); // 输出: true

  char c1 = 'A';
  char c2 = 'B';
  System.out.println(c1 == c2); // 输出: false
  ```

- **比较引用类型 (Reference Types)**
  当用于对象时，`==` 比较的是两个引用是否指向堆内存中的 **同一个对象实例**，即比较的是它们的 **内存地址**。

  ```java
  String s1 = new String("hello");
  String s2 = new String("hello");
  String s3 = s1;

  System.out.println(s1 == s2); // 输出: false (s1 和 s2 是两个不同的对象，地址不同)
  System.out.println(s1 == s3); // 输出: true (s3 和 s1 指向同一个对象)
  ```

### `equals()` 方法

`equals()` 是 `java.lang.Object` 类中定义的一个方法，这意味着所有Java对象都继承了这个方法。

- **`Object` 类的默认实现**
  `Object` 类中 `equals()` 方法的默认实现与 `==` 的行为完全相同，也是比较对象的内存地址。
  ```java
  // Object.java 的源码
  public boolean equals(Object obj) {
      return (this == obj);
  }
  ```

- **重写 (Override) `equals()`**
  很多类（如 `String`, `Integer`, `Date` 等）都重写了 `equals()` 方法，以便比较对象的内容（状态）而不是内存地址。例如，`String` 类重写了 `equals()` 来比较两个字符串的字符序列是否相同。

  ```java
  String s1 = new String("hello");
  String s2 = new String("hello");

  System.out.println(s1.equals(s2)); // 输出: true (因为 String 类重写了 equals 方法，比较的是内容)
  ```

### 小结

| 比较方式 | `==` | `equals()` |
| :--- | :--- | :--- |
| **基本类型** | 比较值 | N/A (基本类型没有方法) |
| **引用类型** | 比较内存地址 | 默认比较内存地址，但通常被重写以比较内容 |

---

## 2. `equals()` 与 `hashCode()` 的契约

`hashCode()` 方法也来自 `Object` 类，它返回对象的哈希码（一个 `int` 类型的值）。这个值主要用于提高哈希表（如 `HashMap`, `HashSet`）的性能。

`equals()` 和 `hashCode()` 之间有一个必须遵守的严格约定（契约）：

1.  **`equals` 相等，`hashCode` 必相等**：
    如果两个对象通过 `equals()` 方法比较返回 `true`，那么它们的 `hashCode()` 方法必须返回相同的整数值。

2.  **`hashCode` 相等，`equals` 不一定相等**：
    如果两个对象的 `hashCode()` 返回值相同，它们的 `equals()` 方法不一定返回 `true`。这种情况被称为“哈希冲突”。

3.  **`equals` 不等，`hashCode` 不要求**：
    如果两个对象通过 `equals()` 方法比较返回 `false`，那么它们的 `hashCode()` 方法没有强制要求，但为了性能，最好让它们返回不同的值。

### 为什么必须遵守这个契约？

哈希集合（如 `HashSet`）在添加元素时，会先计算元素的 `hashCode()` 来确定其在集合中的存储位置（桶/bucket）。

- **如果只重写 `equals()` 而不重写 `hashCode()`：**
  这会违反第一条约定。你创建了两个内容相同的对象，它们 `equals()` 结果为 `true`。但因为它们是不同实例，继承自 `Object` 的 `hashCode()` 方法会返回两个不同的哈希码。当你把它们都加入 `HashSet` 时，集合会认为它们是两个不同的对象（因为哈希码不同），导致集合中出现重复的元素，这违背了 `Set` 的定义。

**示例：**

假设有一个 `Person` 类，我们认为同名同年龄就是同一个人。

```java
// 错误示范：只重写了 equals
class Person {
    String name;
    int age;
    // ... 构造器 ...

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Person person = (Person) o;
        return age == person.age && Objects.equals(name, person.name);
    }

    // 没有重写 hashCode()!
}

// 测试
Set<Person> set = new HashSet<>();
set.add(new Person("张三", 20));
set.add(new Person("张三", 20));

System.out.println(set.size()); // 输出会是 2，而不是期望的 1
```

### 如何正确地重写 `equals()` 和 `hashCode()`

**最佳实践是同时重写这两个方法，并使用 `java.util.Objects` 工具类来简化代码和处理 `null` 值。**

```java
// 正确示范
import java.util.Objects;

class Person {
    String name;
    int age;
    // ... 构造器 ...

    @Override
    public boolean equals(Object o) {
        // 1. 检查是否是同一个对象的引用
        if (this == o) return true;
        // 2. 检查对象是否为 null，以及类型是否匹配
        if (o == null || getClass() != o.getClass()) return false;
        // 3. 类型转换并比较属性
        Person person = (Person) o;
        return age == person.age && Objects.equals(name, person.name);
    }

    @Override
    public int hashCode() {
        // 使用 Objects.hash() 根据相同的属性生成哈希码
        return Objects.hash(name, age);
    }
}

// 再次测试
Set<Person> set = new HashSet<>();
set.add(new Person("张三", 20));
set.add(new Person("张三", 20));

System.out.println(set.size()); // 输出: 1，符合预期！
```

---

## 总结

- `==` 用于比较内存地址（引用类型）或值（基本类型）。
- `equals()` 用于比较对象的内容，但需要正确地重写它。
- 当你重写 `equals()` 方法时，**必须** 同时重写 `hashCode()` 方法，以保证对象在哈希集合中行为正确。

现代IDE（如 IntelliJ IDEA）都可以自动为你生成健壮的 `equals()` 和 `hashCode()` 实现。
