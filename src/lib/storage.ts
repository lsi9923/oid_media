import type { AppState } from '../types';
import { STEPS } from '../data/steps';

const STORAGE_KEY = 'mindam-studio-state-v1';
const SCHEMA_VERSION = 1;

export function createInitialState(): AppState {
  return {
    version: SCHEMA_VERSION,
    projectTitle: '',
    activeStepId: STEPS[0]?.id ?? '',
    completedSteps: [],
    checks: {},
    claudeProjects: {
      script: { created: false, instructionsPasted: false, filesUploaded: false },
      image: { created: false, instructionsPasted: false, filesUploaded: false },
      intro: { created: false, instructionsPasted: false, filesUploaded: false },
      thumbnail: { created: false, instructionsPasted: false, filesUploaded: false },
    },
    category: '',
    topic: '',
    introLine: '',
    artStyle: '한국 조선시대 웹툰',
    targetMinutes: 120,
    script: '',
    thumbnailBrief: '',
    characters: [],
    scenes: [],
    thumbnailCopies: [],
    channels: [],
    chunkSize: 10000,
    sceneIntervalSec: 120,
  };
}

/**
 * 저장된 상태를 읽는다. 형태가 어긋나거나 버전이 다르면 기본값으로 보정한다.
 * 사용자 데이터를 잃지 않도록, 알려진 필드는 최대한 보존한다.
 */
export function loadState(): AppState {
  const base = createInitialState();
  if (typeof window === 'undefined') return base;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // 프라이빗 모드 등에서 localStorage 접근이 막힐 수 있다.
    return base;
  }
  if (!raw) return base;

  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (typeof parsed !== 'object' || parsed === null) return base;

    return {
      ...base,
      ...parsed,
      version: SCHEMA_VERSION,
      // 중첩 객체는 기본값과 병합해 새 필드가 추가돼도 깨지지 않게 한다.
      claudeProjects: { ...base.claudeProjects, ...(parsed.claudeProjects ?? {}) },
      checks: { ...(parsed.checks ?? {}) },
      completedSteps: Array.isArray(parsed.completedSteps) ? parsed.completedSteps : [],
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      scenes: Array.isArray(parsed.scenes) ? parsed.scenes : [],
      thumbnailCopies: Array.isArray(parsed.thumbnailCopies) ? parsed.thumbnailCopies : [],
      channels: Array.isArray(parsed.channels) ? parsed.channels : [],
      // 삭제된 단계 id가 저장돼 있으면 첫 단계로 되돌린다.
      activeStepId: STEPS.some((s) => s.id === parsed.activeStepId)
        ? (parsed.activeStepId as string)
        : base.activeStepId,
    };
  } catch {
    return base;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 용량 초과 시 조용히 무시한다. 앱 동작은 계속되어야 한다.
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
