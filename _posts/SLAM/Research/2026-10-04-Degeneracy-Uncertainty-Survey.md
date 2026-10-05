---
title: "论文综述：LIO 中的退化、不确定性与鲁棒配准"
date: 2026-10-04
categories: [SLAM, 论文综述]
tags: [论文综述, 退化检测, 不确定性, 点云配准, LIO]
math: true
---

LiDAR(-Inertial) Odometry 在隧道、长走廊、开阔地等几何稀疏场景中容易出现配准病态，而在剧烈运动或振动下，IMU 先验和去畸变误差又会悄悄污染每一个点的位置。围绕"如何发现并处理几何退化"与"如何把误差的不确定性刻画对"这两个问题，近几年出现了几条风格迥异的技术路线。本文梳理其中 8 篇代表性工作：X-ICP、DCReg、SVN-ICP、BIEVR-LIO、MA-LIO、SE(3)-LIO、Vibration-Aware LIO 与 AC-LIO。

## 论文速览

| 论文 | 出处 | 一句话概括 | 代码 |
|---|---|---|---|
| X-ICP | IEEE T-RO 2024 | 基于信息对贡献的三级可定位性检测，并用硬等式约束处置退化方向 | 未开源 |
| DCReg | IJRR 2026（arXiv:2509.06285） | 用 Schur 补解耦旋转/平移做退化检测，再用保解的预条件共轭梯度缓解 | [链接](https://github.com/JokerJohn/DCReg)（论文承诺开源） |
| SVN-ICP | IEEE RA-L 2025 | 用 Stein 变分牛顿法估计 ICP 后验，以协方差自动调节卡尔曼增益 | [链接](https://github.com/LIS-TU-Berlin/SVN-ICP) |
| BIEVR-LIO | arXiv 2026（2604.14421） | 在体素平面上存储高分辨率"凸起图像"，用高度梯度补充弱约束方向 | [链接](https://github.com/ethz-asl/bievr-lio) |
| MA-LIO | IEEE RA-L 2023 | 异步多雷达 LIO，沿 SE(3) 协方差链逐点传播采集时刻不确定性 | [链接](https://github.com/minwoo0611/MA-LIO) |
| SE(3)-LIO | arXiv 2026（2603.16118） | 在 SE(3) 上做 IMU 传播，并用位姿联合分布推导去畸变不确定性 | [链接](https://se3-lio.github.io/) |
| Vibration-Aware LIO | IEEE RA-L 2025 | 估计振动强度并为每个去畸变点赋协方差，做不确定性加权与引导匹配 | 未开源（数据已开源） |
| AC-LIO | IEEE/ASME T-MECH 2026（已接收） | 在迭代更新中沿 IMU 协方差链做 RTS 反向平滑，渐进补偿残余畸变 | [项目页](https://cyberkona.github.io/publication/ac-lio/)（正文称代码将发布） |

## 技术路线

### 路线一：检测并处置退化（X-ICP → DCReg）

最经典的思路是 detect-then-mitigate：先分析配准问题的 Hessian（或 Jacobian）判断哪些方向约束不足，再对这些方向做特殊处理。

X-ICP 是这一范式中较系统的代表。它注意到旋转与平移在尺度和类型上的差异会让基于全 Hessian 的阈值难以设定，因此只对对角块 $$\mathcal A_{tt}$$、$$\mathcal A_{rr}$$ 做特征分析；同时认为特征值本身跨环境、跨传感器行为不一致，转而统计每个"点–法向"信息对在特征方向上的贡献，借用 wrench（力与力矩）的类比来度量约束强度，并据此把每个方向分为 full / partial / none 三级。处置上，none 方向冻结在先验值，partial 方向用高贡献点重新求解一个受控更新，二者都以拉格朗日乘子硬约束的形式进入最小二乘。

DCReg 直接回应了"尺度差异与耦合"这一对矛盾。它指出只看对角块等价于"固定平移看旋转、固定旋转看平移"，会高估有效约束，在旋转–平移强耦合时出现漏检；改用 Schur 补后，既得到消元后子问题的真实曲率，又在理论上证明了对平移单位缩放的不变性。DCReg 还把流程扩展为 detect–characterize–mitigate：先解决特征基的符号、排序和基歧义，把病态方向映射到物理运动轴；缓解时不修改原目标，而是用特征值钳位构造预条件子，再用 PCG 求解，只改变收敛路径而不改变最优解。这与 X-ICP 的硬约束、Tikhonov 正则、截断 SVD 等改变解的方法形成鲜明对照。

### 路线二：不急于下判决——概率与表示的视角（SVN-ICP、BIEVR-LIO）

另两篇工作从不同角度绕开了"阈值 + 硬判决"。

SVN-ICP 不做任何退化检测，而是直接估计 ICP 的后验分布：用一组粒子在 SE(3) 上做 Stein 变分推断，并用二阶的 Stein Variational Newton 替代一阶的 SVGD，以改善病态问题上的收敛。估计出的协方差直接作为卡尔曼滤波的观测噪声，退化方向上方差变大、增益自动减小，系统自然更多依赖 IMU 传播。作者还观察到，长走廊序列中沿某些方向的分布呈现多模态与长尾的非高斯形态。

BIEVR-LIO 则质疑"退化"判定的前提：作者认为被视为无信息的环境在严格意义上很少真的退化，真实场景往往存在细微的几何起伏，只是常规地图表示在实时约束下分辨率不足、把这些信息抹掉了。它在每个体素的主平面上存储 5 cm 分辨率的高度图，配准残差的 Jacobian 除点到面的法向项外，还多出由高度梯度导出的两个切向方向，从而在点到面意义下的不可观方向上补充约束。BIEVR-LIO 采用松耦合架构，位姿只由配准决定。作者也明确说明方法只"减少"退化而不检测退化，可以与已有的退化缓解策略结合。另外，BIEVR-LIO 的作者中也包括 X-ICP 的一作。

### 路线三：逐点不确定性沿位姿链传播（MA-LIO → SE(3)-LIO）

除了配准问题本身的病态，点云的输入误差同样关键：一个点的世界坐标依赖于其采集时刻的位姿，而该位姿来自带噪声的 IMU 传播或插值。

MA-LIO 在异步多雷达场景中处理了这一点（SE(3)-LIO 的作者也将其视为最早把相对变换不确定性纳入测量噪声的工作）。它用 B 样条（仅做插值、不作为优化变量）估计每个点采集时刻的位姿，把点从各雷达转换到统一时刻时，用一阶扰动展开把变换误差与测量噪声一起传播为逐点协方差，并称变换部分的迹为"采集时刻不确定性"。这些协方差同时用于残差加权、地图插入门控和 ikd-Tree 降采样时的保留准则。

SE(3)-LIO 在两个层面推进了这条线。其一，把 IMU 传播放到 SE(3) 上，平移更新中多出一个左雅可比因子，修正了传统"区间内旋转为常值"带来的误差。其二，作者指出递推传播得到的各时刻预测位姿是联合分布的，而 MA-LIO 假设参考位姿与采样位姿相互独立、忽略了交叉项，会高估相对变换的不确定性；SE(3)-LIO 推导出联合协方差，经 BCH 展开得到含交叉项的相对变换协方差，并用蒙特卡洛验证了其随时间间隔增大的趋势。

### 路线四：去畸变残余——建模它还是消除它（Vibration-Aware LIO、AC-LIO）

最后两篇针对同一现象：IMU 先验轨迹与真实轨迹存在偏差，所以一次性去畸变之后一定还残留畸变。两者给出了方向相反的回应。

Vibration-Aware LIO 主张去畸变不必非常精确，只要能估计出去畸变后的不确定性。它从帧内 IMU 数据计算振动强度，按点距扫描起点的时间线性放大，得到旋转、平移和测量三部分叠加的逐点协方差，再用于马氏距离引导的匹配与点到面残差加权。与 MA-LIO、SE(3)-LIO 沿协方差链解析传播不同，它的不确定性尺度由振动强度和经验系数共同决定。

AC-LIO 则认为残余畸变可以进一步减小，而且代价很低。它在迭代 ESKF 中复用 IMU 前向传播时已经算好的协方差链，按 RTS 平滑的方式把当前更新量反向分配给帧内各时刻的状态，再重新计算点坐标；同时用一个有理论参照的收敛判据（平均点到面残差）决定是否触发反传。AC-LIO 在其方法对比表中也把 Vibration-Aware LIO 归为"不做进一步去畸变、额外输出后畸变不确定性"的一类。

从这四条路线可以看到一条清晰的脉络：从"检测—处置"到"保解地改善条件数"，从"硬判决"到"把退化编码进协方差"，从"给整帧一个噪声"到"每个点都有自己的协方差"，再到"残余误差是建模还是消除"的取舍。

## 逐篇要点

### X-ICP

**问题**：自对称或感知混淆环境中，沿对称轴的几何约束与噪声难以区分，ICP 可能收敛到噪声诱导的解。作者把这类问题与可认证算法、鲁棒核区分开：前者在优化后判断最优性，后者无法弥补信息缺失。

**方法**：在优化的特征空间中做可定位性检测，使检测与环境朝向无关；用归一化后的信息对贡献（而非特征值）构造综合与强对齐两个贡献量，通过三个阈值的决策树分为 full / partial / none。处置时引入硬等式约束

$$
v_{tj}^\top (t - t_0) = 0,\qquad v_{rj}^\top (r - r_0) = 0
$$

并用拉格朗日乘子并入线性最小二乘。

**实验**：平台为 ANYmal-C 四足机器人 + VLP-16，配准初值由腿式里程计提供，场景包括地下隧道等。去掉 partial 级的二值版本（Xs-ICP）在旋转上相当，但 X-ICP 平移精度显著更好；单线程平均耗时 32.19 ms，无退化时额外开销可忽略。

**局限**：作者承认方法对初值质量敏感，极差初值或完全退化时未更新方向沿用初值可能导致错误配准；阈值的传感器相关选择仍有待改进。原系统未开源。

### DCReg

**问题**：已有 Hessian 谱分析受旋转/平移尺度差异与耦合干扰，导致漏检或过检；特征空间到物理运动轴的映射不清晰；正则化类缓解会扭曲良约束方向。

**方法**：用 Schur 补

$$
S_R = H_{RR} - H_{Rt} H_{tt}^{-1} H_{tR}
$$

作为消去平移后旋转子问题的 Hessian（$$S_t$$ 同理），并证明其投影表示和尺度不变性，再计算方向特定的相对条件数判定病态；通过内积匹配、线性组合与 Gram-Schmidt 正交化把病态方向表达到物理轴上；缓解时对病态方向做特征值钳位构造块对角预条件子，用 PCG 求解，作者给出其 MAP 解释，并强调算法对原最小二乘问题是保解的。

**实验**：在仿真、FusionPortable、GEODE、SubT-MRS 和自采停车场数据上，与 ME/FCN 系检测、SuperLoc、X-ICP 等对比。停车场场景中基于最小特征值的方法未检测出退化；作者报告长时定位精度提升 20%–50%，速度提升 5–30 倍。退化检测与缓解仅占单帧耗时约 1%–5%，大部分时间在对应搜索。目标条件数参数在 1 到 100 之间变化时 ATE 几乎不变，主要影响 PCG 迭代次数。

**局限**：作者明确指出，理论上绝对退化（完美平面、无限长走廊）时任何缓解方法都会失效；初值落在收敛盆之外时退化分析无效；局部几何退化如何与 IMU 等时序先验相互作用是重要的开放问题。论文聚焦配准层面，未与 IMU 融合。

### SVN-ICP

**问题**：ICP 只给点估计，经典协方差估计往往过于乐观，退化检测又需要跨环境调阈值；已有的 Stein ICP 基于一阶 SVGD 和欧氏位姿表示，在病态问题上收敛慢。

**方法**：在 SE(3) 上用右扰动构造 ICP 目标，以 Stein Variational Newton 引入二阶信息更新粒子；配合 KNN 子目标点云、早停准则和体素采样降低开销。粒子均值作为位姿，协方差变换到全局系后直接作为 ESKF 观测噪声：

$$
K_g = \check\Sigma C^\top \left(C \check\Sigma C^\top + \bar\Sigma_{icp}\right)^{-1}
$$

**实验**：在 SubT-MRS 与 GEODE 上，以 1000 个蒙特卡洛样本近似的分布为参考，SVN-ICP 的 KL 散度与归一化范数误差优于经典协方差估计；固定 ICP 噪声的 KF 在多个序列失败，而动态噪声在全部场景保持稳健。混合退化环境中 SVN 优于 SVGD；粒子数增加改善不确定性质量但不影响位姿精度，作者建议 5–10 个粒子即可。

**局限**：作者承认在非结构化环境 + 激进运动、退化场景含运动物体等运动不可观情形下仍受限，需要引入额外观测（如机器人速度）与更好的地图管理；IMU 噪声值仍需合理设定；当前实现采用基础里程计设计与简单卡尔曼滤波（松耦合）。实验使用 GPU（GTX 1080 Ti）。

### BIEVR-LIO

**问题**：几何稀疏环境中 LIO 精度下降甚至发散；作者认为原因在于地图分辨率不足，而非环境真的缺少约束。

**方法**：在 iG-LIO 式体素平面上建立"凸起图像"，以 5 cm 像素存储相对主平面的加权平均高度；配准残差为投影点高度与插值像素值之差

$$
r_i(\xi) = [{}_C p_i]_z(\xi) - I\big(u_i(\xi), v_i(\xi)\big)
$$

其 Jacobian 包含点到面法向项和由高度梯度导出的两个切向项。另用地图侧的平均图像距离（MID）选取最有起伏的 300 个体素做精细采样，其余粗采样。状态估计为松耦合：位姿只由配准决定，速度、偏置和重力在固定位姿的 10 s 滑窗中估计；作者给出的理由是紧耦合需要调节传感器噪声参数，且在长距离弱结构区域中惯性残差可能主导优化。

**实验**：全部实验使用同一组参数，覆盖 Newer College、ENWIDE、GEODE、MARS-LVIG、GrandTour 五个公开数据集。在 ENWIDE 上，它是主表所列序列中唯一全部保持稳定的 geometry-only 方法（Tunnel 序列见局限）；在 GEODE 直线隧道 Shield1（700 m）上，消融显示只有启用切向 Jacobian 项才不失败；地图引导采样把配准点数降到约四分之一并提升精度。

**局限**：作者承认需要足够点密度填充像素，低线数或高速时性能下降；需要较准确的初值；不使用强度，在 ENWIDE Tunnel 这类几何严格不足的场景中失效；不显式检测退化，也不处理动态物体。基准耗时在笔记本 CPU 上测得。

### MA-LIO

**问题**：多雷达系统面临时间不同步、扫描模式与视场差异，以及点在传感器间投影时累积的不确定性。

**方法**：把各雷达外参纳入状态，用 B 样条插值估计每个点采集时刻的位姿，同时完成去畸变与时间补偿；对变换后的点做一阶扰动展开，得到逐点协方差

$$
\Sigma_p = Q\,\Xi\,Q^\top,\qquad \Xi = \mathrm{diag}(\Sigma_{P^iS^j}, Z)
$$

相对 M-LOAM，它按采样时刻区分逐点不确定性、不需要指定主雷达。不确定性用于残差加权、退化场景下先验/量测权重调节，以及 ikd-Tree 的插入门控与降采样保留。

**实验**：在 Hilti 2021 上全序列最优，作者也指出单雷达 FAST-LIO2 在多数序列上为次优；在 UrbanNav 和自采城市数据上优势更明显，含 400 m 隧道的 City02 序列 ATE 为 6.707 m（FAST-LIO2 为 35.308 m）。不确定性模块耗时至多约 5 ms；从一个雷达增加到两个误差明显下降，从两个到三个仅小幅改善。

**局限**：作者坦承 B 样条插值与逐点不确定性之间存在竞争效应，部分序列上完整系统不如单一模块；主雷达切换会扰乱不确定性排序；多雷达并不必然更好，取决于视场布局；只保留了一阶误差项。

### SE(3)-LIO

**问题**：IMU 传播在 LIO 中既提供先验又用于去畸变。传统 $$SO(3)\times\mathbb{R}^3$$ 传播假设区间内旋转不变，旋转变化未进入平移传播；去畸变用到的相对变换不确定性要么被忽略，要么在独立假设下被高估。

**方法**：状态改为 $$SE(3)\times\mathbb{R}^9$$，速度用体坐标系表示，平移传播变为

$$
t_{i+1} = t_i + J_l(R_i\omega_i\Delta t)\,{}^W v_i \Delta t
$$

同时把各步误差状态写成初始误差与 IMU 噪声的线性组合，得到预测位姿的联合协方差，再经 BCH 展开得到含交叉项的相对变换协方差，用于不确定性感知运动补偿（UAMC），与 VoxelMap 式残差一起进入 ESKF。

**实验**：在 NTU-VIRAL、Newer College（作者将点云降采样到 2 m 体素以增加稀疏度）和自采大尺度崎岖地形数据上对比 FAST-LIO2、DLIO、MA-LIO 等。自采 CW 序列 ATE 为 5.10 m，第二名 12.34 m。消融显示主要精度提升来自 SE(3) 传播（如 rtp 序列 2.64 m 降至约 0.27 m），UAMC 在多数序列上带来进一步的小幅改善。平均耗时 20.46 ms，IMU 传播与 UAMC 分别约占 9.6% 与 8.9%。

**局限**：arXiv 版本中没有单独的局限性陈述；方法本身不含退化检测机制；推导建立在 IMU 噪声为零均值白噪声的假设上，BCH 展开截断到二阶；论文未提及自采数据集是否公开。

### Vibration-Aware LIO

**问题**：高速地面机器人在非结构化地形上的高频振动使状态快速、非平滑变化，IMU 噪声不可预测，精确去畸变极为困难。

**方法**：把去畸变后的点误差分解为角振动、线振动和雷达测量三部分，逐点协方差为三者之和，其中旋转部分随点距离放大；振动强度用帧内角速度、线速度的平均绝对偏差度量，并按点距扫描起点的时间线性放大。匹配时先按欧氏距离取 2K 候选，再按马氏距离选 K 个；残差方差取点协方差在平面法向上的投影

$$
R_j = u_j^\top\,\Sigma_{p_j}\,u_j
$$

**实验**：在 3 自由度振动平台上与 FAST-LIO 对比，末端位姿误差更低；在 NCD、M2DGR、Botanic Garden 的 6 个序列中 5 个最优，自采不平地形 4 条序列（加速度达 20 m/s²、角速度达 2 rad/s）全部最优。逐点不确定性计算约 6 ms，引导匹配约 22 ms，总计约 36 ms/帧；消融中去掉不确定性建模或引导匹配都会使误差显著增大，三种振动强度度量性能相近。

**局限**：作者承认结果标准差略大，比例系数为经验超参；因 RTK 高程误差较大，自采实验只评估 2D APE。代码未开源，消融在单条序列上完成。

### AC-LIO

**问题**：传统 LIO 只用 IMU 积分做一次初始去畸变，迭代更新中不再重新去畸变；残余畸变随运动非线性增大，会抑制配准进一步收敛并导致漂移。

**方法**：复用 IMU 前向传播中的协方差链，按 RTS 平滑计算反向增益

$$
G = \hat P_i F_p^\top \hat P_{i+1}^{-1}
$$

把当前更新量反向分配到帧内状态，并可推广到任意间隔以只在少数锚点上执行；随后用平滑后的轨迹重算点坐标。是否反传由平均点到面残差决定：在测距高斯、入射角均匀分布的假设下，收敛时其期望约为 $$2\sigma/\pi$$，阈值取在 1 到 2 倍该值之间，并采用"前一帧已收敛、当前帧仍偏大"的双重条件。

**实验**：在 WHU-Helmet、BotanicGarden、MCD 等公开数据集上，平均 ATE RMSE 为 0.704 m，FAST-LIO2 为 0.984 m（提升 28.5%，自采数据未计入平均）；阈值消融呈 U 型，并设置固定迭代次数的 FAST-LIO2 对照排除迭代次数差异。平均耗时 8.55 ms，FAST-LIO2 为 7.18 ms。

**局限**：作者承认入射角均匀分布是简化，结构化与非结构化场景分布不同，阈值还受动态物体与地图累积误差影响；正文称代码将发布。

## 小结

1. **退化处理正从硬判决走向软处理与保解处理。** X-ICP 用分级 + 硬约束，DCReg 用保解预条件，SVN-ICP 把退化直接编码进协方差，BIEVR-LIO 则试图通过更精细的表示减少退化本身；共同目标是减少阈值依赖、避免扭曲良约束方向。
2. **旋转–平移的耦合与尺度问题是检测可靠性的核心。** 对角块分析为规避尺度问题牺牲了耦合信息，Schur 补在理论上同时处理两者；多篇论文都强调实际场景中的退化多表现为数值病态而非严格秩亏。
3. **不确定性建模正在逐点化、联合化。** 从整帧共用噪声到逐点协方差（MA-LIO、Vibration-Aware LIO），再到考虑预测位姿之间的相关性（SE(3)-LIO），刻画越来越细。在评估方式上，SVN-ICP 以蒙特卡洛参考分布的 KL 散度与 NNE 直接评估不确定性质量，其余工作主要以 ATE 等轨迹精度指标验证。
4. **新增模块的计算开销普遍较小。** DCReg 的退化检测与缓解约占单帧耗时 1%–5%，MA-LIO 的不确定性模块至多约 5 ms，SE(3)-LIO 的 IMU 传播与 UAMC 合计不到 20%，AC-LIO 平均耗时 8.55 ms（FAST-LIO2 为 7.18 ms）；例外是 SVN-ICP 的粒子推断，实验中使用了 GPU。
5. **共性边界清晰。** 几乎所有方法都依赖合理的初值，在理论上完全退化的场景中仍无法凭几何本身恢复，需要额外观测或其他模态信息。

## 参考文献

1. Turcan Tuna et al. X-ICP: Localizability-Aware LiDAR Registration for Robust Localization in Extreme Environments. IEEE Transactions on Robotics, 2024.
2. Xiangcheng Hu et al. DCReg: Decoupled Characterization for Efficient Degenerate LiDAR Registration. The International Journal of Robotics Research (arXiv:2509.06285), 2026. <https://github.com/JokerJohn/DCReg>
3. Shiping Ma et al. SVN-ICP: Uncertainty Estimation of ICP-Based LiDAR Odometry Using Stein Variational Newton. IEEE Robotics and Automation Letters, 2025. <https://github.com/LIS-TU-Berlin/SVN-ICP>
4. Patrick Pfreundschuh et al. BIEVR-LIO: Robust LiDAR-Inertial Odometry through Bump-Image-Enhanced Voxel Maps. arXiv:2604.14421, 2026. <https://github.com/ethz-asl/bievr-lio>
5. Minwoo Jung et al. Asynchronous Multiple LiDAR-Inertial Odometry Using Point-Wise Inter-LiDAR Uncertainty Propagation. IEEE Robotics and Automation Letters, 2023. <https://github.com/minwoo0611/MA-LIO>
6. Gunhee Shin et al. SE(3)-LIO: Smooth IMU Propagation With Jointly Distributed Poses on SE(3) Manifold for Accurate and Robust LiDAR-Inertial Odometry. arXiv:2603.16118, 2026. <https://se3-lio.github.io/>
7. Yan Dong et al. Vibration-Aware LiDAR-Inertial Odometry Based on Point-Wise Post-Undistortion Uncertainty. IEEE Robotics and Automation Letters, 2025.
8. Tianxiang Zhang et al. AC-LIO: Toward Asymptotic Compensation for Distortion in LiDAR-Inertial Odometry via Selective Intraframe Smoothing. IEEE/ASME Transactions on Mechatronics, 2026. <https://cyberkona.github.io/publication/ac-lio/>
