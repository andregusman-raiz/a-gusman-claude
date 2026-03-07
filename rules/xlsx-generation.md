---
description: "Regras para geração de planilhas XLSX com openpyxl e xlsxwriter"
paths:
  - "**/*.py"
  - "**/*.xlsx"
---

# Regras XLSX para Geração de Planilhas

## REGRA 1 — Estrutura Base
- Coluna A (largura 3pt): margem visual — NUNCA colocar dados na coluna A
- Headers na linha 2 (linha 1 reservada para título/metadata)
- Freeze panes: `ws.freeze_panes = 'B3'` (congela header + coluna margem)
- AutoFilter nos headers: `ws.auto_filter.ref = ws.dimensions`

## REGRA 2 — Formatação Numérica Padrão BR
```python
# Moeda brasileira
cell.number_format = 'R$ #,##0.00'
# Percentual
cell.number_format = '0.0%'
# Data brasileira
cell.number_format = 'DD/MM/YYYY'
# Número inteiro com separador de milhar
cell.number_format = '#,##0'
# Número decimal
cell.number_format = '#,##0.00'
```

## REGRA 3 — Fórmulas (NUNCA hardcoded)
- Usar fórmulas Excel SEMPRE que possível: `=SUM()`, `=AVERAGE()`, `=VLOOKUP()`
- NUNCA calcular em Python e gravar valor — gravar a fórmula
- Fórmulas em PT-BR quando destino é Excel BR: `=SOMA()`, `=MÉDIA()`, `=PROCV()`
- Validar: zero #REF!, #NAME?, #VALUE!, #DIV/0!, #NULL!, #N/A

## REGRA 4 — Estilização de Headers
```python
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

header_font = Font(name='Calibri', size=11, bold=True, color='FFFFFF')
header_fill = PatternFill(start_color='2F5496', end_color='2F5496', fill_type='solid')
header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
thin_border = Border(
    left=Side(style='thin', color='D9D9D9'),
    right=Side(style='thin', color='D9D9D9'),
    top=Side(style='thin', color='D9D9D9'),
    bottom=Side(style='thin', color='D9D9D9')
)
```

## REGRA 5 — Linhas Alternadas (Zebra)
```python
light_fill = PatternFill(start_color='F2F2F2', end_color='F2F2F2', fill_type='solid')
# Aplicar em linhas pares (data rows)
for row_idx in range(3, max_row + 1):
    if row_idx % 2 == 0:
        for cell in ws[row_idx]:
            cell.fill = light_fill
```

## REGRA 6 — Largura de Colunas
- Auto-fit baseado no conteúdo: calcular max(len(str(cell.value))) por coluna
- Mínimo: 8 caracteres | Máximo: 50 caracteres
- Adicionar padding: `adjusted_width = max_length + 2`
- Coluna A (margem): fixar em 3

## REGRA 7 — Validação de Dados
```python
from openpyxl.worksheet.datavalidation import DataValidation
# Lista suspensa
dv = DataValidation(type="list", formula1='"Sim,Não,N/A"', allow_blank=True)
dv.error = "Valor inválido"
dv.errorTitle = "Erro"
ws.add_data_validation(dv)
dv.add(ws['C3:C100'])
```

## REGRA 8 — Formatação Condicional
```python
from openpyxl.formatting.rule import CellIsRule
# Verde para positivo, vermelho para negativo
ws.conditional_formatting.add('D3:D100',
    CellIsRule(operator='greaterThan', formula=['0'],
              fill=PatternFill(start_color='C6EFCE', end_color='C6EFCE', fill_type='solid')))
ws.conditional_formatting.add('D3:D100',
    CellIsRule(operator='lessThan', formula=['0'],
              fill=PatternFill(start_color='FFC7CE', end_color='FFC7CE', fill_type='solid')))
```

## REGRA 9 — Múltiplas Abas (Sheets)
- Aba "Resumo" sempre como primeira aba
- Nomes de abas em português com acentos: "Análise", "Dados Brutos", "Referências"
- Cor de tab para identificação visual: `ws.sheet_properties.tabColor = "2F5496"`
- Ordem lógica: Resumo → Detalhe → Dados Brutos → Referências

## REGRA 10 — Charts (Gráficos)
```python
from openpyxl.chart import BarChart, Reference
chart = BarChart()
chart.title = "Título do Gráfico"
chart.x_axis.title = "Categorias"
chart.y_axis.title = "Valores"
chart.style = 10  # Estilo profissional
data = Reference(ws, min_col=2, min_row=2, max_col=4, max_row=10)
cats = Reference(ws, min_col=1, min_row=3, max_row=10)
chart.add_data(data, titles_from_data=True)
chart.set_categories(cats)
chart.width = 20
chart.height = 12
ws.add_chart(chart, "F3")
```

## REGRA 11 — Proteção e Print Setup
- Proteger fórmulas: `cell.protection = Protection(locked=True)`
- Desproteger inputs: `cell.protection = Protection(locked=False)`
- Print area: `ws.print_area = 'B1:G50'`
- Print title rows: `ws.print_title_rows = '2:2'`
- Orientation: `ws.page_setup.orientation = ws.ORIENTATION_LANDSCAPE`

## REGRA 12 — Pivot Tables (via MCP ou openpyxl)
- Usar MCP excel server `create_pivot_table` quando disponível
- Se via Python puro: criar com pandas `pivot_table()` e exportar resultado
- Sempre incluir totais: `margins=True` no pandas
- Nomear tabela: `ws.add_table(Table(displayName="TabelaDados", ref="B2:G50"))`

## REGRA 13 — Acentuação PT-BR (INVIOLÁVEL)
- Todo texto em português DEVE usar acentuação correta
- NUNCA: "Analise", "Relatorio", "Operacoes"
- SEMPRE: "Análise", "Relatório", "Operações"
- Encoding: UTF-8 nativo (openpyxl já suporta)

## REGRA 14 — Salvar e Validar
- Salvar incrementalmente a cada aba completada
- Após salvar: rodar `python3 D:/.claude/scripts/validate_office_file.py <file>`
- Zero erros de fórmula (#REF!, #NAME?, etc.)
- Verificar que freeze panes funcionam
- Verificar que AutoFilter está ativo
