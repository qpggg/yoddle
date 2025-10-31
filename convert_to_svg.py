import fitz  # PyMuPDF
import os
import re

# Настройки
src = "output_first_page.pdf"  # обрезанный PDF
dst_svg = "logo_left.svg"       # выходной SVG
page_num = 0                    # первая страница

print("🔄 Начинаю конвертацию PDF → SVG...")
print(f"   Исходный файл: {src}")
print(f"   Выходной файл: {dst_svg}")
print(f"   Страница: {page_num}")

try:
    # Проверяем существование файла
    if not os.path.exists(src):
        print(f"❌ Ошибка: файл '{src}' не найден")
        exit(1)
    
    doc = fitz.open(src)
    
    # Проверяем номер страницы
    if page_num < 0 or page_num >= len(doc):
        print(f"❌ Ошибка: страницы {page_num} не существует")
        print(f"   Всего страниц: {len(doc)}")
        doc.close()
        exit(1)
    
    page = doc[page_num]
    
    # Конвертация в SVG с переводом текста в кривые (векторные пути)
    # text_as_path=True - текст становится векторными контурами, шрифты не нужны
    print("   Конвертирую текст в векторные пути...")
    svg = page.get_svg_image(text_as_path=True)
    
    # Удаляем возможный белый фон - все варианты белого цвета
    print("   Удаляю белый фон...")
    svg = svg.replace('fill="white"', 'fill="none"')
    svg = svg.replace('fill="#FFFFFF"', 'fill="none"')
    svg = svg.replace('fill="#ffffff"', 'fill="none"')
    svg = svg.replace('fill="rgb(255,255,255)"', 'fill="none"')
    svg = svg.replace('fill="#FFF"', 'fill="none"')
    svg = svg.replace('fill="#fff"', 'fill="none"')
    
    # Удаляем stroke белого цвета
    svg = svg.replace('stroke="white"', 'stroke="none"')
    svg = svg.replace('stroke="#FFFFFF"', 'stroke="none"')
    svg = svg.replace('stroke="#ffffff"', 'stroke="none"')
    
    # Удаляем прямоугольники с белым фоном через regex (более агрессивно)
    # Удаляем <rect ... fill="white" .../>
    svg = re.sub(r'<rect[^>]*fill="(?:white|#[Ff]{3,6}|rgb\(255,\s*255,\s*255\))"[^>]*/>', '', svg)
    # Удаляем <rect ... fill="white" ...>...</rect>
    svg = re.sub(r'<rect[^>]*fill="(?:white|#[Ff]{3,6}|rgb\(255,\s*255,\s*255\))"[^>]*>.*?</rect>', '', svg, flags=re.DOTALL)
    
    with open(dst_svg, "w", encoding="utf-8") as f:
        f.write(svg)
    
    doc.close()
    
    print(f"\n✅ Конвертация завершена: '{dst_svg}'")
    print(f"   Текст преобразован в векторные контуры")
    print(f"   Белый фон удалён (прозрачный)")
    
except Exception as e:
    print(f"❌ Ошибка при конвертации: {e}")
    exit(1)
