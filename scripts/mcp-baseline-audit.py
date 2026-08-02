#!/usr/bin/env python3
"""
mcp-baseline-audit.py — auditoria OFFLINE de superficie MCP + skills de terceiros.

Zero dependencias (stdlib), zero rede, nao executa nenhum MCP server.
Complementa ag-auditar-harness (HCS.injection cobre hooks/.sh e eval; este cobre
descricoes de tool/skill = prompt injection indireto e drift de config MCP).

Uso:
  mcp-baseline-audit.py                          # inventario + diff vs baseline
  mcp-baseline-audit.py --save-baseline          # grava/atualiza baseline
  mcp-baseline-audit.py --scan-skills <dir>      # varre SKILL.md de terceiros
  mcp-baseline-audit.py --json                   # saida machine-readable
  mcp-baseline-audit.py --strict                 # exit 2 se houver P0

Baseline: ~/.claude/state/mcp-baseline.json
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

HOME = Path.home()
BASELINE = HOME / ".claude" / "state" / "mcp-baseline.json"

CONFIG_CANDIDATES = [
    HOME / ".claude.json",
    HOME / ".claude" / "settings.json",
    HOME / "Claude" / ".mcp.json",
    HOME / "Claude" / ".claude" / "settings.json",
    HOME / "Claude" / ".claude" / "settings.local.json",
]

# Instrucoes enderecadas ao modelo dentro de texto que o modelo le como dado.
# Vetor: OWASP MCP03:2025 (tool poisoning) / MITRE ATLAS AML.T0051.001.
INJECTION_PATTERNS = [
    (r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions", "P0", "override de instrucao"),
    (r"disregard\s+(the\s+)?(system|previous)", "P0", "override de instrucao"),
    (r"do\s+not\s+(tell|inform|mention|reveal)\s+(the\s+)?user", "P0", "ocultacao do usuario"),
    (r"n[aã]o\s+(conte|informe|avise|mencione)\s+ao?\s+usu[aá]rio", "P0", "ocultacao do usuario"),
    (r"without\s+(telling|informing|asking)\s+the\s+user", "P0", "ocultacao do usuario"),
    (r"~/\.ssh|id_rsa|id_ed25519|\.aws/credentials|\.netrc", "P0", "acesso a segredo"),
    (r"(extract|dump|read|exfiltrat)\w*\s+[^\n]{0,30}keychain", "P1", "acesso a keychain"),
    (r"(cat|read|open|upload|send)\s+[^\n]{0,40}\.env\b", "P0", "leitura de .env"),
    (r"curl\s+[^\n]*-d\s|requests\.post\(|fetch\([\"'`]https?://", "P1", "exfiltracao potencial"),
    (r"<\s*(important|system|secret|hidden)\s*>", "P0", "bloco pseudo-sistema"),
    (r"\bsystem\s*:\s*you\s+(are|must)", "P0", "pseudo system prompt"),
    (r"you\s+must\s+(always\s+)?call\s+", "P1", "coercao de tool call"),
    (r"before\s+(using|calling)\s+any\s+other\s+tool", "P1", "sequestro de precedencia"),
    (r"\bantes\s+de\s+(usar|chamar)\s+qualquer\s+outra\s+(tool|ferramenta)", "P1", "sequestro de precedencia"),
]

# Caracteres invisiveis / bidi usados para esconder instrucao de revisor humano.
INVISIBLE = {
    "​": "ZWSP", "‌": "ZWNJ", "‍": "ZWJ", "⁠": "WJ",
    "﻿": "BOM", "᠎": "MVS",
    "‪": "LRE", "‫": "RLE", "‬": "PDF", "‭": "LRO", "‮": "RLO",
    "⁦": "LRI", "⁧": "RLI", "⁨": "FSI", "⁩": "PDI",
}

DESC_LEN_WARN = 2000  # descricao gigante e tell classico de poisoning


def finding(sev, kind, where, detail):
    return {"sev": sev, "kind": kind, "where": where, "detail": detail}


def _quoted_ranges(text: str) -> list[tuple[int, int]]:
    """Trechos que sao exemplo/demonstracao, nao instrucao ativa: fenced code,
    inline code e strings citadas. Match ali e rebaixado a P2 (revisar, nao bloquear)."""
    ranges = []
    for m in re.finditer(r"```.*?```|~~~.*?~~~", text, re.S):
        ranges.append(m.span())
    for m in re.finditer(r"`[^`\n]{1,400}`|\"[^\"\n]{1,400}\"|'[^'\n]{1,400}'", text):
        ranges.append(m.span())
    return ranges


def _inside(pos: int, ranges: list[tuple[int, int]]) -> bool:
    return any(a <= pos < b for a, b in ranges)


def scan_text(text: str, where: str) -> list[dict]:
    """Procura injecao indireta em texto que o modelo le como dado."""
    out = []
    low = text.lower()
    quoted = _quoted_ranges(text)
    for pat, sev, kind in INJECTION_PATTERNS:
        m = re.search(pat, low, re.IGNORECASE)
        if m:
            snippet = text[max(0, m.start() - 30): m.end() + 50].replace("\n", " ")
            if _inside(m.start(), quoted):
                sev, kind = "P2", f"{kind} (em exemplo/codigo)"
            out.append(finding(sev, kind, where, snippet.strip()[:160]))
    for ch, name in INVISIBLE.items():
        n = text.count(ch)
        if n:
            out.append(finding("P0", "caractere invisivel", where, f"{name} x{n} (texto escondido do revisor)"))
    # confusaveis: cirilico/grego misturado em texto latino (typosquat de tool name)
    scripts = set()
    for ch in text:
        if ch.isalpha():
            try:
                nm = unicodedata.name(ch)
            except ValueError:
                continue
            scripts.add(nm.split()[0])
    if "CYRILLIC" in scripts and "LATIN" in scripts:
        out.append(finding("P1", "homoglifo", where, "mistura CYRILLIC+LATIN (typosquat de nome)"))
    return out


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except Exception:
        return None


def collect_servers() -> tuple[dict, list[str]]:
    """Extrai apenas o bloco mcpServers de cada config. Nao le historico."""
    servers, sources = {}, []
    for cfg in CONFIG_CANDIDATES:
        if not cfg.exists():
            continue
        data = load_json(cfg)
        if not isinstance(data, dict):
            continue
        blocks = []
        if isinstance(data.get("mcpServers"), dict):
            blocks.append(data["mcpServers"])
        # ~/.claude.json guarda mcpServers tambem por projeto
        for proj in (data.get("projects") or {}).values():
            if isinstance(proj, dict) and isinstance(proj.get("mcpServers"), dict):
                blocks.append(proj["mcpServers"])
        found = False
        for block in blocks:
            for name, spec in block.items():
                if isinstance(spec, dict):
                    servers.setdefault(name, {"spec": spec, "source": str(cfg)})
                    found = True
        if found:
            sources.append(str(cfg))
    return servers, sources


def normalize(spec: dict) -> str:
    """Assinatura estavel: o que muda aqui muda a superficie de execucao."""
    keep = {k: spec.get(k) for k in ("command", "args", "url", "type", "transport") if spec.get(k) is not None}
    keep["env_keys"] = sorted((spec.get("env") or {}).keys())
    keep["header_keys"] = sorted((spec.get("headers") or {}).keys())
    return json.dumps(keep, sort_keys=True, ensure_ascii=False)


def world_readable(path: str) -> bool:
    """Config com segredo so e P1 se outro usuario/processo puder ler.
    Com 0600 o segredo esta tao protegido quanto estaria num .env separado —
    mover para env var nao melhora nada e pode piorar (shell profile costuma ser 0644)."""
    try:
        import stat as _stat
        mode = Path(path).stat().st_mode
        return bool(mode & (_stat.S_IRGRP | _stat.S_IROTH))
    except OSError:
        return True


def audit_server(name: str, spec: dict, source: str) -> list[dict]:
    out = []
    where = f"mcp:{name}"
    exposed = world_readable(source)
    sev_secret = "P1" if exposed else "P2"
    perm_note = "legivel por outros (chmod 600)" if exposed else "arquivo ja 0600"
    cmd = spec.get("command") or ""
    args = spec.get("args") or []
    argstr = " ".join(str(a) for a in args)
    url = spec.get("url") or ""

    # Execucao de codigo remoto nao pinado a cada start do servidor
    if cmd in ("npx", "bunx", "pnpx", "uvx", "pipx"):
        pinned = re.search(r"@\d+\.\d+", argstr)
        if not pinned or "@latest" in argstr:
            out.append(finding("P1", "dep nao pinada", where,
                               f"{cmd} {argstr[:70]} — codigo remoto baixado a cada start; pin de versao ausente"))
    if re.search(r"\bcurl\b[^|]*\|\s*(sh|bash)", f"{cmd} {argstr}"):
        out.append(finding("P0", "curl|sh", where, "download+exec no start do servidor"))

    # Transporte
    if url.startswith("http://") and "localhost" not in url and "127.0.0.1" not in url:
        out.append(finding("P0", "transporte inseguro", where, f"HTTP sem TLS: {url[:70]}"))

    # Segredo em claro na config
    for k, v in (spec.get("env") or {}).items():
        if re.search(r"KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL", k, re.I) and isinstance(v, str):
            if v and not v.startswith("${") and len(v) > 12:
                out.append(finding(sev_secret, "segredo em claro", where,
                                   f"env {k} literal em {Path(source).name} — {perm_note}"))
    for k, v in (spec.get("headers") or {}).items():
        if re.search(r"authorization|api-?key|token", k, re.I) and isinstance(v, str) and not v.startswith("${"):
            out.append(finding(sev_secret, "segredo em claro", where,
                               f"header {k} literal em {Path(source).name} — {perm_note}"))

    out.extend(scan_text(f"{cmd} {argstr} {url}", where))
    return out


def scan_skill_dir(root: Path) -> tuple[list[dict], int]:
    """Varre SKILL.md de terceiros ANTES de instalar. Le description + corpo."""
    out, n = [], 0
    for skill in sorted(root.rglob("SKILL.md")):
        n += 1
        try:
            text = skill.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        rel = str(skill.relative_to(root)) if skill.is_relative_to(root) else str(skill)
        out.extend(scan_text(text, rel))
        m = re.search(r"^description:\s*(.+?)(?=^\w+:|\A---|^---)", text, re.M | re.S)
        if m and len(m.group(1)) > DESC_LEN_WARN:
            out.append(finding("P1", "description gigante", rel,
                               f"{len(m.group(1))} chars — carrega no contexto e esconde payload"))
    return out, n


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--save-baseline", action="store_true")
    ap.add_argument("--scan-skills", metavar="DIR")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--strict", action="store_true")
    a = ap.parse_args()

    findings: list[dict] = []
    report: dict = {}

    if a.scan_skills:
        root = Path(a.scan_skills).expanduser()
        if not root.is_dir():
            print(f"erro: {root} nao e diretorio", file=sys.stderr)
            return 1
        f, n = scan_skill_dir(root)
        findings += f
        report["skills_scanned"] = n
        report["skills_root"] = str(root)
    else:
        servers, sources = collect_servers()
        report["configs"] = sources
        report["servers"] = sorted(servers)
        current = {}
        for name, entry in sorted(servers.items()):
            spec, source = entry["spec"], entry["source"]
            sig = normalize(spec)
            current[name] = hashlib.sha256(sig.encode()).hexdigest()[:16]
            findings += audit_server(name, spec, source)

        old = load_json(BASELINE) or {}
        prev = old.get("servers", {})
        if prev:
            for name, h in current.items():
                if name not in prev:
                    findings.append(finding("P1", "servidor novo", f"mcp:{name}", "nao estava no baseline"))
                elif prev[name] != h:
                    findings.append(finding("P0", "config mudou", f"mcp:{name}",
                                            "comando/url/env mudou desde o baseline (rug pull de config)"))
            for name in prev:
                if name not in current:
                    findings.append(finding("P2", "servidor removido", f"mcp:{name}", "sumiu desde o baseline"))
        else:
            report["baseline"] = "ausente — rode --save-baseline para armar deteccao de rug pull"

        if a.save_baseline:
            BASELINE.parent.mkdir(parents=True, exist_ok=True)
            BASELINE.write_text(json.dumps({"servers": current}, indent=2, sort_keys=True) + "\n")
            report["baseline_written"] = str(BASELINE)

    order = {"P0": 0, "P1": 1, "P2": 2}
    findings.sort(key=lambda f: order.get(f["sev"], 3))
    report["findings"] = findings
    report["counts"] = {s: sum(1 for f in findings if f["sev"] == s) for s in ("P0", "P1", "P2")}

    if a.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        if "servers" in report:
            print(f"configs: {len(report.get('configs', []))} | servidores MCP: {len(report['servers'])}")
            print("  " + ", ".join(report["servers"]))
        if "skills_scanned" in report:
            print(f"skills varridas: {report['skills_scanned']} em {report['skills_root']}")
        if report.get("baseline"):
            print(f"baseline: {report['baseline']}")
        if report.get("baseline_written"):
            print(f"baseline gravado: {report['baseline_written']}")
        c = report["counts"]
        print(f"\nfindings: P0={c['P0']} P1={c['P1']} P2={c['P2']}")
        for f in findings[:60]:
            print(f"  [{f['sev']}] {f['kind']:<24} {f['where']}\n        {f['detail']}")
        if len(findings) > 60:
            print(f"  ... +{len(findings) - 60} (use --json)")

    if a.strict and report["counts"]["P0"]:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
