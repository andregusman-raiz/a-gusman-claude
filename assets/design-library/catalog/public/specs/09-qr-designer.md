---
id: qr-designer
name: Interactive QR Code Designer
category: tools
source: qrcode-facil-replica
complexity: medium
---

# QR Code Designer

## What it solves
Interactive QR code generator with live preview, style customization (dot shapes, colors, logos), and multi-type content encoding.

## Best implementation
- **Generator**: `~/Claude/projetos/qrcode-facil-replica/src/components/qr-generator/index.tsx`
- **Style Editor**: `~/Claude/projetos/qrcode-facil-replica/src/components/qr-generator/style-editor.tsx`
- **Preview**: `~/Claude/projetos/qrcode-facil-replica/src/components/qr-generator/qr-preview.tsx`
- **Content Form**: `~/Claude/projetos/qrcode-facil-replica/src/components/qr-generator/content-form.tsx`
- **Download**: `~/Claude/projetos/qrcode-facil-replica/src/components/qr-generator/download-options.tsx`

## Key features
- **5-component architecture**: TypeSelector → ContentForm → StyleEditor → QrPreview → DownloadOptions
- **8 QR types**: URL, text, email, phone, SMS, WiFi, vCard, geo
- **Style controls**: dot type (7 variants), corner square/dot types, foreground/background colors
- **Logo support**: file upload or preset social icons gallery, adjustable size
- **Live preview**: QRCodeStyling instance in useRef, updates on every change
- **Sticky preview**: preview panel stays visible while scrolling options on desktop
- **Download**: PNG, SVG, JPEG format options

## Dependencies
- qr-code-styling (QR rendering)
- Native color inputs + hex text
