import React from "react";

type Props = {
  fallback: (error: unknown) => React.ReactNode;
  children: React.ReactNode;
};

type State = { hasError: boolean; error: unknown };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown) {
    // Keep logging minimal but present so we can debug black screens.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Uncaught error", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}
