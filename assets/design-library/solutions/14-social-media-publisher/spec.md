---
id: social-media-publisher
name: Social Media Publisher + Calendar
category: Tools
source: raiz-platform
complexity: Alta
tags: [social-media, calendar, scheduling, composer, multi-platform]
---

# Social Media Publisher

## What it solves
Multi-platform social media scheduling with content calendar and per-platform character limit enforcement.

## Best implementations
- `~/Claude/GitHub/raiz-platform/src/components/social-media/publishing/PostComposer.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/social-media/publishing/ContentCalendar.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/social-media/publishing/PlatformSelector.tsx`

## Key features
- **Per-platform char limits**: Twitter 280, Instagram 2200, LinkedIn 3000, Facebook 63206, TikTok 2200, YouTube 5000, Reddit 40000
- **Most-restrictive limit**: when multiple platforms selected, shows the smallest limit
- **Month-view calendar**: cells show post pills with platform icons + status dots
- **6 post statuses**: draft, pending_approval, approved, scheduled, published, failed — each color-coded
- **Approval workflow**: toggle `requiresApproval` per post

## Props
```ts
interface PostComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: CreatePostInput) => Promise<void>;
  initialPost?: Partial<ScheduledPost>;
  initialDate?: Date;
  brandId: string;
}

interface ContentCalendarProps {
  posts: ScheduledPost[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onPostClick?: (post: ScheduledPost) => void;
  onCreatePost?: (date: Date) => void;
}
```

## Dependencies
- date-fns (calendar math)
- shadcn/ui (Dialog, Calendar)
