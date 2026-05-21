/**
 * Security utilities for Gnōseōn application
 * Provides rate limiting, input validation, and security measures
 */

import { useMemo, useState, useCallback } from 'react';

// Rate limiting utilities
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const timestamps = this.requests.get(identifier)!;

    // Remove old requests outside the window
    const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
    this.requests.set(identifier, validTimestamps);

    // Check if under the limit
    if (validTimestamps.length < this.maxRequests) {
      validTimestamps.push(now);
      return true;
    }

    return false;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(identifier)) {
      return this.maxRequests;
    }

    const timestamps = this.requests.get(identifier)!;
    const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  getResetTime(identifier: string): number {
    if (!this.requests.has(identifier)) {
      return 0;
    }

    const timestamps = this.requests.get(identifier)!;
    if (timestamps.length === 0) {
      return 0;
    }

    const oldestRequest = Math.min(...timestamps);
    return oldestRequest + this.windowMs;
  }

  clear(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

// Input validation utilities
export class InputValidator {
  private static readonly patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    username: /^[a-zA-Z0-9_]{3,20}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    displayName: /^[a-zA-Z0-9\s]{2,50}$/,
    messageId: /^[a-zA-Z0-9\-_]{1,50}$/,
    groupId: /^[a-zA-Z0-9\-_]{1,50}$/,
    phoneNumber: /^\+?[1-9]\d{1,14}$/,
    url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  };

  private static readonly sanitizers = {
    text: (input: string): string => {
      return input
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
    },
    html: (input: string): string => {
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
    },
    filename: (input: string): string => {
      return input
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
        .replace(/\.\./g, '') // Remove directory traversal
        .replace(/^\./, '') // Remove leading dot
        .substring(0, 255); // Limit length
    },
  };

  static validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' };
    }

    if (!this.patterns.email.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    if (email.length > 254) {
      return { valid: false, error: 'Email is too long' };
    }

    return { valid: true };
  }

  static validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' };
    }

    if (password.length > 128) {
      return { valid: false, error: 'Password is too long' };
    }

    if (!this.patterns.password.test(password)) {
      return { 
        valid: false, 
        error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      };
    }

    return { valid: true };
  }

  static validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username is required' };
    }

    if (!this.patterns.username.test(username)) {
      return { 
        valid: false, 
        error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores' 
      };
    }

    return { valid: true };
  }

  static validateDisplayName(displayName: string): { valid: boolean; error?: string } {
    if (!displayName || typeof displayName !== 'string') {
      return { valid: false, error: 'Display name is required' };
    }

    if (!this.patterns.displayName.test(displayName)) {
      return { 
        valid: false, 
        error: 'Display name must be 2-50 characters long and contain only letters, numbers, and spaces' 
      };
    }

    return { valid: true };
  }

  static validateMessage(message: string): { valid: boolean; error?: string; sanitized?: string } {
    if (!message || typeof message !== 'string') {
      return { valid: false, error: 'Message is required' };
    }

    if (message.length === 0) {
      return { valid: false, error: 'Message cannot be empty' };
    }

    if (message.length > 4000) {
      return { valid: false, error: 'Message is too long (max 4000 characters)' };
    }

    const sanitized = this.sanitizers.text(message);
    
    if (sanitized.length === 0) {
      return { valid: false, error: 'Message contains invalid characters' };
    }

    return { valid: true, sanitized };
  }

  static validateFilename(filename: string): { valid: boolean; error?: string; sanitized?: string } {
    if (!filename || typeof filename !== 'string') {
      return { valid: false, error: 'Filename is required' };
    }

    const sanitized = this.sanitizers.filename(filename);
    
    if (sanitized.length === 0) {
      return { valid: false, error: 'Filename contains invalid characters' };
    }

    return { valid: true, sanitized };
  }

  static validateUrl(url: string): { valid: boolean; error?: string } {
    if (!url || typeof url !== 'string') {
      return { valid: false, error: 'URL is required' };
    }

    if (!this.patterns.url.test(url)) {
      return { valid: false, error: 'Invalid URL format' };
    }

    if (url.length > 2048) {
      return { valid: false, error: 'URL is too long' };
    }

    return { valid: true };
  }

  static sanitizeInput(input: string, type: 'text' | 'html' | 'filename' = 'text'): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const sanitizer = this.sanitizers[type];
    return sanitizer ? sanitizer(input) : this.sanitizers.text(input);
  }

  static validateFileSize(size: number, maxSize: number = 10 * 1024 * 1024): { valid: boolean; error?: string } {
    if (typeof size !== 'number' || size < 0) {
      return { valid: false, error: 'Invalid file size' };
    }

    if (size > maxSize) {
      return { 
        valid: false, 
        error: `File size exceeds maximum allowed size (${this.formatFileSize(maxSize)})` 
      };
    }

    return { valid: true };
  }

  static validateFileType(type: string, allowedTypes: string[]): { valid: boolean; error?: string } {
    if (!type || typeof type !== 'string') {
      return { valid: false, error: 'File type is required' };
    }

    const normalizedType = type.toLowerCase();
    const normalizedAllowedTypes = allowedTypes.map(t => t.toLowerCase());

    if (!normalizedAllowedTypes.some(allowedType => {
      if (allowedType.endsWith('/*')) {
        return normalizedType.startsWith(allowedType.slice(0, -2));
      }
      return normalizedType === allowedType;
    })) {
      return { valid: false, error: 'File type not allowed' };
    }

    return { valid: true };
  }

  private static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

