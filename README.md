# ESP32-HX711 步进电机控制系统

一个基于 ESP32-WROOM-32E 的专业步进电机控制器，集成 S 曲线加速、力传感和 Phyphox BLE 支持，专为物理实验设计。

## 功能特性

- **S 曲线加速** 使用 9 阶多项式实现无冲击启动
- **力传感反馈** 使用 HX711 + 称重传感器进行实时力值监测
- **共振补偿** 使用高斯形补偿曲线平滑通过电机振动频率
- **蓝牙集成** 支持 Phyphox 物理实验应用实时数据流
- **丰滑的图形界面** WouoUI 风格的非线性动画菜单系统

## 硬件配置

### 核心部件

| 组件 | 型号 | 说明 |
|------|------|------|
| **MCU** | ESP32-WROOM-32E | 双核 Xtensa LX6 @ 240MHz |
| **电机驱动** | DRV8825 | 步进电机驱动模块 |
| **步进电机** | 17HS3401S | 1.8°步距角，200步/圈 |
| **力传感器** | HX711 + 称重传感器 | 24 位 ADC，精准力值测量 |
| **显示屏** | SSD1306 OLED | 128x64 像素 I2C 屏幕 |
| **传动方式** | 绕线轴 (∅7mm) | 线直接绕在轴上拉动物体 |

### GPIO 引脚映射

```
步进电机驱动:
├─ STEP   → GPIO25   (步进脉冲)
├─ DIR    → GPIO26   (方向控制)
└─ EN     → GPIO27   (使能信号)

按键输入 (低电平有效):
├─ BTN_UP    → GPIO32
├─ BTN_DOWN  → GPIO33
├─ BTN_ENTER → GPIO18
└─ BTN_BACK  → GPIO19

I2C 总线 (OLED & 外设):
├─ SDA → GPIO21
└─ SCL → GPIO22

力传感器 (HX711):
├─ DOUT → GPIO16
└─ SCK  → GPIO17
```

### 微步配置

DRV8825 的微步设置通过跳线帽配置 (不由 MCU 控制)：

```
模式        M0    M1    M2    说明
─────────────────────────────────
全步        L     L     L     最大扭矩，噪声大
1/2 步      H     L     L
1/4 步      L     H     L
1/8 步      H     H     L
1/16 步     L     L     H
1/32 步     H     L     H     默认配置，平衡性能和扭矩
```

**注意**: 当前固件设置为 1/32 微步。如果更改硬件跳线设置，需要修改 `src/main.cpp` 中的 `MICROSTEP_DIV` 常量。

## 💾 编译与上传

### 前置要求

- PlatformIO Core 或 VS Code PlatformIO 扩展
- Python 3.6+ (PlatformIO 依赖)
- USB 转 UART 驱动程序 (部分系统需要)

### 编译命令

```bash
# 编译固件
pio run

# 上传到 ESP32
pio run -t upload

# 打开串口监视器 (115200 波特率)
pio device monitor
```

### 故障排除

**问题**: USB 设备找不到
```bash
# 列出可用串口
pio device list
```

**问题**: 固件上传失败
- 确保 GPIO0 和 GND 短接启动 Bootloader 模式
- 尝试降低上传速度: 修改 `platformio.ini` 中的 `upload_speed = 115200`

**问题**: 编译错误 - 缺少库
```bash
# 更新库管理器
pio update
pio lib update
```

## 🎮 操作指南

### 菜单导航

```
┌─────────────────────────────┐
│  主菜单                      │
├─────────────────────────────┤
│  上/下: 选择菜单项           │
│  确定: 进入子菜单            │
│  返回: 返回上级菜单          │
└─────────────────────────────┘
```

### 运行模式

#### 1. 连续模式 (Continuous)
- 按指定速度运行指定时间
- **参数**: 速度 (mm/s)、运行时间 (秒)
- **应用**: 匀速运动实验

#### 2. 距离模式 (Distance)
- 移动到指定距离后停止
- **参数**: 目标距离 (mm)、最大速度 (mm/s)
- **应用**: 位移测量实验

#### 3. 往返模式 (Reciprocate)
- 在指定距离范围内往返摆动
- **参数**: 往返距离 (mm)、运行时间 (秒)
- **应用**: 简谐运动实验

#### 4. Phyphox BLE 模式
- 实时 BLE 数据流推送到手机 Phyphox 应用
- **数据流**: 速度、力值、位移、时间戳
- **蓝牙名称**: "ESP32-Stepper"
- **UUID**: `cddf1001-30f7-4671-8b43-5e40ba53514a`

#### 5. 共振扫描模式 (Resonance Scan)
- 以 5-150 mm/s 范围扫描识别电机振动频率
- **用途**: 找到最优工作速度，避免共振
- **输出**: OLED 显示各速度下的运动平稳度

