const fs = require("fs");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
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

const FILE_NAME = "智能恒速测力系统-研究报告正式版.docx";

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

function qaHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 40, after: 40, line: 560, lineRule: LineRuleType.EXACT },
    children: [new TextRun({ text, font: BODY_FONT, size: 32, bold: true })],
  });
}

function pageBreakParagraph() {
  return new Paragraph({ children: [new PageBreak()] });
}

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 240 },
    children: [
      new TextRun({
        text: "基于ESP32的智能恒速测力系统",
        font: TITLE_FONT,
        size: 44,
        bold: true,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text: "学校科技作品申报书 / 研究报告正式版", font: BODY_FONT, size: 36, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 680 },
    children: [new TextRun({ text: "公文版", font: BODY_FONT, size: 32 })],
  }),
  coverLine("项目类别", "科技作品"),
  coverLine("项目方向", "嵌入式控制与物理实验教学设备"),
  coverLine("核心内容", "恒速拉动、实时测力、BLE可视化"),
  coverLine("主控平台", "ESP32-WROOM-32E"),
  coverLine("文稿用途", "作品申报、研究说明与答辩支撑材料"),
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
  bodyParagraph("本项目围绕中学物理实验中“运动难稳定、测力难连续、现象不直观”的实际问题，设计并实现了一套基于ESP32的智能恒速测力系统。系统采用ESP32-WROOM-32E作为主控，通过DRV8825驱动17HS3401S步进电机，并利用直径7毫米的绕线轴牵引被测物体运动；同时结合HX711与称重传感器实现拉力实时采集，并通过OLED本地显示和BLE连接Phyphox实现实验数据可视化。"),
  bodyParagraph("在控制策略上，系统引入高阶S曲线加减速算法和共振补偿机制，用于改善步进电机启动、停止及特定速度区间的振动问题；在测量策略上，结合卡尔曼滤波、去皮和两点校准，提高力值读数的稳定性和重复使用能力。项目已完成多种运动模式、参数菜单、力值校准、BLE传输和研究报告文档化整理，能够服务于摩擦力测量、牛顿第二定律演示、胡克定律验证等教学实验。"),
  bodyParagraph("本项目的特点在于以较低成本整合稳定运动控制、实时测力、人机交互和无线可视化，使其不仅具备工程实践价值，也具有较好的教学应用价值和推广意义。", { after: 80 }),
  bodyParagraph("关键词：ESP32；HX711；步进电机；物理实验；恒速测力；Phyphox", {
    firstLine: false,
    bold: true,
  }),

  pageBreakParagraph(),

  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 180 },
    children: [new TextRun({ text: "目录", font: HEADING_FONT, size: 36, bold: true })],
  }),
  new TableOfContents("目录", {
    hyperlink: true,
    headingStyleRange: "1-3",
  }),

  pageBreakParagraph(),

  chapter("一、项目背景与研究动机"),
  bodyParagraph("在中学物理实验中，摩擦力测量、牛顿第二定律验证、胡克定律验证等内容，都要求被测物体在较稳定的运动状态下完成实验，尤其是在匀速条件下，拉力数据才更具有分析意义。传统实验通常依赖学生手动拉动物体，再通过弹簧测力计进行读数。这种方式虽然简单，但手部动作难以长期保持稳定，实验过程容易出现忽快忽慢、读数抖动和重复性差等问题。"),
  bodyParagraph("因此，本项目的研究动机并不是单纯制作一个能动起来的电机装置，而是希望解决一个真实的教学痛点：如何让实验中的运动过程更稳定，让力学数据更直观，让学生和教师都能更容易获得可靠结果。"),

  chapter("二、为什么要做这个设备"),
  bodyParagraph("第一，传统手拉实验方式存在明显误差源。学生手工拉动时，速度受经验、反应时间和操作习惯影响较大，很难保持真正匀速，这会直接影响摩擦力、弹力等实验数据的稳定性。"),
  bodyParagraph("第二，教学实验需要更直观的数据展示。如果只能观察弹簧测力计的瞬时刻度，学生往往难以理解力随时间变化和匀速状态下合力平衡等概念；如果能把速度、位移和力值实时显示出来，实验现象就会更清楚。"),
  bodyParagraph("第三，现有方案要么太简陋，要么成本较高。纯手工方式成本低，但稳定性差；专业教学数据采集设备虽然效果较好，但价格较高、结构封闭，不利于普通学校推广和二次改造。因此，本项目希望在较低成本下实现较好的实验效果。"),
  bodyParagraph("第四，该设备具有明确的教学应用价值。它既能作为课堂演示装置，也能作为学生探究实验的辅助平台，可用于摩擦力测量、牛顿第二定律演示、胡克定律验证、简谐运动扩展等多个实验场景。"),

  chapter("三、现有方案分析与本项目切入点"),
  bodyParagraph("围绕稳定拉动加实时测力这一需求，现有方案大致可以分为三类。第一类是传统手拉加弹簧测力计，优点是简单、便宜、易搭建，缺点是速度难控制、数据不连续、实验重复性差。第二类是现成工业滑台或电动平台，优点是运动稳定性较好，但成本较高、结构较封闭，不适合课堂改造和学生理解内部原理。第三类是简单电机拖动方案，虽然能够替代人工拉动，但常常只解决能动的问题，没有进一步解决平稳启停、共振抑制、实时测力和无线可视化等问题。"),
  bodyParagraph("本项目的切入点是，在较低成本前提下，将稳定运动控制、力传感采集、本地人机交互和无线数据展示整合到一个系统中，使其既具备工程实现性，又服务于教学场景。"),

  chapter("四、项目总体方案"),
  bodyParagraph("本系统采用ESP32-WROOM-32E作为主控，通过DRV8825驱动17HS3401S步进电机，电机带动直径7毫米的绕线轴卷绕PE线，从而拉动被测物体运动。系统同时通过HX711采集称重传感器信号，对拉力进行实时测量，并在OLED上显示运行状态，同时通过BLE将速度、力、位移、时间发送给Phyphox应用，实现实时曲线展示。"),
  bodyParagraph("系统由四个部分组成：控制驱动模块、机械传动模块、传感采集模块以及显示通信模块。控制驱动模块由ESP32、DRV8825和步进电机构成；机械传动模块由绕线轴和PE线牵引结构构成；传感采集模块由HX711和称重传感器构成；显示通信模块由OLED和BLE通信链路构成。"),

  chapter("五、项目现有完成内容"),
  bodyParagraph("根据当前硬件和程序实现情况，项目已经完成了以下核心功能。第一，系统已实现基于硬件定时器中断的步进脉冲输出，能够较稳定地控制步进电机速度和方向。第二，程序已经实现连续模式、定距离模式、往返模式、共振扫描模式和Phyphox实验模式。第三，系统可以读取HX711数据，支持去皮、100克两点校准，并将校准结果保存到NVS中，重启后仍可使用。第四，项目已经完成OLED本地菜单系统，用户可以通过按键设置速度、距离、时间、加速时长、方向和运行模式。第五，系统已经支持通过BLE向Phyphox发送速度、力、位移和时间数据，用于手机端实时绘图和记录实验过程。"),

  chapter("六、项目创新点"),
  bodyParagraph("本项目的创新不在于单一元件本身，而在于围绕教学实验需求，对现有元件和方法进行了有针对性的整合与改进。"),
  sectionHeading("（一）从“能拉动”提升到“稳定拉动”"),
  bodyParagraph("现有简单电机方案通常只能做到让物体运动，而本项目进一步引入高阶S曲线加减速控制，使系统在启动和停止阶段更加平滑，减小机械冲击和速度突变。这使装置更适合物理实验，而不是简单演示运动。"),
  sectionHeading("（二）针对步进电机共振问题进行了专门处理"),
  bodyParagraph("在实际制作中发现，步进电机在某些速度段容易发生明显振动，影响运动平稳性。为此，项目增加了共振区识别与补偿逻辑，并设计了共振扫描模式，用于辅助寻找合适的速度区间。这一点是从实际问题出发形成的改进，具有明显的工程针对性。"),
  sectionHeading("（三）把运动控制和实时测力结合在同一平台上"),
  bodyParagraph("很多方案只关注位移或速度控制，而本项目把运动控制与拉力测量结合起来，使其不仅是运动装置，更是力学实验装置。"),
  sectionHeading("（四）引入滤波、校准和数据保存机制"),
  bodyParagraph("为了提高力值测量的可用性，项目在HX711采集基础上加入卡尔曼滤波、去皮校准和两点标定，并将参数写入NVS。这样做提高了系统的可重复使用能力，而不是每次开机都重新配置。"),
  sectionHeading("（五）增加BLE实时可视化能力"),
  bodyParagraph("相较于仅本地显示的方案，本项目通过Phyphox实现手机实时显示，使实验过程更适合课堂展示、结果记录和后续分析。"),
  sectionHeading("（六）面向教学场景优化交互方式"),
  bodyParagraph("项目加入了OLED菜单和按键交互，支持独立设置参数和启动实验，使系统能够脱离电脑直接运行，更适合学校实验环境。"),

  chapter("七、在现有基础上做了什么创新"),
  bodyParagraph("如果从在已有方案上做了什么创新这个角度来概括，本项目的改进主要体现在以下几个方面：在普通步进电机拖动基础上，增加了S曲线平滑控制；在步进系统中加入共振补偿与共振扫描功能；在运动平台基础上集成HX711测力系统；在原始测力基础上加入滤波、去皮和校准保存机制；在本地显示基础上扩展为BLE加Phyphox实时可视化；在单一功能装置基础上扩展成可切换多模式的教学实验平台。换句话说，这个项目不是简单更换元件，而是把多个原本分散的功能整合成了一个完整、可操作、可展示的实验系统。"),

  chapter("八、关键技术原理"),
  bodyParagraph("在软件结构上，当前固件主要采用主循环加硬件定时器中断的方式。定时器中断负责高精度输出步进脉冲，主循环负责按键处理、界面刷新、HX711读取和BLE数据发送。这样做的优点是，关键脉冲由中断独立完成，不会因为显示刷新或通信任务而影响运动稳定性。"),
  bodyParagraph("在运动控制方面，系统使用高阶平滑函数生成速度变化曲线，使电机从起步到目标速度、再到停止的过程更加平滑，从而减小机械冲击。同时，通过划定共振区，在经过这些速度区间时调整补偿参数，让系统更快通过易振动区域，并在部分阶段加入轻微脉冲抖动，以降低共振影响。"),
  bodyParagraph("在测力部分，HX711输出信号容易受到机械微振动和环境噪声影响，因此项目使用卡尔曼滤波对采样值进行平滑处理，并提供去皮和100克两点校准，以提高力值显示稳定性和系统可重复使用能力。"),

  chapter("九、制作过程中遇到的困难与解决办法"),
  sectionHeading("（一）步进电机低速振动明显"),
  bodyParagraph("一开始在低速运行时，电机存在抖动和共振，导致拉动过程不平稳。后来通过设置最小起步速度，避免长期停留在低频共振区，同时引入共振补偿与共振扫描模式，逐步找到并快速通过振动区，改善了这一问题。"),
  sectionHeading("（二）启动和停止阶段冲击较大"),
  bodyParagraph("如果直接给定目标速度，电机会出现突兀起步和停止，影响实验稳定性。为此，项目改为采用S曲线加减速，使速度变化更加平滑。"),
  sectionHeading("（三）HX711力值读数波动"),
  bodyParagraph("称重传感器在动态运动中会受到微振动影响，原始数据波动较大。针对这一问题，系统增加了卡尔曼滤波，并加入去皮与两点校准流程，提高了力值可用性。"),
  sectionHeading("（四）文档方案与实物方案多次迭代"),
  bodyParagraph("项目早期存在不同机械方案和控制思路，后期逐步收敛到绕线轴加定时器中断加HX711测力加BLE显示这一结构。在这个过程中，需要不断修正文档、参数和说明，使其与最终实现一致。"),
  sectionHeading("（五）需要兼顾工程实现和课堂使用"),
  bodyParagraph("如果只追求技术实现，系统可以做得很复杂；但如果要进入教学场景，就必须考虑操作简单、显示直观和稳定可靠。因此在项目中增加了菜单界面、参数编辑、校准界面和实验模式切换，使其更适合课堂实际使用。"),

  chapter("十、项目价值与意义"),
  bodyParagraph("本项目的价值主要体现在三个方面。第一，教学价值。它可以让学生更直观地看到力与运动的关系，提高实验观察效果和课堂理解程度。第二，工程实践价值。项目涉及嵌入式控制、传感器采集、实时滤波、机械传动、人机交互和无线通信，是一个完整的软硬件综合作品。第三，推广价值。相比昂贵的专业设备，本项目使用常见元件搭建，成本较低，更适合在学校、创客课程或科技作品活动中推广。"),

  chapter("十一、项目不足与后续改进方向"),
  bodyParagraph("虽然项目已经完成核心功能，但仍有进一步完善空间。机械结构可以进一步提高刚性和装配一致性；力值校准流程还可以做得更自动化；Phyphox配置和实验模板可以继续完善；系统还可以增加实验数据保存与导出能力；后续也可以增加更多教学模式，如分段运动或力阈值触发。"),

  chapter("十二、正式结论"),
  bodyParagraph("本项目围绕中学物理实验中的真实需求，设计并实现了一套集稳定运动控制、实时测力、本地显示和无线可视化于一体的智能恒速测力系统。它不仅解决了传统手工拉动实验中速度不稳、数据波动大、现象不直观的问题，还通过S曲线控制、共振补偿、滤波校准和BLE展示等设计，提高了系统的可用性和教学适配性。"),
  bodyParagraph("从作品角度看，它具有完整的软硬件实现；从教学角度看，它具有明确的应用场景；从创新角度看，它是在已有步进控制和测力方案基础上进行的系统化整合与改进。因此，本项目既具有技术实现价值，也具有较好的教育应用价值。"),

  chapter("十三、附件说明"),
  bodyParagraph("为便于项目展示、答辩说明和后续复现，项目已配套形成以下附件材料。第一，固件主程序文件，即项目核心控制源码，用于说明系统控制逻辑与实现细节。第二，Phyphox实验配置文件，用于手机端实验展示与数据可视化。第三，结构原理图和系统示意图，用于说明硬件连接关系和总体工作流程。第四，研究报告与答辩文稿，用于项目申报、过程说明和成果展示。第五，文档生成脚本，用于自动生成标准化Word与PDF材料，保证申报资料的持续更新能力。"),
  bodyParagraph("建议在正式申报或答辩提交时，附件清单可包括以下文件：`src/main.cpp`、`platformio.ini`、`phyphox/Stepper_Force_Experiment.phyphox`、结构图文件、研究报告正式版Word与PDF文件、项目日志或研究记录。"),

  chapter("十四、参考资料"),
  bodyParagraph("1. ESP32-WROOM-32E 芯片技术资料与 Arduino-ESP32 开发文档。", { firstLine: false }),
  bodyParagraph("2. DRV8825 步进电机驱动器相关数据手册与应用说明。", { firstLine: false }),
  bodyParagraph("3. HX711 高精度称重采集芯片数据手册。", { firstLine: false }),
  bodyParagraph("4. Phyphox 官方文档及相关实验应用说明。", { firstLine: false }),
  bodyParagraph("5. 步进电机S曲线加减速控制与共振抑制相关技术论文及工程资料。", { firstLine: false }),
  bodyParagraph("6. 卡尔曼滤波在传感器信号处理中的经典理论与工程应用资料。", { firstLine: false }),
  bodyParagraph("7. 中学物理实验教学中关于摩擦力测量、牛顿第二定律验证、胡克定律验证的教学参考资料。", { firstLine: false }),

  chapter("十五、答辩时可能被问到的问题与参考回答"),
  qaHeading("（一）创新点到底是什么"),
  bodyParagraph("参考回答：本项目的创新不在单个元件本身，而在系统层面的整合与改进。我们不是简单把电机和传感器拼在一起，而是围绕教学实验需求，增加了S曲线平滑控制、共振补偿、HX711测力滤波与校准、BLE实时可视化和本地菜单交互，把多个功能整合成一个完整可用的教学实验平台。"),
  qaHeading("（二）为什么不用现成工业滑台"),
  bodyParagraph("参考回答：工业滑台虽然稳定，但成本较高、结构封闭，而且不利于中学教学场景推广。本项目更强调低成本、可理解、可改造和可展示，适合在学校实验和科技作品中应用。"),
  qaHeading("（三）为什么选择ESP32"),
  bodyParagraph("参考回答：ESP32处理能力更强，GPIO资源更丰富，自带BLE，既能完成电机控制和传感器采集，也能直接进行无线通信，整体集成度更高。"),
  qaHeading("（四）为什么选择步进电机"),
  bodyParagraph("参考回答：步进电机便于精确控制位移和速度，配合驱动器和脉冲控制更适合做实验平台。相比普通直流电机，它更容易实现可重复的控制效果。"),
  qaHeading("（五）为什么要做S曲线加减速"),
  bodyParagraph("参考回答：如果直接从静止跳到目标速度，机械系统容易产生冲击，步进电机也更容易失步和振动。采用S曲线可以让速度变化更平滑，提高运动稳定性。"),
  qaHeading("（六）如何解决振动问题"),
  bodyParagraph("参考回答：我们观察到步进电机在某些速度段容易共振，所以设置了最小起步速度来避开低频共振区，并加入共振补偿和共振扫描模式，用于寻找和优化易振动区间。"),
  qaHeading("（七）为什么力值还要滤波"),
  bodyParagraph("参考回答：HX711的原始数据会受到机械微振动和环境噪声影响，如果不做滤波，数据会比较抖动，不利于教学观察。加入卡尔曼滤波后，力值更平稳，也更适合实时显示。"),
  qaHeading("（八）如果被说成只是电机拉东西"),
  bodyParagraph("参考回答：如果只是电机拉动，那只是一个执行机构；本项目真正的重点是把稳定运动、实时测力、可视化显示和教学应用结合在一起，使它成为一个完整的实验系统，而不仅仅是一个电机装置。"),
  qaHeading("（九）项目最大的困难是什么"),
  bodyParagraph("参考回答：最大的困难不是让系统动起来，而是让它动得平稳、测得稳定、用得方便。因此我们在调试中重点解决了共振、启动冲击、力值波动和交互流程这些问题。"),
  qaHeading("（十）下一步最想做什么"),
  bodyParagraph("参考回答：下一步最想做的是完善机械结构和实验数据管理功能，比如提高机构一致性、增加自动校准、支持实验数据导出，从而进一步提高课堂实用性。"),
];

