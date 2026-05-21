/**
 * Tests for Error Handler utility
 */

import { 
  ErrorHandler, 
  ErrorType, 
  ErrorSeverity, 
  handleValidationError,
  handleNetworkError,
  handleDatabaseError,
  handleAuthError,
  handleFileError,
  handleEncryptionError,
  errorHandler,
} from '../../utils/errorHandler';

jest.mock('../../utils/logger', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  };
  return {
    logger: mockLogger,
    LogLevel: {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      FATAL: 4,
    },
  };
});

// Helper to get the mock logger in tests
const getMockLogger = () => (require('../../utils/logger') as any).logger;

// Mock fetch for external reporting
global.fetch = jest.fn();

beforeEach(() => {
  // Reset mocks
  const mockLogger = getMockLogger();
  Object.values(mockLogger).forEach((mock: any) => mock.mockReset());
  jest.clearAllMocks();
  
  // Reset environment variables
  delete (import.meta.env as any).VITE_ENABLE_ERROR_REPORTING;
  delete (import.meta.env as any).VITE_ERROR_REPORTING_ENDPOINT;
});

describe('ErrorHandler', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    handler = ErrorHandler.getInstance();
    handler.clearErrorHistory();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const handler1 = ErrorHandler.getInstance();
      const handler2 = ErrorHandler.getInstance();
      expect(handler1).toBe(handler2);
    });
  });

  describe('Error Handling', () => {
    it('should handle basic error', () => {
      const error = handler.handleError('Test error');
      
      expect(error).toMatchObject({
        type: ErrorType.SYSTEM,
        severity: ErrorSeverity.MEDIUM,
        message: 'Test error',
        userMessage: expect.any(String),
        recoverable: expect.any(Boolean),
        timestamp: expect.any(Date),
      });
    });

    it('should handle error with original error', () => {
      const originalError = new Error('Original error');
      const error = handler.handleError('Test error', originalError);
      
      expect(error.details?.originalError).toBe('Original error');
      expect(error.stack).toBe(originalError.stack);
    });

    it('should handle error with context', () => {
      const context = { userId: '123', action: 'test' };
      const error = handler.handleError('Test error', undefined, ErrorType.VALIDATION, ErrorSeverity.LOW, context);
      
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.details).toEqual(context);
    });

    it('should handle error with user and component', () => {
      const error = handler.handleError('Test error', undefined, ErrorType.USER, ErrorSeverity.MEDIUM, undefined, 'user123', 'TestComponent');
      
      expect(error.userId).toBe('user123');
      expect(error.component).toBe('TestComponent');
    });
  });

  describe('Error Types and Severities', () => {
    it('should handle different error types', () => {
      const types = Object.values(ErrorType);
      
      types.forEach(type => {
        const error = handler.handleError('Test error', undefined, type);
        expect(error.type).toBe(type);
        expect(error.userMessage).toBeDefined();
      });
    });

    it('should handle different error severities', () => {
      const severities = Object.values(ErrorSeverity);
      
      severities.forEach(severity => {
        const error = handler.handleError('Test error', undefined, ErrorType.SYSTEM, severity);
        expect(error.severity).toBe(severity);
      });
    });
  });

  describe('User Friendly Messages', () => {
    it('should provide appropriate user messages for different error types', () => {
      const testCases = [
        { type: ErrorType.VALIDATION, expectedMessage: 'Please check your input and try again.' },
        { type: ErrorType.NETWORK, expectedMessage: 'Network connection issue. Please check your internet connection.' },
        { type: ErrorType.DATABASE, expectedMessage: 'Data storage issue. Please try again.' },
        { type: ErrorType.AUTHENTICATION, expectedMessage: 'Please log in to continue.' },
        { type: ErrorType.AUTHORIZATION, expectedMessage: 'You don\'t have permission to perform this action.' },
      ];

      testCases.forEach(({ type, expectedMessage }) => {
        const error = handler.handleError('Test error', undefined, type);
        expect(error.userMessage).toBe(expectedMessage);
      });
    });
  });

  describe('Recoverable Errors', () => {
    it('should determine recoverable errors correctly', () => {
      const recoverableTypes = [
        ErrorType.VALIDATION,
        ErrorType.NETWORK,
        ErrorType.AUTHENTICATION,
        ErrorType.FILE,
        ErrorType.USER,
      ];

      recoverableTypes.forEach(type => {
        const error = handler.handleError('Test error', undefined, type, ErrorSeverity.MEDIUM);
        expect(error.recoverable).toBe(true);
      });

      // Critical severity should not be recoverable
      const criticalError = handler.handleError('Test error', undefined, ErrorType.SYSTEM, ErrorSeverity.CRITICAL);
      expect(criticalError.recoverable).toBe(false);
    });
  });

  describe('Logging', () => {
    it('should log errors at appropriate levels', () => {
      const testCases = [
        { severity: ErrorSeverity.LOW, expectedLogCall: 'warn' },
        { severity: ErrorSeverity.MEDIUM, expectedLogCall: 'error' },
        { severity: ErrorSeverity.HIGH, expectedLogCall: 'error' },
        { severity: ErrorSeverity.CRITICAL, expectedLogCall: 'fatal' },
      ];

      testCases.forEach(({ severity, expectedLogCall }) => {
        handler.handleError('Test error', undefined, ErrorType.SYSTEM, severity);
        expect((getMockLogger() as any)[expectedLogCall]).toHaveBeenCalledWith(
          expect.stringContaining('SYSTEM'),
          expect.any(Object),
          expect.any(Object),
          undefined,
          undefined
        );
      });
    });
  });

  describe('Error History', () => {
    it('should store errors in history', () => {
      handler.handleError('Error 1');
      handler.handleError('Error 2');
      handler.handleError('Error 3');
      
      const history = handler.getErrorHistory();
      expect(history).toHaveLength(3);
      expect(history[0].message).toBe('Error 1');
      expect(history[1].message).toBe('Error 2');
      expect(history[2].message).toBe('Error 3');
    });

    it('should filter error history by type', () => {
      handler.handleError('Validation error', undefined, ErrorType.VALIDATION);
      handler.handleError('Network error', undefined, ErrorType.NETWORK);
      handler.handleError('Another validation error', undefined, ErrorType.VALIDATION);
      
      const validationErrors = handler.getErrorHistory(ErrorType.VALIDATION);
      expect(validationErrors).toHaveLength(2);
      expect(validationErrors[0].type).toBe(ErrorType.VALIDATION);
      expect(validationErrors[1].type).toBe(ErrorType.VALIDATION);
    });

    it('should filter error history by severity', () => {
      handler.handleError('Low error', undefined, ErrorType.SYSTEM, ErrorSeverity.LOW);
      handler.handleError('High error', undefined, ErrorType.SYSTEM, ErrorSeverity.HIGH);
      handler.handleError('Another low error', undefined, ErrorType.SYSTEM, ErrorSeverity.LOW);
      
      const lowErrors = handler.getErrorHistory(undefined, ErrorSeverity.LOW);
      expect(lowErrors).toHaveLength(2);
      expect(lowErrors[0].severity).toBe(ErrorSeverity.LOW);
      expect(lowErrors[1].severity).toBe(ErrorSeverity.LOW);
    });

    it('should limit error history size', () => {
      // Create a handler with small max history
      const smallHandler = new (class extends ErrorHandler {
        constructor() {
          super();
          (this as any).maxErrorHistory = 5;
        }
      })();
      
      // Add more errors than the limit
      for (let i = 0; i < 10; i++) {
        smallHandler.handleError(`Error ${i}`);
      }
      
      const history = smallHandler.getErrorHistory();
      expect(history).toHaveLength(5);
      expect(history[0].message).toBe('Error 5');
      expect(history[4].message).toBe('Error 9');
    });
  });

  describe('Error Statistics', () => {
    it('should calculate correct error statistics', () => {
      handler.handleError('Error 1', undefined, ErrorType.VALIDATION, ErrorSeverity.LOW);
      handler.handleError('Error 2', undefined, ErrorType.NETWORK, ErrorSeverity.MEDIUM);
      handler.handleError('Error 3', undefined, ErrorType.VALIDATION, ErrorSeverity.LOW);
      handler.handleError('Error 4', undefined, ErrorType.DATABASE, ErrorSeverity.HIGH);
      
      const stats = handler.getErrorStats();
      
      expect(stats.total).toBe(4);
      expect(stats.byType[ErrorType.VALIDATION]).toBe(2);
      expect(stats.byType[ErrorType.NETWORK]).toBe(1);
      expect(stats.byType[ErrorType.DATABASE]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.LOW]).toBe(2);
      expect(stats.bySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(1);
    });
  });

  describe('External Error Reporting', () => {
    it('should report errors when enabled', async () => {
      (import.meta.env as any).VITE_ENABLE_ERROR_REPORTING = 'true';
      (import.meta.env as any).VITE_ERROR_REPORTING_ENDPOINT = 'https://api.example.com/errors';
      
      const mockFetch = jest.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;
      
      handler.handleError('Test error');
      
      // Wait for async reporting
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/errors',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"error"'),
        })
      );
    });

    it('should not report errors when disabled', async () => {
      (import.meta.env as any).VITE_ENABLE_ERROR_REPORTING = 'false';
      
      const mockFetch = jest.fn();
      global.fetch = mockFetch;
      
      handler.handleError('Test error');
      
      // Wait for async reporting
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle reporting errors gracefully', async () => {
      (import.meta.env as any).VITE_ENABLE_ERROR_REPORTING = 'true';
      (import.meta.env as any).VITE_ERROR_REPORTING_ENDPOINT = 'https://api.example.com/errors';
      
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;
      
      handler.handleError('Test error');
      
      // Wait for async reporting
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(getMockLogger().error).toHaveBeenCalledWith(
        'Failed to report error to external service',
        expect.any(Error)
      );
    });
  });

  describe('Error Callbacks', () => {
    it('should notify error callbacks', () => {
      const callback = jest.fn();
      const unsubscribe = handler.onError(callback);
      
      const error = handler.handleError('Test error');
      
      expect(callback).toHaveBeenCalledWith(error);
      
      unsubscribe();
      
      // Should not call after unsubscribe
      handler.handleError('Another error');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      handler.onError(errorCallback);
      
      // Should not throw
      expect(() => {
        handler.handleError('Test error');
      }).not.toThrow();
      
      expect(getMockLogger().error).toHaveBeenCalledWith(
        'Error in error callback',
        expect.any(Error)
      );
    });
  });

  describe('Export and Clear', () => {
    it('should export errors as JSON', () => {
      handler.handleError('Error 1');
      handler.handleError('Error 2');
      
      const exported = handler.exportErrors();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0].message).toBe('Error 1');
      expect(parsed[1].message).toBe('Error 2');
    });

    it('should clear error history', () => {
      handler.handleError('Error 1');
      handler.handleError('Error 2');
      
      expect(handler.getErrorHistory()).toHaveLength(2);
      
      handler.clearErrorHistory();
      
      expect(handler.getErrorHistory()).toHaveLength(0);
    });
  });
});

