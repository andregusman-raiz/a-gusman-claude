"""
Adapter: JSON Documents
Indexa arquivos JSON com mapeamento configuravel de campos.
Suporta arrays de objetos e objetos aninhados.
"""
import json
import os
import glob
from datetime import datetime


class JsonDocsAdapter:
    def __init__(self, config: dict):
        self.path_pattern = config.get("path", "*.json")
        self.items_path = config.get("items_path", None)  # ex: "data", "items", None=root array
        self.id_field = config.get("id_field", "id")
        self.text_field = config.get("text_field", "content")
        self.title_field = config.get("title_field", "title")
        self.category = config.get("category", "json")
        self.metadata_fields = config.get("metadata_fields", [])
        self.group_field = config.get("group_field", None)
        self.sort_field = config.get("sort_field", None)
        self.min_content_length = config.get("min_content_length", 10)

    def extract(self, base_dir: str) -> list[dict]:
        docs = []
        now = datetime.now().isoformat()
        full_pattern = os.path.join(base_dir, self.path_pattern)
        files = glob.glob(full_pattern, recursive=True)

        for filepath in files:
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except (json.JSONDecodeError, UnicodeDecodeError, PermissionError):
                continue

            items = self._extract_items(data)
            rel_path = os.path.relpath(filepath, base_dir).replace("\\", "/")

            for i, item in enumerate(items):
                text = self._get_nested(item, self.text_field, "")
                if not text or len(str(text).strip()) < self.min_content_length:
                    continue

                item_id = self._get_nested(item, self.id_field, f"{rel_path}:{i}")
                title = self._get_nested(item, self.title_field, "")

                meta = {"file_path": rel_path}
                for field in self.metadata_fields:
                    val = self._get_nested(item, field, None)
                    if val is not None:
                        meta[field] = val

                if self.group_field:
                    meta["group_id"] = self._get_nested(item, self.group_field, rel_path)
                if self.sort_field:
                    meta["sort_key"] = str(self._get_nested(item, self.sort_field, f"{i:06d}"))

                docs.append({
                    "id": f"json:{self.category}:{item_id}",
                    "source": "json_docs",
                    "category": self.category,
                    "title": str(title),
                    "content": str(text),
                    "metadata": meta,
                    "indexed_at": now,
                })

        return docs

    def _extract_items(self, data) -> list:
        if self.items_path:
            obj = self._get_nested(data, self.items_path, [])
            return obj if isinstance(obj, list) else [obj]
        if isinstance(data, list):
            return data
        return [data]

    def _get_nested(self, obj, path: str, default=None):
        """Acessa campos aninhados: 'a.b.c' -> obj['a']['b']['c']."""
        parts = path.split(".")
        current = obj
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            elif isinstance(current, list):
                try:
                    current = current[int(part)]
                except (ValueError, IndexError):
                    return default
            else:
                return default
        return current
