import fitz  # PyMuPDF
import re

src_pdf = r"C:\Users\user\Downloads\Telegram Desktop\svg.pdf"
cut_x_ratio = 0.677  # обрезать до 67.7%
page_num = 0
dpi = 300

print("🔄 Правильная обрезка PDF → SVG → PNG...")
print(f"   Обрезка: {cut_x_ratio*100}%")

try:
    # Шаг 1: Открываем и обрезаем PDF на уровне документа
    doc = fitz.open(src_pdf)
    page = doc[page_num]
    
    w, h = page.rect.width, page.rect.height
    print(f"   Исходная страница: {w} x {h}")
    
    # Создаем прямоугольник для обрезки
    crop_rect = fitz.Rect(0, 0, w * cut_x_ratio, h)
    
    # Создаем новый PDF с правильно обрезанной страницей
    out_doc = fitz.open()
    out_page = out_doc.new_page(width=crop_rect.width, height=crop_rect.height)
    
    # Копируем содержимое с правильными пропорциями
    out_page.show_pdf_page(out_page.rect, doc, page_num, clip=crop_rect)
    
    # Сохраняем временный обрезанный PDF
    temp_pdf = "temp_cropped.pdf"
    out_doc.save(temp_pdf)
    out_doc.close()
    doc.close()
    
    print(f"   ✓ PDF обрезан: {crop_rect.width} x {crop_rect.height}")
    
    # Шаг 2: Конвертируем обрезанный PDF в SVG
    doc_cropped = fitz.open(temp_pdf)
    page_cropped = doc_cropped[0]
    
    svg = page_cropped.get_svg_image(text_as_path=True)
    
    # Удаляем белый фон из SVG
    print(f"   ✓ Удаляю белый фон из SVG...")
    svg = svg.replace('fill="white"', 'fill="none"')
    svg = svg.replace('fill="#FFFFFF"', 'fill="none"')
    svg = svg.replace('fill="#ffffff"', 'fill="none"')
    svg = svg.replace('fill="rgb(255,255,255)"', 'fill="none"')
    svg = svg.replace('fill="#FFF"', 'fill="none"')
    svg = svg.replace('fill="#fff"', 'fill="none"')
    svg = svg.replace('stroke="white"', 'stroke="none"')
    svg = svg.replace('stroke="#FFFFFF"', 'stroke="none"')
    svg = svg.replace('stroke="#ffffff"', 'stroke="none"')
    
    # Удаляем прямоугольники с белым фоном
    svg = re.sub(r'<rect[^>]*fill="(?:white|#[Ff]{3,6}|rgb\(255,\s*255,\s*255\))"[^>]*/>', '', svg)
    svg = re.sub(r'<rect[^>]*fill="(?:white|#[Ff]{3,6}|rgb\(255,\s*255,\s*255\))"[^>]*>.*?</rect>', '', svg, flags=re.DOTALL)
    
    # Сохраняем SVG
    with open("logo_final.svg", "w", encoding="utf-8") as f:
        f.write(svg)
    
    print(f"   ✓ SVG сохранён: logo_final.svg")
    
    # Шаг 3: Конвертируем в PNG высокого разрешения
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    pix = page_cropped.get_pixmap(matrix=mat, alpha=True)
    
    pix.save("logo_final.png")
    doc_cropped.close()
    
    # Удаляем временный файл
    import os
    os.remove(temp_pdf)
    
    file_size = os.path.getsize("logo_final.png") / 1024
    
    print(f"\n✅ Готово:")
    print(f"   logo_final.svg - векторный (чистый)")
    print(f"   logo_final.png - {pix.width} x {pix.height} пикселей ({file_size:.1f} KB)")
    print(f"   Пропорции сохранены, без искажений")
    
except Exception as e:
    print(f"❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()



