# ESP32-WROOM-32E 步进电机调速仪

基于 ESP32-WROOM-32E 的步进电机精密调速控制系统，采用 S 型加速曲线实现平滑启停。

## 功能特性

- 🎯 **精确速度控制**: 1-200 mm/s 可调
- 📏 **精确距离控制**: 最大行程 400mm
- ⏱️ **时间控制**: 1秒 - 1小时可调
- 🔄 **S型加速曲线**: 100-2000ms 可调加速时间
- 📊 **实时显示**: OLED 显示速度、距离、时间、进度
- 🎮 **多种运动模式**:
  - 连续模式: 按设定时间运行
  - 定距模式: 运动到指定距离
  - 往复模式: 在指定距离内往复运动

## 硬件配置

### 核心组件

| 组件 | 型号 | 说明 |
|------|------|------|
| MCU | ESP32-WROOM-32E | 双核 240MHz, 需USB-TTL |
| 步进驱动 | DRV8825 | 1/16微步细分 |
| 步进电机 | 17HS3401S | 1.8°步距角, 200步/圈 |
| 显示 | 0.96" OLED | SSD1306 I2C |
| 电源 | 12V DC | 电机供电 |

### ESP32-WROOM-32E 特性

| 参数 | 值 |
|------|------|
| 处理器 | 双核 Xtensa LX6 @ 240MHz |
| Flash | 4MB |
| SRAM | 520KB |
| GPIO | 34个 (部分仅输入) |
| USB | 需外部 USB-TTL (CP2102等) |
| 工作电压 | 3.3V |
| WiFi | 802.11 b/g/n |
| Bluetooth | BT 4.2 + BLE |

### 传动系统

| 参数 | 值 | 说明 |
|------|------|------|
| 同步带 | 2GT | 节距 2mm |
| 惰轮 | 20齿 | 内孔3mm, 带宽6mm |
| 每圈位移 | 40mm | 20齿 × 2mm |
| 微步设置 | 1/16 | 3200微步/圈 |
| 分辨率 | 0.0125mm/步 | 高精度定位 |

### 接线图

```
ESP32-WROOM-32E (DevKit) 引脚分布:
                    ┌─────────────────┐
                    │      USB        │
                    │   ┌───────┐     │
              3V3 ──┤   │       │     ├── VIN (5V)
              GND ──┤   │ESP32  │     ├── GND
            GPIO15──┤   │WROOM  │     ├── GPIO13
             GPIO2──┤   │  32E  │     ├── GPIO12
             GPIO4──┤   │       │     ├── GPIO14
            GPIO16──┤   │       │     ├── GPIO27 (EN)
            GPIO17──┤   │       │     ├── GPIO26 (DIR)
             GPIO5──┤   │       │     ├── GPIO25 (STEP)
 (BTN_ENTER)GPIO18─┤   │       │     ├── GPIO33 (BTN_DOWN)
 (BTN_BACK) GPIO19─┤   │       │     ├── GPIO32 (BTN_UP)
       (SDA)GPIO21─┤   └───────┘     ├── GPIO35
       (SCL)GPIO22─┤                 ├── GPIO34
            GPIO23──┤                 ├── VN (GPIO39)
              GND ──┤                 ├── VP (GPIO36)
                    │      RST  EN    │
                    └─────────────────┘
```

