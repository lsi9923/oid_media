/**
 * 대본 TTS 적합성 검사.
 *
 * 대본 프롬프트는 한자·영문·괄호·아라비아 숫자를 금지하고 문장 길이를 45자로 제한한다.
 * 그러나 AI가 46,000자를 쓰는 동안 규칙이 새는 경우가 있고, 사람이 눈으로 다 볼 수 없다.
 * Vrew에 넣기 전에 기계적으로 걸러내는 것이 목적이다.
 *
 * 검출 대상은 실제로 TTS 출력을 망치는 것에 한정한다.
 * 취향 문제는 검사하지 않는다.
 */

export type IssueSeverity = 'error' | 'warn';

export interface ScriptIssue {
  /** 규칙 식별자 */
  rule: string;
  severity: IssueSeverity;
  /** 사람이 읽을 설명 */
  message: string;
  /** 1-based 줄 번호 */
  line: number;
  /** 해당 줄 안에서의 0-based 위치 */
  column: number;
  /** 문제가 된 텍스트 */
  text: string;
  /** 주변 문맥 (한 줄) */
  context: string;
  /** 자동 교정안. 확실한 경우만 제공한다 */
  suggestion?: string;
}

export interface ScriptReport {
  issues: ScriptIssue[];
  errorCount: number;
  warnCount: number;
  /** 전체 글자수 (공백 포함) */
  totalChars: number;
  /** 문장 수 */
  sentenceCount: number;
  /** 45자를 넘는 문장 수 */
  longSentenceCount: number;
  /** 대사로 보이는 줄의 비율. 강의 기준 40~50%가 목표 */
  dialogueRatio: number;
}

/**
 * 고유어 수사.
 * 한국어 고유어 수사는 단독형과 관형사형이 다르다.
 *   단독: 하나, 둘, 셋, 넷, 스물
 *   관형: 한 개, 두 개, 세 개, 네 개, 스무 개
 * 둘을 구분하지 않으면 "스무 또는 이십" 같은 비문이 나온다.
 */
const NATIVE_ATTRIBUTIVE: Record<number, string> = {
  1: '한',
  2: '두',
  3: '세',
  4: '네',
  5: '다섯',
  6: '여섯',
  7: '일곱',
  8: '여덟',
  9: '아홉',
  10: '열',
  20: '스무',
  30: '서른',
  40: '마흔',
  50: '쉰',
  60: '예순',
  70: '일흔',
  80: '여든',
  90: '아흔',
};

/** 단독으로 쓸 때의 형태. 관형사형과 다른 것만 적는다 */
const NATIVE_STANDALONE_OVERRIDE: Record<number, string> = {
  1: '하나',
  2: '둘',
  3: '셋',
  4: '넷',
  20: '스물',
};

/** 한자어 수사 — 냥, 년, 월, 일, 리 등에 붙는다 */
const SINO_DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const SINO_UNITS = ['', '십', '백', '천'];

/** 아라비아 숫자를 한자어 읽기로 바꾼다. 만 단위까지 처리한다. */
export function toSinoKorean(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  if (n === 0) return '영';
  if (n >= 100000000) return String(n); // 억 이상은 손대지 않는다

  const parts: string[] = [];
  const man = Math.floor(n / 10000);
  const rest = n % 10000;

  if (man > 0) {
    parts.push(man === 1 ? '만' : `${toSinoKorean(man)}만`);
  }
  if (rest > 0) {
    const digits = String(rest).split('').map(Number);
    const len = digits.length;
    let out = '';
    for (let i = 0; i < len; i += 1) {
      const d = digits[i] ?? 0;
      const unitIdx = len - 1 - i;
      if (d === 0) continue;
      // 십·백·천 앞의 1은 생략한다. 십일, 백이 아니라 십, 백
      const digitPart = d === 1 && unitIdx > 0 ? '' : SINO_DIGITS[d];
      out += `${digitPart}${SINO_UNITS[unitIdx]}`;
    }
    parts.push(out);
  }
  return parts.join('');
}

/**
 * 아라비아 숫자를 고유어 읽기로 바꾼다. 99까지만 다룬다.
 *
 * @param attributive true면 관형사형(한 개, 스무 개), false면 단독형(하나, 스물)
 */
export function toNativeKorean(n: number, attributive = true): string | undefined {
  if (!Number.isInteger(n) || n < 1 || n > 99) return undefined;

  const pick = (v: number): string | undefined =>
    attributive ? NATIVE_ATTRIBUTIVE[v] : (NATIVE_STANDALONE_OVERRIDE[v] ?? NATIVE_ATTRIBUTIVE[v]);

  const direct = pick(n);
  if (direct) return direct;

  const tens = Math.floor(n / 10) * 10;
  const ones = n % 10;
  // 십 단위 앞자리는 항상 관형/단독이 같다. 다만 20은 결합형이 '스물'이다
  const tensWord = tens === 20 ? '스물' : NATIVE_ATTRIBUTIVE[tens];
  // 결합될 때 뒷자리는 관형사형을 쓴다. 열한 개, 스물두 개
  const onesWord = attributive
    ? NATIVE_ATTRIBUTIVE[ones]
    : (NATIVE_STANDALONE_OVERRIDE[ones] ?? NATIVE_ATTRIBUTIVE[ones]);
  if (!tensWord || !onesWord) return undefined;
  return `${tensWord}${onesWord}`;
}

