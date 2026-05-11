"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Upload, X, Check, Star, ChevronDown, Calendar, Clock } from "lucide-react";

// ─── Text Input / Textarea ──────────────────────────────────────────────────
export function InputPreview() {
  const [showPass, setShowPass] = useState(false);
  return (
    <div className="space-y-4 max-w-md">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Nome completo</label>
        <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--raiz-orange)] focus:ring-2 focus:ring-[var(--raiz-orange)]/20" placeholder="João Silva" defaultValue="André Gusman" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Email</label>
        <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" type="email" placeholder="email@raiz.edu.br" />
        <p className="mt-1 text-xs text-muted-foreground">Informe o email institucional</p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Senha</label>
        <div className="relative">
          <input className="w-full rounded-lg border border-red-500/50 bg-background px-3 py-2 pr-10 text-sm" type={showPass ? "text" : "password"} defaultValue="123" />
          <button onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
        </div>
        <p className="mt-1 text-xs text-red-400">Mínimo 8 caracteres</p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Observações</label>
        <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={3} placeholder="Escreva aqui..." />
        <p className="mt-1 text-right text-xs text-muted-foreground">0/500</p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Disabled</label>
        <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground" disabled value="Campo desabilitado" />
      </div>
    </div>
  );
}

// ─── Select ─────────────────────────────────────────────────────────────────
export function SelectPreview() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("Colégio QI — Matriz");
  const options = ["Colégio QI — Matriz", "Raiz Sul — Canoas", "Raiz MG — BH", "QI — Novo Hamburgo"];
  return (
    <div className="max-w-sm space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Unidade</label>
        <div className="relative">
          <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
            {value}<ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </button>
          {open && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-xl">
              {options.map(o => (
                <button key={o} onClick={() => { setValue(o); setOpen(false); }} className={cn("flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted", o === value && "text-[var(--raiz-orange)]")}>
                  {o === value && <Check className="h-3.5 w-3.5" />}
                  <span className={o !== value ? "pl-5" : ""}>{o}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Multi-select</label>
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5">
          {["Matemática", "Português"].map(t => (
            <span key={t} className="inline-flex items-center gap-1 rounded bg-[var(--raiz-orange)]/10 px-2 py-0.5 text-xs text-[var(--raiz-orange)]">{t}<X className="h-3 w-3 cursor-pointer" /></span>
          ))}
          <input className="flex-1 bg-transparent px-1 py-0.5 text-sm outline-none" placeholder="Buscar disciplina..." />
        </div>
      </div>
    </div>
  );
}

// ─── Date Picker ────────────────────────────────────────────────────────────
export function DatePickerPreview() {
  const [selectedDay, setSelectedDay] = useState(15);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <div className="max-w-xs">
      <label className="mb-1.5 block text-sm font-medium">Data de admissão</label>
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <button className="rounded p-1 hover:bg-muted text-muted-foreground">←</button>
          <span className="text-sm font-medium">Março 2026</span>
          <button className="rounded p-1 hover:bg-muted text-muted-foreground">→</button>
        </div>
        <div className="p-2">
          <div className="mb-1 grid grid-cols-7 text-center text-[10px] text-muted-foreground">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => <span key={`e${i}`} />)}
            {days.map(d => (
              <button key={d} onClick={() => setSelectedDay(d)} className={cn("flex h-8 w-8 items-center justify-center rounded-md text-xs transition-colors",
                d === selectedDay ? "text-white font-bold" : d === 28 ? "text-muted-foreground/30" : "hover:bg-muted text-foreground"
              )} style={d === selectedDay ? { backgroundColor: "var(--raiz-orange)" } : {}}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
          Selecionado: <span className="font-medium text-foreground">{selectedDay}/03/2026</span>
        </div>
      </div>
    </div>
  );
}

// ─── File Upload ────────────────────────────────────────────────────────────
export function FileUploadPreview() {
  const [files, setFiles] = useState([
    { name: "contrato_2026.pdf", size: "2.4 MB", progress: 100 },
    { name: "documento_rg.jpg", size: "1.1 MB", progress: 67 },
  ]);
  return (
    <div className="max-w-md space-y-3">
      <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border py-8 hover:border-[var(--raiz-orange)]/30 transition-colors cursor-pointer">
        <Upload className="h-8 w-8 text-muted-foreground/30" />
        <p className="mt-2 text-sm font-medium">Arraste arquivos ou clique para selecionar</p>
        <p className="mt-1 text-xs text-muted-foreground">PDF, DOC, JPG até 10MB</p>
      </div>
      <div className="space-y-2">
        {files.map(f => (
          <div key={f.name} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{f.name}</p>
              <p className="text-[10px] text-muted-foreground">{f.size}</p>
            </div>
            {f.progress < 100 ? (
              <div className="w-20">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${f.progress}%`, backgroundColor: "var(--raiz-orange)" }} />
                </div>
                <p className="mt-0.5 text-right text-[9px] text-muted-foreground">{f.progress}%</p>
              </div>
            ) : (
              <Check className="h-4 w-4 text-green-400" />
            )}
            <X className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-red-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Slider / Range ─────────────────────────────────────────────────────────
export function SliderPreview() {
  const [value, setValue] = useState(65);
  const [range, setRange] = useState([20, 80]);
  return (
    <div className="max-w-md space-y-6">
      <div>
        <div className="flex justify-between text-sm"><span>Volume</span><span className="font-mono">{value}%</span></div>
        <input type="range" min="0" max="100" value={value} onChange={e => setValue(Number(e.target.value))} className="mt-2 w-full accent-[var(--raiz-orange)]" />
      </div>
      <div>
        <div className="flex justify-between text-sm"><span>Faixa de preço</span><span className="font-mono">R$ {range[0]}K – R$ {range[1]}K</span></div>
        <div className="mt-2 relative h-2 rounded-full bg-muted">
          <div className="absolute h-full rounded-full" style={{ left: `${range[0]}%`, width: `${range[1] - range[0]}%`, backgroundColor: "var(--raiz-orange)", opacity: 0.5 }} />
          <input type="range" min="0" max="100" value={range[0]} onChange={e => setRange([Math.min(Number(e.target.value), range[1] - 5), range[1]])} className="absolute w-full appearance-none bg-transparent accent-[var(--raiz-orange)]" style={{ top: -4 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Toggle / Switch ────────────────────────────────────────────────────────
export function TogglePreview() {
  const [toggles, setToggles] = useState({ notif: true, dark: true, emails: false, sms: false });
  const toggle = (key: keyof typeof toggles) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  return (
    <div className="max-w-sm space-y-3">
      {[
        { key: "notif" as const, label: "Notificações push", desc: "Receber alertas no celular" },
        { key: "dark" as const, label: "Modo escuro", desc: "Interface em tema dark" },
        { key: "emails" as const, label: "Emails marketing", desc: "Novidades e promoções" },
        { key: "sms" as const, label: "SMS", desc: "Alertas por mensagem" },
      ].map(item => (
        <div key={item.key} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
          <button onClick={() => toggle(item.key)} className={cn("relative h-6 w-11 rounded-full transition-colors", toggles[item.key] ? "bg-[var(--raiz-orange)]" : "bg-muted")}>
            <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", toggles[item.key] ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Rating Stars ───────────────────────────────────────────────────────────
export function RatingPreview() {
  const [rating, setRating] = useState(3);
  const [hover, setHover] = useState(0);
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Avalie o atendimento</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}>
              <Star className={cn("h-8 w-8 transition-colors", (hover || rating) >= n ? "fill-[var(--raiz-orange)] text-[var(--raiz-orange)]" : "text-muted-foreground/20")} />
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{rating}/5 — {["Péssimo", "Ruim", "Regular", "Bom", "Excelente"][rating - 1]}</p>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Somente leitura</p>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(n => <Star key={n} className={cn("h-5 w-5", n <= 4 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />)}
          <span className="ml-1 text-sm text-muted-foreground">(4.0)</span>
        </div>
      </div>
    </div>
  );
}

// ─── OTP Input ──────────────────────────────────────────────────────────────
export function OtpPreview() {
  const [digits, setDigits] = useState(["4", "2", "7", "", "", ""]);
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm font-medium">Código de verificação</p>
      <p className="text-xs text-muted-foreground">Enviamos um código para seu email</p>
      <div className="flex gap-2">
        {digits.map((d, i) => (
          <div key={i} className={cn("flex h-14 w-12 items-center justify-center rounded-xl border-2 text-2xl font-bold transition-colors",
            i === 3 ? "border-[var(--raiz-orange)] ring-2 ring-[var(--raiz-orange)]/20" : d ? "border-border" : "border-border/50"
          )} style={i === 3 ? { borderColor: "var(--raiz-orange)" } : {}}>
            {d || (i === 3 ? <span className="h-6 w-0.5 animate-pulse bg-[var(--raiz-orange)]" /> : "")}
          </div>
        ))}
      </div>
      <button className="text-xs text-[var(--raiz-orange)] hover:underline">Reenviar código</button>
    </div>
  );
}

// ─── Color Picker ───────────────────────────────────────────────────────────
export function ColorPickerPreview() {
  const [color, setColor] = useState("#F7941D");
  const presets = ["#F7941D", "#5BB5A2", "#3B82F6", "#A855F7", "#DC3545", "#2D9E6B", "#EAB308", "#1a1a1a"];
  return (
    <div className="max-w-xs space-y-3">
      <label className="text-sm font-medium">Cor do tema</label>
      <div className="flex items-center gap-3">
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-10 cursor-pointer rounded-lg border-0" />
        <input className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm" value={color} onChange={e => setColor(e.target.value)} />
        <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: color }} />
      </div>
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">Presets</p>
        <div className="flex gap-1.5">
          {presets.map(c => (
            <button key={c} onClick={() => setColor(c)} className={cn("h-7 w-7 rounded-full transition-transform hover:scale-110", color === c && "ring-2 ring-offset-2 ring-offset-background")} style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}
