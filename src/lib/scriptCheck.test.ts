import { describe, expect, it } from 'vitest';
import { autoFixScript, checkScript, toNativeKorean, toSinoKorean } from './scriptCheck';

describe('toSinoKorean — 한자어 수사', () => {
  it('한 자리', () => {
    expect(toSinoKorean(1)).toBe('일');
    expect(toSinoKorean(9)).toBe('구');
  });

  it('십 단위에서 1을 생략한다', () => {
    expect(toSinoKorean(10)).toBe('십');
    expect(toSinoKorean(11)).toBe('십일');
    expect(toSinoKorean(20)).toBe('이십');
    expect(toSinoKorean(35)).toBe('삼십오');
  });

  it('백·천 단위', () => {
    expect(toSinoKorean(100)).toBe('백');
    expect(toSinoKorean(105)).toBe('백오');
    expect(toSinoKorean(340)).toBe('삼백사십');
    expect(toSinoKorean(1000)).toBe('천');
    expect(toSinoKorean(1234)).toBe('천이백삼십사');
  });

  it('만 단위', () => {
    expect(toSinoKorean(10000)).toBe('만');
    expect(toSinoKorean(46000)).toBe('사만육천');
    expect(toSinoKorean(20000)).toBe('이만');
  });

  it('0과 억 이상은 예외 처리', () => {
    expect(toSinoKorean(0)).toBe('영');
    expect(toSinoKorean(100000000)).toBe('100000000');
  });
});

describe('toNativeKorean — 고유어 수사', () => {
  it('관형사형이 기본이다', () => {
    expect(toNativeKorean(1)).toBe('한');
    expect(toNativeKorean(3)).toBe('세');
    expect(toNativeKorean(5)).toBe('다섯');
  });

  it('열 단위', () => {
    expect(toNativeKorean(10)).toBe('열');
    expect(toNativeKorean(11)).toBe('열한');
    expect(toNativeKorean(12)).toBe('열두');
  });

  it('스무와 스물을 구분한다', () => {
    expect(toNativeKorean(20)).toBe('스무');
    expect(toNativeKorean(21)).toBe('스물한');
    expect(toNativeKorean(23)).toBe('스물세');
  });

  it('서른 이상', () => {
    expect(toNativeKorean(30)).toBe('서른');
    expect(toNativeKorean(35)).toBe('서른다섯');
    expect(toNativeKorean(99)).toBe('아흔아홉');
  });

  it('범위를 벗어나면 undefined', () => {
    expect(toNativeKorean(0)).toBeUndefined();
    expect(toNativeKorean(100)).toBeUndefined();
    expect(toNativeKorean(1.5)).toBeUndefined();
  });

  // ── 감사에서 발견된 결함 회귀 테스트 ──
  it('단독형을 요청하면 하나·둘·셋·넷·스물을 준다', () => {
    expect(toNativeKorean(1, false)).toBe('하나');
    expect(toNativeKorean(2, false)).toBe('둘');
    expect(toNativeKorean(3, false)).toBe('셋');
    expect(toNativeKorean(4, false)).toBe('넷');
    expect(toNativeKorean(20, false)).toBe('스물');
  });

  it('단독형과 관형사형이 같은 수는 그대로다', () => {
    expect(toNativeKorean(5, false)).toBe('다섯');
    expect(toNativeKorean(30, false)).toBe('서른');
  });

  it('결합형 십의 자리는 스물을 쓴다', () => {
    // 스무하나가 아니라 스물하나
    expect(toNativeKorean(21, false)).toBe('스물하나');
    expect(toNativeKorean(22, false)).toBe('스물둘');
  });
});

