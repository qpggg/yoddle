import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Настройка шрифтов для кириллицы
plt.rcParams['font.family'] = ['DejaVu Sans', 'Verdana', 'Tahoma']
plt.rcParams['axes.unicode_minus'] = False

# ИНВЕСТИЦИОННАЯ версия данных (оптимистично, но реалистично)
years = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030]

# Данные с умеренным оптимизмом для инвесторов
data = {
    'Гибкие льготы': [2, 4, 7, 11, 16, 22, 28, 35],             # Наш основной рынок
    'Автоматизация HR': [5, 8, 12, 18, 25, 32, 38, 45],         # Excel → облачные решения
    'Удаленная работа': [42, 48, 54, 60, 66, 71, 75, 78],       # COVID ускорил тренд
    'Обучение персонала': [8, 12, 17, 24, 32, 40, 47, 54],      # Конкуренция за таланты
    'Wellness программы': [1, 2, 4, 7, 11, 16, 22, 28]          # Медленный, но растущий
}

# Создание DataFrame
df = pd.DataFrame(data)
df.index = years

# Создание графика оптимального размера
fig, ax = plt.subplots(figsize=(16, 11))

# Профессиональная цветовая палитра
colors = ['#E74C3C', '#27AE60', '#3498DB', '#F39C12', '#9B59B6']

# Построение линий с процентными значениями без наложений
offset_shifts = [20, 15, 10, 25, 5]  # Разные смещения для каждой линии

for i, (trend, color) in enumerate(zip(df.columns, colors)):
    line = ax.plot(years, df[trend], marker='o', linewidth=3, markersize=10, 
                   color=color, label=trend, alpha=0.9, markerfacecolor='white',
                   markeredgewidth=2, markeredgecolor=color)
    
    # Добавление процентных значений с умным смещением
    for year, value in zip(years, df[trend]):
        y_offset = offset_shifts[i]
        ax.annotate(f'{value}%', (year, value), textcoords="offset points", 
                   xytext=(0, y_offset), ha='center', fontsize=8, fontweight='bold',
                   color=color, bbox=dict(boxstyle="round,pad=0.15", 
                   facecolor='white', edgecolor=color, alpha=0.9))

# Настройка осей
ax.set_xlabel('Год', fontsize=15, fontweight='bold')
ax.set_ylabel('Процент внедрения в SMB (%)', fontsize=15, fontweight='bold')
ax.set_title('HR-тренды в российском SMB: возможности для роста\n(Инвестиционный анализ Yoddle)', 
             fontsize=18, fontweight='bold', pad=25)

# Улучшенная сетка
ax.grid(True, alpha=0.3, linestyle='--', linewidth=0.8)
ax.set_xlim(2022.7, 2030.3)
ax.set_ylim(-2, 88)

# Легенда
legend = ax.legend(loc='upper left', fontsize=13, framealpha=0.95, 
                  fancybox=True, shadow=True)
legend.get_frame().set_facecolor('#F8F9FA')
legend.get_frame().set_edgecolor('#34495E')

# Ключевые аннотации для инвесторов
ax.annotate('Yoddle запуск Q4 2025\nОптимальный момент входа\n(7% проникновение рынка)', 
            xy=(2025.75, 7), xytext=(2025.5, 35),
            arrowprops=dict(arrowstyle='->', color='#E74C3C', lw=2),
            fontsize=11, ha='left', fontweight='bold',
            bbox=dict(boxstyle="round,pad=0.4", facecolor='#FADBD8', 
                     edgecolor='#E74C3C', alpha=0.9))

ax.annotate('2027-2030:\nБум роста рынка\n35% проникновение', 
            xy=(2029, 35), xytext=(2027, 55),
            arrowprops=dict(arrowstyle='->', color='#27AE60', lw=2),
            fontsize=11, ha='center', fontweight='bold',
            bbox=dict(boxstyle="round,pad=0.4", facecolor='#D5F4E6', 
                     edgecolor='#27AE60', alpha=0.9))

ax.annotate('Удаленка создаёт\nспрос на цифровые\nHR-решения', 
            xy=(2026, 60), xytext=(2024.5, 70),
            arrowprops=dict(arrowstyle='->', color='#3498DB', lw=2),
            fontsize=11, ha='center', fontweight='bold',
            bbox=dict(boxstyle="round,pad=0.4", facecolor='#D6EAF8', 
                     edgecolor='#3498DB', alpha=0.9))

# 3 блока преимуществ Yoddle в ряд
tech_advantages = """
⚡ ТЕХНОЛОГИИ
• Готовая платформа с 
  геймификацией (XP, ранги)
• AI-рекомендации льгот
  на основе тестирования
• Система активности и
  достижений
• Мобильное приложение
• API для интеграций
"""

business_advantages = """
💰 БИЗНЕС-МОДЕЛЬ
• 9,500₽ за сотрудника/мес
• 2 премиум льготы включены
• Отдел 30 чел = 285,000₽/мес
• Быстрое внедрение за 15 мин
• "Льготы без бюрократии"
• Старт Q4 2025
"""

market_advantages = """
🚀 МАРКЕТ ТАЙМИНГ
• First-mover: 2% проникновение
• Растущий рынок +25% CAGR
• Низкая конкуренция в SMB
• COVID ускорил диджитализацию
• Дефицит кадров → спрос на льготы
• Потенциал экспансии в СНГ
"""

