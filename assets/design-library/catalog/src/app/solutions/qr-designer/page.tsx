"use client";

import { useState } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { QrCode, Download, Palette, Image, Link, Mail, Phone, Wifi, MapPin, User, MessageSquare } from "lucide-react";

const QR_TYPES = [
  { key: "url", label: "URL", icon: Link },
  { key: "text", label: "Texto", icon: MessageSquare },
  { key: "email", label: "Email", icon: Mail },
  { key: "phone", label: "Telefone", icon: Phone },
  { key: "wifi", label: "WiFi", icon: Wifi },
  { key: "vcard", label: "vCard", icon: User },
  { key: "geo", label: "Localização", icon: MapPin },
];

const DOT_STYLES = ["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded"];

export default function QrDesignerPage() {
  const [qrType, setQrType] = useState("url");
  const [fgColor, setFgColor] = useState("#f97316");
  const [bgColor, setBgColor] = useState("#0a0a0a");
  const [dotStyle, setDotStyle] = useState("rounded");
  const [showLogo, setShowLogo] = useState(true);

  return (
    <SolutionLayout id="qr-designer" title="Interactive Code Generator" source="qrcode-facil-replica" category="Tools">
      <p className="mb-6 text-sm text-muted-foreground">
        qr-code-styling com 8 tipos, 7 dot styles, logo upload, preview live. 5 componentes modulares.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {/* Type selector */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium">Tipo de QR</h3>
            <div className="flex flex-wrap gap-1.5">
              {QR_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setQrType(t.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      qrType === t.key ? "bg-orange-500/15 text-orange-400" : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content form */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium">Conteúdo</h3>
            <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="https://raizeducacao.com.br" defaultValue="https://raizeducacao.com.br" />
            {qrType === "wifi" && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="SSID" defaultValue="rAIz-Guest" />
                <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Senha" type="password" defaultValue="educacao2026" />
              </div>
            )}
          </div>

          {/* Style editor */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium"><Palette className="h-4 w-4 text-orange-400" /> Estilo</h3>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Dot Style</p>
                <div className="flex flex-wrap gap-1.5">
                  {DOT_STYLES.map((s) => (
                    <button key={s} onClick={() => setDotStyle(s)} className={cn(
                      "rounded-md px-2.5 py-1 text-xs transition-colors",
                      dotStyle === s ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30" : "bg-muted text-muted-foreground hover:text-foreground",
                    )}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Cor QR</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border-0" />
                    <input className="w-full rounded-md border border-border bg-background px-2 py-1 font-mono text-xs" value={fgColor} onChange={(e) => setFgColor(e.target.value)} />
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Fundo</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border-0" />
                    <input className="w-full rounded-md border border-border bg-background px-2 py-1 font-mono text-xs" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <div className={cn("h-4 w-4 rounded border transition-colors", showLogo ? "border-orange-500 bg-orange-500" : "border-border")} onClick={() => setShowLogo(!showLogo)}>
                    {showLogo && <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <Image className="h-3.5 w-3.5 text-muted-foreground" /> Exibir logo no centro
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Preview + Download (sticky) */}
        <div className="lg:sticky lg:top-6 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-center text-sm font-medium">Preview</h3>
            {/* QR Mock */}
            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-xl" style={{ backgroundColor: bgColor }}>
              <div className="relative">
                <QrCode className="h-32 w-32" style={{ color: fgColor }} strokeWidth={1} />
                {showLogo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-xs font-black" style={{ color: fgColor }}>
                      rAIz
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              {dotStyle} · {qrType.toUpperCase()}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium">Download</h3>
            <div className="grid grid-cols-3 gap-2">
              {["PNG", "SVG", "JPEG"].map((fmt) => (
                <button key={fmt} className="flex items-center justify-center gap-1 rounded-md border border-border py-2 text-xs font-medium hover:bg-muted">
                  <Download className="h-3 w-3" /> {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SolutionLayout>
  );
}
