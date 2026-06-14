import type { TodoSomDatabase } from '@/db/databaseTypes';
import { DEFAULT_SPECIES_ID } from '@/domain/pet/species';
import { createId, nowIso } from '@/lib/uuid';

async function ensureDefaultPetSpecies(db: TodoSomDatabase, ts: string): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO pet_species (id, name, asset_key, is_paid, product_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [DEFAULT_SPECIES_ID, '솜몽', 'som_mong', 0, null, ts, ts],
  );
}

export async function seedFreshDatabase(db: TodoSomDatabase): Promise<void> {
  const userCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM users',
  );
  if ((userCount?.count ?? 0) > 0) {
    return;
  }

  const ts = nowIso();
  const userId = createId();
  const categoryId = createId();
  const petInstanceId = createId();
  const roomId = createId();

  await db.withTransactionAsync(async () => {
    await ensureDefaultPetSpecies(db, ts);
    await db.runAsync(
      'INSERT INTO users (id, nickname, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [userId, null, ts, ts],
    );
    await db.runAsync(
      `INSERT INTO categories (id, user_id, name, gyeol_type, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, userId, '오늘', 'focus', '#6B8F71', ts, ts],
    );
    await db.runAsync(
      `INSERT INTO pet_instances (
        id, user_id, species_id, name, life_stage, primary_gyeol, secondary_gyeol,
        affection, started_at, archived_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        petInstanceId,
        userId,
        DEFAULT_SPECIES_ID,
        null,
        'egg',
        null,
        null,
        0,
        ts,
        null,
        ts,
        ts,
      ],
    );
    await db.runAsync(
      `INSERT INTO rooms (id, user_id, pet_instance_id, theme_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [roomId, userId, petInstanceId, 'default_room', ts, ts],
    );
    await db.runAsync(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
      ['onboarding_completed', 'false', ts],
    );
    await db.runAsync(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
      ['last_app_open_at', ts, ts],
    );
    await db.runAsync(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
      ['notifications_enabled', 'true', ts],
    );
  });
}

export async function wipeAllUserData(db: TodoSomDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM gyeol_score_events');
    await db.execAsync('DELETE FROM todo_completions');
    await db.execAsync('DELETE FROM todos');
    await db.execAsync('DELETE FROM evolution_history');
    await db.execAsync('DELETE FROM inventory_items');
    await db.execAsync('DELETE FROM purchases');
    await db.execAsync('DELETE FROM rooms');
    await db.execAsync('DELETE FROM pet_instances');
    await db.execAsync('DELETE FROM categories');
    await db.execAsync('DELETE FROM settings');
    await db.execAsync('DELETE FROM users');
  });
}
