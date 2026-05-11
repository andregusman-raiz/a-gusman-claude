---
id: dragdrop-virtual-scroll
name: Kanban Board with Drag-Drop + Virtual Scroll Timeline
category: data-display
source: raiz-agent-dashboard
complexity: high
---

# Kanban + Virtual Scroll

## What it solves
Two patterns: (1) Drag-and-drop Kanban board with dependency visualization, (2) Virtualized timeline for thousands of events with filter pills.

## Best implementations
- **Kanban**: `~/Claude/projetos/raiz-agent-dashboard/src/components/kanban/KanbanBoard.tsx`
- **Column**: `~/Claude/projetos/raiz-agent-dashboard/src/components/kanban/KanbanColumn.tsx`
- **Card**: `~/Claude/projetos/raiz-agent-dashboard/src/components/kanban/KanbanCard.tsx`
- **Timeline**: `~/Claude/projetos/raiz-agent-dashboard/src/components/agents/AgentTimeline.tsx`

## Kanban features
- **@dnd-kit/core**: DndContext + SortableContext per column
- **Collision detection**: closestCorners strategy
- **Pointer sensor**: 5px activation distance (prevents accidental drags)
- **DragOverlay**: ghost card during drag
- **Optimistic updates**: Zustand store update first, API PATCH in background
- **Dependency overlay**: toggleable SVG lines between blocked tasks using getBoundingClientRect

## Virtual Scroll features
- **@tanstack/react-virtual**: useVirtualizer with estimateSize 56px
- **Filter pills**: toggle by event type with live counts
- **Full-text search**: applied before virtual window
- **translateY positioning**: only visible rows rendered

## Dependencies
- @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- @tanstack/react-virtual
- zustand (state management)
