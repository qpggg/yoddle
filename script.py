#!/usr/bin/env python3
"""
Yoddle SaaS 5-year metrics table generator

Generates Markdown, CSV, and HTML tables for key SaaS metrics based on
given inputs. Uses only Python standard library.

Outputs:
- ./metrics_table.md
- ./metrics_table.csv
- ./metrics_table.html

Also prints a Markdown preview to the console with compact K/M/B values.
"""

from __future__ import annotations

import csv
import datetime
import os
from typing import List, Dict, Any


# Тарифная сетка: 250₽ для малых, 350₽ для средних, 450₽ для крупных
def get_price_per_employee(company_size: int) -> int:
    """Возвращает цену за сотрудника в зависимости от размера компании."""
    if company_size <= 50:
        return 250
    elif company_size <= 200:
        return 350
    else:
        return 450

def calculate_weighted_average_price(total_employees: int, total_companies: int) -> float:
    """
    Рассчитывает средневзвешенную цену с учётом распределения компаний по размерам.
    Предполагает реалистичное распределение: много малых компаний, мало крупных.
    """
    avg_size = total_employees / total_companies if total_companies else 0
    
    # Модель распределения компаний:
    # 60% - малые (до 50 сотр.), средний размер 25 сотр.
    # 30% - средние (51-200 сотр.), средний размер 100 сотр.  
    # 10% - крупные (200+ сотр.), средний размер по остатку
    
    small_companies_ratio = 0.6
    medium_companies_ratio = 0.3
    large_companies_ratio = 0.1
    
    small_companies = int(total_companies * small_companies_ratio)
    medium_companies = int(total_companies * medium_companies_ratio)
    large_companies = total_companies - small_companies - medium_companies
    
    # Распределяем сотрудников
    small_avg_size = 25
    medium_avg_size = 100
    
    small_employees = small_companies * small_avg_size
    medium_employees = medium_companies * medium_avg_size
    large_employees = max(0, total_employees - small_employees - medium_employees)
    
    # Рассчитываем выручку по группам
    small_revenue = small_employees * 250
    medium_revenue = medium_employees * 350
    large_revenue = large_employees * 450
    
    total_revenue = small_revenue + medium_revenue + large_revenue
    
    # Средневзвешенная цена
    return total_revenue / total_employees if total_employees else 350

GROSS_MARGIN = 0.80  # 80%
COGS_SHARE = 1.0 - GROSS_MARGIN  # 20%
OPEX_SHARE_BY_YEAR = [0.75, 0.60, 0.50, 0.45, 0.45]
EMPLOYEES_BY_YEAR = [9300, 37000, 93000, 222000, 556000]
COMPANIES_BY_YEAR = [100, 500, 1500, 3500, 8000]


def format_kmb(value: float) -> str:
    """Format value with K/M/B suffix for preview; keeps one decimal when needed."""
    abs_v = abs(value)
    def tidy(x: float) -> str:
        s = ("{:.1f}".format(x)).rstrip("0").rstrip(".")
        return s
    if abs_v >= 1_000_000_000:
        return tidy(value / 1_000_000_000) + "B"
    if abs_v >= 1_000_000:
        return tidy(value / 1_000_000) + "M"
    if abs_v >= 1_000:
        return tidy(value / 1_000) + "K"
    return str(int(round(value))) if float(value).is_integer() else tidy(value)


def format_thin_space_grouping(value: float, decimals: int = 0) -> str:
    """Format numbers with thousands separated by spaces for HTML."""
    if decimals <= 0:
        s = format(int(round(value)), ",").replace(",", " ")
    else:
        s = ("{:,." + str(decimals) + "f}").format(value).replace(",", " ")
    return s


def compute_rows() -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    years = list(range(1, 6))
    for idx, year in enumerate(years):
        employees = EMPLOYEES_BY_YEAR[idx]
        companies = COMPANIES_BY_YEAR[idx]
        opex_share = OPEX_SHARE_BY_YEAR[idx]

        # Вычисляем средневзвешенную цену с учётом распределения по размерам
        avg_employees_per_company = (employees / companies) if companies else 0.0
        weighted_avg_price = calculate_weighted_average_price(employees, companies)
        
        mrr = round(employees * weighted_avg_price)
        arr = round(mrr * 12)
        cogs = round(arr * COGS_SHARE)
        gross_profit = round(arr * GROSS_MARGIN)
        opex = round(arr * opex_share)
        ebitda = round(gross_profit - opex)
        ebitda_margin = (ebitda / arr) if arr else 0.0
        arpu_per_month = round(weighted_avg_price)
        acv_per_company_per_year = round(avg_employees_per_company * weighted_avg_price * 12)

        rows.append({
            "Year": year,
            "Employees": employees,
            "Companies": companies,
            "MRR": mrr,
            "ARR": arr,
            "COGS": cogs,
            "Gross Profit": gross_profit,
            "OPEX": opex,
            "EBITDA": ebitda,
            "EBITDA margin": ebitda_margin,
            "ARPU/month": arpu_per_month,
            "Avg employees/company": avg_employees_per_company,
            "ACV/company/year": acv_per_company_per_year,
        })
    return rows


