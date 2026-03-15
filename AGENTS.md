# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

ESP32-WROOM-32E stepper motor controller with S-curve acceleration, designed for physics experiments with Phyphox BLE integration. Controls a stepper motor via DRV8825 driver with HX711 force sensor for force measurement.

## Build Commands

```bash
# Compile
pio run

# Upload to ESP32
pio run -t upload

# Serial monitor (115200 baud)
pio device monitor
```

## Hardware Configuration

- **MCU**: ESP32-WROOM-32E (dual-core 240MHz)
- **Motor Driver**: DRV8825 (microstepping set via jumpers, not MCU)
- **Motor**: 17HS3401S (1.8° step angle, 200 steps/rev)
- **Transmission**: Spool winding (7mm diameter), not belt drive
- **Force Sensor**: HX711 + load cell
- **Display**: SSD1306 OLED (I2C, 0x3C)

### Pin Mapping

| Function | GPIO |
|----------|------|
| STEP | 25 |
| DIR | 26 |
| ENABLE | 27 |
| BTN_UP | 32 |
| BTN_DOWN | 33 |
| BTN_ENTER | 18 |
| BTN_BACK | 19 |
| I2C_SDA | 21 |
| I2C_SCL | 22 |
| HX711_DOUT | 16 |
| HX711_SCK | 17 |

## Architecture

### Motion Control System
- Hardware timer interrupt (Timer 0, 1MHz) generates step pulses in `onStepTimer()`
- S-curve acceleration uses 9th-order polynomial (`smoothStep7thOrder()`) for jerk-limited motion
- Resonance compensation with Gaussian-shaped boost to pass through vibration zones smoothly
- Minimum start speed of 5 mm/s to avoid low-frequency resonance

### Key Constants to Modify
- `MICROSTEP_DIV` (line 125): Match to DRV8825 jumper settings (current: 1/32)
- `SPOOL_DIAMETER` (line 132): Winding spool diameter in mm
- `RESONANCE_ZONE*` (lines 166-169): Tune based on observed motor vibration

### Operating Modes
- **Continuous**: Run for specified time with full S-curve profile
- **Distance**: Move to target distance then stop
- **Reciprocate**: Oscillate within distance until time expires
- **Phyphox**: BLE streaming mode for physics experiments (speed, force, distance, time)
- **Resonance Scan**: Sweep 5-150 mm/s to identify vibration frequencies

### BLE Phyphox Integration
Service UUID: `cddf1001-30f7-4671-8b43-5e40ba53514a`
- Characteristics for speed, force, distance, time (float32, little-endian)
- Device name: "ESP32-Stepper"

### Force Sensor
- Kalman filter for noise reduction (`KALMAN_Q`, `KALMAN_R`)
- Calibration data persisted to NVS (namespace: "forcecal")
- Two-point calibration: zero + 100g reference weight

### UI System
WouoUI-style smooth animation menu with:
- Non-linear easing (`uiAnimation()`)
- Inverted selection box with XOR rendering
- Animated scrollbar
