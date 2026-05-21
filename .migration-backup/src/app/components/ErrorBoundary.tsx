/**
 * React Error Boundary Component
 * Catches and handles React component errors gracefully
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { AppError, errorHandler } from '../../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = errorHandler.handleError(
      'React component error',
      error,
      'SYSTEM' as any,
      'HIGH' as any
    );
    
    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const appError = errorHandler.handleError(
      'React component error caught',
      error,
      'SYSTEM' as any,
      'HIGH' as any,
      { errorInfo }
    );

    this.setState({
      error: appError,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(appError);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>
            
            <h1 className="text-xl font-semibold text-purple-600 dark:text-white mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {this.state.error?.userMessage || 'An unexpected error occurred. Please try again.'}
            </p>

            {( (import.meta as any).env?.DEV || (globalThis as any).importMetaEnv?.DEV ) && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-purple-600 dark:text-gray-200">
                  <div className="mb-2">
                    <strong>Type:</strong> {this.state.error.type}
                  </div>
                  <div className="mb-2">
                    <strong>Severity:</strong> {this.state.error.severity}
                  </div>
                  <div className="mb-2">
                    <strong>Message:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.details && (
                    <div className="mb-2">
                      <strong>Details:</strong>
                      <pre className="mt-1 overflow-x-auto">
                        {JSON.stringify(this.state.error.details, null, 2)}
                      </pre>
                    </div>
                  )}
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 overflow-x-auto text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              Error ID: {this.state.error?.timestamp.getTime()}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: AppError) => void
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const handleError = (error: Error | string, type: string = 'SYSTEM', context?: Record<string, any>) => {
    const message = typeof error === 'string' ? error : error.message;
    const errorObj = typeof error === 'string' ? new Error(message) : error;
    
    errorHandler.handleError(
      message,
      errorObj,
      type as any,
      'MEDIUM' as any,
      context
    );
  };

  return { handleError };
}
