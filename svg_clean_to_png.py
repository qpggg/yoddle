import fitz  # PyMuPDF
import os

src_svg = "logo_clean.svg"
dst_png = "logo_clean.png"
dpi = 300  # высокое разрешение

print("🔄 Конвертирую чистый SVG → PNG...")
print(f"   Исходный файл: {src_svg}")
print(f"   Качество: {dpi} DPI")

try:
    if not os.path.exists(src_svg):
        print(f"❌ Ошибка: файл '{src_svg}' не найден")
        exit(1)
    
    # Открываем SVG
    doc = fitz.open(src_svg)
    page = doc[0]
    
    # Рендерим в PNG с высоким разрешением
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    
    # Рендерим с прозрачным фоном
    pix = page.get_pixmap(matrix=mat, alpha=True)
    
    # Сохраняем PNG
    pix.save(dst_png)
    
    doc.close()
    
    file_size = os.path.getsize(dst_png) / 1024
    
    print(f"\n✅ Конвертация завершена: '{dst_png}'")
    print(f"   Размер: {pix.width} x {pix.height} пикселей")
    print(f"   Файл: {file_size:.1f} KB")
    print(f"   Прозрачный фон: Да")
    print(f"   Без артефактов (векторный источник)")
    
except Exception as e:
    print(f"❌ Ошибка: {e}")



