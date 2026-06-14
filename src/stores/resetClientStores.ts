import { usePetStore } from '@/stores/petStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTodoStore } from '@/stores/todoStore';

/** DB 초기화 후 메모리에 남은 Zustand 상태를 비웁니다. */
export function resetClientStores(): void {
  useTodoStore.setState({
    screenState: 'loading',
    todos: [],
    toast: null,
    errorMessage: null,
    lastCompletion: null,
  });
  usePetStore.setState({
    screenState: 'loading',
    petRoom: null,
    archivedPets: [],
    evolutionHistory: [],
    showEvolutionModal: false,
    talkDialogue: null,
    talkAnimationState: null,
    errorMessage: null,
  });
  useSettingsStore.setState({
    onboardingCompleted: false,
    notificationsEnabled: true,
    isHydrated: true,
    previousLastOpenAt: null,
  });
}
