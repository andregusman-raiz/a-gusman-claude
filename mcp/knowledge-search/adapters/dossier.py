"""
Adapter: Dossier Raiz vs Arco
Extrai mensagens, eventos, contratos, problemas e evidencias dos JSONs estruturados.
Adapter especifico — usa o schema do pipeline de 8 scripts.
"""
import json
import os
from datetime import datetime


class DossierAdapter:
    def __init__(self, config: dict):
        self.include = config.get("include", ["mensagens", "eventos", "contratos", "problemas", "evidencias", "pessoas"])

    def extract(self, base_dir: str) -> list[dict]:
        docs = []
        now = datetime.now().isoformat()

        if "mensagens" in self.include:
            docs.extend(self._extract_mensagens(base_dir, now))
        if "eventos" in self.include:
            docs.extend(self._extract_eventos(base_dir, now))
        if "contratos" in self.include:
            docs.extend(self._extract_contratos(base_dir, now))
        if "problemas" in self.include:
            docs.extend(self._extract_problemas(base_dir, now))
        if "evidencias" in self.include:
            docs.extend(self._extract_evidencias(base_dir, now))
        if "pessoas" in self.include:
            docs.extend(self._extract_pessoas(base_dir, now))

        return docs

    def _load_json(self, path: str):
        if not os.path.exists(path):
            return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _extract_mensagens(self, base_dir: str, now: str) -> list[dict]:
        docs = []
        ind_dir = os.path.join(base_dir, "dados_intermediarios", "conversas", "individuais")
        if not os.path.isdir(ind_dir):
            return docs

        for filename in sorted(os.listdir(ind_dir)):
            if not filename.endswith(".json"):
                continue
            data = self._load_json(os.path.join(ind_dir, filename))
            if not data:
                continue

            conversa_id = data["conversa_id"]
            nome_conversa = data.get("nome_conversa", "")

            for msg in data.get("mensagens", []):
                if msg.get("tipo") == "sistema":
                    continue
                conteudo = msg.get("conteudo", "")
                if not conteudo or len(conteudo.strip()) < 3:
                    continue

                docs.append({
                    "id": f"dossier:msg:{conversa_id}:{msg['id']}",
                    "source": "dossier",
                    "category": "mensagem",
                    "title": f"{msg.get('remetente_id', '')} - {nome_conversa}",
                    "content": conteudo,
                    "metadata": {
                        "conversa_id": conversa_id,
                        "msg_id": msg["id"],
                        "remetente_id": msg.get("remetente_id", ""),
                        "datetime_iso": msg.get("datetime_iso", ""),
                        "tipo": msg.get("tipo", "texto"),
                        "tags": msg.get("tags", []),
                        "group_id": conversa_id,
                        "sort_key": msg.get("datetime_iso", ""),
                    },
                    "indexed_at": now,
                })

        return docs

    def _extract_eventos(self, base_dir: str, now: str) -> list[dict]:
        data = self._load_json(os.path.join(base_dir, "dados_intermediarios", "timeline", "timeline_eventos.json"))
        if not data:
            return []

        docs = []
        for evt in data.get("eventos", []):
            fonte = evt.get("fonte", {})
            docs.append({
                "id": f"dossier:evt:{evt['id']}",
                "source": "dossier",
                "category": "evento",
                "title": evt.get("titulo", ""),
                "content": evt.get("descricao", ""),
                "metadata": {
                    "data": evt.get("data", ""),
                    "datetime_iso": evt.get("datetime_iso", ""),
                    "tipo": evt.get("tipo", ""),
                    "gravidade": evt.get("gravidade", ""),
                    "problema_relacionado": evt.get("problema_relacionado"),
                    "pessoas_envolvidas": evt.get("pessoas_envolvidas", []),
                    "fonte_conversa_id": fonte.get("conversa_id", ""),
                    "group_id": "timeline",
                    "sort_key": evt.get("datetime_iso", ""),
                },
                "indexed_at": now,
            })
        return docs

    def _extract_contratos(self, base_dir: str, now: str) -> list[dict]:
        for path in [
            os.path.join(base_dir, "contratos", "output", "chunks.json"),
            "D:/RAG/output/chunks.json",
        ]:
            data = self._load_json(path)
            if data:
                break
        else:
            return []

        docs = []
        for chunk in data:
            meta = chunk.get("metadados", {})
            docs.append({
                "id": f"dossier:contrato:{chunk['id']}",
                "source": "dossier",
                "category": "contrato",
                "title": meta.get("descricao", chunk.get("documento_origem", "")),
                "content": chunk.get("texto", ""),
                "metadata": {
                    "documento_origem": chunk.get("documento_origem", ""),
                    "tipo": meta.get("tipo", ""),
                    "categoria": meta.get("categoria", ""),
                    "group_id": chunk.get("documento_origem", "contratos"),
                    "sort_key": chunk["id"],
                },
                "indexed_at": now,
            })
        return docs

    def _extract_problemas(self, base_dir: str, now: str) -> list[dict]:
        data = self._load_json(os.path.join(base_dir, "dados_intermediarios", "classificacao", "problemas_classificados.json"))
        if not data:
            return []

        docs = []
        for prob in data.get("problemas", []):
            docs.append({
                "id": f"dossier:prob:{prob['id']}",
                "source": "dossier",
                "category": "problema",
                "title": prob.get("titulo", ""),
                "content": prob.get("descricao", ""),
                "metadata": {
                    "categoria": prob.get("categoria", ""),
                    "subcategoria": prob.get("subcategoria", ""),
                    "gravidade": prob.get("gravidade", ""),
                    "group_id": "problemas",
                    "sort_key": prob["id"],
                },
                "indexed_at": now,
            })
        return docs

    def _extract_evidencias(self, base_dir: str, now: str) -> list[dict]:
        data = self._load_json(os.path.join(base_dir, "dados_intermediarios", "evidencias", "cadeias_evidencia.json"))
        if not data:
            return []

        docs = []
        for cadeia in data.get("cadeias", []):
            periodo = cadeia.get("periodo", {})
            docs.append({
                "id": f"dossier:evid:{cadeia['id']}",
                "source": "dossier",
                "category": "evidencia",
                "title": cadeia.get("titulo_problema", ""),
                "content": cadeia.get("resumo_executivo", ""),
                "metadata": {
                    "problema_id": cadeia.get("problema_id", ""),
                    "categoria": cadeia.get("categoria", ""),
                    "forca": cadeia.get("forca", ""),
                    "periodo_inicio": periodo.get("inicio", ""),
                    "periodo_fim": periodo.get("fim", ""),
                    "group_id": "evidencias",
                    "sort_key": cadeia["id"],
                },
                "indexed_at": now,
            })
        return docs

    def _extract_pessoas(self, base_dir: str, now: str) -> list[dict]:
        data = self._load_json(os.path.join(base_dir, "dados_intermediarios", "pessoas", "registro_pessoas.json"))
        if not data:
            return []

        docs = []
        for p in data:
            variantes = p.get("nomes_variantes", [])
            cargos_raw = p.get("cargos", [])
            cargos = [c if isinstance(c, str) else str(c.get("cargo", c.get("titulo", str(c)))) for c in cargos_raw]
            content = f"{p['nome_canonico']}. Variantes: {', '.join(str(v) for v in variantes)}. Cargos: {', '.join(cargos)}."
            docs.append({
                "id": f"dossier:pessoa:{p['id']}",
                "source": "dossier",
                "category": "pessoa",
                "title": p["nome_canonico"],
                "content": content,
                "metadata": {
                    "empresa_id": p.get("empresa_id", ""),
                    "conversas": p.get("conversas", []),
                    "group_id": "pessoas",
                    "sort_key": p["id"],
                },
                "indexed_at": now,
            })
        return docs
