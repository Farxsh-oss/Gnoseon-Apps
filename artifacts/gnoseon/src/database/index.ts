// Unified database interface that works in both Node.js and browser environments
export type { User, Message, Chat } from './database-types';
export { browserDb } from './browser-database';

// Determine which database to use based on environment
const isNode = typeof window === 'undefined';
const isBrowser = typeof window !== 'undefined';

// Factory function to get the appropriate database instance
export async function getDatabase() {
  if (isNode) {
    // Import Node.js database only in Node.js environment
    const { db } = await import('./database');
    return db;
  } else if (isBrowser) {
    // Use browser database in browser environment
    const { browserDb } = await import('./browser-database');
    return browserDb;
  } else {
    throw new Error('Unsupported environment');
  }
}

// For convenience, export a promise that resolves to the database instance
export const dbPromise = getDatabase();
