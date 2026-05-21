/**
 * Tests for ErrorBoundary component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from '../../app/components/ErrorBoundary';
import { errorHandler } from '../../utils/errorHandler';
import { setEnv } from '../setup';

// Mock the error handler
jest.mock('../../utils/errorHandler', () => ({
  errorHandler: {
    handleError: jest.fn((message, error, type, severity) => ({
      message,
      type: type || 'SYSTEM',
      severity: severity || 'MEDIUM',
      timestamp: new Date(),
      userMessage: 'Test user message',
      recoverable: true,
      stack: error?.stack,
    })),
    clearErrorHistory: jest.fn(),
  },
  ErrorType: {
    SYSTEM: 'SYSTEM',
  },
  ErrorSeverity: {
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
  },
}));

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    const ChildComponent = () => <div>Child Component</div>;
    
    render(
      <ErrorBoundary>
        <ChildComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });

  it('should render error UI when there is an error', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test user message')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('should call error handler when error occurs', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    expect(errorHandler.handleError).toHaveBeenCalledWith(
      'React component error',
      expect.any(Error),
      'SYSTEM',
      'HIGH'
    );
  });

  it('should call custom error callback when provided', () => {
    const errorCallback = jest.fn();
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary onError={errorCallback}>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    expect(errorCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'React component error caught',
        type: 'SYSTEM',
        severity: 'HIGH',
      })
    );
  });

  it('should render custom fallback when provided', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    const CustomFallback = <div>Custom Error UI</div>;

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should retry when Try Again button is clicked', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Rerender with a component that doesn't throw
    rerender(
      <ErrorBoundary>
        <div>No Error Component</div>
      </ErrorBoundary>
    );

    // Click Try Again
    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('No Error Component')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    setEnv('DEV', true);

    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();
  });

  it('should not show error details in production mode', () => {
    setEnv('DEV', false);

    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();
  });

  it('should display error ID', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
  });

  it('should handle Go Home button click', () => {
    // We already have a mock for window.location in setup.ts
    window.location.href = '';

    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    const goHomeButton = screen.getByText('Go Home');
    fireEvent.click(goHomeButton);

    expect(window.location.href).toBe('http://localhost/');
  });
});

describe('withErrorBoundary HOC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should wrap component with error boundary', () => {
    const TestComponent = () => <div>Test Component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should handle errors in wrapped component', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    const WrappedComponent = withErrorBoundary(ThrowErrorComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should use custom fallback when provided', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    const CustomFallback = <div>Custom Fallback</div>;
    const WrappedComponent = withErrorBoundary(ThrowErrorComponent, CustomFallback);

    render(<WrappedComponent />);

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
  });

  it('should use custom error callback when provided', () => {
    const errorCallback = jest.fn();
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };
    const WrappedComponent = withErrorBoundary(ThrowErrorComponent, undefined, errorCallback);

    render(<WrappedComponent />);

    expect(errorCallback).toHaveBeenCalled();
  });

  it('should pass props to wrapped component', () => {
    interface TestProps {
      message: string;
    }
    const TestComponent = ({ message }: TestProps) => <div>{message}</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent message="Hello World" />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});

describe('useErrorHandler Hook', () => {
  it('should provide handleError function', () => {
    const TestComponent = () => {
      const { handleError } = useErrorHandler();
      
      return (
        <button onClick={() => handleError('Test error')}>
          Trigger Error
        </button>
      );
    };

    render(<TestComponent />);

    const button = screen.getByText('Trigger Error');
    fireEvent.click(button);

    expect(errorHandler.handleError).toHaveBeenCalledWith(
      'Test error',
      expect.any(Error),
      'SYSTEM',
      'MEDIUM',
      undefined
    );
  });

  it('should handle Error objects', () => {
    const TestComponent = () => {
      const { handleError } = useErrorHandler();
      
      return (
        <button onClick={() => handleError(new Error('Test error'))}>
          Trigger Error
        </button>
      );
    };

    render(<TestComponent />);

    const button = screen.getByText('Trigger Error');
    fireEvent.click(button);

    expect(errorHandler.handleError).toHaveBeenCalledWith(
      'Test error',
      expect.any(Error),
      'SYSTEM',
      'MEDIUM',
      undefined
    );
  });

  it('should handle custom type and context', () => {
    const TestComponent = () => {
      const { handleError } = useErrorHandler();
      
      return (
        <button onClick={() => handleError('Test error', 'VALIDATION', { field: 'email' })}>
          Trigger Error
        </button>
      );
    };

    render(<TestComponent />);

    const button = screen.getByText('Trigger Error');
    fireEvent.click(button);

    expect(errorHandler.handleError).toHaveBeenCalledWith(
      'Test error',
      expect.any(Error),
      'VALIDATION',
      'MEDIUM',
      { field: 'email' }
    );
  });
});

describe('Error Boundary Integration', () => {
  it('should handle nested error boundaries', () => {
    const InnerErrorComponent = () => {
      throw new Error('Inner error');
    };

    const OuterComponent = () => (
      <div>
        <h1>Outer Component</h1>
        <ErrorBoundary fallback={<div>Inner Error Fallback</div>}>
          <InnerErrorComponent />
        </ErrorBoundary>
      </div>
    );

    const OuterErrorBoundary = () => (
      <ErrorBoundary fallback={<div>Outer Error Fallback</div>}>
        <OuterComponent />
      </ErrorBoundary>
    );

    render(<OuterErrorBoundary />);

    // Inner boundary should catch the error
    expect(screen.getByText('Outer Component')).toBeInTheDocument();
    expect(screen.getByText('Inner Error Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Outer Error Fallback')).not.toBeInTheDocument();
  });

  it('should handle errors in error boundary fallback', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };

    const ErrorFallback = () => {
      throw new Error('Fallback error');
    };

    // This should still show the default error UI of the outer boundary
    render(
      <ErrorBoundary>
        <ErrorBoundary fallback={<ErrorFallback />}>
          <ThrowErrorComponent />
        </ErrorBoundary>
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
