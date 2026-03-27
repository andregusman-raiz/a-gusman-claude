---
name: xlsx
description: "Criar, editar e analisar planilhas Excel (.xlsx, .xlsm, .csv, .tsv). Trigger quando usuario quer: abrir/ler/editar/corrigir arquivo Excel existente, criar planilha nova, converter entre formatos tabulares, limpar dados, ou gerar relatorios em Excel. Deliverable DEVE ser arquivo .xlsx."
model: sonnet
argument-hint: "[create|edit|analyze] [path ou descricao]"
metadata:
  filePattern: "*.xlsx,*.xlsm,*.csv,*.tsv"
  bashPattern: "xlsx|excel|planilha|spreadsheet|openpyxl"
  priority: 80
---

# Excel (.xlsx) — Skill Completo

> Baseado em: [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/xlsx) (oficial), [tfriedel/claude-office-skills](https://github.com/tfriedel/claude-office-skills) e [zgldh/xlsx-populate-skill](https://github.com/zgldh/xlsx-populate-skill)

## Quando Usar

- Criar planilha nova (relatorios, dashboards, modelos financeiros)
- Editar Excel existente preservando formatacao/formulas
- Analisar dados de planilhas (estatisticas, limpeza, transformacao)
- Converter entre formatos tabulares (CSV ↔ XLSX)

## Quando NAO Usar

- Deliverable e Word/HTML/PDF (mesmo com dados tabulares)
- Google Sheets API integration
- Apenas ler dados sem gerar arquivo

---

## Requisitos para Todos os Outputs

### Fonte Profissional
- Arial ou Times New Roman, consistente em todo o documento

### Zero Erros de Formula
- TODA planilha entregue com ZERO erros: #REF!, #DIV/0!, #VALUE!, #N/A, #NAME?

### Preservar Templates Existentes
- Ao modificar arquivos existentes: manter formato, estilo e convencoes originais
- Convencoes do template SEMPRE prevalecem sobre estas guidelines

---

## Bibliotecas

### Python (openpyxl + pandas) — Padrao
- **openpyxl**: Formulas, formatacao complexa, multiplas abas, merge cells
- **pandas**: Analise de dados, bulk operations, export simples

### Node.js (xlsx-populate) — Alternativa para preservar formatacao
- **xlsx-populate**: Editar Excel preservando formatacao original, merged cells, estilos
- Instalar: `npm install xlsx-populate`

### Decisao
| Necessidade | Biblioteca |
|-------------|-----------|
| Criar planilha com formulas/formatacao | openpyxl |
| Analise de dados, bulk ops | pandas |
| Editar Excel sem perder formatacao | xlsx-populate (Node) |
| Datasets grandes (10k+ linhas) | pandas → openpyxl |

---

## Workflow Principal

1. **Escolher biblioteca**: pandas (dados) ou openpyxl (formulas/formatacao)
2. **Criar/Carregar**: Workbook novo ou existente
3. **Modificar**: Dados, formulas, formatacao
4. **Salvar**: Gravar arquivo
5. **Recalcular formulas (OBRIGATORIO se usou formulas)**:
   ```bash
   python ~/.claude/skills/xlsx/scripts/recalc.py output.xlsx
   ```
6. **Verificar erros**: Se `status: errors_found`, corrigir e recalcular

---

## CRITICO: Formulas, NAO Valores Hardcoded

**SEMPRE usar formulas Excel em vez de calcular em Python e hardcodar.**

```python
# ❌ ERRADO
total = df['Sales'].sum()
sheet['B10'] = total  # Hardcoda 5000

# ✅ CORRETO
sheet['B10'] = '=SUM(B2:B9)'
sheet['C5'] = '=(C4-C2)/C2'        # Growth rate
sheet['D20'] = '=AVERAGE(D2:D19)'   # Media
```

---

## Criar Planilha Nova (openpyxl)

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

wb = Workbook()
sheet = wb.active
sheet.title = 'Dados'

# Headers com estilo
headers = ['Nome', 'Valor', 'Total']
for col, h in enumerate(headers, 1):
    cell = sheet.cell(row=1, column=col, value=h)
    cell.font = Font(bold=True, color='FFFFFF')
    cell.fill = PatternFill('solid', fgColor='4472C4')
    cell.alignment = Alignment(horizontal='center')

# Dados
sheet.append(['Item A', 100, '=B2*1.1'])
sheet.append(['Item B', 200, '=B3*1.1'])

# Formula de totais
sheet['B4'] = '=SUM(B2:B3)'
sheet['C4'] = '=SUM(C2:C3)'

# Largura de colunas
sheet.column_dimensions['A'].width = 20
sheet.column_dimensions['B'].width = 15
sheet.column_dimensions['C'].width = 15

wb.save('output.xlsx')
```

## Editar Excel Existente (openpyxl)

```python
from openpyxl import load_workbook

wb = load_workbook('existing.xlsx')
sheet = wb.active  # ou wb['NomeAba']

# Modificar
sheet['A1'] = 'Novo Valor'
sheet.insert_rows(2)
sheet.delete_cols(3)

# Nova aba
new_sheet = wb.create_sheet('Resumo')
new_sheet['A1'] = '=Dados!B4'  # Cross-sheet reference

wb.save('modified.xlsx')
```

## Editar Preservando Formatacao (xlsx-populate / Node.js)

```javascript
const XlsxPopulate = require('xlsx-populate');

const workbook = await XlsxPopulate.fromFileAsync('input.xlsx');
const sheet = workbook.sheet(0);

// Formatacao original preservada automaticamente
sheet.cell('A1').value('Atualizado');
sheet.cell('D10').formula('=SUM(D2:D9)');

// Estilo
sheet.cell('A1').style({
  bold: true, fontSize: 14,
  fill: '4472C4', fontColor: 'FFFFFF'
});

// Merge
sheet.range('A1:D1').merged(true);

await workbook.toFileAsync('output.xlsx');
```

## Analise de Dados (pandas)

```python
import pandas as pd

df = pd.read_excel('file.xlsx')                    # Primeira aba
all_sheets = pd.read_excel('file.xlsx', sheet_name=None)  # Todas as abas

df.head()       # Preview
df.info()       # Tipos de coluna
df.describe()   # Estatisticas

# Exportar
df.to_excel('output.xlsx', index=False)
```

---

## Recalculo de Formulas (OBRIGATORIO)

Arquivos criados por openpyxl contem formulas como strings, sem valores calculados.

```bash
python ~/.claude/skills/xlsx/scripts/recalc.py output.xlsx [timeout_seconds]
```

O script:
- Configura LibreOffice macro automaticamente no primeiro uso
- Recalcula TODAS formulas em todas as abas
- Varre TODAS celulas por erros Excel
- Retorna JSON com detalhes de erros

### Output do recalc.py
```json
{
  "status": "success",        // ou "errors_found"
  "total_errors": 0,
  "total_formulas": 42,
  "error_summary": {
    "#REF!": { "count": 2, "locations": ["Sheet1!B5", "Sheet1!C10"] }
  }
}
```

---

## Padroes para Modelos Financeiros

### Cores (Convencao da Industria)
| Cor | RGB | Uso |
|-----|-----|-----|
| Azul (texto) | 0,0,255 | Inputs hardcoded, premissas |
| Preto (texto) | 0,0,0 | TODAS formulas e calculos |
| Verde (texto) | 0,128,0 | Links de outras abas do mesmo workbook |
| Vermelho (texto) | 255,0,0 | Links externos (outros arquivos) |
| Amarelo (fundo) | 255,255,0 | Premissas-chave que precisam atencao |

### Formatacao de Numeros
| Tipo | Formato | Exemplo |
|------|---------|---------|
| Anos | Texto string | "2024" (nao 2,024) |
| Moeda | $#,##0 | Especificar unidade no header ("Revenue ($mm)") |
| Zeros | "-" | $#,##0;($#,##0);- |
| Percentual | 0.0% | Um decimal |
| Multiplos | 0.0x | EV/EBITDA, P/E |
| Negativos | Parenteses | (123) nao -123 |

### Regras de Formula
- Premissas em celulas separadas (NUNCA hardcoded em formula)
- `=B5*(1+$B$6)` em vez de `=B5*1.05`
- Documentar hardcodes: "Source: [Sistema], [Data], [Referencia], [URL]"
- IFERROR para formulas com risco de erro: `=IFERROR(D5/C5,"N/A")`

---

## Checklist de Verificacao

- [ ] Testar 2-3 referencias antes de aplicar amplamente
- [ ] Confirmar mapeamento de colunas (col 64 = BL, nao BK)
- [ ] Row offset: Excel 1-indexed (DataFrame row 5 = Excel row 6)
- [ ] NaN handling: `pd.notna()` antes de usar valor
- [ ] Division by zero: `=IF(C5=0,0,D5/C5)`
- [ ] Cross-sheet: formato correto `Sheet1!A1`
- [ ] Recalcular com recalc.py apos salvar
- [ ] Zero erros no output do recalc.py

---

## Estilos Profissionais

### Corporate Blue (Default)
```python
# Headers
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

header_font = Font(bold=True, color='FFFFFF', size=11)
header_fill = PatternFill('solid', fgColor='4472C4')
header_align = Alignment(horizontal='center', vertical='center')

# Alternating rows
light_fill = PatternFill('solid', fgColor='D9E2F3')

# Totais
total_fill = PatternFill('solid', fgColor='FFC000')
total_font = Font(bold=True)

# Bordas
thin_border = Border(
    left=Side(style='thin'), right=Side(style='thin'),
    top=Side(style='thin'), bottom=Side(style='thin')
)
```

### Formatos Numericos
```python
# Moeda
cell.number_format = '$#,##0.00'
# Percentual
cell.number_format = '0.0%'
# Data
cell.number_format = 'yyyy-mm-dd'
# Milhares
cell.number_format = '#,##0'
# Contabil
cell.number_format = '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)'
```

---

## Batch Operations (Datasets Grandes)

```python
# ✅ Rapido — batch write
data = [...]  # Lista de listas
for i, row in enumerate(data):
    for j, val in enumerate(row):
        sheet.cell(row=i+2, column=j+1, value=val)

# ❌ Lento — estilizar celula a celula em loop
# Aplicar estilo em range inteiro:
for row in sheet.iter_rows(min_row=2, max_row=len(data)+1, max_col=len(headers)):
    for cell in row:
        cell.font = Font(size=10)
```

---

## Best Practices

### openpyxl
- Indices 1-based (row=1, col=1 = A1)
- `data_only=True` para ler valores calculados (CUIDADO: perde formulas ao salvar)
- `read_only=True` / `write_only=True` para arquivos grandes
- Formulas NAO sao avaliadas — usar recalc.py

### pandas
- Especificar dtypes: `pd.read_excel('f.xlsx', dtype={'id': str})`
- Colunas especificas: `usecols=['A', 'C', 'E']`
- Datas: `parse_dates=['date_column']`

### Geral
- SEMPRE salvar em arquivo NOVO (nunca sobrescrever o original)
- SEMPRE recalcular com recalc.py apos adicionar formulas
- Codigo Python conciso, sem prints desnecessarios
- Comentarios em celulas com formulas complexas
