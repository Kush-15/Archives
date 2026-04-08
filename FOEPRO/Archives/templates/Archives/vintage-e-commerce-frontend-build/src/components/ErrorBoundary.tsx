import { Component, type ReactNode, type ErrorInfo, type FC } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-stone-950 px-6 text-center text-stone-200">
          <h1 className="mb-4 text-3xl font-light tracking-wide text-red-400">
            Something went wrong
          </h1>
          <p className="mb-2 max-w-md text-sm text-stone-400">
            An unexpected error occurred. Please try reloading the page.
          </p>
          {this.state.error && (
            <pre className="mb-6 max-w-lg overflow-auto rounded bg-stone-900 p-4 text-xs text-stone-500">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            className="rounded border border-stone-600 px-6 py-2 text-sm tracking-wider uppercase transition-colors hover:bg-stone-800 hover:text-stone-100"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
