const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, VerticalAlign, LevelFormat } = require('docx');

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 22 }
      }
    },
    paragraphStyles: [
      {
        id: "Title",
        name: "Title",
        basedOn: "Normal",
        run: { size: 56, bold: true, color: "1F4E78", font: "Arial" },
        paragraph: { spacing: { before: 240, after: 240 }, alignment: AlignmentType.CENTER }
      },
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, color: "1F4E78", font: "Arial" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 0 }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, color: "2E5C8A", font: "Arial" },
        paragraph: { spacing: { before: 160, after: 100 }, outlineLevel: 1 }
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullet-list",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 720, hanging: 360 }
              }
            }
          }
        ]
      }
    ]
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        // 标题
        new Paragraph({
          heading: HeadingLevel.TITLE,
          children: [new TextRun("精密力学测量系统")]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [new TextRun({ text: "一分钟短视频脚本", italics: true, size: 24 })]
        }),

        // 基本信息
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("基本信息")]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun("总时长：60秒")]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun("字数：约260字")]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun("语速：120字/分钟")]
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun("配乐：稳重科技感背景乐（100 BPM）")]
        }),

        // 第一段
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("第一段：开场吸引 (0-8秒)")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("镜头")]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun("电机运转 + OLED屏幕亮起 + 传感器数据刷新")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("配音")]
        }),
        new Paragraph({
          spacing: { before: 120, after: 200 },
          indent: { left: 360 },
          children: [
            new TextRun({
              text: "这是一个基于",
              italics: false
            }),
            new TextRun({
              text: "ESP32的智能步进电机控制系统",
              bold: true
            }),
            new TextRun({
              text: "。它能精确控制运动，实时测量拉力——专为物理实验而生。",
              italics: false
            })
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("字幕")]
        }),
        new Paragraph({
          spacing: { after: 240 },
          indent: { left: 360 },
          children: [new TextRun("ESP32-HX711 | 物理实验神器")]
        }),

        // 第二段
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("第二段：功能与创新 (8-40秒)")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("镜头")]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun("切换菜单界面、展示运行模式、加速曲线动画")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("配音")]
        }),
        new Paragraph({
          spacing: { before: 120, after: 120 },
          indent: { left: 360 },
          children: [new TextRun("三大核心功能：")]
        }),

        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          spacing: { after: 80 },
          indent: { left: 360 },
          children: [
            new TextRun({
              text: "无抖动S曲线加速",
              bold: true
            }),
            new TextRun({
              text: " — 9阶多项式算法，消除启动抖动，保证测量精度"
            })
          ]
        }),

        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          spacing: { after: 80 },
          indent: { left: 360 },
          children: [
            new TextRun({
              text: "共振自动补偿",
              bold: true
            }),
            new TextRun({
              text: " — 智能穿过电机谐振区，稳定运行"
            })
          ]
        }),

        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          spacing: { after: 200 },
          indent: { left: 360 },
          children: [
            new TextRun({
              text: "实时力值采集",
              bold: true
            }),
            new TextRun({
              text: " — Kalman滤波处理，连接Phyphox无线传输数据到手机"
            })
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("字幕")]
        }),
        new Paragraph({
          spacing: { after: 240 },
          indent: { left: 360 },
          children: [new TextRun("S曲线 | 共振补偿 | 蓝牙采集")]
        }),

        // 第三段
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("第三段：应用场景 (40-55秒)")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("镜头")]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun("学生使用手机观看数据、电机做往复运动")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("配音")]
        }),
        new Paragraph({
          spacing: { before: 120, after: 120 },
          indent: { left: 360 },
          children: [new TextRun("完美适配高中物理实验：")]
        }),

        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          spacing: { after: 80 },
          indent: { left: 360 },
          children: [new TextRun("胡克定律验证")]
        }),

        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          spacing: { after: 80 },
          indent: { left: 360 },
          children: [new TextRun("摩擦力测量")]
        }),

        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          spacing: { after: 200 },
          indent: { left: 360 },
          children: [new TextRun("简谐运动分析")]
        }),

        new Paragraph({
          spacing: { before: 120, after: 200 },
          indent: { left: 360 },
          children: [
            new TextRun("学生用手机即可"),
            new TextRun({
              text: "实时采集专业级实验数据",
              bold: true
            }),
            new TextRun("。")
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("字幕")]
        }),
        new Paragraph({
          spacing: { after: 240 },
          indent: { left: 360 },
          children: [new TextRun("数字化教学 | 教室里的物理实验室")]
        }),

        // 第四段
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("第四段：结尾 (55-60秒)")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("镜头")]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun("完整系统工作+项目信息")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("配音")]
        }),
        new Paragraph({
          spacing: { before: 120, after: 200 },
          indent: { left: 360 },
          children: [
            new TextRun("开源、灵活、专业 — "),
            new TextRun({
              text: "让物理实验不再枯燥。",
              bold: true
            })
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("字幕")]
        }),
        new Paragraph({
          spacing: { after: 360 },
          indent: { left: 360 },
          children: [new TextRun("开源项目 | GitHub：ESP32-HX711")]
        }),

        // 视频素材表
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("视频素材建议")]
        }),

        createMaterialTable(),

        // 配乐建议
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240 },
          children: [new TextRun("配乐建议")]
        }),

        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: "背景音：",
              bold: true
            }),
            new TextRun("现代科技感背景乐（100 BPM）")
          ]
        }),

        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: "过渡音效：",
              bold: true
            }),
            new TextRun("柔和的whoosh效果")
          ]
        }),

        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: "语速：",
              bold: true
            }),
            new TextRun("120字/分钟")
          ]
        })
      ]
    }
  ]
});

function createMaterialTable() {
  const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

  return new Table({
    columnWidths: [2340, 6720],
    margins: { top: 100, bottom: 100, left: 180, right: 180 },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 2340, type: WidthType.DXA },
            shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "时间段", bold: true })]
            })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 6720, type: WidthType.DXA },
            shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "推荐素材", bold: true })]
            })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 2340, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun("0-8s")] })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 6720, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun("产品全景、运行状态LED闪烁")] })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 2340, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun("8-40s")] })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 6720, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun("菜单切换、电机运转、实时数据")] })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 2340, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun("40-55s")] })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 6720, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun("学生使用场景、手机App截图、数据显示")] })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 2340, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun("55-60s")] })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 6720, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun("完整系统工作、系统全景")] })]
          })
        ]
      })
    ]
  });
}

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("精密力学测量系统_视频脚本.docx", buffer);
  console.log("Word文档已创建：精密力学测量系统_视频脚本.docx");
});
