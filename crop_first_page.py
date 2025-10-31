import fitz  # PyMuPDF
import os

# Настройки
src_pdf = r"C:\Users\user\Downloads\Telegram Desktop\svg.pdf"
dst_pdf = "output_first_page.pdf"
page_index = 0  # первая страница (с нуля)
cut_x_ratio = 0.62  # граница: всё слева от 62% ширины

print("🔄 Начинаю обрезку PDF...")
print(f"   Исходный файл: {src_pdf}")
print(f"   Выходной файл: {dst_pdf}")
print(f"   Страница: {page_index}")
print(f"   Сохранить слева от: {cut_x_ratio*100}% ширины")

try:
    # Проверяем существование файла
    if not os.path.exists(src_pdf):
        print(f"❌ Ошибка: файл не найден")
        exit(1)
    
    doc = fitz.open(src_pdf)
    
    # Проверяем номер страницы
    if page_index < 0 or page_index >= len(doc):
        print(f"❌ Ошибка: страницы {page_index} не существует")
        print(f"   Всего страниц: {len(doc)}")
        doc.close()
        exit(1)
    
    page = doc[page_index]
    w, h = page.rect.width, page.rect.height
    
    print(f"   Размер страницы: {w} x {h}")
    
    # Создаем прямоугольник для обрезки (левая часть)
    clip = fitz.Rect(0, 0, w * cut_x_ratio, h)
    
    # Создаем новый PDF с обрезанной страницей
    out = fitz.open()
    outpage = out.new_page(width=clip.width, height=clip.height)
    
    # Вставляем содержимое исходной страницы, обрезая по clip
    outpage.show_pdf_page(outpage.rect, doc, page_index, clip=clip)
    
    out.save(dst_pdf)
    out.close()
    doc.close()
    
    print(f"\n✅ Обрезка завершена: '{dst_pdf}'")
    print(f"   Итоговый размер: {clip.width} x {clip.height}")
    
except Exception as e:
    print(f"❌ Ошибка при обрезке: {e}")
    exit(1)



