/**
 * Offline support utilities for Gnōseōn application
 * Provides service worker, caching, and offline functionality
 */

// Service Worker utilities
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async register(swPath: string = '/sw.js'): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker is not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register(swPath);
      console.log('Service Worker registered successfully');
      
      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async unregister(): Promise<boolean> {
    if (this.registration) {
      try {
        const result = await this.registration.unregister();
        this.registration = null;
        console.log('Service Worker unregistered successfully');
        return result;
      } catch (error) {
        console.error('Service Worker unregistration failed:', error);
        return false;
      }
    }
    return false;
  }

  private notifyUpdateAvailable(): void {
    // Create a custom event to notify about updates
    const event = new CustomEvent('swUpdateAvailable', {
      detail: { message: 'A new version of the app is available' },
    });
    window.dispatchEvent(event);
  }

  async checkForUpdates(): Promise<boolean> {
    if (this.registration) {
      try {
        await this.registration.update();
        return true;
      } catch (error) {
        console.error('Failed to check for updates:', error);
        return false;
      }
    }
    return false;
  }

  skipWaiting(): void {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }
}

// Cache utilities
export class CacheManager {
  private static readonly CACHE_PREFIX = 'gnoseon-';
  private static readonly CACHE_VERSION = 'v1';
  private static readonly DEFAULT_CACHE = `${this.CACHE_PREFIX}${this.CACHE_VERSION}`;

  static async openCache(cacheName: string = this.DEFAULT_CACHE): Promise<Cache> {
    return await caches.open(cacheName);
  }

  static async addToCache(
    requests: (Request | string)[],
    cacheName: string = this.DEFAULT_CACHE
  ): Promise<void> {
    const cache = await this.openCache(cacheName);
    await cache.addAll(requests);
  }

  static async getFromCache(
    request: Request | string,
    cacheName: string = this.DEFAULT_CACHE
  ): Promise<Response | undefined> {
    const cache = await this.openCache(cacheName);
    return await cache.match(request);
  }

  static async deleteFromCache(
    request: Request | string,
    cacheName: string = this.DEFAULT_CACHE
  ): Promise<boolean> {
    const cache = await this.openCache(cacheName);
    return await cache.delete(request);
  }

  static async clearCache(cacheName: string = this.DEFAULT_CACHE): Promise<boolean> {
    const cache = await this.openCache(cacheName);
    const keys = await cache.keys();
    await Promise.all(keys.map(key => cache.delete(key)));
    return true;
  }

  static async getAllCaches(): Promise<string[]> {
    return await caches.keys();
  }

  static async deleteOldCaches(): Promise<void> {
    const allCaches = await this.getAllCaches();
    const currentCache = this.DEFAULT_CACHE;
    
    await Promise.all(
      allCaches
        .filter(cacheName => cacheName.startsWith(this.CACHE_PREFIX) && cacheName !== currentCache)
        .map(cacheName => caches.delete(cacheName))
    );
  }

  static async cacheAssets(assets: string[]): Promise<void> {
    await this.addToCache(assets, `${this.DEFAULT_CACHE}-assets`);
  }

  static async cacheApiResponse(url: string, response: Response): Promise<void> {
    const cache = await this.openCache(`${this.DEFAULT_CACHE}-api`);
    await cache.put(url, response.clone());
  }

  static async getCachedApiResponse(url: string): Promise<Response | null> {
    const cache = await this.openCache(`${this.DEFAULT_CACHE}-api`);
    const response = await cache.match(url);
    return response || null;
  }
}

// Offline storage utilities
export class OfflineStorage {
  private static readonly DB_NAME = 'gnoseon-offline';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'offline-data';

  private static db: IDBDatabase | null = null;

  static async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  static async set<T>(key: string, data: T): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put({ id: key, data, timestamp: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  static async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
    });
  }

  static async remove(key: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  static async clear(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  static async getAllKeys(): Promise<string[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  static async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) await this.init();
    
    const cutoffTime = Date.now() - maxAge;
    const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        if (cursor.value.timestamp < cutoffTime) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }
}

// Network status utilities
export class NetworkStatus {
  private static instance: NetworkStatus;
  private listeners: ((isOnline: boolean) => void)[] = [];
  private currentStatus: boolean = navigator.onLine;

