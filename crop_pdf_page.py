import fitz  # PyMuPDF
import sys
import os

def crop_pdf_page(src_pdf, dst_pdf, page_index=0, cut_x_ratio=0.62):
    """
    Обрезает страницу PDF
    
    Args:
        src_pdf: путь к исходному PDF файлу
        dst_pdf: путь к выходному PDF файлу
        page_index: номер страницы (с 0)
        cut_x_ratio: граница по ширине (0-1, где 1 = 100% ширины)
    
    Returns:
        True если успешно, False если ошибка
    """
    try:
        # Проверяем существование файла
        if not os.path.exists(src_pdf):
            print(f"❌ Ошибка: файл '{src_pdf}' не найден")
            return False
        
        doc = fitz.open(src_pdf)
        
        # Проверяем номер страницы
        if page_index < 0 or page_index >= len(doc):
            print(f"❌ Ошибка: страницы с индексом {page_index} не существует")
            print(f"   Доступные страницы: 0-{len(doc)-1}")
            doc.close()
            return False
        
        page = doc[page_index]
        w, h = page.rect.width, page.rect.height
        
        # Создаем прямоугольник для обрезки (левая часть)
        clip = fitz.Rect(0, 0, w * cut_x_ratio, h)
        
        # Создаем новый PDF с обрезанной страницей
        out = fitz.open()
        outpage = out.new_page(width=clip.width, height=clip.height)
        
        # Вставляем содержимое, сохраняя векторную графику
        outpage.show_pdf_page(outpage.rect, doc, page_index, clip=clip)
        
        out.save(dst_pdf)
        out.close()
        doc.close()
        
        print(f"✅ Обрезка завершена: '{dst_pdf}'")
        print(f"   Размер страницы: {w} x {h} → {clip.width} x {clip.height}")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при обрезке: {e}")
        return False


if __name__ == "__main__":
    # Пример использования
    src_pdf = "input.pdf"
    dst_pdf = "output_left.pdf"
    page_index = 0  # номер страницы, с 0
    cut_x_ratio = 0.62  # граница по ширине: всё слева от 62% страницы
    
    print("🔄 Начинаю обрезку PDF...")
    print(f"   Исходный файл: {src_pdf}")
    print(f"   Выходной файл: {dst_pdf}")
    print(f"   Страница: {page_index}")
    print(f"   Сохранить слева от: {cut_x_ratio*100}% ширины")
    
    crop_pdf_page(src_pdf, dst_pdf, page_index, cut_x_ratio)



