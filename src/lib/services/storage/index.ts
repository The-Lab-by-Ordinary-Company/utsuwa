// Storage service - IndexedDB-backed persistence layer
export * from './character';
export * from './memory';
export * from './events';

// Re-export database for direct access if needed
export { db, isIndexedDBAvailable } from '$lib/db';
