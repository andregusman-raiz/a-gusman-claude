#!/usr/bin/env python3
"""Analyze agent session data from sessions.csv."""

import csv
import sys
from collections import Counter, defaultdict
from pathlib import Path

CSV_PATH = Path(__file__).parent.parent / "docs" / "ai-state" / "sessions.csv"

def analyze():
    if not CSV_PATH.exists():
        print("No sessions.csv found. No data to analyze.")
        return

    rows = []
    with open(CSV_PATH) as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        print("No session data yet.")
        return

    total = len(rows)
    by_agent = Counter(r["agent_id"] for r in rows)
    by_status = Counter(r["status"] for r in rows)
    total_tokens = sum(int(r.get("duration_tokens", 0) or 0) for r in rows)

    print(f"=== Session Analysis ({total} sessions) ===\n")

    print("--- By Agent ---")
    for agent, count in by_agent.most_common(10):
        fails = sum(1 for r in rows if r["agent_id"] == agent and r["status"] == "failed")
        rate = f" ({fails} failed)" if fails else ""
        print(f"  {agent}: {count}{rate}")

    print(f"\n--- By Status ---")
    for status, count in by_status.most_common():
        pct = count / total * 100
        print(f"  {status}: {count} ({pct:.0f}%)")

    print(f"\n--- Totals ---")
    print(f"  Total tokens: {total_tokens:,}")
    if total > 0:
        print(f"  Avg tokens/session: {total_tokens // total:,}")

    # Failure rate
    failures = by_status.get("failed", 0)
    if failures:
        print(f"\n--- Failure Analysis ---")
        fail_by_agent = Counter(
            r["agent_id"] for r in rows if r["status"] == "failed"
        )
        for agent, count in fail_by_agent.most_common(5):
            total_agent = by_agent[agent]
            rate = count / total_agent * 100
            print(f"  {agent}: {count}/{total_agent} ({rate:.0f}% failure rate)")

if __name__ == "__main__":
    analyze()