/**
 * 고유어 단위를 쓰는 명사.
 * 시각의 '시'는 고유어를 쓴다. 다섯 시, 열두 시.
 * '대'와 '장'도 고유어다. 차 세 대, 종이 두 장.
 */
const NATIVE_UNITS = [
  '해',
  '살',
  '명',
  '개',
  '마리',
  '벌',
  '자루',
  '켤레',
  '번',
  '가지',
  '되',
  '섬',
  '시', // 시각. 다섯 시
  '대', // 차 세 대
  '장', // 종이 두 장
  '그루',
  '사람',
  '식구',
  '달', // 세 달
];

/**
 * 한자어 단위를 쓰는 명사.
 * '분'과 '초'는 한자어다. 오 분, 십 초.
 * '척'은 배(한 척)와 길이(삼 척)에서 갈리므로 넣지 않는다.
 */
const SINO_UNITS_WORDS = ['냥', '년', '월', '일', '리', '푼', '분', '초', '전', '문', '자'];

/**
 * 숫자와 뒤따르는 단위를 보고 교정안을 만든다.
 *
 * 고유어 단위라도 100 이상이면 한자어 수사를 쓴다. 백 명, 이백 개.
 * 단위가 없으면 단독형으로 제시한다. 스물 또는 이십.
 */
function suggestNumber(numText: string, following: string): string | undefined {
  const n = Number.parseInt(numText, 10);
  if (!Number.isFinite(n)) return undefined;

  const unit = NATIVE_UNITS.find((u) => following.startsWith(u));
  if (unit) {
    // 고유어 단위에 붙을 때는 관형사형
    const native = toNativeKorean(n, true);
    if (native) return `${native} ${unit}`;
    // 100 이상은 한자어 수사를 쓴다
    return `${toSinoKorean(n)} ${unit}`;
  }

  const sinoUnit = SINO_UNITS_WORDS.find((u) => following.startsWith(u));
  if (sinoUnit) {
    return `${toSinoKorean(n)} ${sinoUnit}`;
  }

  // 단위를 못 찾았으면 단독형으로 제시한다
  const standalone = toNativeKorean(n, false);
  const sino = toSinoKorean(n);
  if (standalone && standalone !== sino) return `${standalone} 또는 ${sino}`;
  return sino;
}

/** 검사 규칙 정의 */
interface Rule {
  id: string;
  severity: IssueSeverity;
  pattern: RegExp;
  message: string;
  /** 교정안 생성 */
  suggest?: (match: string, line: string, index: number) => string | undefined;
}

const RULES: Rule[] = [
  {
    id: 'hanja',
    severity: 'error',
    pattern: /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+/g,
    message: '한자가 있습니다. TTS가 읽지 못하거나 다른 음으로 읽습니다.',
  },
  {
    id: 'latin',
    severity: 'error',
    pattern: /[A-Za-z]{2,}/g,
    message: '영문이 있습니다. TTS가 알파벳을 하나씩 읽거나 영어 발음으로 읽습니다.',
  },
  {
    id: 'emoji',
    severity: 'error',
    pattern: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}]/gu,
    message: '이모지나 기호 문자가 있습니다. TTS가 이름을 그대로 읽습니다.',
  },
  {
    id: 'bracket',
    severity: 'error',
    pattern: /[()[\]{}〔〕《》〈〉「」『』]/g,
    message: '괄호가 있습니다. 지시문이 본문에 섞였을 수 있습니다.',
  },
  {
    id: 'symbol',
    severity: 'error',
    pattern: /[~/\\*#@&%+=<>|^_]/g,
    message: '특수기호가 있습니다. TTS가 기호 이름을 읽습니다.',
  },
  {
    id: 'ellipsis',
    severity: 'warn',
    pattern: /[…]|\.{3,}/g,
    message: '말줄임표가 있습니다. 문장을 끊어 표현하는 편이 자연스럽습니다.',
  },
  {
    id: 'markdown',
    severity: 'error',
    pattern: /\*\*[^*]+\*\*|__[^_]+__/g,
    message: '마크다운 강조 표기가 있습니다.',
  },
  {
    id: 'digit',
    severity: 'warn',
    pattern: /\d+/g,
    message: '아라비아 숫자가 있습니다. 한글로 적어야 TTS 억양이 맞습니다.',
    suggest: (match, line, index) => suggestNumber(match, line.slice(index + match.length).trim()),
  },
];

