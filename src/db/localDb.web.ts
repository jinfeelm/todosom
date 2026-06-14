import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import { createRequire } from 'node:module';
import { migrations } from '@/db/migrations';
import { seedFreshDatabase } from '@/db/seedData';
import type { SqlRunResult, TodoSomDatabase } from '@/db/databaseTypes';
import { nowIso } from '@/lib/uuid';

export type { TodoSomDatabase } from '@/db/databaseTypes';

const STORAGE_KEY = 'todosom_web_sqlite_v1';

/** Flatten `[id]` or variadic `id` into a single bind array for sql.js. */
export function normalizeParams(...params: unknown[]): unknown[] {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
}

let sqlModule: SqlJsStatic | null = null;
let dbInstance: TodoSomDatabase | null = null;
let rawDb: Database | null = null;

class WebSqlDatabase implements TodoSomDatabase {
  constructor(private readonly db: Database) {}

  async execAsync(source: string): Promise<void> {
    this.db.exec(source);
    persist(this.db);
  }

  async runAsync(source: string, ...params: unknown[]): Promise<SqlRunResult> {
    const bound = normalizeParams(...params) as (string | number | null | Uint8Array)[];
    this.db.run(source, bound);
    persist(this.db);
    return {
      lastInsertRowId: 0,
      changes: this.db.getRowsModified(),
    };
  }

  async getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null> {
    const bound = normalizeParams(...params);
    const stmt = this.db.prepare(source);
    try {
      if (bound.length > 0) {
        stmt.bind(bound as (string | number | null | Uint8Array)[]);
      }
      if (stmt.step()) {
        return stmt.getAsObject() as T;
      }
      return null;
    } finally {
      stmt.free();
    }
  }

  async getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]> {
    const bound = normalizeParams(...params);
    const stmt = this.db.prepare(source);
    const rows: T[] = [];
    try {
      if (bound.length > 0) {
        stmt.bind(bound as (string | number | null | Uint8Array)[]);
      }
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.db.run('BEGIN');
    try {
      await task();
      this.db.run('COMMIT');
      persist(this.db);
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    }
  }
}

function persist(db: Database): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  const binary = db.export();
  const encoded = Array.from(binary);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encoded));
}

const nodeRequire = createRequire(import.meta.url);

async function loadSqlModule(): Promise<SqlJsStatic> {
  if (sqlModule) {
    return sqlModule;
  }
  if (typeof window === 'undefined') {
    const initAsm = nodeRequire('sql.js/dist/sql-asm.js') as typeof initSqlJs;
    sqlModule = await initAsm();
    return sqlModule;
  }
  sqlModule = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });
  return sqlModule;
}

async function createWebDatabase(): Promise<Database> {
  const SQL = await loadSqlModule();
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const bytes = new Uint8Array(JSON.parse(saved) as number[]);
      return new SQL.Database(bytes);
    }
  }
  return new SQL.Database();
}

export async function openDatabase(): Promise<TodoSomDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  rawDb = await createWebDatabase();
  const adapter = new WebSqlDatabase(rawDb);
  await runMigrations(adapter);
  await seedIfNeeded(adapter);
  dbInstance = adapter;
  return adapter;
}

export function resetDatabaseInstance(): void {
  dbInstance = null;
  rawDb?.close();
  rawDb = null;
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
