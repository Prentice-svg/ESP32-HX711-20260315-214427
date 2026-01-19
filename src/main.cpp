/**
 * ESP32-C3 SuperMini UPS Simulator
 * Megatec Q1 Protocol Emulation for Linux NUT / 飞牛NAS
 * 
 * 硬件配置:
 * - MCU: ESP32-C3 SuperMini (使用原生 USB Serial)
 * - 传感器: INA226 (I2C 地址 0x44, 采样电阻 0.025Ω)
 * - 显示: 0.96寸 OLED (SSD1315/SSD1306 I2C)
 * 
 * 串口波特率: 115200 (USB 虚拟串口)
 * 注: 传统 RS232 UPS 通常使用 2400 波特率
 * 
 * NUT 配置示例 (/etc/nut/ups.conf):
 * [myups]
 *     driver = blazer_ser
 *     port = /dev/ttyACM0
 *     desc = "ESP32-C3 Simulated UPS"
 * 
 * 作者: GitHub Copilot
 * 日期: 2026-01-05
 */

#include <Arduino.h>
#include <Wire.h>
#include <INA226.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "chinese_font.h"

// ==================== 硬件配置 ====================

// I2C 引脚定义 (ESP32-C3 SuperMini)
// 注意: GPIO8 是板载 LED，不能用作 I2C！
#define I2C_SDA_PIN         4
#define I2C_SCL_PIN         5

// INA226 配置
#define INA226_ADDRESS      0x44
#define SHUNT_RESISTOR      0.025   // 采样电阻 25mΩ
#define MAX_CURRENT         5.0     // 最大电流 5A

// 校准系数 (根据实际测量调整)
// 计算方法: 实际电压 / 显示电压 = 12.56 / 13.30 ≈ 0.944
#define VOLTAGE_CALIBRATION 0.944   // 电压校准系数
#define CURRENT_CALIBRATION 1.0     // 电流校准系数 (如需要可调整)

// OLED 配置
#define SCREEN_WIDTH        128
#define SCREEN_HEIGHT       64
#define OLED_RESET          -1      // 无复位引脚
#define OLED_ADDRESS        0x3C    // SSD1315/SSD1306 默认地址

// UPS 模拟参数
#define SIMULATED_MAX_POWER 15.0    // 模拟 UPS 最大功率 (W)
#define AC_ONLINE_THRESHOLD 11.8    // 市电在线电压阈值 (V)
#define LOW_BATTERY_THRESHOLD 10.8  // 低电量阈值 (V)
#define MAINS_OK_THRESHOLD  11.0    // 市电正常阈值 (V)

// 串口配置
#define SERIAL_BAUD_RATE    115200
#define SERIAL_TIMEOUT_MS   100

// ==================== 全局对象 ====================

INA226 ina226(INA226_ADDRESS);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ==================== 状态变量 ====================

// INA226 读数
float busVoltage = 0.0;       // 总线电压 (V)
float shuntCurrent = 0.0;     // 电流 (A)
float power = 0.0;            // 功率 (W)

// 滤波缓冲区
#define FILTER_SIZE 8
float voltageBuffer[FILTER_SIZE] = {0};
float currentBuffer[FILTER_SIZE] = {0};
float powerBuffer[FILTER_SIZE] = {0};
int filterIndex = 0;
bool filterFilled = false;

// UPS 模拟状态
bool onBattery = false;       // true = 电池供电, false = 市电在线
bool lowBattery = false;      // true = 电量低
bool inaConnected = false;    // INA226 连接状态

// 串口缓冲区
String serialBuffer = "";
unsigned long lastUpdateTime = 0;
const unsigned long UPDATE_INTERVAL = 500; // 更新间隔 (ms)

// ==================== 函数声明 ====================

void initINA226();
void initOLED();
void readSensors();
void updateUPSStatus();
void processSerialCommand(String cmd);
void sendQ1Response();
void sendInfoResponse();
void sendRatingResponse();
void updateDisplay();
String formatFloat(float value, int width, int decimals);
void drawChineseChar(int x, int y, const uint8_t charData[3][12]);

// ==================== 初始化 ====================

void setup() {
    // 初始化串口 (USB CDC)
    Serial.begin(SERIAL_BAUD_RATE);
    Serial.setTimeout(SERIAL_TIMEOUT_MS);
    
    // 等待串口就绪 (USB CDC 需要)
    delay(1000);
    
    // 初始化 I2C
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
    Wire.setClock(400000); // 400kHz Fast Mode
    
    // 初始化外设
    initOLED();
    initINA226();
    
    // 初始显示
    updateDisplay();
}

// ==================== 主循环 ====================

