"use client";

import { Component, type ReactNode } from "react";
import { EmptyState } from "@/components/brand/empty-state";

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
          <EmptyState
            prominent
            title="This page failed to load"
            description="Something unexpected went wrong. Reload the page to try again."
          />
        )
      );
    }

    return this.props.children;
  }
}
