---
title: "论文综述：连续时间激光里程计与平滑估计"
date: 2026-10-04
categories: [SLAM, 论文综述]
tags: [论文综述, 连续时间, LiDAR里程计, 因子图]
math: true
---

旋转式或非重复扫描的 LiDAR 在一帧之内持续采样，平台在采样期间的运动会让"一帧对应一个位姿"的离散时间假设失效；与此同时，多传感器系统还要面对异步观测、参考系漂移与计算量随状态数增长的问题。连续时间轨迹表示（线性插值、样条、高斯过程）与滑窗/因子图平滑是应对这两类问题的两条主要思路。本文梳理 7 篇相关论文：一篇 T-RO 连续时间状态估计综述，四篇连续时间或"准连续时间"的激光（惯性）里程计 Traj-LO、ATI-CTLO、Traj-LIO、Pizza-LIO，以及两篇基于离散位姿图平滑的工作 FORM 与 Holistic Fusion。

## 论文速览

| 论文 | 出处 | 一句话概括 | 代码 |
|---|---|---|---|
| CT State Estimation Survey | IEEE T-RO 2025 | 系统梳理线性插值、时间样条、时间高斯过程三大连续时间家族，并列出开放问题 | 不适用（综述） |
| Traj-LO | IEEE RA-L 2024 | 分段线性连续时间轨迹 + 运动平滑约束 + 边缘化，实现纯 LiDAR 里程计 | [链接](https://github.com/kevin2431/Traj-LO) |
| ATI-CTLO | IEEE RA-L 2024 | 在 Traj-LO 框架上按运动剧烈程度与退化程度自适应调整时间区间 | 未开源 |
| Traj-LIO | arXiv 2024 | 用稀疏高斯过程作为轨迹先验，把多 LiDAR、多 IMU 统一为观测 | 未知 |
| Pizza-LIO | IEEE TIM 2026 | 按 IMU/LiDAR 频率比切片的准连续时间 LIO，并引入强度校正与几何-强度联合约束 | 未开源 |
| FORM | arXiv 2025 | 单地图匹配 + 地图点来源索引构造稠密 fixed-lag 位姿图，并按平滑后位姿重建地图 | [链接](https://github.com/rpl-cmu/form/) |
| Holistic Fusion | IEEE T-RO 2026 | 把漂移参考系、外参、地标作为动态状态的通用多传感器因子图融合框架 | [链接](https://github.com/leggedrobotics/holistic_fusion) |

## 技术路线

### 一、连续时间表示的谱系：线性插值、样条与高斯过程

Talbot 等人的 T-RO 综述给出了一个清晰的坐标系。离散时间方法的结构性问题在于：系统演化本身不被建模，中间时刻状态无法推断，且变量数随传感器数量与频率增长。常见补救是把测量聚合为伪测量（整帧点云、IMU 预积分），再做运动畸变校正（MDC，例如 LiDAR deskewing）；综述把 MDC 称为一个"鸡生蛋"问题——要准确估计运动需要先校正畸变，而校正畸变又需要准确的运动。

连续时间方法分为三大家族：

- **线性插值（LI）**：每次插值只涉及两个相邻状态，假设两者之间速度恒定，简单快速；不支持协方差插值。
- **时间样条**：用 $$k$$ 个控制点的多项式基函数加权表示轨迹，B 样条可达 $$C^{k-2}$$ 连续，每次插值涉及 $$k$$ 个变量；节点选择与李群样条的协方差插值仍是开放问题。
- **时间高斯过程（TGP）**：由线性时变 SDE 生成的 GP 先验具有精确稀疏的逆协方差，插值同样只依赖两个相邻状态，并天然支持协方差插值与概率外插，代价是状态中需要包含速度、加速度等导数。

按这一分类，Traj-LO 与 ATI-CTLO 属于线性插值家族，Traj-LIO 属于 TGP 家族。Traj-LIO 还给出了一个把两者联系起来的结论：随机游走 GP 先验的插值系数恰好等于线性插值，恒速先验的插值等价于三次 Hermite 插值。因此 CT-ICP、Traj-LO 这类线性插值方法可以看作 GP 框架中最简单先验的特例。

### 二、线性插值的纯 LiDAR 路线：从固定段长到自适应区间

CT-ICP 用一帧首尾两个位姿做线性插值；Traj-LO 将其推广为时间窗内的 $$K$$ 段分段线性轨迹，每个点用自己时间戳对应的插值位姿参与点到面配准，从而在优化中直接消除运动畸变。缺少 IMU 时，Traj-LO 用"相邻段速度变化平缓"的伪速度约束充当运动学先验，并通过边缘化先验约束 gauge 自由度。论文明确指出了一个核心张力：段越短，线性假设越成立，但每段累积的点越少，配准越可能欠约束。

ATI-CTLO 正面处理这一张力。它构造了两个方向相反的自适应机制：基于 PCA 主方向变化的预评估在检测到剧烈旋转时缩短时间区间；基于 X-ICP 式可定位性分析的退化管理在环境退化时合并点云段、增大时间区间。由于区间不再等长，恒速约束中需要引入相邻区间长度之比作为尺度因子。滑窗、边缘化、点到面残差等其余部分沿用 Traj-LO。

Pizza-LIO 则代表了另一种折中：它不依赖逐点时间戳，而是按 IMU 与 LiDAR 的频率比把一帧切成若干片，片内仍视为刚体，片间依靠 IMU 顺序积分逼近连续运动；当切片质量不足时再合并相邻片。作者称之为"伪连续时间"。它与 ATI-CTLO 都涉及"区间粒度如何随场景调整"，但前者以 IMU 先验为参照判断合并，后者在纯 LiDAR 条件下以点云统计量判断。

### 三、GP 先验统一多传感器：Traj-LIO

Traj-LIO 是 Traj-LO 同一作者的后续工作，核心观点是"运动学是系统的固有属性，IMU 只是一个观测"。它用 RW/CV/CA 三种 LTI GP 先验分别建模旋转与平移，以 SO(3) 与向量空间的组合替代 SE(3)，使陀螺仪和加速度计可以直接作为角速度与加速度状态的观测接入。多个 LiDAR 通过固定外参共享同一状态，多个 IMU 各自带偏置，IMU 数量为零时自动退化为纯多雷达里程计。相对 Traj-LO，它把手工设计的伪速度约束换成了有 SDE 依据的 GP 先验，把"不用 IMU"变成"IMU 可有可无"；代价是段数增加时计算量明显上升。

### 四、离散位姿的滑窗与因子图平滑：FORM 与 Holistic Fusion

另一条路线不改变"每帧一个位姿"的表示，而是在平滑层面改进。FORM 指出，滤波式或子图式 LO 会把历史位姿误差"烘焙"进地图，而常见的平滑式 LO 需要把当前帧分别与多帧历史扫描匹配，CPU 上难以实时。它的做法是地图点保存来源扫描编号与局部坐标，当前帧只与一张地图做近邻搜索，每个匹配却生成连接当前位姿与来源位姿的二元因子；每帧优化后再用最新位姿重建地图。

Holistic Fusion（HF）位于更上层：它不是新的里程计前端，而是融合 LiDAR 配准、GNSS、腿运动学、轮速、RADAR 等模块输出的通用因子图后端。其核心是把外部模块漂移的参考系建成随时间变化、以 SE(3) 随机游走相连的动态状态，并同时输出全局准确的 World 估计与局部无跳变的 Odom 估计。HF 作者在局限中提到，状态率越高计算越贵，未来考虑线性插值或 GP/样条的连续时间后端——这与前三条路线形成了呼应。

## 逐篇要点

### CT State Estimation Survey（Talbot et al., T-RO 2025）

**问题**：距上一篇同类综述已约十年，连续时间状态估计方法缺少统一梳理。作者团队来自 ETH Zürich RSL、多伦多大学 ASRL 等机构，文献覆盖截至 2024 年 10 月，共 337 条参考文献。

**内容**：按插值方式、协方差插值、外插、每次插值涉及的变量数、设计选择等维度横向比较 LI、样条与 TGP 三大家族（Table I），给出李群上的线性插值、累积 B 样条与 TGP 插值公式。以 WNOA（加速度白噪声）先验为例，TGP 插值写作

$$
\mathbf{x}(t)=\boldsymbol{\Lambda}(t)\,\mathbf{x}(t_i)+\boldsymbol{\Psi}(t)\,\mathbf{x}(t_{i+1})
$$

其中系数由状态转移矩阵与过程噪声协方差闭式给出。

**开放问题**：样条方面包括节点选择、可认证性、复杂过程（非多项式动力学）、增量优化、控制点初始化与李群样条的协方差插值；TGP 方面包括状态时刻选择、可认证性与更丰富的过程先验（目前主要研究的是 WNOA、WNOJ 等简单先验）。评测方面，作者认为聚合的 ATE/RTE 不足以刻画算法的完整行为，并讨论了基准如何提供传感器数据与真值。

**局限**：作为综述，文献截至 2024 年 10 月，之后的工作未覆盖。

### Traj-LO（Zheng & Zhu, RA-L 2024）

**问题**：LIO 依赖 IMU 精确标定，IMU 对温度与机械冲击敏感，且运动超出量程时会失效；而已有纯 LiDAR 方法用离散位姿序列表示轨迹，恒速模型难以应对复杂运动。

**方法**：时间窗均分为 $$K$$ 段，段内用两端控制位姿线性插值，整条轨迹由 $$K+1$$ 个控制位姿决定。目标函数由连续时间点到面几何约束、伪速度平滑约束与边缘化先验三部分组成；伪速度约束要求当前段的位姿增量接近上一次优化收敛后的位姿增量。采用解析雅可比而非自动微分，这是其速度优势的主要来源；边缘化使用 Schur 补与 first-estimate Jacobians。

**实验**：KITTI 测试集平移误差 0.58%、旋转误差 0.0014 deg/m；在 NTU VIRAL 无人机数据上除 tnp 序列外表现领先，tnp 中加入垂直雷达后 z 向误差显著降低；在 Hilti 2021 手持数据上优于 LIO-SAM 与 FAST-LIO；在 Point-LIO 的超量程旋转数据上，LIO 方法失败而 Traj-LO 漂移很小。段数越少，边缘化的作用越明显。

**局限**：作者表示目前主要面向里程计任务，未来将探索完整纯 LiDAR SLAM 与更有表现力的地图结构；承认短区间可能欠约束、小 FoV 的 Livox MID70 性能低于宽 FoV 雷达。KITTI 点云已做运动校正且无逐点时间，因此该数据集上连续配准被关闭。段长按数据集设定（常规 0.03 s，极端运动 0.01 s）。

### ATI-CTLO（Zhou et al., RA-L 2024）

**问题**：连续时间方法中的小时间区间常短于一帧，切分点云会减少控制节点间的约束，在特征稀疏环境中可能退化甚至失败；而大区间又难以刻画激进运动。

**方法**：(1) PCA 预评估：比较相邻帧点云协方差的主方向夹角，并用特征值相对变化区分"运动引起"与"环境变化引起"，仅前者触发缩短区间；(2) 非均匀线性插值滑窗优化，恒速约束写作

$$
e_v=\mathrm{Log}(T_{k}^{-1}T_{k+1})-\gamma_k\,\mathrm{Log}(T_{k-1}^{-1}T_{k}),\qquad \gamma_k=\frac{t_{k+1}-t_k}{t_k-t_{k-1}}
$$

(3) 借鉴 X-ICP 构造信息贡献矩阵，将各方向划分为可定位、部分可定位、不可定位三级；不可定位时合并后续点云段（上限 0.1 s），部分可定位时减小降采样体素。

**实验**：M2DGR 平均 ATE 提升 5%，高动态 street_07 提升 14%；NTU VIRAL 特征稀疏的 spms_02 上多数算法发散，本文靠合并点云段保持稳定；消融在 Newer College 上清晰分离了 PCA 与退化管理两个模块的作用；在自采的四足机器人草坪数据（按离草坪边缘的距离分为 easy/medium/hard 三级退化）上，是对比方法中唯一完成全部序列的纯 LiDAR 方法。

**局限**：作者将连续时间回环检测列为未来工作；tnp 序列上不及 CT-ICP，作者归因于近邻体素搜索范围较小（7 个对 27 个）。为保证实时性，退化检测只针对滑窗内最新一段；位姿输出频率不固定，整体约 10–20 Hz。代码未开源。

### Traj-LIO（Zheng & Zhu, arXiv 2024）

**问题**：离散时间估计器的变量数随测量增长；现有连续时间 LIO 仍依赖 IMU 做预处理或提供运动约束，IMU 失效即导致系统崩溃，且缺少充分利用多 IMU 信息的手段。

**方法**：用稀疏 GP 作为轨迹表示，旋转在局部切空间 so(3) 中线性化，平移与旋转可分别从 RW/CV/CA 等先验中选择，以适配不同传感器配置。优化目标为 GP 运动学先验项加 LiDAR、陀螺仪、加速度计观测项：

$$
x^*=\arg\min_x\; E_{gp}+E_l+E_g+E_a
$$

LiDAR 点按时间戳 GP 插值查询位姿，无需运动补偿；边缘化先验通过 Schur 补直接作为 GP 先验协方差。

**实验**：Hilti 2021 上单雷达单 IMU 配置在 OS0-64 上整体最优，在小 FoV 的 MID70 上优势明显；多雷达优于 MA-LIO；加入第二个 IMU 精度未提升，作者结论是多 IMU 主要提升鲁棒性。NTU VIRAL eee_03 上人为去掉陀螺、加速度计或整个 IMU 后，误差保持在 0.027–0.031 m；在 Point-LIO 超量程数据上，有无 IMU 时估计的角速度几乎一致。

**局限**：作者承认段数增加时计算负担沉重（Hilti RPG 序列、OS0-64 上 4 段约 79.2 ms/帧，1 段约 20.9 ms/帧），未来将探索滑窗稀疏性与更高效的地图结构。段长按数据集设定（0.04 s，极端序列 0.01 s）；纯 LiDAR 模式下 Hilti 的 Base1、Cons 序列发散。目前为 arXiv 预印本，论文承诺开源。

### Pizza-LIO（Wang et al., TIM 2026）

**问题**：低频 LiDAR 整帧与高频 IMU 直接耦合时，帧内位姿差异被"整帧刚体"假设抹平；同时 LiDAR 强度在不同视角与近距离下响应不稳定。作者认为多数连续时间 LIO 依赖精确的逐点时间戳。

**方法**：(1) 切片数由频率比决定，$$s=\lfloor f_{IMU}/f_{LiDAR}\rfloor$$，不依赖逐点时间戳；(2) 以当前位姿估计与 IMU 先验的旋转、平移差异作为质量函数，不达标时合并切片；(3) 强度校正流水线：近距筛选、局部高斯加权线性拟合、乘性/加性双模切换、入射角朗伯归一化；(4) 仅提取平面特征，对平面点施加几何与强度一致性约束，并用 Softmax 自适应分配两者权重。系统基于 LIO-SAM 框架改造。

**实验**：在自采 11 条序列（16.69 km，涵盖隧道、立交、机场等场景，多为退化场景）以及 NTU VIRAL、NCLT 上与 FAST-LIO2、iG-LIO 等 6 个方法比较。在 tunnel_1、overpass_1、airport_1、cs_1 四条序列上，端到端（终点）误差平均 1.285 m，为对比方法中最低。作者报告自适应切片平均带来 0.006 m 的 APE 改善，全部模块合计 0.013 m。

**局限**：作者指出低线束雷达上自适应模块只能在 1 片与 2 片之间选择；NCLT（无强度信息）上平均 APE 为 1.011 m，比 iG-LIO 高 0.002 m，作者归因于缺少强度约束；部分序列误差略高，作者归因于未做动态物体滤除；可配置参数较多，未来计划减少参数并引入视觉。代码未开源。

### FORM（Potokar et al., arXiv 2025）

**问题**：过滤式 LO 只优化当前位姿，历史误差被固化进子图；平滑式 LO 要分别与多帧历史扫描匹配，CPU 上难以实时。

**方法**：按 scanline 曲率提取平面特征并补充少量普通点特征，法向只在单帧内估计。地图点保存来源扫描编号与局部坐标，当前帧在单张地图中匹配，生成连接当前位姿与来源位姿的因子，例如平面残差

$$
r_{\mathrm{planar}}=(R_k n_k)^\top(X_i p_i - X_k p_k)
$$

ICP 内循环中旧因子固定在线性化点做半线性化 LM，收敛后再对全部因子完整优化一次。窗口由最多 10 个 recent scans 与 50 个 keyscans 组成。每帧结束后用平滑后位姿重新投影地图点；作者报告若在每次 ICP 迭代后都重建地图，早期错误对应会使地图退化。

**实验**：7 个数据集、64 条轨迹、16 到 128 线雷达，全部完成且 $$\mathrm{RTE}_1<0.20$$ m；与 filtered 版本相比，smoothing 在 7 个数据族上均降低了 $$\mathrm{RTE}_{30}$$；平均处理频率 12.1–53.0 Hz。

**局限**：作者指出特征提取依赖旋转式 LiDAR 的 scanline 结构，solid-state 支持与多传感器融合留作后续；当前输出的是扫描刚加入系统时的位姿而非最终平滑位姿。每帧一个位姿，不建模帧内运动畸变，对比实验中除 CT-ICP 外的方法也都关闭了 dewarping；未对 reparative mapping 做单独消融；排除了部分运动强度较大的序列，长轨迹只运行前 10 分钟；仅报告平移误差。

### Holistic Fusion（Nubert et al., T-RO 2026）

**问题**：真实机器人同时存在世界系、里程计系、各 SLAM 模块自身的地图系等多套坐标系，外部 SLAM 的地图系还会漂移；手工对齐、把绝对位姿差分成相对因子等做法会丢失信息或引入跳变。

**方法**：以 IMU 导航状态为骨架，动态创建外参、参考系对齐与地标状态。漂移参考系的局部群速度建模为零均值高斯，相邻对齐状态之间通过 SE(3) 随机游走因子连接：

$$
T_{WR_{k+1}}\approx T_{WR_k}\exp\left(\left[\Delta t\,\gamma\right]^\wedge\right),\qquad \gamma\sim\mathcal{N}(0,\Sigma^2)
$$

并把对齐中心周期性地搬到机器人附近的局部关键帧，以改善长距离下的数值条件。在线使用 GTSAM fixed-lag smoother，离线保存全图做批优化；同时输出可跳变的 World 估计与无跳变的 Odom 估计。

**实验**：ANYmal 森林与山地徒步中，将 LiDAR 位姿作为绝对观测的 ATE（0.42 m / 0.38 m）优于将其转成相对因子（0.52 m / 1.12 m）；将随机游走设为 0 后无法同时对齐 GNSS 与 LiDAR SLAM；HF Odom 跳变数为 0；32.5 min、约 23.8 万变量的离线优化耗时 64.1 s；HEAP 长距离实验中局部关键帧版本消除了振荡。

**局限**：作者指出在线初始化缺少先验时病态，状态率越高计算越贵，自由度越多调参越难，外参目前按全程常量处理。论文对比表中 HF 不支持时间同步估计；大型户外任务的参考轨迹由 HF 离线图生成，属于伪真值；统一计时在桌面级 CPU 上完成。

## 小结

1. **时间分辨率与约束充分性的权衡贯穿始终。** Traj-LO 明确指出段越短越易欠约束；ATI-CTLO 用双向自适应区间、Pizza-LIO 用切片合并给出了两种不同的处理方式；综述同样把样条的节点选择与 TGP 的状态时刻选择列为开放问题。
2. **线性插值在激光里程计中应用广泛。** 本文中的 Traj-LO、ATI-CTLO 以及它们所对比的 CT-ICP 都采用线性插值，它简单、快速，且可视为 GP 随机游走先验的特例；Traj-LIO 采用的 GP 先验能把 IMU 作为普通观测接入，但计算量随段数明显增加，Traj-LIO 与 HF 的作者都把计算效率列为后续方向。
3. **运动先验都需要设定强度。** Traj-LO 的伪速度约束、Traj-LIO 的 RW/CV/CA 先验与 HF 的参考系随机游走，本质上都是在观测之外加入的过程模型，其噪声参数需要人为设定；综述也指出目前研究较多的仍是 WNOA、WNOJ 等简单先验。
4. **对传感器配置的通用性是共同追求。** Traj-LIO 让 IMU 数量可以为零到多个，Pizza-LIO 不依赖逐点时间戳，HF 面向任意传感器组合与任务；与之对应，FORM 目前限定旋转式 LiDAR，Traj-LO 与 Traj-LIO 依赖逐点时间戳完成连续配准。
5. **评测维度在扩展。** FORM 分别报告短窗与长距离相对误差，HF 分别评价全局精度与局部跳变、jerk，综述也认为聚合 ATE/RTE 不足以刻画算法行为，并讨论了基准中真值的提供方式。

## 参考文献

1. Talbot W. et al. Continuous-Time State Estimation Methods in Robotics: A Survey. IEEE Transactions on Robotics, vol. 41, pp. 4975–4999, 2025.
2. Zheng X., Zhu J. Traj-LO: In Defense of LiDAR-Only Odometry Using an Effective Continuous-Time Trajectory. IEEE Robotics and Automation Letters, vol. 9, no. 2, 2024. 代码：[https://github.com/kevin2431/Traj-LO](https://github.com/kevin2431/Traj-LO)
3. Zhou B. et al. ATI-CTLO: Adaptive Temporal Interval-Based Continuous-Time LiDAR-Only Odometry. IEEE Robotics and Automation Letters, vol. 9, no. 12, 2024.
4. Zheng X., Zhu J. Traj-LIO: A Resilient Multi-LiDAR Multi-IMU State Estimator Through Sparse Gaussian Process. arXiv:2402.09189, 2024.
5. Wang H. et al. Pizza-LIO: Intensity-Enhanced LiDAR-Inertial Odometry With Adaptive Scan Slicing. IEEE Transactions on Instrumentation and Measurement, vol. 75, Art. no. 8504612, 2026.
6. Potokar E. R. et al. FORM: Fixed-Lag Odometry with Reparative Mapping utilizing Rotating LiDAR Sensors. arXiv:2510.09966, 2025. 代码：[https://github.com/rpl-cmu/form/](https://github.com/rpl-cmu/form/)
7. Nubert J. et al. Holistic Fusion: Task- and Setup-Agnostic Robot Localization and State Estimation with Factor Graphs. IEEE Transactions on Robotics, 2026 (arXiv:2504.06479). 代码：[https://github.com/leggedrobotics/holistic_fusion](https://github.com/leggedrobotics/holistic_fusion)
