import fitz  # PyMuPDF
from PIL import Image
import numpy as np

src_pdf = r"C:\Users\user\Downloads\Telegram Desktop\svg.pdf"

print("🔍 Анализирую позицию бордового цвета...")

try:
    # Конвертируем PDF в PNG
    doc = fitz.open(src_pdf)
    page = doc[0]
    
    zoom = 2  # достаточно для анализа
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=True)
    pix.save("temp_analyze.png")
    doc.close()
    
    # Загружаем изображение
    img = Image.open("temp_analyze.png")
    img_rgb = img.convert("RGB")
    data = np.array(img_rgb)
    
    width, height = img.size
    print(f"   Размер изображения: {width} x {height}")
    
    # Ищем бордовый/красный цвет
    # Бордовый: высокий R (>100), низкий G и B (<100)
    red_mask = (data[:, :, 0] > 100) & (data[:, :, 1] < 100) & (data[:, :, 2] < 100)
    
    # Проходим по столбцам слева направо
    first_red_x = None
    for x in range(width):
        column = red_mask[:, x]
        if np.any(column):  # если есть хотя бы один бордовый пиксель
            first_red_x = x
            break
    
    if first_red_x:
        percentage = (first_red_x / width) * 100
        print(f"\n✅ Бордовый цвет начинается:")
        print(f"   Пиксель: {first_red_x} из {width}")
        print(f"   Процент: {percentage:.2f}%")
        print(f"\n💡 Для симметричной обрезки используйте: {percentage/100:.3f}")
        
        # Показываем также середину и другие интересные точки
        last_red_x = None
        for x in range(width-1, -1, -1):
            column = red_mask[:, x]
            if np.any(column):
                last_red_x = x
                break
        
        if last_red_x:
            end_percentage = (last_red_x / width) * 100
            print(f"\n📊 Дополнительная информация:")
            print(f"   Бордовый заканчивается: {end_percentage:.2f}%")
            print(f"   Ширина бордовой зоны: {end_percentage - percentage:.2f}%")
    else:
        print("❌ Бордовый цвет не найден")
        print("   Попробую найти красный цвет с другими параметрами...")
        
        # Более мягкий поиск красного
        red_mask2 = (data[:, :, 0] > 80) & (data[:, :, 1] < 80) & (data[:, :, 2] < 80)
        for x in range(width):
            column = red_mask2[:, x]
            if np.any(column):
                first_red_x = x
                break
        
        if first_red_x:
            percentage = (first_red_x / width) * 100
            print(f"\n✅ Красный/бордовый найден (мягкий поиск):")
            print(f"   Процент: {percentage:.2f}%")
            print(f"   Используйте: {percentage/100:.3f}")
    
    # Удаляем временный файл
    import os
    os.remove("temp_analyze.png")
    
except Exception as e:
    print(f"❌ Ошибка: {e}")