  static getInstance(): NetworkStatus {
    if (!NetworkStatus.instance) {
      NetworkStatus.instance = new NetworkStatus();
      NetworkStatus.instance.setupEventListeners();
    }
    return NetworkStatus.instance;
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.currentStatus = true;
      this.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      this.currentStatus = false;
      this.notifyListeners(false);
    });
  }

  private notifyListeners(status: boolean): void {
    this.listeners.forEach(listener => listener(status));
  }

  isOnline(): boolean {
    return this.currentStatus;
  }

  addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  removeListener(listener: (isOnline: boolean) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
}

// Offline queue for actions to sync when online
export class OfflineQueue {
  private static readonly QUEUE_KEY = 'offline-action-queue';
  private static instance: OfflineQueue;
  private queue: Array<{
    id: string;
    type: string;
    data: any;
    timestamp: number;
    retries: number;
  }> = [];

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  async init(): Promise<void> {
    try {
      const stored = await OfflineStorage.get(OfflineQueue.QUEUE_KEY);
      this.queue = (stored as Array<{
    id: string;
    type: string;
    data: any;
    timestamp: number;
    retries: number;
  }>) || [];
    } catch (error) {
      console.error('Failed to initialize offline queue:', error);
      this.queue = [];
    }
  }

  async enqueue(type: string, data: any): Promise<string> {
    const item = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(item);
    await this.saveQueue();
    
    return item.id;
  }

  async dequeue(): Promise<any | null> {
    if (this.queue.length === 0) return null;
    
    const item = this.queue.shift();
    await this.saveQueue();
    
    return item || null;
  }

  async retryFailedItem(id: string): Promise<void> {
    const item = this.queue.find(item => item.id === id);
    if (item) {
      item.retries++;
      await this.saveQueue();
    }
  }

  async removeItem(id: string): Promise<void> {
    this.queue = this.queue.filter(item => item.id !== id);
    await this.saveQueue();
  }

  getQueue(): Array<{ id: string; type: string; data: any; timestamp: number; retries: number }> {
    return [...this.queue];
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  private async saveQueue(): Promise<void> {
    try {
      await OfflineStorage.set(OfflineQueue.QUEUE_KEY, this.queue);
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// React hooks for offline functionality
import { useState, useEffect, useCallback } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const networkStatus = NetworkStatus.getInstance();
    
    const unsubscribe = networkStatus.addListener((online) => {
      setIsOnline(online);
      if (online && wasOffline) {
        setWasOffline(false);
        // Trigger sync when coming back online
        window.dispatchEvent(new CustomEvent('networkRestored'));
      } else if (!online) {
        setWasOffline(true);
      }
    });

    return unsubscribe;
  }, [wasOffline]);

  return { isOnline, wasOffline };
}

export function useOfflineQueue() {
  const [queueSize, setQueueSize] = useState(0);
  const queue = OfflineQueue.getInstance();

  useEffect(() => {
    queue.init().then(() => {
      setQueueSize(queue.getQueueSize());
    });
  }, [queue]);

  const enqueue = useCallback(async (type: string, data: any) => {
    await queue.enqueue(type, data);
    setQueueSize(queue.getQueueSize());
  }, [queue]);

  const dequeue = useCallback(async () => {
    const item = await queue.dequeue();
    setQueueSize(queue.getQueueSize());
    return item;
  }, [queue]);

  const clearQueue = useCallback(async () => {
    await queue.clearQueue();
    setQueueSize(0);
  }, [queue]);

  return { queueSize, enqueue, dequeue, clearQueue };
}

export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const swManager = ServiceWorkerManager.getInstance();

  useEffect(() => {
    const checkRegistration = async () => {
      const registered = await swManager.register();
      setIsRegistered(registered);
    };

    checkRegistration();

    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('swUpdateAvailable', handleUpdateAvailable);

    return () => {
      window.removeEventListener('swUpdateAvailable', handleUpdateAvailable);
    };
  }, [swManager]);

  const skipWaiting = useCallback(() => {
    swManager.skipWaiting();
    setUpdateAvailable(false);
  }, [swManager]);

  return { updateAvailable, isRegistered, skipWaiting };
}

// Offline utilities export
export const offlineUtils = {
  ServiceWorkerManager,
  CacheManager,
  OfflineStorage,
  NetworkStatus,
  OfflineQueue,
  useNetworkStatus,
  useOfflineQueue,
  useServiceWorker,
};

// Export singleton instances
export const serviceWorkerManager = ServiceWorkerManager.getInstance();
export const networkStatus = NetworkStatus.getInstance();
export const offlineQueue = OfflineQueue.getInstance();