// CORS configuration utilities
export class CorsConfig {
  private static readonly defaultHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false',
  };

  static getHeaders(origin?: string, credentials: boolean = false): Record<string, string> {
    const headers = { ...this.defaultHeaders };

    if (origin) {
      headers['Access-Control-Allow-Origin'] = origin;
    }

    if (credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return headers;
  }

  static validateOrigin(origin: string, allowedOrigins: string[]): boolean {
    if (!origin || !allowedOrigins.length) {
      return true;
    }

    return allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed === origin) return true;
      
      // Support wildcard subdomains
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return origin.endsWith(domain);
      }
      
      return false;
    });
  }
}

// Content Security Policy utilities
export class CSPConfig {
  private static readonly defaultDirectives = {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: blob:",
    'font-src': "'self'",
    'connect-src': "'self'",
    'media-src': "'self'",
    'object-src': "'none'",
    'frame-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
    'frame-ancestors': "'none'",
    'upgrade-insecure-requests': '',
  };

  static generateHeader(directives: Partial<typeof CSPConfig.defaultDirectives> = {}): string {
    const mergedDirectives = { ...this.defaultDirectives, ...directives };
    
    return Object.entries(mergedDirectives)
      .map(([directive, value]) => {
        if (value === '') return directive;
        return `${directive} ${value}`;
      })
      .join('; ');
  }
}

// Security headers utilities
export class SecurityHeaders {
  static getHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': CSPConfig.generateHeader(),
    };
  }
}

// Rate limiting hook for React components
export function useRateLimiter(maxRequests: number = 10, windowMs: number = 60000) {
  const rateLimiter = useMemo(() => new RateLimiter(maxRequests, windowMs), [maxRequests, windowMs]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState(maxRequests);
  const [resetTime, setResetTime] = useState(0);

  const checkRateLimit = useCallback((identifier: string) => {
    const allowed = rateLimiter.isAllowed(identifier);
    const remaining = rateLimiter.getRemainingRequests(identifier);
    const reset = rateLimiter.getResetTime(identifier);

    setIsRateLimited(!allowed);
    setRemainingRequests(remaining);
    setResetTime(reset);

    return allowed;
  }, [rateLimiter]);

  return {
    isRateLimited,
    remainingRequests,
    resetTime,
    checkRateLimit,
  };
}

// Input validation hook for React components
export function useInputValidator<T>(validator: (value: T) => { valid: boolean; error?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback((value: T) => {
    const result = validator(value);
    setError(result.error || null);
    setIsValid(result.valid);
    return result.valid;
  }, [validator]);

  const clearError = useCallback(() => {
    setError(null);
    setIsValid(false);
  }, []);

  return {
    error,
    isValid,
    validate,
    clearError,
  };
}

// Security utilities export
export const securityUtils = {
  RateLimiter,
  InputValidator,
  CorsConfig,
  CSPConfig,
  SecurityHeaders,
  useRateLimiter,
  useInputValidator,
};

// Create default instances
export const defaultRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
export const authRateLimiter = new RateLimiter(5, 900000); // 5 requests per 15 minutes for auth
export const messageRateLimiter = new RateLimiter(30, 60000); // 30 messages per minute
