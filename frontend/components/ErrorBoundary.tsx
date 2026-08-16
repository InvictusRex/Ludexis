"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("ErrorBoundary caught an error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-lg font-semibold text-foreground mb-2">
              Something went wrong
            </p>
            <p>An unexpected error occurred. Try refreshing the page.</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
