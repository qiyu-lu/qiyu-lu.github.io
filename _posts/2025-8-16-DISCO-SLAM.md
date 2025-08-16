---
title: "SLAM 算法复现记录：DiSCo-SLAM"
date: 2025-08-16
categories: [SLAM算法复现]
tags: [DiSCo-SLAM, Ubuntu, ROS]
---

DiSCo-SLAM：一个分布式的多机SLAM

# 1. 项目基本信息

- **系统**：Ubuntu 20.04  
- **ROS 版本**：Noetic  
- **项目地址**：[https://github.com/RobustFieldAutonomyLab/DiSCo-SLAM](https://github.com/RobustFieldAutonomyLab/DiSCo-SLAM)
- 这是我的复现过程记录，并非教程，因此会有一些不必要的操作

# 2. 算法复现

```bash
git clone https://github.com/yeweihuang/LIO-SAM.git
cd LIO-SAM/src
git clone git@github.com:RobustFieldAutonomyLab/DiSCo-SLAM.git
# 然后安装libnabo 1.0.7，下载源代码压缩包，解压，
cd libnabo-1.0.7/
# 进入源码目录并创建编译目录, 假设你在 libnabo 源码根目录下：
SRC_DIR=`pwd`
BUILD_DIR=${SRC_DIR}/build
mkdir -p ${BUILD_DIR} && cd ${BUILD_DIR}
# 运行 CMake 指定安装路径, 使用 -DCMAKE_INSTALL_PREFIX 参数指定安装位置，例如安装到 /your/custom/path：
cmake -DCMAKE_INSTALL_PREFIX=/your/custom/path ${SRC_DIR}
# 替换 /your/custom/path 为你想要安装的目标路径。如果不指定此参数，默认会安装到系统目录（比如 /usr/local）。
# 我是cmake -DCMAKE_INSTALL_PREFIX=/home/sd101t/third_party/libnabo_1.0.7 ${SRC_DIR}
# 编译项目
cmake --build .
# 安装项目, 使用以下命令安装（可能需要 sudo 权限，如果安装路径需要写入系统目录）：
sudo cmake --build . --target install
```
然后修改cmakelist文件内容：

```cmake
find_package(libnabo REQUIRED PATHS /your/custom/path NO_DEFAULT_PATH)
```

这里的 /your/custom/path 应该是包含 libnaboConfig.cmake 或 libnabo-config.cmake 文件的目录。如果你希望 CMake 同时在默认路径和你指定的路径中搜索，可以去掉 NO_DEFAULT_PATH 选项。
在include_directories中添加对应的include路径  /home/sd101t/third_party/libnabo_1.0.7/include/
由于这是凭记忆写的，具体错误没记得，好像参考了 [https://github.com/RobustFieldAutonomyLab/DiSCo-SLAM/issues/4](https://github.com/RobustFieldAutonomyLab/DiSCo-SLAM/issues/4)