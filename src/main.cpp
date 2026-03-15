/**
 * ESP32-WROOM-32E 步进电机调速仪 + Phyphox 力学实验
 * Stepper Motor Speed Controller with S-Curve Acceleration
 * 
 * 硬件配置:
 * - MCU: ESP32-WROOM-32E (双核 Xtensa LX6 @ 240MHz)
 * - 驱动: DRV8825 步进电机驱动模块
 * - 电机: 17HS3401S (1.8°步距角, 200步/圈)
 * - 传动: 绕线轴 (直径 7mm，线绕在轴上拉动物体)
 * - 力传感器: HX711 + 称重传感器
 * 
 * 接线 (ESP32-WROOM-32E):
 * - STEP  -> GPIO25
 * - DIR   -> GPIO26
 * - EN    -> GPIO27
 * - M0/M1/M2 -> 用跳线帽设置微步 (不由MCU控制)
 * - BTN_UP    -> GPIO32
 * - BTN_DOWN  -> GPIO33
 * - BTN_ENTER -> GPIO18
 * - BTN_BACK  -> GPIO19
 * - SDA   -> GPIO21
 * - SCL   -> GPIO22
 * - HX711_DOUT -> GPIO16
 * - HX711_SCK  -> GPIO17
 * 
 * 注意: M0/M1/M2 不再由 MCU 控制，请用跳线帽设置:
 *   全步: M0=L, M1=L, M2=L (或全部悬空)
 *   1/16: M0=L, M1=L, M2=H
 */

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <HX711.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Preferences.h>  // NVS存储

// 禁用掉电检测器 (解决 USB 供电不足导致的重启问题)
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// NVS存储对象
Preferences preferences;

// ==================== 引脚配置 ====================

// DRV8825 控制引脚 (只用3个)
#define PIN_STEP            25
#define PIN_DIR             26
#define PIN_ENABLE          27

// 按键 (低电平有效)
#define PIN_BTN_UP          32
#define PIN_BTN_DOWN        33
#define PIN_BTN_ENTER       18
#define PIN_BTN_BACK        19

// I2C (OLED)
#define I2C_SDA_PIN         21
#define I2C_SCL_PIN         22

// HX711 力传感器
#define HX711_DOUT_PIN      16
#define HX711_SCK_PIN       17

// ==================== OLED 配置 ====================

#define SCREEN_WIDTH        128
#define SCREEN_HEIGHT       64
#define OLED_ADDRESS        0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ==================== HX711 力传感器 ====================

HX711 scale;
float forceReading = 0;           // 当前力读数 (N)
float forceCalibration = 420.0;   // 校准系数 (根据传感器调整)
float forceTare = 0;              // 零点偏移
bool hx711Ready = false;

// 校准参数
const float CALIBRATION_MASS = 100.0;   // 校准砝码质量 (g)
const float GRAVITY = 9.80665;          // 重力加速度 (m/s²)
const float G_TO_N = GRAVITY / 1000.0;  // g 转 N 系数 (0.00980665)
bool calibrationMode = false;           // 校准模式标志
int calibrationStep = 0;                // 校准步骤: 0=等待空载, 1=等待放砝码, 2=完成
long calibrationZeroRaw = 0;            // 校准时的零点ADC原始值
long calibrationLoadRaw = 0;            // 校准时放砝码的ADC原始值

// 力传感器滤波参数 - 卡尔曼滤波
float kalmanEstimate = 0;         // 卡尔曼估计值
float kalmanErrorEst = 1.0;       // 估计误差协方差
const float KALMAN_Q = 0.01;      // 过程噪声协方差 (越小越平滑，但响应慢)
const float KALMAN_R = 0.1;       // 测量噪声协方差 (越大越平滑，但响应慢)
bool kalmanInitialized = false;   // 卡尔曼滤波器是否已初始化

// ==================== BLE Phyphox ====================

#define SERVICE_UUID        "cddf1001-30f7-4671-8b43-5e40ba53514a"
#define CHAR_SPEED_UUID     "cddf1002-30f7-4671-8b43-5e40ba53514a"
#define CHAR_FORCE_UUID     "cddf1003-30f7-4671-8b43-5e40ba53514a"
#define CHAR_DISTANCE_UUID  "cddf1004-30f7-4671-8b43-5e40ba53514a"
#define CHAR_TIME_UUID      "cddf1005-30f7-4671-8b43-5e40ba53514a"

BLEServer *pServer = NULL;
BLECharacteristic *pSpeedChar = NULL;
BLECharacteristic *pForceChar = NULL;
BLECharacteristic *pDistanceChar = NULL;
BLECharacteristic *pTimeChar = NULL;
bool bleConnected = false;
bool phyphoxMode = false;         // Phyphox 实验模式
uint32_t bleStartTime = 0;

// ==================== 电机参数 ====================

// 微步设置 - 根据 DRV8825 跳线帽实际设置修改此值
// 全步=1, 半步=2, 1/4=4, 1/8=8, 1/16=16, 1/32=32
// 
// 当前接法: M0=VCC, M1=悬空(GND), M2=VCC → 1/32 微步 (最平滑)
#define MICROSTEP_DIV       32      // 当前: 1/32 微步

#define STEPS_PER_REV       200     // 步进电机每圈步数 (1.8°步距角)

// ==================== 绕线轴传动参数 ====================
// 线绕在轴上，电机转动时线缠绕/释放，拉动物体
// 每转一圈，线移动距离 = π × 轴直径
#define SPOOL_DIAMETER      7.0     // 绕线轴直径 (mm)

// 计算每毫米步数
// 每圈线位移 = π × D = 3.14159 × 7 = 21.99 mm
// 每圈总步数 = 200 × 32 = 6400 步
// STEPS_PER_MM = 6400 / 21.99 ≈ 291.0 步/mm
const float MM_PER_REV = PI * SPOOL_DIAMETER;   // 每转一圈的线位移 (mm)
const float STEPS_PER_MM = (float)(STEPS_PER_REV * MICROSTEP_DIV) / MM_PER_REV;
const float MM_PER_STEP = 1.0 / STEPS_PER_MM;

// ==================== 运动参数 ====================

float targetSpeed = 50.0;           // mm/s
float targetDistance = 100.0;       // mm
uint32_t targetTime = 10;           // 秒
uint32_t accelTime = 1500;          // ms (加长加速时间减少震动)
bool direction = true;              // true=正向

// 平滑度参数
// 绕线轴 STEPS_PER_MM ≈ 291，速度 v mm/s 对应频率 v*291 Hz
// 低速时频率低，容易震动；需要起步速度足够高以跳过低频共振
const float MIN_START_SPEED = 5.0;   // mm/s 最小起步速度 (对应 1455 Hz)

// ==================== 共振补偿参数 ====================
// 步进电机在特定频率会共振，通常在 50-200 Hz 和 500-1500 Hz
// 共振频率 = 速度(mm/s) * STEPS_PER_MM
// 对于 1/32 微步 + 绕线轴(7mm): STEPS_PER_MM ≈ 291, 所以:
//   100 Hz 共振 ≈ 0.34 mm/s (低于起步速度，跳过)
//   500 Hz 共振 ≈ 1.72 mm/s (低于起步速度，跳过)
//   800 Hz 共振 ≈ 2.75 mm/s (低于起步速度，跳过)
//   1200 Hz 共振 ≈ 4.12 mm/s (低于起步速度，跳过)
//   高频共振一般在1500-3000 Hz ≈ 5.2-10.3 mm/s

