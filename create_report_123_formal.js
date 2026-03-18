const fs = require("fs");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LineRuleType,
  Packer,
  PageBreak,
  Paragraph,
  SimpleField,
  TableOfContents,
  TabStopPosition,
  TabStopType,
  TextRun,
} = require("docx");

const FILE_NAME = "智能恒速力学测量滑台-研究报告123-正式版.docx";

const TITLE_FONT = "方正小标宋简体";
const BODY_FONT = "仿宋_GB2312";
const HEADING_FONT = "黑体";
const SUBHEADING_FONT = "楷体_GB2312";

function bodyParagraph(text, options = {}) {
  return new Paragraph({
    spacing: {
      line: options.line ?? 560,
      lineRule: LineRuleType.EXACT,
      before: options.before ?? 0,
      after: options.after ?? 0,
    },
    indent: options.firstLine === false ? undefined : { firstLine: 448 },
    alignment: options.alignment ?? AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text,
        font: BODY_FONT,
        size: 32,
        bold: options.bold ?? false,
      }),
    ],
  });
}

function chapter(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 120, after: 120, line: 560, lineRule: LineRuleType.EXACT },
    children: [new TextRun({ text, font: HEADING_FONT, size: 32, bold: true })],
  });
}

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 60, after: 60, line: 560, lineRule: LineRuleType.EXACT },
    children: [new TextRun({ text, font: SUBHEADING_FONT, size: 32, bold: true })],
  });
}

function coverLine(label, value) {
  return new Paragraph({
    spacing: { before: 0, after: 0, line: 640, lineRule: LineRuleType.EXACT },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: `${label}：`, font: BODY_FONT, size: 32, bold: true }),
      new TextRun({ text: value, font: BODY_FONT, size: 32 }),
    ],
  });
}

function pageBreakParagraph() {
  return new Paragraph({ children: [new PageBreak()] });
}