### 力传感器校准

#### 进入校准模式
1. 从主菜单选择「设置」
2. 选择「力传感器校准」
3. 按照屏幕提示操作

#### 校准步骤

**步骤 1 - 零点校准**
- 传感器上不放任何物体
- 按「确定」确认零点

**步骤 2 - 100g 标定**
- 在传感器上放置 100g 砝码
- 按「确定」完成校准
- 校准数据自动保存到 NVS 闪存

#### 校准参数

在 `src/main.cpp` 中修改：
```cpp
const float CALIBRATION_MASS = 100.0;  // 砝码质量 (克)
const float GRAVITY = 9.80665;         // 重力加速度 (m/s²)
```

## ⚙️ 系统架构

### 运动控制系统

```
计时器中断 (1MHz)
    ↓
onStepTimer() → 生成脉冲
    ↓
S 曲线加速 (9 阶多项式)
    ↓
共振补偿 (高斯形曲线)
    ↓
DRV8825 驱动器
    ↓
步进电机运动
```

#### 加速曲线特性

- **无冲击启动**: 使用 7 阶光滑函数 `smoothStep7thOrder()`
- **可控加加速度**: 避免机械冲击，保护设备
- **共振补偿**: 通过高斯形减速区间平滑通过振动频率
- **最小启动速度**: 5 mm/s (防止低频共振)

### 力传感系统

```
HX711 传感器
    ↓
24 位 ADC 转换
    ↓
卡尔曼滤波降噪
    ↓
力值显示 + BLE 推送
    ↓
实时图表 (Phyphox)
```

#### 卡尔曼滤波参数

在 `src/main.cpp` 中调整：

```cpp
const float KALMAN_Q = 0.01;   // 过程噪声协方差
                               // 越小越平滑，但响应慢
const float KALMAN_R = 0.1;    // 测量噪声协方差
                               // 越大越平滑，但响应慢
```

**调试建议**:
- 若噪声大 → 增大 `KALMAN_R`
- 若响应滞后 → 减小 `KALMAN_Q` 和 `KALMAN_R`

### 图形界面系统 (WouoUI)

- **非线性动画**: `uiAnimation()` 函数提供平滑缓动
- **反向选择框**: 使用 XOR 渲染，支持反向显示
- **动画滚动条**: 配合菜单滚动的流畅动画
- **刷新率**: 60 FPS

## 🔧 关键配置参数

在 `src/main.cpp` 中找到以下常量并根据需要修改：

### 电机配置

```cpp
#define MICROSTEP_DIV      32      // 微步分割 (线 125)
                                   // 必须与跳线帽设置匹配

const float SPOOL_DIAMETER = 7.0;  // 绕线轴直径 (mm) (线 132)
                                   // 用于计算线性速度
```

### 共振补偿参数

```cpp
const float RESONANCE_ZONE_MIN = 20.0;     // 共振区下界 (mm/s)
const float RESONANCE_ZONE_MAX = 40.0;     // 共振区上界 (mm/s)
const float RESONANCE_BOOST = 1.5;         // 加速度补偿系数
const float RESONANCE_SIGMA = 15.0;        // 高斯曲线宽度
```

### 加速曲线参数

```cpp
const float START_SPEED = 5.0;             // 启动速度 (mm/s)
const float ACCEL_MAGNITUDE = 100.0;       // 加速度幅度 (mm/s²)
const float ACCEL_DURATION = 2.0;          // 加速持续时间 (秒)
```

## 📡 蓝牙 (Phyphox) 集成

### 特性

- **BLE 4.2** 低功耗蓝牙
- **实时推送**: 速度、力值、距离、时间
- **无连接压力**: 自动适应连接速度

### Phyphox 应用配置

在 Phyphox 中创建新实验，添加 BLE 数据源：

```xml
<bluetooth name="ESP32-Stepper" address="auto">
  <characteristic uuid="cddf1001-30f7-4671-8b43-5e40ba53514a">
    <output name="速度" formula="[0] * 3.6">mm/s → km/h 转换</output>
    <output name="力值" formula="[1]">单位: N</output>
    <output name="距离" formula="[2]">单位: mm</output>
    <output name="时间" formula="[3]">单位: ms</output>
  </characteristic>
</bluetooth>
```

### 数据格式

BLE 特征值为 16 字节 (little-endian float32)：

```
字节 0-3:   速度 (mm/s)
字节 4-7:   力值 (N)
字节 8-11:  距离 (mm)
字节 12-15: 时间戳 (ms)
```

## 📊 参数调试

### 识别共振频率

1. 进入「共振扫描」模式
2. 系统会 5 mm/s 步长从 5-150 mm/s 扫描
3. 在 OLED 屏幕观察抖动最严重的区间
4. 修改 `RESONANCE_ZONE_MIN/MAX` 进行补偿

