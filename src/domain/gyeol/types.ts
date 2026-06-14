export type GyeolType =
  | 'focus'
  | 'create'
  | 'learn'
  | 'breakthrough'
  | 'care'
  | 'connect'
  | 'organize';

export type RewardType =
  | 'snack'
  | 'small_evolution'
  | 'deep_evolution'
  | 'recovery';

export type LifeStage =
  | 'egg'
  | 'baby'
  | 'growth'
  | 'mature'
  | 'archived';

export type TodoStatus =
  | 'open'
  | 'completed'
  | 'mist'
  | 'archived';

export type Difficulty = 'light' | 'normal' | 'deep';

export interface User {
  id: string;
  nickname: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  gyeolType: GyeolType;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  userId: string;
  title: string;
  categoryId: string;
  dueDate: string;
  isCoreSeed: boolean;
  difficulty: Difficulty;
  status: TodoStatus;
  plannedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoCompletion {
  id: string;
  todoId: string;
  userId: string;
  completedAt: string;
  rewardType: RewardType;
  gyeolType: GyeolType;
  gyeolPoints: number;
  reason: string;
}

export interface PetSpecies {
  id: string;
  name: string;
  assetKey: string;
  isPaid: boolean;
  productId: string | null;
}

export interface PetInstance {
  id: string;
  userId: string;
  speciesId: string;
  name: string | null;
  lifeStage: LifeStage;
  primaryGyeol: GyeolType | null;
  secondaryGyeol: GyeolType | null;
  affection: number;
  startedAt: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GyeolScoreEvent {
  id: string;
  userId: string;
  petInstanceId: string;
  todoId: string | null;
  gyeolType: GyeolType;
  rewardType: RewardType;
  points: number;
  reason: string;
  occurredAt: string;
}

export interface EvolutionHistory {
  id: string;
  userId: string;
  petInstanceId: string;
  fromStage: LifeStage;
  toStage: LifeStage;
  resultForm: string;
  primaryGyeol: GyeolType;
  secondaryGyeol: GyeolType | null;
  evolvedAt: string;
}

export interface Room {
  id: string;
  userId: string;
  petInstanceId: string;
  themeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TodayTodoView {
  todo: Todo;
  category: Category;
  gyeolLabel: string;
  canMarkCoreSeed: boolean;
}

export interface PetRoomView {
  pet: PetInstance;
  species: PetSpecies;
  todayScores: Record<GyeolType, number>;
  currentDialogue: string;
  dialogueAnimationState: 'idle' | 'happy' | 'talk' | 'eat' | 'sleep' | 'evolve';
  assetKey: string;
  canEvolve: boolean;
  resultForm: string | null;
  snackCountToday: number;
  daysSinceLastVisit: number;
}

export interface ArchivePetCardView {
  petInstanceId: string;
  displayName: string;
  lifeStage: LifeStage;
  resultForm: string | null;
  primaryGyeol: GyeolType | null;
  archivedAt: string | null;
}

export const GYEOL_LABELS: Record<GyeolType, string> = {
  focus: '몰입결',
  create: '창작결',
  learn: '배움결',
  breakthrough: '돌파결',
  care: '돌봄결',
  connect: '연결결',
  organize: '정돈결',
};

export const ALL_GYEOL_TYPES: GyeolType[] = [
  'focus',
  'create',
  'learn',
  'breakthrough',
  'care',
  'connect',
  'organize',
];
