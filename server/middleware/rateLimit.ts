import { Request, Response, NextFunction } from 'express';

// Rate limiting service
class RateLimitService {
  private requests = new Map<string, number[]>();
  
  isAllowed(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    // Check if limit exceeded
    if (validRequests.length >= limit) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string, limit: number = 10, windowMs: number = 60000): number {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    return Math.max(0, limit - validRequests.length);
  }
  
  getResetTime(identifier: string, windowMs: number = 60000): number {
    const userRequests = this.requests.get(identifier) || [];
    if (userRequests.length === 0) return 0;
    
    const oldestRequest = Math.min(...userRequests);
    return oldestRequest + windowMs;
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < 300000); // 5 minutes cleanup
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

export const rateLimitService = new RateLimitService();

// Rate limiting middleware
export const rateLimitMiddleware = (options: {
  limit?: number;
  windowMs?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
} = {}) => {
  const {
    limit = 10,
    windowMs = 60000, // 1 minute
    message = 'Mohon tunggu sebentar, terlalu banyak permintaan dalam waktu singkat. Silakan coba lagi dalam beberapa saat.',
    skipSuccessfulRequests = false
  } = options;
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Get identifier (IP address or user ID if available)
    const identifier = (req as any).user?.id || req.ip || 'unknown';
    
    if (!rateLimitService.isAllowed(identifier, limit, windowMs)) {
      const remaining = rateLimitService.getRemainingRequests(identifier, limit, windowMs);
      const resetTime = rateLimitService.getResetTime(identifier, windowMs);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      return res.status(429).json({
        error: message,
        retryAfter,
        remaining,
        resetTime: new Date(resetTime).toISOString()
      });
    }
    
    // Add rate limit headers
    const remaining = rateLimitService.getRemainingRequests(identifier, limit, windowMs);
    const resetTime = rateLimitService.getResetTime(identifier, windowMs);
    
    res.set({
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTime.toString()
    });
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      rateLimitService.cleanup();
    }
    
    next();
  };
};
