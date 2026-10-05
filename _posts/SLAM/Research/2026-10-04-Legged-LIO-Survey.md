---
title: "论文综述：腿足机器人 LiDAR 惯性里程计"
date: 2026-10-04
categories: [SLAM, 论文综述]
tags: [论文综述, 腿足机器人, LIO, 多传感器融合]
math: true
---

腿足机器人在行走时，足端会反复冲击地面，带来 IMU 振动、LiDAR 运动畸变和明显的 z 轴漂移。通用的 LIO（如 FAST-LIO2、LIO-SAM）直接用在四足或双足平台上，效果往往会打折扣。腿足平台本身还带有一类额外的本体感知信息：关节编码器、关节力矩和足端接触。怎样把这类本体感知信息与 LiDAR、IMU（有时还有视觉）融合起来，就是这一方向要回答的问题。本文梳理 8 篇代表性工作：VILENS、Leg-KILO、DG-KILO、LVI-Q、Okawara 等人的在线学习腿部运动学、RA-LLO、KLI-Fusion，以及一篇只用 LiDAR + IMU 做振动扰动补偿的方法。

## 论文速览

| 论文 | 出处 | 一句话概括 | 代码 |
|---|---|---|---|
| VILENS | IEEE T-RO 2023 | 视觉、IMU、LiDAR、腿部里程计放进同一个因子图，用腿部速度偏置吸收打滑与地形形变 | 未开源 |
| Leg-KILO | IEEE RA-L 2024 | 腿部 ESKF + LiDAR 因子图，用 LiDAR 地图反过来给腿部里程计提供接触高度观测，并做自适应扫描切片 | [链接](https://github.com/ouguangjun/Leg-KILO) |
| DG-KILO | IEEE TIM 2026 | 在 Leg-KILO 框架上加入退化检测、强度特征和基于足端点的共面约束 | [链接](https://github.com/CookieAnt/DG-KILO)（论文声明） |
| LVI-Q | IEEE RA-L 2025 | LiDAR-惯性-运动学滤波与视觉-惯性-运动学滑窗交替运行，用足端预积分取代接触检测 | 未开源 |
| Okawara et al. | IEEE RA-L 2025 | 把在线学习的神经腿部运动学模型参数和机器人状态放进同一个因子图联合优化，输入包含足端触觉 | [项目页](https://takuokawara.github.io/RAL2025_project_page/) |
| RA-LLO | ICCAS 2025 | 用 GP 运动先验构造误差状态 ESKF 的过程模型，用连续的接触置信度调节足端 OU 过程 | 未开源 |
| KLI-Fusion | IEEE Sensors Journal 2026 | 面向点足双足的 IESKF 运动学-LiDAR-惯性里程计，用接触足平面残差补全 z 轴可观性 | 仅开源数据集 [链接](https://github.com/tanjinqian/KLI_Fusion-Dataset) |
| External Disturbance Compensation | IEEE RA-L 2026 | 不用腿部运动学，用时延估计（TDE）在线估计 IMU 外部扰动，再修正 IMU 预积分 | 未开源 |

## 技术路线

### 路线一：腿部滤波器 + LiDAR 因子图，用地面信息压住 z 轴

**Leg-KILO** 是这条路线的代表，DG-KILO 直接沿用了它的框架。前端是一个流形 ESKF 腿部里程计：4 个足端接触点进状态（沿用 Bloesch 的经典做法）；借鉴 Point-LIO，把加速度和角速度也放进状态，IMU 从“输入”变成“观测”，以减少冲击下 IMU 异常对传播的直接污染。后端沿用 LIO-SAM 式因子图，把腿部里程计和 LiDAR 里程计的相对位姿因子放在一起。它的特色是双向反馈：腿部里程计给 LiDAR 提供去畸变先验和自适应切片所需的速度；LiDAR 维护的机器人中心局部地图又反过来给腿部 ESKF 提供“接触高度”观测。

**DG-KILO** 直接建立在 Leg-KILO 上（它的消融基线 DG-KILO1 与 Leg-KILO 配置相同），针对的是非结构化环境里的 LiDAR 退化和 z 轴漂移。它沿用自适应切片和高度检测，并新增三件事：参照 X-ICP 对 Hessian 做退化检测；检测到退化时补充强度特征（参照 IGE-LIO）；用多个触地足端点拟合地面平面，构造“共面约束”。共面约束的出发点是：足端接触区域常常落在 LiDAR 盲区里。

**KLI-Fusion** 换成了点足双足平台，架构也从“滤波 + 因子图”改成单一的 IESKF（基于 FAST-LIO2 与 LIKO）。它对自身系统做了可观性分析：运动学残差只约束 IMU 与接触足之间的相对高度，二者一起上下平移时运动学残差无法察觉。对应的做法是用历史接触足位置在线拟合接触平面，给接触足的 z 分量补一个绝对参考，并用秩分析说明这一行观测补全了垂直子空间。

这三篇的共同点是：都为高度方向引入某种“地面参考”（Leg-KILO 也指出，仅靠本体感知时绝对位置不可观）。参考从哪里来，三篇各有不同。Leg-KILO 用 LiDAR 局部地图里足端附近的点；DG-KILO 在此之外又加了足端点自身拟合的平面；KLI-Fusion 只用历史接触足位置，不依赖足端附近的地面点云，因为在它的平台上 LiDAR 装得较高，足端附近点云稀疏。

### 路线二：放松无滑移假设，为腿部观测的可信度建模

经典腿部里程计假设足端触地后静止、不打滑。这个假设在碎石、草地、沙地、湿滑地面上经常不成立。围绕“腿部观测能信多少”，几篇工作给出了不同的答案。

- **VILENS** 给腿部速度测量加一个缓变的速度偏置，用来吸收打滑、地形压缩、冲击带来的漂移。这个偏置借助视觉、LiDAR、IMU 的紧耦合而可观。VILENS 还设计了模式切换：机器人没有迈新步子时停用偏置。
- **LVI-Q** 走了另一条路：沿用其前作 STEP 的足端预积分，对足端位姿按关节测量传播并预积分。运动学因子因此在每一步优化里都能使用，不必先判断是否稳定接触，作者称之为“无需接触检测器”。
- **RA-LLO** 把二值接触换成连续的接触置信度，由气压式足端力传感器的读数线性映射得到，再用这个置信度连续调节足端位置误差 OU 过程的衰减率和噪声，避免二值切换造成的滤波器不连续。
- **Okawara et al.** 走学习路线：用神经网络从 IMU、关节角、关节力矩、足端力直接回归机体 twist，网络里有一小部分参数（168 维）放进因子图和状态一起在线优化，用来适应负载和地形的变化；腿部因子的协方差则由最近若干个残差的方差在线估计。

这四篇可以看成对同一个问题的不同处理方式：VILENS 用偏置去“吸收”，LVI-Q 用预积分绕开接触判断，RA-LLO 用置信度“连续加权”，Okawara 用在线学习做“自适应建模”。相比之下，路线一的 Leg-KILO 和 KLI-Fusion 采用二值接触判定，其中 KLI-Fusion 为它的膝关节力矩阈值接触判定给出了 F1 约 0.97 的定量验证。

### 路线三：不用腿部运动学，直接建模 IMU 振动扰动

**External Disturbance Compensation** 站在另一端。它认为多传感器方案依赖额外的本体感知并带来计算负担，因此只用 LiDAR + IMU：在 IMU 测量模型里，除了偏置和白噪声，再显式加入一个外部扰动项，用时延估计（TDE）递推估计该扰动，并以 LiDAR 里程计反推的扰动作为 ESKF 观测；估计出的扰动从 IMU 预积分里扣除，补偿后的预积分再回灌去畸变。与前两条路线相比，它不需要关节编码器或足端力传感器，可以直接用于只有 LiDAR 和 IMU 的平台。

### 融合架构：滤波、因子图与交替优化

从系统结构看，这 8 篇覆盖了几种主要架构：

- **固定滞后平滑 / 因子图**：VILENS（多线程预积分 + 固定滞后平滑，优化输出 10 Hz、IMU 前向传播 400 Hz）、Okawara（iSAM2 固定滞后平滑，6 s 窗口）。
- **滤波前端 + 因子图后端**：Leg-KILO、DG-KILO、RA-LLO 的前端是腿部 ESKF，后端是 LIO-SAM 式因子图（均带回环）；External Disturbance Compensation 用 ESKF 估计 IMU 扰动，后端同样沿用 LIO-SAM 的因子图结构。
- **单一迭代滤波**：KLI-Fusion（IESKF，200 Hz 输出）。作者也承认，Leg-KILO、LIO-SAM 这类因子图方法的轨迹更平滑。
- **滤波与滑窗交替**：LVI-Q 让 LIKO（ESIKF，低延迟）和 VIKO（滑窗优化）按测量可用性交替运行，两者之间保留状态协方差。

是否引入视觉也是一个分叉点。VILENS 和 LVI-Q 把视觉作为冗余模态，在暗光、长隧道等单模态退化场景里依靠多模态互补；DG-KILO 在 Future Work 中也把视觉列为下一步。其余几篇只用 LiDAR、IMU 和本体感知。

## 逐篇要点

### VILENS

**问题**：传统本体感知估计器在高摩擦、刚性地形、低速条件下漂移可以接受，但在可变形地形、腿部柔性、足端打滑时性能明显下降。作者观察到，Pronto、TSIF 等运动学-惯性估计器的高程漂移在特定步态与地形下近似线性增长。

**方法**：ANYmal 平台没有足端力传感器，支撑腿由动力学方程算出的地面反力垂直分量做阈值判定。多条支撑腿的速度测量按信息矩阵加权合成一个复合测量，避免每次换步都要显式处理接触切换。核心是在腿部速度测量上加入缓变偏置：

$$
\tilde v = v + b^v + \eta^v
$$

该偏置通过与视觉、LiDAR、IMU 因子的紧耦合变得可观（附录给出证明），预积分方式仿照 Forster 的 IMU 预积分。当 3–4 只脚持续接触超过 200 ms 时，判定为低漂移状态并停用偏置。

**实验**：ANYmal B300 / C100，约 2 小时、1.8 km 数据，覆盖 DARPA SubT 城市赛道、矿洞等场景。相比松耦合方法，平移误差降低 62%，旋转误差降低 51%。在长隧道中 LiDAR 与视觉同时退化时，加入腿部里程计的配置明显改善；去掉在线偏置估计后，在松软地形上漂移更快。系统已在机载在线运行，并驱动下游高程建图与规划。

**局限**：作者明确指出速度偏置的前提是“局部常值”；接触点被近似为足端中心的固定点；加速度计偏置要等机器人运动后借助外感知才可观。代码未开源。

### Leg-KILO

**问题**：四足 trot 时足端频繁冲击，IMU 测量失稳，旋转 LiDAR 一帧约 100 ms 内产生显著运动畸变，z 轴漂移尤其严重。通用 LIO 把不稳定的 IMU 当输入，在四足上容易出现波动甚至崩溃。

**方法**：腿部 ESKF 的状态包含姿态、位置、速度、4 个足端位置、重力、IMU 偏置以及加速度和角速度，观测包括足端零速、足端位置、IMU 和接触高度；IMU 超出量程时调大其测量协方差。接触高度检测在机器人中心增量地图（ikd-Tree）中搜索足端附近的点，用 PCA 拟合局部平面，取足端在平面上的投影作为高度观测：

$$
q_{proj} = {}^W\hat c_i - u^\mathsf{T}\left({}^W\hat c_i - \bar q\right) u
$$

平面粗糙度超过 0.01 m 时丢弃该观测。LiDAR 侧按腿部里程计给出的速度把整帧切成 1/4、1/2 或 1 个 FoV，再与历史切片拼成完整扫描后配准，输出最高 40 Hz。

**实验**：Unitree Go1 + VLP-16，自建并开源 legkilo-dataset（corridor、parking、slope、running、indoor）。Leg-KILO 在各序列上优于 A-LOAM、LIO-SAM、FAST-LIO2、Point-LIO 等基线；在高度变化超过 6 m 的 slope 序列上优势最明显，在 running 序列中能把机身高度保持在正常范围。笔记本上平均耗时低于 50 ms。

**局限**：作者在结论中指出，维护机器人中心局部地图会影响接触高度检测的精度；腿部里程计本身的偏航角和绝对位置不可观；平坦地形上优势不如高度变化场景明显。实验仅使用 Go1 一种平台和 trot 一种步态；除 indoor 外，各序列真值由离线迭代优化结合回环生成。

### DG-KILO

**问题**：非结构化环境里几何特征稀疏，LiDAR 容易退化；四足固有振动又导致 z 轴漂移。作者认为已有方法没有充分利用地面测量，特别是没有通过拟合地面平面来约束机器人位姿。

**方法**：沿用 Leg-KILO 的预处理与腿部 ESKF，并把加速度、角速度的过程模型从随机游走改为一阶高斯-马尔可夫过程。退化检测参照 X-ICP，对 Hessian 的旋转、平移分块分别做特征分解，用最近 30 帧最小特征值的均值和标准差设定自适应阈值，并要求连续 3 帧退化方向一致；判定退化后才提取强度特征。共面检测用不少于 3 个触地足端点拟合平面，比较相邻时刻平面法向：

$$
r_g = \cos\theta - 1
$$

高度残差与共面残差归一化后各取 0.5 权重融合，作为地面约束因子加入因子图。

**实验**：在 Leg-KILO 数据集和 DiTer++（Go1 + Go2，草坪、公园、森林，真值来自测量级先验地图）上与 FAST-LIO2、Point-LIO、LIO-SAM、Leg-KILO 对比。消融显示共面检测主要改善 z 轴漂移，退化优化主要改善 ATE 与全局一致性；端到端实验中地面约束的贡献大于退化优化。总耗时 38.20 ms/帧（Leg-KILO 为 35.31 ms）。

**局限**：作者承认方法依赖 LiDAR 强度特征、极端运动下约束不足，额外的强度提取与共面约束使其比 Leg-KILO 稍慢。共面角阈值需按地形设定（平地 5°，非结构化地形 10°）；Jueying Lite2 实机部分只给出定性建图结果；未单独消融强度特征。

### LVI-Q

**问题**：VIO 在光照剧变和激进运动下失效，LIO 在长走廊等几何相似环境中退化，已有 LVI 方法采用单一融合策略，对某一模态失效的适应性不足；传统本体感知方法依赖无滑移假设和精确的接触检测。

**方法**：两个估计器按测量可用性交替运行。LIKO 是基于体素地图点到面残差的 ESIKF，延迟低于 20 ms；VIKO 是滑窗因子图，在线估计左右相机外参和特征逆深度。腿部信息通过足端预积分进入两者，残差形式为：

$$
r_{\nu_p} = \Delta\tilde s_{l,ij} - \Delta\hat s_{l,ij}
$$

针对四足弹跳导致的双目深度失败，作者提出深度一致性因子：用 SEEDS 超像素对 LiDAR 投影点分组，计算 3D-NDT 分布，再把视觉特征深度约束到对应点云分布内。

**实验**：在 FSC（ANYmal，低照度施工现场）、CEAR（MIT Cheetah，闪烁灯光与夜间，pronking 步态）和自采 K-Campus（A1、Go1，各超过 800 m，RTK-GPS 真值）上，所有方法关闭回环后比较，LVI-Q 在各序列误差最低；夜间无真值序列中，它是唯一回到原点附近的方法。LIKO 构造因子约 10 ms，VIKO 约 45 ms，整体输出 11–13 Hz（i7-12700K）。

**局限**：作者在 Future Work 中计划用深度学习从关节测量序列跟踪足端位姿，并生成视觉深度图以改善相机-LiDAR 对齐。代码未公开；消融只覆盖足端预积分和深度一致性两项；夜间序列没有真值。

### Okawara et al.：在线学习腿部运动学

**问题**：在广阔平地、沙滩、隧道等无特征环境中 LiDAR-IMU 里程计会失败；IMU 线加速度需要二次积分，误差累积快；腿部运动学只需一次积分，但传统模型假设无滑移，在可变形地形上同样不稳定。足端反力又随地形和负载变化，很难显式辨识。

**方法**：神经腿部运动学网络输入 IMU、关节角、关节力矩和足端力，输出机体 twist 与接触状态。网络分为离线训练的不变部分和在线训练的小型自适应部分，后者的 168 维参数和机器人状态放在同一个因子图里优化：

$$
r_i^{Leg} = \log\left(T_{i-1}^{-1} T_i \exp(\xi_i \Delta t_i)^{-1}\right)
$$

雅可比由 LibTorch 自动微分得到，封装为 GTSAM 因子，用 iSAM2 固定滞后平滑求解。腿部因子协方差取最近 15 个残差的方差。离线训练使用 7 种环境、4 种负载的 28 条序列，约 4.7 小时。

**实验**：Unitree Go2 + 窄 FOV 的 Livox AVIA（有意模拟严重退化），Leica TS16 全站仪真值。在沙滩和校园（含沥青、碎石、草地切换，中途卸下 3 kg 配重）两个场景中，ATE 分别为 0.08 m 和 0.29 m，FAST-LIO2 在无特征区域失败。去掉在线学习后平移尺度明显出错；去掉触觉输入后，校园 ATE 升至 0.63 m。

**局限**：作者指出在线模型依赖初值（实验用草地、无负载条件下的离线参数），实际部署需要结合地形分类来选初值；扩展到不同连杆参数的通用模型和发布代码被列为未来工作。论文未报告计算耗时；对比基线为 FAST-LIO2、Unitree 自带里程计及自身的消融版本。

### RA-LLO

**问题**：本体感知方法常依赖离散时间假设和突变式接触建模，多传感器融合方法对接触的处理多为二值化，在草地、泥地、坡地等地形上对接触信息的利用有限。作者还指出，GP 连续时间先验多用于批量或优化式估计器，很少进入腿足机器人常用的递归滤波框架。

**方法**：GP 先验只作用于 ESKF 的误差状态，名义状态仍用完整非线性运动学传播。误差状态采用 WNO-A 先验，用 Van Loan 方法解析地得到转移矩阵和离散过程噪声。足端位置误差建模为 OU 过程，衰减率与噪声随接触置信度连续变化：

$$
\lambda_{f_i}(c_i) = (1 - c_i)\lambda_{swing} + c_i \lambda_{stance}
$$

接触置信度由气压式足端力读数在上下限之间线性映射得到。LiDAR 去畸变用扫描起止及中间时刻的位姿拟合三次 SE(3) B 样条，后端为带回环的因子图。

**实验**：在 DiTer++ 的两条 LAWN 序列（沥青、草地、上下坡）上与 Liorf、FAST-LIO2、Point-LIO、Leg-KILO 对比，ATE RMSE 分别为 0.676 m 和 0.574 m，为表中最优。作者指出各方法差异主要出现在 Z 轴，并把 Leg-KILO 的高度偏置归因于二值接触高度。

**局限**：作者在 Future Work 中提出：需要对接触自适应 OU 过程做形式化稳定性分析；压力到置信度的映射是启发式的；希望引入在线超参学习。实验仅 2 条序列，未做消融，未报告耗时，代码未开源。

### KLI-Fusion

**问题**：点足双足只有单足支撑相，机身晃动和冲击明显。LiDAR 安装位置高，足端附近地面点稀疏，垂直几何约束弱；低成本 IMU 受冲击污染；运动学残差本身也不足以约束 z 轴。

**方法**：IESKF 状态只包含一个接触足位置（同一时刻只有一只脚着地）。接触判定用膝关节力矩阈值代替足端力传感器，作者用 Pearson 相关和 F1（0.972–0.979）验证了这个代理量。作者在实验中发现腿部速度观测因关节角速度噪声而不准确，因此不使用。可观性分析给出，在姿态被 LiDAR 约束后，运动学残差的垂直分量退化为：

$$
\delta r_{k,z} \simeq -\delta p_{I,z} + \delta p_{c,z}
$$

即共同垂直平移落在零空间里。接触足平面残差补上对接触足 z 分量的直接观测，使垂直子空间满秩。平面由最多 20 个历史接触点经 SVD 拟合；新接触点偏离平面超过阈值（典型取一级台阶高度，约 5 cm）时暂存，累计足够后判定是否进入新平面。

**实验**：在仿真、室内动捕和室外校园序列上，与 FAST-LIO2、Point-LIO、LIO-SAM、LIKO、Leg-KILO、A-LOAM 对比。消融中速度越高，去掉接触平面残差后误差增长越明显。在有人群动态干扰的 A_round 序列上 APE 为 0.0485 m。运动学与接触更新合计不到 0.5 ms（Intel NUC i7-1360P）。

**局限**：作者承认方法假设局部平坦接触面且打滑很小，在高度不规则环境中可能受限；SVD 更新无法消除系统性偏差、长期相关漂移、严重打滑和接触误判；滤波框架的轨迹不如因子图方法平滑。室外序列真值由 ICP 加回环离线生成；仅开源数据集，未开源代码。

### External Disturbance Compensation

**问题**：四足运动的冲击引起传感器振动。作者认为多数 LIO 关注的是传感器内部噪声，环境引起的外部扰动基本没有处理；多传感器方案又依赖额外的本体感知，计算负担大。

**方法**：在 IMU 测量模型中，除偏置与白噪声外显式加入外部扰动项。假设因子图相邻节点间扰动近似连续，用 TDE 递推估计扰动；ESKF 以 IMU 频率（结合加速度计和磁力计）更新姿态，以 LiDAR 频率更新扰动，观测由 LiDAR 里程计经二阶滑模精确微分器求加速度后得到。估计出的扰动从预积分中扣除，例如：

$$
\Delta v_{ij} = \sum \Delta R_{it}\left(\tilde a_t - b^a_t - \eta^a_t - \hat\varepsilon^a_t\right)\Delta t
$$

**实验**：Unitree Go2 + Velodyne 16 线，室外以 RTK GPS、室内以 UWB 为真值，覆盖校园、特征稀疏的操场、退化走廊和 Leg-KILO 数据集的 parking 序列，基线为 D-LIO、FAST-LIO2、LIO-SAM（关闭回环）。该方法在各场景 ATE 最优；在操场和走廊中，部分基线丢失位姿或未能到达终点。去掉 TDE 后出现尺度漂移。总耗时约 70–71 ms。

**局限**：作者明确指出 TDE 对高频扰动会失效，只适用于约 2–3 Hz 的低频扰动；扰动没有真值，TDE 质量只能定性评估；方法不改善 LiDAR 特征提取本身。论文只报告了 ATE，TDE 消融只在校园场景上做，未说明计算平台；代码未开源。

## 小结

1. **z 轴漂移是腿足里程计的共性难题**。Leg-KILO、DG-KILO、RA-LLO、KLI-Fusion 都把高度误差作为主要评测对象。KLI-Fusion 的可观性分析表明，在其系统中运动学残差只约束相对高度；几篇工作分别借助 LiDAR 局部地图、足端拟合平面或历史接触平面来提供垂直参考。
2. **无滑移、二值接触假设在逐步放松**。从 VILENS 的速度偏置，到 LVI-Q 的足端预积分、RA-LLO 的连续接触置信度、Okawara 的在线学习运动学与残差方差协方差，越来越多工作把“腿部观测能信多少”当作需要估计的量，而不是固定常数。
3. **地面与平面假设仍很普遍**。接触高度检测、共面约束、接触足平面残差都依赖局部平坦或分段平面的地形，Leg-KILO、KLI-Fusion 等论文的作者也把高度不规则地形、严重打滑列为方法的适用边界。
4. **评测条件差异较大，可比性有限**。各工作使用的平台（ANYmal、Go1、Go2、A1、Jueying、点足双足）、步态、真值来源（动捕、全站仪、RTK、测量级地图、离线优化伪真值）和指标（ATE、RPE、端到端误差）各不相同，不少论文没有报告耗时或板载性能。公开的带腿部原始数据的数据集（如 legkilo-dataset、DiTer++、KLI-Fusion 数据集）对横向比较尤其重要。
5. **融合架构与模态选择仍在分化**。滤波、因子图、交替优化各有取舍；视觉被一部分工作当作冗余模态引入，另一部分工作则坚持 LiDAR + IMU + 本体感知，甚至只用 LiDAR + IMU 来建模振动扰动。

## 参考文献

1. Wisth et al. VILENS: Visual, Inertial, Lidar, and Leg Odometry for All-Terrain Legged Robots. IEEE Transactions on Robotics, 2023.
2. Ou et al. Leg-KILO: Robust Kinematic-Inertial-Lidar Odometry for Dynamic Legged Robots. IEEE Robotics and Automation Letters, 2024. <https://github.com/ouguangjun/Leg-KILO>
3. Xu et al. DG-KILO: A Kinematic-Inertial-LiDAR Odometry Based on Degradation Optimization and Ground Constraints for State Estimation of Legged Robots. IEEE Transactions on Instrumentation and Measurement, 2026. <https://github.com/CookieAnt/DG-KILO>（论文声明）
4. Marsim et al. LVI-Q: Robust LiDAR-Visual-Inertial-Kinematic Odometry for Quadruped Robots Using Tightly-Coupled and Efficient Alternating Optimization. IEEE Robotics and Automation Letters, 2025.
5. Okawara et al. Tightly-Coupled LiDAR-IMU-Leg Odometry With Online Learned Leg Kinematics Incorporating Foot Tactile Information. IEEE Robotics and Automation Letters, 2025. <https://takuokawara.github.io/RAL2025_project_page/>
6. Kim et al. RA-LLO: Robust Adaptive Legged-LiDAR Odometry with Gaussian Process Motion Prior over Error States. International Conference on Control, Automation and Systems (ICCAS), 2025.
7. Tan et al. KLI-Fusion: Tightly-Coupled Kinematic-LiDAR-Inertial Odometry With Contact Foot Position Enhancement for Point-Foot Biped Robots. IEEE Sensors Journal, 2026. <https://github.com/tanjinqian/KLI_Fusion-Dataset>
8. Hoang et al. External Disturbances Compensation for LiDAR-Inertial Odometry Under Vibration Conditions on Quadruped Robot. IEEE Robotics and Automation Letters, 2026.
