import fitz  # PyMuPDF

src_pdf = r"C:\Users\user\Downloads\Telegram Desktop\svg.pdf"

print("🔍 Проверяю оригинальный PDF...")

try:
    doc = fitz.open(src_pdf)
    page = doc[0]
    w, h = page.rect.width, page.rect.height
    
    print(f"\n📄 Информация о странице:")
    print(f"   Размер: {w} x {h}")
    print(f"   Соотношение сторон: {w/h:.2f}")
    
    # Конвертируем оригинал в PNG для сравнения
    print(f"\n🔄 Создаю PNG оригинала для сравнения...")
    
    zoom = 300 / 72
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=True)
    pix.save("original_full.png")
    
    print(f"✅ Сохранено: original_full.png ({pix.width} x {pix.height} пикселей)")
    
    # Также создаем SVG оригинала
    svg = page.get_svg_image(text_as_path=True)
    with open("original_full.svg", "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"✅ Сохранено: original_full.svg")
    
    doc.close()
    
    print(f"\n💡 Сравните:")
    print(f"   original_full.png - оригинал целиком")
    print(f"   logo_left.png - обрезанная версия")
    
except Exception as e:
    print(f"❌ Ошибка: {e}")



