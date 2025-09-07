#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Generate a 5-year metrics table for a per-employee SaaS pricing model and export
Markdown, CSV, and styled HTML versions.

Assumptions (modifiable below):
- Price per employee per month: 450 RUB
- Gross margin: 80% (COGS = 20%)
- OPEX as a share of revenue per year: [0.75, 0.60, 0.50, 0.45, 0.45]
- Employees and companies per year per the provided plan

Outputs:
- /workspace/output/metrics_table.md
- /workspace/output/metrics_table.csv
- /workspace/output/metrics_table.html (styled)

This script uses only the Python standard library.
"""

from __future__ import annotations

import csv
import os
from dataclasses import dataclass, asdict
from typing import List


# ----------------------------- Configuration ---------------------------------
PRICE_PER_EMPLOYEE_RUB_PER_MONTH: float = 450.0
GROSS_MARGIN_SHARE: float = 0.80  # 80% gross margin
COGS_SHARE: float = 1.0 - GROSS_MARGIN_SHARE

# Per-year OPEX as a share of revenue (ARR). Length must be 5
OPEX_SHARE_BY_YEAR: List[float] = [0.75, 0.60, 0.50, 0.45, 0.45]

# 5-year plan (Employees, Companies) — adjusted per prior alignment
EMPLOYEES_BY_YEAR: List[int] = [9300, 37000, 93000, 222000, 556000]
COMPANIES_BY_YEAR: List[int] = [100, 500, 1500, 3500, 8000]

# Output directory
OUTPUT_DIR: str = "/workspace/output"


# ------------------------------- Data Model ----------------------------------
@dataclass
class MetricsRow:
    year: int
    employees: int
    companies: int
    mrr_rub: float
    arr_rub: float
    cogs_rub: float
    gross_profit_rub: float
    opex_rub: float
    ebitda_rub: float
    ebitda_margin: float  # share (0..1)
    arpu_rub_per_month: float
    avg_employees_per_company: float
    acv_rub_per_company_per_year: float


# ------------------------------ Calculations ---------------------------------
def calculate_year_metrics(year: int, employees: int, companies: int, opex_share: float) -> MetricsRow:
    mrr = employees * PRICE_PER_EMPLOYEE_RUB_PER_MONTH
    arr = mrr * 12.0
    cogs = arr * COGS_SHARE
    gross_profit = arr * GROSS_MARGIN_SHARE
    opex = arr * opex_share
    ebitda = gross_profit - opex
    ebitda_margin = 0.0 if arr == 0 else ebitda / arr

    avg_emp_per_company = 0.0 if companies == 0 else employees / companies
    acv_per_company = avg_emp_per_company * PRICE_PER_EMPLOYEE_RUB_PER_MONTH * 12.0

    return MetricsRow(
        year=year,
        employees=employees,
        companies=companies,
        mrr_rub=mrr,
        arr_rub=arr,
        cogs_rub=cogs,
        gross_profit_rub=gross_profit,
        opex_rub=opex,
        ebitda_rub=ebitda,
        ebitda_margin=ebitda_margin,
        arpu_rub_per_month=PRICE_PER_EMPLOYEE_RUB_PER_MONTH,
        avg_employees_per_company=avg_emp_per_company,
        acv_rub_per_company_per_year=acv_per_company,
    )


def generate_metrics() -> List[MetricsRow]:
    if len(OPEX_SHARE_BY_YEAR) != 5:
        raise ValueError("OPEX_SHARE_BY_YEAR must have exactly 5 entries")
    rows: List[MetricsRow] = []
    for idx in range(5):
        rows.append(
            calculate_year_metrics(
                year=idx + 1,
                employees=EMPLOYEES_BY_YEAR[idx],
                companies=COMPANIES_BY_YEAR[idx],
                opex_share=OPEX_SHARE_BY_YEAR[idx],
            )
        )
    return rows


# ------------------------------ Format Helpers --------------------------------
def fmt_money_rub(value: float) -> str:
    """Format RUB with units K/M/B for readability."""
    abs_val = abs(value)
    sign = '-' if value < 0 else ''
    if abs_val >= 1_000_000_000:
        return f"{sign}{abs_val/1_000_000_000:.2f}B₽"
    if abs_val >= 1_000_000:
        return f"{sign}{abs_val/1_000_000:.2f}M₽"
    if abs_val >= 1_000:
        return f"{sign}{abs_val/1_000:.2f}K₽"
    return f"{sign}{abs_val:.0f}₽"


def fmt_money_full(value: float) -> str:
    return f"{value:,.0f}₽".replace(',', ' ')


def fmt_percent(value: float) -> str:
    return f"{value*100:.0f}%"


def to_markdown_table(rows: List[MetricsRow]) -> str:
    headers = [
        "Год", "Сотрудники", "Компании", "MRR", "ARR", "COGS (20%)",
        "Валовая прибыль (80%)", "OPEX", "EBITDA", "EBITDA margin",
        "ARPU/мес", "Сотр./комп.", "ACV/комп./год",
    ]

    lines = []
    lines.append("| " + " | ".join(headers) + " |")
    lines.append("|" + "---|" * len(headers))

    for r in rows:
        lines.append(
            "| "
            + " | ".join(
                [
                    f"{r.year}",
                    f"{r.employees:,}".replace(',', ' '),
                    f"{r.companies:,}".replace(',', ' '),
                    fmt_money_rub(r.mrr_rub),
                    fmt_money_rub(r.arr_rub),
                    fmt_money_rub(r.cogs_rub),
                    fmt_money_rub(r.gross_profit_rub),
                    fmt_money_rub(r.opex_rub),
                    fmt_money_rub(r.ebitda_rub),
                    fmt_percent(r.ebitda_margin),
                    fmt_money_rub(r.arpu_rub_per_month).replace('₽','₽/сотр.'),
                    f"{r.avg_employees_per_company:.1f}",
                    fmt_money_rub(r.acv_rub_per_company_per_year),
                ]
            )
            + " |"
        )

    return "\n".join(lines)


def to_csv(rows: List[MetricsRow], path: str) -> None:
    fieldnames = [
        "year", "employees", "companies", "mrr_rub", "arr_rub",
        "cogs_rub", "gross_profit_rub", "opex_rub", "ebitda_rub",
        "ebitda_margin", "arpu_rub_per_month", "avg_employees_per_company",
        "acv_rub_per_company_per_year",
    ]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            d = asdict(r)
            writer.writerow(d)


def to_html(rows: List[MetricsRow]) -> str:
    style = """
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
      h1 { font-size: 20px; font-weight: 600; margin-bottom: 16px; }
      table { border-collapse: collapse; width: 100%; background: #0b1220; border: 1px solid #1e293b; }
      th, td { padding: 10px 12px; border-bottom: 1px solid #1e293b; white-space: nowrap; }
      th { text-align: left; font-weight: 600; color: #93c5fd; background: #0b1220; position: sticky; top: 0; }
      tr:hover td { background: #111827; }
      .num { text-align: right; font-variant-numeric: tabular-nums; }
      .subtle { color: #94a3b8; }
      .pill { background: #111827; border: 1px solid #1f2937; border-radius: 999px; padding: 2px 8px; font-size: 12px; }
    </style>
    """

    headers = [
        ("Год", ""), ("Сотрудники", "num"), ("Компании", "num"),
        ("MRR", "num"), ("ARR", "num"), ("COGS (20%)", "num"),
        ("Валовая прибыль (80%)", "num"), ("OPEX", "num"), ("EBITDA", "num"),
        ("EBITDA margin", "num"), ("ARPU/мес", "num"), ("Сотр./комп.", "num"),
        ("ACV/комп./год", "num"),
    ]

    def row_cells(r: MetricsRow) -> List[str]:
        return [
            str(r.year),
            f"{r.employees:,}".replace(',', ' '),
            f"{r.companies:,}".replace(',', ' '),
            fmt_money_full(r.mrr_rub),
            fmt_money_full(r.arr_rub),
            fmt_money_full(r.cogs_rub),
            fmt_money_full(r.gross_profit_rub),
            fmt_money_full(r.opex_rub),
            fmt_money_full(r.ebitda_rub),
            fmt_percent(r.ebitda_margin),
            f"{PRICE_PER_EMPLOYEE_RUB_PER_MONTH:,.0f}₽".replace(',', ' '),
            f"{r.avg_employees_per_company:.1f}",
            fmt_money_full(r.acv_rub_per_company_per_year),
        ]

    thead = "<tr>" + "".join([f"<th class=''>{h}</th>" for h, _ in headers]) + "</tr>"
    body_rows = []
    for r in rows:
        tds = []
        for (h, cls), val in zip(headers, row_cells(r)):
            tds.append(f"<td class='{cls}'>{val}</td>")
        body_rows.append("<tr>" + "".join(tds) + "</tr>")

    html = f"""
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8">{style}
        <title>5-летние метрики (SaaS per-employee)</title>
      </head>
      <body>
        <h1>5-летние метрики (SaaS per-employee)</h1>
        <div class="subtle pill">Цена: {PRICE_PER_EMPLOYEE_RUB_PER_MONTH:.0f}₽/сотр./мес · GM: {GROSS_MARGIN_SHARE*100:.0f}% · OPEX/выручка по годам: {', '.join(f'{int(x*100)}%' for x in OPEX_SHARE_BY_YEAR)}</div>
        <br/>
        <table>
          <thead>{thead}</thead>
          <tbody>
            {''.join(body_rows)}
          </tbody>
        </table>
      </body>
    </html>
    """
    return html


# --------------------------------- Main --------------------------------------
def main() -> None:
    rows = generate_metrics()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Markdown
    md_path = os.path.join(OUTPUT_DIR, "metrics_table.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("### 5-летние метрики (SaaS за сотрудника)\n\n")
        f.write(f"- Цена: {PRICE_PER_EMPLOYEE_RUB_PER_MONTH:.0f}₽/сотр./мес\n")
        f.write(f"- Валовая маржа: {int(GROSS_MARGIN_SHARE*100)}% (COGS {int(COGS_SHARE*100)}%)\n")
        f.write(f"- OPEX/выручка: {', '.join(f'{int(x*100)}%' for x in OPEX_SHARE_BY_YEAR)}\n\n")
        f.write(to_markdown_table(rows))

    # CSV
    csv_path = os.path.join(OUTPUT_DIR, "metrics_table.csv")
    to_csv(rows, csv_path)

    # HTML
    html_path = os.path.join(OUTPUT_DIR, "metrics_table.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(to_html(rows))

    # Console output (Markdown for quick copy)
    print("Generated:")
    print("-", md_path)
    print("-", csv_path)
    print("-", html_path)
    print("\nMarkdown preview:\n")
    print(to_markdown_table(rows))


if __name__ == "__main__":
    main()

