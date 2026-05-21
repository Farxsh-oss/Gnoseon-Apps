/**
 * Tests for Logger utility
 */

import { Logger, LogLevel, log } from '../../utils/logger';

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

beforeEach(() => {
  // Reset mocks
  Object.values(mockConsole).forEach(mock => mock.mockReset());
  
  // Mock console methods
  global.console.debug = mockConsole.debug;
  global.console.info = mockConsole.info;
  global.console.warn = mockConsole.warn;
  global.console.error = mockConsole.error;
  
  // Reset environment variables
  delete (import.meta.env as any).VITE_LOG_LEVEL;
  delete (import.meta.env as any).VITE_LOG_TO_CONSOLE;
});

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = Logger.getInstance();
    logger.clearLogs();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      expect(logger1).toBe(logger2);
    });
  });

  describe('Log Levels', () => {
    it('should respect log level hierarchy', () => {
      const newLogger = new Logger();
      newLogger.setLogLevel(LogLevel.WARN);
      newLogger.setLogToConsole(true);
      
      newLogger.debug('Debug message');
      newLogger.info('Info message');
      newLogger.warn('Warning message');
      newLogger.error('Error message');
      newLogger.fatal('Fatal message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(2); // error + fatal
    });

    it('should log all messages at DEBUG level', () => {
      const newLogger = new Logger();
      newLogger.setLogLevel(LogLevel.DEBUG);
      newLogger.setLogToConsole(true);
      
      newLogger.debug('Debug message');
      newLogger.info('Info message');
      newLogger.warn('Warning message');
      newLogger.error('Error message');
      newLogger.fatal('Fatal message');
      
      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(2); // error + fatal
    });

    it('should only log FATAL messages at FATAL level', () => {
      const newLogger = new Logger();
      newLogger.setLogLevel(LogLevel.FATAL);
      newLogger.setLogToConsole(true);
      
      newLogger.debug('Debug message');
      newLogger.info('Info message');
      newLogger.warn('Warning message');
      newLogger.error('Error message');
      newLogger.fatal('Fatal message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledTimes(1); // only fatal
    });
  });

  describe('Console Logging', () => {
    it('should log to console when enabled', () => {
      const newLogger = new Logger();
      newLogger.setLogLevel(LogLevel.INFO);
      newLogger.setLogToConsole(true);
      
      newLogger.info('Test message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO Test message')
      );
    });

    it('should not log to console when disabled', () => {
      const newLogger = new Logger();
      newLogger.setLogToConsole(false);
      
      newLogger.info('Test message');
      
      expect(mockConsole.info).not.toHaveBeenCalled();
    });
  });

  describe('Log Entry Format', () => {
    it('should format log entries correctly', () => {
      const newLogger = new Logger();
      newLogger.setLogToConsole(true);
      newLogger.setLogLevel(LogLevel.DEBUG);
      
      const testMessage = 'Test message';
      const testContext = { key: 'value' };
      const testUserId = 'user123';
      const testComponent = 'TestComponent';
      
      newLogger.info(testMessage, testContext, testUserId, testComponent);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining(testMessage)
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining(testUserId)
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining(testComponent)
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(testContext))
      );
    });

    it('should include error details when provided', () => {
      (import.meta.env as any).VITE_LOG_TO_CONSOLE = 'true';
      const newLogger = new Logger();
      
      const testError = new Error('Test error');
      newLogger.error('Error message', testError);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Stack:')
      );
    });
  });

  describe('Log History', () => {
    it('should store log entries in history', () => {
      logger.info('Message 1');
      logger.warn('Message 2');
      logger.error('Message 3');
      
      const entries = logger.getLogEntries();
      expect(entries).toHaveLength(3);
      expect(entries[0].message).toBe('Message 1');
      expect(entries[1].message).toBe('Message 2');
      expect(entries[2].message).toBe('Message 3');
    });

    it('should filter log entries by level', () => {
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      
      const errorEntries = logger.getLogEntries(LogLevel.ERROR);
      expect(errorEntries).toHaveLength(1);
      expect(errorEntries[0].message).toBe('Error message');
    });

    it('should filter log entries by component', () => {
      logger.info('Message 1', undefined, undefined, 'ComponentA');
      logger.info('Message 2', undefined, undefined, 'ComponentB');
      logger.info('Message 3', undefined, undefined, 'ComponentA');
      
      const componentAEntries = logger.getLogEntries(undefined, 'ComponentA');
      expect(componentAEntries).toHaveLength(2);
      expect(componentAEntries[0].component).toBe('ComponentA');
      expect(componentAEntries[1].component).toBe('ComponentA');
    });

    it('should filter log entries by user ID', () => {
      logger.info('Message 1', undefined, 'user1');
      logger.info('Message 2', undefined, 'user2');
      logger.info('Message 3', undefined, 'user1');
      
      const user1Entries = logger.getLogEntries(undefined, undefined, 'user1');
      expect(user1Entries).toHaveLength(2);
      expect(user1Entries[0].userId).toBe('user1');
      expect(user1Entries[1].userId).toBe('user1');
    });

    it('should limit log history size', () => {
      // Create a logger with small max entries
      const smallLogger = new (class extends Logger {
        constructor() {
          super();
          (this as any).maxLogEntries = 5;
        }
      })();
      
      // Add more entries than the limit
      for (let i = 0; i < 10; i++) {
        smallLogger.info(`Message ${i}`);
      }
      
      const entries = smallLogger.getLogEntries();
      expect(entries).toHaveLength(5);
      expect(entries[0].message).toBe('Message 5');
      expect(entries[4].message).toBe('Message 9');
    });
  });

  describe('Log Statistics', () => {
    it('should calculate correct log statistics', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.info('Another info');
      logger.warn('Warning message');
      logger.error('Error message');
      logger.fatal('Fatal message');
      
      const stats = logger.getLogStats();
      
      expect(stats.total).toBe(6);
      expect(stats.debug).toBe(1);
      expect(stats.info).toBe(2);
      expect(stats.warn).toBe(1);
      expect(stats.error).toBe(1);
      expect(stats.fatal).toBe(1);
    });

    it('should count errors correctly', () => {
      logger.info('Info message');
      logger.error('Error message');
      logger.fatal('Fatal message');
      logger.warn('Warning message');
      
      const errorCount = logger.getErrorCount();
      expect(errorCount).toBe(2); // error + fatal
    });
  });

  describe('Export and Clear', () => {
    it('should export logs as JSON', () => {
      logger.info('Test message');
      
      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].message).toBe('Test message');
    });

    it('should clear log history', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      
      expect(logger.getLogEntries()).toHaveLength(2);
      
      logger.clearLogs();
      
      expect(logger.getLogEntries()).toHaveLength(0);
    });
  });

  describe('Time Range Filtering', () => {
    it('should filter logs by time range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      // Mock timestamps
      const mockTimestamp1 = twoHoursAgo;
      const mockTimestamp2 = oneHourAgo;
      const mockTimestamp3 = now;
      
      // Create logger entries with specific timestamps
      logger.info('Old message');
      logger.info('Recent message');
      logger.info('Current message');
      
      // Manually set timestamps for testing
      const entries = logger.getLogEntries();
      if (entries.length >= 3) {
        entries[0].timestamp = mockTimestamp1;
        entries[1].timestamp = mockTimestamp2;
        entries[2].timestamp = mockTimestamp3;
      }
      
      const filteredEntries = logger.getLogEntriesByTimeRange(oneHourAgo, now);
      expect(filteredEntries).toHaveLength(2); // recent + current
    });
  });
});

describe('Convenience Functions', () => {
  beforeEach(() => {
    Logger.getInstance().clearLogs();
  });

  it('should provide convenience functions that work correctly', () => {
    log.debug('Debug message');
    log.info('Info message');
    log.warn('Warning message');
    log.error('Error message');
    log.fatal('Fatal message');
    
    const entries = Logger.getInstance().getLogEntries();
    expect(entries).toHaveLength(5);
    
    expect(entries[0].level).toBe(LogLevel.DEBUG);
    expect(entries[1].level).toBe(LogLevel.INFO);
    expect(entries[2].level).toBe(LogLevel.WARN);
    expect(entries[3].level).toBe(LogLevel.ERROR);
    expect(entries[4].level).toBe(LogLevel.FATAL);
  });

  it('should accept optional parameters', () => {
    const context = { key: 'value' };
    const userId = 'user123';
    const component = 'TestComponent';
    
    log.info('Test message', context, userId, component);
    
    const entries = Logger.getInstance().getLogEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].context).toEqual(context);
    expect(entries[0].userId).toBe(userId);
    expect(entries[0].component).toBe(component);
  });
});
