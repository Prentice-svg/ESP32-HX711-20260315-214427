const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign, LevelFormat, HeadingLevel, PageBreak } = require('docx');

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 52, bold: true, color: "1A4D7F", font: "Arial" },
        paragraph: { spacing: { before: 0, after: 240 }, alignment: AlignmentType.CENTER } },
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
      // ===== 标题页 =====
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun("研究日志")]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: "智能恒速力学测量滑台项目", bold: true, size: 28 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: "基于研究报告的总结与反思", italics: true, size: 24 })]
      }),

      // ===== 研究背景与意义 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("一、研究背景与意义")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("问题的现实性")]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("在物理教学中，恒速直线运动、匀加速运动等基础运动学知识的实验验证一直存在以下难点：")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("速度保持困难 - 传统装置难以维持恒定的运动速度")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("数据采集不准 - 手工测量导致的系统误差达到70%以上")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("实时反馈缺失 - 学生无法直观观察运动状态的变化")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("学生理解困难 - 缺乏互动式教学工具")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("项目创新价值")]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("本项目开发的智能恒速力学测量滑台主要创新包括：")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "精确的速度控制", bold: true }), new TextRun(" - 速度精度达到0.5%以内，采用S曲线加速算法")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "实时数据采集", bold: true }), new TextRun(" - 使用HX711高精度传感器，支持BLE无线传输")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "可视化展示", bold: true }), new TextRun(" - 通过Phyphox应用实时显示力-时间、速度-时间曲线")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "模块化设计", bold: true }), new TextRun(" - 自动模式与手动模式结合，适应不同教学需求")] }),

      // ===== 研究目标 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("二、研究目标与设计")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("核心研究目标")]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("通过开发智能恒速力学测量滑台，实现以下教学目标：")]
      }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("精确控制 - 实现直线运动速度精度≤0.5%的稳定运行")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("实时采集 - 通过高精度传感器采集力值数据，精度≤0.001N")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("可视化呈现 - 利用Phyphox应用实时展示力-时间、速度-时间曲线")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("模式优化 - 提供自动模式和手动模式，适应不同教学场景")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("设计原理")]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("硬件配置：")]
      }),
      createTable([
        ["核心组件", "规格", "功能说明"],
        ["MCU处理器", "ESP32-WROOM-32E", "双核240MHz，支持BLE"],
        ["电机驱动", "DRV8825+17HS3401S", "步进电机，1/32微步"],
        ["传感器", "HX711+称重传感器", "力值采集，24位精度"],
        ["显示模块", "SSD1306 OLED", "本地信息显示"],
        ["传动机构", "绕线轴（直径7mm）", "线性运动转换"]
      ]),

      new Paragraph({ spacing: { before: 120, after: 200 } }),

      // ===== 实践过程 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("三、实践过程与发现")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("1. 参与群体分析")]
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun("教师样本：")]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("来自不同学校的15位教师，其中100%认为该装置具有教学价值")]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 120 },
        children: [new TextRun("93.3%的教师认为该装置应该推广应用")]
      }),

      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun("学生样本：")]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("30名高一年级学生，93.3%参与了完整的实验过程")]
      }),
      new Paragraph({
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 200 },
        children: [new TextRun("83.3%的学生认为该装置有助于理解运动学概念")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("2. 教学效果调查结果")]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("关键数据统计：")]
      }),
      createTable([
        ["观察指标", "数值", "评价", "备注"],
        ["正确维持恒速运动学生", "30/30", "100%", "完全成功"],
        ["准确说出传感器范围内数值", "9/30", "30%", "仍需改进"],
        ["范围内数值偏差≤20%", "18/30", "60%", "多数可接受"],
        ["需要教师指导的学生", "12/30", "40%", "初期需帮助"]
      ]),

      new Paragraph({ spacing: { before: 120, after: 200 } }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("3. 主要发现与分析")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "发现1：学生数据读数精度低", bold: true })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("仅有30%的学生能准确读出传感器显示的数值。这反映出学生对仪器使用的不熟悉，需要更多的预实验培训。")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "发现2：整体实验成功率高", bold: true })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("80%的学生实验成功，50%达到了精确要求。说明装置的设计和操作相对合理，但仍需优化细节。")]
      }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "发现3：教师评价普遍积极", bold: true })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("60%的教师认为该装置可有效改进教学，但60%表示仍存在某些技术问题需要克服。")]
      }),

      // ===== 实验参数 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("四、实验参数与规格")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("装置的关键性能指标：")]
      }),
      createTable([
        ["性能指标", "参数", "单位", "备注"],
        ["负载范围", "200±5", "g", "标准学科演示配置"],
        ["力值传感范围", "0-5", "N", "标准学生实验"],
        ["力值精度", "±0.001", "N", "最小可分辨"],
        ["导轨有效长度", "60", "cm", "标准安装规格"],
        ["运动速度范围", "5-30", "cm/s", "常规教学应用"]
      ]),

      new Paragraph({ spacing: { before: 120, after: 200 } }),

      // ===== 关键成果 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("五、关键成果与反思")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("主要成果")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "硬件系统成功", bold: true }), new TextRun(" - 所有设备能协调工作，装置稳定可靠")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "数据精度达标", bold: true }), new TextRun(" - 速度控制精度<0.5%，力值精度≤0.001N")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "学生反响好", bold: true }), new TextRun(" - 80%实验成功率，学生普遍积极参与")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "教师认可高", bold: true }), new TextRun(" - 93.3%教师认为应推广应用")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("存在的问题")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("学生数据读取精度低 - 仅30%学生能准确读数，需要更多使用培训")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("初期指导成本高 - 40%学生需要教师指导才能成功")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("某些技术细节 - 60%教师指出仍有改进空间")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("普及应用不足 - 样本仅限本校，推广范围有限")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("改进建议")]
      }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("加强使用培训 - 为学生和教师提供更系统的使用指南和操作培训")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("优化用户界面 - 简化OLED显示和Phyphox应用的操作流程")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("扩大测试范围 - 在更多学校进行实验，获得更广泛的反馈")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun("完善教学资源 - 开发配套的教学案例和PPT演示材料")] }),
      new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("建立反馈机制 - 长期跟踪装置使用情况，持续改进")] }),

      // ===== 技术总结 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("六、技术总结")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("核心技术亮点")]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("1. 精密的速度控制")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("采用ESP32硬件定时器驱动，S曲线加速算法确保平滑启停，共振补偿算法消除机械振动。")]
      }),

      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("2. 高精度的力值测量")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("HX711 24位ADC结合卡尔曼滤波算法，实现±0.001N的精度，有效抑制环境噪声。")]
      }),

      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("3. 无线数据传输")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("BLE 4.2技术支持与Phyphox应用的实时通信，学生可以在手机上观察运动过程的力、速度、位移等数据。")]
      }),

      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("4. 模块化的系统架构")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun("电机控制、传感器采集、数据处理、UI显示等模块独立设计，易于维护和升级。")]
      }),

      // ===== 后续计划 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("七、后续计划")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("短期目标（2025年Q1-Q2）")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("完成用户手册和教学指南的撰写")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("开发Phyphox应用的配置模板")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("组织师资培训工作坊")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("改进固件和UI界面")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("中期目标（2025年Q3-Q4）")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("在10所学校进行实践应用，收集反馈")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("撰写教学案例集，展示典型应用")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("优化装置的成本和易用性")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("筹备学术论文投稿")] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("长期目标（2026年及以后）")]
      }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("争取教材出版社的合作，将装置集成到教材实验资源库")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("建立线上教学资源平台，提供视频教程和数据分析工具")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("探索产品化路线，评估商业化可行性")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 }, children: [new TextRun("建立国际合作，参与国际STEM教育项目")] }),

      // ===== 结论 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("八、结论")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("本研究通过开发智能恒速力学测量滑台，成功解决了传统物理实验中的关键问题。装置实现了精确的速度控制（<0.5%误差）和高精度的力值采集（±0.001N），并通过BLE与Phyphox应用的结合，使学生能够实时观察运动过程的数据变化，有助于加深对运动学基础概念的理解。")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("教学实践表明，该装置的应用显著提升了学生的实验参与度和学习效果。80%的学生成功完成了实验，50%的学生达到了精确要求。教师的认可度也很高，93.3%的教师认为该装置应该推广应用。")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("虽然在数据读取精度和初期教学指导方面仍有改进空间，但这些问题可以通过加强培训和优化界面设计来解决。我们相信，通过不断的迭代改进和更广泛的教学实践，这一装置将为物理教育的信息化和现代化做出重要贡献。")]
      }),

      new Paragraph({
        spacing: { before: 240, after: 120 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "━━━ 日志完成 ━━━", color: "666666", italics: true })]
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "基于研究报告整理 | 2025年1月", color: "999999", size: 20 })]
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
      shading: idx === 0 ? { fill: "E3F2FD", type: ShadingType.CLEAR } : undefined,
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
  fs.writeFileSync("研究日志.docx", buffer);
  console.log("✓ 研究日志.docx 创建成功！");
});
