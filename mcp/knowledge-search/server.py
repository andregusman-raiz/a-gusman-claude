"""
Knowledge Search — MCP Server (Generic)
Funciona com qualquer projeto que tenha knowledge-config.json + knowledge.db.

Config no .mcp.json:
{
  "mcpServers": {
    "knowledge": {
      "command": "python",
      "args": ["D:/.claude/mcp/knowledge-search/server.py"],
      "env": { "KNOWLEDGE_DB": "<project>/knowledge.db" }
    }
  }
}
"""
import json
import os
import sys

from mcp.server.fastmcp import FastMCP

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import get_connection, search, search_filtered, get_document, get_related, get_stats

DB_PATH = os.environ.get("KNOWLEDGE_DB", "knowledge.db")

mcp = FastMCP(
    "knowledge-search",
    instructions="Busca full-text em base de conhecimento local via SQLite FTS5"
)


def _get_conn():
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"DB nao encontrado: {DB_PATH}. Execute ingest.py primeiro.")
    return get_connection(DB_PATH)


@mcp.tool()
def search_knowledge(
    query: str,
    category: str = "",
    limit: int = 20
) -> str:
    """Busca full-text na base de conhecimento. Suporta operadores FTS5: AND, OR, NOT, "frase exata".

    Args:
        query: Texto para buscar
        category: Filtrar por categoria (ex: mensagem, contrato, evento, markdown, readme, adr, spec, problema, evidencia, pessoa)
        limit: Maximo de resultados (default 20)
    """
    conn = _get_conn()
    try:
        results = search(conn, query, category=category or None, limit=limit)
        # Truncar content para economizar tokens
        for r in results:
            if r.get("content") and len(r["content"]) > 300:
                r["content"] = r["content"][:300] + "..."
        return json.dumps({"total": len(results), "documents": results}, ensure_ascii=False, indent=2)
    finally:
        conn.close()


@mcp.tool()
def search_with_filters(
    query: str,
    filters: str = "{}",
    limit: int = 20
) -> str:
    """Busca com filtros em campos do metadata via json_extract.

    Args:
        query: Texto para buscar
        filters: JSON string com filtros. Campos diretos usam LIKE. Sufixos: __eq (=), __gte (>=), __lte (<=).
                 Campos especiais: category, source (filtram na tabela principal).
                 Ex: {"category": "mensagem", "remetente_id": "Adriana", "datetime_iso__gte": "2025-01-01"}
        limit: Maximo de resultados (default 20)
    """
    conn = _get_conn()
    try:
        filter_dict = json.loads(filters) if filters else {}
        results = search_filtered(conn, query, filters=filter_dict, limit=limit)
        for r in results:
            if r.get("content") and len(r["content"]) > 300:
                r["content"] = r["content"][:300] + "..."
        return json.dumps({"total": len(results), "documents": results}, ensure_ascii=False, indent=2)
    finally:
        conn.close()


@mcp.tool()
def get_full_document(
    doc_id: str
) -> str:
    """Retorna o documento completo (sem truncar) dado seu ID.

    Args:
        doc_id: ID do documento (ex: dossier:msg:conversa_001:msg_00042, md:docs/README.md)
    """
    conn = _get_conn()
    try:
        doc = get_document(conn, doc_id)
        if not doc:
            return json.dumps({"error": f"Documento '{doc_id}' nao encontrado"})
        return json.dumps(doc, ensure_ascii=False, indent=2)
    finally:
        conn.close()


@mcp.tool()
def get_context(
    doc_id: str,
    window: int = 5
) -> str:
    """Retorna documentos adjacentes do mesmo grupo (ex: mensagens da mesma conversa, secoes do mesmo arquivo).

    Args:
        doc_id: ID do documento central
        window: Quantos documentos antes/depois retornar (default 5)
    """
    conn = _get_conn()
    try:
        result = get_related(conn, doc_id, window=window)
        # Truncar content nos adjacentes
        for key in ("antes", "depois"):
            for r in result.get(key, []):
                if r.get("content") and len(r["content"]) > 200:
                    r["content"] = r["content"][:200] + "..."
        return json.dumps(result, ensure_ascii=False, indent=2)
    finally:
        conn.close()


@mcp.tool()
def knowledge_stats() -> str:
    """Estatisticas da base de conhecimento: total de documentos, contagem por categoria e source, data da ultima ingestao."""
    conn = _get_conn()
    try:
        stats = get_stats(conn)
        return json.dumps(stats, ensure_ascii=False, indent=2)
    finally:
        conn.close()


if __name__ == "__main__":
    mcp.run(transport="stdio")
