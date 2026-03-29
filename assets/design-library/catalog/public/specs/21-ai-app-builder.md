---
id: ai-app-builder
name: AI App Builder (VibeCoding)
category: AI
source: raiz-platform
complexity: Muito Alta
tags: [vibecoding, wizard, ai-build, pipeline, preview, deploy]
---

# AI App Builder

## What it solves
Guided wizard that collects intent → generates app spec → executes multi-step AI build pipeline → shows live preview → deploys.

## Best implementations
- `~/Claude/GitHub/raiz-platform/src/components/vibecoding/VibeCodingExecutionView.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/vibecoding/VibeCodingWizard.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/vibecoding/EmbeddedApp.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/vibecoding/VibeCodingProgress.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/vibecoding/VibeCodingDecisionCard.tsx`

## Key features
- **Intent wizard**: guided form to collect what to build
- **Spec generation**: AI generates full app specification
- **Multi-step pipeline**: real-time step progress tracker
- **Decision checkpoints**: human-in-the-loop decisions during build
- **Embedded preview**: live iframe of the generated app
- **Deploy to cloud**: one-click deployment of result

## Types
```ts
interface VibeCodingExecutionViewProps {
  projectId: string;
  onClose: (consolidatedPrompt?: string) => void;
}

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; name: string; formInput: VibeCodingFormInput };
```

## Dependencies
- AI build pipeline service
- iframe for embedded preview
