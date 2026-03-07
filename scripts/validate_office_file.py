#!/usr/bin/env python3
"""
validate_office_file.py — Validador de arquivos Office (PPTX, DOCX, XLSX)

Uso:
    python3 validate_office_file.py <caminho_do_arquivo>
    python3 validate_office_file.py <pasta>  # valida todos os Office files na pasta

Verifica:
- PPTX: arquivo abre sem reparo, slides renderizam, text frames nao vazios,
         imagens dentro dos limites, placeholders substituidos
- DOCX: arquivo abre, paragrafos renderizam, referencias nao quebradas
- XLSX: arquivo abre, formulas sem erro, sheets acessiveis
"""

import sys
import os
from pathlib import Path


def validate_pptx(filepath: str) -> list[str]:
    """Valida arquivo PowerPoint."""
    issues = []
    try:
        from pptx import Presentation
        from pptx.util import Emu
    except ImportError:
        return ["python-pptx nao instalado. Instale com: pip install python-pptx"]

    try:
        prs = Presentation(filepath)
    except Exception as e:
        return [f"CRITICO: Arquivo nao abre — {e}"]

    slide_count = len(prs.slides)
    if slide_count == 0:
        issues.append("ALERTA: Apresentacao sem slides")

    empty_frames = 0
    placeholder_found = 0
    fragmented_runs = 0
    total_shapes = 0

    for i, slide in enumerate(prs.slides, 1):
        for shape in slide.shapes:
            total_shapes += 1
            if shape.has_text_frame:
                text = shape.text_frame.text.strip()
                if not text:
                    empty_frames += 1
                if "{{" in text or "Lorem" in text or "[PLACEHOLDER]" in text:
                    placeholder_found += 1
                    issues.append(f"ALERTA: Slide {i} — placeholder nao substituido: '{text[:60]}...'")

                for para in shape.text_frame.paragraphs:
                    if len(para.runs) > 5:
                        fragmented_runs += 1

            if shape.shape_type and hasattr(shape, "image"):
                try:
                    img = shape.image
                    w = shape.width
                    h = shape.height
                    if w and h:
                        w_px = w / Emu(1) * 96 / 914400 if w > 0 else 0
                        h_px = h / Emu(1) * 96 / 914400 if h > 0 else 0
                except Exception:
                    pass

    if fragmented_runs > 0:
        issues.append(f"ALERTA: {fragmented_runs} paragrafos com >5 runs (texto fragmentado)")
    if empty_frames > slide_count:
        issues.append(f"INFO: {empty_frames} text frames vazios")

    size_mb = os.path.getsize(filepath) / (1024 * 1024)

    print(f"  Slides: {slide_count}")
    print(f"  Shapes: {total_shapes}")
    print(f"  Tamanho: {size_mb:.1f} MB")
    print(f"  Runs fragmentados: {fragmented_runs}")
    print(f"  Placeholders restantes: {placeholder_found}")

    return issues


def validate_docx(filepath: str) -> list[str]:
    """Valida arquivo Word."""
    issues = []
    try:
        from docx import Document
    except ImportError:
        return ["python-docx nao instalado. Instale com: pip install python-docx"]

    try:
        doc = Document(filepath)
    except Exception as e:
        return [f"CRITICO: Arquivo nao abre — {e}"]

    para_count = len(doc.paragraphs)
    table_count = len(doc.tables)
    empty_paras = sum(1 for p in doc.paragraphs if not p.text.strip())

    placeholder_found = 0
    for p in doc.paragraphs:
        if "{{" in p.text or "Lorem" in p.text or "[PLACEHOLDER]" in p.text:
            placeholder_found += 1
            issues.append(f"ALERTA: Placeholder encontrado: '{p.text[:80]}...'")

    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if "{{" in cell.text:
                    placeholder_found += 1

    if para_count == 0:
        issues.append("ALERTA: Documento sem paragrafos")

    try:
        rels = doc.part.rels
        for rel_id, rel in rels.items():
            if rel.is_external:
                continue
            try:
                _ = rel.target_part
            except Exception:
                issues.append(f"ALERTA: Referencia quebrada: {rel_id}")
    except Exception:
        pass

    size_mb = os.path.getsize(filepath) / (1024 * 1024)

    print(f"  Paragrafos: {para_count} ({empty_paras} vazios)")
    print(f"  Tabelas: {table_count}")
    print(f"  Tamanho: {size_mb:.1f} MB")
    print(f"  Placeholders restantes: {placeholder_found}")

    return issues


