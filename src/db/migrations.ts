export const MIGRATION_1_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nickname TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    gyeol_type TEXT NOT NULL CHECK (gyeol_type IN (
      'focus', 'create', 'learn', 'breakthrough', 'care', 'connect', 'organize'
    )),
    color TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category_id TEXT NOT NULL,
    due_date TEXT NOT NULL,
    is_core_seed INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT NOT NULL DEFAULT 'normal' CHECK (difficulty IN ('light', 'normal', 'deep')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'mist', 'archived')),
    planned_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )`,
  `CREATE TABLE IF NOT EXISTS todo_completions (
    id TEXT PRIMARY KEY,
    todo_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN (
      'snack', 'small_evolution', 'deep_evolution', 'recovery'
    )),
    gyeol_type TEXT NOT NULL,
    gyeol_points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    FOREIGN KEY (todo_id) REFERENCES todos(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS pet_species (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    asset_key TEXT NOT NULL,
    is_paid INTEGER NOT NULL DEFAULT 0,
    product_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS pet_instances (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    species_id TEXT NOT NULL,
    name TEXT,
    life_stage TEXT NOT NULL CHECK (life_stage IN ('egg', 'baby', 'growth', 'mature', 'archived')),
    primary_gyeol TEXT,
    secondary_gyeol TEXT,
    affection INTEGER NOT NULL DEFAULT 0,
    started_at TEXT NOT NULL,
    archived_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (species_id) REFERENCES pet_species(id)
  )`,
  `CREATE TABLE IF NOT EXISTS gyeol_score_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    pet_instance_id TEXT NOT NULL,
    todo_id TEXT,
    gyeol_type TEXT NOT NULL,
    reward_type TEXT NOT NULL,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pet_instance_id) REFERENCES pet_instances(id),
    FOREIGN KEY (todo_id) REFERENCES todos(id)
  )`,
  `CREATE TABLE IF NOT EXISTS evolution_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    pet_instance_id TEXT NOT NULL,
    from_stage TEXT NOT NULL,
    to_stage TEXT NOT NULL,
    result_form TEXT NOT NULL,
    primary_gyeol TEXT NOT NULL,
    secondary_gyeol TEXT,
    evolved_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pet_instance_id) REFERENCES pet_instances(id)
  )`,
  `CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    pet_instance_id TEXT NOT NULL,
    theme_id TEXT NOT NULL DEFAULT 'default_room',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pet_instance_id) REFERENCES pet_instances(id)
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    acquired_at TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'default',
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT,
    product_id TEXT NOT NULL,
    entitlement_id TEXT,
    purchased_at TEXT,
    status TEXT NOT NULL DEFAULT 'placeholder',
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_todos_user_due_status ON todos(user_id, due_date, status)`,
  `CREATE INDEX IF NOT EXISTS idx_todos_core_seed_date ON todos(user_id, due_date, is_core_seed)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_todo_completions_todo_once ON todo_completions(todo_id)`,
  `CREATE INDEX IF NOT EXISTS idx_score_events_pet_time ON gyeol_score_events(pet_instance_id, occurred_at)`,
  `CREATE INDEX IF NOT EXISTS idx_score_events_user_time ON gyeol_score_events(user_id, occurred_at)`,
  `CREATE INDEX IF NOT EXISTS idx_pet_instances_current ON pet_instances(user_id, archived_at, life_stage)`,
  `CREATE INDEX IF NOT EXISTS idx_evolution_history_pet ON evolution_history(pet_instance_id, evolved_at)`,
];

export interface Migration {
  id: number;
  name: string;
  up: string[];
}

export const migrations: Migration[] = [
  {
    id: 1,
    name: 'initial_local_mvp_schema',
    up: MIGRATION_1_STATEMENTS,
  },
];
