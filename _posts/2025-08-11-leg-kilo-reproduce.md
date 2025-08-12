---
title: "SLAM 算法复现记录：Leg-KILO"
date: 2025-08-11 
categories: [SLAM算法复现]
tags: [Leg-KILO, Ubuntu, OpenCV, ROS]
---
- 腿部里程计slam

## 1. 项目基本信息

- **系统**：Ubuntu 20.04  
- **ROS 版本**：Noetic  
- **项目地址**：[https://github.com/ouguangjun/Leg-KILO](https://github.com/ouguangjun/Leg-KILO)  
- **主要问题**：opencv 版本不兼容

---

## 2. 问题与解决过程

### 2.1 OpenCV 版本不兼容

#### 查看已安装 opencv 版本

```bash
# 这里放命令
dpkg -l | grep opencv
```

- 输出显示当前版本为 4.2.0，Leg-KILO 需要 3.2.0

#### 下载并编译 OpenCV 3.2.0

1. [OpenCV 3.2.0 源码下载页面](https://github.com/opencv/opencv/releases/tag/3.2.0)
2. 解压并进入目录，进行编译安装，我选择安装在我的自定义路径：

```bash
cd opencv-3.2.0
mkdir build && cd build 
cmake -DCMAKE_BUILD_TYPE=Release  -D ENABLE_PRECOMPILED_HEADERS=OFF -DCMAKE_INSTALL_PREFIX=/home/sd10/third_party/opencv-3.2 -DBUILD_SHARED_LIBS=ON ..
```

#### 编译报错截图

![编译报错示例](/assets/images/leg-kilo_image1.png)

#### 解决办法

- 参考 [CSDN 解决方法链接](https://blog.csdn.net/studyvcmfc/article/details/124100939)
- 安装OpenCv 3.1的过程中要下载ippicv_linux_20151201，由于网络的原因，这个文件经常会下载失败，解决的办法是手动下载，手动下载 `ippicv_linux_20151201.tgz`，替换同名目录：

```bash
# 这里放命令
cp ~/Downloads/ippicv_linux_20151201.tgz /home/sd10/Downloads/opencv-3.2.0/3rdparty/ippicv/downloads/linux-808b791a6eac9ed78d32a7666804320e/
```

---

### 2.2 make 过程其它报错及解决

#### 报错信息截图
![make error](/assets/images/leg-kilo_image2.png) 

```bash
error: 'CODEC_FLAG_GLOBAL_HEADER' was not declared in this scope
error: invalid conversion from ‘const char*’ to ‘char*’ [-fpermissive]

```

#### 解决办法

- 参考 [CSDN 解决方法链接](https://blog.csdn.net/qq_45068787/article/details/127658803)
- 修改 `cap_ffmpeg_impl.hpp` 文件顶端添加：

```cpp
#define AV_CODEC_FLAG_GLOBAL_HEADER (1 << 22)
#define CODEC_FLAG_GLOBAL_HEADER AV_CODEC_FLAG_GLOBAL_HEADER
#define AVFMT_RAWPICTURE 0x0020
```

- 修改 `/home/sd10/Downloads/opencv-3.2.0/modules/python/src2/cv2.cpp` 文件：

```cpp
char* str = PyString_AsString(obj);
```
-改为：
```cpp
char* str = (char *)PyString_AsString(obj);
```

## 3. 项目编译与安装

```bash
make -j8
sudo make install
```

---

## 4. 多版本 OpenCV 管理

- 修改 `CMakeLists.txt`，指定 OpenCV 3.2 路径

```cmake
# find_package(OpenCV REQUIRED QUIET)
find_package(OpenCV 3.2 REQUIRED PATHS /home/sd10/third_party/opencv-3.2/share/OpenCV)  #这是我的自定义路径注意修改
```

---

## 5. ROS 启动报错及解决

### roslaunch报错信息截图
![roslaunch error](/assets/images/leg-kilo_image3.png) 

### 检查库文件是否存在

```bash
ls /usr/local/lib | grep libmetis-gtsam.so
ls -l /usr/local/lib | grep libmetis-gtsam.so
```
### 显示
![权限显示](/assets/images/leg-kilo_image4.png) 

### 修改权限

- 修改文件权限，为了确保其他用户（比如你的当前用户）能够执行这个库文件，我们可以修改它的权限，使其对所有用户都具有可执行权限
- 修改权限后，建议运行 ldconfig 来更新系统的库缓存
```bash
sudo chmod 755 /usr/local/lib/libmetis-gtsam.so
sudo ldconfig
```

---
