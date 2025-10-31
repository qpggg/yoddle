import matplotlib.pyplot as plt
import numpy as np
import matplotlib.patches as mpatches
from matplotlib.ticker import FuncFormatter

# Настройка стиля графика в стиле Yoddle
plt.style.use('seaborn-v0_8-darkgrid')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['Segoe UI', 'Arial', 'DejaVu Sans']
plt.rcParams['font.size'] = 11
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['axes.titlesize'] = 16
plt.rcParams['xtick.labelsize'] = 10
plt.rcParams['ytick.labelsize'] = 10
plt.rcParams['legend.fontsize'] = 11
plt.rcParams['figure.titlesize'] = 18

# Параметры
months = np.arange(0, 25, 1)  # 0–24 месяца
headcount = 100

# Обновлённые затраты
saas_monthly = 400
benefits_monthly = 7500  # можно варьировать от 5000 до 10000
monthly_cost_per_user = saas_monthly + benefits_monthly
monthly_cost_total = monthly_cost_per_user * headcount

# Экономия от текучести (фиксированная)
savings_turnover_total_year = 1_100_000  # ₽ в год
monthly_turnover_saving = savings_turnover_total_year / 12

# Прирост продуктивности:
# 5% в 1 году, 10% со 2 года
annual_salary = 888_000
productivity_gain_1 = 0.05 * annual_salary * headcount
productivity_gain_2 = 0.10 * annual_salary * headcount
monthly_productivity_1 = productivity_gain_1 / 12
monthly_productivity_2 = productivity_gain_2 / 12

# Подсчёт кумулятивных значений
cumulative_cost = []
cumulative_savings = []
cumulative_net = []

for month in months:
    cost = monthly_cost_total * month
    if month <= 12:
        savings = (monthly_turnover_saving + monthly_productivity_1) * month
    else:
        savings = (monthly_turnover_saving + monthly_productivity_1) * 12 + \
                  (monthly_turnover_saving + monthly_productivity_2) * (month - 12)
    net = savings - cost
    cumulative_cost.append(cost)
    cumulative_savings.append(savings)
    cumulative_net.append(net)

# Находим точку безубыточности
breakeven_month = None
for i, net in enumerate(cumulative_net):
    if net >= 0:
        breakeven_month = i
        break

# Создание графика
fig, ax = plt.subplots(figsize=(14, 8), facecolor='white')
ax.set_facecolor('#f8f9fa')

# Цветовая палитра Yoddle (современные, яркие цвета)
color_cost = '#EF4444'      # Красный (затраты)
color_savings = '#10B981'   # Зеленый (выгоды)
color_net = '#3B82F6'       # Синий (чистая прибыль)
color_grid = '#E5E7EB'      # Светло-серый для сетки

# Заливка областей
ax.fill_between(months, 0, cumulative_cost, alpha=0.1, color=color_cost, label='_nolegend_')
ax.fill_between(months, 0, cumulative_savings, alpha=0.1, color=color_savings, label='_nolegend_')

# Основные линии графика с увеличенной толщиной
line_cost = ax.plot(months, cumulative_cost, label="💸 Накопленные затраты", 
                     linestyle="--", color=color_cost, linewidth=3, marker='o', 
                     markersize=4, markevery=3, alpha=0.9)
line_savings = ax.plot(months, cumulative_savings, label="💰 Накопленные выгоды", 
                       linestyle="--", color=color_savings, linewidth=3, marker='s', 
                       markersize=4, markevery=3, alpha=0.9)
line_net = ax.plot(months, cumulative_net, label="📈 Чистая прибыль (ROI)", 
                   linewidth=4, color=color_net, marker='D', 
                   markersize=5, markevery=3, alpha=0.95, zorder=5)

# Линия нуля
ax.axhline(0, color='#6B7280', linestyle=':', linewidth=2, alpha=0.7)

# Точка безубыточности
if breakeven_month is not None:
    breakeven_value = cumulative_net[breakeven_month]
    ax.plot(breakeven_month, breakeven_value, 'o', color='#F59E0B', 
            markersize=15, zorder=10, markeredgewidth=2, markeredgecolor='white')
    
    # Аннотация точки безубыточности
    ax.annotate(f'🎯 Точка безубыточности\n{breakeven_month} месяц',
                xy=(breakeven_month, breakeven_value),
                xytext=(breakeven_month + 3, breakeven_value + 500000),
                fontsize=12, fontweight='bold',
                bbox=dict(boxstyle='round,pad=0.8', facecolor='#FEF3C7', 
                         edgecolor='#F59E0B', linewidth=2, alpha=0.9),
                arrowprops=dict(arrowstyle='->', connectionstyle='arc3,rad=0.3',
                              color='#F59E0B', lw=2))

