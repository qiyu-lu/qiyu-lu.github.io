---
title: "SLAM 算法复现记录：Adaptive-LIO算法复现"
date: 2025-08-25
categories: [SLAM算法复现]
tags: [SLAM, Adaptive-LIO]
---

Adaptive-LIO：一种自适应的slam算法

# 1. 项目基本信息

- **系统**：Ubuntu 20.04  
- **ROS 版本**：Noetic  
- **项目地址**：[https://github.com/chengwei0427/Adaptive-LIO](https://github.com/chengwei0427/Adaptive-LIO)
- 这是我的复现过程记录，并非教程，因此会有一些不必要的操作

# 2. 复现过程

## 2.1 ceres错误

- 先确定所需要的依赖是否已经安装，我这里由于之前安装过好几个版本的，就直接编译看报错了

- `catkin_make` 时报错

![catkin_make结果](/assets/images/2025-08-25_Adaptive-LIO_1.png)

- 系统找不到 **找不到 Ceres Solver 版本 2**，我之前将其安装到自定义路径下了，然后进入 `src/Adaptive-LIO/cmake/packages.cmake` 文件中进行修改，在第62行，修改为:

```cmake
find_package(Ceres 2 REQUIRED PATHS /home/sd101t/third_party/ceres_solver_2.1.0)
```
**PATHS**：指定一个或多个搜索目录。

继续报错

![catkin_make结果](/assets/images/2025-08-25_Adaptive-LIO_2.png)

- 原因：

我现在的 Ceres 2.1.0 是 当时用 Eigen 3.3.7 编译的；

但是机器上运行 Adaptive-LIO 的时候，CMake 找到了 Eigen 3.4.0；

两个版本不一致 → CeresConfig.cmake 直接报错并 set(Ceres_FOUND=FALSE)。

安装eigen 3.3.7到自定义路径中，下载地址: [https://eigen.tuxfamily.org/index.php?title=Special%3AAllPages&from=&to=&namespace=100](https://eigen.tuxfamily.org/index.php?title=Special%3AAllPages&from=&to=&namespace=100)，但是发现3.3.7下载不了，不清楚为什么

于是我打算重新编译ceres，下载地址： [https://github.com/ceres-solver/ceres-solver/releases/tag/2.1.0](https://github.com/ceres-solver/ceres-solver/releases/tag/2.1.0)
安装教程： [http://ceres-solver.org/installation.html#linux](http://ceres-solver.org/installation.html#linux)

```bash
tar zxf ceres-solver-2.1.0.tar.gz
cd ceres-bin_2.1.0/
mkdir build
cd build/
cmake .. -DCMAKE_INSTALL_PREFIX=/home/sd101t/third_party/ceres_2.1.0_install -DBUILD_TESTING=OFF -DBUILD_EXAMPLES=OFF  # 这是我自己之前创建的ceres目录
make -j16
make install
```
然后cmakelists修改为： 使用 HINTS 与 PATHS 都可以

```cmake
find_package(Ceres 2 REQUIRED
             HINTS /home/sd101t/third_party/ceres_2.1.0_install)
```


## 2.2 C++ 语言特性与你当前编译器标准的冲突

- 报错：

![](/assets/images/2025-08-25_Adaptive-LIO_3.png)

- 升级编译器 & 标准，修改cmakelists的内容
`set(CMAKE_CXX_STANDARD 17)`