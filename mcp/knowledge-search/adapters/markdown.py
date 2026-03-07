"""
Adapter: Markdown files
Indexa arquivos .md recursivamente. Cada arquivo vira um documento.
Arquivos grandes sao divididos por heading (## ou ###).
"""
import os
import re
from datetime import datetime


class MarkdownAdapter:
    def __init__(self, config: dict):
        self.paths = config.get("paths", ["*.md"])
        self.recursive = config.get("recursive", True)
        self.split_by_heading = config.get("split_by_heading", True)
        self.min_content_length = config.get("min_content_length", 20)

    def extract(self, base_dir: str) -> list[dict]:
        docs = []
        now = datetime.now().isoformat()

        for pattern in self.paths:
            files = self._find_files(base_dir, pattern)
            for filepath in files:
                rel_path = os.path.relpath(filepath, base_dir).replace("\\", "/")
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        content = f.read()
                except (UnicodeDecodeError, PermissionError):
                    continue

                if len(content.strip()) < self.min_content_length:
                    continue

                if self.split_by_heading and len(content) > 2000:
                    sections = self._split_sections(content)
                    for i, (heading, body) in enumerate(sections):
                        if len(body.strip()) < self.min_content_length:
                            continue
                        docs.append({
                            "id": f"md:{rel_path}:{i}",
                            "source": "markdown",
                            "category": self._categorize(rel_path),
                            "title": heading or os.path.basename(filepath),
                            "content": body.strip(),
                            "metadata": {
                                "file_path": rel_path,
                                "section_index": i,
                                "group_id": f"md:{rel_path}",
                                "sort_key": f"{i:04d}",
                            },
                            "indexed_at": now,
                        })
                else:
                    # Arquivo inteiro como um documento
                    title = self._extract_title(content) or os.path.basename(filepath)
                    docs.append({
                        "id": f"md:{rel_path}",
                        "source": "markdown",
                        "category": self._categorize(rel_path),
                        "title": title,
                        "content": content.strip(),
                        "metadata": {
                            "file_path": rel_path,
                            "group_id": f"md:{rel_path}",
                            "sort_key": "0000",
                        },
                        "indexed_at": now,
                    })

        return docs

    def _find_files(self, base_dir: str, pattern: str) -> list[str]:
        import glob
        if self.recursive:
            full_pattern = os.path.join(base_dir, "**", pattern)
            return glob.glob(full_pattern, recursive=True)
        else:
            full_pattern = os.path.join(base_dir, pattern)
            return glob.glob(full_pattern)

    def _split_sections(self, content: str) -> list[tuple[str, str]]:
        """Divide por headings ## ou ###."""
        parts = re.split(r'^(#{1,3}\s+.+)$', content, flags=re.MULTILINE)
        sections = []
        current_heading = ""
        current_body = ""

        for part in parts:
            if re.match(r'^#{1,3}\s+', part):
                if current_body.strip():
                    sections.append((current_heading, current_body))
                current_heading = part.strip().lstrip("#").strip()
                current_body = ""
            else:
                current_body += part

        if current_body.strip():
            sections.append((current_heading, current_body))

        return sections

    def _extract_title(self, content: str) -> str:
        match = re.match(r'^#\s+(.+)$', content, re.MULTILINE)
        return match.group(1).strip() if match else ""

    def _categorize(self, rel_path: str) -> str:
        lower = rel_path.lower()
        if "adr" in lower:
            return "adr"
        if "spec" in lower or "prd" in lower:
            return "spec"
        if "readme" in lower:
            return "readme"
        if "changelog" in lower:
            return "changelog"
        if "plan" in lower:
            return "plan"
        if "doc" in lower:
            return "doc"
        return "markdown"