### 优化力传感器读数

1. 确保传感器固定稳定，无松动
2. 进行完整的零点和标准砝码校准
3. 在实验前让传感器预热 2-3 分钟
4. 若仍有漂移，增加 `KALMAN_R` 参数值

### 调节加速曲线

- **更陡峭的加速**: 减小 `ACCEL_DURATION`
- **更柔和的启动**: 增加 `ACCEL_DURATION`
- **降低最大冲击**: 减小 `ACCEL_MAGNITUDE`

## 🐛 故障排除

### 电机不转

- [ ] 检查 GPIO25/26/27 线缆连接
- [ ] 验证 DRV8825 使能脚 (EN) 是否连接
- [ ] 检查电源是否连接到 DRV8825
- [ ] 按「返回」退出当前模式，重启

### 力值显示异常

- [ ] 检查 HX711 传感器 DOUT (GPIO16)、SCK (GPIO17) 连接
- [ ] 重新校准力传感器
- [ ] 检查称重传感器是否有漂移或损坏

### BLE 无法连接

- [ ] 确认手机 Bluetooth 已启用
- [ ] 检查设备名称 "ESP32-Stepper" 是否出现
- [ ] 重启 ESP32，重新扫描设备
- [ ] 更新 Phyphox 应用到最新版本

### OLED 屏幕黑屏

- [ ] 检查 I2C 连接 (GPIO21/22)
- [ ] 验证设备地址是否为 0x3C (在 `src/main.cpp` 中修改 `OLED_ADDRESS`)
- [ ] 查看串口输出是否有 I2C 错误信息

### 编译错误

```
error: 'HX711' was not declared in this scope
```
→ 缺少库，执行 `pio lib install hx711` 或 `pio update`

```
error: undefined reference to 'BLEServer'
```
→ BLE 库配置问题，检查 `platformio.ini` 中的框架设置

## 📚 代码结构

```
src/
├─ main.cpp           # 主程序 (1000+ 行)
│  ├─ 电机控制逻辑     onStepTimer(), motorControl()
│  ├─ UI 系统         displayMenu(), uiAnimation()
│  ├─ 力传感功能      hx711 对象、Kalman 滤波
│  ├─ BLE 实现       BLEServer, GATT characteristic
│  └─ 菜单处理        按键输入、菜单状态机
├─ platformio.ini    # PlatformIO 项目配置
└─ .pio/libdeps/     # 依赖库目录
   ├─ Adafruit SSD1306
   ├─ Adafruit GFX
   ├─ HX711
   └─ ESP32 IDF
```

## 🔌 依赖库

项目自动管理以下库 (via platformio.ini)：

| 库 | 用途 | 版本 |
|---|------|------|
| Adafruit SSD1306 | OLED 驱动 | >=2.1.0 |
| Adafruit GFX | 图形库 | >=1.11.0 |
| HX711 | 力传感器 | >=0.1.0 |
| ESP32 HAL | 硬件抽象 | 内置 |

所有依赖在首次编译时自动下载和安装。

## 🚀 性能指标

| 指标 | 数值 |
|------|------|
| **最小速度** | 0.5 mm/s |
| **最大速度** | 200+ mm/s (取决于电源和负载) |
| **加速度范围** | 10-500 mm/s² |
| **力传感分辨率** | ±0.01 N (取决于传感器) |
| **BLE 更新频率** | 10 Hz |
| **OLED 刷新率** | 60 FPS |
| **定时精度** | ±1 µs (硬件定时器) |

## 📖 物理实验应用场景

### 1. 万有引力常数测定 (G 值实验)
使用 Phyphox 记录力值和加速度，通过向心力公式计算 G。

### 2. 简谐运动分析
往返模式配合力传感器，观察弹簧系统的周期和能量守恒。

### 3. 摩擦力测量
恒定速度运动时的力值直接反映摩擦力大小。

### 4. 共振频率识别
使用共振扫描模式自动找到系统的共振点。

## 📝 开发日志

- **v1.3**: 重写 WouoUI 丝滑菜单系统
- **v1.2**: 集成卡尔曼滤波算法优化力值读取
- **v1.1**: 添加共振补偿算法
- **v1.0**: 基础功能完成，支持多种运行模式

## 📄 许可证

开源项目 - 自由使用和修改

## 🤝 贡献指南

有改进建议或发现 bug？
1. 测试问题复现步骤
2. 记录硬件配置和参数设置
3. 提供串口输出日志

## 📞 技术支持

遇到问题时，请检查：
1. `CLAUDE.md` - 技术细节和参数
2. 串口监视器输出 - 运行时日志
3. 本 README - 常见问题解决方案

---

**最后更新**: 2025-01-25
**项目分支**: 42Stepping
**当前状态**: 开发中 - 菜单系统优化完成
