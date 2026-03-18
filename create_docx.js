const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign, LevelFormat, HeadingLevel } = require('docx');

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 52, bold: true, color: "1A73E8", font: "Arial" },
        paragraph: { spacing: { before: 0, after: 240 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: "1A73E8", font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: "3D66CC", font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: "4D5B9E", font: "Arial" },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "checklist",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "☐", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    children: [
      // 标题
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun("ESP32-HX711 步进电机控制系统")]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: "专业物理实验控制器使用手册", italics: true, size: 24 })]
      }),

      // 功能特性
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("功能特性")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "S 曲线加速", bold: true }), new TextRun("使用 9 阶多项式实现无冲击启动")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "力传感反馈", bold: true }), new TextRun("使用 HX711 + 称重传感器进行实时力值监测")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "共振补偿", bold: true }), new TextRun("使用高斯形补偿曲线平滑通过电机振动频率")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "蓝牙集成", bold: true }), new TextRun("支持 Phyphox 物理实验应用实时数据流")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "丰滑的图形界面", bold: true }), new TextRun("WouoUI 风格的非线性动画菜单系统")] }),

      // 硬件配置
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("硬件配置")]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("核心部件")]
      }),
      createTable([
        ["组件", "型号", "说明"],
        ["MCU", "ESP32-WROOM-32E", "双核 Xtensa LX6 @ 240MHz"],
        ["电机驱动", "DRV8825", "步进电机驱动模块"],
        ["步进电机", "17HS3401S", "1.8°步距角，200步/圈"],
        ["力传感器", "HX711 + 称重传感器", "24 位 ADC，精准力值测量"],
        ["显示屏", "SSD1306 OLED", "128x64 像素 I2C 屏幕"],
        ["传动方式", "绕线轴 (∅7mm)", "线直接绕在轴上拉动物体"]
      ]),

      new Paragraph({ spacing: { before: 120, after: 120 } }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("GPIO 引脚映射")]
      }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "步进电机驱动:", bold: true })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("STEP → GPIO25 (步进脉冲)")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("DIR → GPIO26 (方向控制)")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 120 }, children: [new TextRun("EN → GPIO27 (使能信号)")] }),

      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "按键输入 (低电平有效):", bold: true })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("BTN_UP → GPIO32")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("BTN_DOWN → GPIO33")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("BTN_ENTER → GPIO18")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 120 }, children: [new TextRun("BTN_BACK → GPIO19")] }),

      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "I2C 总线:", bold: true })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("SDA → GPIO21")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 120 }, children: [new TextRun("SCL → GPIO22")] }),

      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "力传感器 (HX711):", bold: true })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("DOUT → GPIO16")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("SCK → GPIO17")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("微步配置")]
      }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("DRV8825 的微步设置通过跳线帽配置 (不由 MCU 控制)：")] }),
      createTable([
        ["模式", "M0", "M1", "M2", "说明"],
        ["全步", "L", "L", "L", "最大扭矩，噪声大"],
        ["1/2 步", "H", "L", "L", ""],
        ["1/4 步", "L", "H", "L", ""],
        ["1/8 步", "H", "H", "L", ""],
        ["1/16 步", "L", "L", "H", ""],
        ["1/32 步", "H", "L", "H", "默认配置"]
      ]),
      new Paragraph({ spacing: { before: 120, after: 200 }, children: [new TextRun({ text: "注意: 当前固件设置为 1/32 微步。如果更改硬件跳线设置，需要修改 src/main.cpp 中的 MICROSTEP_DIV 常量。", italics: true })] }),

      // 编译与上传
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("编译与上传")]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("前置要求")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("PlatformIO Core 或 VS Code PlatformIO 扩展")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Python 3.6+ (PlatformIO 依赖)")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("USB 转 UART 驱动程序 (部分系统需要)")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("编译命令")]
      }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "pio run", bold: true })] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("编译固件")] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "pio run -t upload", bold: true })] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("上传到 ESP32")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "pio device monitor", bold: true })] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("打开串口监视器 (115200 波特率)")] }),

      // 操作指南
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("操作指南")]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("运行模式")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("1. 连续模式 (Continuous)")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("按指定速度运行指定时间")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("参数: 速度 (mm/s)、运行时间 (秒)")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 120 }, children: [new TextRun("应用: 匀速运动实验")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("2. 距离模式 (Distance)")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("移动到指定距离后停止")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("参数: 目标距离 (mm)、最大速度 (mm/s)")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 120 }, children: [new TextRun("应用: 位移测量实验")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("3. 往返模式 (Reciprocate)")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("在指定距离范围内往返摆动")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("参数: 往返距离 (mm)、运行时间 (秒)")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 120 }, children: [new TextRun("应用: 简谐运动实验")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("4. Phyphox BLE 模式")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("实时 BLE 数据流推送到手机 Phyphox 应用")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("数据流: 速度、力值、位移、时间戳")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("蓝牙名称: ESP32-Stepper")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 120 }, children: [new TextRun("UUID: cddf1001-30f7-4671-8b43-5e40ba53514a")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("5. 共振扫描模式 (Resonance Scan)")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("以 5-150 mm/s 范围扫描识别电机振动频率")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("用途: 找到最优工作速度，避免共振")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("输出: OLED 显示各速度下的运动平稳度")] }),

      // 力传感器校准
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("力传感器校准")]
      }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "进入校准模式:", bold: true })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("从主菜单选择「设置」")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("选择「力传感器校准」")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 120 }, children: [new TextRun("按照屏幕提示操作")] }),

      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "校准步骤:", bold: true })] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "步骤 1 - 零点校准", bold: true })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("传感器上不放任何物体")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 120 }, children: [new TextRun("按「确定」确认零点")] }),

      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "步骤 2 - 100g 标定", bold: true })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("在传感器上放置 100g 砝码")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("按「确定」完成校准")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("校准数据自动保存到 NVS 闪存")] }),

      // 故障排除
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("故障排除")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("电机不转")]
      }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, children: [new TextRun("检查 GPIO25/26/27 线缆连接")] }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, children: [new TextRun("验证 DRV8825 使能脚 (EN) 是否连接")] }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, children: [new TextRun("检查电源是否连接到 DRV8825")] }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, spacing: { after: 120 }, children: [new TextRun("按「返回」退出当前模式，重启")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("力值显示异常")]
      }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, children: [new TextRun("检查 HX711 传感器 DOUT (GPIO16)、SCK (GPIO17) 连接")] }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, children: [new TextRun("重新校准力传感器")] }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, spacing: { after: 120 }, children: [new TextRun("检查称重传感器是否有漂移或损坏")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("BLE 无法连接")]
      }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, children: [new TextRun("确认手机 Bluetooth 已启用")] }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, children: [new TextRun("检查设备名称 \"ESP32-Stepper\" 是否出现")] }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, children: [new TextRun("重启 ESP32，重新扫描设备")] }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, spacing: { after: 120 }, children: [new TextRun("更新 Phyphox 应用到最新版本")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("OLED 屏幕黑屏")]
      }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, children: [new TextRun("检查 I2C 连接 (GPIO21/22)")] }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, children: [new TextRun("验证设备地址是否为 0x3C")] }),
      new Paragraph({ numbering: { reference: "checklist", level: 0 }, spacing: { after: 200 }, children: [new TextRun("查看串口输出是否有 I2C 错误信息")] }),

      // 性能指标
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("性能指标")]
      }),
      createTable([
        ["指标", "数值"],
        ["最小起步速度", "5 mm/s"],
        ["最大速度", "200+ mm/s (取决于电源和负载)"],
        ["加速度范围", "10-500 mm/s²"],
        ["力传感分辨率", "±0.01 N (取决于传感器)"],
        ["BLE 更新频率", "20 Hz"],
        ["OLED 刷新率", "约 30 FPS"],
        ["定时精度", "±1 µs (硬件定时器)"]
      ]),
      new Paragraph({ spacing: { before: 120, after: 200 } }),

      // 物理实验应用
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("物理实验应用场景")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("1. 万有引力常数测定 (G 值实验)")]
      }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("使用 Phyphox 记录力值和加速度，通过向心力公式计算 G。")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("2. 简谐运动分析")]
      }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("往返模式配合力传感器，观察弹簧系统的周期和能量守恒。")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("3. 摩擦力测量")]
      }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("恒定速度运动时的力值直接反映摩擦力大小。")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("4. 共振频率识别")]
      }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("使用共振扫描模式自动找到系统的共振点。")] }),

      // 页脚
      new Paragraph({ spacing: { before: 240 }, children: [new TextRun("")] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120 },
        border: { top: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 6 } },
        children: [new TextRun({ text: "最后更新: 2025-01-25  |  项目分支: 42Stepping  |  当前状态: 开发中", size: 20, italics: true, color: "666666" })]
      })
    ]
  }]
});

function createTable(data) {
  const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };
  const colCount = data[0].length;
  const colWidth = Math.floor(9360 / colCount);
  const colWidths = Array(colCount).fill(colWidth);

  const rows = data.map((row, idx) => {
    const cells = row.map(cell => new TableCell({
      borders: cellBorders,
      width: { size: colWidth, type: WidthType.DXA },
      shading: idx === 0 ? { fill: "E8F0F8", type: ShadingType.CLEAR } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [new Paragraph({
        alignment: idx === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text: cell, bold: idx === 0, size: 20 })]
      })]
    }));
    return new TableRow({ tableHeader: idx === 0, children: cells });
  });

  return new Table({ columnWidths: colWidths, rows });
}

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("README.docx", buffer);
  console.log("✓ README.docx 创建成功！");
});