def to_markdown(rows: List[Dict[str, Any]]) -> str:
    columns = [
        ("Год", "Year"),
        ("Сотрудн.", "Employees"),
        ("Компании", "Companies"),
        ("MRR", "MRR"),
        ("ARR", "ARR"),
        ("COGS", "COGS"),
        ("Gross Profit", "Gross Profit"),
        ("OPEX", "OPEX"),
        ("EBITDA", "EBITDA"),
        ("EBITDA %", "EBITDA margin"),
        ("ARPU/мес", "ARPU/month"),
        ("AVG сотр/ком", "Avg employees/company"),
        ("ACV ком/год", "ACV/company/year"),
    ]

    def cell(key: str, v: Any) -> str:
        if key in ("Year", "Employees", "Companies"):
            return format_kmb(float(v))
        if key in ("MRR", "ARR", "COGS", "Gross Profit", "OPEX", "EBITDA", "ACV/company/year"):
            return format_kmb(float(v)) + " ₽"
        if key == "EBITDA margin":
            return "{:.1f}%".format(float(v) * 100)
        if key == "ARPU/month":
            return format_kmb(float(v)) + " ₽"
        if key == "Avg employees/company":
            return "{:.1f}".format(float(v))
        return str(v)

    lines = []
    header_labels = [label for (label, _) in columns]
    lines.append("| " + " | ".join(header_labels) + " |")
    lines.append("|" + "|".join(["---"] * len(columns)) + "|")
    for r in rows:
        line = [cell(key, r[key]) for (_, key) in columns]
        lines.append("| " + " | ".join(line) + " |")
    return "\n".join(lines)


def to_csv(rows: List[Dict[str, Any]]) -> str:
    columns = [
        ("Год", "Year"),
        ("Сотрудн.", "Employees"),
        ("Компании", "Companies"),
        ("MRR", "MRR"),
        ("ARR", "ARR"),
        ("COGS", "COGS"),
        ("Gross Profit", "Gross Profit"),
        ("OPEX", "OPEX"),
        ("EBITDA", "EBITDA"),
        ("EBITDA %", "EBITDA margin"),
        ("ARPU/мес", "ARPU/month"),
        ("AVG сотр/ком", "Avg employees/company"),
        ("ACV ком/год", "ACV/company/year"),
    ]
    output_lines: List[str] = []
    # Build CSV via csv module into list
    from io import StringIO
    sio = StringIO()
    writer = csv.writer(sio)
    writer.writerow([label for (label, _) in columns])
    for r in rows:
        writer.writerow([
            r["Year"],
            r["Employees"],
            r["Companies"],
            int(round(r["MRR"])),
            int(round(r["ARR"])),
            int(round(r["COGS"])),
            int(round(r["Gross Profit"])),
            int(round(r["OPEX"])),
            int(round(r["EBITDA"])),
            "{:.4f}".format(r["EBITDA margin"]),
            int(round(r["ARPU/month"])),
            "{:.2f}".format(r["Avg employees/company"]),
            int(round(r["ACV/company/year"])),
        ])
    return sio.getvalue()


