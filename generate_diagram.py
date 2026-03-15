import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Rectangle, Polygon, Arc
import numpy as np

# 设置中文字体和样式
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# 创建图表
fig = plt.figure(figsize=(16, 12))
fig.suptitle('ESP32 步进电机力测量系统 - 结构原理图', fontsize=20, fontweight='bold', y=0.98)

# ===== 图1: 控制系统架构 =====
ax1 = plt.subplot(2, 3, 1)
ax1.set_xlim(0, 10)
ax1.set_ylim(0, 10)
ax1.axis('off')
ax1.set_title('系统控制架构', fontsize=14, fontweight='bold', pad=10)

# ESP32 MCU
mcu_box = FancyBboxPatch((1, 8), 8, 1.2, boxstyle="round,pad=0.1",
                         edgecolor='blue', facecolor='lightblue', linewidth=2)
ax1.add_patch(mcu_box)
ax1.text(5, 8.6, 'ESP32-WROOM-32E MCU', ha='center', va='center', fontsize=11, fontweight='bold')

# GPIO引脚
pins = [
    (2, 6.5, 'STEP\nGPIO 25', 'green'),
    (5, 6.5, 'DIR\nGPIO 26', 'green'),
    (8, 6.5, 'EN\nGPIO 27', 'green'),
]
for x, y, label, color in pins:
    box = FancyBboxPatch((x-0.8, y-0.5), 1.6, 1, boxstyle="round,pad=0.05",
                         edgecolor=color, facecolor='lightgreen', linewidth=1.5)
    ax1.add_patch(box)
    ax1.text(x, y, label, ha='center', va='center', fontsize=9)
    ax1.arrow(5, 8, x-5, y-7.2, head_width=0.15, head_length=0.15, fc='black', ec='black')

# HX711 + 传感器
sensor_box = FancyBboxPatch((3, 4.5), 4, 1, boxstyle="round,pad=0.05",
                           edgecolor='red', facecolor='lightyellow', linewidth=1.5)
ax1.add_patch(sensor_box)
ax1.text(5, 5, 'HX711传感器\nGPIO 16/17', ha='center', va='center', fontsize=10, fontweight='bold')
ax1.arrow(5, 8, 0, -2.3, head_width=0.2, head_length=0.15, fc='red', ec='red')

# DRV8825
drv_box = FancyBboxPatch((1, 2), 3, 1, boxstyle="round,pad=0.05",
                        edgecolor='purple', facecolor='plum', linewidth=1.5)
ax1.add_patch(drv_box)
ax1.text(2.5, 2.5, 'DRV8825\n驱动器', ha='center', va='center', fontsize=10, fontweight='bold')

# 定时器
timer_box = FancyBboxPatch((5.5, 2), 3, 1, boxstyle="round,pad=0.05",
                          edgecolor='orange', facecolor='wheat', linewidth=1.5)
ax1.add_patch(timer_box)
ax1.text(7, 2.5, 'Timer 0\n1MHz中断', ha='center', va='center', fontsize=10, fontweight='bold')

# 连接线
for x in [2, 5, 8]:
    ax1.plot([x, x], [6.5, 6], 'k-', linewidth=1)
    ax1.plot([x, x], [6, 9], 'k-', linewidth=1)

ax1.arrow(2.5, 2.8, 0, -0.6, head_width=0.2, head_length=0.1, fc='black', ec='black')
ax1.arrow(7, 2.8, 0, -0.6, head_width=0.2, head_length=0.1, fc='black', ec='black')

# ===== 图2: 硬件连接拓扑 =====
ax2 = plt.subplot(2, 3, 2)
ax2.set_xlim(0, 10)
ax2.set_ylim(0, 10)
ax2.axis('off')
ax2.set_title('硬件连接拓扑', fontsize=14, fontweight='bold', pad=10)

# 中心MCU
mcu = Circle((5, 5), 0.8, color='lightblue', ec='blue', linewidth=2)
ax2.add_patch(mcu)
ax2.text(5, 5, 'ESP32', ha='center', va='center', fontsize=9, fontweight='bold')