describe('checkScript — TTS 금지 표기 검출', () => {
  it('깨끗한 대본은 오류가 없다', () => {
    const s = '깊은 산속 바위틈에 버려진 여인이 있었습니다.\n해주는 말없이 고개를 숙였습니다.';
    const r = checkScript(s);
    expect(r.errorCount).toBe(0);
  });

  it('한자를 잡는다', () => {
    const r = checkScript('그는 孝를 다했습니다.');
    const hanja = r.issues.filter((i) => i.rule === 'hanja');
    expect(hanja).toHaveLength(1);
    expect(hanja[0]?.text).toBe('孝');
    expect(hanja[0]?.severity).toBe('error');
  });

  it('영문을 잡는다', () => {
    const r = checkScript('그것은 OK라고 했습니다.');
    expect(r.issues.some((i) => i.rule === 'latin' && i.text === 'OK')).toBe(true);
  });

  it('영문 한 글자는 잡지 않는다', () => {
    // 이니셜 등 불가피한 경우를 과잉 검출하지 않는다
    const r = checkScript('가나다 A 라마바');
    expect(r.issues.filter((i) => i.rule === 'latin')).toHaveLength(0);
  });

  it('괄호를 잡는다', () => {
    const r = checkScript('해주가 말했습니다. (놀란 표정으로)');
    expect(r.issues.filter((i) => i.rule === 'bracket').length).toBeGreaterThanOrEqual(2);
  });

  it('특수기호를 잡는다', () => {
    const r = checkScript('그는 물었습니다 ~ 왜냐고');
    expect(r.issues.some((i) => i.rule === 'symbol')).toBe(true);
  });

  it('마크다운 강조를 잡는다', () => {
    const r = checkScript('그것은 **정말로** 그랬습니다.');
    expect(r.issues.some((i) => i.rule === 'markdown')).toBe(true);
  });

  it('말줄임표는 경고로 잡는다', () => {
    const r = checkScript('그러나… 아무도 몰랐습니다.');
    const e = r.issues.find((i) => i.rule === 'ellipsis');
    expect(e?.severity).toBe('warn');
  });

  it('숫자를 잡고 교정안을 준다', () => {
    const r = checkScript('세월이 3년 흘렀습니다.');
    const d = r.issues.find((i) => i.rule === 'digit');
    expect(d).toBeDefined();
    expect(d?.severity).toBe('warn');
    // 년은 한자어 단위이므로 "삼 년"이 맞다. 고유어로 읽으려면 "세 해"로 단위를 바꿔야 한다.
    expect(d?.suggestion).toBe('삼 년');
  });

  it('단위에 따라 고유어와 한자어를 구분해 제안한다', () => {
    const native = checkScript('세 해가 아니라 3해가 지났다').issues.find((i) => i.rule === 'digit');
    expect(native?.suggestion).toBe('세 해');

    const sino = checkScript('쌀값이 100냥이었다').issues.find((i) => i.rule === 'digit');
    expect(sino?.suggestion).toBe('백 냥');
  });

  it('단위가 없으면 두 읽기를 모두 제시한다', () => {
    const r = checkScript('그것은 3이었다');
    const d = r.issues.find((i) => i.rule === 'digit');
    expect(d?.suggestion).toContain('또는');
  });

  it('줄 번호와 위치를 정확히 보고한다', () => {
    const s = '첫 줄입니다.\n둘째 줄에 孝가 있습니다.';
    const r = checkScript(s);
    const h = r.issues.find((i) => i.rule === 'hanja');
    expect(h?.line).toBe(2);
    expect(h?.column).toBe(s.split('\n')[1]?.indexOf('孝'));
  });

  it('한 줄에 여러 위반을 모두 잡는다', () => {
    const r = checkScript('그는 孝를 3년 지켰다 (진심으로)');
    const rules = new Set(r.issues.map((i) => i.rule));
    expect(rules.has('hanja')).toBe(true);
    expect(rules.has('digit')).toBe(true);
    expect(rules.has('bracket')).toBe(true);
  });
});