// 共振区间 (mm/s) - 根据实际电机特性调整
const float RESONANCE_ZONE1_LOW = 6.0;    // 第一共振区下限 (~1750 Hz)
const float RESONANCE_ZONE1_HIGH = 12.0;  // 第一共振区上限 (~3500 Hz)
const float RESONANCE_ZONE2_LOW = 20.0;   // 第二共振区下限 (~5800 Hz)
const float RESONANCE_ZONE2_HIGH = 35.0;  // 第二共振区上限 (~10200 Hz)

// 共振区平滑过渡参数
const float RESONANCE_TRANSITION_WIDTH = 2.0;  // 过渡区宽度（mm/s）

// 补偿强度
const uint32_t DITHER_AMOUNT = 5;         // 脉冲抖动量 (微秒) - 减小抖动量
const float RESONANCE_ACCEL_BOOST = 1.5;  // 共振区加速倍率 - 快速通过

enum MotionMode { MODE_CONTINUOUS, MODE_DISTANCE, MODE_RECIPROCATE, MODE_RESONANCE_SCAN };
MotionMode motionMode = MODE_CONTINUOUS;

// ==================== 菜单系统 (WouoUI 风格丝滑动画) ====================

enum MenuState { MENU_MAIN, MENU_RUNNING, MENU_COMPLETED, MENU_CALIBRATE };
MenuState currentMenu = MENU_MAIN;
int menuIndex = 0;
const int MENU_ITEMS = 12;

// WouoUI 风格动画参数
#define LIST_FONT_H     8       // 字体高度
#define LIST_LINE_H     10      // 每行高度（含间距）
#define LIST_TEXT_S     2       // 文字左边距
#define LIST_BAR_W      3       // 右侧滚动条宽度
#define LIST_BOX_R      1       // 选择框圆角半径
#define UI_DEPTH        5       // 最大菜单深度
#define UI_ANI_SPEED    50      // 动画速度 (越大越慢, 10-100)

// 动画状态变量
struct {
    float y;                    // 列表Y偏移 (动画用)
    float y_trg;                // 列表Y偏移目标
    float box_y;                // 选择框Y位置 (动画用)
    float box_y_trg;            // 选择框Y目标位置
    float box_w;                // 选择框宽度 (动画用)
    float box_w_trg;            // 选择框宽度目标
    float bar_y;                // 滚动条位置 (动画用)
    float bar_y_trg;            // 滚动条目标位置
    bool init;                  // 是否完成初始化动画
} uiList = {0, 0, 0, 0, 0, 0, 0, 0, false};

const char* menuLabels[] = {
    "Speed",
    "Distance",
    "Time",
    "Accel",
    "Direction",
    "Mode",
    "ResoScan",   // 共振扫描
    "Phyphox",    // Phyphox 实验模式
    "Tare",       // 力传感器归零
    "Calibrate", // 力传感器校准 (100g砝码)
    "Lock",       // 锁定/解锁电机 (手动控制)
    "START"
};

// ==================== 运行状态 ====================

volatile bool isRunning = false;
volatile bool isPaused = false;
volatile uint32_t stepCounter = 0;
volatile float currentSpeed = 0;
volatile uint32_t stepInterval = 100000;  // 当前步进间隔(微秒)
volatile bool isInAcceleration = false;   // 标记是否在加速/减速阶段（用于控制抖动）
uint32_t runStartTime = 0;
int reciprocateCount = 0;
bool motorLocked = false;  // 电机锁定状态

// 硬件定时器
hw_timer_t *stepTimer = NULL;
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;
volatile uint32_t ditherSeed = 12345;  // 简单随机数种子

// 共振扫描参数
bool resonanceScanMode = false;
float scanSpeed = 5.0;              // 当前扫描速度
const float SCAN_MIN_SPEED = 5.0;   // 扫描起始速度
const float SCAN_MAX_SPEED = 150.0; // 扫描结束速度
const float SCAN_STEP = 0.5;        // 每次速度增量
const uint32_t SCAN_HOLD_MS = 200;  // 每个速度保持时间
uint32_t lastScanStepTime = 0;

// 按键
unsigned long lastButtonTime = 0;
unsigned long lastDisplayTime = 0;
const unsigned long DISPLAY_INTERVAL = 33;   // OLED更新间隔33ms (~30fps，动画更流畅)
unsigned long lastBLETime = 0;
const unsigned long BLE_INTERVAL = 50;       // BLE数据发送间隔50ms (20Hz)

// ==================== BLE 回调 ====================

class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        bleConnected = true;
        Serial.println("BLE: Phyphox connected!");
    }
    void onDisconnect(BLEServer* pServer) {
        bleConnected = false;
        Serial.println("BLE: Phyphox disconnected");
        // 重新开始广播
        pServer->startAdvertising();
    }
};

// ==================== 函数声明 ====================

void IRAM_ATTR onStepTimer();
void initPins();
void initTimer();
void initOLED();
void initHX711();
void initBLE();
void enableMotor(bool en);
void setDirection(bool dir);
void processButtons();
void runMotorStep();
void startMotion();
void stopMotion();
void startResonanceScan();
void updateResonanceScan();
void startPhyphoxMode();
void stopPhyphoxMode();
void updatePhyphox();
void sendBLEData();
void readForce();
void uiAnimation(float *val, float *target, float speed);
void uiMenuInit();
void uiMenuAnimUpdate();
void tareForce();
void saveCalibration();
bool loadCalibration();
void startCalibration();
void doCalibrationStep();
void cancelCalibration();
void drawCalibrationScreen();
void updateDisplay();
void drawMainMenu();
void drawRunningScreen();
void drawScanScreen();
void drawPhyphoxScreen();
void drawCompletedScreen();
float sCurveSpeed(uint32_t elapsedMs, uint32_t accelMs, uint32_t totalMs, float maxSpeed);
uint32_t speedToInterval(float speed);
void updateMotionParams();

// ==================== 初始化 ====================

void setup() {
    // 禁用掉电检测器 (防止 USB 供电不稳定时重启)
    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
    
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("========================================");
    Serial.println("  ESP32 Stepper + Phyphox Force Lab");
    Serial.println("========================================");
    
    initPins();
    initTimer();
    initOLED();
    initHX711();
    initBLE();
    
    enableMotor(false);
    
    Serial.println("Ready!");
    Serial.println("\n--- 传动参数 (绕线轴) ---");
    Serial.print("轴直径 = "); Serial.print(SPOOL_DIAMETER); Serial.println(" mm");
    Serial.print("每圈线位移 = "); Serial.print(MM_PER_REV, 2); Serial.println(" mm");
    Serial.print("微步细分 = 1/"); Serial.println(MICROSTEP_DIV);
    Serial.print("STEPS_PER_MM = "); Serial.println(STEPS_PER_MM, 2);
    Serial.print("MM_PER_STEP = "); Serial.println(MM_PER_STEP, 6);
    Serial.print("每圈总步数 = "); Serial.println(STEPS_PER_REV * MICROSTEP_DIV);
    
    // 初始化 WouoUI 动画系统
    uiMenuInit();
    
    // 初始化完成后立即显示主菜单
    delay(500);
    lastDisplayTime = 0;  // 强制立即更新显示
    updateDisplay();
    Serial.println("WouoUI Menu Ready!");
}

