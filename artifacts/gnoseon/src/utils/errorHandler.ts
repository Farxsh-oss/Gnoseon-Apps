/**
 * Error handling utilities for Gnōseōn application
 * Provides centralized error handling, reporting, and user feedback
 */

import { logger, LogLevel } from './logger';

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  FILE = 'FILE',
  ENCRYPTION = 'ENCRYPTION',
  SYSTEM = 'SYSTEM',
  USER = 'USER',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  details?: Record<string, any>;
  userId?: string;
  component?: string;
  timestamp: Date;
  stack?: string;
  userMessage?: string;
  recoverable: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCallbacks: ((error: AppError) => void)[] = [];
  private errorHistory: AppError[] = [];
  private maxErrorHistory: number = 100;

  constructor() {
    // Setup global error handlers
    this.setupGlobalHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        'Unhandled promise rejection',
        event.reason,
        ErrorType.SYSTEM,
        ErrorSeverity.HIGH
      );
      event.preventDefault();
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(
        'Uncaught error',
        event.error || new Error(event.message),
        ErrorType.SYSTEM,
        ErrorSeverity.CRITICAL
      );
    });
  }

  handleError(
    message: string,
    originalError?: Error | any,
    type: ErrorType = ErrorType.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    userId?: string,
    component?: string
  ): AppError {
    const appError: AppError = {
      type,
      severity,
      message,
      code: originalError?.code,
      details: {
        ...context,
        originalError: originalError?.message,
      },
      userId,
      component,
      timestamp: new Date(),
      stack: originalError?.stack,
      userMessage: this.getUserFriendlyMessage(type, message),
      recoverable: this.isRecoverable(type, severity),
    };

    // Log the error
    this.logError(appError);

    // Add to error history
    this.addToHistory(appError);

    // Notify callbacks
    this.notifyCallbacks(appError);

    // Report to external service if enabled
    this.reportToExternalService(appError);

    return appError;
  }

  private logError(error: AppError): void {
    const logLevel = this.getLogLevelForSeverity(error.severity);
    const logMessage = `[${error.type}] ${error.message}`;
    
    switch (logLevel) {
      case LogLevel.DEBUG:
        logger.debug(logMessage, error.details, error.userId, error.component);
        break;
      case LogLevel.INFO:
        logger.info(logMessage, error.details, error.userId, error.component);
        break;
      case LogLevel.WARN:
        logger.warn(logMessage, error.details, error.userId, error.component);
        break;
      case LogLevel.ERROR:
        logger.error(logMessage, new Error(error.message), error.details, error.userId, error.component);
        break;
      case LogLevel.FATAL:
        logger.fatal(logMessage, new Error(error.message), error.details, error.userId, error.component);
        break;
    }
  }

  private getLogLevelForSeverity(severity: ErrorSeverity): LogLevel {
    switch (severity) {
      case ErrorSeverity.LOW: return LogLevel.WARN;
      case ErrorSeverity.MEDIUM: return LogLevel.ERROR;
      case ErrorSeverity.HIGH: return LogLevel.ERROR;
      case ErrorSeverity.CRITICAL: return LogLevel.FATAL;
      default: return LogLevel.ERROR;
    }
  }

  private addToHistory(error: AppError): void {
    this.errorHistory.push(error);
    
    // Keep only the last maxErrorHistory entries
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
    }
  }

  private notifyCallbacks(error: AppError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError: any) {
        logger.error('Error in error callback', callbackError instanceof Error ? callbackError : new Error(String(callbackError)));
      }
    });
  }

  private async reportToExternalService(error: AppError): Promise<void> {
    if (import.meta.env.VITE_ENABLE_ERROR_REPORTING !== 'true') {
      return;
    }

    const endpoint = import.meta.env.VITE_ERROR_REPORTING_ENDPOINT;
    if (!endpoint) {
      return;
    }

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (reportingError: any) {
      logger.error('Failed to report error to external service', reportingError instanceof Error ? reportingError : new Error(String(reportingError)));
    }
  }

  private getUserFriendlyMessage(type: ErrorType, _message: string): string {
    const friendlyMessages: Record<ErrorType, string> = {
      [ErrorType.VALIDATION]: 'Please check your input and try again.',
      [ErrorType.NETWORK]: 'Network connection issue. Please check your internet connection.',
      [ErrorType.DATABASE]: 'Data storage issue. Please try again.',
      [ErrorType.AUTHENTICATION]: 'Please log in to continue.',
      [ErrorType.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
      [ErrorType.FILE]: 'File operation failed. Please try again.',
      [ErrorType.ENCRYPTION]: 'Security operation failed. Please try again.',
      [ErrorType.SYSTEM]: 'System error occurred. Please try again.',
      [ErrorType.USER]: 'Operation failed. Please try again.',
    };

    return friendlyMessages[type] || 'An error occurred. Please try again.';
  }

  private isRecoverable(type: ErrorType, severity: ErrorSeverity): boolean {
    if (severity === ErrorSeverity.CRITICAL) return false;
    
    const recoverableTypes = [
      ErrorType.VALIDATION,
      ErrorType.NETWORK,
      ErrorType.AUTHENTICATION,
      ErrorType.FILE,
      ErrorType.USER,
    ];

    return recoverableTypes.includes(type);
  }

  onError(callback: (error: AppError) => void): () => void {
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  getErrorHistory(type?: ErrorType, severity?: ErrorSeverity): AppError[] {
    return this.errorHistory.filter(error => {
      if (type && error.type !== type) return false;
      if (severity && error.severity !== severity) return false;
      return true;
    });
  }

  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      total: this.errorHistory.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
    };

    // Initialize counters
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });

    // Count errors
    this.errorHistory.forEach(error => {
      stats.byType[error.type]++;
      stats.bySeverity[error.severity]++;
    });

    return stats;
  }

  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  exportErrors(): string {
    return JSON.stringify(this.errorHistory, null, 2);
  }
}

// Singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions for common error types
export const handleValidationError = (message: string, details?: Record<string, any>, userId?: string, component?: string) => 
  errorHandler.handleError(message, undefined, ErrorType.VALIDATION, ErrorSeverity.LOW, details, userId, component);

export const handleNetworkError = (message: string, error?: Error, userId?: string, component?: string) => 
  errorHandler.handleError(message, error, ErrorType.NETWORK, ErrorSeverity.MEDIUM, undefined, userId, component);

export const handleDatabaseError = (message: string, error?: Error, userId?: string, component?: string) => 
  errorHandler.handleError(message, error, ErrorType.DATABASE, ErrorSeverity.HIGH, undefined, userId, component);

export const handleAuthError = (message: string, error?: Error, userId?: string, component?: string) => 
  errorHandler.handleError(message, error, ErrorType.AUTHENTICATION, ErrorSeverity.MEDIUM, undefined, userId, component);

export const handleFileError = (message: string, error?: Error, userId?: string, component?: string) => 
  errorHandler.handleError(message, error, ErrorType.FILE, ErrorSeverity.MEDIUM, undefined, userId, component);

export const handleEncryptionError = (message: string, error?: Error, userId?: string, component?: string) => 
  errorHandler.handleError(message, error, ErrorType.ENCRYPTION, ErrorSeverity.HIGH, undefined, userId, component);

// React error boundary component
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
}

export class ErrorBoundary {
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const appError = errorHandler.handleError(
      'React component error',
      error,
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH
    );
    
    return {
      hasError: true,
      error: appError,
    };
  }

  static componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    errorHandler.handleError(
      'React component error caught',
      error,
      ErrorType.SYSTEM,
      ErrorSeverity.HIGH,
      { errorInfo }
    );
  }
}
