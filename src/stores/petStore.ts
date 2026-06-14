import { create } from 'zustand';
import type {
  ArchivePetCardView,
  EvolutionHistory,
  PetRoomView,
} from '@/domain/gyeol/types';
import type { TodoSomDatabase } from '@/db/databaseTypes';
import {
  archiveCurrentPetAndStartNew,
  buildPetRoomView,
  listArchivedPets,
  listEvolutionHistory,
} from '@/db/repositories';
import { selectDialogue } from '@/domain/pet/dialogue';
import type { PetAnimationState } from '@/lib/petManifest';
import { copy } from '@/lib/copy';
import { trackEvent } from '@/lib/analytics';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ScreenState } from '@/stores/todoStore';

interface PetStore {
  screenState: ScreenState;
  petRoom: PetRoomView | null;
  archivedPets: ArchivePetCardView[];
  evolutionHistory: EvolutionHistory[];
  showEvolutionModal: boolean;
  talkDialogue: string | null;
  talkAnimationState: PetAnimationState | null;
  errorMessage: string | null;
  loadPetRoom: (db: TodoSomDatabase) => Promise<void>;
  loadArchive: (db: TodoSomDatabase) => Promise<void>;
  talk: (db: TodoSomDatabase) => Promise<void>;
  dismissEvolutionModal: () => void;
  showEvolution: () => void;
  startNewJourney: (db: TodoSomDatabase) => Promise<boolean>;
  loadEvolutionHistory: (db: TodoSomDatabase, petId: string) => Promise<void>;
}

export const usePetStore = create<PetStore>((set, get) => ({
  screenState: 'loading',
  petRoom: null,
  archivedPets: [],
  evolutionHistory: [],
  showEvolutionModal: false,
  talkDialogue: null,
  talkAnimationState: null,
  errorMessage: null,

  loadPetRoom: async (db) => {
    set({ screenState: 'loading', errorMessage: null });
    try {
      const previousLastOpenAt = useSettingsStore.getState().previousLastOpenAt;
      const petRoom = await buildPetRoomView(db, { previousLastOpenAt });
      set({ petRoom, screenState: 'ready', talkDialogue: petRoom.currentDialogue });
      trackEvent('pet_room_viewed', {
        life_stage: petRoom.pet.lifeStage,
        primary_gyeol: petRoom.pet.primaryGyeol,
      });
    } catch {
      set({
        screenState: 'error',
        errorMessage: copy.petRoom.loadError,
      });
    }
  },

  loadArchive: async (db) => {
    set({ screenState: 'loading', errorMessage: null });
    try {
      const archivedPets = await listArchivedPets(db);
      set({ archivedPets, screenState: 'ready' });
    } catch {
      set({
        screenState: 'error',
        errorMessage: copy.archive.loadError,
      });
    }
  },

  talk: async (db) => {
    const petRoom = get().petRoom;
    if (!petRoom) {
      return;
    }
    const entry = selectDialogue({
      lifeStage: petRoom.pet.lifeStage,
      isFirstVisit: false,
      isOnboardingHatch: false,
      coreSeedJustCompleted: false,
      snackCountToday: petRoom.snackCountToday,
      daysSinceLastVisit: petRoom.daysSinceLastVisit,
      canEvolve: petRoom.canEvolve,
    });
    set({ talkDialogue: entry.text, talkAnimationState: entry.animationState });
    trackEvent('pet_talk_tapped', { dialogue_condition: entry.condition });
  },

  dismissEvolutionModal: () => set({ showEvolutionModal: false }),

  showEvolution: () => set({ showEvolutionModal: true }),

  startNewJourney: async (db) => {
    try {
      await archiveCurrentPetAndStartNew(db);
      trackEvent('new_journey_started', {});
      await get().loadArchive(db);
      return true;
    } catch {
      set({ errorMessage: copy.archive.startJourneyError });
      return false;
    }
  },

  loadEvolutionHistory: async (db, petId) => {
    const evolutionHistory = await listEvolutionHistory(db, petId);
    set({ evolutionHistory });
  },
}));
