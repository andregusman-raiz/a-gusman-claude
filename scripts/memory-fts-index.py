#!/usr/bin/env python3
"""
memory-fts-index.py — SQLite FTS5 index dos memory files.

Usage:
    memory-fts-index.py reindex          # incremental: so reindex se mtime mudou
    memory-fts-index.py reindex --full   # full rebuild
    memory-fts-index.py search "query"   # top 5 hits com snippets
    memory-fts-index.py stats            # contagem + ultima reindexacao

Path do DB: ~/.claude/memory.db
Path dos memories: ~/.claude/projects/-Users-andregusmandeoliveira-Claude/memory/

Inspirado no claude-mem (que usa SQLite FTS5 + Chroma). Aqui so FTS5 — sem embeddings,
sem custo de tokens, sub-segundo em search.
"""
from __future__ import annotations

import argparse
import os
import sqlite3
import sys
from pathlib import Path

HOME = Path.home()
MEMORY_DIR = HOME / ".claude/projects/-Users-andregusmandeoliveira-Claude/memory"
DB_PATH = HOME / ".claude/memory.db"


def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
            name UNINDEXED,
            path UNINDEXED,
            mtime UNINDEXED,
            content,
            tokenize='porter unicode61'
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    conn.commit()
    return conn


def reindex(full: bool = False) -> dict:
    if not MEMORY_DIR.exists():
        return {"error": f"memory dir nao existe: {MEMORY_DIR}"}

    conn = get_conn()

    if full:
        conn.execute("DELETE FROM memory_fts")
        conn.commit()

    existing = {row[0]: row[1] for row in conn.execute("SELECT path, mtime FROM memory_fts")}
    indexed = updated = skipped = 0

    files = list(MEMORY_DIR.glob("*.md"))
    for f in files:
        path = str(f)
        mtime = str(int(f.stat().st_mtime))

        if path in existing and existing[path] == mtime:
            skipped += 1
            continue

        try:
            content = f.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            print(f"[skip] {f.name}: {e}", file=sys.stderr)
            continue

        if path in existing:
            conn.execute("DELETE FROM memory_fts WHERE path = ?", (path,))
            updated += 1
        else:
            indexed += 1

        conn.execute(
            "INSERT INTO memory_fts (name, path, mtime, content) VALUES (?, ?, ?, ?)",
            (f.stem, path, mtime, content),
        )

    # Detectar files removidos
    removed = 0
    fs_paths = {str(f) for f in files}
    for path in list(existing):
        if path not in fs_paths:
            conn.execute("DELETE FROM memory_fts WHERE path = ?", (path,))
            removed += 1

    conn.execute(
        "INSERT OR REPLACE INTO meta (key, value) VALUES ('last_reindex', strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))"
    )
    conn.commit()
    conn.close()

    return {"indexed": indexed, "updated": updated, "skipped": skipped, "removed": removed}


def search(query: str, limit: int = 5) -> list[dict]:
    if not DB_PATH.exists():
        return []
    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT
                name,
                path,
                snippet(memory_fts, 3, '**', '**', '...', 20) AS snip,
                rank
            FROM memory_fts
            WHERE memory_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (query, limit),
        ).fetchall()
    except sqlite3.OperationalError as e:
        print(f"[query syntax error] {e}", file=sys.stderr)
        return []
    finally:
        conn.close()
    return [{"name": r[0], "path": r[1], "snippet": r[2], "rank": r[3]} for r in rows]


def stats() -> dict:
    if not DB_PATH.exists():
        return {"db": "nao existe — rode 'reindex' primeiro"}
    conn = get_conn()
    count = conn.execute("SELECT COUNT(*) FROM memory_fts").fetchone()[0]
    last = conn.execute("SELECT value FROM meta WHERE key = 'last_reindex'").fetchone()
    conn.close()
    return {
        "db_path": str(DB_PATH),
        "indexed_files": count,
        "last_reindex": last[0] if last else "never",
        "memory_dir": str(MEMORY_DIR),
    }


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_reindex = sub.add_parser("reindex")
    p_reindex.add_argument("--full", action="store_true")

    p_search = sub.add_parser("search")
    p_search.add_argument("query")
    p_search.add_argument("--limit", type=int, default=5)

    sub.add_parser("stats")

    args = parser.parse_args()

    if args.cmd == "reindex":
        result = reindex(full=args.full)
        if "error" in result:
            print(f"[error] {result['error']}", file=sys.stderr)
            sys.exit(1)
        print(
            f"[reindex] indexed={result['indexed']} updated={result['updated']} "
            f"skipped={result['skipped']} removed={result['removed']}"
        )
    elif args.cmd == "search":
        results = search(args.query, args.limit)
        if not results:
            print("(no results)")
            return
        for i, r in enumerate(results, 1):
            print(f"\n[{i}] {r['name']}")
            print(f"    {r['path']}")
            print(f"    {r['snippet'].replace(chr(10), ' ')}")
    elif args.cmd == "stats":
        result = stats()
        for k, v in result.items():
            print(f"{k}: {v}")


if __name__ == "__main__":
    main()
