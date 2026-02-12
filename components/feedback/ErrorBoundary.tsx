
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorState from './ErrorState';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#0a0e27] flex items-center justify-center overflow-hidden">
            <ErrorState 
                title="Ops! Algo deu errado."
                message="Ocorreu um erro inesperado no laboratório. Não se preocupe, seus dados estão seguros."
                code={this.state.error?.name || "REACT_CRASH"}
                icon="shield"
                imageSrc="crash.png" 
                onRetry={() => window.location.reload()}
            />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
