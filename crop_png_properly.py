import fitz  # PyMuPDF
from PIL import Image
import numpy as np

src_pdf = r"C:\Users\user\Downloads\Telegram Desktop\svg.pdf"
page_num = 0
cut_x_ratio = 0.677  # обрезать левую часть (0-67.7% ширины, до начала правой бордовой части)
dpi = 300

print("🔄 Альтернативный метод обрезки...")
print("   1. Конвертирую PDF в PNG высокого разрешения")
print("   2. Обрезаю PNG пиксель в пиксель (без искажений)")
print(f"   3. Удаляю белый фон (обрезка: {cut_x_ratio*100}%)")

try:
    # Шаг 1: Конвертируем весь PDF в PNG
    doc = fitz.open(src_pdf)
    page = doc[0]
    
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=True)
    
    # Временно сохраняем полный PNG
    temp_png = "temp_full.png"
    pix.save(temp_png)
    doc.close()
    
    print(f"   ✓ Исходное изображение: {pix.width} x {pix.height}")
    
    # Шаг 2: Обрезаем PNG с помощью Pillow (без искажений)
    img = Image.open(temp_png)
    width, height = img.size
    
    # Вычисляем координаты обрезки (левая часть)
    crop_width = int(width * cut_x_ratio)
    cropped = img.crop((0, 0, crop_width, height))
    
    # Шаг 3: Удаляем белый фон (очень агрессивное удаление светлых оттенков)
    print(f"   ✓ Удаляю белый фон и артефакты (агрессивный режим)...")
    cropped = cropped.convert("RGBA")
    data = np.array(cropped).astype(float)
    
    # Очень агрессивный порог для светлых пикселей
    # Удаляем все пиксели где R, G, B > 180 (захватываем больше артефактов)
    light_mask = (data[:, :, 0] > 180) & (data[:, :, 1] > 180) & (data[:, :, 2] > 180)
    data[light_mask] = [255, 255, 255, 0]
    
    # Для средних тонов (120-180): делаем полностью прозрачными если они близки к белому
    medium_light = (data[:, :, 0] > 120) & (data[:, :, 1] > 120) & (data[:, :, 2] > 120) & (data[:, :, 3] > 0)
    # Вычисляем средний цвет для этих пикселей
    avg_color = (data[medium_light, 0] + data[medium_light, 1] + data[medium_light, 2]) / 3
    # Если цвет близок к серому/белому (мало отклонений), делаем прозрачным
    color_variance = np.abs(data[medium_light, 0] - avg_color) + np.abs(data[medium_light, 1] - avg_color) + np.abs(data[medium_light, 2] - avg_color)
    # Малая вариация цвета = артефакт (не яркие цвета)
    is_grayish = color_variance < 30
    
    # Создаем копию маски для средних тонов
    medium_light_coords = np.where(medium_light)
    grayish_pixels = np.zeros(data.shape[:2], dtype=bool)
    grayish_coords = (medium_light_coords[0][is_grayish], medium_light_coords[1][is_grayish])
    grayish_pixels[grayish_coords] = True
    
    # Делаем сероватые пиксели прозрачными
    data[grayish_pixels] = [255, 255, 255, 0]
    
    cropped = Image.fromarray(data.astype(np.uint8))
    
    # Сохраняем обрезанный PNG
    output_png = "logo_left_fixed.png"
    cropped.save(output_png, "PNG")
    
    print(f"   ✓ Обрезанное изображение: {crop_width} x {height}")
    print(f"\n✅ Готово: {output_png}")
    print(f"   Пропорции сохранены, искажений нет")
    print(f"   Белый фон удалён (прозрачный)")
    
    # Удаляем временный файл
    import os
    os.remove(temp_png)
    
except Exception as e:
    print(f"❌ Ошибка: {e}")
