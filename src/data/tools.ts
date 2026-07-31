import type { Tool, ToolId } from '../types';

/** 원본 강의 */
export const SOURCE = {
  videoId: 'IFxreFxzvKQ',
  title: '100% 수익창출 성공한 유튜브 강의, 유료강의 듣지마세요. (26년 7월 최신판)',
  channel: '돈버니',
  speaker: '행크',
  url: 'https://www.youtube.com/watch?v=IFxreFxzvKQ',
} as const;

/** 타임스탬프(mm:ss)를 영상 링크로 변환 */
export function timestampUrl(timestamp: string): string {
  const parts = timestamp.split(':').map((n) => Number.parseInt(n, 10));
  let seconds = 0;
  for (const part of parts) {
    seconds = seconds * 60 + (Number.isFinite(part) ? part : 0);
  }
  return `${SOURCE.url}&t=${seconds}s`;
}

export const TOOLS: Record<ToolId, Tool> = {
  claude: {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai',
    monthlyCostKrw: 30000,
    plan: 'Pro $20/월',
    role: '기준 AI — 대본·이미지 프롬프트·인트로·썸네일 카피를 모두 여기서 생성',
    note: '모델은 Sonnet 사용. Opus는 더 똑똑하지만 비싸서 긴 대본을 끝까지 못 만든다.',
  },
  flow: {
    id: 'flow',
    name: 'Google Flow',
    url: 'https://labs.google/flow',
    monthlyCostKrw: 0,
    plan: '무료',
    role: '본문 이미지 40장 + 썸네일 이미지 생성',
    note: 'Nano Banana 2 모델 선택. 무료지만 하루 생성 장수 제한이 있다(강의 시점 약 100장).',
  },
  grok: {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com',
    monthlyCostKrw: 30000,
    plan: '약 3만원/월',
    role: '인트로 영상 4컷 생성 (이미지 → 6초 비디오)',
    note: '한국어 대사와 립싱크 품질이 가장 좋고 저렴해서 선택. 예전엔 무료였다.',
  },
  vrew: {
    id: 'vrew',
    name: 'Vrew (브루)',
    url: 'https://vrew.ai',
    monthlyCostKrw: 29000,
    plan: 'Standard 29,000원/월',
    role: 'TTS 음성 생성 + 이미지·인트로 조합 + 최종 영상 내보내기',
    note: '텍스트 입력은 클립당 1만자 제한. 여러 번 나눠 클립을 추가한다.',
  },
  miricanvas: {
    id: 'miricanvas',
    name: '미리캔버스',
    url: 'https://www.miricanvas.com',
    monthlyCostKrw: 0,
    plan: '무료',
    role: '썸네일 이미지에 카피(글자) 입히기',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube Studio',
    url: 'https://studio.youtube.com',
    monthlyCostKrw: 0,
    plan: '무료',
    role: '업로드 · AI 제작 표시 · 수익 확인',
  },
};

/** 도구 월 비용 합계 */
export function totalMonthlyCost(): number {
  return Object.values(TOOLS).reduce((sum, t) => sum + t.monthlyCostKrw, 0);
}
