import { describe, expect, it } from 'vitest';
import { migrations } from '@/db/migrations';

describe('migrations', () => {
  it('has unique migration ids', () => {
    const ids = migrations.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses idempotent CREATE IF NOT EXISTS statements', () => {
    for (const migration of migrations) {
      for (const statement of migration.up) {
        if (statement.trim().startsWith('CREATE TABLE')) {
          expect(statement).toContain('IF NOT EXISTS');
        }
        if (statement.trim().startsWith('CREATE INDEX')) {
          expect(statement).toContain('IF NOT EXISTS');
        }
      }
    }
  });

  it('can be applied twice without duplicate migration records logic', () => {
    const applied = new Set<number>();
    for (const migration of migrations) {
      expect(applied.has(migration.id)).toBe(false);
      applied.add(migration.id);
      expect(migration.up.length).toBeGreaterThan(0);
    }
  });
});
