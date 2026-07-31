/**
 * 인트로 채점.
 *
 * 강의는 인트로가 성패를 가른다고 반복하지만, 판단 기준은 "감각"으로 남긴다.
 * 그 감각의 상당 부분은 검사 가능한 규칙이다.
 *
 * 프롬프트가 선언한 인트로 규칙을 그대로 채점 항목으로 옮겼다.
 *   1. 첫 문장이 등장인물 대사인가
 *   2. 그 대사가 상식에 어긋나거나 부당한가
 *   3. 이유를 설명하지 않는가
 *   4. 마지막이 미결 상태로 닫히는가
 *   5. 길이가 적정한가
 *
 * 이 점수가 조회수를 보장하지는 않는다. 규칙 위반을 잡아내는 것이 목적이다.
 */

import { estimateRuntime, type TtsSpeed } from './revenue';

export type CheckState = 'pass' | 'fail' | 'unsure';

export interface IntroCheck {
  id: string;
  label: string;
  state: CheckState;
  /** 왜 이렇게 판정했는가 */
  reason: string;
  /** 고치는 방법 */
  fix?: string;
  /** 이 항목의 가중치 */
  weight: number;
}

export interface IntroScore {
  checks: IntroCheck[];
  /** 0~100 */
  score: number;
  /** 통과·실패·판정보류 개수 */
  passed: number;
  failed: number;
  unsure: number;
  /** 낭독 추정 길이 */
  runtimeSeconds: number;
  runtimeDisplay: string;
  charCount: number;
  /** 종합 판정 */
  verdict: string;
}

/** 이유를 설명하는 표현. 인트로에 있으면 궁금증이 죽는다 */
const EXPLAINING = [
  '왜냐하면',
  '때문이었',
  '때문입니다',
  '이유는',
  '까닭은',
  '그것은 바로',
  '사실은',
  '알고 보니',
  '결국',
  '그리하여',
];

/** 미결 상태로 닫는 표현 */
const HOOK_ENDINGS = [
  '있었습니다',
  '있었지요',
  '숨어 있',
  '아무도 모르',
  '까닭이',
  '이유가',
  '알 수 없',
  '없었습니다',
  '몰랐습니다',
  '시작되었습니다',
  '뿐이었습니다',
];

/** 부당함·이상함을 드러내는 표현 */
const ANOMALY_MARKERS = [
  // 명령·금지
  '지 마',
  '거라',
  '거라.',
  '하여라',
  '하라',
  '말아라',
  '두어라',
  '가거라',
  '내놓아라',
  '데려가',
  // 부정·거부
  '안 준',
  '주지 않',
  '못 한',
  '없다',
  '아니다',
  '싫다',
  // 극단
  '죽어',
  '굶',
  '버려',
  '쫓아',
  '팔아',
  '내쫓',
  '태워',
  '묻어',
];

/** 나레이션 종결 어미 — 대사가 아니라는 신호 */
const NARRATION_ENDINGS = ['습니다', '였습니다', '았습니다', '었습니다', '지요', '더군요'];

/** 첫 문장을 뽑는다 */
function firstSentence(text: string): string {
  const t = text.trim();
  if (!t) return '';
  const firstLine = t.split(/\r?\n/).find((l) => l.trim().length > 0) ?? '';
  const m = /^[^.!?。]*[.!?。]?/.exec(firstLine.trim());
  return (m?.[0] ?? firstLine).trim();
}