function imageBlock(path, caption, width, height) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 40 },
      children: [
        new ImageRun({
          type: "png",
          data: fs.readFileSync(path),
          transformation: { width, height },
          altText: {
            title: caption,
            description: caption,
            name: caption,
          },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120, line: 480, lineRule: LineRuleType.EXACT },
      children: [new TextRun({ text: caption, font: BODY_FONT, size: 24, bold: true })],
    }),
  ];
}

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 500, after: 180 },
    children: [
      new TextRun({
        text: "智能恒速力学测量滑台",
        font: TITLE_FONT,
        size: 48,
        bold: true,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text: "研究报告（正式版）", font: BODY_FONT, size: 38, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 680 },
    children: [new TextRun({ text: "项目申报与成果说明材料", font: BODY_FONT, size: 32 })],
  }),
  coverLine("项目类别", "学校科技作品"),
  coverLine("项目名称", "智能恒速力学测量滑台"),
  coverLine("技术方向", "嵌入式控制与物理实验教学设备"),
  coverLine("核心模块", "步进控制、实时测力、BLE可视化"),
  coverLine("主控平台", "ESP32-WROOM-32E"),
  coverLine("报告用途", "研究报告、项目申报、答辩支撑"),
  new Paragraph({
    spacing: { before: 640, after: 0, line: 640, lineRule: LineRuleType.EXACT },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `生成日期：${new Date().toISOString().slice(0, 10)}`, font: BODY_FONT, size: 32 })],
  }),

  pageBreakParagraph(),

  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 120 },
    children: [new TextRun({ text: "摘要", font: HEADING_FONT, size: 36, bold: true })],
  }),
  bodyParagraph("本项目针对中学物理实验中“匀速运动难保持、力值数据难连续、实验现象难直观展示”的问题，设计并实现了一套基于ESP32的智能恒速力学测量滑台。系统采用ESP32-WROOM-32E作为主控，通过DRV8825驱动17HS3401S步进电机，并利用绕线轴结构牵引被测物体运动；同时结合HX711与称重传感器实现拉力实时采集，并通过OLED显示与BLE连接Phyphox完成实验数据可视化。"),
  bodyParagraph("在控制策略方面，项目引入高阶S曲线加减速和共振补偿机制，用于改善步进电机启动、停止及特定速度区间的振动问题；在测量策略方面，结合卡尔曼滤波、去皮和两点校准，提高力值测量的稳定性和可重复性。系统当前已完成运动控制、参数菜单、力值校准、蓝牙传输、运行模式切换和研究文档生成等关键功能，可用于摩擦力测量、牛顿第二定律演示、胡克定律验证等教学实验。"),
  bodyParagraph("本项目以较低成本整合稳定运动控制、实时测力、人机交互和无线可视化，兼具工程实践价值、教学应用价值和推广意义。", { after: 80 }),
  bodyParagraph("关键词：ESP32；HX711；步进电机；力学实验；恒速测量；Phyphox", {
    firstLine: false,
    bold: true,
  }),

  pageBreakParagraph(),

  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 180 },
    children: [new TextRun({ text: "目录", font: HEADING_FONT, size: 36, bold: true })],
  }),
  new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),

  pageBreakParagraph(),

  chapter("第一章  研究背景与意义"),
  sectionHeading("1.1 研究背景"),
  bodyParagraph("在初高中物理教学中，验证牛顿第二定律、测量摩擦因数、探究胡克定律等经典实验都要求物体具备较稳定的运动状态，尤其是在匀速条件下，力学数据才具有较高分析价值。传统教学中多采用人工拉动木块并配合弹簧测力计读数的方式完成实验，但人手难以长期维持稳定速度，往往导致实验结果波动较大。"),
  bodyParagraph("这种传统方式带来的问题主要包括：速度忽快忽慢，无法维持真正匀速；测力计读数不断跳动，难以获得连续稳定数据；学生只能看到瞬时结果，难以直观理解力与运动的关系；实验重复次数增多，影响课堂效率和教学体验。"),
  sectionHeading("1.2 研究意义"),
  bodyParagraph("本项目的意义在于以低成本开源硬件构建一套稳定运动与实时测力相结合的教学装置，用自动化方式替代人工拉动环节，减少人为误差，提高物理实验的可重复性和可视化程度。"),

  chapter("第二章  研究目标与总体思路"),
  sectionHeading("2.1 研究目标"),
  bodyParagraph("本项目的研究目标包括：一是实现较稳定的匀速牵引运动，将速度误差控制在适合教学实验的范围内；二是实现拉力数据的实时采集、滤波与显示；三是支持BLE无线传输，通过Phyphox进行实验数据可视化；四是提供可独立操作的菜单交互，提高课堂使用便利性。"),
  sectionHeading("2.2 总体思路"),
  bodyParagraph("项目采用ESP32作为统一控制核心，利用硬件定时器中断输出高精度步进脉冲，通过DRV8825驱动步进电机运动；机械部分采用绕线轴结构，将旋转运动转化为牵引运动；测力部分采用HX711采集称重传感器数据；交互部分采用OLED与按键菜单；展示部分通过BLE连接Phyphox实现数据图形化。"),

  chapter("第三章  系统结构与工作原理"),
  sectionHeading("3.1 系统总体结构"),
  bodyParagraph("系统由控制驱动模块、机械传动模块、传感采集模块和显示通信模块四部分组成。控制驱动模块负责输出步进脉冲和控制方向；机械传动模块完成匀速拉动；传感采集模块负责测量拉力；显示通信模块负责本地显示和手机端实验展示。"),
  ...imageBlock("system_diagram.png", "图3-1  系统总体结构图", 520, 390),
  sectionHeading("3.2 机械与控制细节"),
  bodyParagraph("电机驱动绕线轴转动，PE线在轴上卷绕或释放，从而拉动物体运动。为了避免传感器自身跟随移动造成惯性干扰，力传感器保持固定，仅通过导向结构改变拉力方向，这样有利于提高测量稳定性。"),
  ...imageBlock("detailed_structure.png", "图3-2  机械结构与控制关系图", 500, 354),
  sectionHeading("3.3 引脚与硬件配置"),
  bodyParagraph("系统当前实际引脚配置为：STEP接GPIO25，DIR接GPIO26，ENABLE接GPIO27；按键分别接GPIO32、GPIO33、GPIO18、GPIO19；OLED的I2C总线接GPIO21和GPIO22；HX711的DOUT与SCK分别接GPIO16和GPIO17。DRV8825微步采用跳线帽方式设置，程序当前按1/32微步进行参数计算。"),

  chapter("第四章  关键技术与创新点"),
  sectionHeading("4.1 S曲线平滑控制"),
  bodyParagraph("项目采用高阶S曲线加减速策略，使电机从静止到目标速度、再从目标速度减速停止的过程更加平滑。相比直接阶跃给速，S曲线能有效减小机械冲击，提高运动平稳性。"),
  sectionHeading("4.2 共振补偿与扫描"),
  bodyParagraph("步进电机在某些速度区间容易出现共振。项目通过设置最小起步速度、划定共振区间并加入补偿逻辑，尽量快速通过易振动区间。同时增加共振扫描模式，用于实验调试和参数优化。"),
  sectionHeading("4.3 实时测力与滤波校准"),
  bodyParagraph("项目在HX711采集基础上引入卡尔曼滤波、去皮和两点校准，并将校准参数写入NVS，从而提高数据稳定性和重复开机后的直接可用性。"),
  sectionHeading("4.4 系统层面的创新"),
  bodyParagraph("项目的创新不在于单一器件，而在于系统化整合。它把稳定运动控制、实时测力、OLED交互和BLE可视化整合到同一装置中，使其不仅是一个运动平台，更是一个可用于教学实验的综合力学测量系统。"),

  chapter("第五章  软件设计与实现"),
  sectionHeading("5.1 程序结构"),
  bodyParagraph("当前固件主程序集中在`src/main.cpp`中，整体采用“主循环加硬件定时器中断”的结构。`setup()`完成引脚、定时器、OLED、HX711、BLE等初始化；`loop()`负责按键处理、力值采集、界面刷新和运行状态更新；`onStepTimer()`在中断中直接产生步进脉冲。"),
  sectionHeading("5.2 运行模式"),
  bodyParagraph("系统已实现连续模式、距离模式、往返模式、共振扫描模式和Phyphox实验模式，能够覆盖恒速拉动、定距离移动、周期性运动和实验展示等多种教学需求。"),
  sectionHeading("5.3 数据传输与显示"),
  bodyParagraph("系统通过BLE向Phyphox发送速度、力、位移和时间数据，同时OLED显示当前状态、参数和运行信息，兼顾独立使用与移动端扩展展示。"),

  chapter("第六章  制作过程中的问题与解决办法"),
  sectionHeading("6.1 电机振动与共振问题"),
  bodyParagraph("在早期调试中，步进电机在低速运行时存在明显振动，导致牵引过程不平稳。后续通过设置最小起步速度、引入共振补偿和共振扫描模式，对这一问题进行了针对性优化。"),
  sectionHeading("6.2 启停冲击问题"),
  bodyParagraph("若直接给定目标速度，系统会在启停阶段产生较大冲击，不利于实验稳定性。通过改用S曲线加减速后，速度变化更加连续平滑。"),
  sectionHeading("6.3 测力波动问题"),
  bodyParagraph("称重传感器在动态运动过程中会受到微振动影响，导致原始数据波动较大。项目通过卡尔曼滤波、去皮和两点校准显著改善了这一问题。"),
  sectionHeading("6.4 文档与方案迭代问题"),
  bodyParagraph("项目从构想到实现经历了多轮方案迭代，因此在文档、参数和结构说明上也需要不断同步修订。当前版本已经统一到绕线轴、主循环加定时器中断、BLE 20Hz输出的实现口径。"),

  chapter("第七章  应用价值与推广前景"),
  bodyParagraph("本项目可直接用于摩擦力测量、牛顿第二定律演示、胡克定律验证等物理实验场景，能够明显提升实验的稳定性和可视化程度。相比昂贵的专业设备，该系统采用常见元件实现，具有低成本、易理解、可扩展和便于推广的特点。"),

  chapter("第八章  结论与展望"),
  bodyParagraph("本项目完成了一套基于ESP32的智能恒速力学测量滑台设计，实现了稳定牵引、实时测力、本地交互和无线可视化等核心功能。项目从实际教学问题出发，在运动控制、共振优化、力值滤波和实验展示等方面进行了系统化整合，具有较好的工程实现价值和教学应用价值。"),
  bodyParagraph("后续工作可围绕机械结构进一步优化、自动校准、实验数据导出和更标准化的教学套件展开，以推动该装置在学校实验教学中的实际应用。"),

  chapter("第九章  附件说明"),
  bodyParagraph("本项目附件材料包括：固件源代码文件、PlatformIO配置文件、Phyphox实验配置文件、系统结构图、机械结构图、研究报告正式版Word与PDF文件，以及相关研究日志和说明文档。上述材料可用于项目申报、成果展示、答辩说明和后续复现。"),

  chapter("第十章  参考资料"),
  bodyParagraph("1. ESP32-WROOM-32E 芯片技术手册。", { firstLine: false }),
  bodyParagraph("2. DRV8825 步进电机驱动器应用资料。", { firstLine: false }),
  bodyParagraph("3. HX711 高精度称重采集芯片数据手册。", { firstLine: false }),
  bodyParagraph("4. Phyphox 官方文档与实验应用说明。", { firstLine: false }),
  bodyParagraph("5. 步进电机S曲线加减速控制与共振抑制相关研究资料。", { firstLine: false }),
  bodyParagraph("6. 卡尔曼滤波在传感器数据处理中的经典理论资料。", { firstLine: false }),
  bodyParagraph("7. 中学物理实验教学中关于摩擦力、牛顿第二定律和胡克定律实验的教学参考资料。", { firstLine: false }),
];