void loop() {
    processButtons();
    
    // 读取力传感器
    readForce();
    
    // Phyphox 实验模式
    if (phyphoxMode) {
        updatePhyphox();
    }
    // 共振扫描模式
    else if (resonanceScanMode) {
        updateResonanceScan();
    }
    // 普通运行模式
    else if (isRunning && !isPaused) {
        updateMotionParams();
    }
    
    // 限制OLED更新频率，避免干扰
    if (millis() - lastDisplayTime >= DISPLAY_INTERVAL) {
        lastDisplayTime = millis();
        updateDisplay();
    }
}

// ==================== 引脚初始化 ====================

void initPins() {
    pinMode(PIN_STEP, OUTPUT);
    pinMode(PIN_DIR, OUTPUT);
    pinMode(PIN_ENABLE, OUTPUT);
    
    digitalWrite(PIN_STEP, LOW);
    digitalWrite(PIN_DIR, HIGH);
    digitalWrite(PIN_ENABLE, HIGH);  // 禁用
    
    pinMode(PIN_BTN_UP, INPUT_PULLUP);
    pinMode(PIN_BTN_DOWN, INPUT_PULLUP);
    pinMode(PIN_BTN_ENTER, INPUT_PULLUP);
    pinMode(PIN_BTN_BACK, INPUT_PULLUP);
    
    Serial.println("Pins initialized (M0/M1/M2 not controlled)");
    Serial.print("  STEP=GPIO"); Serial.println(PIN_STEP);
    Serial.print("  DIR=GPIO"); Serial.println(PIN_DIR);
    Serial.print("  EN=GPIO"); Serial.println(PIN_ENABLE);
}

// ==================== HX711 初始化 ====================

void initHX711() {
    Serial.println("Initializing HX711...");
    scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
    
    if (scale.wait_ready_timeout(1000)) {
        hx711Ready = true;
        
        // 尝试从NVS加载校准数据
        if (loadCalibration()) {
            Serial.println("Using saved calibration data");
        } else {
            // 没有保存的校准数据，使用默认值
            scale.set_scale(forceCalibration);
            scale.tare();
            Serial.println("Using default calibration - please calibrate with 100g weight");
        }
        Serial.println("HX711 ready!");
    } else {
        hx711Ready = false;
        Serial.println("HX711 not found - force sensing disabled");
    }
}

void readForce() {
    static unsigned long lastForceRead = 0;
    if (millis() - lastForceRead < 20) return;  // 50Hz 采样率
    lastForceRead = millis();

    if (hx711Ready && scale.is_ready()) {
        // 读取原始值 (单位: g)
        float rawReading = scale.get_units(1);
        
        // ========== 卡尔曼滤波 ==========
        // 1. 初始化（首次运行）
        if (!kalmanInitialized) {
            kalmanEstimate = rawReading;
            kalmanErrorEst = 1.0;
            kalmanInitialized = true;
        }
        
        // 2. 预测步骤 (Predict)
        // 状态预测: x_pred = x_est (假设力变化缓慢)
        // 误差协方差预测: P_pred = P_est + Q
        float errorPred = kalmanErrorEst + KALMAN_Q;
        
        // 3. 更新步骤 (Update)
        // 卡尔曼增益: K = P_pred / (P_pred + R)
        float kalmanGain = errorPred / (errorPred + KALMAN_R);
        
        // 状态更新: x_est = x_pred + K * (measurement - x_pred)
        kalmanEstimate = kalmanEstimate + kalmanGain * (rawReading - kalmanEstimate);
        
        // 误差协方差更新: P_est = (1 - K) * P_pred
        kalmanErrorEst = (1.0 - kalmanGain) * errorPred;
        
        // 应用零点偏移并转换为牛顿 (N)
        float filteredGrams = kalmanEstimate - forceTare;
        forceReading = filteredGrams * G_TO_N;
    }
}

void tareForce() {
    if (hx711Ready) {
        // 读取当前原始值作为零点偏移
        long rawValue = scale.read_average(10);
        scale.set_offset(rawValue);
        forceTare = 0;
        
        // 重置卡尔曼滤波器
        kalmanEstimate = 0;
        kalmanErrorEst = 1.0;
        kalmanInitialized = false;
        
        Serial.println("Force tared!");
        Serial.print("New offset: "); Serial.println(rawValue);
    }
}

// 保存校准数据到NVS
void saveCalibration() {
    preferences.begin("forcecal", false);  // 读写模式
    preferences.putFloat("calFactor", forceCalibration);
    preferences.putLong("offset", scale.get_offset());
    preferences.end();
    Serial.println("Calibration saved to NVS!");
    Serial.print("  Factor: "); Serial.println(forceCalibration);
    Serial.print("  Offset: "); Serial.println(scale.get_offset());
}

// 从NVS加载校准数据
bool loadCalibration() {
    preferences.begin("forcecal", true);  // 只读模式
    float savedFactor = preferences.getFloat("calFactor", 0);
    long savedOffset = preferences.getLong("offset", 0);
    preferences.end();
    
    if (savedFactor != 0) {
        forceCalibration = savedFactor;
        scale.set_scale(forceCalibration);
        scale.set_offset(savedOffset);
        Serial.println("Calibration loaded from NVS!");
        Serial.print("  Factor: "); Serial.println(forceCalibration);
        Serial.print("  Offset: "); Serial.println(savedOffset);
        return true;
    }
    return false;
}

// 开始校准流程
void startCalibration() {
    if (!hx711Ready) {
        Serial.println("HX711 not ready!");
        return;
    }
    calibrationMode = true;
    calibrationStep = 0;
    currentMenu = MENU_CALIBRATE;
    Serial.println("Calibration started - remove all weight");
}

// 执行校准步骤
void doCalibrationStep() {
    if (!hx711Ready) return;
    
    if (calibrationStep == 0) {
        // 步骤1：记录空载原始值 (使用 read_average 获取真正的原始ADC值)
        calibrationZeroRaw = scale.read_average(20);  // 多次采样取平均
        calibrationStep = 1;
        Serial.print("Zero raw (ADC): "); Serial.println(calibrationZeroRaw);
        Serial.println("Now place 100g weight...");
    } 
    else if (calibrationStep == 1) {
        // 步骤2：记录放砝码后的原始值
        calibrationLoadRaw = scale.read_average(20);
        Serial.print("Load raw (ADC): "); Serial.println(calibrationLoadRaw);
        
        // 计算校准系数
        float rawDiff = calibrationLoadRaw - calibrationZeroRaw;
        Serial.print("Raw diff: "); Serial.println(rawDiff);
        
        if (abs(rawDiff) > 1000) {  // 确保有有效的差值
            // 校准系数 = ADC差值 / 质量(g)
            forceCalibration = rawDiff / CALIBRATION_MASS;
            
            // 应用新的校准系数和零点
            scale.set_scale(forceCalibration);
            scale.set_offset((long)calibrationZeroRaw);  // 设置空载时的ADC值为零点
            
            // 保存到NVS
            saveCalibration();
            
            calibrationStep = 2;
            Serial.print("New calibration factor: "); Serial.println(forceCalibration);
            Serial.println("Calibration complete and saved!");
        } else {
            Serial.println("Error: weight not detected (diff too small)");
            Serial.println("Make sure 100g weight is properly placed");
            calibrationStep = 0;
        }
    }
    else if (calibrationStep == 2) {
        // 校准完成，退出
        calibrationMode = false;
        currentMenu = MENU_MAIN;
    }
}

