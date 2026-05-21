// @ts-nocheck
/**
 * Analytics and monitoring utilities for Gnōseōn application
 * Provides user analytics, performance monitoring, and error tracking
 */

import { logger } from './logger';
import { errorHandler } from './errorHandler';

// User analytics utilities
export class UserAnalytics {
  private static instance: UserAnalytics;
  private events: AnalyticsEvent[] = [];
  private userId: string | null = null;
  private sessionId: string;
  private sessionStart: number;

  static getInstance(): UserAnalytics {
    if (!UserAnalytics.instance) {
      UserAnalytics.instance = new UserAnalytics();
    }
    return UserAnalytics.instance;
  }

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.setupPageTracking();
  }

  setUserId(userId: string): void {
    this.userId = userId;
    logger.info('User ID set for analytics', { userId });
  }

  trackEvent(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      name: eventName,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      properties: properties || {},
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.events.push(event);
    logger.debug('Analytics event tracked', { eventName, eventId: event.id });

    // Send to analytics service if enabled
    if (this.isAnalyticsEnabled()) {
      this.sendEvent(event);
    }

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  trackPageView(page: string, title?: string): void {
    this.trackEvent('page_view', {
      page,
      title: title || document.title,
      referrer: document.referrer,
    });
  }

  trackUserAction(action: string, properties?: Record<string, any>): void {
    this.trackEvent('user_action', {
      action,
      ...properties,
    });
  }

  trackFeatureUsage(feature: string, properties?: Record<string, any>): void {
    this.trackEvent('feature_usage', {
      feature,
      ...properties,
    });
  }

  trackError(error: Error | string, context?: Record<string, any>): void {
    this.trackEvent('error', {
      errorMessage: error instanceof Error ? error.message : error,
      errorStack: error instanceof Error ? error.stack : undefined,
      ...context,
    });
  }

  trackPerformance(metric: string, value: number, properties?: Record<string, any>): void {
    this.trackEvent('performance', {
      metric,
      value,
      ...properties,
    });
  }

  getEvents(eventName?: string, limit?: number): AnalyticsEvent[] {
    let filtered = this.events;
    
    if (eventName) {
      filtered = filtered.filter(event => event.name === eventName);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  getEventStats(): AnalyticsStats {
    const stats: AnalyticsStats = {
      totalEvents: this.events.length,
      sessionDuration: Date.now() - this.sessionStart,
      eventsByName: {},
      uniqueUsers: new Set(this.events.map(e => e.userId).filter(Boolean)).size,
      topPages: this.getTopPages(),
      topFeatures: this.getTopFeatures(),
    };

    this.events.forEach(event => {
      stats.eventsByName[event.name] = (stats.eventsByName[event.name] || 0) + 1;
    });

    return stats;
  }

  exportEvents(): string {
    return JSON.stringify({
      events: this.events,
      sessionId: this.sessionId,
      sessionStart: this.sessionStart,
      userId: this.userId,
      exportedAt: Date.now(),
    }, null, 2);
  }

  clearEvents(): void {
    this.events = [];
    logger.info('Analytics events cleared');
  }

  private setupPageTracking(): void {
    // Track initial page view
    this.trackPageView(window.location.pathname);

    // Track page changes for SPA
    let lastUrl = window.location.href;
    const checkUrlChange = () => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        this.trackPageView(window.location.pathname);
      }
    };

    // Check for URL changes every second
    setInterval(checkUrlChange, 1000);

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end', {
        sessionDuration: Date.now() - this.sessionStart,
        totalEvents: this.events.length,
      });
    });
  }

  private getTopPages(): Array<{ page: string; views: number }> {
    const pageViews: Record<string, number> = {};
    
    this.events
      .filter(event => event.name === 'page_view')
      .forEach(event => {
        const page = event.properties?.page || 'unknown';
        pageViews[page] = (pageViews[page] || 0) + 1;
      });

    return Object.entries(pageViews)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  private getTopFeatures(): Array<{ feature: string; usage: number }> {
    const featureUsage: Record<string, number> = {};
    
    this.events
      .filter(event => event.name === 'feature_usage')
      .forEach(event => {
        const feature = event.properties?.feature || 'unknown';
        featureUsage[feature] = (featureUsage[feature] || 0) + 1;
      });

    return Object.entries(featureUsage)
      .map(([feature, usage]) => ({ feature, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);
  }

  private isAnalyticsEnabled(): boolean {
    return import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isAnalyticsEnabled()) return;

    try {
      const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
      if (!endpoint) return;

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      logger.error('Failed to send analytics event', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    this.setupPerformanceObservers();
  }

  trackMetric(name: string, value: number, properties?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      id: this.generateMetricId(),
      name,
      value,
      timestamp: Date.now(),
      properties: properties || {},
      url: window.location.href,
    };

    this.metrics.push(metric);
    logger.debug('Performance metric tracked', { name, value });

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getMetrics(metricName?: string, limit?: number): PerformanceMetric[] {
    let filtered = this.metrics;
    
    if (metricName) {
      filtered = filtered.filter(metric => metric.name === metricName);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  getMetricStats(metricName?: string): PerformanceStats {
    let filtered = this.metrics;
    
    if (metricName) {
      filtered = filtered.filter(metric => metric.name === metricName);
    }

    if (filtered.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        median: 0,
        p95: 0,
      };
    }

    const values = filtered.map(m => m.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = values[0];
    const max = values[count - 1];
    const median = count % 2 === 0 
      ? (values[count / 2 - 1] + values[count / 2]) / 2 
      : values[Math.floor(count / 2)];
    const p95 = values[Math.floor(count * 0.95)];

    return {
      count,
      average,
      min,
      max,
      median,
      p95,
    };
  }

  trackPageLoad(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (entries.length > 0) {
        const entry = entries[0];
        
        this.trackMetric('dom_content_loaded', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart);
        this.trackMetric('page_load', entry.loadEventEnd - entry.loadEventStart);
        this.trackMetric('time_to_first_byte', entry.responseStart - entry.requestStart);
        this.trackMetric('first_paint', this.getFirstPaint());
        this.trackMetric('first_contentful_paint', this.getFirstContentfulPaint());
      }
    }
  }

  trackResourceTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      entries.forEach(entry => {
        this.trackMetric('resource_load_time', entry.duration, {
          name: entry.name,
          type: this.getResourceType(entry.name),
          size: entry.transferSize,
        });
      });
    }
  }

  trackUserTiming(name: string, duration: number, properties?: Record<string, any>): void {
    this.trackMetric(`user_timing_${name}`, duration, properties);
  }

  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      exportedAt: Date.now(),
    }, null, 2);
  }

  clearMetrics(): void {
    this.metrics = [];
    logger.info('Performance metrics cleared');
  }

  private setupPerformanceObservers(): void {
    if ('PerformanceObserver' in window) {
      // Observe largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver((list: any) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const entry = entries[entries.length - 1];
            this.trackMetric('largest_contentful_paint', entry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        logger.warn('LCP observer not supported', error);
      }

      // Observe first input delay
      try {
        const fidObserver = new PerformanceObserver((list: any) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const entry = entries[0];
            this.trackMetric('first_input_delay', entry.processingStart - entry.startTime);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        logger.warn('FID observer not supported', error);
      }

      // Observe layout shift
      try {
        const clsObserver = new PerformanceObserver((list: any) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            const perfEntry = entry as any;
            if (!perfEntry.hadRecentInput) {
              clsValue += perfEntry.value;
            }
          }
          this.trackMetric('cumulative_layout_shift', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        logger.warn('CLS observer not supported', error);
      }
    }
  }

  private getFirstPaint(): number {
    const entries = performance.getEntriesByType('paint');
    const firstPaint = entries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  private getFirstContentfulPaint(): number {
    const entries = performance.getEntriesByType('paint');
    const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : 0;
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    return 'other';
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Error tracking utilities
export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: TrackedError[] = [];

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  constructor() {
    this.setupErrorHandlers();
  }

  trackError(error: Error | string, context?: Record<string, any>, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    const trackedError: TrackedError = {
      id: this.generateErrorId(),
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Date.now(),
      context: context || {},
      severity,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId(),
    };

    this.errors.push(trackedError);
    logger.error('Error tracked', trackedError);

    // Send to error tracking service if enabled
    if (this.isErrorTrackingEnabled()) {
      this.sendError(trackedError);
    }

    // Keep only last 1000 errors
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000);
    }
  }

  getErrors(severity?: string, limit?: number): TrackedError[] {
    let filtered = this.errors;
    
    if (severity) {
      filtered = filtered.filter(error => error.severity === severity);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  getErrorStats(): ErrorStats {
    const stats: ErrorStats = {
      totalErrors: this.errors.length,
      errorsBySeverity: {},
      errorsByUrl: {},
      recentErrors: this.errors.slice(-10),
    };

    this.errors.forEach(error => {
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
      stats.errorsByUrl[error.url] = (stats.errorsByUrl[error.url] || 0) + 1;
    });

    return stats;
  }

  exportErrors(): string {
    return JSON.stringify({
      errors: this.errors,
      exportedAt: Date.now(),
    }, null, 2);
  }

  clearErrors(): void {
    this.errors = [];
    logger.info('Tracked errors cleared');
  }

  private setupErrorHandlers(): void {
    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event: any) => {
      this.trackError(event.reason, { type: 'unhandled_promise_rejection' }, 'high');
    });

    // Track uncaught errors
    window.addEventListener('error', (event: any) => {
      this.trackError(event.error || event.message, {
        type: 'uncaught_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }, 'critical');
    });

    // Track errors from error handler
    errorHandler.onError((error: any) => {
      this.trackError(error.message, {
        type: 'app_error',
        errorType: error.type,
        component: error.component,
      }, error.severity as any);
    });
  }

  private getCurrentUserId(): string | null {
    // This would get the current user ID from your auth system
    return null;
  }

  private isErrorTrackingEnabled(): boolean {
    return import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true';
  }

  private async sendError(error: TrackedError): Promise<void> {
    if (!this.isErrorTrackingEnabled()) return;

    try {
      const endpoint = import.meta.env.VITE_ERROR_TRACKING_ENDPOINT;
      if (!endpoint) return;

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (sendError) {
      logger.error('Failed to send error to tracking service', sendError);
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage metrics utilities
export class UsageMetrics {
  private static instance: UsageMetrics;
  private metrics: UsageMetric[] = [];

  static getInstance(): UsageMetrics {
    if (!UsageMetrics.instance) {
      UsageMetrics.instance = new UsageMetrics();
    }
    return UsageMetrics.instance;
  }

  trackUsage(feature: string, action: string, value: number = 1, properties?: Record<string, any>): void {
    const metric: UsageMetric = {
      id: this.generateMetricId(),
      feature,
      action,
      value,
      timestamp: Date.now(),
      properties: properties || {},
      userId: this.getCurrentUserId(),
    };

    this.metrics.push(metric);
    logger.debug('Usage metric tracked', { feature, action, value });

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getUsageMetrics(feature?: string, action?: string): UsageMetric[] {
    let filtered = this.metrics;
    
    if (feature) {
      filtered = filtered.filter(metric => metric.feature === feature);
    }
    
    if (action) {
      filtered = filtered.filter(metric => metric.action === action);
    }
    
    return filtered;
  }

  getUsageStats(): UsageStats {
    const stats: UsageStats = {
      totalUsage: this.metrics.length,
      usageByFeature: {},
      usageByAction: {},
      topFeatures: this.getTopFeatures(),
      topActions: this.getTopActions(),
    };

    this.metrics.forEach(metric => {
      stats.usageByFeature[metric.feature] = (stats.usageByFeature[metric.feature] || 0) + metric.value;
      stats.usageByAction[metric.action] = (stats.usageByAction[metric.action] || 0) + metric.value;
    });

    return stats;
  }

  private getCurrentUserId(): string | null {
    return null;
  }

  private getTopFeatures(): Array<{ feature: string; usage: number }> {
    const featureUsage: Record<string, number> = {};
    
    this.metrics.forEach(metric => {
      featureUsage[metric.feature] = (featureUsage[metric.feature] || 0) + metric.value;
    });

    return Object.entries(featureUsage)
      .map(([feature, usage]) => ({ feature, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);
  }

  private getTopActions(): Array<{ action: string; usage: number }> {
    const actionUsage: Record<string, number> = {};
    
    this.metrics.forEach(metric => {
      actionUsage[metric.action] = (actionUsage[metric.action] || 0) + metric.value;
    });

    return Object.entries(actionUsage)
      .map(([action, usage]) => ({ action, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);
  }

  private generateMetricId(): string {
    return `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Type definitions
interface AnalyticsEvent {
  id: string;
  name: string;
  timestamp: number;
  userId: string | null;
  sessionId: string;
  properties: Record<string, any>;
  url: string;
  userAgent: string;
}

interface AnalyticsStats {
  totalEvents: number;
  sessionDuration: number;
  eventsByName: Record<string, number>;
  uniqueUsers: number;
  topPages: Array<{ page: string; views: number }>;
  topFeatures: Array<{ feature: string; usage: number }>;
}

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  timestamp: number;
  properties: Record<string, any>;
  url: string;
}

interface PerformanceStats {
  count: number;
  average: number;
  min: number;
  max: number;
  median: number;
  p95: number;
}

interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  url: string;
  userAgent: string;
  userId: string | null;
}

interface ErrorStats {
  totalErrors: number;
  errorsBySeverity: Record<string, number>;
  errorsByUrl: Record<string, number>;
  recentErrors: TrackedError[];
}

interface UsageMetric {
  id: string;
  feature: string;
  action: string;
  value: number;
  timestamp: number;
  properties: Record<string, any>;
  userId: string | null;
}

interface UsageStats {
  totalUsage: number;
  usageByFeature: Record<string, number>;
  usageByAction: Record<string, number>;
  topFeatures: Array<{ feature: string; usage: number }>;
  topActions: Array<{ action: string; usage: number }>;
}

// Analytics utilities export
export const analyticsUtils = {
  UserAnalytics,
  PerformanceMonitor,
  ErrorTracker,
  UsageMetrics,
};

// Export singleton instances
export const userAnalytics = UserAnalytics.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();
export const errorTracker = ErrorTracker.getInstance();
export const usageMetrics = UsageMetrics.getInstance();