const doc = new Document({
  creator: "Codex",
  lastModifiedBy: "Codex",
  title: "基于ESP32的智能恒速测力系统——学校科技作品申报书与研究报告正式版",
  subject: "学校科技作品申报书与研究报告",
  description: "用于科技作品申报、研究说明和答辩支撑的正式Word文档，包含封面、摘要、关键词、目录、正文、附件说明和参考资料。",
  keywords: "ESP32,HX711,步进电机,物理实验,科技作品,研究报告,申报书,Word",
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
        run: { font: TITLE_FONT, size: 44, bold: true, color: "000000" },
        paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 400, after: 240 } },
      },
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: HEADING_FONT, size: 32, bold: true, color: "000000" },
        paragraph: {
          spacing: { before: 120, after: 120, line: 560, lineRule: LineRuleType.EXACT },
          outlineLevel: 0,
        },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: SUBHEADING_FONT, size: 32, bold: true, color: "000000" },
        paragraph: {
          spacing: { before: 60, after: 60, line: 560, lineRule: LineRuleType.EXACT },
          outlineLevel: 1,
        },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: BODY_FONT, size: 32, bold: true, color: "000000" },
        paragraph: {
          spacing: { before: 40, after: 40, line: 560, lineRule: LineRuleType.EXACT },
          outlineLevel: 2,
        },
      },
    ],
  },
  sections: [
    {
      properties: {
        titlePage: true,
        page: {
          size: {
            width: 11906,
            height: 16838,
          },
          margin: {
            top: 2200,
            bottom: 2000,
            left: 2000,
            right: 2000,
          },
        },
      },
      headers: {
        first: new Header({ children: [new Paragraph({ children: [] })] }),
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: {
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 6,
                  color: "808080",
                  space: 1,
                },
              },
              children: [
                new TextRun({
                  text: "基于ESP32的智能恒速测力系统  研究报告正式版",
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
                new TextRun({ text: "研究报告正式版", font: BODY_FONT, size: 24 }),
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
