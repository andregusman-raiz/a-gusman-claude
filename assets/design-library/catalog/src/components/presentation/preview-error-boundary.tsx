"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; variantId: string };
type State = { hasError: boolean };

export class PreviewErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.warn(`[preview] ${this.props.variantId} crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-64 items-center justify-center p-4 text-center text-xs text-muted-foreground">
          <div>
            <div className="font-semibold text-foreground">
              Preview indisponível
            </div>
            <div className="mt-1 font-mono text-[10px] opacity-70">
              {this.props.variantId}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