# Размещение 3 блоков в ряд (поднимаем выше)
ax.text(0.02, -0.22, tech_advantages, transform=ax.transAxes, fontsize=9,
        verticalalignment='top', horizontalalignment='left',
        bbox=dict(boxstyle="round,pad=0.5", facecolor='#E3F2FD', 
                 edgecolor='#2196F3', alpha=0.95, linewidth=1.5))

ax.text(0.35, -0.22, business_advantages, transform=ax.transAxes, fontsize=9,
        verticalalignment='top', horizontalalignment='left',
        bbox=dict(boxstyle="round,pad=0.5", facecolor='#FFF3E0', 
                 edgecolor='#FF9800', alpha=0.95, linewidth=1.5))

ax.text(0.68, -0.22, market_advantages, transform=ax.transAxes, fontsize=9,
        verticalalignment='top', horizontalalignment='left',
        bbox=dict(boxstyle="round,pad=0.5", facecolor='#E8F5E8', 
                 edgecolor='#4CAF50', alpha=0.95, linewidth=1.5))

# Устанавливаем отступ снизу для видимости блоков
plt.subplots_adjust(bottom=0.25)

plt.tight_layout()
plt.show()

# Ожидание закрытия пользователем
input("\n👆 График открыт! Закройте окно графика и нажмите Enter для продолжения...")

# Инвестиционный анализ
print("\n" + "="*80)
print("🚀 YODDLE: ИНВЕСТИЦИОННЫЕ ВОЗМОЖНОСТИ В HR-TECH SMB")
print("="*80)

print(f"\n💼 РЫНОЧНАЯ СИТУАЦИЯ:")
for year in [2024, 2027, 2030]:
    benefits_penetration = df.loc[year, 'Гибкие льготы']
    market_size = 6000000 * benefits_penetration / 100
    print(f"   {year}: {benefits_penetration}% проникновение = {market_size/1000:.0f}К потенциальных клиентов")

print(f"\n📊 НОВАЯ БИЗНЕС-МОДЕЛЬ YODDLE (ПРЕМИУМ СЕГМЕНТ):")
print("🎯 ЦЕНООБРАЗОВАНИЕ:")
print("   • 9,500₽ за сотрудника в месяц")
print("   • 2 премиум льготы включены в стоимость")
print("   • Отдел 30 человек = 285,000₽/мес")
print("   • Фокус на премиум SMB с высокой маржой")
print("   • Старт продаж: Q4 2025")

print(f"\n💰 ФИНАНСОВЫЕ ПРОГНОЗЫ (ПРЕМИУМ МОДЕЛЬ):")
# Меньше клиентов, но намного больше ARPU
conservative_clients = [0, 0, 5, 15, 35, 70, 120, 200]  # Старт с Q4 2025
# Средний размер отдела 25 человек * 9,500₽ = 237,500₽/мес
avg_revenue = [0, 0, 240000, 235000, 230000, 225000, 220000, 215000]  # Премиум цены

for i, year in enumerate(years):
    clients = conservative_clients[i]
    revenue = clients * avg_revenue[i] * 12 / 1000000  # В млн рублей
    print(f"   {year}: {clients:,} клиентов • {revenue:.1f}М₽ ARR")

print(f"\n🎪 КЛЮЧЕВЫЕ МЕТРИКИ К 2030 (ПРЕМИУМ СЕГМЕНТ):")
final_clients = conservative_clients[-1]
final_arr = final_clients * avg_revenue[-1] * 12 / 1000000
market_share = (final_clients / (6000000 * 35 / 100)) * 100

print(f"   • ARR: {final_arr:.0f}М₽")
print(f"   • Премиум клиентов: {final_clients:,}")
print(f"   • Средний ARPU: {avg_revenue[-1]*12/1000000:.1f}М₽/год на клиента")
print(f"   • Фокус на качество, не количество")
print(f"   • Высокая маржа и LTV")

print(f"\n🚀 INVESTMENT HIGHLIGHTS (ПРЕМИУМ СТРАТЕГИЯ):")
print("   • 📈 Растущий рынок: +25% CAGR гибких льгот")
print("   • 💎 Премиум позиционирование: 9,500₽ за сотрудника")
print("   • ⚡ Готовая платформа с геймификацией и AI-рекомендациями")
print("   • 🎯 Высокий ARPU: 2.6М₽/год на клиента")
print("   • 💰 Быстрый путь к прибыльности за счет высокой маржи")
print("   • 🌍 Премиум сегмент менее чувствителен к кризисам")
print("   • 📊 Меньше клиентов = меньше затрат на поддержку")

print(f"\n🎯 СТРАТЕГИЯ ПРИВЛЕЧЕНИЯ ИНВЕСТИЦИЙ (ПРЕМИУМ МОДЕЛЬ):")
print("   • Seed: 15-30М₽ для команды и запуска Q4 2025")
print("   • Series A: 50-80М₽ для премиум маркетинга и продаж")
print("   • Series B: 100-150М₽ для экспансии в СНГ")
print("   • Фокус на high-touch продажи и premium experience")
print("   • KPIs: ARPU, LTV, премиум churn, premium NPS, маржа") 