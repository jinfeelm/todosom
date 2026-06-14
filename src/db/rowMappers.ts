import type {
  Category,
  Difficulty,
  EvolutionHistory,
  GyeolScoreEvent,
  GyeolType,
  LifeStage,
  PetInstance,
  PetSpecies,
  RewardType,
  Room,
  Todo,
  TodoCompletion,
  TodoStatus,
  User,
} from '@/domain/gyeol/types';

export interface UserRow {
  id: string;
  nickname: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  gyeol_type: GyeolType;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface TodoRow {
  id: string;
  user_id: string;
  title: string;
  category_id: string;
  due_date: string;
  is_core_seed: number;
  difficulty: Difficulty;
  status: TodoStatus;
  planned_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TodoCompletionRow {
  id: string;
  todo_id: string;
  user_id: string;
  completed_at: string;
  reward_type: RewardType;
  gyeol_type: GyeolType;
  gyeol_points: number;
  reason: string;
}

export interface PetSpeciesRow {
  id: string;
  name: string;
  asset_key: string;
  is_paid: number;
  product_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PetInstanceRow {
  id: string;
  user_id: string;
  species_id: string;
  name: string | null;
  life_stage: LifeStage;
  primary_gyeol: GyeolType | null;
  secondary_gyeol: GyeolType | null;
  affection: number;
  started_at: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GyeolScoreEventRow {
  id: string;
  user_id: string;
  pet_instance_id: string;
  todo_id: string | null;
  gyeol_type: GyeolType;
  reward_type: RewardType;
  points: number;
  reason: string;
  occurred_at: string;
}

export interface EvolutionHistoryRow {
  id: string;
  user_id: string;
  pet_instance_id: string;
  from_stage: LifeStage;
  to_stage: LifeStage;
  result_form: string;
  primary_gyeol: GyeolType;
  secondary_gyeol: GyeolType | null;
  evolved_at: string;
}

export interface RoomRow {
  id: string;
  user_id: string;
  pet_instance_id: string;
  theme_id: string;
  created_at: string;
  updated_at: string;
}

export function mapUser(row: UserRow): User {
  return {
    id: row.id,
    nickname: row.nickname,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    gyeolType: row.gyeol_type,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    categoryId: row.category_id,
    dueDate: row.due_date,
    isCoreSeed: row.is_core_seed === 1,
    difficulty: row.difficulty,
    status: row.status,
    plannedAt: row.planned_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTodoCompletion(row: TodoCompletionRow): TodoCompletion {
  return {
    id: row.id,
    todoId: row.todo_id,
    userId: row.user_id,
    completedAt: row.completed_at,
    rewardType: row.reward_type,
    gyeolType: row.gyeol_type,
    gyeolPoints: row.gyeol_points,
    reason: row.reason,
  };
}

export function mapPetSpecies(row: PetSpeciesRow): PetSpecies {
  return {
    id: row.id,
    name: row.name,
    assetKey: row.asset_key,
    isPaid: row.is_paid === 1,
    productId: row.product_id,
  };
}

export function mapPetInstance(row: PetInstanceRow): PetInstance {
  return {
    id: row.id,
    userId: row.user_id,
    speciesId: row.species_id,
    name: row.name,
    lifeStage: row.life_stage,
    primaryGyeol: row.primary_gyeol,
    secondaryGyeol: row.secondary_gyeol,
    affection: row.affection,
    startedAt: row.started_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapGyeolScoreEvent(row: GyeolScoreEventRow): GyeolScoreEvent {
  return {
    id: row.id,
    userId: row.user_id,
    petInstanceId: row.pet_instance_id,
    todoId: row.todo_id,
    gyeolType: row.gyeol_type,
    rewardType: row.reward_type,
    points: row.points,
    reason: row.reason,
    occurredAt: row.occurred_at,
  };
}

export function mapEvolutionHistory(row: EvolutionHistoryRow): EvolutionHistory {
  return {
    id: row.id,
    userId: row.user_id,
    petInstanceId: row.pet_instance_id,
    fromStage: row.from_stage,
    toStage: row.to_stage,
    resultForm: row.result_form,
    primaryGyeol: row.primary_gyeol,
    secondaryGyeol: row.secondary_gyeol,
    evolvedAt: row.evolved_at,
  };
}

export function mapRoom(row: RoomRow): Room {
  return {
    id: row.id,
    userId: row.user_id,
    petInstanceId: row.pet_instance_id,
    themeId: row.theme_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
