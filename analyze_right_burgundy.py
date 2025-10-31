import fitz  # PyMuPDF
from PIL import Image
import numpy as np

src_pdf = r"C:\Users\user\Downloads\Telegram Desktop\svg.pdf"

print("🔍 Анализирую правую бордовую часть...")

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
    
    # Начинаем поиск с 66% ширины
    start_search = int(width * 0.66)
    print(f"   Начинаю поиск с {start_search} пикселя (66%)")
    
    # Проходим по столбцам слева направо, начиная с 66%
    first_red_x = None
    for x in range(start_search, width):
        column = red_mask[:, x]
        if np.any(column):  # если есть хотя бы один бордовый пиксель
            first_red_x = x
            break
    
    if first_red_x:
        percentage_start = (first_red_x / width) * 100
        
        # Ищем где заканчивается бордовый
        last_red_x = None
        for x in range(width-1, first_red_x-1, -1):
            column = red_mask[:, x]
            if np.any(column):
                last_red_x = x
                break
        
        if last_red_x:
            percentage_end = (last_red_x / width) * 100
            burgundy_width = percentage_end - percentage_start
            
            print(f"\n✅ Правая бордовая часть:")
            print(f"   Начинается: {percentage_start:.2f}%")
            print(f"   Заканчивается: {percentage_end:.2f}%")
            print(f"   Ширина: {burgundy_width:.2f}%")
            print(f"\n💡 Для обрезки до начала правой бордовой части:")
            print(f"   Используйте: {percentage_start/100:.3f}")
            print(f"\n📐 Симметричная обрезка:")
            print(f"   Если правая часть {burgundy_width:.2f}%, то симметрично слева тоже {burgundy_width:.2f}%")
            print(f"   Обрезать от {burgundy_width:.2f}% до {percentage_start:.2f}% = {percentage_start - burgundy_width:.2f}% до {percentage_start:.2f}%")
    else:
        print("❌ Бордовый цвет не найден в правой части")
    
    # Удаляем временный файл
    import os
    os.remove("temp_analyze.png")
    
except Exception as e:
    print(f"❌ Ошибка: {e}")