# Форматирование оси Y (рубли)
def millions_formatter(x, pos):
    """Форматирование чисел в миллионы рублей"""
    return f'{x/1_000_000:.1f}M ₽'

ax.yaxis.set_major_formatter(FuncFormatter(millions_formatter))

# Настройка сетки
ax.grid(True, alpha=0.3, linestyle='-', linewidth=0.8, color=color_grid)
ax.set_axisbelow(True)

# Заголовки и подписи
ax.set_title('График безубыточности Yoddle 🚀\n100 сотрудников • Подписка + Льготы', 
             fontsize=18, fontweight='bold', pad=20, color='#1F2937')
ax.set_xlabel('Месяцы использования платформы', fontsize=13, fontweight='600', color='#374151')
ax.set_ylabel('Накопленная сумма (₽)', fontsize=13, fontweight='600', color='#374151')

# Легенда с улучшенным стилем
legend = ax.legend(loc='upper left', frameon=True, fancybox=True, 
                   shadow=True, framealpha=0.95, edgecolor='#D1D5DB', 
                   facecolor='white', fontsize=11)
legend.get_frame().set_linewidth(1.5)

# Добавление информационного блока
info_text = f"""📊 Ключевые параметры:
• Сотрудники: {headcount} чел.
• Стоимость: {monthly_cost_per_user:,} ₽/мес/чел
• Экономия (текучесть): {savings_turnover_total_year:,} ₽/год
• Прирост продуктивности: 5% → 10%
• Точка безубыточности: {breakeven_month if breakeven_month else 'Не достигнута'} мес."""

# Размещение информационного блока
ax.text(0.98, 0.02, info_text, transform=ax.transAxes,
        fontsize=10, verticalalignment='bottom', horizontalalignment='right',
        bbox=dict(boxstyle='round,pad=1', facecolor='white', 
                 edgecolor='#D1D5DB', linewidth=1.5, alpha=0.95),
        family='monospace')

# Добавление финальных значений на конец графика
final_month = months[-1]
final_cost = cumulative_cost[-1]
final_savings = cumulative_savings[-1]
final_net = cumulative_net[-1]

# Аннотации для финальных значений
ax.text(final_month + 0.3, final_cost, f'{final_cost/1_000_000:.1f}M ₽',
        fontsize=10, fontweight='bold', color=color_cost, 
        verticalalignment='center', bbox=dict(boxstyle='round,pad=0.3', 
        facecolor='white', edgecolor=color_cost, alpha=0.8))

ax.text(final_month + 0.3, final_savings, f'{final_savings/1_000_000:.1f}M ₽',
        fontsize=10, fontweight='bold', color=color_savings, 
        verticalalignment='center', bbox=dict(boxstyle='round,pad=0.3', 
        facecolor='white', edgecolor=color_savings, alpha=0.8))

ax.text(final_month + 0.3, final_net, f'{final_net/1_000_000:.1f}M ₽',
        fontsize=10, fontweight='bold', color=color_net, 
        verticalalignment='center', bbox=dict(boxstyle='round,pad=0.3', 
        facecolor='white', edgecolor=color_net, alpha=0.8))

# Установка пределов осей
ax.set_xlim(-0.5, final_month + 2)
y_min = min(min(cumulative_net), 0) * 1.15
y_max = max(max(cumulative_savings), max(cumulative_cost)) * 1.1
ax.set_ylim(y_min, y_max)

# Добавление водяного знака Yoddle
fig.text(0.99, 0.01, 'Yoddle HR-Tech Platform', 
         fontsize=9, color='#9CA3AF', ha='right', va='bottom',
         style='italic', alpha=0.6)

plt.tight_layout()

# Сохранение графика
plt.savefig('yoddle_breakeven_analysis.png', dpi=300, bbox_inches='tight', 
            facecolor='white', edgecolor='none')
print("✅ График сохранен как 'yoddle_breakeven_analysis.png'")

# Вывод ключевых метрик
print("\n📊 КЛЮЧЕВЫЕ МЕТРИКИ:")
print(f"💰 Точка безубыточности: {breakeven_month if breakeven_month else 'Не достигнута'} месяцев")
print(f"💸 Общие затраты за 24 мес: {final_cost:,.0f} ₽")
print(f"💵 Общие выгоды за 24 мес: {final_savings:,.0f} ₽")
print(f"📈 Чистая прибыль за 24 мес: {final_net:,.0f} ₽")
print(f"📊 ROI за 24 месяца: {(final_net/final_cost)*100:.1f}%")

plt.show()





