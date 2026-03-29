---
id: workflow-builder
name: BPMN Workflow Designer (React Flow)
category: workflow
source: ticket-raiz
complexity: very-high
---

# BPMN Workflow Designer

## What it solves
Visual process designer for building automation workflows with drag-and-drop nodes, connections, validation, and BPMN XML import/export.

## Best implementation
- **Designer**: `~/Claude/GitHub/ticket-raiz/src/components/bpms/designer/process-designer.tsx`
- **Nodes**: `nodes/node-start.tsx`, `node-end.tsx`, `node-task.tsx`, `node-gateway.tsx`, `node-ai-task.tsx`, `node-script-task.tsx`, `node-timer.tsx`
- **Hooks**: `use-designer-autosave.ts`, `use-designer-history.ts`, `use-designer-shortcuts.ts`
- **Palette**: `element-palette.tsx`
- **Config Panel**: `node-config-panel.tsx`
- **Validation**: `validation-bar.tsx`

## Key features
- **9 custom node types**: start, end, task, XOR/AND/OR gateways, service, rule, AI agent, script, timer
- **Element palette**: drag-and-drop to canvas from side panel
- **Undo/redo**: history stack via `useDesignerHistory`
- **Autosave**: debounced to DB via `useDesignerAutosave`
- **Keyboard shortcuts**: Ctrl+Z/Y/S/Del/A via `useDesignerShortcuts`
- **Live validation bar**: highlights broken nodes with jump-to-element
- **BPMN XML import/export**: interop with standard tools
- **MiniMap**: overview navigation
- **Config panel**: opens on node click for per-node settings
- **Publish dialog**: version bump with changelog
- **State persistence**: `{ nodes, edges }` serialized to JSONB in DB

## Dependencies
- @xyflow/react (React Flow)
- Custom node components
- Database for persistence (designer_state JSONB)
