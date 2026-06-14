import * as SQLite from 'expo-sqlite';
import { migrations } from '@/db/migrations';
import { seedFreshDatabase } from '@/db/seedData';
import type { TodoSomDatabase } from '@/db/databaseTypes';
import { nowIso } from '@/lib/uuid';

export type { TodoSomDatabase } from '@/db/databaseTypes';

let dbInstance: TodoSomDatabase | null = null;

export async function openDatabase(): Promise<TodoSomDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  const db = await SQLite.openDatabaseAsync('todosom.db');
  await runMigrations(db);
  await seedIfNeeded(db);
  dbInstance = db;
  return db;
}

export function resetDatabaseInstance(): void {
  dbInstance = null;
}

export async function runMigrations(db: TodoSomDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);

  for (const migration of migrations) {
    const existing = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM schema_migrations WHERE id = ?',
      [migration.id],
    );
    if (existing) {
      continue;
    }
    await db.withTransactionAsync(async () => {
      for (const statement of migration.up) {
        await db.execAsync(statement);
      }
      await db.runAsync(
        'INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)',
        [migration.id, migration.name, nowIso()],
      );
    });
  }
}

async function seedIfNeeded(db: TodoSomDatabase): Promise<void> {
  await seedFreshDatabase(db);
}
