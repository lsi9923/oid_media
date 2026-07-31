import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type {
  AppState,
  ChannelEntry,
  CharacterRef,
  ClaudeProjectKey,
  ClaudeProjectState,
  SceneItem,
  ThumbnailCopy,
} from '../types';
import { STEPS } from '../data/steps';
import { clearState, createInitialState, loadState, saveState } from '../lib/storage';

type Action =
  | { type: 'setField'; key: keyof AppState; value: AppState[keyof AppState] }
  | { type: 'setActiveStep'; stepId: string }
  | { type: 'toggleCheck'; stepId: string; itemId: string }
  | { type: 'toggleStepComplete'; stepId: string }
  | { type: 'setClaudeProject'; key: ClaudeProjectKey; patch: Partial<ClaudeProjectState> }
  | { type: 'setCharacters'; characters: CharacterRef[] }
  | { type: 'setScenes'; scenes: SceneItem[] }
  | { type: 'setThumbnailCopies'; copies: ThumbnailCopy[] }
  | { type: 'setChannels'; channels: ChannelEntry[] }
  | { type: 'reset' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.key]: action.value };

    case 'setActiveStep':
      return { ...state, activeStepId: action.stepId };

    case 'toggleCheck': {
      const key = `${action.stepId}::${action.itemId}`;
      return { ...state, checks: { ...state.checks, [key]: !state.checks[key] } };
    }

    case 'toggleStepComplete': {
      const done = state.completedSteps.includes(action.stepId);
      return {
        ...state,
        completedSteps: done
          ? state.completedSteps.filter((id) => id !== action.stepId)
          : [...state.completedSteps, action.stepId],
      };
    }

    case 'setClaudeProject':
      return {
        ...state,
        claudeProjects: {
          ...state.claudeProjects,
          [action.key]: { ...state.claudeProjects[action.key], ...action.patch },
        },
      };

    case 'setCharacters':
      return { ...state, characters: action.characters };

    case 'setScenes':
      return { ...state, scenes: action.scenes };

    case 'setThumbnailCopies':
      return { ...state, thumbnailCopies: action.copies };

    case 'setChannels':
      return { ...state, channels: action.channels };

    case 'reset':
      return createInitialState();

    default:
      return state;
  }
}

interface StoreValue {
  state: AppState;
  /** 단일 필드 갱신 (타입 안전) */
  setField: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  setActiveStep: (stepId: string) => void;
  goRelative: (offset: number) => void;
  toggleCheck: (stepId: string, itemId: string) => void;
  isChecked: (stepId: string, itemId: string) => boolean;
  toggleStepComplete: (stepId: string) => void;
  setClaudeProject: (key: ClaudeProjectKey, patch: Partial<ClaudeProjectState>) => void;
  setCharacters: (characters: CharacterRef[]) => void;
  setScenes: (scenes: SceneItem[]) => void;
  setThumbnailCopies: (copies: ThumbnailCopy[]) => void;
  setChannels: (channels: ChannelEntry[]) => void;
  reset: () => void;
  /** 전체 진행률 0~100 */
  progress: number;
  /** 단계별 체크리스트 완료 비율 */
  stepProgress: (stepId: string) => { done: number; total: number };
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // 상태가 바뀔 때마다 저장. 렌더 빈도가 낮아 디바운스는 불필요.
  useEffect(() => {
    saveState(state);
  }, [state]);

  const setField = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    dispatch({ type: 'setField', key, value: value as AppState[keyof AppState] });
  }, []);

  const setActiveStep = useCallback((stepId: string) => {
    dispatch({ type: 'setActiveStep', stepId });
  }, []);

  const goRelative = useCallback(
    (offset: number) => {
      const currentIndex = STEPS.findIndex((s) => s.id === state.activeStepId);
      if (currentIndex < 0) return;
      const next = STEPS[currentIndex + offset];
      if (next) dispatch({ type: 'setActiveStep', stepId: next.id });
    },
    [state.activeStepId],
  );

  const toggleCheck = useCallback((stepId: string, itemId: string) => {
    dispatch({ type: 'toggleCheck', stepId, itemId });
  }, []);

  const isChecked = useCallback(
    (stepId: string, itemId: string) => Boolean(state.checks[`${stepId}::${itemId}`]),
    [state.checks],
  );

  const toggleStepComplete = useCallback((stepId: string) => {
    dispatch({ type: 'toggleStepComplete', stepId });
  }, []);

  const setClaudeProject = useCallback(
    (key: ClaudeProjectKey, patch: Partial<ClaudeProjectState>) => {
      dispatch({ type: 'setClaudeProject', key, patch });
    },
    [],
  );

  const setCharacters = useCallback((characters: CharacterRef[]) => {
    dispatch({ type: 'setCharacters', characters });
  }, []);

  const setScenes = useCallback((scenes: SceneItem[]) => {
    dispatch({ type: 'setScenes', scenes });
  }, []);

  const setThumbnailCopies = useCallback((copies: ThumbnailCopy[]) => {
    dispatch({ type: 'setThumbnailCopies', copies });
  }, []);

  const setChannels = useCallback((channels: ChannelEntry[]) => {
    dispatch({ type: 'setChannels', channels });
  }, []);

  const reset = useCallback(() => {
    clearState();
    dispatch({ type: 'reset' });
  }, []);

  const progress = useMemo(() => {
    if (STEPS.length === 0) return 0;
    const valid = state.completedSteps.filter((id) => STEPS.some((s) => s.id === id));
    return Math.round((valid.length / STEPS.length) * 100);
  }, [state.completedSteps]);

  const stepProgress = useCallback(
    (stepId: string) => {
      const step = STEPS.find((s) => s.id === stepId);
      const total = step?.checklist.length ?? 0;
      const done =
        step?.checklist.filter((item) => state.checks[`${stepId}::${item.id}`]).length ?? 0;
      return { done, total };
    },
    [state.checks],
  );

  const value = useMemo<StoreValue>(
    () => ({
      state,
      setField,
      setActiveStep,
      goRelative,
      toggleCheck,
      isChecked,
      toggleStepComplete,
      setClaudeProject,
      setCharacters,
      setScenes,
      setThumbnailCopies,
      setChannels,
      reset,
      progress,
      stepProgress,
    }),
    [
      state,
      setField,
      setActiveStep,
      goRelative,
      toggleCheck,
      isChecked,
      toggleStepComplete,
      setClaudeProject,
      setCharacters,
      setScenes,
      setThumbnailCopies,
      setChannels,
      reset,
      progress,
      stepProgress,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
