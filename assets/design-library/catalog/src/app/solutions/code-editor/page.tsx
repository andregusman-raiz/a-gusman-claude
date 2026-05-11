"use client";

import { SolutionLayout } from "@/components/solutions/solution-layout";

const CODE_SAMPLE = `import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: "anthropic/claude-sonnet-4.6",
    system: "Você é um assistente educacional da rAIz.",
    messages,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}`;

const LINES = CODE_SAMPLE.split("\n");

const tokenize = (line: string) => {
  const tokens: Array<{ text: string; color: string }> = [];
  const keywords = /\b(import|from|export|async|function|const|return|await)\b/g;
  const strings = /(["'`])(?:(?!\1).)*\1/g;
  const types = /\b(Request|POST)\b/g;
  const comments = /\/\/.*/g;

  let last = 0;
  const all: Array<{ start: number; end: number; color: string }> = [];

  for (const m of line.matchAll(keywords)) all.push({ start: m.index!, end: m.index! + m[0].length, color: "text-purple-400" });
  for (const m of line.matchAll(strings)) all.push({ start: m.index!, end: m.index! + m[0].length, color: "text-green-400" });
  for (const m of line.matchAll(types)) all.push({ start: m.index!, end: m.index! + m[0].length, color: "text-yellow-400" });
  for (const m of line.matchAll(comments)) all.push({ start: m.index!, end: m.index! + m[0].length, color: "text-zinc-500" });

  all.sort((a, b) => a.start - b.start);

  for (const t of all) {
    if (t.start > last) tokens.push({ text: line.slice(last, t.start), color: "text-zinc-300" });
    tokens.push({ text: line.slice(t.start, t.end), color: t.color });
    last = t.end;
  }
  if (last < line.length) tokens.push({ text: line.slice(last), color: "text-zinc-300" });
  if (tokens.length === 0) tokens.push({ text: line || " ", color: "text-zinc-300" });

  return tokens;
};

export default function CodeEditorPage() {
  return (
    <SolutionLayout id="code-editor" title="Embedded Code Editor" source="raiz-platform" category="Tools">
      <p className="mb-6 text-sm text-muted-foreground">
        Monaco via next/dynamic + ssr:false. 2 temas branded (qi-light/dark). MutationObserver auto-switch. 30+ langs.
      </p>

      <div className="overflow-hidden rounded-xl border border-border">
        {/* Editor tabs */}
        <div className="flex items-center border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2 border-r border-zinc-800 bg-zinc-950 px-4 py-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-zinc-300">route.ts</span>
            <span className="text-zinc-600">×</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-green-400/50" />
            schema.ts
          </div>
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-purple-400/50" />
            types.ts
          </div>
        </div>

        {/* Editor body */}
        <div className="flex bg-zinc-950">
          {/* Line numbers */}
          <div className="flex flex-col items-end border-r border-zinc-800/50 px-3 py-3 font-mono text-xs leading-6 text-zinc-600 select-none">
            {LINES.map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>

          {/* Code */}
          <pre className="flex-1 overflow-x-auto px-4 py-3 font-mono text-xs leading-6">
            {LINES.map((line, i) => (
              <div key={i} className="hover:bg-zinc-900/50">
                {tokenize(line).map((token, j) => (
                  <span key={j} className={token.color}>{token.text}</span>
                ))}
              </div>
            ))}
          </pre>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 px-4 py-1 text-[10px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>TypeScript</span>
            <span>UTF-8</span>
            <span>LF</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Ln 1, Col 1</span>
            <span className="text-orange-400">qi-dark</span>
            <span>JetBrains Mono</span>
          </div>
        </div>
      </div>
    </SolutionLayout>
  );
}
