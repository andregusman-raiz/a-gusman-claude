"""Briefing loader — auto-detecta JSON vs YAML, suporta stdin/file.

Uso:
    data = load_briefing("briefing.yaml")
    data = load_briefing("briefing.json")
    data = load_briefing(None)  # le de stdin
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional

import yaml


def load_briefing(path: Optional[str]) -> Dict[str, Any]:
    """Carrega briefing de path (JSON/YAML) ou stdin se path is None.

    Returns:
        dict com os campos do briefing.

    Raises:
        FileNotFoundError: se path informado nao existir.
        ValueError: se conteudo nao for JSON nem YAML valido, ou nao for dict.
    """
    if path is None:
        raw = sys.stdin.read()
        source = "<stdin>"
    else:
        p = Path(path).expanduser()
        if not p.exists():
            raise FileNotFoundError(f"briefing nao encontrado: {p}")
        raw = p.read_text(encoding="utf-8")
        source = str(p)

    if not raw or not raw.strip():
        raise ValueError(f"briefing vazio ({source})")

    return _parse(raw, source)


def _parse(raw: str, source: str) -> Dict[str, Any]:
    """Tenta JSON primeiro, depois YAML. Retorna dict."""
    # JSON eh subset estrito de YAML 1.2; tentamos JSON primeiro porque eh
    # mais rapido e tem mensagens de erro mais claras quando ha truncamento.
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        try:
            data = yaml.safe_load(raw)
        except yaml.YAMLError as exc:
            raise ValueError(
                f"briefing ({source}) nao eh JSON nem YAML valido: {exc}"
            ) from exc

    if not isinstance(data, dict):
        raise ValueError(
            f"briefing ({source}) deve ser objeto/dict no topo "
            f"(recebido: {type(data).__name__})"
        )
    return data


__all__ = ["load_briefing"]