void loop() {
    // 处理串口数据
    while (Serial.available() > 0) {
        char c = Serial.read();
        
        if (c == '\r' || c == '\n') {
            // 收到命令结束符
            if (serialBuffer.length() > 0) {
                processSerialCommand(serialBuffer);
                serialBuffer = "";
            }
        } else {
            // 累积字符
            serialBuffer += c;
            
            // 防止缓冲区溢出
            if (serialBuffer.length() > 32) {
                serialBuffer = "";
            }
        }
    }
    
    // 定时更新传感器和显示
    unsigned long currentTime = millis();
    if (currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
        lastUpdateTime = currentTime;
        
        readSensors();
        updateUPSStatus();
        updateDisplay();
    }
}

// ==================== INA226 初始化 ====================

void initINA226() {
    if (ina226.begin()) {
        inaConnected = true;
        
        // 配置 INA226
        // 设置采样电阻值 (mΩ)
        ina226.setMaxCurrentShunt(MAX_CURRENT, SHUNT_RESISTOR);
        
        // 配置平均采样次数和转换时间
        // AVG = 128 (更高的硬件平均), VBUS CT = 2.116ms, VSH CT = 2.116ms
        ina226.setAverage(128);
        ina226.setBusVoltageConversionTime(6);  // 2.116ms
        ina226.setShuntVoltageConversionTime(6); // 2.116ms
        
        // 设置为连续测量模式 (mode 7 = Shunt and Bus, Continuous)
        ina226.setMode(7);
    } else {
        inaConnected = false;
    }
}

// ==================== OLED 初始化 ====================

void initOLED() {
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
        // OLED 初始化失败，继续运行但不显示
        return;
    }
    
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println(F("ESP32-C3 UPS Sim"));
    display.println(F("Megatec Q1 Protocol"));
    display.println(F(""));
    display.println(F("Initializing..."));
    display.display();
    delay(1000);
}

// ==================== 传感器读取 ====================

// 中值滤波 + 移动平均滤波
float applyFilter(float newValue, float* buffer, int size) {
    // 更新缓冲区
    buffer[filterIndex % size] = newValue;
    
    // 复制数组用于排序
    float sorted[FILTER_SIZE];
    int validCount = filterFilled ? size : (filterIndex % size) + 1;
    for (int i = 0; i < validCount; i++) {
        sorted[i] = buffer[i];
    }
    
    // 简单冒泡排序
    for (int i = 0; i < validCount - 1; i++) {
        for (int j = 0; j < validCount - i - 1; j++) {
            if (sorted[j] > sorted[j + 1]) {
                float temp = sorted[j];
                sorted[j] = sorted[j + 1];
                sorted[j + 1] = temp;
            }
        }
    }
    
    // 去掉最大最小值，取中间值平均
    if (validCount >= 4) {
        float sum = 0;
        for (int i = 1; i < validCount - 1; i++) {
            sum += sorted[i];
        }
        return sum / (validCount - 2);
    } else {
        // 数据不足时直接返回中值
        return sorted[validCount / 2];
    }
}

void readSensors() {
    if (!inaConnected) {
        // 尝试重新连接
        initINA226();
        return;
    }
    
    // 读取 INA226 原始数据
    float rawVoltage = ina226.getBusVoltage();
    float rawCurrent = ina226.getCurrent();
    float rawPower = ina226.getPower();
    
    // 检查读数有效性
    if (isnan(rawVoltage) || rawVoltage < 0 || rawVoltage > 30) {
        // 无效数据，跳过本次更新
        return;
    }
    
    // 修正负值 (根据电流方向)
    if (rawCurrent < 0) {
        rawCurrent = -rawCurrent;
    }
    if (rawPower < 0) {
        rawPower = -rawPower;
    }
    
    // 应用滤波
    float filteredVoltage = applyFilter(rawVoltage, voltageBuffer, FILTER_SIZE);
    float filteredCurrent = applyFilter(rawCurrent, currentBuffer, FILTER_SIZE);
    float filteredPower = applyFilter(rawPower, powerBuffer, FILTER_SIZE);
    
    // 应用校准系数
    busVoltage = filteredVoltage * VOLTAGE_CALIBRATION;
    shuntCurrent = filteredCurrent * CURRENT_CALIBRATION;
    power = busVoltage * shuntCurrent;  // 重新计算功率以确保一致性
    
    // 更新滤波索引
    filterIndex++;
    if (filterIndex >= FILTER_SIZE) {
        filterFilled = true;
    }
}

// ==================== UPS 状态更新 ====================

void updateUPSStatus() {
    // 判断是否为电池供电模式
    // 当电压低于阈值时，认为市电已断开
    if (busVoltage < AC_ONLINE_THRESHOLD && busVoltage > 0) {
        onBattery = true;
    } else if (busVoltage >= MAINS_OK_THRESHOLD || busVoltage == 0) {
        onBattery = false;
    }
    
    // 判断电池电量是否过低 (触发 NAS 关机)
    if (busVoltage < LOW_BATTERY_THRESHOLD && busVoltage > 0) {
        lowBattery = true;
    } else {
        lowBattery = false;
    }
}