describe('Convenience Functions', () => {
  beforeEach(() => {
    errorHandler.clearErrorHistory();
  });

  it('should provide validation error handling', () => {
    const error = handleValidationError('Invalid input', { field: 'email' }, 'user123', 'LoginForm');
    
    expect(error.type).toBe(ErrorType.VALIDATION);
    expect(error.severity).toBe(ErrorSeverity.LOW);
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'email' });
    expect(error.userId).toBe('user123');
    expect(error.component).toBe('LoginForm');
  });

  it('should provide network error handling', () => {
    const networkError = new Error('Network timeout');
    const error = handleNetworkError('Request failed', networkError, 'user123', 'ApiClient');
    
    expect(error.type).toBe(ErrorType.NETWORK);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.message).toBe('Request failed');
    expect(error.details?.originalError).toBe('Network timeout');
  });

  it('should provide database error handling', () => {
    const dbError = new Error('Database connection failed');
    const error = handleDatabaseError('Database error', dbError, 'user123', 'DataService');
    
    expect(error.type).toBe(ErrorType.DATABASE);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.message).toBe('Database error');
  });

  it('should provide authentication error handling', () => {
    const authError = new Error('Invalid credentials');
    const error = handleAuthError('Authentication failed', authError, 'user123', 'AuthService');
    
    expect(error.type).toBe(ErrorType.AUTHENTICATION);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.message).toBe('Authentication failed');
  });

  it('should provide file error handling', () => {
    const fileError = new Error('File not found');
    const error = handleFileError('File upload failed', fileError, 'user123', 'FileUploader');
    
    expect(error.type).toBe(ErrorType.FILE);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.message).toBe('File upload failed');
  });

  it('should provide encryption error handling', () => {
    const cryptoError = new Error('Encryption failed');
    const error = handleEncryptionError('Message encryption failed', cryptoError, 'user123', 'EncryptionService');
    
    expect(error.type).toBe(ErrorType.ENCRYPTION);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.message).toBe('Message encryption failed');
  });
});

describe('Global Error Handlers', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    handler = ErrorHandler.getInstance();
    handler.clearErrorHistory();
    
    // Clear any existing listeners
    window.onerror = null;
    window.onunhandledrejection = null;
  });

  it('should handle unhandled promise rejections', () => {
    const rejectionError = new Error('Unhandled rejection');
    
    // Simulate unhandled rejection
    const event = new Event('unhandledrejection') as any;
    event.reason = rejectionError;
    event.preventDefault = jest.fn();
    
    window.dispatchEvent(event);
    
    const errors = handler.getErrorHistory();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Unhandled promise rejection');
    expect(errors[0].details?.originalError).toBe('Unhandled rejection');
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should handle uncaught errors', () => {
    const uncaughtError = new Error('Uncaught error');
    
    // Simulate uncaught error
    const event = new ErrorEvent('error', {
      error: uncaughtError,
      message: 'Uncaught error',
    });
    
    window.dispatchEvent(event);
    
    const errors = handler.getErrorHistory();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Uncaught error');
    expect(errors[0].severity).toBe(ErrorSeverity.CRITICAL);
  });
});
