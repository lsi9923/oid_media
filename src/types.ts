/**
 * 앱 전역 타입 정의.
 * 강의(민담 유튜브 제작) 워크플로우를 단계별로 표현하고,
 * 사용자가 각 단계에서 만든 산출물을 보관하기 위한 모델.
 */

import type { EpisodeRecord } from './lib/episodeHistory';

export type { EpisodeRecord };

/** 강의에서 사용하는 외부 도구 식별자 */
export type ToolId = 'claude' | 'flow' | 'grok' | 'vrew' | 'miricanvas' | 'youtube';

/** 도구 메타데이터 */
export interface Tool {
  id: ToolId;
  name: string;
  url: string;
  /** 월 비용(원). 0이면 무료 */
  monthlyCostKrw: number;
  /** 요금제 표기 */
  plan: string;
  role: string;
  /** 강의에서 언급된 주의사항 */
  note?: string;
}

/** 단계 안에서 체크해야 할 개별 항목 */
export interface ChecklistItem {
  id: string;
  label: string;
  /** 강의에서 강조한 함정/실수 포인트 */
  warning?: string;
}

/** 단계에 붙는 인터랙티브 도구 */
export type StepWidget =
  | 'scriptVault'
  | 'characterVault'
  | 'sceneQueue'
  | 'thumbnailCopy'
  | 'scriptChunker'
  | 'projectSetup'
  | 'costCalculator'
  | 'channelTracker'
  | 'disclosure'
  | 'promptLibrary'
  | 'promptLibraryScript'
  | 'promptLibraryImage'
  | 'promptLibraryIntro'
  | 'promptLibraryThumbnail'
  | 'promptLibraryVrew'
  | 'policyRisk'
  | 'lectureDiscrepancies'
  | 'realityCheck'
  | 'scriptChecker'
  | 'episodeHistory'
  | 'dataBackup'
  | 'revenueSimulator'
  | 'runtimeCalculator'
  | 'introScorer'
  | 'nicheAdvisor'
  | 'thumbnailPreview'
  | 'opsFacts'
  | 'opsTax'
  | 'opsCopyright'
  | 'opsUpload'
  | 'opsMidroll'
  | 'setupGates'
  | 'runwayCalculator'
  | 'startupCosts';

/** 워크플로우 한 단계 */
export interface Step {
  id: string;
  phaseId: string;
  title: string;
  /** 한 줄 요약 — 이 단계에서 실제로 무엇을 하는지 */
  summary: string;
  /** 원본 강의 타임스탬프 (mm:ss 또는 h:mm:ss) */
  timestamp: string;
  /** 이 단계에서 사용하는 도구 */
  tools: ToolId[];
  /** 실행 지시 — 강의 내용을 순서대로 옮긴 것 */
  actions: string[];
  /** 체크리스트 */
  checklist: ChecklistItem[];
  /** 강의에서 강조한 핵심 원칙 */
  keyPoint?: string;
  /** 사람의 판단이 필요한 단계인지 (썸네일/인트로) */
  judgment?: boolean;
  /** 예상 소요 시간 표기 */
  duration?: string;
  /** 붙는 인터랙티브 위젯 */
  widgets?: StepWidget[];
  /** 붙여넣을 프롬프트 명령 예시 */
  prompts?: { label: string; text: string }[];
}

/** 단계 묶음(페이즈) */
export interface Phase {
  id: string;
  title: string;
  /** 페이즈 목적 */
  goal: string;
  /** 사이드바 아이콘용 짧은 라벨 */
  badge: string;
}

/** Claude 프로젝트 4종 */
export type ClaudeProjectKey = 'script' | 'image' | 'intro' | 'thumbnail';

export interface ClaudeProjectState {
  /** 프로젝트를 만들었는지 */
  created: boolean;
  /** 지침(Instructions)에 MAIN 프롬프트를 붙였는지 */
  instructionsPasted: boolean;
  /** 참고 파일 업로드 여부 (대본 프로젝트만 필요) */
  filesUploaded: boolean;
}

/** 등장인물 레퍼런스 (Flow에서 고정한 캐릭터) */
export interface CharacterRef {
  id: string;
  /** NamePicker가 확정한 이름 */
  name: string;
  /** Flow에 넣은 영어 이미지 프롬프트 */
  prompt: string;
  /** Flow에서 이미지를 뽑아 저장했는지 */
  saved: boolean;
}

/** 장면 강도 — 강의의 H/M/L 분배 */
export type SceneIntensity = 'H' | 'M' | 'L';

/** 40개 장면 중 하나 */
export interface SceneItem {
  id: string;
  /** 1-based 장면 번호 */
  index: number;
  intensity: SceneIntensity;
  /** Flow에 붙여넣을 프롬프트 */
  prompt: string;
  /** 이미지를 생성해 저장했는지 */
  done: boolean;
  /** @인물 태그가 정상 반영됐는지 (강의에서 누락 사례 언급) */
  tagVerified: boolean;
}

/** 썸네일 카피 후보 */
export interface ThumbnailCopy {
  id: string;
  text: string;
  /** 최종 선택 여부 */
  selected: boolean;
}

/** 운영 중인 채널 */
export interface ChannelEntry {
  id: string;
  name: string;
  /** 업로드한 영상 수 */
  uploads: number;
  /** 수익 창출 승인 여부 */
  monetized: boolean;
  memo: string;
}

/** 앱 전체 저장 상태 */
export interface AppState {
  /** 스키마 버전 — 마이그레이션 대비 */
  version: number;
  /** 작업 중인 영상 제목/주제 */
  projectTitle: string;
  /** 현재 보고 있는 단계 id */
  activeStepId: string;
  /** 완료 처리한 단계 id 목록 */
  completedSteps: string[];
  /** 체크박스 상태: `${stepId}::${itemId}` -> boolean */
  checks: Record<string, boolean>;
  /** Claude 프로젝트 4종 세팅 상태 */
  claudeProjects: Record<ClaudeProjectKey, ClaudeProjectState>;
  /** 선택한 카테고리 (권선징악 등) */
  category: string;
  /** 확정한 주제 */
  topic: string;
  /** 확정한 인트로 대사 */
  introLine: string;
  /** 지정한 그림체 */
  artStyle: string;
  /** 목표 영상 길이(분) */
  targetMinutes: number;
  /** Claude가 만든 최종 대본 */
  script: string;
  /** 썸네일 브리프 (대본 단계 산출물) */
  thumbnailBrief: string;
  characters: CharacterRef[];
  scenes: SceneItem[];
  thumbnailCopies: ThumbnailCopy[];
  channels: ChannelEntry[];
  /** 템플릿 반복 방지용 영상 이력 */
  episodes: EpisodeRecord[];
  /** Vrew 클립당 최대 글자수 */
  chunkSize: number;
  /** 장면 생성 간 대기 시간(초) */
  sceneIntervalSec: number;
}
