"""
Knowledge Search — Ingestao config-driven.

Uso:
    python ingest.py --config D:/Dossier_Arco/knowledge-config.json
    python ingest.py --config D:/Dossier_Arco/knowledge-config.json --stats
    python ingest.py --config D:/Dossier_Arco/knowledge-config.json --rebuild
"""
import argparse
import json
import os
import sys
from datetime import datetime

# Adicionar diretorio do script ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import get_connection, create_schema, rebuild_fts, insert_documents, get_stats
from adapters import ADAPTERS


def load_config(config_path: str) -> dict:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_ingest(config_path: str) -> dict:
    config = load_config(config_path)
    base_dir = config.get("base_dir", os.path.dirname(os.path.abspath(config_path)))
    db_path = config.get("db_path", os.path.join(base_dir, "knowledge.db"))

    # Resolver paths relativos
    if not os.path.isabs(db_path):
        db_path = os.path.join(base_dir, db_path)

    print(f"=== Knowledge Search - Ingestao ===")
    print(f"Config: {config_path}")
    print(f"Base:   {base_dir}")
    print(f"DB:     {db_path}")
    print()

    conn = get_connection(db_path)
    create_schema(conn)

    # Limpar docs existentes para re-ingestao completa
    conn.execute("DELETE FROM documents")
    conn.commit()

    results = {}
    sources = config.get("sources", [])

    for i, source_config in enumerate(sources, 1):
        adapter_type = source_config.get("type")
        if adapter_type not in ADAPTERS:
            print(f"[{i}/{len(sources)}] SKIP: adapter '{adapter_type}' desconhecido")
            continue

        adapter_class = ADAPTERS[adapter_type]
        adapter = adapter_class(source_config)

        source_dir = source_config.get("base_dir", base_dir)
        if not os.path.isabs(source_dir):
            source_dir = os.path.join(base_dir, source_dir)

        print(f"[{i}/{len(sources)}] {adapter_type}...")
        docs = adapter.extract(source_dir)
        count = insert_documents(conn, docs)
        results[f"{adapter_type}_{i}"] = count
        print(f"       -> {count} documentos")

    print()
    print("Reconstruindo indices FTS5...")
    rebuild_fts(conn)

    # Salvar metadata
    conn.execute(
        "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
        ("last_ingest", datetime.now().isoformat())
    )
    conn.execute(
        "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
        ("config_path", config_path)
    )
    conn.execute(
        "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
        ("ingest_results", json.dumps(results, ensure_ascii=False))
    )
    conn.commit()

    db_size = os.path.getsize(db_path) / (1024 * 1024)
    print(f"Concluido. DB: {db_size:.1f} MB")

    stats = get_stats(conn)
    print(f"Total: {stats['total_documents']} documentos")
    for cat, cnt in stats["by_category"].items():
        print(f"  {cat}: {cnt}")
    print()

    conn.close()
    return results


def main():
    parser = argparse.ArgumentParser(description="Knowledge Search - Ingestao")
    parser.add_argument("--config", required=True, help="Caminho do knowledge-config.json")
    parser.add_argument("--stats", action="store_true", help="Mostrar estatisticas do banco")
    parser.add_argument("--rebuild", action="store_true", help="Reconstruir indices FTS5")
    args = parser.parse_args()

    config = load_config(args.config)
    base_dir = config.get("base_dir", os.path.dirname(os.path.abspath(args.config)))
    db_path = config.get("db_path", os.path.join(base_dir, "knowledge.db"))
    if not os.path.isabs(db_path):
        db_path = os.path.join(base_dir, db_path)

    if args.stats:
        conn = get_connection(db_path)
        stats = get_stats(conn)
        print(json.dumps(stats, indent=2, ensure_ascii=False))
        conn.close()
        return

    if args.rebuild:
        conn = get_connection(db_path)
        rebuild_fts(conn)
        print("Indices FTS5 reconstruidos.")
        conn.close()
        return

    run_ingest(args.config)


if __name__ == "__main__":
    main()
