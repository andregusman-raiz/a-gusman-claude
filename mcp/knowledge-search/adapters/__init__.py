from .markdown import MarkdownAdapter
from .json_docs import JsonDocsAdapter
from .dossier import DossierAdapter

ADAPTERS = {
    "markdown": MarkdownAdapter,
    "json_docs": JsonDocsAdapter,
    "dossier": DossierAdapter,
}
