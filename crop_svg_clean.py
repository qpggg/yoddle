import fitz  # PyMuPDF
import re

src_pdf = r"C:\Users\user\Downloads\Telegram Desktop\svg.pdf"
cut_x_ratio = 0.677  # обрезать до 67.7%
page_num = 0

print("🔄 Создаю чистый SVG без артефактов...")
print(f"   Обрезка: {cut_x_ratio*100}%")

try:
    # Открываем PDF
    doc = fitz.open(src_pdf)
    page = doc[page_num]
    
    w, h = page.rect.width, page.rect.height
    print(f"   Размер страницы: {w} x {h}")
    
    # Конвертируем в SVG с текстом в пути (векторные контуры)
    svg = page.get_svg_image(text_as_path=True)
    
    doc.close()
    
    # Извлекаем ширину и высоту из SVG
    width_match = re.search(r'width="([\d.]+)"', svg)
    height_match = re.search(r'height="([\d.]+)"', svg)
    
    if width_match and height_match:
        svg_width = float(width_match.group(1))
        svg_height = float(height_match.group(1))
        new_width = svg_width * cut_x_ratio
        
        print(f"   SVG размер: {svg_width} x {svg_height}")
        print(f"   Новая ширина: {new_width}")
        
        # Обновляем размеры SVG
        svg = re.sub(r'width="[\d.]+"', f'width="{new_width}"', svg)
        
        # Добавляем viewBox для обрезки
        viewbox = f'viewBox="0 0 {new_width} {svg_height}"'
        svg = re.sub(r'<svg ', f'<svg {viewbox} ', svg)
        
        # Удаляем белый фон - все варианты
        print(f"   ✓ Удаляю белый фон...")
        svg = svg.replace('fill="white"', 'fill="none"')
        svg = svg.replace('fill="#FFFFFF"', 'fill="none"')
        svg = svg.replace('fill="#ffffff"', 'fill="none"')
        svg = svg.replace('fill="rgb(255,255,255)"', 'fill="none"')
        svg = svg.replace('fill="#FFF"', 'fill="none"')
        svg = svg.replace('fill="#fff"', 'fill="none"')
        
        # Удаляем белые stroke
        svg = svg.replace('stroke="white"', 'stroke="none"')
        svg = svg.replace('stroke="#FFFFFF"', 'stroke="none"')
        svg = svg.replace('stroke="#ffffff"', 'stroke="none"')
        
        # Удаляем прямоугольники с белым фоном
        svg = re.sub(r'<rect[^>]*fill="(?:white|#[Ff]{3,6}|rgb\(255,\s*255,\s*255\))"[^>]*/>', '', svg)
        svg = re.sub(r'<rect[^>]*fill="(?:white|#[Ff]{3,6}|rgb\(255,\s*255,\s*255\))"[^>]*>.*?</rect>', '', svg, flags=re.DOTALL)
        
        # Сохраняем чистый SVG
        with open("logo_clean.svg", "w", encoding="utf-8") as f:
            f.write(svg)
        
        print(f"\n✅ Готово: logo_clean.svg")
        print(f"   Векторный формат, без артефактов")
        print(f"   Размер: {new_width} x {svg_height}")
        
except Exception as e:
    print(f"❌ Ошибка: {e}")



