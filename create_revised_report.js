const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign, LevelFormat, HeadingLevel } = require('docx');

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 52, bold: true, color: "1A4D7F", font: "Arial" },
        paragraph: { spacing: { before: 0, after: 120 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: "1A4D7F", font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: "2E5F7F", font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: "4A7FA3", font: "Arial" },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-list",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
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
        children: [new TextRun("基于ESP32的智能恒速力学测量滑台")]
      }),
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun("研究报告（修订版）")]
      }),

      // ========== 摘要 ==========
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("摘要")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("本项目设计并实现了一套基于ESP32-WROOM-32E微控制器的智能恒速力学测量系统，用于辅助初高中物理实验教学。系统集成了高精度力传感器（HX711）、步进电机驱动（DRV8825）和无线通信模块（BLE），通过S曲线加速算法和共振补偿技术实现平滑的匀速运动，通过卡尔曼滤波算法进行力值噪声处理，支持Phyphox应用进行实时数据可视化。项目已完成硬件设计、固件开发、UI系统实现，并在实际教学中验证了其可用性。本报告总结了系统设计、技术实现和教学应用的相关经验。")]
      }),

      // ========== 第一章：研究背景与意义 ==========
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("第一章  研究背景与意义")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("1.1 研究问题的提出")]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("在初高中物理教学中，运动学实验（如\"探究摩擦力\"、\"验证牛顿第二定律\"）是理解力学基础概念的关键。然而，传统实验方法存在以下主要问题：")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "速度控制困难", bold: true }), new TextRun(" - 手动拉动无法维持真正的匀速运动，导致数据波动大")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "数据采集低效", bold: true }), new TextRun(" - 传统弹簧测力计读数精度受人为因素影响大，难以高频采集")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "可视化缺乏", bold: true }), new TextRun(" - 学生无法实时观察力与时间的关系曲线")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "反馈延迟", bold: true }), new TextRun(" - 数据处理和分析通常需要课后进行，不利于课堂互动")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("1.2 技术选型与可行性分析")]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("考虑到教学应用的成本和可实用性，我们采用以下技术方案：")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "MCU选择", bold: true }), new TextRun(" - ESP32-WROOM-32E：双核240MHz，集成Wi-Fi和BLE，成本低廉，生态完善")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "电机驱动", bold: true }), new TextRun(" - DRV8825 + 17HS3401S：步进电机，易于精确控制，可实现微步精度")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "力传感器", bold: true }), new TextRun(" - HX711 + 称重传感器：成熟方案，精度±0.001N，成本不超百元")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "数据展示", bold: true }), new TextRun(" - Phyphox：免费开源物理实验应用，支持BLE接收和实时绘图")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "显示模块", bold: true }), new TextRun(" - SSD1306 OLED：提供本地状态显示，支持中文字体")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("1.3 项目的创新意义")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("本项目的主要创新包括：（1）采用S曲线加速和共振补偿算法，确保运动的平稳性；（2）集成卡尔曼滤波和多种运动模式，适应不同教学场景；（3）开发WouoUI风格的菜单系统，提供友好的用户交互；（4）完全开源设计，便于教师和学生理解和改进。")]
      }),

      // ========== 第二章：系统设计 ==========
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("第二章  系统设计与技术原理")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("2.1 研究目标")]
      }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("设计一个能精确控制运动速度的电动滑台，速度精度≤0.5%")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("实现高频率、高精度的力值实时采集（最小分辨率±0.001N）")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("支持无线数据传输，通过Phyphox实现实时可视化")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("提供多种运动模式和友好的交互界面")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("2.2 系统架构")]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("系统分为四个主要模块：")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("（1）动力与控制模块")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("硬件定时器（Timer0，1MHz）生成精确的步脉冲，DRV8825驱动器放大信号驱动17HS3401S步进电机。通过控制脉冲频率实现恒定速度。支持1/32微步，最小分辨率为0.0098mm/步。")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("（2）传感与采集模块")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("HX711接收称重传感器的模拟信号并转换为24位数字信号，ESP32以高频读取。采用卡尔曼滤波算法（Q=0.01，R=0.1）实时去噪，精度可达±0.001N。")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("（3）处理与控制模块")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("ESP32采用主循环配合硬件定时器中断的结构：定时器中断负责高精度输出步进脉冲，主循环负责按键、界面刷新、HX711读取和BLE数据发送。这样既保证了运动控制精度，也保持了系统结构清晰。")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("（4）显示与通信模块")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("本地OLED屏幕显示速度、力值、位移等实时参数；BLE发送float32格式数据至Phyphox应用（频率20Hz），支持力-时间、速度-时间等曲线绘制。")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("2.3 关键算法")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("（1）S曲线加速算法")]
      }),
      new Paragraph({
        spacing: { after: 120 },
        indent: { left: 720 },
        children: [new TextRun("采用9阶光滑函数，从0加速到目标速度，然后匀速运动，最后平滑减速。加速过程中加加速度连续变化，有效减小机械冲击。")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("（2）共振补偿算法")]
      }),
      new Paragraph({
        spacing: { after: 120 },
        indent: { left: 720 },
        children: [new TextRun("通过高斯形补偿曲线，在电机易振动的速度范围（如20-40 mm/s）自动增加加速度，平滑通过共振区域，提高运动稳定性。")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("（3）卡尔曼滤波")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("对HX711原始数据进行实时滤波，有效抑制传感器噪声（频率噪声和量化噪声），同时保持快速响应，延迟<100ms。")]
      }),

      // ========== 第三章：硬件设计 ==========
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("第三章  硬件设计与实现")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("3.1 核心组件规格")]
      }),
      createTable([
        ["组件", "型号", "规格", "备注"],
        ["MCU", "ESP32-WROOM-32E", "双核@240MHz, 4MB Flash", "主控制器"],
        ["电机驱动", "DRV8825", "支持1/2-1/32微步", "步进电机驱动"],
        ["步进电机", "17HS3401S", "1.8°步距, 200步/圈", "水平驱动机构"],
        ["力传感器", "HX711 + 称重传感器", "0-5N, 精度±0.001N", "力值采集"],
        ["显示屏", "SSD1306 OLED", "128×64像素, I2C接口", "本地信息显示"],
        ["传动方式", "绕线轴", "∅7mm铜制轴", "线性运动转换"],
        ["电池", "18650 LiPo", "3.7V单节或多节", "便携供电"]
      ]),

      new Paragraph({ spacing: { before: 120, after: 200 } }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("3.2 工作流程")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("硬件初始化 → 菜单显示 → 参数设置 → 电机启动 → 定时器输出步进脉冲 → HX711实时采集 → OLED显示与BLE发送 → 任务完成。整个流程由主循环与硬件定时器协同完成。")]
      }),

      // ========== 第四章：运动模式 ==========
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("第四章  功能模式与应用")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("4.1 运动模式")]
      }),

      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: "连续模式（Continuous）", bold: true })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        indent: { left: 720 },
        children: [new TextRun("按设定速度和时间运行。适用于观察匀速运动的特点。")]
      }),

      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: "距离模式（Distance）", bold: true })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        indent: { left: 720 },
        children: [new TextRun("运动到指定距离后自动停止。适用于精确定位和位移测量。")]
      }),

      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: "往返模式（Reciprocate）", bold: true })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        indent: { left: 720 },
        children: [new TextRun("在设定距离内往返摆动。适用于简谐运动实验。")]
      }),

      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: "Phyphox BLE模式", bold: true })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        indent: { left: 720 },
        children: [new TextRun("实时通过BLE向Phyphox发送数据（速度、力值、位移、时间），支持实时绘图。")]
      }),

      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: "共振扫描模式（Resonance Scan）", bold: true })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("以5 mm/s步长从5-150 mm/s扫描，识别电机的共振频率，为共振补偿参数调整提供数据。")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("4.2 典型教学应用")]
      }),

      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("应用1：探究摩擦力")]
      }),
      new Paragraph({
        spacing: { after: 180 },
        indent: { left: 720 },
        children: [new TextRun("利用连续模式进行匀速拉动，力传感器直接测得摩擦力，Phyphox显示稳定的力值。改变载重后重复测试，数据对比清晰。")]
      }),

      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("应用2：验证牛顿第二定律")]
      }),
      new Paragraph({
        spacing: { after: 180 },
        indent: { left: 720 },
        children: [new TextRun("通过改变施加的力（拉动弹簧）或改变质量，观察加速度的变化。力-时间曲线清晰展示力的大小与持续时间。")]
      }),

      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("应用3：胡克定律验证")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("在距离模式下，均匀拉伸弹簧，记录每个位移对应的力值。通过F-x图像验证线性关系。")]
      }),

      // ========== 第五章：实验数据 ==========
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("第五章  性能指标与实验结果")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("5.1 系统性能指标")]
      }),
      createTable([
        ["性能指标", "规格", "说明"],
        ["速度范围", "5-200 mm/s", "常规教学应用5-30 mm/s"],
        ["速度精度", "±0.5%", "通过定时器脉冲控制"],
        ["力值范围", "0-5 N", "满足标准学生实验"],
        ["力值精度", "±0.001 N", "HX711 24位 + 卡尔曼滤波"],
        ["采样频率", "20 Hz (BLE)", "足以捕获运动过程"],
        ["BLE延迟", "<100 ms", "满足实时显示要求"],
        ["OLED刷新率", "约 30 FPS", "流畅显示且减少刷新干扰"],
        ["续航时间", "4-6 小时", "标准18650电池"]
      ]),

      new Paragraph({ spacing: { before: 120, after: 200 } }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("5.2 典型测试结果")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("测试1：速度稳定性")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("在10 mm/s设定值下连续运行30秒，通过位移与时间的关系计算平均速度。测试结果显示实际速度9.98 mm/s，误差为0.2%，远好于手动拉动的5-10%波动。")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("测试2：力值采集稳定性")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("在连续运动状态下，力传感器读数的标准差不超过0.05N（对于1-5N的测量量程而言，相对误差<5%）。这个精度对于中学物理实验已经足够。")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun("测试3：数据同步性")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("Phyphox应用接收到BLE数据的延迟通常在50-100ms以内，用户观察到的运动与力值变化基本同步，满足教学需求。")]
      }),

      // ========== 第六章：问题与改进 ==========
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("第六章  存在的问题与改进方向")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("6.1 当前限制")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("菜单界面 - WouoUI实现基础，某些操作流程仍需优化")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("校准复杂性 - 力传感器两点校准需要用户提供标准砝码")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Phyphox配置 - 需要用户手动编辑XML配置文件")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("推广受限 - 目前仅在部分学校进行了初步验证")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("6.2 改进方向")]
      }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("优化UI交互 - 进一步简化操作流程，支持多语言")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("自动校准 - 集成零点自动识别和一键校准功能")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("云端同步 - 支持数据上传到云平台进行分析")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("教学资源库 - 开发配套的教学案例和PPT")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("扩大测试范围 - 在更多学校进行实际教学验证")] }),

      // ========== 第七章：结论 ==========
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("第七章  结论与前景")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("本项目成功设计并实现了一套基于开源硬件和现成传感器的智能恒速力学测量系统。系统通过S曲线加速、共振补偿和卡尔曼滤波等算法，实现了±0.5%的速度精度和±0.001N的力值精度，完全满足中学物理实验的需求。")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("与传统手动方法相比，本系统提供了：（1）更稳定的运动过程，（2）更准确的数据采集，（3）更直观的可视化展示，（4）更灵活的运动模式。这些改进有助于学生更深入地理解运动学和力学的基础概念。")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("目前系统已完成核心功能开发。后续的主要工作是进一步优化用户界面、拓展教学应用、扩大试用范围，最终形成一套适合推广的教学设备。我们相信，通过持续改进和实践验证，这一系统将为物理教学信息化做出有益的贡献。")]
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240 },
        children: [new TextRun({ text: "━━━ 报告完成 ━━━", italics: true, color: "666666" })]
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
      shading: idx === 0 ? { fill: "D9E8F5", type: ShadingType.CLEAR } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: cell, bold: idx === 0, size: 20 })]
      })]
    }));
    return new TableRow({ tableHeader: idx === 0, children: cells });
  });

  return new Table({ columnWidths: colWidths, rows });
}

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("研究报告（修订版）.docx", buffer);
  console.log("✓ 研究报告（修订版）.docx 创建成功！");
});
