---
id: meeting-transcript-ai
name: Meeting Transcript + AI Summary
category: AI
source: raiz-platform
complexity: Alta
tags: [meeting, transcript, ai, speakers, timeline, audio]
---

# Meeting Transcript + AI Summary

## What it solves
Audio recording → transcription → speaker-separated timeline → AI-generated structured summaries in 5 formats.

## Best implementations
- `~/Claude/GitHub/raiz-platform/src/components/meet/TranscriptTimeline.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/meet/SummaryPanel.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/meet/AudioWaveform.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/meet/PipelineStepper.tsx`

## Key features
- **Speaker timeline**: color-coded segments (8-color palette), clickable timestamps
- **Inline editing**: edit text + reassign speaker per segment
- **Search**: query with next/prev navigation within transcript
- **5 summary formats**: Ata, Executive, Decisions, Pedagogical, Commercial
- **Format auto-detection**: type guards identify format → polymorphic rendering
- **Pipeline stepper**: upload → transcribe → identify speakers → summarize

## Props
```ts
interface TranscriptTimelineProps {
  segments: TranscriptSegment[];
  speakers: MeetSpeaker[];
  onEditSegment: (segmentIndex: number, patch: { text?: string; speaker_id?: string }) => void;
  onRenameSpeaker: (speakerId: string, displayName: string) => void;
}

interface SummaryPanelProps {
  summary: Record<string, unknown> | null;
  templateId: string | null;
  onEdit: (content: Record<string, unknown>) => void;
}
```

## Dependencies
- Audio recording API
- AI transcription + summary service
