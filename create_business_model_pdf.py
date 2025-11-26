#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для создания PDF файла с описанием бизнес-модели Yoddle
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
import os
import platform

# Регистрация шрифта с поддержкой кириллицы
def register_cyrillic_font():
    """Регистрирует системный шрифт с поддержкой кириллицы"""
    system = platform.system()
    
    # Пробуем различные варианты шрифтов
    font_paths = []
    
    if system == "Windows":
        font_paths = [
            r"C:\Windows\Fonts\arial.ttf",  # Arial
            r"C:\Windows\Fonts\times.ttf",  # Times New Roman
            r"C:\Windows\Fonts\arialbd.ttf",  # Arial Bold
        ]
    elif system == "Linux":
        font_paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        ]
    elif system == "Darwin":  # macOS
        font_paths = [
            "/System/Library/Fonts/Helvetica.ttc",
            "/Library/Fonts/Arial.ttf",
        ]
    
    # Регистрируем обычный и жирный варианты
    for font_path in font_paths:
        if os.path.exists(font_path):
            try:
                # Регистрируем обычный шрифт
                pdfmetrics.registerFont(TTFont('CyrillicFont', font_path))
                # Для жирного - пробуем найти bold версию
                base_dir = os.path.dirname(font_path)
                base_name = os.path.basename(font_path)
                bold_path = os.path.join(base_dir, base_name.replace('.ttf', 'bd.ttf'))
                if os.path.exists(bold_path):
                    pdfmetrics.registerFont(TTFont('CyrillicFont-Bold', bold_path))
                else:
                    # Используем тот же шрифт для bold
                    pdfmetrics.registerFont(TTFont('CyrillicFont-Bold', font_path))
                
                print(f"✅ Используется шрифт: {font_path}")
                return 'CyrillicFont', 'CyrillicFont-Bold'
            except Exception as e:
                print(f"⚠️ Не удалось загрузить {font_path}: {e}")
                continue
    
    # Если ничего не найдено, используем стандартные (могут быть квадратики)
    print("⚠️ Системный шрифт не найден, используется стандартный (возможны проблемы с кириллицей)")
    return 'Helvetica', 'Helvetica-Bold'

# Цвета (бордовая палитра как в проекте)
COLOR_PRIMARY = HexColor('#8B0000')  # Темно-бордовый
COLOR_SECONDARY = HexColor('#A52A2A')  # Коричнево-бордовый
COLOR_TEXT = HexColor('#2C2C2C')  # Темно-серый
COLOR_ACCENT = HexColor('#DC143C')  # Ярко-бордовый