// ==================== 串口命令处理 ====================

void processSerialCommand(String cmd) {
    cmd.trim();
    
    if (cmd == "Q1") {
        // 状态查询 (Megatec Q1 协议核心命令)
        sendQ1Response();
    }
    else if (cmd == "I") {
        // 型号查询
        sendInfoResponse();
    }
    else if (cmd == "F") {
        // 额定值查询
        sendRatingResponse();
    }
    else if (cmd == "T") {
        // 10秒测试 (模拟)
        Serial.print("OK\r");
    }
    else if (cmd == "TL") {
        // 持续测试直到电量低 (模拟)
        Serial.print("OK\r");
    }
    else if (cmd == "Q") {
        // 取消测试
        Serial.print("OK\r");
    }
    else if (cmd == "C") {
        // 取消关机
        Serial.print("OK\r");
    }
    // 其他未知命令静默忽略
}

// ==================== Q1 响应 (状态查询) ====================

void sendQ1Response() {
    // Megatec Q1 响应格式:
    // (MMM.M NNN.N PPP.P QQQ RR.R S.S TT.T b7b6b5b4b3b2b1b0\r
    //
    // MMM.M - 输入电压 (V)
    // NNN.N - 输入故障电压 (V)
    // PPP.P - 输出电压 (V)
    // QQQ   - 负载百分比 (%)
    // RR.R  - 频率 (Hz)
    // S.S   - 电池电压 (V) (按 12V 铅酸电池格式)
    // TT.T  - 温度 (°C)
    // b7-b0 - 状态位
    
    char response[64];
    
    // 输入电压: 如果电池电压 > 11V，认为市电在线
    String inputVoltage = (busVoltage > MAINS_OK_THRESHOLD) ? "220.0" : "000.0";
    String faultVoltage = inputVoltage; // 故障电压同输入电压
    
    // 输出电压: 使用 INA226 读取的实际电压
    String outputVoltage = formatFloat(busVoltage, 5, 1);
    
    // 负载百分比: (功率 / 最大功率) * 100
    int loadPercent = (int)((power / SIMULATED_MAX_POWER) * 100);
    if (loadPercent > 100) loadPercent = 100;
    if (loadPercent < 0) loadPercent = 0;
    
    // 频率: 固定 50Hz
    String frequency = "50.0";
    
    // 电池电压: 模拟 12V 铅酸电池
    // 将实际电压映射到铅酸电池范围 (10.5V - 14.4V)
    float simBatteryVoltage = busVoltage;
    if (simBatteryVoltage > 14.4) simBatteryVoltage = 14.4;
    if (simBatteryVoltage < 0) simBatteryVoltage = 0;
    String batteryVoltage = formatFloat(simBatteryVoltage, 4, 1);
    
    // 温度: 读取 ESP32-C3 内部温度或固定值
    float temperature = temperatureRead(); // ESP32-C3 内部温度传感器
    if (isnan(temperature) || temperature < -40 || temperature > 85) {
        temperature = 25.0;
    }
    String tempStr = formatFloat(temperature, 4, 1);
    
    // 构建状态位 (8位二进制)
    // Bit 7: 1=电池供电, 0=市电
    // Bit 6: 1=电量低, 0=电量正常
    // Bit 5: 1=旁路/稳压激活, 0=正常
    // Bit 4: 1=UPS故障, 0=正常
    // Bit 3: 1=UPS类型为待机/在线, 0=在线
    // Bit 2: 1=测试进行中, 0=无测试
    // Bit 1: 1=关机激活, 0=正常
    // Bit 0: 1=蜂鸣器静音, 0=蜂鸣器启用
    
    uint8_t statusBits = 0;
    
    if (onBattery) {
        statusBits |= 0x80;  // Bit 7: 电池供电
    }
    
    if (lowBattery) {
        statusBits |= 0x40;  // Bit 6: 电量低
    }
    
    // Bit 3: 设为 1 表示这是待机/离线 UPS
    statusBits |= 0x08;
    
    // 转换为二进制字符串
    char statusStr[9];
    for (int i = 7; i >= 0; i--) {
        statusStr[7 - i] = (statusBits & (1 << i)) ? '1' : '0';
    }
    statusStr[8] = '\0';
    
    // 构建完整响应
    // 格式: (MMM.M NNN.N PPP.P QQQ RR.R SS.S TT.T b7b6b5b4b3b2b1b0
    snprintf(response, sizeof(response), 
             "(%s %s %s %03d %s %s %s %s\r",
             inputVoltage.c_str(),
             faultVoltage.c_str(),
             outputVoltage.c_str(),
             loadPercent,
             frequency.c_str(),
             batteryVoltage.c_str(),
             tempStr.c_str(),
             statusStr);
    
    Serial.print(response);
}