// 取消校准
void cancelCalibration() {
    calibrationMode = false;
    calibrationStep = 0;
    // 重新加载之前保存的校准数据
    loadCalibration();
    currentMenu = MENU_MAIN;
    Serial.println("Calibration cancelled");
}

// ==================== BLE Phyphox 初始化 ====================

void initBLE() {
    Serial.println("Initializing BLE for Phyphox...");
    
    BLEDevice::init("ESP32-Stepper");
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());
    
    BLEService *pService = pServer->createService(SERVICE_UUID);
    
    // 创建特征值
    pSpeedChar = pService->createCharacteristic(
        CHAR_SPEED_UUID,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
    );
    pSpeedChar->addDescriptor(new BLE2902());
    
    pForceChar = pService->createCharacteristic(
        CHAR_FORCE_UUID,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
    );
    pForceChar->addDescriptor(new BLE2902());
    
    pDistanceChar = pService->createCharacteristic(
        CHAR_DISTANCE_UUID,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
    );
    pDistanceChar->addDescriptor(new BLE2902());
    
    pTimeChar = pService->createCharacteristic(
        CHAR_TIME_UUID,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
    );
    pTimeChar->addDescriptor(new BLE2902());
    
    pService->start();
    
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->start();
    
    Serial.println("BLE ready - device name: ESP32-Stepper");
}

void sendBLEData() {
    if (!bleConnected) return;
    
    float elapsedTime = (millis() - bleStartTime) / 1000.0f;
    float distance = stepCounter * MM_PER_STEP;
    
    // 发送数据 (little-endian float32)
    pSpeedChar->setValue((uint8_t*)&currentSpeed, sizeof(float));
    pSpeedChar->notify();
    
    pForceChar->setValue((uint8_t*)&forceReading, sizeof(float));
    pForceChar->notify();
    
    pDistanceChar->setValue((uint8_t*)&distance, sizeof(float));
    pDistanceChar->notify();
    
    pTimeChar->setValue((uint8_t*)&elapsedTime, sizeof(float));
    pTimeChar->notify();
}

// ==================== Phyphox 实验模式 ====================

void startPhyphoxMode() {
    Serial.println("\n>>> PHYPHOX MODE START <<<");
    Serial.println("Connect with Phyphox app!");
    
    phyphoxMode = true;
    bleStartTime = millis();
    stepCounter = 0;
    
    // 启动电机 (可选)
    setDirection(direction);
    enableMotor(true);
    isRunning = true;
    runStartTime = millis();
    
    currentMenu = MENU_RUNNING;
}

void stopPhyphoxMode() {
    Serial.println(">>> PHYPHOX MODE STOP <<<");
    phyphoxMode = false;
    isRunning = false;
    currentSpeed = 0;
    stepInterval = 100000;
    
    // 停止后保持解锁状态（用户可手动锁定）
    enableMotor(false);
    motorLocked = false;
    
    currentMenu = MENU_COMPLETED;
}

void updatePhyphox() {
    // 更新运动参数
    if (isRunning && !isPaused) {
        updateMotionParams();
    }
    
    // 发送 BLE 数据
    if (millis() - lastBLETime >= BLE_INTERVAL) {
        lastBLETime = millis();
        sendBLEData();
    }
    
    // 检查是否完成
    uint32_t elapsedMs = millis() - runStartTime;
    uint32_t totalMs = targetTime * 1000;
    if (motionMode == MODE_CONTINUOUS && elapsedMs >= totalMs) {
        stopPhyphoxMode();
    }
}

// ==================== 硬件定时器 ====================

// 快速伪随机数生成 (在中断中使用)
static inline uint32_t IRAM_ATTR fastRandom() {
    ditherSeed = ditherSeed * 1103515245 + 12345;
    return (ditherSeed >> 16) & 0x7FFF;
}

void IRAM_ATTR onStepTimer() {
    // 在中断中产生步进脉冲 - 极其稳定
    portENTER_CRITICAL_ISR(&timerMux);

    // 扫描模式、Phyphox模式或正常运行模式都需要产生脉冲
    if ((isRunning || resonanceScanMode || phyphoxMode) && !isPaused && stepInterval < 100000) {
        GPIO.out_w1ts = (1 << PIN_STEP);  // STEP HIGH (直接寄存器操作更快)
        for (volatile int i = 0; i < 10; i++);  // 短延时约200ns
        GPIO.out_w1tc = (1 << PIN_STEP);  // STEP LOW
        stepCounter++;

        // 扫描模式：不加抖动，让用户感受原始共振
        // Phyphox模式：不加抖动，保证力传感器读数精确
        // 正常运行：
        //   - 加速/减速阶段：不加抖动（最平滑）
        //   - 匀速阶段：加微量抖动打破共振
        if (resonanceScanMode || phyphoxMode || isInAcceleration) {
            // 不加抖动，保持固定间隔 - 最平滑
            timerAlarmWrite(stepTimer, stepInterval, true);
        } else {
            // 匀速阶段：脉冲抖动打破共振（减至±8μs）
            uint32_t dither = (fastRandom() % (DITHER_AMOUNT * 2)) - DITHER_AMOUNT;
            uint32_t nextInterval = stepInterval + dither;
            if (nextInterval < 50) nextInterval = 50;  // 最小50微秒
            timerAlarmWrite(stepTimer, nextInterval, true);
        }
    }
    portEXIT_CRITICAL_ISR(&timerMux);
}

void initTimer() {
    // 使用定时器0，80分频 = 1MHz (1微秒精度)
    stepTimer = timerBegin(0, 80, true);
    timerAttachInterrupt(stepTimer, &onStepTimer, true);
    timerAlarmWrite(stepTimer, 1000, true);  // 初始1000微秒
    timerAlarmEnable(stepTimer);
    Serial.println("Hardware timer initialized");
}

void initOLED() {
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
    
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
        Serial.println("OLED failed!");
        return;
    }
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println(F("Stepper Controller"));
    display.println(F("Ready!"));
    display.display();
    delay(500);
}

void enableMotor(bool en) {
    digitalWrite(PIN_ENABLE, en ? LOW : HIGH);
    Serial.print("Motor: "); Serial.println(en ? "ENABLED" : "DISABLED");
}

void setDirection(bool dir) {
    digitalWrite(PIN_DIR, dir ? HIGH : LOW);
    delay(1);  // 等待方向稳定
}

// ==================== S曲线速度计算 ====================

// 检查是否在共振区
bool isInResonanceZone(float speed) {
    return (speed >= RESONANCE_ZONE1_LOW && speed <= RESONANCE_ZONE1_HIGH) ||
           (speed >= RESONANCE_ZONE2_LOW && speed <= RESONANCE_ZONE2_HIGH);
}

