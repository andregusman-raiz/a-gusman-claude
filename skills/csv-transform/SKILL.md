---
name: csv-transform
description: "Limpar, validar e transformar arquivos CSV/TSV sujos. Headers errados, encoding quebrado, duplicatas, dados inconsistentes. Trigger quando usuario menciona CSV com problemas ou quer padronizar dados tabulares."
model: sonnet
argument-hint: "[clean|validate|transform|merge] [path]"
metadata:
  filePattern: "*.csv,*.tsv"
  bashPattern: "csv|tsv|tabular|limpeza|clean.*data"
  priority: 75
---

# CSV Transform Skill

Limpar, validar e transformar CSVs sujos em dados prontos para uso.

## Quick Reference

| Task | Tool | Command |
|------|------|---------|
| Diagnostico rapido | pandas + chardet | Ver secao abaixo |
| Encoding fix | chardet → pandas | `pd.read_csv(f, encoding=detected)` |
| Limpeza headers | pandas | `.columns.str.strip().str.lower()` |
| Duplicatas | pandas | `.drop_duplicates()` |
| Tipo de dados | pandas | `.astype()` + `pd.to_datetime()` |
| Merge CSVs | pandas | `pd.concat()` ou `.merge()` |
| Validacao | pandera | Schema validation |
| CLI preview | csvkit | `csvlook`, `csvstat` |

## Diagnostico Rapido

Sempre rodar antes de qualquer transformacao:

```python
import pandas as pd
import chardet

filepath = "data.csv"

# 1. Detectar encoding
with open(filepath, 'rb') as f:
    raw = f.read(10000)
    result = chardet.detect(raw)
    print(f"Encoding: {result['encoding']} (confidence: {result['confidence']:.0%})")

# 2. Detectar separador
with open(filepath, 'r', encoding=result['encoding'], errors='replace') as f:
    first_lines = [f.readline() for _ in range(5)]
    for sep_name, sep_char in [('comma', ','), ('semicolon', ';'), ('tab', '\t'), ('pipe', '|')]:
        counts = [line.count(sep_char) for line in first_lines]
        if min(counts) > 0 and max(counts) == min(counts):
            print(f"Separador: {sep_name} ({sep_char!r})")
            break

# 3. Carregar e diagnosticar
df = pd.read_csv(filepath, encoding=result['encoding'], sep=sep_char)
print(f"\nShape: {df.shape}")
print(f"Colunas: {list(df.columns)}")
print(f"\nTipos:\n{df.dtypes}")
print(f"\nNulls:\n{df.isnull().sum()}")
print(f"\nDuplicatas: {df.duplicated().sum()}")
print(f"\nAmostra:\n{df.head()}")
```

## Limpeza de Headers

```python
# Strip whitespace, lowercase, snake_case
import re

def clean_columns(df):
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(r'[^\w\s]', '', regex=True)
        .str.replace(r'\s+', '_', regex=True)
        .str.replace(r'_+', '_', regex=True)
        .str.strip('_')
    )
    return df

df = clean_columns(df)

# Renomear colunas especificas
df = df.rename(columns={
    'nome_completo': 'name',
    'data_nascimento': 'birth_date',
    'cpf_cnpj': 'document',
})
```

## Encoding Fix

```python
import chardet

# Detectar e converter
with open("broken.csv", 'rb') as f:
    detected = chardet.detect(f.read())

df = pd.read_csv("broken.csv", encoding=detected['encoding'])

# Encodings comuns no Brasil
# - utf-8: padrao moderno
# - latin-1 (iso-8859-1): legado Windows/Excel BR
# - cp1252: Windows BR com caracteres especiais
# - utf-8-sig: UTF-8 com BOM (Excel exporta assim)

# Forcar UTF-8 no export
df.to_csv("clean.csv", index=False, encoding='utf-8')
```

## Duplicatas

```python
# Detectar
dupes = df[df.duplicated(keep=False)]
print(f"Duplicatas: {len(dupes)}")

# Estrategias
df_no_dupes = df.drop_duplicates()                          # keep first (default)
df_no_dupes = df.drop_duplicates(keep='last')               # keep last
df_no_dupes = df.drop_duplicates(keep=False)                # remove all dupes
df_no_dupes = df.drop_duplicates(subset=['email'])           # by column
df_no_dupes = df.drop_duplicates(subset=['name', 'date'])    # by multiple columns

# Com log do que foi removido
removed = df[df.duplicated(subset=['email'], keep='first')]
print(f"Removidos: {len(removed)}")
removed.to_csv("duplicates_removed.csv", index=False)
```

