/**
 * Logging utility for Gnōseōn application
 * Provides structured logging with different levels and output destinations
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  component?: string;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logToConsole: boolean;
  private logEntries: LogEntry[] = [];
  private maxLogEntries: number = 1000;

  constructor() {
    this.logLevel = this.getLogLevelFromEnv();
    this.logToConsole = this.getConsoleLoggingFromEnv();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  setLogToConsole(enabled: boolean): void {
    this.logToConsole = enabled;
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = import.meta.env.VITE_LOG_LEVEL?.toLowerCase() || 'info';
    switch (level) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      case 'fatal': return LogLevel.FATAL;
      default: return LogLevel.INFO;
    }
  }

  private getConsoleLoggingFromEnv(): boolean {
    return import.meta.env.VITE_LOG_TO_CONSOLE !== 'false';
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level].padEnd(5);
    const component = entry.component ? `[${entry.component}]` : '';
    const userId = entry.userId ? `(${entry.userId})` : '';
    
    let message = `${timestamp} ${level} ${component}${userId} ${entry.message}`;
    
    if (entry.context) {
      message += ` | Context: ${JSON.stringify(entry.context)}`;
    }
    
    if (entry.error) {
      message += ` | Error: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\nStack: ${entry.error.stack}`;
      }
    }
    
    return message;
  }

  private addLogEntry(entry: LogEntry): void {
    this.logEntries.push(entry);
    
    // Keep only the last maxLogEntries entries
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.maxLogEntries);
    }
    
    if (this.logToConsole) {
      const formatted = this.formatLogEntry(entry);
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formatted);
          break;
      }
    }
  }

  debug(message: string, context?: Record<string, any>, userId?: string, component?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    this.addLogEntry({
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      message,
      context,
      userId,
      component,
    });
  }

  info(message: string, context?: Record<string, any>, userId?: string, component?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    this.addLogEntry({
      timestamp: new Date(),
      level: LogLevel.INFO,
      message,
      context,
      userId,
      component,
    });
  }

  warn(message: string, context?: Record<string, any>, userId?: string, component?: string): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    this.addLogEntry({
      timestamp: new Date(),
      level: LogLevel.WARN,
      message,
      context,
      userId,
      component,
    });
  }

  error(message: string, error?: Error, context?: Record<string, any>, userId?: string, component?: string): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    this.addLogEntry({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      error,
      context,
      userId,
      component,
    });
  }

  fatal(message: string, error?: Error, context?: Record<string, any>, userId?: string, component?: string): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    
    this.addLogEntry({
      timestamp: new Date(),
      level: LogLevel.FATAL,
      message,
      error,
      context,
      userId,
      component,
    });
  }

  getLogEntries(level?: LogLevel, component?: string, userId?: string): LogEntry[] {
    return this.logEntries.filter(entry => {
      if (level !== undefined && entry.level !== level) return false;
      if (component && entry.component !== component) return false;
      if (userId && entry.userId !== userId) return false;
      return true;
    });
  }

  getLogEntriesByTimeRange(start: Date, end: Date): LogEntry[] {
    return this.logEntries.filter(entry => 
      entry.timestamp >= start && entry.timestamp <= end
    );
  }

  exportLogs(): string {
    return JSON.stringify(this.logEntries, null, 2);
  }

  clearLogs(): void {
    this.logEntries = [];
  }

  getErrorCount(): number {
    return this.logEntries.filter(entry => 
      entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL
    ).length;
  }

  getLogStats(): {
    total: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
    fatal: number;
  } {
    const stats = {
      total: this.logEntries.length,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0,
    };

    for (const entry of this.logEntries) {
      switch (entry.level) {
        case LogLevel.DEBUG: stats.debug++; break;
        case LogLevel.INFO: stats.info++; break;
        case LogLevel.WARN: stats.warn++; break;
        case LogLevel.ERROR: stats.error++; break;
        case LogLevel.FATAL: stats.fatal++; break;
      }
    }

    return stats;
  }
}

// Singleton instance
export const logger = Logger.getInstance();

// Convenience functions for direct usage
export const log = {
  debug: (message: string, context?: Record<string, any>, userId?: string, component?: string) => 
    logger.debug(message, context, userId, component),
  info: (message: string, context?: Record<string, any>, userId?: string, component?: string) => 
    logger.info(message, context, userId, component),
  warn: (message: string, context?: Record<string, any>, userId?: string, component?: string) => 
    logger.warn(message, context, userId, component),
  error: (message: string, error?: Error, context?: Record<string, any>, userId?: string, component?: string) => 
    logger.error(message, error, context, userId, component),
  fatal: (message: string, error?: Error, context?: Record<string, any>, userId?: string, component?: string) => 
    logger.fatal(message, error, context, userId, component),
};