// Sigmoid平滑函数：用于共振区平滑过渡
// 返回 0-1 之间的值，在边界处平滑过渡
float sigmoidTransition(float x, float center, float width) {
    // 使用双曲正切函数实现平滑S型过渡
    // x: 当前速度
    // center: 过渡中心点
    // width: 过渡宽度
    float t = (x - center) / (width * 0.5f);
    float sig = tanh(t);  // tanh返回 -1 到 1
    return (sig + 1.0f) * 0.5f;  // 归一化到 0 到 1
}

// 9次多项式平滑曲线（比7次多项式更平滑，jerk和snap变化更小）
// 满足边界条件：f(0)=0, f(1)=1, 且一阶、二阶、三阶导数在边界均为0
float smoothStep7thOrder(float t) {
    // 使用9次多项式实现最小jerk轨迹
    // 70t^9 - 315t^8 + 540t^7 - 420t^6 + 126t^5
    float t2 = t * t;
    float t4 = t2 * t2;
    float t5 = t4 * t;
    return t5 * (126.0f + t * (-420.0f + t * (540.0f + t * (-315.0f + t * 70.0f))));
}

// 计算共振区平滑补偿系数（返回1.0表示无补偿，>1.0表示加速通过）
float calculateResonanceCompensation(float speed, float targetSpeed) {
    // 低于起步速度时不补偿
    if (speed < MIN_START_SPEED) return 1.0f;
    
    // 如果不在共振区附近，返回1.0（无补偿）
    if (speed < RESONANCE_ZONE1_LOW - RESONANCE_TRANSITION_WIDTH ||
        (speed > RESONANCE_ZONE1_HIGH + RESONANCE_TRANSITION_WIDTH &&
         speed < RESONANCE_ZONE2_LOW - RESONANCE_TRANSITION_WIDTH) ||
        speed > RESONANCE_ZONE2_HIGH + RESONANCE_TRANSITION_WIDTH) {
        return 1.0f;
    }

    float compensation = 1.0f;

    // 第一共振区平滑过渡
    if (speed >= RESONANCE_ZONE1_LOW - RESONANCE_TRANSITION_WIDTH &&
        speed <= RESONANCE_ZONE1_HIGH + RESONANCE_TRANSITION_WIDTH) {

        float zoneCenter = (RESONANCE_ZONE1_LOW + RESONANCE_ZONE1_HIGH) * 0.5f;
        float zoneWidth = RESONANCE_ZONE1_HIGH - RESONANCE_ZONE1_LOW + RESONANCE_TRANSITION_WIDTH * 2.0f;

        // 计算在共振区中的位置（0到1）
        float position = (speed - (RESONANCE_ZONE1_LOW - RESONANCE_TRANSITION_WIDTH)) / zoneWidth;

        // 使用高斯形状的补偿曲线，中心补偿最大
        float gaussian = exp(-pow(position - 0.5f, 2) * 8.0f);  // 高斯曲线

        // 补偿系数：中心最大1.3倍，边缘1.0倍
        compensation = 1.0f + (RESONANCE_ACCEL_BOOST - 1.0f) * gaussian;
    }
    // 第二共振区平滑过渡
    else if (speed >= RESONANCE_ZONE2_LOW - RESONANCE_TRANSITION_WIDTH &&
             speed <= RESONANCE_ZONE2_HIGH + RESONANCE_TRANSITION_WIDTH) {

        float zoneCenter = (RESONANCE_ZONE2_LOW + RESONANCE_ZONE2_HIGH) * 0.5f;
        float zoneWidth = RESONANCE_ZONE2_HIGH - RESONANCE_ZONE2_LOW + RESONANCE_TRANSITION_WIDTH * 2.0f;

        float position = (speed - (RESONANCE_ZONE2_LOW - RESONANCE_TRANSITION_WIDTH)) / zoneWidth;
        float gaussian = exp(-pow(position - 0.5f, 2) * 8.0f);

        compensation = 1.0f + (RESONANCE_ACCEL_BOOST - 1.0f) * gaussian;
    }

    return compensation;
}

float sCurveSpeed(uint32_t elapsedMs, uint32_t accelMs, uint32_t totalMs, float maxSpeed) {
    // 运行时间已超过总时间，停止
    if (elapsedMs >= totalMs) {
        return 0;
    }
    
    // 计算速度范围 (从最小起步速度到最大速度)
    float speedRange = maxSpeed - MIN_START_SPEED;
    float baseSpeed;

    // 判断是否在加速/减速阶段
    bool accelerating = (elapsedMs < accelMs) || (elapsedMs > totalMs - accelMs);

    if (elapsedMs < accelMs) {
        // ========== 加速阶段 ==========
        float t = (float)elapsedMs / accelMs;
        // 使用7次多项式实现更平滑的加速（jerk-limited）
        float smooth = smoothStep7thOrder(t);
        baseSpeed = MIN_START_SPEED + speedRange * smooth;

        // 平滑的共振区补偿（而不是突跳）
        float compensation = calculateResonanceCompensation(baseSpeed, maxSpeed);

        // 应用补偿：通过调整"虚拟时间"来加速通过共振区
        if (compensation > 1.01f) {  // 只有补偿明显时才应用
            // 在S曲线基础上应用微小的速度提升
            float speedBoost = (baseSpeed - MIN_START_SPEED) * (compensation - 1.0f) * 0.3f;
            baseSpeed += speedBoost;
        }

        isInAcceleration = true;
    } else if (elapsedMs > totalMs - accelMs) {
        // ========== 减速阶段 ==========
        // t 从 1 减到 0，当 elapsedMs = totalMs 时 t = 0
        float t = (float)(totalMs - elapsedMs) / accelMs;
        if (t < 0) t = 0;  // 确保不为负数
        float smooth = smoothStep7thOrder(t);
        // 减速时：速度从 maxSpeed 平滑减到 0 (不是 MIN_START_SPEED)
        baseSpeed = maxSpeed * smooth;

        // 减速阶段同样应用共振区补偿，确保平滑通过
        float compensation = calculateResonanceCompensation(baseSpeed, maxSpeed);
        if (compensation > 1.01f && baseSpeed > MIN_START_SPEED) {
            float speedBoost = baseSpeed * (compensation - 1.0f) * 0.3f;
            baseSpeed += speedBoost;
        }

        isInAcceleration = true;
    } else {
        // ========== 匀速阶段 ==========
        baseSpeed = maxSpeed;
        isInAcceleration = false;
    }

    // 限制在合理范围内 (减速时允许减到0)
    if (elapsedMs > totalMs - accelMs) {
        baseSpeed = constrain(baseSpeed, 0, maxSpeed);
    } else {
        baseSpeed = constrain(baseSpeed, MIN_START_SPEED, maxSpeed);
    }

    return baseSpeed;
}

uint32_t speedToInterval(float speed) {
    if (speed < 0.1) return 100000;
    float stepsPerSec = speed * STEPS_PER_MM;
    return (uint32_t)(1000000.0 / stepsPerSec);
}

// ==================== 运动控制 ====================