/** 대사로 보이는가 */
function isDialogue(sentence: string): boolean {
  const s = sentence.trim();
  if (!s) return false;
  // 따옴표로 감싸였다
  if (/^["'“”「『].+/.test(s)) return true;
  // "이름:" 형태
  if (/^[가-힣]{1,12}\s*[:：]/.test(s)) return true;
  // 나레이션 종결 어미로 끝나면 대사가 아니라고 본다
  const looksNarration = NARRATION_ENDINGS.some((e) => s.replace(/[.!?。]$/, '').endsWith(e));
  if (looksNarration) return false;
  // 명령형·청유형·의문형 어미는 대사일 가능성이 높다
  if (/(거라|하라|하여라|말아라|어라|아라|느냐|는가|니라|겠다|구나|軒)[.!?]?$/.test(s)) return true;
  return false;
}

/**
 * 인트로를 채점한다.
 * @param intro 확정한 인트로 전문 (대사 + 나레이션)
 */
export function scoreIntro(intro: string, speed: TtsSpeed = 'normal'): IntroScore {
  const text = intro.trim();
  const chars = text.length;
  const rt = estimateRuntime(chars, speed);
  const checks: IntroCheck[] = [];

  // 1. 첫 문장이 대사인가
  const first = firstSentence(text);
  const dialogueStart = isDialogue(first);
  checks.push({
    id: 'dialogue-start',
    label: '첫 문장이 등장인물 대사로 시작한다',
    state: text ? (dialogueStart ? 'pass' : 'fail') : 'unsure',
    reason: !text
      ? '인트로가 비어 있습니다.'
      : dialogueStart
        ? `첫 문장이 대사입니다: "${first.slice(0, 40)}"`
        : `첫 문장이 나레이션으로 보입니다: "${first.slice(0, 40)}"`,
    fix: '나레이션 대신 등장인물의 말로 시작하세요. 따옴표로 감싸거나 "이름:" 형태로 씁니다.',
    weight: 30,
  });

  // 2. 부당함·이상함이 있는가
  const anomalyHits = ANOMALY_MARKERS.filter((m) => text.includes(m));
  checks.push({
    id: 'anomaly',
    label: '상식에 어긋나거나 부당한 상황이 담겼다',
    state: anomalyHits.length > 0 ? 'pass' : 'unsure',
    reason:
      anomalyHits.length > 0
        ? `이상함을 드러내는 표현이 있습니다: ${anomalyHits.slice(0, 4).join(', ')}`
        : '부당함이나 이상함을 드러내는 표현을 찾지 못했습니다. 사람이 직접 판단하세요.',
    fix: '명령·금지·거부·극단적 처지를 드러내는 대사로 바꿔 보세요. "친정에는 저 재를 한 짐 지고 가거라"처럼.',
    weight: 20,
  });

  // 3. 이유를 설명하지 않는가
  const explainHits = EXPLAINING.filter((m) => text.includes(m));
  checks.push({
    id: 'no-explain',
    label: '이유를 설명하지 않는다',
    state: explainHits.length === 0 ? 'pass' : 'fail',
    reason:
      explainHits.length === 0
        ? '이유를 밝히는 표현이 없습니다.'
        : `이유를 설명하는 표현이 있습니다: ${explainHits.join(', ')}`,
    fix: '왜 그랬는지 밝히지 마세요. 궁금해서 계속 듣게 하는 것이 인트로의 유일한 임무입니다.',
    weight: 25,
  });

  // 4. 미결로 닫히는가
  const lastLine =
    text
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .pop() ?? '';
  const hookHit = HOOK_ENDINGS.some((h) => lastLine.includes(h));
  checks.push({
    id: 'hook-ending',
    label: '마지막이 미결 상태로 닫힌다',
    state: text ? (hookHit ? 'pass' : 'unsure') : 'unsure',
    reason: hookHit
      ? '미결을 남기는 마무리로 보입니다.'
      : `마지막 문장에서 미결 신호를 찾지 못했습니다: "${lastLine.slice(0, 40)}"`,
    fix: '"그런데 여기에는 아무도 모르는 까닭이 있었습니다" 계열로 닫으세요.',
    weight: 15,
  });

  // 5. 길이가 적정한가 (프롬프트 기준 150~250자)
  const lengthOk = chars >= 120 && chars <= 320;
  checks.push({
    id: 'length',
    label: '길이가 적정하다',
    state: chars === 0 ? 'unsure' : lengthOk ? 'pass' : 'fail',
    reason:
      chars === 0
        ? '내용이 없습니다.'
        : `${chars}자, 낭독 약 ${rt.display}. ${
            chars < 120 ? '너무 짧습니다.' : chars > 320 ? '너무 깁니다.' : '적정합니다.'
          }`,
    fix: '백오십 자에서 이백오십 자 사이로 맞추세요. 삼십 초 안쪽이 목표입니다.',
    weight: 10,
  });

  const passed = checks.filter((c) => c.state === 'pass').length;
  const failed = checks.filter((c) => c.state === 'fail').length;
  const unsure = checks.filter((c) => c.state === 'unsure').length;

  // 판정보류는 절반만 인정한다
  const earned = checks.reduce((sum, c) => {
    if (c.state === 'pass') return sum + c.weight;
    if (c.state === 'unsure') return sum + c.weight * 0.5;
    return sum;
  }, 0);
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const score = total > 0 ? Math.round((earned / total) * 100) : 0;

  let verdict: string;
  if (!text) verdict = '인트로를 붙여넣으면 채점합니다.';
  else if (failed > 0 && score < 55) verdict = '규칙 위반이 있습니다. 다시 뽑는 편이 낫습니다.';
  else if (score < 75) verdict = '고칠 여지가 있습니다. 실패 항목을 먼저 보세요.';
  else if (unsure > 1) verdict = '기계가 판정하지 못한 항목이 있습니다. 소리 내어 읽어 보고 결정하세요.';
  else verdict = '규칙은 통과했습니다. 마지막 판단은 소리 내어 읽어 보고 하세요.';

  return {
    checks,
    score,
    passed,
    failed,
    unsure,
    runtimeSeconds: rt.seconds,
    runtimeDisplay: rt.display,
    charCount: chars,
    verdict,
  };
}