## Tipos de Dados

```python
# Inferir e converter
df['price'] = pd.to_numeric(df['price'], errors='coerce')
df['quantity'] = df['quantity'].astype(int)
df['date'] = pd.to_datetime(df['date'], format='%d/%m/%Y', errors='coerce')
df['active'] = df['active'].map({'sim': True, 'nao': False, 'yes': True, 'no': False})

# Limpar valores monetarios BR
df['valor'] = (
    df['valor']
    .str.replace('R$', '', regex=False)
    .str.replace('.', '', regex=False)   # milhares
    .str.replace(',', '.', regex=False)  # decimal
    .str.strip()
    .astype(float)
)

# CPF/CNPJ — manter como string, limpar formatacao
df['cpf'] = df['cpf'].astype(str).str.replace(r'[.\-/]', '', regex=True).str.zfill(11)

# Telefone
df['phone'] = df['phone'].astype(str).str.replace(r'[^\d]', '', regex=True)
```

## Merge de CSVs

```python
# Concatenar (mesmo schema)
import glob
files = glob.glob("data/*.csv")
dfs = [pd.read_csv(f, encoding='utf-8') for f in files]
merged = pd.concat(dfs, ignore_index=True)

# Join (schemas diferentes, chave comum)
df1 = pd.read_csv("customers.csv")
df2 = pd.read_csv("orders.csv")
joined = df1.merge(df2, on='customer_id', how='left')

# Verificar resultado
print(f"df1: {len(df1)}, df2: {len(df2)}, joined: {len(joined)}")
```

## Validacao

```python
# Validacao manual
def validate(df):
    errors = []

    # Required columns
    required = ['name', 'email', 'date']
    missing = [c for c in required if c not in df.columns]
    if missing:
        errors.append(f"Colunas faltando: {missing}")

    # No nulls in required fields
    for col in required:
        if col in df.columns:
            nulls = df[col].isnull().sum()
            if nulls > 0:
                errors.append(f"{col}: {nulls} valores nulos")

    # Email format
    if 'email' in df.columns:
        invalid = df[~df['email'].str.contains(r'^[\w.+-]+@[\w-]+\.[\w.]+$', na=False)]
        if len(invalid) > 0:
            errors.append(f"Emails invalidos: {len(invalid)}")

    # Date range
    if 'date' in df.columns:
        future = df[pd.to_datetime(df['date'], errors='coerce') > pd.Timestamp.now()]
        if len(future) > 0:
            errors.append(f"Datas futuras: {len(future)}")

    return errors

errors = validate(df)
if errors:
    print("ERROS:")
    for e in errors:
        print(f"  - {e}")
else:
    print("OK — validacao passou")
```

### pandera (schema validation)
```python
import pandera as pa

schema = pa.DataFrameSchema({
    "name": pa.Column(str, nullable=False),
    "email": pa.Column(str, pa.Check.str_matches(r'^[\w.+-]+@[\w-]+\.[\w.]+$')),
    "age": pa.Column(int, pa.Check.in_range(0, 150)),
    "salary": pa.Column(float, pa.Check.greater_than(0), nullable=True),
})

validated = schema.validate(df)
```

## Export Limpo

```python
# CSV padrao
df.to_csv("clean_output.csv", index=False, encoding='utf-8')

# TSV
df.to_csv("clean_output.tsv", index=False, encoding='utf-8', sep='\t')

# Excel
df.to_excel("clean_output.xlsx", index=False, sheet_name='Data')

# JSON
df.to_json("clean_output.json", orient='records', force_ascii=False, indent=2)
```

## CLI Tools (csvkit)

```bash
pip install csvkit

# Preview formatado
csvlook data.csv | head -20

# Estatisticas
csvstat data.csv

# Filtrar colunas
csvcut -c name,email data.csv > subset.csv

# Filtrar linhas
csvgrep -c status -m "active" data.csv > active.csv

# SQL query no CSV
csvsql --query "SELECT name, COUNT(*) FROM data GROUP BY name" data.csv
```

## Regras de Uso

1. Sempre diagnosticar encoding e separador ANTES de processar
2. Manter CSV original intacto — salvar resultado em novo arquivo
3. Logar todas as transformacoes feitas (quantas linhas removidas, convertidas, etc.)
4. Para CSVs > 1GB, usar `chunksize` no pandas ou polars
5. Exportar sempre em UTF-8 sem BOM