void startMotion() {
    Serial.println("\n>>> START MOTION <<<");
    
    isRunning = true;
    isPaused = false;
    stepCounter = 0;
    reciprocateCount = 0;
    runStartTime = millis();
    stepInterval = 100000;  // 初始慢速
    currentSpeed = 0;
    
    setDirection(direction);
    enableMotor(true);
    
    currentMenu = MENU_RUNNING;
    
    Serial.print("Target speed: "); Serial.print(targetSpeed); Serial.println(" mm/s");
    Serial.print("Target time: "); Serial.print(targetTime); Serial.println(" s");
    Serial.print("Accel time: "); Serial.print(accelTime); Serial.println(" ms");
}

void stopMotion() {
    Serial.println(">>> STOP MOTION <<<");
    isRunning = false;
    isPaused = false;
    currentSpeed = 0;
    stepInterval = 100000;  // 停止脉冲输出
    
    // 运行结束后保持解锁状态（用户可手动锁定）
    enableMotor(false);
    motorLocked = false;
    Serial.println("Motion stopped (motor unlocked)");
    
    currentMenu = MENU_COMPLETED;
    
    float dist = stepCounter * MM_PER_STEP;
    uint32_t elapsed = millis() - runStartTime;
    Serial.print("Steps: "); Serial.println(stepCounter);
    Serial.print("Distance: "); Serial.print(dist); Serial.println(" mm");
    Serial.print("Time: "); Serial.print(elapsed / 1000.0); Serial.println(" s");
}

// ==================== 共振扫描 ====================

void startResonanceScan() {
    Serial.println("\n>>> RESONANCE SCAN START <<<");
    Serial.println("Scanning from 5 to 150 mm/s");
    Serial.println("Watch/listen for vibration peaks!");
    
    resonanceScanMode = true;
    scanSpeed = SCAN_MIN_SPEED;
    lastScanStepTime = millis();
    stepCounter = 0;
    
    setDirection(true);
    enableMotor(true);
    
    // 设置初始速度
    stepInterval = speedToInterval(scanSpeed);
    timerAlarmWrite(stepTimer, stepInterval, true);
    
    currentMenu = MENU_RUNNING;
}

void updateResonanceScan() {
    // 每隔一段时间增加速度
    if (millis() - lastScanStepTime >= SCAN_HOLD_MS) {
        lastScanStepTime = millis();
        scanSpeed += SCAN_STEP;
        
        // 更新定时器间隔 (不使用共振补偿，这样能感受到原始共振)
        stepInterval = speedToInterval(scanSpeed);
        timerAlarmWrite(stepTimer, stepInterval, true);
        currentSpeed = scanSpeed;
        
        // 串口输出当前速度和频率，方便记录
        float freq = scanSpeed * STEPS_PER_MM;
        Serial.print("Speed: ");
        Serial.print(scanSpeed, 1);
        Serial.print(" mm/s  Freq: ");
        Serial.print(freq, 0);
        Serial.println(" Hz");
        
        // 扫描完成
        if (scanSpeed >= SCAN_MAX_SPEED) {
            Serial.println(">>> RESONANCE SCAN COMPLETE <<<");
            resonanceScanMode = false;
            currentSpeed = 0;
            stepInterval = 100000;
            enableMotor(false);
            motorLocked = false;
            currentMenu = MENU_COMPLETED;
        }
    }
}

void runMotorStep() {
    updateMotionParams();
}

// 更新运动参数（定时器负责产生脉冲）
void updateMotionParams() {
    uint32_t elapsedMs = (millis() - runStartTime);
    uint32_t totalMs = targetTime * 1000;
    
    // 检查是否完成
    if (motionMode == MODE_CONTINUOUS && elapsedMs >= totalMs) {
        stopMotion();
        return;
    }
    
    if (motionMode == MODE_DISTANCE) {
        float dist = stepCounter * MM_PER_STEP;
        if (dist >= targetDistance) {
            stopMotion();
            return;
        }
    }
    
    if (motionMode == MODE_RECIPROCATE) {
        float dist = stepCounter * MM_PER_STEP;
        if (dist >= targetDistance) {
            // 换向
            direction = !direction;
            setDirection(direction);
            stepCounter = 0;
            reciprocateCount++;
            
            // 检查时间是否到
            if (elapsedMs >= totalMs) {
                stopMotion();
                return;
            }
        }
    }
    
    // 计算当前速度
    currentSpeed = sCurveSpeed(elapsedMs, accelTime, totalMs, targetSpeed);
    
    // 计算步进间隔并更新定时器
    stepInterval = speedToInterval(currentSpeed);
    timerAlarmWrite(stepTimer, stepInterval, true);
}

// ==================== 按键处理 ====================

void processButtons() {
    if (millis() - lastButtonTime < 150) return;
    
    bool up = !digitalRead(PIN_BTN_UP);
    bool down = !digitalRead(PIN_BTN_DOWN);
    bool enter = !digitalRead(PIN_BTN_ENTER);
    bool back = !digitalRead(PIN_BTN_BACK);
    
    if (!up && !down && !enter && !back) return;
    
    lastButtonTime = millis();
    
    // 运行中、扫描中或Phyphox模式只响应暂停/停止
    if (isRunning || resonanceScanMode || phyphoxMode) {
        if (enter && (isRunning || phyphoxMode)) {
            isPaused = !isPaused;
            if (isPaused) {
                enableMotor(false);
                Serial.println("PAUSED");
            } else {
                enableMotor(true);
                Serial.println("RESUMED");
            }
        }
        if (back) {
            if (resonanceScanMode) {
                resonanceScanMode = false;
                enableMotor(false);
                Serial.println("Scan stopped");
            } else if (phyphoxMode) {
                stopPhyphoxMode();
            } else {
                stopMotion();
            }
            currentMenu = MENU_MAIN;
        }
        return;
    }
    
    // 完成界面
    // 校准界面
    if (currentMenu == MENU_CALIBRATE) {
        if (enter) {
            doCalibrationStep();
        }
        if (back) {
            cancelCalibration();
        }
        return;
    }
    
    if (currentMenu == MENU_COMPLETED) {
        if (enter || back) {
            currentMenu = MENU_MAIN;
        }
        return;
    }
    
    // 主菜单 (WouoUI 风格循环滚动)
    if (up) {
        menuIndex = (menuIndex - 1 + MENU_ITEMS) % MENU_ITEMS;
        // 动画系统会自动处理滚动
    }
    if (down) {
        menuIndex = (menuIndex + 1) % MENU_ITEMS;
        // 动画系统会自动处理滚动
    }
    
    if (enter) {
        switch (menuIndex) {
            case 0: targetSpeed = constrain(targetSpeed + 1, 1, 200); break;
            case 1: targetDistance = constrain(targetDistance + 10, 1, 400); break;
            case 2: targetTime = constrain(targetTime + 1, 1, 3600); break;
            case 3: accelTime = constrain(accelTime + 50, 100, 2000); break;
            case 4: direction = !direction; break;
            case 5: motionMode = (MotionMode)((motionMode + 1) % 3); break;
            case 6: startResonanceScan(); break;  // 共振扫描
            case 7: startPhyphoxMode(); break;    // Phyphox 实验模式
            case 8: tareForce(); break;           // 力传感器归零
            case 9: startCalibration(); break;    // 力传感器校准
            case 10:  // 锁定/解锁电机 (手动控制)
                if (motorLocked) {
                    enableMotor(false);
                    motorLocked = false;
                    Serial.println("Motor UNLOCKED");
                } else {
                    enableMotor(true);
                    motorLocked = true;
                    Serial.println("Motor LOCKED");
                }
                break;
            case 11: startMotion(); break;        // START
        }
    }
    
    if (back) {
        switch (menuIndex) {
            case 0: targetSpeed = constrain(targetSpeed - 1, 1, 200); break;
            case 1: targetDistance = constrain(targetDistance - 10, 1, 400); break;
            case 2: targetTime = constrain(targetTime - 1, 1, 3600); break;
            case 3: accelTime = constrain(accelTime - 50, 100, 2000); break;
            case 4: direction = !direction; break;
            case 5: motionMode = (MotionMode)((motionMode + 2) % 3); break;
        }
    }
}

