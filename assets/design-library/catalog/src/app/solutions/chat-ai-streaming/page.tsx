"use client";

import { useState, useEffect, useRef } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { Send, Bot, User, Loader2, Code, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCall?: { name: string; result: Record<string, unknown> };
  streaming?: boolean;
}

const DEMO_MESSAGES: Message[] = [
  { id: "1", role: "user", content: "Crie uma automação que envie email de boas-vindas para novos alunos" },
  {
    id: "2", role: "assistant", content: "Vou criar a automação de boas-vindas. Primeiro, preciso definir o trigger e as ações:",
    toolCall: {
      name: "createRecipe",
      result: {
        name: "Boas-vindas Novos Alunos",
        trigger: "Matrícula confirmada",
        steps: [
          { type: "delay", config: { minutes: 5 } },
          { type: "email", config: { template: "welcome", subject: "Bem-vindo(a) à família rAIz!" } },
          { type: "notification", config: { channel: "secretaria", message: "Novo aluno matriculado" } },
        ],
      },
    },
  },
  { id: "3", role: "user", content: "Adicione um step de SMS também, 1 hora depois do email" },
];

function ToolCallCard({ toolCall }: { toolCall: Message["toolCall"] }) {
  if (!toolCall) return null;
  const recipe = toolCall.result as { name: string; trigger: string; steps: Array<{ type: string; config: Record<string, unknown> }> };
  return (
    <div className="mt-3 rounded-lg border border-border bg-background/50 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Code className="h-3.5 w-3.5" />
        <span>Tool: <code className="text-orange-400">{toolCall.name}</code></span>
      </div>
      <div className="mt-2">
        <p className="text-sm font-medium">{recipe.name}</p>
        <p className="text-xs text-muted-foreground">Trigger: {recipe.trigger}</p>
        <div className="mt-2 space-y-1">
          {recipe.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-1.5 text-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold text-orange-400">
                {i + 1}
              </span>
              <span className="font-medium capitalize">{step.type}</span>
              <span className="text-muted-foreground">
                {step.type === "delay" && `${(step.config as { minutes?: number }).minutes}min`}
                {step.type === "email" && (step.config as { subject?: string }).subject}
                {step.type === "notification" && (step.config as { channel?: string }).channel}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatAiStreamingPage() {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    // Simulate streaming response
    const assistantId = (Date.now() + 1).toString();
    const fullText = "Entendido! Adicionando step de SMS com delay de 1 hora após o email. A automação agora tem 4 steps no total.";
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", streaming: true }]);

    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      if (i >= fullText.length) {
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: fullText, streaming: false } : m));
        setStreaming(false);
        clearInterval(interval);
      } else {
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: fullText.slice(0, i) } : m));
      }
    }, 30);
  };

  return (
    <SolutionLayout id="chat-ai-streaming" title="Chat Interface + Streaming" source="automata" category="AI">
      <p className="mb-6 text-sm text-muted-foreground">
        AI SDK v6 useChat + DefaultChatTransport. Tool calls extraídos de msg.parts, preview de artefatos em side panel.
      </p>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Chat */}
        <div className="flex h-[500px] flex-col rounded-xl border border-border bg-card">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}>
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                    <Bot className="h-4 w-4 text-orange-400" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30",
                )}>
                  <p>{msg.content}{msg.streaming && <span className="inline-block w-1.5 h-4 ml-0.5 bg-orange-400 animate-pulse" />}</p>
                  {msg.toolCall && <ToolCallCard toolCall={msg.toolCall} />}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                placeholder="Descreva a automação..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={streaming}
              />
              <button
                onClick={handleSend}
                disabled={streaming || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white transition-colors hover:bg-orange-600 disabled:opacity-40"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              {streaming ? "Gerando resposta..." : "AI SDK v6 · DefaultChatTransport · Streaming"}
            </div>
          </div>
        </div>

        {/* Side panel — artifact preview */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Code className="h-4 w-4 text-orange-400" />
            Artifact Preview
          </div>
          <div className="mt-3 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
            <p className="text-sm font-semibold">Boas-vindas Novos Alunos</p>
            <p className="mt-1 text-xs text-muted-foreground">Trigger: Matrícula confirmada</p>
            <div className="mt-3 space-y-2">
              {[
                { step: 1, type: "Delay", detail: "5 minutos" },
                { step: 2, type: "Email", detail: "Bem-vindo(a) à família rAIz!" },
                { step: 3, type: "Notification", detail: "Canal: secretaria" },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-2 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 font-mono text-[10px] font-bold text-orange-400">
                    {s.step}
                  </span>
                  <span className="font-medium">{s.type}</span>
                  <span className="text-muted-foreground">{s.detail}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            Atualizado em tempo real via tool-call parts
          </p>
        </div>
      </div>
    </SolutionLayout>
  );
}