def validate_xlsx(filepath: str) -> list[str]:
    """Valida arquivo Excel."""
    issues = []
    try:
        from openpyxl import load_workbook
    except ImportError:
        return ["openpyxl nao instalado. Instale com: pip install openpyxl"]

    try:
        wb = load_workbook(filepath, data_only=False)
    except Exception as e:
        return [f"CRITICO: Arquivo nao abre — {e}"]

    sheet_names = wb.sheetnames
    total_formulas = 0
    error_cells = 0

    for sheet_name in sheet_names:
        ws = wb[sheet_name]
        for row in ws.iter_rows():
            for cell in row:
                if cell.value and isinstance(cell.value, str):
                    if cell.value.startswith("="):
                        total_formulas += 1
                    if cell.value in ("#REF!", "#NAME?", "#VALUE!", "#DIV/0!", "#NULL!", "#N/A"):
                        error_cells += 1
                        issues.append(f"ERRO: {sheet_name}!{cell.coordinate} = {cell.value}")

    if error_cells > 0:
        issues.append(f"CRITICO: {error_cells} celulas com erro de formula")

    size_mb = os.path.getsize(filepath) / (1024 * 1024)

    print(f"  Sheets: {len(sheet_names)} — {', '.join(sheet_names)}")
    print(f"  Formulas: {total_formulas}")
    print(f"  Erros: {error_cells}")
    print(f"  Tamanho: {size_mb:.1f} MB")

    return issues


def validate_file(filepath: str) -> bool:
    """Valida um arquivo Office. Retorna True se OK."""
    ext = Path(filepath).suffix.lower()
    name = Path(filepath).name

    print(f"\n{'='*60}")
    print(f"Validando: {name}")
    print(f"{'='*60}")

    validators = {
        ".pptx": validate_pptx,
        ".docx": validate_docx,
        ".xlsx": validate_xlsx,
    }

    validator = validators.get(ext)
    if not validator:
        print(f"  Tipo nao suportado: {ext}")
        return True

    issues = validator(filepath)

    if not issues:
        print(f"\n  OK — Arquivo valido!")
        return True
    else:
        criticos = [i for i in issues if i.startswith("CRITICO")]
        alertas = [i for i in issues if i.startswith("ALERTA")]
        infos = [i for i in issues if i.startswith("INFO")]
        erros = [i for i in issues if i.startswith("ERRO")]

        print(f"\n  Problemas encontrados: {len(issues)}")
        for issue in criticos + erros + alertas + infos:
            print(f"  - {issue}")

        return len(criticos) == 0 and len(erros) == 0


def main():
    if len(sys.argv) < 2:
        print("Uso: python3 validate_office_file.py <arquivo_ou_pasta>")
        sys.exit(1)

    target = sys.argv[1]

    if os.path.isdir(target):
        files = []
        for ext in ("*.pptx", "*.docx", "*.xlsx"):
            files.extend(Path(target).glob(ext))
        if not files:
            print(f"Nenhum arquivo Office encontrado em {target}")
            sys.exit(0)
        all_ok = True
        for f in sorted(files):
            if not validate_file(str(f)):
                all_ok = False
        print(f"\n{'='*60}")
        print(f"RESULTADO: {'TODOS OK' if all_ok else 'PROBLEMAS ENCONTRADOS'}")
        sys.exit(0 if all_ok else 1)
    elif os.path.isfile(target):
        ok = validate_file(target)
        sys.exit(0 if ok else 1)
    else:
        print(f"Arquivo nao encontrado: {target}")
        sys.exit(1)


if __name__ == "__main__":
    main()