// ==================== WouoUI 丝滑动画系统 ====================

// 核心动画函数 (WouoUI 风格非线性缓动)
// 只需两行实现平滑动画，可被打断并自然过渡
void uiAnimation(float *val, float *target, float speed) {
    if (*val != *target) {
        if (fabs(*val - *target) < 0.5f) *val = *target;
        else *val += (*target - *val) / (speed / 10.0f);
    }
}

// 菜单初始化动画
void uiMenuInit() {
    uiList.y = 0;
    uiList.y_trg = LIST_LINE_H;
    uiList.box_y = 0;
    uiList.box_y_trg = 0;
    uiList.box_w = 0;
    uiList.box_w_trg = 60;
    uiList.bar_y = 0;
    uiList.bar_y_trg = 0;
    uiList.init = false;
}

// 更新菜单动画目标值
void uiMenuAnimUpdate() {
    // 计算选择框目标位置 (相对于显示区域)
    int visibleLines = (SCREEN_HEIGHT - 10) / LIST_LINE_H;  // 可见行数 (减去标题栏)
    int halfVisible = visibleLines / 2;
    
    // 计算列表偏移目标
    if (menuIndex < halfVisible) {
        uiList.y_trg = 0;
    } else if (menuIndex > MENU_ITEMS - 1 - halfVisible) {
        uiList.y_trg = -((MENU_ITEMS - visibleLines) * LIST_LINE_H);
    } else {
        uiList.y_trg = -((menuIndex - halfVisible) * LIST_LINE_H);
    }
    
    // 选择框Y位置目标 (在屏幕上的绝对位置)
    uiList.box_y_trg = 10 + (menuIndex * LIST_LINE_H) + uiList.y_trg;
    
    // 滚动条位置目标
    if (MENU_ITEMS > 1) {
        uiList.bar_y_trg = (float)menuIndex / (MENU_ITEMS - 1) * (SCREEN_HEIGHT - 20);
    }
    
    // 选择框宽度目标 (根据当前菜单项文字长度)
    // 简化: 使用固定宽度或根据菜单项动态调整
    uiList.box_w_trg = 120;  // 几乎全宽
}

// ==================== 显示更新 ====================

void updateDisplay() {
    // 注意：时间限制已在 loop() 中通过 lastDisplayTime 处理
    // 这里不再重复检查
    
    display.clearDisplay();
    
    if (calibrationMode) {
        drawCalibrationScreen();
    } else if (phyphoxMode) {
        drawPhyphoxScreen();
    } else if (resonanceScanMode) {
        drawScanScreen();
    } else {
        switch (currentMenu) {
            case MENU_MAIN:
                drawMainMenu();
                break;
            case MENU_RUNNING:
                drawRunningScreen();
                break;
            case MENU_COMPLETED:
                drawCompletedScreen();
                break;
            case MENU_CALIBRATE:
                drawCalibrationScreen();
                break;
        }
    }
    
    display.display();
}

void drawMainMenu() {
    // ===== WouoUI 风格丝滑动画菜单 =====
    
    // 1. 更新动画目标值
    uiMenuAnimUpdate();
    
    // 2. 计算动画过渡值 (非线性缓动)
    uiAnimation(&uiList.y, &uiList.y_trg, UI_ANI_SPEED);
    uiAnimation(&uiList.box_y, &uiList.box_y_trg, UI_ANI_SPEED);
    uiAnimation(&uiList.box_w, &uiList.box_w_trg, UI_ANI_SPEED);
    uiAnimation(&uiList.bar_y, &uiList.bar_y_trg, UI_ANI_SPEED);
    
    // 3. 绘制标题栏
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.fillRect(0, 0, SCREEN_WIDTH, 9, SSD1306_WHITE);
    display.setTextColor(SSD1306_BLACK);
    display.setCursor(2, 1);
    if (motorLocked) {
        display.print(F("STEPPER [LOCKED]"));
    } else {
        display.print(F("STEPPER CONTROL"));
    }
    
    // 4. 绘制列表内容 (带平滑滚动)
    display.setTextColor(SSD1306_WHITE);
    for (int i = 0; i < MENU_ITEMS; i++) {
        // 计算每行在屏幕上的Y位置 (包含滚动偏移)
        int lineY = 10 + i * LIST_LINE_H + (int)uiList.y;
        
        // 只绘制可见区域内的项目
        if (lineY >= 0 && lineY < SCREEN_HEIGHT) {
            display.setCursor(LIST_TEXT_S + 2, lineY + 1);
            
            // 构建菜单文本
            char buf[22];
            switch (i) {
                case 0: snprintf(buf, sizeof(buf), "Speed:  %3d mm/s", (int)targetSpeed); break;
                case 1: snprintf(buf, sizeof(buf), "Dist:   %3d mm", (int)targetDistance); break;
                case 2: snprintf(buf, sizeof(buf), "Time:   %3d s", (int)targetTime); break;
                case 3: snprintf(buf, sizeof(buf), "Accel:  %4d ms", (int)accelTime); break;
                case 4: snprintf(buf, sizeof(buf), "Dir:    %s", direction ? "FWD >>" : "<< REV"); break;
                case 5: 
                    snprintf(buf, sizeof(buf), "Mode:   %s", 
                        motionMode == MODE_CONTINUOUS ? "Cont" :
                        motionMode == MODE_DISTANCE ? "Dist" : "Recip");
                    break;
                case 6: snprintf(buf, sizeof(buf), ">> ResoScan"); break;
                case 7: snprintf(buf, sizeof(buf), ">> Phyphox"); break;
                case 8: snprintf(buf, sizeof(buf), "Tare    %.2fN", forceReading); break;
                case 9: snprintf(buf, sizeof(buf), "Calibrate 100g"); break;
                case 10: snprintf(buf, sizeof(buf), "%s Motor", motorLocked ? "Unlock" : "Lock"); break;
                case 11: snprintf(buf, sizeof(buf), ">>> START <<<"); break;
            }
            display.print(buf);
        }
    }
    
    // 5. 绘制选择框 (反色圆角矩形，带平滑宽度和位置动画)
    int boxY = (int)uiList.box_y;
    int boxW = (int)uiList.box_w;
    if (boxY >= 9 && boxY < SCREEN_HEIGHT - 2) {
        // 使用 XOR 模式绘制选择框 (反色效果)
        for (int y = boxY; y < boxY + LIST_LINE_H && y < SCREEN_HEIGHT; y++) {
            for (int x = 0; x < boxW && x < SCREEN_WIDTH - LIST_BAR_W - 1; x++) {
                // 反转像素
                if (display.getPixel(x, y)) {
                    display.drawPixel(x, y, SSD1306_BLACK);
                } else {
                    display.drawPixel(x, y, SSD1306_WHITE);
                }
            }
        }
    }
    
    // 6. 绘制右侧滚动条 (带平滑位置动画)
    int barH = max(4, (int)(SCREEN_HEIGHT - 12) / MENU_ITEMS);  // 滚动条高度
    int barY = 10 + (int)uiList.bar_y;
    display.fillRect(SCREEN_WIDTH - LIST_BAR_W, 10, LIST_BAR_W, SCREEN_HEIGHT - 10, SSD1306_BLACK);
    display.drawRect(SCREEN_WIDTH - LIST_BAR_W, 10, LIST_BAR_W, SCREEN_HEIGHT - 10, SSD1306_WHITE);
    display.fillRect(SCREEN_WIDTH - LIST_BAR_W + 1, barY, LIST_BAR_W - 2, barH, SSD1306_WHITE);
}

