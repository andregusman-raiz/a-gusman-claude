---
id: rag-knowledge-base
name: RAG Knowledge Base Manager
category: AI
source: raiz-platform
complexity: Alta
tags: [rag, upload, documents, folders, polling, pipeline]
---

# RAG Knowledge Base Manager

## What it solves
Document upload, processing pipeline tracking, and folder organization for RAG (Retrieval-Augmented Generation) workflows.

## Best implementation
- `~/Claude/GitHub/raiz-platform/src/components/rag/RagPanel.tsx` (orchestrator)
- `~/Claude/GitHub/raiz-platform/src/components/rag/DocumentList.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/rag/DocumentUpload.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/rag/FolderStats.tsx`

## Key features
- **View state machine**: list vs folder view toggle
- **Auto-polling**: 3s interval while documents are pending/processing
- **Folder-scoped**: documents organized in folders with stats overlay
- **Status tracking**: pending → processing → active → failed
- **Search + filter**: text search + status filter (all/active/inactive)
- **Modals**: folder form, document upload, folder stats

## State
```ts
view: 'list' | 'folder'
folders: RagFolderResponse[]
selectedFolder: RagFolderResponse | null
documents: RagDocumentResponse[]
search: string
filter: 'all' | 'active' | 'inactive'
```

## Dependencies
- Custom folder/document API
- Polling via setInterval
