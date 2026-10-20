import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const sqlite = openDatabaseSync('keel.db', {
  enableChangeListener: true,
});

// Enforce PRAGMAs immediately
sqlite.execSync(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = NORMAL;
`);

export const db = drizzle(sqlite, { schema });