void drawRunningScreen() {
    uint32_t elapsed = millis() - runStartTime;
    float dist = stepCounter * MM_PER_STEP;
    
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE, SSD1306_BLACK);  // 设置颜色
    display.setCursor(0, 0);
    
    if (isPaused) {
        display.println(F("==== PAUSED ===="));
    } else {
        display.println(F("=== RUNNING ==="));
    }
    
    display.setCursor(0, 12);
    display.print(F("Speed: "));
    display.print(currentSpeed, 1);
    display.println(F(" mm/s"));
    
    display.print(F("Dist:  "));
    display.print(dist, 1);
    display.println(F(" mm"));
    
    display.print(F("Time:  "));
    display.print(elapsed / 1000.0, 1);
    display.print(F("/"));
    display.print(targetTime);
    display.println(F("s"));
    
    display.print(F("Steps: "));
    display.println(stepCounter);
    
    if (motionMode == MODE_RECIPROCATE) {
        display.print(F("Cycles: "));
        display.println(reciprocateCount);
    }
    
    // 进度条
    display.drawRect(0, 54, 128, 10, SSD1306_WHITE);
    float progress = (float)elapsed / (targetTime * 1000);
    if (progress > 1.0) progress = 1.0;
    display.fillRect(2, 56, (int)(124 * progress), 6, SSD1306_WHITE);
}

void drawPhyphoxScreen() {
    float elapsed = (millis() - bleStartTime) / 1000.0f;
    float dist = stepCounter * MM_PER_STEP;
    
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE, SSD1306_BLACK);  // 设置颜色
    display.setCursor(0, 0);
    
    if (bleConnected) {
        display.println(F("== PHYPHOX [OK] =="));
    } else {
        display.println(F("== PHYPHOX [...]  =="));
    }
    
    display.setCursor(0, 10);
    display.print(F("Speed: "));
    display.print(currentSpeed, 1);
    display.println(F(" mm/s"));
    
    display.print(F("Force: "));
    display.print(forceReading, 3);
    display.println(F(" N"));
    
    display.print(F("Dist:  "));
    display.print(dist, 1);
    display.println(F(" mm"));
    
    display.print(F("Time:  "));
    display.print(elapsed, 1);
    display.println(F(" s"));
    
    display.setCursor(0, 50);
    if (!bleConnected) {
        display.println(F("Open Phyphox app..."));
    } else {
        display.println(F("[BACK]=Stop"));
    }
    
    // 进度条
    display.drawRect(0, 58, 128, 6, SSD1306_WHITE);
    float progress = elapsed / targetTime;
    if (progress > 1.0) progress = 1.0;
    display.fillRect(2, 60, (int)(124 * progress), 2, SSD1306_WHITE);
}

void drawScanScreen() {
    float freq = scanSpeed * STEPS_PER_MM;
    
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE, SSD1306_BLACK);  // 设置颜色
    display.setCursor(0, 0);
    display.println(F("== RESONANCE SCAN =="));
    
    display.setCursor(0, 12);
    display.print(F("Speed: "));
    display.setTextSize(2);
    display.print(scanSpeed, 1);
    display.setTextSize(1);
    display.println(F(" mm/s"));
    
    display.setCursor(0, 32);
    display.print(F("Freq:  "));
    display.print(freq, 0);
    display.println(F(" Hz"));
    
    display.setCursor(0, 44);
    display.println(F("Feel vibration? Note"));
    display.println(F("the speed! [BACK]=Stop"));
    
    // 进度条
    display.drawRect(0, 54, 128, 10, SSD1306_WHITE);
    float progress = (scanSpeed - SCAN_MIN_SPEED) / (SCAN_MAX_SPEED - SCAN_MIN_SPEED);
    display.fillRect(2, 56, (int)(124 * progress), 6, SSD1306_WHITE);
}

void drawCompletedScreen() {
    float dist = stepCounter * MM_PER_STEP;
    uint32_t elapsed = millis() - runStartTime;
    
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE, SSD1306_BLACK);  // 设置颜色
    display.setCursor(0, 0);
    display.println(F("=== COMPLETED ==="));
    
    display.setCursor(0, 16);
    display.print(F("Distance: "));
    display.print(dist, 1);
    display.println(F(" mm"));
    
    display.print(F("Time: "));
    display.print(elapsed / 1000.0, 1);
    display.println(F(" s"));
    
    display.print(F("Avg Speed: "));
    if (elapsed > 0) {
        display.print(dist / (elapsed / 1000.0), 1);
    } else {
        display.print(F("0"));
    }
    display.println(F(" mm/s"));
    
    display.print(F("Steps: "));
    display.println(stepCounter);
    
    display.setCursor(0, 54);
    display.println(F("Press any key..."));
}

void drawCalibrationScreen() {
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE, SSD1306_BLACK);
    display.setCursor(0, 0);
    display.println(F("== CALIBRATION =="));
    
    display.setCursor(0, 12);
    
    if (calibrationStep == 0) {
        display.println(F("Step 1/2:"));
        display.println(F(""));
        display.println(F("Remove all weight"));
        display.println(F("from sensor"));
        display.println(F(""));
        display.println(F("[ENTER] to confirm"));
        display.println(F("[BACK] to cancel"));
    } 
    else if (calibrationStep == 1) {
        display.println(F("Step 2/2:"));
        display.println(F(""));
        display.println(F("Place 100g weight"));
        display.println(F("on sensor"));
        display.println(F(""));
        display.println(F("[ENTER] to confirm"));
        display.println(F("[BACK] to cancel"));
    }
    else if (calibrationStep == 2) {
        display.println(F("Calibration Done!"));
        display.println(F(""));
        display.print(F("Cal factor: "));
        display.println(forceCalibration, 1);
        display.println(F(""));
        display.print(F("Force: "));
        display.print(forceReading, 3);
        display.println(F(" N"));
        display.println(F(""));
        display.println(F("[ENTER] to exit"));
    }
}