def to_html(rows: List[Dict[str, Any]]) -> str:
    columns = [
        ("Год", "Year"),
        ("Сотрудн.", "Employees"),
        ("Компании", "Companies"),
        ("MRR", "MRR"),
        ("ARR", "ARR"),
        ("COGS", "COGS"),
        ("Gross Profit", "Gross Profit"),
        ("OPEX", "OPEX"),
        ("EBITDA", "EBITDA"),
        ("EBITDA %", "EBITDA margin"),
        ("ARPU/мес", "ARPU/month"),
        ("AVG сотр/ком", "Avg employees/company"),
        ("ACV ком/год", "ACV/company/year"),
    ]

    def cell(key: str, v: Any) -> str:
        if key in ("Year", "Employees", "Companies"):
            return format_thin_space_grouping(float(v))
        if key in ("MRR", "ARR", "COGS", "Gross Profit", "OPEX", "EBITDA", "ACV/company/year", "ARPU/month"):
            return format_thin_space_grouping(float(v)) + " ₽"
        if key == "EBITDA margin":
            return "{:.1f}%".format(float(v) * 100)
        if key == "Avg employees/company":
            return "{:.1f}".format(float(v))
        return str(v)

    # Minimal, modern dark theme styled for Yoddle
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    
    # Вычисляем общую средневзвешенную цену для отображения
    total_employees = sum(EMPLOYEES_BY_YEAR)
    total_companies = sum(COMPANIES_BY_YEAR)
    avg_price_display = round(calculate_weighted_average_price(total_employees, total_companies))
    
    style = """
    :root {
      color-scheme: dark;
      --bg: #0a0b0e;
      --panel: #0f1116;
      --text: #e9e9ee;
      --muted: #a3a3ad;
      --accent: #8B0000; /* align with theme.ts primary.main */
      --accent-2: #B22222; /* firebrick, used across UI */
      --border: #23262d;
      --row: #0c0e13;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: "Inter", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
    body { font-size: clamp(12px, 1.35vw, 14px); line-height: 1.6; }
    .wrap { max-width: 100%; margin: 32px auto; padding: 0 24px; }
    .title { display: flex; align-items: baseline; gap: 12px; }
    .title h1 { margin: 0; font-size: clamp(18px, 2.2vw, 26px); letter-spacing: -0.01em; }
    .title .badge { background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: white; padding: 4px 10px; border-radius: 999px; font-weight: 700; font-size: 12px; }
    .meta { color: var(--muted); margin-top: 6px; font-size: 12px; }
    .table-wrap { margin-top: 18px; background: var(--panel); border: 1px solid var(--border); border-radius: 12px; overflow: visible; box-shadow: 0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03); }
    table { width: 100%; border-collapse: separate; border-spacing: 0; font-variant-numeric: tabular-nums lining-nums; table-layout: fixed; }
    thead th { background: linear-gradient(180deg, #141823, #0f131e); color: #fff; text-align: center; padding: 20px 8px; border-bottom: 1px solid var(--border); font-weight: 700; white-space: nowrap; font-size: 15px; }
    thead th:nth-child(1) { width: 4%; text-align: center; }
    thead th:nth-child(2) { width: 8%; }
    thead th:nth-child(3) { width: 7%; }
    thead th:nth-child(4) { width: 7%; }
    thead th:nth-child(5) { width: 7%; }
    thead th:nth-child(6) { width: 7%; }
    thead th:nth-child(7) { width: 9%; }
    thead th:nth-child(8) { width: 7%; }
    thead th:nth-child(9) { width: 7%; }
    thead th:nth-child(10) { width: 8%; }
    thead th:nth-child(11) { width: 8%; }
    thead th:nth-child(12) { width: 10%; }
    thead th:nth-child(13) { width: 13%; }
    tbody td { padding: 18px 8px; border-bottom: 1px solid var(--border); color: var(--text); white-space: nowrap; font-size: 16px; overflow: hidden; text-overflow: ellipsis; text-align: center; }
    tbody tr:nth-child(odd) td { background: var(--row); }
    tbody tr:hover td { background: #171b26; }
    tbody td.num { text-align: right; }
    tfoot td { padding: 10px 12px; color: var(--muted); font-size: 12px; }
    .accent { color: var(--accent-2); font-weight: 700; }
    .ruble { opacity: 0.95; }
    @media (max-width: 1200px) {
      .wrap { padding: 0 12px; }
      table { font-size: 13px; }
      thead th { padding: 16px 8px; font-size: 12px; }
      tbody td { padding: 14px 8px; font-size: 13px; }
    }
    """

    # Build table HTML
    head_row = "".join(f"<th>{label}</th>" for (label, _) in columns)
    body_rows: List[str] = []
    for r in rows:
        tds: List[str] = []
        for (label, key) in columns:
            cls = "num" if key not in ("Year",) else ""
            tds.append(f"<td class=\"{cls}\">{cell(key, r[key])}</td>")
        body_rows.append("<tr>" + "".join(tds) + "</tr>")

    html = f"""
<!DOCTYPE html>
<html lang=\"ru\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>Yoddle · SaaS Metrics (5 years)</title>
  <style>{style}</style>
</head>
<body>
  <div class=\"wrap\">
    <div class=\"title\">
      <h1>Yoddle · SaaS-план метрик на 5 лет</h1>
      <span class=\"badge\">Productivity style</span>
    </div>
    <div class=\"meta\">Цена: <span class=\"accent\">250-450 ₽</span>/сотр./мес (средняя: {avg_price_display} ₽) · GM: {int(GROSS_MARGIN*100)}% · COGS: {int(COGS_SHARE*100)}% · Обновлено: {now}</div>
    <div class=\"meta\" style=\"margin-top:10px\">Тарифы: 250₽ (до 50 сотр.), 350₽ (51-200 сотр.), 450₽ (200+ сотр.) · <strong>AVG</strong> — среднее число сотрудников на компанию; <strong>ACV</strong> — средний годовой чек на компанию.</div>
    <div class=\"table-wrap\">
      <table>
        <thead><tr>{head_row}</tr></thead>
        <tbody>
          {''.join(body_rows)}
        </tbody>
        <tfoot>
          <tr><td colspan=\"{len(columns)}\">Сгенерировано скриптом Yoddle (стандартная библиотека Python).</td></tr>
        </tfoot>
      </table>
    </div>
  </div>
</body>
</html>
"""
    return html


def save_file(path: str, content: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def main() -> None:
    rows = compute_rows()

    # Markdown first
    md = to_markdown(rows)
    save_file("./metrics_table.md", md)

    # HTML next
    html = to_html(rows)
    save_file("./metrics_table.html", html)

    # CSV last; if locked, skip gracefully
    try:
        csv_text = to_csv(rows)
        save_file("./metrics_table.csv", csv_text)
    except Exception as e:
        print("[warn] CSV not updated (file may be open):", e)

    # Console preview
    print("Markdown preview:\n")
    print(md)


if __name__ == "__main__":
    main()