# 周边硬件
hardware = [
    (2, 7.5, 'DRV8825\n驱动', 'purple'),
    (8, 7.5, 'HX711\n传感器', 'red'),
    (2, 2.5, '步进电机\n17HS3401S', 'orange'),
    (8, 2.5, 'Load Cell\n传感头', 'brown'),
]

for x, y, label, color in hardware:
    box = FancyBboxPatch((x-0.9, y-0.5), 1.8, 1, boxstyle="round,pad=0.05",
                        edgecolor=color, facecolor='lightyellow', linewidth=2)
    ax2.add_patch(box)
    ax2.text(x, y, label, ha='center', va='center', fontsize=9, fontweight='bold')

    # 连接线
    angle = np.arctan2(y-5, x-5)
    start_x, start_y = 5 + 0.8*np.cos(angle), 5 + 0.8*np.sin(angle)
    end_x, end_y = x - 0.9*np.cos(angle), y - 0.5*np.sin(angle)
    ax2.plot([start_x, end_x], [start_y, end_y], 'k-', linewidth=2)

# 标注连接
ax2.text(3.5, 6.2, 'STEP/DIR/EN', fontsize=8, rotation=-45)
ax2.text(6.5, 6.2, 'I2C/GPIO', fontsize=8, rotation=45)
ax2.text(3.5, 3.8, 'PWM', fontsize=8, rotation=-45)
ax2.text(6.5, 3.8, 'ADC', fontsize=8, rotation=45)

# ===== 图3: 物理结构（侧视图）=====
ax3 = plt.subplot(2, 3, 3)
ax3.set_xlim(0, 10)
ax3.set_ylim(0, 10)
ax3.axis('off')
ax3.set_title('物理结构布局（侧视图）', fontsize=14, fontweight='bold', pad=10)

# 步进电机
motor_x, motor_y = 2, 7
motor_rect = Rectangle((motor_x-0.6, motor_y-0.5), 1.2, 1,
                       edgecolor='darkgreen', facecolor='lightgreen', linewidth=2)
ax3.add_patch(motor_rect)
ax3.text(motor_x, motor_y, '步进\n电机', ha='center', va='center', fontsize=9, fontweight='bold')

# 线轴/滑轮
spool_x, spool_y = 2, 4.5
circle = Circle((spool_x, spool_y), 0.8, edgecolor='darkred', facecolor='lightyellow', linewidth=2)
ax3.add_patch(circle)
ax3.text(spool_x, spool_y, 'Spool\n7mm', ha='center', va='center', fontsize=8, fontweight='bold')

# 转轴连接
ax3.plot([motor_x, spool_x], [motor_y-0.5, spool_y+0.8], 'k-', linewidth=3)
ax3.text(1.3, 6, '转轴', fontsize=8, style='italic')

# PE线（上升方向）
ax3.plot([spool_x+0.8, 5, 5], [spool_y, spool_y+1.5, 8], 'r-', linewidth=2.5)
ax3.text(5.3, 6, 'PE线\n上升', fontsize=8, color='red', fontweight='bold')

# PE线（下降方向）
ax3.plot([spool_x-0.8, 2, 2], [spool_y, spool_y-1, 2], 'b-', linewidth=2.5)
ax3.text(1.5, 2.5, 'PE线\n下降', fontsize=8, color='blue', fontweight='bold')

# 物体1（被拉动）
obj1 = Rectangle((4.2, 7.2), 1.6, 0.8, edgecolor='red', facecolor='lightcoral', linewidth=2)
ax3.add_patch(obj1)
ax3.text(5, 7.6, '物体1', ha='center', va='center', fontsize=9, fontweight='bold')

# 物体2（下降）
obj2 = Rectangle((1.2, 0.5), 1.6, 0.8, edgecolor='blue', facecolor='lightblue', linewidth=2)
ax3.add_patch(obj2)
ax3.text(2, 0.9, '物体2', ha='center', va='center', fontsize=9, fontweight='bold')