/** 문장 종결 부호 */
const SENTENCE_END = /[.!?。]/;

/** 대사로 보이는 줄인지 — 따옴표로 감싸였거나 "이름:" 형태 */
function looksLikeDialogue(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^["'“”].+["'“”]\s*$/.test(t)) return true;
  if (/^[가-힣]{1,10}\s*[:：]/.test(t)) return true;
  // 인용 부호가 줄 안에 있는 경우
  if (/["“].{3,}["”]/.test(t)) return true;
  return false;
}

/**
 * 대본을 검사한다.
 * 메타 줄([점검], [팩트 갱신], --- 구분선, 표)은 낭독되지 않으므로 제외한다.
 */
export function checkScript(script: string, maxSentenceLength = 45): ScriptReport {
  const issues: ScriptIssue[] = [];
  const lines = script.split(/\r?\n/);

  let sentenceCount = 0;
  let longSentenceCount = 0;
  let dialogueLines = 0;
  let contentLines = 0;

  lines.forEach((rawLine, i) => {
    const lineNo = i + 1;
    const trimmed = rawLine.trim();

    // 낭독되지 않는 줄은 건너뛴다
    if (!trimmed) return;
    if (/^\[.*\]/.test(trimmed)) return; // [점검], [팩트 갱신]
    if (/^-{3,}/.test(trimmed)) return; // 구분선
    if (/^#{1,6}\s/.test(trimmed)) return; // 제목
    if (/^\|/.test(trimmed)) return; // 표
    if (/^={3,}/.test(trimmed)) return; // 구분선
    if (/^(챕터|Chapter)\s*\d+/.test(trimmed)) return; // 챕터 표기

    contentLines += 1;
    if (looksLikeDialogue(rawLine)) dialogueLines += 1;

    // 규칙 검사
    for (const rule of RULES) {
      rule.pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = rule.pattern.exec(rawLine)) !== null) {
        const text = m[0];
        issues.push({
          rule: rule.id,
          severity: rule.severity,
          message: rule.message,
          line: lineNo,
          column: m.index,
          text,
          context: trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed,
          ...(rule.suggest ? { suggestion: rule.suggest(text, rawLine, m.index) } : {}),
        });
        // 0 길이 매치 방어
        if (m.index === rule.pattern.lastIndex) rule.pattern.lastIndex += 1;
      }
    }

    // 문장 길이 검사
    const sentences = rawLine
      .split(new RegExp(`(?<=${SENTENCE_END.source})\\s*`))
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const s of sentences) {
      sentenceCount += 1;
      if (s.length > maxSentenceLength) {
        longSentenceCount += 1;
        issues.push({
          rule: 'longSentence',
          severity: 'warn',
          message: `문장이 ${s.length}자입니다. ${maxSentenceLength}자 이내로 끊으면 TTS가 자연스럽습니다.`,
          line: lineNo,
          column: rawLine.indexOf(s),
          text: s.length > 60 ? `${s.slice(0, 57)}...` : s,
          context: trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed,
        });
      }
    }
  });

  return {
    issues,
    errorCount: issues.filter((x) => x.severity === 'error').length,
    warnCount: issues.filter((x) => x.severity === 'warn').length,
    totalChars: script.length,
    sentenceCount,
    longSentenceCount,
    dialogueRatio: contentLines > 0 ? dialogueLines / contentLines : 0,
  };
}

/**
 * 자동 교정. 확실한 것만 바꾼다.
 * 숫자→한글, 말줄임표 정리, 마크다운 강조 제거만 처리한다.
 * 한자·영문은 문맥을 알아야 하므로 손대지 않는다.
 */
export function autoFixScript(script: string): { fixed: string; changed: number } {
  let changed = 0;

  let out = script.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_m, a, b) => {
    changed += 1;
    return a ?? b ?? '';
  });

  out = out.replace(/…|\.{3,}/g, () => {
    changed += 1;
    return '.';
  });

  // 숫자는 뒤따르는 단위를 보고 바꾼다. 애매하면 남긴다.
  out = out.replace(/(\d+)\s*([가-힣]*)/g, (match, num: string, tail: string) => {
    const n = Number.parseInt(num, 10);
    if (!Number.isFinite(n)) return match;

    const nativeUnit = NATIVE_UNITS.find((u) => tail.startsWith(u));
    if (nativeUnit) {
      // 고유어 단위에는 관형사형. 100 이상이면 한자어 수사
      const native = toNativeKorean(n, true);
      changed += 1;
      return `${native ?? toSinoKorean(n)} ${tail}`;
    }

    const sinoUnit = SINO_UNITS_WORDS.find((u) => tail.startsWith(u));
    if (sinoUnit) {
      changed += 1;
      return `${toSinoKorean(n)} ${tail}`;
    }

    return match;
  });

  return { fixed: out, changed };
}
