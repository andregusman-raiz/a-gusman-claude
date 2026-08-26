"use client";

import type { AnchorHTMLAttributes, ImgHTMLAttributes } from "react";
import { Streamdown, type Components, type ExtraProps } from "streamdown";

function SafeLink({ href, children }: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps) {
  if (!href || /^javascript:|^data:|^vbscript:/i.test(href)) {
    return <span>{children}</span>;
  }

  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      rel={external ? "noopener noreferrer" : undefined}
      target={external ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}

function DisabledImage({ alt }: ImgHTMLAttributes<HTMLImageElement> & ExtraProps) {
  return <span className="image-omitted">Imagem não carregada{alt ? `: ${alt}` : ""}</span>;
}

// Streamdown 2.6 cruza tipos de tags conhecidas com um índice de tags customizadas.
const markdown_components = { a: SafeLink, img: DisabledImage } as Components;

export function MarkdownView({ content }: { content: string }) {
  return (
    <Streamdown
      className="markdown-content"
      components={markdown_components}
      mode="static"
      skipHtml
    >
      {content}
    </Streamdown>
  );
}