const doc = new Document({
  creator: "Codex",
  lastModifiedBy: "Codex",
  title: "智能恒速力学测量滑台——研究报告123正式版",
  subject: "学校科技作品研究报告",
  description: "包含封面、摘要、关键词、目录、系统结构图、机械结构图、正文、附件说明和参考资料的正式研究报告。",
  keywords: "ESP32,HX711,步进电机,研究报告,物理实验,测力滑台",
  styles: {
    default: {
      document: {
        run: { font: BODY_FONT, size: 32 },
        paragraph: { spacing: { line: 560, lineRule: LineRuleType.EXACT } },
      },
    },
    paragraphStyles: [
      {
        id: "Title",
        name: "Title",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: TITLE_FONT, size: 48, bold: true, color: "000000" },
        paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 500, after: 180 } },
      },
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: HEADING_FONT, size: 32, bold: true, color: "000000" },
        paragraph: { spacing: { before: 120, after: 120, line: 560, lineRule: LineRuleType.EXACT }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: SUBHEADING_FONT, size: 32, bold: true, color: "000000" },
        paragraph: { spacing: { before: 60, after: 60, line: 560, lineRule: LineRuleType.EXACT }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: BODY_FONT, size: 30, bold: true, color: "000000" },
        paragraph: { spacing: { before: 40, after: 40, line: 560, lineRule: LineRuleType.EXACT }, outlineLevel: 2 },
      },
    ],
  },
  sections: [
    {
      properties: {
        titlePage: true,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 2200, bottom: 2000, left: 2000, right: 2000 },
        },
      },
      headers: {
        first: new Header({ children: [new Paragraph({ children: [] })] }),
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "808080", space: 1 },
              },
              children: [
                new TextRun({
                  text: "智能恒速力学测量滑台  研究报告正式版",
                  font: BODY_FONT,
                  size: 24,
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        first: new Footer({ children: [new Paragraph({ children: [] })] }),
        default: new Footer({
          children: [
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: "第 ", font: BODY_FONT, size: 24 }),
                new SimpleField(" PAGE ", "1"),
                new TextRun({ text: " 页", font: BODY_FONT, size: 24 }),
                new TextRun({ text: "\t", font: BODY_FONT, size: 24 }),
                new TextRun({ text: "研究报告123正式版", font: BODY_FONT, size: 24 }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(FILE_NAME, buffer);
  console.log(`DOCX generated: ${FILE_NAME}`);
});
