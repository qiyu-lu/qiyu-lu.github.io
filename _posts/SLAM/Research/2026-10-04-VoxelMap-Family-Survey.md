---
title: "论文综述：VoxelMap 体素地图家族与地图表示"
date: 2026-10-04
categories: [SLAM, 论文综述]
tags: [论文综述, VoxelMap, 地图表示, LIO]
math: true
---

在 LiDAR(-惯性) 里程计中，scan-to-map 配准的精度很大程度上取决于地图怎么组织、地图里的几何基元怎么表示。传统的 kd-tree / ikd-tree 点云地图只存点，每次配准临时用最近邻拟合平面，并把这个平面当作确定性的真值。2022 年的 VoxelMap 给体素里的平面加上了概率模型和自适应划分，此后陆续出现一批后继工作，分别在效率、平面质量和基元类型上做改进。本文梳理其中六篇体素地图工作（VoxelMap、VoxelMap++、C³P-VoxelMap、R-VoxelMap、Hybrid VoxelMap、CT-VoxelMap），另外加入一篇思路不同的点云组织结构工作 Onion-LO 作为对照。

## 论文速览

| 论文 | 出处 | 一句话概括 | 代码 |
|---|---|---|---|
| VoxelMap | IEEE RA-L 2022 | Hash + 八叉树的 coarse-to-fine 自适应体素，体素内存储带不确定性的概率平面 | [链接](https://github.com/hku-mars/VoxelMap) |
| VoxelMap++ | IEEE RA-L 2024 | 3DoF 平面参数化，再用并查集把跨体素的共面小平面合并成大平面 | [链接](https://github.com/uestc-icsp/VoxelMapPlus_Public) |
| C³P-VoxelMap | IROS 2024 | 平面协方差改写成固定数量的累积统计量，不再缓存历史点，并用 LSH 按需合并体素 | [链接](https://github.com/deptrum/c3p-voxelmap) |
| R-VoxelMap | IEEE RA-L 2026 | 用 RANSAC 递归拟合平面，外点下放到八叉树更深层复用，并加点分布连通性校验 | [链接](https://github.com/NKU-MobFly-Robotics/R-VoxelMap)（作者承诺开源） |
| Hybrid VoxelMap | IEEE RA-L 2026 | 由语义分割决定体素是平面还是高斯，点到面与点到分布两类残差统一尺度后联合更新 | [链接](https://github.com/haiyang2022/Hybrid-VoxelMap)（论文称发表后释放） |
| CT-VoxelMap | arXiv 2026 | 累积 B 样条连续时间 IEKF，配合平面与体素特征混合的概率体素地图 | 未开源（作者承诺开源） |
| Onion-LO | IEEE RA-L 2025 | 球面分区加距离分层，体素尺寸随距离增大，一个尺度因子统一调节下游参数 | [链接](https://github.com/huashu996/Onion-LO) |

## 发展脉络

### 起点：从确定性平面到概率平面

VoxelMap 的出发点是：点云地图承载不了**地图侧的不确定性**。ICP 类方法用几个最近邻点拟合出平面，再把它当作确定的真平面；可是最近邻点数少，拟合结果并不可靠，而且最近邻集合一变就得重算，代价很高。VoxelMap 的做法是显式参数化环境中的平面，让它跨帧持续存在，并估计它的参数和协方差。

为此，VoxelMap 提供了两件后续工作基本都会沿用的东西：一是**点的不确定性模型**，把测距噪声、方位噪声和位姿估计误差一起传播到世界系；二是**平面的不确定性模型**，借助 BALM 的特征分解雅可比，把点协方差一阶传播成平面法向与中心点的 6×6 联合协方差。在此之上，它用 Hash 表索引根体素，每个根体素下挂一棵八叉树，按 coarse-to-fine 的方式细分，以适应 LiDAR 点云由稀到密累积的特点。

VoxelMap 的消融实验有一个结论：关掉概率平面后（平面协方差置零），精度退回到 FAST-LIO2 的水平；关掉自适应体素（固定 2 m 体素）后性能有所下降，但仍优于全部对比方法。作者因此认为，概率平面表示对精度的贡献远大于自适应体素化。后续各篇基本都接受了"概率加权"这一前提，改动集中在"平面怎么估得更准、存得更省"，以及"体素里不是平面时怎么办"。

### 效率与大平面：合并路线

VoxelMap 有两个代价：平面不确定性的更新需要保留体素内的历史点；一个物理上的大平面（墙、地面、天花板）会被许多小体素重复表示，每块分到的点也不多。

**VoxelMap++** 把平面参数化成 3DoF 形式 $$ax+by+z+d=0$$，最小二乘里用到的都是求和量，可以增量更新。它再用卡方检验判断相邻体素是否共面，用并查集合并共面的体素：合并后的父平面由所有子平面共享，子平面的内存随即释放。体素边长取 0.5 m 且不用八叉树，相当于用横向合并替代了纵向细分。作者认为，在走廊场景中，合并后的地面、天花板和尽头墙面协方差更小，滤波器会更多依赖它们，从而缓解纵向退化和 pitch 漂移。

**C³P-VoxelMap** 认为，体素里的内存主要被点占用，所以 3DoF 参数化能省下的空间有限。它的核心是一段推导：把依赖特征分解结果的部分从求和中分离出来后，平面协方差只需要每个平面维护 69 个标量统计量，与点数无关。这样空间复杂度从 $$O(N)$$ 降到 $$O(1)$$，体素不必再缓存历史点。合并因此也很简单：用 5 维 LSH 键（法向的两个球坐标、平面截距，以及体素在平面上的投影坐标）把参数空间相近的体素放进同一个桶，桶里的体素攒够后才触发合并，合并时统计量可以直接相加。投影坐标这两维用来区分参数相同、空间上却相距很远的平面。

这两篇的共同思路是让大平面在地图里成为一个整体，差别主要在合并判据（卡方检验比较平面参数，还是 LSH 键同时编码平面参数与空间投影位置）、触发方式（每轮更新时检查邻居，还是桶内攒够体素才触发），以及合并后的平面参数怎么得到（按协方差的迹加权融合，还是把累积统计量直接相加）。

### 体素内不止一个平面：提取质量与混合基元

另一条思路关心的是体素里的点本身。**R-VoxelMap** 的作者认为，合并路线在合并之前仍然用体素内全部点（包括外点）拟合小平面，初始平面可能已经有偏差，进而导致合并不完全或合并错误。另外，收紧平面性阈值能减少外点混入，却会造成过分割，阈值放宽又会让平面被外点带偏。它的做法是在提取阶段处理外点：先用 RANSAC 分离内外点，外点不丢弃，而是下放到八叉树更深一层继续拟合（detect-and-reuse）；八叉树的每个节点（不只是叶节点）都可以存平面；再把内点投影到二维网格上做连通性聚类，检查这个平面在空间上是否真的连续存在。

**Hybrid VoxelMap** 和 **CT-VoxelMap** 则认为有些体素本来就不该用平面表示，提不出平面时改用分布来描述，两者的区别在于怎么判定。Hybrid VoxelMap 用 RandLA-Net 的语义标签映射成"平面/非平面"两个超类作为先验，同时保留几何上的否决权：语义判为平面但几何拟合不过关时，也会降级为高斯体素。CT-VoxelMap 只看几何：体素细分到最大深度仍提不出平面，就改用体素特征，三个特征方向分别构造残差。两者都需要把点到面和点到分布这两种残差放进同一个滤波器，Hybrid VoxelMap 为此专门设计了尺度归一化。

### 地图作为模块与其他组织方式

CT-VoxelMap 的主要贡献在时间表示上：它用累积 B 样条表示连续轨迹，并在 IEKF 中估计样条控制点的增量，地图部分在 VoxelMap 的概率自适应体素基础上增加了体素特征。它在地图方面只引用了 VoxelMap，没有与其他家族成员对比，可以看作把概率体素地图当作一个模块接入连续时间估计框架。

**Onion-LO** 走的是另一条路。VoxelMap 家族在笛卡尔坐标下先统一划分体素，再通过细分或合并来适应点密度。Onion-LO 改用球面分区加距离分层，让体素尺寸随距离线性增大，抵消 LiDAR 近密远疏的密度梯度，所以从一开始就不需要细分或合并。参数方面，它用一个由当前帧算出的尺度因子统一调节降采样、局部地图密度、近邻搜索半径和残差权重。它关注的问题是跨雷达、跨场景的泛化，系统只用 LiDAR。

## 逐篇要点

### VoxelMap

**问题**：点云地图无法表达平面的不确定性，固定尺寸的体素又难以适应不同尺度的环境和 LiDAR 点密度的变化。

**方法**：对每个点建模测距和方位噪声，并叠加位姿协方差，传播到世界系；平面协方差由点协方差一阶传播得到：

$$
\Sigma_{n,q}=\sum_{i=1}^{N}\frac{\partial f}{\partial \mathbf{p}_i}\,\Sigma_{\mathbf{p}_i}\,\frac{\partial f}{\partial \mathbf{p}_i}^\top
$$

地图采用 Hash 加八叉树结构，根体素默认 3 m，最多细分 3 层。平面不确定性大约在 50 个点时收敛，此后丢弃历史点，只保留最新 10 个点用来检测地图是否发生变化。匹配时用 3σ 检验，选概率最高的平面，观测噪声逐点计算，送入 IEKF。

**实验**：在 KITTI 00–10 上总体最优，长序列上优势更明显；在 L515 室内手持数据上精度和耗时都优于 SSL_SLAM；在 Avia 公园/山地数据上优于 Faster-LIO 和 FAST-LIO2；单帧耗时在对比方法中最低。全部序列使用同一组参数。

**局限**：作者指出目前只使用平面特征，未来计划引入边缘等其他特征。

### VoxelMap++

**问题**：6DoF 平面表示存在冗余，相邻体素之间的关系没有被利用，单个体素内拟合用的点也偏少。

**方法**：3DoF 平面参数化，法向分量过小时切换归一化的主轴；最小二乘的统计量都可以增量维护。共面判据是卡方检验：

$$
\gamma=\mathbf{r}\left(\Sigma_{1}+\Sigma_{2}\right)^{-1}\mathbf{r}^\top\sim\chi^2(1)
$$

通过检验就用并查集合并，按协方差的迹加权融合，并查集最大深度限制为 2。体素边长 0.5 m，不使用八叉树。

**实验**：在 M2DGR 和 KITTI 的多数序列上优于对比方法；关掉合并后的 3DoF 版本与 VoxelMap 精度基本持平，表明 3DoF 表示本身不损失精度，提升主要来自合并。在森林、草坪等非结构化场景中，VoxelMap 和 VoxelMap++ 都明显优于 FAST-LIO2 等方法。内存和 CPU 占用都低于 VoxelMap。

**局限**：作者承认动态场景下鲁棒性明显下降：在 M2DGR 的电梯序列中，门上的体素在门关闭前已经收敛，之后持续发生错配。作者提出未来可以识别发生变化的体素。作者说明论文侧重工程实现而非精度；自采数据没有公开。

### C³P-VoxelMap

**问题**：概率体素地图需要保留全部历史点，才能更新平面不确定性；规则体素难以表示大尺度平面；固定体素尺寸面临偏差与方差的权衡。

**方法**：把法向协方差写成 $$\Sigma_{nn}=U B U^\top$$，再用迹技巧把 $$B$$ 拆成三组与特征分解无关的累积量 $$X_{j,k}$$、$$Y_j$$、$$Z$$，每个平面共 69 个标量。合并时，用 5 维 LSH 键分桶，以点数最多的体素为参考体素，统计量直接相加。作者还做了理论分析：两组共面点合并后，协方差增加的秩 1 项落在平面内，不会放大法向方向的方差。

**实验**：全部方法强制单线程测试。在 KITTI 上平均 ATE 为 2.74 m，同表中 VoxelMap 为 3.95 m；在 UTBM 上为 11.09 m，VoxelMap 为 13.13 m。地图更新耗时比 VoxelMap 少 70%（不合并）和 49%（合并），总耗时少约 20%；总内存约少 70%，内存随每体素点数增加基本保持不变。

**局限**：消融只比较了开启与关闭合并两种设置，并且只报告了耗时，没有单独评估累积更新对精度的贡献；LSH 桶宽等参数没有做敏感性分析；自采室内数据没有公开。

### R-VoxelMap

**问题**：用体素内全部点拟合平面，对外点敏感；收紧阈值会导致过分割；合并路线可能把物理上分离的平面错误地合到一起。

**方法**：递归构建八叉树。每个节点先用 RANSAC 分离内外点，内点占比足够且平面性满足要求时，在当前节点存储平面，外点细分到子体素后递归处理。平面有效性校验把内点投影到平面上的二维网格，用 DFS 做四邻域聚类，取最大的簇重新拟合。平面协方差只在有效内点上求和。点集用链表存储，便于零拷贝拼接；八叉树会周期性重建，大场景下用 LRU 控制内存。

**实验**：KITTI 平均 ATE 2.570 m，作者报告相对现有最优方法提升超过 20%，在几何贫乏的 01、02 序列上提升最明显。在 M2DGR 街道序列上优势明显；在 NTU VIRAL 的 spms_03 上只略好于 VoxelMap，作者解释为结构规整、外点少的场景中两者拟合出的平面接近。在几乎所有序列上耗时和内存都低于 VoxelMap；在 KITTI 00/01 上用 5 个随机种子重复，结果稳定。

**局限**：作者承认 VoxelMap 类框架仍然对多个参数高度敏感，未来计划降低参数敏感性；消融中没有"去掉 RANSAC"这一档；自采数据没有公开。

### Hybrid VoxelMap

**问题**：单一的环境表示和单一的残差类型，很难同时兼顾结构化场景的精度和非结构化场景的鲁棒性；把几何残差和概率残差混在一起用时，关键是保证两者尺度一致。

**方法**：RandLA-Net 在独立线程中低频运行，体素标签由多数投票决定。平面体素沿用 VoxelMap++ 的 3DoF 参数化和并查集合并；非平面体素或平面拟合失败的体素存为高斯分布。点到分布残差先算马氏距离，再乘以体素的平均尺度，转换回米制：

$$
r=-\sigma_{avg}\sqrt{(\mathbf{p}-\mu)^\top\Sigma^{-1}(\mathbf{p}-\mu)},\qquad \sigma_{avg}=\sqrt{\mathrm{tr}(\Sigma)/3}
$$

两类残差都有闭式方差，再结合 Huber 权重，一起进入 IESEKF。

**实验**：结构化室内与 C³P-VoxelMap 基本持平；结构化室外相对 iG-LIO 的 RMSE 降低 7.1%；在自采的、包含玻璃幕墙和植被的长距离序列上全面领先，Z 轴改善尤其明显。内存低于平面拟合类体素方法。

**局限**：作者指出，固定体素尺寸会漏掉细小的平面结构；对语义分割的依赖意味着误分类会影响精度；室内序列上预训练模型泛化不足，导致完整版与纯高斯版本相当。单帧耗时高于其他体素方法；需要 GPU 运行分割网络；自采数据没有说明是否公开。

### CT-VoxelMap

**问题**：快速运动和崎岖地形下的定位；现有 B 样条连续时间方法的雅可比需要处理边界条件，而且没有考虑样条与真实轨迹之间的拟合误差。

**方法**：估计控制点增量 $$\mathbf{d}_{R,j}=\mathrm{Log}(R_{i+j-1}^{-1}R_{i+j})$$，而不是控制点本身，这样状态留在欧氏空间，边界条件在推导中自动统一。新增控制点建模为混合系统中的离散跳变。用优化或传播得到的位姿与样条插值位姿之差，估计拟合误差协方差，并把它加进 LiDAR 观测噪声。地图在 VoxelMap 的基础上加入体素特征，作为点到分布残差。另有 re-estimation 策略，把一次大规模更新拆成若干次小更新。

**实验**：在 MCD、M2UD、MARS-LVIG、DiTer++ 四个数据集上与 CLIC、FAST-LIO2、RESPLE、FAST-LIVO2 对比，多数序列取得最优或并列最优。消融中，不建模拟合误差时，三个数据集的成功率都是 0/10；不使用 re-estimation 时，MARS-LVIG 上同样无法运行。体素特征在 MCD 上略有负面影响，在另外两个数据集上有益。

**局限**：作者指出，本文只讨论了颠簸和快速运动场景，扩展到高动态、遮挡严重的环境还需要进一步工作；在传感器严重退化时，re-estimation 的效果可能减弱；在 M2UD 的 aggressive04 序列上，由于 IMU 读数突变且没有专门处理，纯 LiDAR 版本优于融合 IMU 的版本。目前仅为 arXiv 预印本，代码尚未发布；样条节点频率按数据集分别设置。

### Onion-LO

**问题**：LiDAR 里程计换一种雷达或换一个场景就容易失效。作者把原因归为三点：设计绑定了特定的雷达或场景；点云分布发生变化；参数在运行期间固定不变。

**方法**：以"方向分区 + 距离层"作为哈希键，层内体素尺寸为 $$v_j=R\,D_j\sin\delta$$，其中层厚 $$R=5$$ m、$$\delta=3^\circ$$。由当前帧的有效体积和期望关键点数算出尺度因子：

$$
F_k=\sqrt[3]{\frac{V_k}{N_{exp}^{key}}}
$$

尺度因子 $$F_k$$ 同时决定降采样尺寸、局部地图点间距、近邻搜索半径和残差置信权重。点云按几何特征值和强度特征分为平面点与非平面点，分别使用点到面和点到线残差。系统只用 LiDAR，运动补偿采用匀速模型。

**实验**：在 12 种雷达、8 类场景中，$$F_k$$ 的变化范围是 0.2–3.3 m，关键点数始终稳定在 1000 附近。NCLT 平均 ATE 为 1.63 m，同表中 FAST-LIO2 为 2.95 m；在自采的无人机序列上 6/6 全部成功。Onion Ball 模块耗时始终低于 10 ms。

**局限**：作者承认在 KITTI 上不是最优；在 HILTI 手持场景中次于 Traj-LO，原因是后者使用了连续时间运动模型；更换雷达时需要修改分割分辨率这个参数；未来计划扩展到回环检测和动态物体检测。耗时数据均在桌面 CPU 上测得；自采数据没有说明是否公开。

## 小结

- **概率加权是这条路线的共同基础。** VoxelMap 的消融显示，精度主要来自平面协方差对残差的逐点加权，而不是自适应体素。C³P-VoxelMap 对 KITTI 与 UTBM 结果的分析也认为，精度主要来自进入残差的概率平面，而不是 kd-tree 与体素这类地图结构本身。后续各篇基本都沿用 VoxelMap 的点/平面不确定性记法。
- **"大平面"有两种得到方式。** 一种是事后合并相邻的小平面（VoxelMap++、C³P-VoxelMap），另一种是在提取阶段就让粗层节点直接持有大平面，外点下放到更深层（R-VoxelMap）。两种方式都要回答"哪些点属于同一个物理平面"，判据从只比较平面参数，逐步发展到同时考虑空间投影位置和点分布的连通性。
- **效率改进集中在维护地图的代价上。** 增量统计量（VoxelMap++）、与点数无关的累积统计量（C³P-VoxelMap）、LRU 管理（R-VoxelMap）都在压缩地图更新的耗时和内存。以 C³P-VoxelMap 的单线程测试为例，耗时下降主要发生在地图更新阶段，状态估计阶段的耗时与 VoxelMap 接近。
- **单一平面基元正在向混合基元扩展。** Hybrid VoxelMap 和 CT-VoxelMap 都在平面拟合失败时改用分布描述，分别依据语义和几何来判定，并且都要处理两类残差的尺度统一。CT-VoxelMap 观察到，体素特征在总残差中占比较高时，系统会趋于不稳定。
- **参数敏感性仍是公开问题。** R-VoxelMap 的作者承认 VoxelMap 类框架对多个参数高度敏感，并把降低参数敏感性列为未来工作；CT-VoxelMap 的样条节点频率按数据集分别设置。Onion-LO 则尝试用一个由当前帧计算的尺度因子统一调节多个下游参数，更换雷达时只修改分割分辨率一项。

## 参考文献

1. Chongjian Yuan et al. VoxelMap: Efficient and Probabilistic Adaptive Voxel Mapping for Accurate Online LiDAR Odometry. IEEE Robotics and Automation Letters, 2022. <https://github.com/hku-mars/VoxelMap>
2. Chang Wu et al. VoxelMap++: Mergeable Voxel Mapping Method for Online LiDAR(-Inertial) Odometry. IEEE Robotics and Automation Letters, 2024. <https://github.com/uestc-icsp/VoxelMapPlus_Public>
3. Xu Yang et al. C³P-VoxelMap: Compact, Cumulative and Coalescible Probabilistic Voxel Mapping. IEEE/RSJ IROS, 2024. <https://github.com/deptrum/c3p-voxelmap>
4. Haobo Xi et al. R-VoxelMap: Accurate Voxel Mapping With Recursive Plane Fitting for Online LiDAR Odometry. IEEE Robotics and Automation Letters, 2026. <https://github.com/NKU-MobFly-Robotics/R-VoxelMap>
5. Haiyang Wu et al. Gaussian or Plane? Both: Semantic-Driven Voxel Representation for LiDAR–Inertial Odometry. IEEE Robotics and Automation Letters, 2026. <https://github.com/haiyang2022/Hybrid-VoxelMap>
6. Lei Zhao et al. CT-VoxelMap: Efficient Continuous-Time LiDAR-Inertial Odometry with Probabilistic Adaptive Voxel Mapping. arXiv:2604.03747, 2026.
7. Xiaolong Cheng et al. Onion-LO: Why Does LiDAR Odometry Fail Across Different LiDAR Types and Scenarios? IEEE Robotics and Automation Letters, 2025. <https://github.com/huashu996/Onion-LO>
