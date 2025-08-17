---
title: "SLAM 算法复现记录：FAST_LIO_SAM"
date: 2025-08-16
categories: [SLAM算法复现]
tags: [SLAM, FAST_LIO_SAM, Ubuntu, ROS]
---

FAST_LIO_SAM：在FAST-LIO2的基础上，添加SC-PGO模块

# 1. 项目基本信息

- **系统**：Ubuntu 20.04  
- **ROS 版本**：Noetic  
- **项目地址**：[https://github.com/kahowang/FAST_LIO_SAM](https://github.com/kahowang/FAST_LIO_SAM)
- 这是我的复现过程记录，并非教程，因此会有一些不必要的操作

# 2. 算法复现

catkin_make时报错：
![catkin_make结果](/assets/images/FAST_LIO_SAM_image1.png)

解决：
去官方那安装： [https://github.com/Livox-SDK/livox_ros_driver](https://github.com/Livox-SDK/livox_ros_driver)
编译之后，在FAST_LIO_SAM编译处 source 一下 livox_ros_driver 的 setup.bash ：
`source /home/sd101t/third_party/livox_ros_driver/devel/setup.bash` ，然后报错
![catkin_make结果](/assets/images/FAST_LIO_SAM_image2.png)

缺乏库，进行安装，我是下载的2.0的源码压缩包：[https://github.com/geographiclib/geographiclib/releases/tag/v2.0](https://github.com/geographiclib/geographiclib/releases/tag/v2.0)
然后
```bash
cd geographiclib
mkdir build && cd build
cmake ..
make -j$(nproc)
sudo make install
```

安装在-- Installing: /usr/local/lib/pkgconfig/geographiclib.pc这个路径，然后编译成功。