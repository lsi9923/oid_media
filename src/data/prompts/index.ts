import { SCRIPT_MAIN } from './scriptMain';
import { MOTIF_BANK } from './motifBank';
import { NAME_RULES } from './nameRules';
import { STORY_PACT } from './storyPact';
import { IMAGE_MAIN } from './imageMain';
import { INTRO_MAIN } from './introMain';
import { THUMBNAIL_MAIN } from './thumbnailMain';
import { VREW_AGENT, VREW_NOTES } from './vrewAgent';

/** 프롬프트가 어디에 들어가는지 */
export type PromptTarget =
  | 'claude-instructions' // Claude 프로젝트 지침 칸
  | 'claude-file' // Claude 프로젝트 파일 영역에 업로드
  | 'vrew-agent' // Vrew 에이전트 입력
  | 'reference'; // 참고용 문서

export interface PromptAsset {
  id: string;
  /** 파일로 내려받을 때 쓸 이름 */
  fileName: string;
  title: string;
  /** 어느 Claude 프로젝트용인가 */
  project: '민담 대본' | '민담 이미지' | '민담 인트로' | '민담 썸네일' | 'Vrew';
  target: PromptTarget;
  /** 무엇을 하는 프롬프트인지 */
  role: string;
  /** 설치 위치 안내 */
  install: string;
  body: string;
}

export const PROMPT_ASSETS: PromptAsset[] = [
  {
    id: 'script-main',
    fileName: '01_민담대본_MAIN.txt',
    title: '민담 대본 MAIN',
    project: '민담 대본',
    target: 'claude-instructions',
    role: '주제 추천부터 46,000자 대본과 썸네일 브리프까지, 8개 관문을 순서대로 진행한다.',
    install: 'Claude 프로젝트 "민담 대본" → 지침(Instructions) 칸에 전체 붙여넣기',
    body: SCRIPT_MAIN,
  },
  {
    id: 'motif-bank',
    fileName: '02_모티프뱅크.txt',
    title: '모티프 뱅크',
    project: '민담 대본',
    target: 'claude-file',
    role: '한국 구전 민담의 서사 모티프 42개. 주제를 만들 때 조합 재료로 쓴다.',
    install: 'Claude 프로젝트 "민담 대본" → 파일 영역에 업로드 (지침 아님)',
    body: MOTIF_BANK,
  },
  {
    id: 'name-rules',
    fileName: '03_이름규칙.txt',
    title: '이름 규칙 (NamePicker)',
    project: '민담 대본',
    target: 'claude-file',
    role: 'TTS가 오독하는 이름을 걸러낸다. 발음 위험 6종 + 금지 목록 + 권장 이름 200개.',
    install: 'Claude 프로젝트 "민담 대본" → 파일 영역에 업로드',
    body: NAME_RULES,
  },
  {
    id: 'story-pact',
    fileName: '04_스토리팩트틀.txt',
    title: '스토리 팩트 틀',
    project: '민담 대본',
    target: 'claude-file',
    role: '46,000자를 9챕터로 쓸 때 인물·시간·설정이 어긋나지 않게 하는 대조표.',
    install: 'Claude 프로젝트 "민담 대본" → 파일 영역에 업로드',
    body: STORY_PACT,
  },
  {
    id: 'image-main',
    fileName: '05_민담이미지_MAIN.txt',
    title: '민담 이미지 MAIN',
    project: '민담 이미지',
    target: 'claude-instructions',
    role: '화풍 추출 → 인물 5명 고정 → 40장면 프롬프트(H8/M16/L16). Flow용 영어 출력.',
    install: 'Claude 프로젝트 "민담 이미지" → 지침 칸에 붙여넣기. 파일 업로드 없음',
    body: IMAGE_MAIN,
  },
  {
    id: 'intro-main',
    fileName: '06_민담인트로_MAIN.txt',
    title: '민담 인트로 MAIN',
    project: '민담 인트로',
    target: 'claude-instructions',
    role: 'Grok용 Scene 1~4 설계. 대사 · 감정 지시 · 이미지 프롬프트 · 영상 변환 지시.',
    install: 'Claude 프로젝트 "민담 인트로" → 지침 칸에 붙여넣기. 파일 업로드 없음',
    body: INTRO_MAIN,
  },
  {
    id: 'thumbnail-main',
    fileName: '07_민담썸네일_MAIN.txt',
    title: '민담 썸네일 MAIN',
    project: '민담 썸네일',
    target: 'claude-instructions',
    role: '카피 후보 8개 → 선택 → 배경 이미지 프롬프트 → 미리캔버스 수치 지시.',
    install: 'Claude 프로젝트 "민담 썸네일" → 지침 칸에 붙여넣기. 파일 업로드 없음',
    body: THUMBNAIL_MAIN,
  },
  {
    id: 'vrew-agent',
    fileName: '08_Vrew에이전트_명령어.txt',
    title: 'Vrew 에이전트 배치 명령어',
    project: 'Vrew',
    target: 'vrew-agent',
    role: '이미지 40장을 대본 위치에 자동 배치하고 화면 효과를 넣는다.',
    install: 'Vrew 에이전트 입력창에 붙여넣기. 함께 40장면 목록과 이미지 40장을 첨부',
    body: VREW_AGENT,
  },
  {
    id: 'vrew-notes',
    fileName: '09_Vrew_주의점.txt',
    title: 'Vrew 작업 주의점',
    project: 'Vrew',
    target: 'reference',
    role: 'TTS 분할, 인트로 음성 중복, 자주 나는 문제와 해결법.',
    install: '참고 문서. 작업 중 옆에 두고 본다',
    body: VREW_NOTES,
  },
];

export function findPromptAsset(id: string): PromptAsset | undefined {
  return PROMPT_ASSETS.find((p) => p.id === id);
}

/** 프로젝트별 묶기 */
export function assetsByProject(project: PromptAsset['project']): PromptAsset[] {
  return PROMPT_ASSETS.filter((p) => p.project === project);
}

export {
  SCRIPT_MAIN,
  MOTIF_BANK,
  NAME_RULES,
  STORY_PACT,
  IMAGE_MAIN,
  INTRO_MAIN,
  THUMBNAIL_MAIN,
  VREW_AGENT,
  VREW_NOTES,
};