# 地面
ax3.plot([0, 6], [3, 3], 'k-', linewidth=3)
ax3.text(0.3, 2.7, '参考面', fontsize=8)

# HX711 传感器位置
ax3.text(5.5, 7.4, 'HX711→', fontsize=8, color='darkred', fontweight='bold')

# ===== 图4: S曲线加速度规划 =====
ax4 = plt.subplot(2, 3, 4)
ax4.set_title('S曲线加速度规划', fontsize=14, fontweight='bold', pad=10)

# 生成S曲线数据
t = np.linspace(0, 1, 100)
# 9阶多项式平滑：s = t^2 * (3 - 2*t) for smoothstep，这里使用更高阶
s = 3*t**2 - 2*t**3  # smoothstep

# 速度曲线（S曲线）
ax4.plot(t, s, 'r-', linewidth=3, label='S曲线速度')
ax4.fill_between(t, 0, s, alpha=0.3, color='red')

# 加速度曲线（S曲线导数）
a = 6*t - 6*t**2
ax4.plot(t, a, 'b--', linewidth=2, label='加速度')

ax4.set_xlabel('时间 (相对)', fontsize=10)
ax4.set_ylabel('幅度', fontsize=10)
ax4.grid(True, alpha=0.3)
ax4.legend(fontsize=9)
ax4.text(0.5, -0.15, '平滑启动→加速→减速→平滑停止\n无冲击/无抖动',
         ha='center', transform=ax4.transAxes, fontsize=9,
         bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

# ===== 图5: 工作流程图 =====
ax5 = plt.subplot(2, 3, 5)
ax5.set_xlim(0, 10)
ax5.set_ylim(0, 10)
ax5.axis('off')
ax5.set_title('工作流程（从上到下）', fontsize=14, fontweight='bold', pad=10)

steps = [
    (5, 9.2, '用户选择模式\n(速度/距离/往复)', 'lightblue'),
    (5, 7.8, '计算S曲线轨迹', 'lightgreen'),
    (5, 6.4, '定时器启动\n生成步脉冲', 'lightyellow'),
    (5, 5.0, 'DRV8825驱动\n电机转动', 'lightcoral'),
    (5, 3.6, '电机+PE线\n物体移动', 'plum'),
    (5, 2.2, 'HX711读取\n力传感器', 'wheat'),
    (5, 0.8, '显示/BLE输出\n数据结果', 'lightcyan'),
]

for i, (x, y, text, color) in enumerate(steps):
    # 方框
    box = FancyBboxPatch((x-1.8, y-0.35), 3.6, 0.7, boxstyle="round,pad=0.08",
                        edgecolor='black', facecolor=color, linewidth=1.5)
    ax5.add_patch(box)
    ax5.text(x, y, text, ha='center', va='center', fontsize=9, fontweight='bold')

    # 箭头连接
    if i < len(steps) - 1:
        ax5.arrow(x, y-0.4, 0, -0.6, head_width=0.25, head_length=0.2,
                 fc='black', ec='black', linewidth=1.5)

# ===== 图6: 参数表 =====
ax6 = plt.subplot(2, 3, 6)
ax6.axis('off')
ax6.set_title('关键参数配置', fontsize=14, fontweight='bold', pad=10)

params = [
    ('电机类型', '17HS3401S'),
    ('步距角', '1.8° (200步/圈)'),
    ('线轴直径', '7mm'),
    ('微步设置', '1/32 (跳线)'),
    ('最小速度', '5 mm/s'),
    ('定时器', '1MHz'),
    ('传感器', 'HX711'),
    ('滤波方法', '卡尔曼滤波'),
    ('BLE设备名', 'ESP32-Stepper'),
    ('显示屏', 'SSD1306 OLED'),
]

y_pos = 9.5
for label, value in params:
    # 背景
    rect = Rectangle((0.5, y_pos-0.4), 9, 0.8,
                     edgecolor='gray', facecolor='lightyellow', linewidth=0.5)
    ax6.add_patch(rect)

    ax6.text(1, y_pos, label, fontsize=9, fontweight='bold', va='center')
    ax6.text(5.5, y_pos, value, fontsize=9, va='center', color='darkblue')

    y_pos -= 0.9

ax6.set_xlim(0, 10)
ax6.set_ylim(0, 10)

plt.tight_layout()
plt.savefig(r'C:\Users\Prentice\Desktop\ESP32-C3 SuperMini-UPS\system_diagram.png',
            dpi=300, bbox_inches='tight', facecolor='white')
print("System diagram generated: system_diagram.png")

# ===== 创建第二个图：详细的物理结构图 =====
fig2, ax = plt.subplots(figsize=(14, 10))
ax.set_xlim(-1, 12)
ax.set_ylim(-1, 11)
ax.axis('off')
fig2.suptitle('ESP32 步进电机系统 - 详细物理结构图', fontsize=18, fontweight='bold', y=0.98)

# 背景
bg_rect = Rectangle((-0.8, -0.8), 12.8, 11.6, edgecolor='gray',
                    facecolor='#f0f0f0', linewidth=1, alpha=0.3)
ax.add_patch(bg_rect)

# ========== 左侧：步进电机组件 ==========
# 电机外壳
motor_body = Rectangle((0.5, 6), 2.5, 2, edgecolor='darkgreen',
                       facecolor='lightgreen', linewidth=2)
ax.add_patch(motor_body)
ax.text(1.75, 7, '17HS3401S\n步进电机\n200步/圈', ha='center', va='center',
       fontsize=11, fontweight='bold')

# 转轴
ax.plot([1.75, 1.75], [6, 5.5], 'k-', linewidth=4)
ax.plot([1.75, 3.5], [5.5, 5.5], 'k-', linewidth=4)
ax.add_patch(Circle((3.5, 5.5), 0.15, color='black'))

# 线轴/滑轮
spool_outer = Circle((5.5, 5.5), 1.2, edgecolor='darkred',
                     facecolor='lightyellow', linewidth=3)
ax.add_patch(spool_outer)
spool_inner = Circle((5.5, 5.5), 0.8, edgecolor='darkred',
                     facecolor='white', linewidth=2, linestyle='--')
ax.add_patch(spool_inner)
ax.text(5.5, 5.5, '线轴\nSpool\n7mm径', ha='center', va='center',
       fontsize=9, fontweight='bold')

# 轴承
ax.add_patch(Circle((5.5, 5.5), 0.1, color='gray'))

# 转轴连接
ax.plot([3.5, 5.5], [5.5, 5.5], 'k-', linewidth=3)
ax.text(4.5, 5.8, '转轴', fontsize=9, style='italic', fontweight='bold')

# ========== PE线路由 ==========
# PE线上升（右侧）
ax.plot([6.7, 8, 8], [5.5, 5.5, 8.5], 'r-', linewidth=3.5, label='PE线-上升')
ax.arrow(8, 8, 0, 0.8, head_width=0.25, head_length=0.2, fc='red', ec='red', linewidth=2)

# PE线下降（左侧）
ax.plot([4.3, 2.5, 2.5], [5.5, 5.5, 2], 'b-', linewidth=3.5, label='PE线-下降')
ax.arrow(2.5, 2, 0, -0.8, head_width=0.25, head_length=0.2, fc='blue', ec='blue', linewidth=2)

# ========== 力传感器 ==========
sensor_box = FancyBboxPatch((0.2, 2), 2, 1, boxstyle="round,pad=0.1",
                           edgecolor='purple', facecolor='plum', linewidth=2)
ax.add_patch(sensor_box)
ax.text(1.2, 2.5, 'HX711\n力传感器', ha='center', va='center',
       fontsize=10, fontweight='bold')
ax.plot([2.2, 2.5], [2.5, 2.5], 'purple', linewidth=2)

# ========== 物体1（被拉动）==========
obj1_rect = Rectangle((7.2, 8.5), 1.6, 1.2, edgecolor='darkred',
                      facecolor='lightcoral', linewidth=2.5)
ax.add_patch(obj1_rect)
ax.text(8, 9.1, '物体1\n(被拉)', ha='center', va='center',
       fontsize=10, fontweight='bold')

# 传感器连接到物体1
ax.plot([8, 8], [9.7, 9.9], 'purple', linewidth=2)
ax.text(8.3, 9.8, '力→', fontsize=9, color='purple', fontweight='bold')

# ========== 物体2（下降）==========
obj2_rect = Rectangle((1.7, 0.5), 1.6, 1.2, edgecolor='darkblue',
                      facecolor='lightblue', linewidth=2.5)
ax.add_patch(obj2_rect)
ax.text(2.5, 1.1, '物体2\n(下降)', ha='center', va='center',
       fontsize=10, fontweight='bold')

# ========== 控制系统 ==========
ctrl_box = FancyBboxPatch((9.5, 5), 2, 2.5, boxstyle="round,pad=0.1",
                         edgecolor='blue', facecolor='lightblue', linewidth=2)
ax.add_patch(ctrl_box)
ax.text(10.5, 6.5, 'ESP32\nMCU', ha='center', va='center',
       fontsize=11, fontweight='bold')
ax.text(10.5, 5.6, 'Timer\n1MHz', ha='center', va='center',
       fontsize=9, style='italic')

# 控制连接
ax.arrow(10, 5.8, -1.8, 0, head_width=0.2, head_length=0.2,
        fc='green', ec='green', linewidth=2)
ax.text(9.2, 6.1, 'STEP/DIR/EN', fontsize=8, color='green', fontweight='bold')

ax.arrow(9.5, 5.5, -4, 0, head_width=0.2, head_length=0.2,
        fc='purple', ec='purple', linewidth=2)
ax.text(7, 5.8, 'I2C/GPIO', fontsize=8, color='purple', fontweight='bold')

# ========== 显示屏 ==========
display_box = FancyBboxPatch((9.5, 8.5), 2, 1.5, boxstyle="round,pad=0.05",
                            edgecolor='orange', facecolor='wheat', linewidth=2)
ax.add_patch(display_box)
ax.text(10.5, 9.2, 'OLED\n显示屏', ha='center', va='center',
       fontsize=10, fontweight='bold')

# 显示连接
ax.plot([10.5, 10.5], [8.5, 7.5], 'orange', linewidth=2)

# ========== 参考面/地面 ==========
ax.plot([0, 12], [3.5, 3.5], 'k-', linewidth=3)
ax.fill_between([0, 12], 3.5, 3.2, color='gray', alpha=0.5)
ax.text(0.3, 3.2, '参考面', fontsize=9, fontweight='bold')

# ========== 标注说明 ==========
annotations = [
    (5.5, 3.8, '① 电机转轴驱动线轴转动'),
    (8, 7.3, '② PE线缠绕在线轴上'),
    (8, 10.5, '③ PE线拉动物体向上'),
    (2.5, 0.2, '④ PE线释放物体向下'),
    (1.2, 3.5, '⑤ HX711测量拉力'),
    (10.5, 10.5, '⑥ MCU控制整个过程'),
]

for x, y, text in annotations:
    ax.text(x, y, text, fontsize=9,
           bbox=dict(boxstyle='round,pad=0.4', facecolor='lightyellow', alpha=0.8))

# ========== 图例和模式说明 ==========
modes_text = '''
运行模式:
• Continuous: 指定时间内连续运动
• Distance: 运动到指定距离后停止
• Reciprocate: 在距离范围内往复运动
• Phyphox: BLE实时流传输数据
• Resonance: 扫描速度找共振点
'''

ax.text(0.3, 9.5, modes_text, fontsize=8,
       bbox=dict(boxstyle='round,pad=0.5', facecolor='lightcyan', alpha=0.7),
       family='monospace', verticalalignment='top')

plt.tight_layout()
plt.savefig(r'C:\Users\Prentice\Desktop\ESP32-C3 SuperMini-UPS\detailed_structure.png',
            dpi=300, bbox_inches='tight', facecolor='white')
print("Detailed structure diagram generated: detailed_structure.png")

plt.show()