```
ESP32-WROOM-32E            DRV8825
    GPIO25 ──────────────>  STEP
    GPIO26 ──────────────>  DIR
    GPIO27 ──────────────>  EN (ENABLE)
    
    M0/M1/M2 不由MCU控制！请用跳线帽设置微步:
    - 全步: M0=GND, M1=GND, M2=GND (或全部悬空)
    - 1/16: M0=GND, M1=GND, M2=VCC
    
ESP32-WROOM-32E            OLED (I2C)
    GPIO21 ──────────────>  SDA
    GPIO22 ──────────────>  SCL
    3.3V   ──────────────>  VCC
    GND    ──────────────>  GND
    
ESP32-WROOM-32E            按键 (active LOW, 按下接GND)
    GPIO32 ──────────────>  UP (上/增加)
    GPIO33 ──────────────>  DOWN (下/减少)
    GPIO18 ──────────────>  ENTER (确认/暂停)
    GPIO19 ──────────────>  BACK (返回/停止)
    
DRV8825 电源
    VMOT   ──────────────>  12V DC (+)
    GND    ──────────────>  12V DC (-)
    
⚠️ 重要注意事项: 
1. DRV8825 的 RESET 和 SLEEP 引脚必须短接!
2. VMOT 旁边必须接 100μF 电解电容
3. ESP32 的 GND 必须与 DRV8825 的 GND 连接 (共地)
4. 按键使用内部上拉，按下接GND
5. M0/M1/M2 由跳线帽设置，不要连接到 ESP32 GPIO
```

### DRV8825 微步设置 (用跳线帽)

| M0 | M1 | M2 | 细分 |
|----|----|----|------|
| L  | L  | L  | 全步 (悬空也可) |
| H  | L  | L  | 1/2 |
| L  | H  | L  | 1/4 |
| H  | H  | L  | 1/8 |
| L  | L  | H  | 1/16 ✓ (推荐) |
| H  | L  | H  | 1/32 |

> **注意**: 修改微步后需要同步修改代码中的 `MICROSTEP_DIV` 常量

## 使用说明

### 菜单操作

1. **主菜单**: 使用 UP/DOWN 选择项目，ENTER 进入
2. **参数设置**: UP/DOWN 调整数值，ENTER 确认，BACK 返回
3. **运行中**: ENTER 暂停/继续，BACK 停止

### 主菜单项目

```
┌─────────────────────────┐
│   MOTOR CONTROLLER      │
├─────────────────────────┤
│ > Speed Setting    50   │
│   Distance Set    100   │
│   Time Setting     10   │
│   Accel Time      500   │
│   Direction       FWD   │
│   Motion Mode     CON   │
│   >> START <<           │
└─────────────────────────┘
```

### 运动模式说明e e e e

#### 连续模式 (Continuous)
- 按设定时间运行
- 完整的 S 型加速-匀速-减速曲线
- 适合: 测试、展示、定时运行

#### 定距模式 (Distance)
- 运动到设定距离后停止
- 自动减速到达目标位置
- 适合: 精确定位、点对点移动

#### 往复模式 (Reciprocate)
- 在设定距离内往复运动
- 运行直到达到设定时间
- 适合: 往复式加工、测试

### S型加速曲线

采用正弦函数实现平滑加速，避免步进电机失步:

```
加速阶段: v(t) = Vmax × (1 - cos(π × t / T)) / 2
减速阶段: v(t) = Vmax × (1 + cos(π × t / T)) / 2
```

其中:
- `Vmax`: 目标速度 (mm/s)
- `T`: 加速时间 (ms)
- `t`: 当前时间 (ms)

**S曲线特点:**
- 加速度从0开始，平滑增加
- 中间达到最大加速度
- 到达目标速度时加速度回到0
- 减小机械冲击，提高定位精度

## 编译上传

### 环境要求