describe('checkScript — 메타 줄 제외', () => {
  it('점검 블록은 검사하지 않는다', () => {
    const s = '[점검] 챕터 4. 골격 4단계. 은비녀는 chapter 3에서 나왔다.\n본문입니다.';
    const r = checkScript(s);
    expect(r.errorCount).toBe(0);
  });

  it('구분선과 표는 검사하지 않는다', () => {
    const s = '--- 챕터 1 끝 ---\n| 이름 | 나이 |\n=== 끝 ===\n본문입니다.';
    const r = checkScript(s);
    expect(r.errorCount).toBe(0);
  });

  it('제목 줄은 검사하지 않는다', () => {
    const r = checkScript('## Chapter 1\n본문입니다.');
    expect(r.errorCount).toBe(0);
  });

  it('챕터 표기 줄은 검사하지 않는다', () => {
    const r = checkScript('챕터 3\n본문입니다.');
    expect(r.issues.filter((i) => i.rule === 'digit')).toHaveLength(0);
  });
});

describe('checkScript — 문장 길이', () => {
  it('45자 초과 문장을 경고한다', () => {
    const long = `${'가'.repeat(50)}.`;
    const r = checkScript(long);
    const l = r.issues.find((i) => i.rule === 'longSentence');
    expect(l).toBeDefined();
    expect(l?.severity).toBe('warn');
    expect(r.longSentenceCount).toBe(1);
  });

  it('45자 이하는 통과한다', () => {
    const r = checkScript(`${'가'.repeat(40)}.`);
    expect(r.longSentenceCount).toBe(0);
  });

  it('기준을 조정할 수 있다', () => {
    const s = `${'가'.repeat(30)}.`;
    expect(checkScript(s, 45).longSentenceCount).toBe(0);
    expect(checkScript(s, 20).longSentenceCount).toBe(1);
  });

  it('문장 수를 센다', () => {
    const r = checkScript('첫째입니다. 둘째입니다. 셋째입니다.');
    expect(r.sentenceCount).toBe(3);
  });
});

describe('checkScript — 대사 비율', () => {
  it('따옴표 대사를 인식한다', () => {
    const s = '"이것만은 열지 마세요."\n노부인이 말했습니다.';
    const r = checkScript(s);
    expect(r.dialogueRatio).toBeCloseTo(0.5, 1);
  });

  it('이름 콜론 형태를 인식한다', () => {
    const s = '해주: 어머니, 그것은 아닙니다.\n나레이션 문장입니다.';
    const r = checkScript(s);
    expect(r.dialogueRatio).toBeCloseTo(0.5, 1);
  });

  it('대사가 없으면 0이다', () => {
    const r = checkScript('나레이션만 있습니다. 대사가 없습니다.');
    expect(r.dialogueRatio).toBe(0);
  });

  it('빈 대본은 0으로 나누지 않는다', () => {
    const r = checkScript('');
    expect(r.dialogueRatio).toBe(0);
    expect(Number.isNaN(r.dialogueRatio)).toBe(false);
  });
});

describe('autoFixScript — 자동 교정', () => {
  it('마크다운 강조를 제거한다', () => {
    const { fixed, changed } = autoFixScript('그것은 **정말** 그랬다');
    expect(fixed).toBe('그것은 정말 그랬다');
    expect(changed).toBe(1);
  });

  it('말줄임표를 마침표로 바꾼다', () => {
    const { fixed } = autoFixScript('그러나… 몰랐다');
    expect(fixed).toBe('그러나. 몰랐다');
  });

  it('고유어 단위 숫자를 바꾼다', () => {
    const { fixed } = autoFixScript('3해가 지났다');
    expect(fixed).toBe('세 해가 지났다');
  });

  it('한자어 단위 숫자를 바꾼다', () => {
    const { fixed } = autoFixScript('100냥을 주었다');
    expect(fixed).toBe('백 냥을 주었다');
  });

  it('단위가 애매한 숫자는 손대지 않는다', () => {
    const src = '그것은 3이었다';
    const { fixed, changed } = autoFixScript(src);
    expect(fixed).toBe(src);
    expect(changed).toBe(0);
  });

  it('한자와 영문은 손대지 않는다', () => {
    const src = '그는 孝와 OK를 말했다';
    const { fixed } = autoFixScript(src);
    expect(fixed).toBe(src);
  });

  it('교정 후 해당 경고가 사라진다', () => {
    const src = '3해 동안 **정말** 그랬다…';
    const before = checkScript(src);
    const { fixed } = autoFixScript(src);
    const after = checkScript(fixed);
    expect(after.issues.length).toBeLessThan(before.issues.length);
    expect(after.issues.filter((i) => i.rule === 'markdown')).toHaveLength(0);
    expect(after.issues.filter((i) => i.rule === 'ellipsis')).toHaveLength(0);
  });

  it('교정이 멱등이다 — 두 번 돌려도 같다', () => {
    const src = '3해 동안 **정말** 그랬다…';
    const once = autoFixScript(src).fixed;
    const twice = autoFixScript(once).fixed;
    expect(twice).toBe(once);
  });
});

