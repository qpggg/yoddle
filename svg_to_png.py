import fitz  # PyMuPDF
import os

# Настройки
src_svg = "logo_left.svg"
dst_png = "logo_left.png"
dpi = 300  # высокое разрешение для качества (300 DPI = стандарт печати)

print("🔄 Начинаю конвертацию SVG → PNG...")
print(f"   Исходный файл: {src_svg}")
print(f"   Выходной файл: {dst_png}")
print(f"   Качество: {dpi} DPI (высокое разрешение)")

try:
    # Проверяем существование файла
    if not os.path.exists(src_svg):
        print(f"❌ Ошибка: файл '{src_svg}' не найден")
        exit(1)
    
    # Открываем SVG как документ
    doc = fitz.open(src_svg)
    page = doc[0]
    
    # Рендерим в PNG с высоким разрешением
    # matrix увеличивает разрешение (dpi/72 = scale factor)
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    
    # Рендерим с прозрачным фоном (alpha=True)
    pix = page.get_pixmap(matrix=mat, alpha=True)
    
    # Сохраняем PNG
    pix.save(dst_png)
    
    doc.close()
    
    # Получаем размер файла
    file_size = os.path.getsize(dst_png) / 1024  # в KB
    
    print(f"\n✅ Конвертация завершена: '{dst_png}'")
    print(f"   Размер изображения: {pix.width} x {pix.height} пикселей")
    print(f"   Размер файла: {file_size:.1f} KB")
    print(f"   Прозрачный фон: Да")
    
except Exception as e:
    print(f"❌ Ошибка при конвертации: {e}")
    exit(1)