- [PlatformIO IDE](https://platformio.org/)
- ESP32 平台支持

### 依赖库

```ini
lib_deps = 
    adafruit/Adafruit SSD1306@^2.5.7
    adafruit/Adafruit GFX Library@^1.11.9
```

### 编译命令

```bash
# 编译
pio run

# 上传
pio run -t upload

# 监控串口
pio device monitor
```

## 参数范围

| 参数 | 最小值 | 最大值 | 默认值 | 增量 | 单位 |
|------|--------|--------|--------|------|------|
| 速度 | 1 | 200 | 50 | ±5 | mm/s |
| 距离 | 1 | 400 | 100 | ±10 | mm |
| 时间 | 1 | 3600 | 10 | ±1 | s |
| 加速时间 | 100 | 2000 | 500 | ±50 | ms |

## 性能计算

### 理论最大速度

```
最大步频 = 40,000 Hz (软件限制)
每步距离 = 0.0125 mm
理论最大速度 = 40000 × 0.0125 = 500 mm/s

实际设置最大 200 mm/s (考虑电机扭矩下降)
```

### 定位精度

```
微步分辨率 = 1/16
每圈步数 = 200 × 16 = 3200 步
每圈位移 = 40 mm
分辨率 = 40 / 3200 = 0.0125 mm = 12.5 μm
```

## 串口调试输出

```
========================================
  ESP32-WROOM-32E Stepper Controller
  S-Curve Acceleration System
========================================
System Configuration:
  Motor: 17HS3401S (200 steps/rev)
  Microstep: 1/16
  Belt: 2GT 20 teeth pulley
  Resolution: 0.0125 mm/step
  Max Travel: 400.00 mm
  Speed Range: 1 - 200 mm/s
----------------------------------------
Starting motion...
  Target Speed: 50.00 mm/s
  Accel Time: 500 ms
  Mode: Continuous
  Direction: Forward
Motor ENABLED
Motion task created!
Accel time: 500 ms
Motion task completed!
Total distance: 245.75 mm
Total time: 10.02 s
Motion stopped!
```

## 安全注意事项

⚠️ **警告**:

1. **机械安全**: 运行前确保传动系统无障碍物
2. **行程限制**: 不要超过最大行程 (400mm)
3. **运行干预**: 电机运行时避免手动干预皮带/惰轮
4. **首次测试**: 首次使用请低速测试
5. **电源安全**: 确保12V电源极性正确
6. **散热**: 长时间运行注意DRV8825散热

## 故障排除

| 问题 | 可能原因 | 解决方法 |
|------|----------|----------|
| 电机不转 | EN未使能 | 检查GPIO27连接 |
| 电机振动不转 | 接线顺序错误 | 检查电机4线连接 |
| 失步 | 速度过快 | 降低速度或增加加速时间 |
| OLED不显示 | I2C地址错误 | 确认地址0x3C |

## 扩展功能 (TODO)

- [ ] 限位开关支持
- [ ] 自动归零/回原点功能
- [ ] 速度曲线预设保存
- [ ] WiFi/蓝牙远程控制
- [ ] 参数 EEPROM/NVS 保存
- [ ] 中文界面支持
- [ ] 多段运动编程

## 项目结构

```
ESP32-WROOM-32E-Stepper/
├── platformio.ini          # PlatformIO配置
├── README.md               # 项目说明
├── include/
│   └── chinese_font.h      # 中文字库 (备用)
└── src/
    └── main.cpp            # 主程序
```

## 上传说明

ESP32-WROOM-32E 开发板通常已集成 USB-TTL 芯片 (如 CP2102/CH340)，可直接上传：

```bash
# 编译上传
pio run -t upload

# 监控串口
pio device monitor -b 115200
```

如遇上传问题，可尝试：
1. 按住 **BOOT** 按钮
2. 按一下 **EN/RST** 按钮
3. 松开 **BOOT** 按钮
4. 执行上传命令

## 许可证

MIT License

## 更新日志

### v1.0.0 (2026-01-19)
- 初始版本 (ESP32-C3)

### v1.1.0 (2026-01-19)
- 迁移至 ESP32-S2 Mini
- 优化引脚分配
- 更新 I2C 默认引脚

### v1.2.0 (2026-01-19)
- 迁移至 ESP32-WROOM-32E
- 双核处理器，更稳定
- 使用标准 USB-TTL 上传
- 新引脚分配:
  - STEP=GPIO25, DIR=GPIO26, EN=GPIO27
  - M0=GPIO14, M1=GPIO12, M2=GPIO13
  - I2C: SDA=GPIO21, SCL=GPIO22
  - 按键: UP=GPIO32, DOWN=GPIO33, ENTER=GPIO18, BACK=GPIO19

---

作者: GitHub Copilot  
日期: 2026-01-19