describe('감사 회귀 — 단위별 수사 선택', () => {
  // 결함 1: '시'를 한자어로 분류해 "오 시"라는 틀린 교정을 냈다
  it('시각의 시는 고유어를 쓴다', () => {
    expect(autoFixScript('5시에 만나기로 했다').fixed).toBe('다섯 시에 만나기로 했다');
    expect(autoFixScript('10시에 출발했다').fixed).toBe('열 시에 출발했다');
    expect(autoFixScript('12시에 점심을 먹었다').fixed).toBe('열두 시에 점심을 먹었다');
  });

  it('분과 초는 한자어를 쓴다', () => {
    expect(autoFixScript('5분만 기다려라').fixed).toBe('오 분만 기다려라');
    expect(autoFixScript('30초를 세었다').fixed).toBe('삼십 초를 세었다');
  });

  it('대와 장은 고유어를 쓴다', () => {
    expect(autoFixScript('수레 3대가 지나갔다').fixed).toBe('수레 세 대가 지나갔다');
    expect(autoFixScript('종이 2장을 건넸다').fixed).toBe('종이 두 장을 건넸다');
  });

  it('달은 고유어를 쓴다', () => {
    expect(autoFixScript('3달이 지났다').fixed).toBe('세 달이 지났다');
  });

  it('년은 한자어를 쓴다', () => {
    expect(autoFixScript('3년이 지났다').fixed).toBe('삼 년이 지났다');
  });

  // 결함 2: 단위 없는 문맥에서 관형사형 '스무'를 단독으로 제시했다
  it('단위 없는 숫자는 단독형으로 제시한다', () => {
    const r = checkScript('스물이 아니라 20을 넘겼다');
    const d = r.issues.find((i) => i.rule === 'digit');
    expect(d?.suggestion).toBe('스물 또는 이십');
    expect(d?.suggestion).not.toContain('스무');
  });

  it('단독형 제안에 한·두·세·네가 나오지 않는다', () => {
    for (const [n, expected] of [
      [1, '하나'],
      [2, '둘'],
      [3, '셋'],
      [4, '넷'],
    ] as const) {
      const r = checkScript(`그것은 ${n}을 넘었다`);
      const d = r.issues.find((i) => i.rule === 'digit');
      expect(d?.suggestion, `${n}의 제안`).toContain(expected);
    }
  });

  // 결함 3: 고유어 단위 + 100 이상에서 제안이 없었다
  it('고유어 단위에 100 이상이면 한자어 수사를 쓴다', () => {
    const r = checkScript('100명이 모였다');
    const d = r.issues.find((i) => i.rule === 'digit');
    expect(d?.suggestion).toBe('백 명');
  });

  it('200개도 제안이 나온다', () => {
    const r = checkScript('쌀 200개를 세었다');
    const d = r.issues.find((i) => i.rule === 'digit');
    expect(d?.suggestion).toBe('이백 개');
    expect(d?.suggestion).not.toContain('undefined');
  });

  it('교정안에 undefined가 절대 들어가지 않는다', () => {
    const samples = [
      '1명', '10명', '99명', '100명', '999명', '1000명',
      '1개', '150개', '3해', '500해',
      '5시', '12시', '3년', '100냥', '20을', '7이',
    ];
    for (const s of samples) {
      const r = checkScript(`문장에 ${s} 있다`);
      for (const i of r.issues) {
        if (i.suggestion !== undefined) {
          expect(i.suggestion, `입력 "${s}"`).not.toContain('undefined');
          expect(i.suggestion.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('자동 교정이 원본보다 나쁜 결과를 만들지 않는다', () => {
    // 교정 후에도 숫자 경고가 늘어나면 안 된다
    const src = '5시에 3명이 모여 100냥을 나누고 2장의 종이를 썼다';
    const before = checkScript(src).issues.filter((i) => i.rule === 'digit').length;
    const { fixed } = autoFixScript(src);
    const after = checkScript(fixed).issues.filter((i) => i.rule === 'digit').length;
    expect(after).toBeLessThan(before);
    // 결과가 올바른 한국어인지 확인
    expect(fixed).toContain('다섯 시');
    expect(fixed).toContain('세 명');
    expect(fixed).toContain('백 냥');
    expect(fixed).toContain('두 장');
  });
});

describe('감사 회귀 — 정상 한국어 오검출 방지', () => {
  it('한글 수사는 잡지 않는다', () => {
    const s = '세 해가 지나고 백 냥을 모았습니다. 다섯 시에 열두 명이 모였습니다.';
    const r = checkScript(s);
    expect(r.errorCount).toBe(0);
    expect(r.issues.filter((i) => i.rule === 'digit')).toHaveLength(0);
  });

  it('한국어 따옴표 대사를 오검출하지 않는다', () => {
    const s = '"이것만은 열지 마세요." 해주가 말했습니다.\n"어찌 그런 말을 하느냐." 큰마님이 되물었습니다.';
    const r = checkScript(s);
    expect(r.errorCount).toBe(0);
  });

  it('정상 문장부호를 오검출하지 않는다', () => {
    const s = '그것이 사실입니까. 아니, 그럴 수가 없다. 정말 그랬단 말인가.';
    const r = checkScript(s);
    expect(r.errorCount).toBe(0);
  });

  it('실제 민담 문단에 오류가 없다', () => {
    const s = [
      '시집온 지 석 달, 밥상마다 그릇 밑에 돌멩이가 하나씩 들어 있었습니다.',
      '"어머니, 이것이 무슨 뜻입니까."',
      '해주가 물었으나 큰마님은 대답하지 않았습니다.',
      '그 무렵 임씨 집 담 너머에는 밤마다 누군가의 눈길이 어른거렸고,',
      '대문을 나서는 짐이란 짐은 모조리 헤집어지고 있었습니다.',
      '노부인이 하필 그 재더미를 골라 며느리 등에 지운 데에는',
      '아무도 모르는 까닭이 숨어 있었지요.',
    ].join('\n');
    const r = checkScript(s);
    expect(r.errorCount, JSON.stringify(r.issues.map((i) => i.text))).toBe(0);
  });
});
describe('checkScript — 실전 규모', () => {
  it('46,000자 대본을 처리한다', () => {
    const line = '해주는 말없이 고개를 숙였습니다. 노부인은 아무 말도 하지 않았습니다.\n';
    // 한 줄 약 40자. 46,000자를 넘기려면 1,200줄 정도가 필요하다.
    const script = line.repeat(1200);
    const r = checkScript(script);
    expect(r.totalChars).toBeGreaterThan(46000);
    expect(r.errorCount).toBe(0);
    expect(r.sentenceCount).toBeGreaterThan(2000);
  });

  it('위반이 많은 대본에서도 무한 루프에 빠지지 않는다', () => {
    const script = '孝孝孝 OK 3년 (주석) ~~~ **강조**\n'.repeat(200);
    const r = checkScript(script);
    expect(r.errorCount).toBeGreaterThan(0);
    expect(r.issues.length).toBeLessThan(100000);
  });
});