// ==================== I 响应 (型号信息) ====================

void sendInfoResponse() {
    Serial.print("#Simulated_UPS_ESP32C3\r");
}

// ==================== F 响应 (额定值) ====================

void sendRatingResponse() {
    // 格式: #MMM.M QQQ SS.SS RR.R
    // MMM.M - 额定电压 (V)
    // QQQ   - 额定电流 (A)
    // SS.SS - 电池电压 (V)
    // RR.R  - 频率 (Hz)
    Serial.print("#220.0 005 012.0 50.0\r");
}

// ==================== 中文显示函数 ====================

/**
 * 绘制单个中文字符 (3列 x 12行，每列5位有效)
 * @param x X 坐标
 * @param y Y 坐标
 * @param charData 字符数据 [3][12]
 */
void drawChineseChar(int x, int y, const uint8_t charData[3][12]) {
    for (int col = 0; col < 3; col++) {
        for (int row = 0; row < 12; row++) {
            uint8_t byte = charData[col][row];
            // 每字节5位有效数据 (bit4-bit0)
            for (int bit = 0; bit < 5; bit++) {
                if (byte & (0x10 >> bit)) {
                    display.drawPixel(x + col * 5 + bit, y + row, SSD1306_WHITE);
                }
            }
        }
    }
}

// ==================== OLED 显示更新 ====================

void updateDisplay() {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    
    // 传感器数据区
    if (inaConnected) {
        // 电压行: "电压:" + 数值 (电 + 压 = 15+15 = 30像素宽)
        drawChineseChar(0, 0, char_dian);    // 电
        drawChineseChar(16, 0, char_ya);     // 压
        display.setCursor(34, 2);
        display.print(busVoltage, 2);
        display.print(" V");
        
        // 电流行: "电流:" + 数值
        drawChineseChar(0, 14, char_dian);   // 电
        drawChineseChar(16, 14, char_liu);   // 流
        display.setCursor(34, 16);
        display.print(shuntCurrent * 1000, 1);
        display.print(" mA");
        
        // 功率行: "功率:" + 数值
        drawChineseChar(0, 28, char_gong);   // 功
        drawChineseChar(16, 28, char_lv);    // 率
        display.setCursor(34, 30);
        display.print(power, 2);
        display.print(" W");
    } else {
        display.setCursor(0, 0);
        display.print("INA226 OFFLINE");
        display.setCursor(0, 12);
        display.print("Check I2C wiring");
        display.setCursor(0, 24);
        display.print("Addr: 0x44");
    }
    
    // 分隔线
    display.drawLine(0, 44, 127, 44, SSD1306_WHITE);
    
    // 状态栏 (底部)
    if (lowBattery) {
        // 电量低警告: 电量低警告
        drawChineseChar(4, 48, char_dian);    // 电
        drawChineseChar(20, 48, char_liang);  // 量
        drawChineseChar(36, 48, char_di);     // 低
        drawChineseChar(52, 48, char_jing);   // 警
        drawChineseChar(68, 48, char_gao);    // 告
    } else if (onBattery) {
        // 电池供电模式
        drawChineseChar(4, 48, char_dian);    // 电
        drawChineseChar(20, 48, char_chi);    // 池
        drawChineseChar(36, 48, char_gong2);  // 供
        drawChineseChar(52, 48, char_dian);   // 电
        drawChineseChar(68, 48, char_mo);     // 模
        drawChineseChar(84, 48, char_shi2);   // 式
    } else {
        // 市电正常模式
        drawChineseChar(4, 48, char_shi);     // 市
        drawChineseChar(20, 48, char_dian);   // 电
        drawChineseChar(36, 48, char_zheng);  // 正
        drawChineseChar(52, 48, char_chang);  // 常
        drawChineseChar(68, 48, char_mo);     // 模
        drawChineseChar(84, 48, char_shi2);   // 式
    }
    
    display.display();
}

// ==================== 辅助函数 ====================

/**
 * 格式化浮点数为固定宽度字符串
 * @param value 浮点数值
 * @param width 总宽度
 * @param decimals 小数位数
 * @return 格式化后的字符串
 */
String formatFloat(float value, int width, int decimals) {
    char buffer[16];
    dtostrf(value, width, decimals, buffer);
    
    // 替换前导空格为0 (Megatec 协议要求)
    for (int i = 0; i < strlen(buffer); i++) {
        if (buffer[i] == ' ') {
            buffer[i] = '0';
        } else {
            break; // 只替换前导空格
        }
    }
    
    return String(buffer);
}
