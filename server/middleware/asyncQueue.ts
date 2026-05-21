import { Request, Response, NextFunction } from 'express';

interface QueuedTask {
  id: string;
  type: string;
  data: any;
  priority: number;
  createdAt: number;
  retries: number;
  maxRetries: number;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

class AsyncQueueService {
  private queue: QueuedTask[] = [];
  private processing = false;
  private workers: Map<string, (task: QueuedTask) => Promise<any>> = new Map();
  
  // Register a worker for a specific task type
  registerWorker(type: string, worker: (task: QueuedTask) => Promise<any>): void {
    this.workers.set(type, worker);
  }
  
  // Add a task to the queue
  async addTask<T>(
    type: string, 
    data: any, 
    priority: number = 0,
    maxRetries: number = 3
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task: QueuedTask = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        priority,
        createdAt: Date.now(),
        retries: 0,
        maxRetries,
        resolve,
        reject
      };
      
      // Insert task in priority order (higher priority first)
      const insertIndex = this.queue.findIndex(t => t.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(task);
      } else {
        this.queue.splice(insertIndex, 0, task);
      }
      
      console.log(`Task ${task.id} added to queue (priority: ${priority}, queue size: ${this.queue.length})`);
      
      // Start processing if not already running
      this.processQueue();
    });
  }
  
  // Process the queue
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    console.log('Starting queue processing...');
    
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      const worker = this.workers.get(task.type);
      
      if (!worker) {
        console.error(`No worker found for task type: ${task.type}`);
        task.reject(new Error(`No worker found for task type: ${task.type}`));
        continue;
      }
      
      try {
        console.log(`Processing task ${task.id} of type ${task.type}`);
        const result = await worker(task);
        task.resolve(result);
        console.log(`Task ${task.id} completed successfully`);
      } catch (error) {
        console.error(`Task ${task.id} failed:`, error);
        
        task.retries++;
        if (task.retries < task.maxRetries) {
          console.log(`Retrying task ${task.id} (${task.retries}/${task.maxRetries})`);
          // Add back to queue with lower priority
          task.priority = Math.max(0, task.priority - 1);
          this.queue.push(task);
        } else {
          console.error(`Task ${task.id} failed after ${task.maxRetries} retries`);
          task.reject(error as Error);
        }
      }
    }
    
    this.processing = false;
    console.log('Queue processing completed');
  }
  
  // Get queue status
  getQueueStatus(): {
    size: number;
    processing: boolean;
    taskTypes: { [key: string]: number };
  } {
    const taskTypes: { [key: string]: number } = {};
    this.queue.forEach(task => {
      taskTypes[task.type] = (taskTypes[task.type] || 0) + 1;
    });
    
    return {
      size: this.queue.length,
      processing: this.processing,
      taskTypes
    };
  }
  
  // Clear the queue
  clearQueue(): void {
    this.queue.forEach(task => {
      task.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

export const asyncQueueService = new AsyncQueueService();

// Express middleware for queueing requests
export const queueMiddleware = (taskType: string, priority: number = 0) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only queue specific request types (POST, PUT, DELETE)
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return next();
    }
    
    // Add task to queue
    asyncQueueService.addTask(taskType, {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      query: req.query,
      headers: req.headers
    }, priority)
    .then((result) => {
      res.json(result);
    })
    .catch((error) => {
      console.error(`Queued request failed:`, error);
      res.status(500).json({
        error: 'Request processing failed',
        message: error.message
      });
    });
  };
};
