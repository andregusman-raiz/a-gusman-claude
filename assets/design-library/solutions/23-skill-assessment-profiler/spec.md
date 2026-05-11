---
id: skill-assessment-profiler
name: Skill Assessment + Radar Chart
category: Data Display
source: skillcert-raiz
complexity: Alta
tags: [assessment, radar-chart, skills, ai-report, svg, profiler]
---

# Skill Assessment Profiler

## What it solves
Student/employee skill assessment with custom SVG radar chart, bar chart with median comparison, and AI-generated narrative reports.

## Best implementations
- `https://github.com/Raiz-Educacao-SA/skillcert-raiz/blob/main/components/IndividualView.tsx`
- `https://github.com/Raiz-Educacao-SA/skillcert-raiz/blob/main/components/TeamView.tsx`
- `https://github.com/Raiz-Educacao-SA/skillcert-raiz/blob/main/components/EditableTable.tsx`

## Key features
- **Custom SVG radar chart**: 15-skill socioemotional competency spider
- **Custom SVG bar chart**: cognitive performance with dashed median line overlay
- **Hand-built SVG**: no chart library — full control over rendering
- **AI narrative report**: Gemini generates HTML report displayed in modal
- **Dark hero header**: profile info with 3 metric cards
- **Print-to-PDF**: browser print support for individual profiles
- **Team view**: comparison matrix across team members
- **Editable table**: inline score editing with validation

## Flow
```
List → Select Person → Individual Profile
  ├── Hero (name, photo, 3 metric cards)
  ├── Radar Chart (15 socioemotional skills)
  ├── Bar Chart (cognitive by category + median line)
  └── [Generate AI Report] → Modal with HTML narrative
```

## Dependencies
- Hand-built SVG (no chart library)
- Gemini AI for narrative generation
- React (Vite, no Next.js)
