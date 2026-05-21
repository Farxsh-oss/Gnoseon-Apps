import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';

type LogLevel = 'info' | 'warn' | 'error';

const logsDir = path.join(process.cwd(), 'logs');

function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

function writeLog(level: LogLevel, message: string, context?: Record<string, unknown>) {
  ensureLogsDir();

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'gnoseon-server',
    message,
    ...(context ? { context } : {}),
  };

  const line = `${JSON.stringify(entry)}\n`;
  fs.appendFileSync(path.join(logsDir, 'combined.log'), line);

  if (level === 'error') {
    fs.appendFileSync(path.join(logsDir, 'error.log'), line);
  }

  const output = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  output(`${entry.timestamp} [${level}] ${message}`, context ?? '');
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => writeLog('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => writeLog('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => writeLog('error', message, context),
};

export function logRequest(req: Request, res: Response, duration: number) {
  writeLog('info', 'request', {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    duration,
  });
}

export function logError(error: Error, req?: Request) {
  writeLog('error', 'server_error', {
    message: error.message,
    stack: error.stack,
    method: req?.method,
    path: req?.path,
  });
}

export function logAuth(event: string, userId: string, success: boolean, context?: Record<string, unknown>) {
  writeLog(success ? 'info' : 'warn', `auth_${event}`, {
    userId,
    success,
    ...context,
  });
}

export function logSystem(event: string, context?: Record<string, unknown>) {
  writeLog('info', `system_${event}`, context);
}

export function logSocket(event: string, socketId: string, userId?: string) {
  writeLog('info', `socket_${event}`, {
    socketId,
    userId,
  });
}
