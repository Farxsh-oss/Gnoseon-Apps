import { ServerDatabaseService } from './server-database';

class MessageCleanupService {
  private db: ServerDatabaseService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(db: ServerDatabaseService) {
    this.db = db;
  }

  start() {
    console.log('[Cleanup] Starting message cleanup job (runs every 5 minutes)');
    
    // Run cleanup immediately on startup
    this.runCleanup();
    
    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[Cleanup] Message cleanup job stopped');
    }
  }

  private runCleanup() {
    try {
      const deletedCount = this.db.deleteExpiredMessages();
      if (deletedCount > 0) {
        console.log(`[Cleanup] Successfully deleted ${deletedCount} expired messages`);
      }
    } catch (error) {
      console.error('[Cleanup] Error running message cleanup:', error);
    }
  }
}

export { MessageCleanupService };
