import fitz  # PyMuPDF
import os

def pdf_to_svg(src_pdf, dst_svg="logo_left.svg", page_num=0, remove_white_bg=True):
    """
    Конвертирует страницу PDF в SVG с переводом текста в векторные контуры
    
    Args:
        src_pdf: путь к PDF файлу
        dst_svg: путь к выходному SVG файлу
        page_num: номер страницы (с 0)
        remove_white_bg: удалять ли белый фон
    
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
        if page_num < 0 or page_num >= len(doc):
            print(f"❌ Ошибка: страницы с индексом {page_num} не существует")
            print(f"   Доступные страницы: 0-{len(doc)-1}")
            doc.close()
            return False
        
        page = doc[page_num]
        
        # Конвертация в SVG с переводом текста в кривые (векторные пути)
        # text_as_path=True - это КЛЮЧЕВОЙ параметр!
        # Он превращает текст в векторные контуры вместо текстовых объектов
        svg = page.get_svg_image(text_as_path=True)
        
        # Удаляем возможный белый фон (прямоугольник <rect ... fill="white">)
        if remove_white_bg:
            svg = svg.replace('fill="white"', 'fill="none"')
        
        with open(dst_svg, "w", encoding="utf-8") as f:
            f.write(svg)
        
        doc.close()
        print(f"✅ Конвертация завершена: '{dst_svg}'")
        print(f"   Страница: {page_num}")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при конвертации: {e}")
        return False


if __name__ == "__main__":
    # Пример использования
    src = "input_left.pdf"  # обрезанный PDF
    page_num = 0            # если нужна 1-я страница
    
    print("🔄 Начинаю конвертацию PDF → SVG...")
    print(f"   Исходный файл: {src}")
    print(f"   Выходной файл: logo_left.svg")
    print(f"   Страница: {page_num}")
    
    pdf_to_svg(src, "logo_left.svg", page_num)