def create_business_model_pdf(output_file='Бизнес_модель_Yoddle.pdf'):
    """Создает PDF файл с описанием бизнес-модели"""
    
    # Регистрируем шрифт с поддержкой кириллицы
    font_normal, font_bold = register_cyrillic_font()
    
    # Создаем документ
    doc = SimpleDocTemplate(
        output_file,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    # Контейнер для элементов
    story = []
    
    # Стили
    styles = getSampleStyleSheet()
    
    # Заголовок
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=COLOR_PRIMARY,
        spaceAfter=30,
        alignment=TA_LEFT,
        fontName=font_bold
    )
    
    # Заголовки разделов
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=COLOR_SECONDARY,
        spaceBefore=20,
        spaceAfter=12,
        alignment=TA_LEFT,
        fontName=font_bold
    )
    
    # Подзаголовки
    subheading_style = ParagraphStyle(
        'CustomSubheading',
        parent=styles['Heading3'],
        fontSize=14,
        textColor=COLOR_ACCENT,
        spaceBefore=15,
        spaceAfter=10,
        alignment=TA_LEFT,
        fontName=font_bold
    )
    
    # Основной текст
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=COLOR_TEXT,
        spaceAfter=12,
        alignment=TA_JUSTIFY,
        leading=16,
        fontName=font_normal
    )
    
    # Список
    list_style = ParagraphStyle(
        'CustomList',
        parent=styles['Normal'],
        fontSize=11,
        textColor=COLOR_TEXT,
        spaceAfter=8,
        alignment=TA_LEFT,
        leading=16,
        leftIndent=20,
        fontName=font_normal
    )
    
    # Заголовок документа
    story.append(Paragraph("Бизнес-модель Yoddle", title_style))
    story.append(Spacer(1, 0.5*cm))
    
    # 1. Элементы бизнес-модели
    story.append(Paragraph("1. Элементы бизнес-модели", heading_style))
    
    # Элемент 1
    story.append(Paragraph("Элемент 1: Модель дохода — SaaS-подписка", subheading_style))
    story.append(Paragraph(
        "Yoddle использует модель подписки: компания оплачивает ежемесячную подписку за каждого активного сотрудника — 400 рублей в месяц. Это прямой источник выручки, прозрачный и масштабируемый.",
        body_style
    ))
    story.append(Spacer(1, 0.3*cm))
    
    # Элемент 2
    story.append(Paragraph("Элемент 2: Монетизация остатка на коин-балансе", subheading_style))
    story.append(Paragraph(
        "Компания пополняет коин-баланс сотрудников. Если часть средств не используется в течение X месяцев, система может предусматривать частичную конвертацию остатка обратно в бонус компании или возврат в пользу Yoddle. Это создаёт дополнительный float и стимулирует использование льгот.",
        body_style
    ))
    story.append(Spacer(1, 0.3*cm))
    
    # Элемент 3
    story.append(Paragraph("Элемент 3: Партнёрская комиссия от маркетплейса", subheading_style))
    story.append(Paragraph(
        "Yoddle агрегирует предложения партнёров (фитнес, обучение, еда, сервисы) и получает комиссию с каждой транзакции, совершённой внутри платформы. Модель напоминает B2B2C-маркетплейс. Чем выше вовлечённость, тем выше ARPU.",
        body_style
    ))
    story.append(Spacer(1, 0.5*cm))
    
    # 2. Применимость к проекту
    story.append(Paragraph("2. Применимость к проекту", heading_style))
    story.append(Paragraph(
        "• <b>SaaS-подписка</b> масштабируется линейно с числом сотрудников.",
        list_style
    ))
    story.append(Paragraph(
        "• <b>Коин-баланс</b> позволяет работать с кэшфлоу и стимулирует использование.",
        list_style
    ))
    story.append(Paragraph(
        "• <b>Маркетплейс</b> встраивается как доп. источник дохода и усиливает ценность платформы.",
        list_style
    ))
    story.append(Spacer(1, 0.5*cm))
    
    # 3. Целевая аудитория
    story.append(Paragraph("3. Целевая аудитория", heading_style))
    story.append(Paragraph(
        "• <b>SaaS:</b> HR-отделы в компаниях 300–3000 сотрудников, особенно с высокой текучестью.",
        list_style
    ))
    story.append(Paragraph(
        "• <b>Коин-баланс:</b> сотрудники всех уровней.",
        list_style
    ))
    story.append(Paragraph(
        "• <b>Маркетплейс:</b> партнёры-поставщики услуг, готовые работать с корпоративным B2B2C сегментом.",
        list_style
    ))
    story.append(Spacer(1, 0.5*cm))
    
    # 4. Выгоды для проекта
    story.append(Paragraph("4. Выгоды для проекта", heading_style))
    story.append(Paragraph(
        "• <b>Финансовые:</b> стабильный MRR, float от остатков, комиссия с транзакций.",
        list_style
    ))
    story.append(Paragraph(
        "• <b>Стратегические:</b> модель легко масштабируется, гибкая под отрасли и ICP.",
        list_style
    ))
    story.append(Paragraph(
        "• <b>Операционные:</b> снижение нагрузки на HR, автоматизация отчётов и управления льготами.",
        list_style
    ))
    story.append(Paragraph(
        "• <b>Маркетинговые:</b> рост лояльности, привлекательность бренда работодателя.",
        list_style
    ))
    story.append(Spacer(1, 0.5*cm))
    
    # 5. Ценностное предложение
    story.append(Paragraph("5. Ценностное предложение — глубже", heading_style))
    story.append(Paragraph(
        "Yoddle помогает HR снижать текучесть и повышать вовлечённость с помощью персонализированных и геймифицированных льгот. Благодаря умному подбору, сотрудник получает ценные предложения, а HR — аналитику, автоматизацию и снижение текучести.",
        body_style
    ))
    story.append(Spacer(1, 0.3*cm))
    
    formula_style = ParagraphStyle(
        'Formula',
        parent=body_style,
        fontSize=12,
        textColor=COLOR_ACCENT,
        fontName=font_bold,
        alignment=TA_LEFT,
        backColor=HexColor('#F5F5F5'),
        borderPadding=10,
        leftIndent=20,
        rightIndent=20
    )
    story.append(Paragraph(
        "Формула: Помогает HR удерживать → через персонализацию и AI → даёт вовлечённость и экономию на найме",
        formula_style
    ))
    story.append(Spacer(1, 0.5*cm))
    
    # 6. Оригинальность
    story.append(Paragraph("6. Оригинальность", heading_style))
    story.append(Paragraph(
        "• <b>Уникальное сочетание:</b> персонализация + геймификация + AI + B2B2C-модель.",
        list_style
    ))
    story.append(Paragraph(
        "• <b>Коин-механика</b> гибко масштабируется под разных клиентов.",
        list_style
    ))
    story.append(Paragraph(
        "• <b>Возможность параллельных моделей</b> монетизации.",
        list_style
    ))
    story.append(Paragraph(
        "• <b>Продукт может работать</b> как SaaS, как API, как marketplace.",
        list_style
    ))
    
    # Строим PDF
    doc.build(story)
    print(f"✅ PDF файл успешно создан: {output_file}")
    return output_file

if __name__ == "__main__":
    try:
        output_file = create_business_model_pdf()
        print(f"\n📄 Файл сохранён в: {os.path.abspath(output_file)}")
    except Exception as e:
        print(f"❌ Ошибка при создании PDF: {e}")
        print("\n💡 Убедитесь, что установлена библиотека reportlab:")
        print("   pip install reportlab")

