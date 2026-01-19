# ESP32-C3 SuperMini UPS Simulator

基于 ESP32-C3 SuperMini 的 UPS 模拟器，实现 **Megatec Q1 协议**，可被飞牛NAS / Linux NUT 原生识别。

## 功能特性

- ✅ 完整 Megatec Q1 协议支持
- ✅ INA226 电压/电流/功率实时监测
- ✅ 0.96寸 OLED 状态显示
- ✅ 自动市电/电池模式切换
- ✅ 低电量告警（触发 NAS 关机）
- ✅ 数字滤波稳定读数

## 硬件需求

| 组件 | 型号/规格 |
|------|-----------|
| MCU | ESP32-C3 SuperMini |
| 电流传感器 | INA226 (I2C 地址 0x44) |
| 采样电阻 | 0.025Ω (25mΩ) |
| 显示屏 | 0.96寸 OLED SSD1306/SSD1315 |

## 接线图

```
ESP32-C3 SuperMini          INA226 / OLED
     GPIO4  ────────────────  SDA
     GPIO5  ────────────────  SCL
     3.3V   ────────────────  VCC
     GND    ────────────────  GND
```

> ⚠️ **注意**: GPIO8 是板载 LED，请勿用于 I2C！

## 软件配置

### PlatformIO 环境

- Platform: espressif32
- Board: esp32-c3-devkitm-1
- Framework: Arduino

### 依赖库

- `robtillaart/INA226`
- `adafruit/Adafruit SSD1306`
- `adafruit/Adafruit GFX Library`

### 编译上传

```bash
# 编译
pio run

# 上传
pio run --target upload
```

## 校准参数

在 `src/main.cpp` 中调整：

```cpp
#define VOLTAGE_CALIBRATION 0.944   // 电压校准系数
#define CURRENT_CALIBRATION 1.0     // 电流校准系数
```

**校准方法**: 用万用表测量实际电压，计算 `实际电压 / 显示电压` 得到校准系数。

## Megatec Q1 协议

### 支持的命令

| 命令 | 响应格式 | 说明 |
|------|----------|------|
| `Q1\r` | `(MMM.M NNN.N PPP.P QQQ RR.R S.S TT.T b7b6b5b4b3b2b1b0\r` | 状态查询 |
| `I\r` | `#Simulated_UPS_ESP32C3\r` | 型号查询 |
| `F\r` | `#220.0 005 012.0 50.0\r` | 额定值查询 |

### Q1 响应字段

| 字段 | 说明 | 数据来源 |
|------|------|----------|
| MMM.M | 输入电压 (V) | 电压 > 11V 显示 220.0，否则 000.0 |
| NNN.N | 故障电压 (V) | 同输入电压 |
| PPP.P | 输出电压 (V) | INA226 实测电压 |
| QQQ | 负载 (%) | (功率 / 15W) × 100 |
| RR.R | 频率 (Hz) | 固定 50.0 |
| S.S | 电池电压 (V) | INA226 实测电压 |
| TT.T | 温度 (°C) | ESP32-C3 内部温度 |
| b7-b0 | 状态位 | 见下表 |

### 状态位定义

| 位 | 含义 | 触发条件 |
|----|------|----------|
| b7 | 电池供电 | 电压 < 11.8V |
| b6 | 电量低 | 电压 < 10.8V（触发关机） |
| b5 | 旁路激活 | 固定 0 |
| b4 | UPS 故障 | 固定 0 |
| b3 | UPS 类型 | 固定 1（待机式） |
| b2 | 测试中 | 固定 0 |
| b1 | 关机激活 | 固定 0 |
| b0 | 蜂鸣器静音 | 固定 0 |

## 飞牛 NAS / Linux NUT 配置

### 1. 安装 NUT

```bash
# Debian/Ubuntu
sudo apt install nut

# 飞牛 NAS 通常已预装
```

### 2. 配置 UPS (`/etc/nut/ups.conf`)

```ini
[myups]
    driver = blazer_ser
    port = /dev/ttyACM0
    desc = "ESP32-C3 Simulated UPS"
```

### 3. 配置访问权限 (`/etc/nut/upsd.users`)

```ini
[admin]
    password = secret
    actions = SET
    instcmds = ALL

[upsmon]
    password = secret
    upsmon master
```

### 4. 配置监控 (`/etc/nut/upsmon.conf`)

```ini
MONITOR myups@localhost 1 upsmon secret master
SHUTDOWNCMD "/sbin/shutdown -h +0"
```

### 5. 启动服务

```bash
sudo systemctl restart nut-server
sudo systemctl restart nut-monitor
```

### 6. 验证连接

```bash
# 查看 UPS 状态
upsc myups

# 应显示类似：
# battery.voltage: 12.56
# input.voltage: 220.0
# ups.status: OL
```

## 状态指示

### OLED 显示

```
== UPS Simulator ==
─────────────────────
Volt: 12.56 V
Curr: 150.0 mA
Powr: 1.88 W
─────────────────────
AC MODE
```

### 状态模式

| 显示 | 含义 | 条件 |
|------|------|------|
| `AC MODE` | 市电在线 | 电压 ≥ 11.8V |
| `BAT MODE` | 电池供电 | 电压 < 11.8V |
| `LOW BATT!` | 电量低 | 电压 < 10.8V |

## 阈值配置

```cpp
#define AC_ONLINE_THRESHOLD   11.8   // 市电在线阈值 (V)
#define LOW_BATTERY_THRESHOLD 10.8   // 低电量阈值 (V)
#define MAINS_OK_THRESHOLD    11.0   // 市电恢复阈值 (V)
#define SIMULATED_MAX_POWER   15.0   // 模拟最大功率 (W)
```

## 串口配置

- **波特率**: 115200 (USB 虚拟串口)
- **数据位**: 8
- **停止位**: 1
- **校验位**: 无

> 💡 传统 RS232 UPS 通常使用 2400 波特率，但 USB CDC 无此限制。

## 许可证

MIT License

## 参考资料

- [Megatec Protocol Documentation](http://networkupstools.org/protocols/megatec.html)
- [Network UPS Tools (NUT)](https://networkupstools.org/)
- [INA226 Datasheet](https://www.ti.com/product/INA226)
- [ESP32-C3 Technical Reference](https://www.espressif.com/sites/default/files/documentation/esp32-c3_technical_reference_manual_en.pdf)
